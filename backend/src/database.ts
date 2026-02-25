import { Database } from 'node-sqlite3-wasm';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(process.env.LOCALAPPDATA || process.env.TEMP || '.', 'amfac-data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'amfac.db');

let db: Database;

export function getDb(): Database {
  if (!db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const lockDir = DB_PATH + '.lock';
    if (fs.existsSync(lockDir)) fs.rmSync(lockDir, { recursive: true, force: true });
    db = new Database(DB_PATH);
    db.exec("PRAGMA foreign_keys = ON");
  }
  return db;
}

function columnExists(db: Database, table: string, column: string): boolean {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all([]) as any[];
    return cols.some((c: any) => c.name === column);
  } catch {
    return false;
  }
}

function tableExists(db: Database, table: string): boolean {
  const row = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
  ).get([table]) as any;
  return !!row;
}

export function initDatabase(): void {
  const db = getDb();

  // Tabela de associações (multi-tenant)
  db.exec(`
    CREATE TABLE IF NOT EXISTS associacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cnpj TEXT,
      email TEXT UNIQUE NOT NULL,
      telefone TEXT,
      cidade TEXT,
      estado TEXT,
      endereco TEXT,
      presidente TEXT,
      logo TEXT,
      limite_socios INTEGER DEFAULT 1000,
      status TEXT DEFAULT 'ativo',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Tabela de usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      associacao_id INTEGER NOT NULL DEFAULT 0,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'secretario',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(associacao_id, username),
      FOREIGN KEY (associacao_id) REFERENCES associacoes(id) ON DELETE CASCADE
    );
  `);

  // Tabela de associados (sócios)
  db.exec(`
    CREATE TABLE IF NOT EXISTS associados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      associacao_id INTEGER NOT NULL,
      numero TEXT NOT NULL,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL,
      rg TEXT,
      data_nascimento TEXT,
      nome_mae TEXT,
      nome_pai TEXT,
      cep TEXT,
      logradouro TEXT,
      numero_end TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      telefone TEXT,
      whatsapp TEXT,
      estado_civil TEXT,
      profissao TEXT,
      nis TEXT,
      data_entrada TEXT,
      situacao TEXT DEFAULT 'Ativo',
      foto TEXT,
      observacoes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(associacao_id, numero),
      UNIQUE(associacao_id, cpf),
      FOREIGN KEY (associacao_id) REFERENCES associacoes(id) ON DELETE CASCADE
    );
  `);

  // Tabela de mensalidades
  db.exec(`
    CREATE TABLE IF NOT EXISTS mensalidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      associacao_id INTEGER NOT NULL,
      associado_id INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      valor REAL NOT NULL,
      data_pagamento TEXT,
      status TEXT DEFAULT 'Pendente',
      recibo_numero TEXT,
      observacao TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (associado_id) REFERENCES associados(id) ON DELETE CASCADE,
      FOREIGN KEY (associacao_id) REFERENCES associacoes(id) ON DELETE CASCADE,
      UNIQUE(associado_id, mes, ano)
    );
  `);

  // Tabela de configurações
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      associacao_id INTEGER NOT NULL,
      chave TEXT NOT NULL,
      valor TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(associacao_id, chave),
      FOREIGN KEY (associacao_id) REFERENCES associacoes(id) ON DELETE CASCADE
    );
  `);

  // Tabela de backups
  db.exec(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      associacao_id INTEGER,
      arquivo TEXT NOT NULL,
      tamanho INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Tabela de denúncias
  db.exec(`
    CREATE TABLE IF NOT EXISTS denuncias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      associacao_id INTEGER NOT NULL,
      associado_id INTEGER,
      tipo TEXT DEFAULT 'geral',
      categoria TEXT,
      descricao TEXT NOT NULL,
      nome_denunciante TEXT,
      contato TEXT,
      anonima INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pendente',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (associacao_id) REFERENCES associacoes(id) ON DELETE CASCADE
    );
  `);

  // Tabela de avaliações
  db.exec(`
    CREATE TABLE IF NOT EXISTS avaliacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      associacao_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      nota INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5),
      comentario TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (associacao_id) REFERENCES associacoes(id) ON DELETE CASCADE,
      UNIQUE(associacao_id, user_id)
    );
  `);
  const migracaoNecessaria =
    tableExists(db, 'users') &&
    !columnExists(db, 'users', 'associacao_id');

  if (migracaoNecessaria) {
    console.log('Migrando banco de dados para multi-tenant...');
  }

  // Migração: adicionar coluna logo na tabela associacoes se não existir
  if (tableExists(db, 'associacoes') && !columnExists(db, 'associacoes', 'logo')) {
    db.exec("ALTER TABLE associacoes ADD COLUMN logo TEXT");
    console.log('Coluna logo adicionada à tabela associacoes.');
  }

  console.log('Banco de dados inicializado com sucesso.');
}

export function criarAssociacaoComAdmin(dados: {
  nome: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  nomeAdmin: string;
  username: string;
  senha: string;
}): { associacao_id: number; user_id: number } {
  const db = getDb();

  const hash = bcrypt.hashSync(dados.senha, 10);

  const insertAssoc = db.prepare(`
    INSERT INTO associacoes (nome, cnpj, email, telefone, cidade, estado, limite_socios)
    VALUES (?, ?, ?, ?, ?, ?, 1000)
  `);
  const resultAssoc = insertAssoc.run([
    dados.nome, dados.cnpj || '', dados.email,
    dados.telefone || '', dados.cidade || '', dados.estado || ''
  ]) as any;
  const associacao_id = resultAssoc.lastInsertRowid;

  const insertUser = db.prepare(`
    INSERT INTO users (associacao_id, username, password_hash, nome, role)
    VALUES (?, ?, ?, ?, 'admin')
  `);
  const resultUser = insertUser.run([associacao_id, dados.username, hash, dados.nomeAdmin]) as any;

  // Configurações padrão
  const configs = [
    ['valor_mensalidade', '30.00'],
    ['presidente', ''],
    ['endereco_associacao', ''],
    ['telefone_associacao', dados.telefone || ''],
    ['email_associacao', dados.email]
  ];
  db.exec('BEGIN');
  for (const [chave, valor] of configs) {
    db.prepare('INSERT INTO configuracoes (associacao_id, chave, valor) VALUES (?, ?, ?)').run([associacao_id, chave, valor]);
  }
  db.exec('COMMIT');

  return { associacao_id: Number(associacao_id), user_id: Number(resultUser.lastInsertRowid) };
}

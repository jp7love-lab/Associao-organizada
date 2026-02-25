import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/fotos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `foto_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function gerarNumeroAssociado(associacao_id: number): string {
  const db = getDb();
  const ultimo = db.prepare(
    'SELECT numero FROM associados WHERE associacao_id = ? ORDER BY id DESC LIMIT 1'
  ).get([associacao_id]) as any;
  if (!ultimo) return '0001';
  const num = parseInt(ultimo.numero) + 1;
  return String(num).padStart(4, '0');
}

router.use(authenticateToken);

router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { situacao, busca, page = '1', limit = '20' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM associados WHERE associacao_id = ?';
  const params: any[] = [aid];

  if (situacao && situacao !== 'Todos') {
    query += ' AND situacao = ?';
    params.push(situacao);
  }
  if (busca) {
    query += ' AND (nome LIKE ? OR cpf LIKE ? OR numero LIKE ?)';
    const like = `%${busca}%`;
    params.push(like, like, like);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countQuery).get(params) as any).count;

  query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
  const allParams = [...params, parseInt(limit), offset];
  const associados = db.prepare(query).all(allParams);

  res.json({ associados, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

router.get('/capacidade', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const total = (db.prepare('SELECT COUNT(*) as c FROM associados WHERE associacao_id = ?').get([aid]) as any).c;
  const ativos = (db.prepare("SELECT COUNT(*) as c FROM associados WHERE associacao_id = ? AND situacao='Ativo'").get([aid]) as any).c;
  const limite = req.user!.limite_socios || 1000;
  res.json({ total, ativos, limite, disponivel: limite - total, percentual: Math.round((total / limite) * 100) });
});

router.get('/todos', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const associados = db.prepare(
    'SELECT id, numero, nome, situacao FROM associados WHERE associacao_id = ? ORDER BY nome ASC'
  ).all([req.user!.associacao_id]);
  res.json(associados);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const associado = db.prepare(
    'SELECT * FROM associados WHERE id = ? AND associacao_id = ?'
  ).get([req.params.id, req.user!.associacao_id]);
  if (!associado) {
    res.status(404).json({ error: 'Sócio não encontrado' });
    return;
  }
  res.json(associado);
});

router.post('/', upload.single('foto'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const limite = req.user!.limite_socios || 1000;

  // Verificar capacidade
  const totalAtual = (db.prepare('SELECT COUNT(*) as c FROM associados WHERE associacao_id = ?').get([aid]) as any).c;
  if (totalAtual >= limite) {
    res.status(400).json({ error: `Limite de ${limite} sócios atingido para esta associação` });
    return;
  }

  const numero = gerarNumeroAssociado(aid);
  const foto = req.file ? `/uploads/fotos/${req.file.filename}` : null;

  const {
    nome, cpf, rg, data_nascimento, nome_mae, nome_pai,
    cep, logradouro, numero_end, complemento, bairro, cidade, estado,
    telefone, whatsapp, estado_civil, profissao, nis,
    data_entrada, situacao, observacoes
  } = req.body;

  try {
    const n = (v: any) => (v === undefined || v === '') ? null : v;
    const result = db.prepare(`
      INSERT INTO associados (
        associacao_id, numero, nome, cpf, rg, data_nascimento, nome_mae, nome_pai,
        cep, logradouro, numero_end, complemento, bairro, cidade, estado,
        telefone, whatsapp, estado_civil, profissao, nis,
        data_entrada, situacao, foto, observacoes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run([aid, numero, n(nome), n(cpf), n(rg), n(data_nascimento), n(nome_mae), n(nome_pai),
      n(cep), n(logradouro), n(numero_end), n(complemento), n(bairro), n(cidade), n(estado),
      n(telefone), n(whatsapp), n(estado_civil), n(profissao), n(nis),
      n(data_entrada), situacao || 'Ativo', foto, n(observacoes)]);

    res.json({ id: (result as any).lastInsertRowid, numero, message: 'Sócio cadastrado com sucesso' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(400).json({ error: 'CPF já cadastrado nesta associação' });
    } else {
      res.status(500).json({ error: 'Erro ao cadastrar sócio' });
    }
  }
});

router.put('/:id', upload.single('foto'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const atual = db.prepare('SELECT * FROM associados WHERE id = ? AND associacao_id = ?').get([req.params.id, aid]) as any;
  if (!atual) {
    res.status(404).json({ error: 'Sócio não encontrado' });
    return;
  }

  const foto = req.file ? `/uploads/fotos/${req.file.filename}` : atual.foto;

  const {
    nome, cpf, rg, data_nascimento, nome_mae, nome_pai,
    cep, logradouro, numero_end, complemento, bairro, cidade, estado,
    telefone, whatsapp, estado_civil, profissao, nis,
    data_entrada, situacao, observacoes
  } = req.body;

  const n = (v: any) => (v === undefined || v === '') ? null : v;
  db.prepare(`
    UPDATE associados SET
      nome=?, cpf=?, rg=?, data_nascimento=?, nome_mae=?, nome_pai=?,
      cep=?, logradouro=?, numero_end=?, complemento=?, bairro=?, cidade=?, estado=?,
      telefone=?, whatsapp=?, estado_civil=?, profissao=?, nis=?,
      data_entrada=?, situacao=?, foto=?, observacoes=?,
      updated_at=datetime('now','localtime')
    WHERE id=? AND associacao_id=?
  `).run([n(nome), n(cpf), n(rg), n(data_nascimento), n(nome_mae), n(nome_pai),
    n(cep), n(logradouro), n(numero_end), n(complemento), n(bairro), n(cidade), n(estado),
    n(telefone), n(whatsapp), n(estado_civil), n(profissao), n(nis),
    n(data_entrada), situacao || 'Ativo', foto, n(observacoes), req.params.id, aid]);

  res.json({ message: 'Sócio atualizado com sucesso' });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir sócios' });
    return;
  }
  const db = getDb();
  db.prepare('DELETE FROM associados WHERE id = ? AND associacao_id = ?').run([req.params.id, req.user!.associacao_id]);
  res.json({ message: 'Sócio removido' });
});

export default router;

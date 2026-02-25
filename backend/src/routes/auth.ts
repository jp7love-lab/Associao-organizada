import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    return;
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, a.nome as associacao_nome, a.limite_socios, a.status as assoc_status
    FROM users u
    JOIN associacoes a ON u.associacao_id = a.id
    WHERE u.username = ?
  `).get([username]) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Usuário ou senha incorretos' });
    return;
  }

  if (user.assoc_status !== 'ativo') {
    res.status(403).json({ error: 'Associação inativa. Entre em contato com o suporte.' });
    return;
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      nome: user.nome,
      associacao_id: user.associacao_id,
      associacao_nome: user.associacao_nome,
      limite_socios: user.limite_socios
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      nome: user.nome,
      associacao_id: user.associacao_id,
      associacao_nome: user.associacao_nome,
      limite_socios: user.limite_socios
    }
  });
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

router.put('/senha', authenticateToken, (req: AuthRequest, res: Response) => {
  const { senha_atual, nova_senha } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get([req.user!.id]) as any;

  if (!bcrypt.compareSync(senha_atual, user.password_hash)) {
    res.status(400).json({ error: 'Senha atual incorreta' });
    return;
  }
  if (nova_senha.length < 6) {
    res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    return;
  }

  const hash = bcrypt.hashSync(nova_senha, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run([hash, req.user!.id]);
  res.json({ message: 'Senha alterada com sucesso' });
});

router.get('/usuarios', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const db = getDb();
  const users = db.prepare(
    'SELECT id, username, nome, role, created_at FROM users WHERE associacao_id = ?'
  ).all([req.user.associacao_id]);
  res.json(users);
});

router.post('/usuarios', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const { username, password, nome, role } = req.body;
  const db = getDb();
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      'INSERT INTO users (associacao_id, username, password_hash, nome, role) VALUES (?, ?, ?, ?, ?)'
    ).run([req.user.associacao_id, username, hash, nome, role]);
    res.json({ id: (result as any).lastInsertRowid, message: 'Usuário criado com sucesso' });
  } catch {
    res.status(400).json({ error: 'Nome de usuário já existe nesta associação' });
  }
});

router.delete('/usuarios/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const db = getDb();
  db.prepare(
    'DELETE FROM users WHERE id = ? AND associacao_id = ? AND id != ?'
  ).run([req.params.id, req.user.associacao_id, req.user.id]);
  res.json({ message: 'Usuário removido' });
});

export default router;

import { Router, Request, Response } from 'express';
import { getDb, criarAssociacaoComAdmin } from '../database';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';

const router = Router();

// Cadastro público de nova associação
router.post('/cadastro', (req: Request, res: Response) => {
  const { nome, cnpj, email, telefone, cidade, estado, nomeAdmin, username, senha } = req.body;

  if (!nome || !email || !nomeAdmin || !username || !senha) {
    res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    return;
  }

  if (senha.length < 6) {
    res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    return;
  }

  const db = getDb();
  const emailExiste = db.prepare('SELECT id FROM associacoes WHERE email = ?').get([email]);
  if (emailExiste) {
    res.status(400).json({ error: 'Este e-mail já está cadastrado' });
    return;
  }

  const usernameExiste = db.prepare('SELECT id FROM users WHERE username = ? AND associacao_id IN (SELECT id FROM associacoes WHERE email = ?)').get([username, email]);

  try {
    const { associacao_id, user_id } = criarAssociacaoComAdmin({
      nome, cnpj, email, telefone, cidade, estado,
      nomeAdmin, username, senha
    });

    const assoc = db.prepare('SELECT * FROM associacoes WHERE id = ?').get([associacao_id]) as any;
    const token = jwt.sign(
      {
        id: user_id,
        username,
        role: 'admin',
        nome: nomeAdmin,
        associacao_id,
        associacao_nome: nome,
        limite_socios: 1000
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Associação cadastrada com sucesso!',
      token,
      user: { id: user_id, username, role: 'admin', nome: nomeAdmin, associacao_id, associacao_nome: nome },
      associacao: assoc
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(400).json({ error: 'E-mail ou usuário já cadastrado' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Erro ao cadastrar associação' });
    }
  }
});

// Verificar disponibilidade de username
router.get('/check-username', (req: Request, res: Response) => {
  const { username, associacao_id } = req.query as any;
  if (!username) { res.json({ disponivel: false }); return; }

  const db = getDb();
  const existe = db.prepare('SELECT id FROM users WHERE username = ? AND associacao_id = ?').get([username, associacao_id || 0]);
  res.json({ disponivel: !existe });
});

export default router;

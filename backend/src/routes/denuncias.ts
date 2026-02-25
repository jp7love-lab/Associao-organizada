import { Router, Response } from 'express';
import { getDb } from '../database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const rows = db.prepare(`
    SELECT d.*, a.nome as nome_socio, a.numero as numero_socio
    FROM denuncias d
    LEFT JOIN associados a ON d.associado_id = a.id
    WHERE d.associacao_id = ?
    ORDER BY d.created_at DESC
  `).all([aid]);
  res.json(rows);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const n = (v: any) => (v === undefined || v === '') ? null : v;
  const { tipo, categoria, descricao, nome_denunciante, contato, anonima } = req.body;
  if (!descricao) { res.status(400).json({ error: 'Descrição obrigatória' }); return; }
  db.prepare(`
    INSERT INTO denuncias (associacao_id, associado_id, tipo, categoria, descricao, nome_denunciante, contato, anonima, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
  `).run([aid, n(req.user!.id), n(tipo), n(categoria), descricao, anonima ? 'Anônimo' : n(nome_denunciante), n(contato), anonima ? 1 : 0]);
  res.status(201).json({ message: 'Denúncia registrada com sucesso' });
});

router.put('/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { status } = req.body;
  db.prepare(`UPDATE denuncias SET status=?, updated_at=datetime('now','localtime') WHERE id=? AND associacao_id=?`).run([status, req.params.id, aid]);
  res.json({ message: 'Status atualizado' });
});

router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  db.prepare(`DELETE FROM denuncias WHERE id=? AND associacao_id=?`).run([req.params.id, aid]);
  res.json({ message: 'Denúncia excluída' });
});

export default router;

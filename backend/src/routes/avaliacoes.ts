import { Router, Response } from 'express';
import { getDb } from '../database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const rows = db.prepare(`
    SELECT av.*, u.nome as nome_usuario
    FROM avaliacoes av
    LEFT JOIN users u ON av.user_id = u.id
    WHERE av.associacao_id = ?
    ORDER BY av.created_at DESC
  `).all([aid]);
  const media = db.prepare(`SELECT AVG(nota) as media, COUNT(*) as total FROM avaliacoes WHERE associacao_id=?`).get([aid]) as any;
  res.json({ avaliacoes: rows, media: media?.media || 0, total: media?.total || 0 });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const uid = req.user!.id;
  const n = (v: any) => (v === undefined || v === '') ? null : v;
  const { nota, comentario } = req.body;
  if (!nota || nota < 1 || nota > 5) { res.status(400).json({ error: 'Nota inválida (1-5)' }); return; }
  const existing = db.prepare(`SELECT id FROM avaliacoes WHERE associacao_id=? AND user_id=?`).get([aid, uid]) as any;
  if (existing) {
    db.prepare(`UPDATE avaliacoes SET nota=?, comentario=?, updated_at=datetime('now','localtime') WHERE id=?`).run([nota, n(comentario), existing.id]);
  } else {
    db.prepare(`INSERT INTO avaliacoes (associacao_id, user_id, nota, comentario) VALUES (?,?,?,?)`).run([aid, uid, nota, n(comentario)]);
  }
  res.status(201).json({ message: 'Avaliação enviada com sucesso' });
});

export default router;

import { Router, Response } from 'express';
import { getDb } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { associado_id, ano, mes, status } = req.query as any;

  let query = `
    SELECT m.*, a.nome as associado_nome, a.numero as associado_numero
    FROM mensalidades m
    JOIN associados a ON m.associado_id = a.id
    WHERE m.associacao_id = ?
  `;
  const params: any[] = [aid];

  if (associado_id) { query += ' AND m.associado_id = ?'; params.push(associado_id); }
  if (ano) { query += ' AND m.ano = ?'; params.push(ano); }
  if (mes) { query += ' AND m.mes = ?'; params.push(mes); }
  if (status) { query += ' AND m.status = ?'; params.push(status); }

  query += ' ORDER BY m.ano DESC, m.mes DESC, a.nome ASC';
  res.json(db.prepare(query).all(params));
});

router.get('/inadimplentes', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;

  const inadimplentes = db.prepare(`
    SELECT a.id, a.numero, a.nome, a.telefone, a.whatsapp,
      COUNT(m.id) as meses_pendentes,
      SUM(m.valor) as total_devido
    FROM associados a
    LEFT JOIN mensalidades m ON a.id = m.associado_id AND m.status = 'Pendente'
    WHERE a.associacao_id = ? AND a.situacao = 'Ativo'
    GROUP BY a.id
    HAVING meses_pendentes > 0
    ORDER BY meses_pendentes DESC
  `).all([aid]);

  res.json(inadimplentes);
});

router.post('/gerar-mes', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { mes, ano, valor } = req.body;

  const config = db.prepare(
    "SELECT valor FROM configuracoes WHERE associacao_id = ? AND chave = 'valor_mensalidade'"
  ).get([aid]) as any;
  const valorFinal = valor || config?.valor || 30;

  const associados = db.prepare(
    "SELECT id FROM associados WHERE associacao_id = ? AND situacao = 'Ativo'"
  ).all([aid]) as any[];
  let criados = 0;

  const insertMens = db.prepare(`
    INSERT OR IGNORE INTO mensalidades (associacao_id, associado_id, mes, ano, valor, status)
    VALUES (?, ?, ?, ?, ?, 'Pendente')
  `);

  db.exec('BEGIN');
  try {
    for (const a of associados) {
      const result = insertMens.run([aid, a.id, mes, ano, valorFinal]);
      if ((result as any).changes > 0) criados++;
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  res.json({ message: `${criados} mensalidades geradas para ${mes}/${ano}` });
});

router.post('/:id/pagar', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { data_pagamento, observacao } = req.body;
  const dataPag = data_pagamento || new Date().toISOString().split('T')[0];

  const mens = db.prepare(
    'SELECT * FROM mensalidades WHERE id = ? AND associacao_id = ?'
  ).get([req.params.id, aid]) as any;
  if (!mens) {
    res.status(404).json({ error: 'Mensalidade não encontrada' });
    return;
  }

  const reciboNum = `REC-${Date.now()}`;
  db.prepare(`
    UPDATE mensalidades
    SET status = 'Pago', data_pagamento = ?, recibo_numero = ?, observacao = ?
    WHERE id = ? AND associacao_id = ?
  `).run([dataPag, reciboNum, observacao || '', req.params.id, aid]);

  res.json({ message: 'Pagamento registrado', recibo_numero: reciboNum });
});

router.post('/:id/cancelar-pagamento', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const db = getDb();
  db.prepare(`
    UPDATE mensalidades SET status = 'Pendente', data_pagamento = NULL, recibo_numero = NULL
    WHERE id = ? AND associacao_id = ?
  `).run([req.params.id, req.user!.associacao_id]);
  res.json({ message: 'Pagamento cancelado' });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { associado_id, mes, ano, valor, status, data_pagamento, observacao } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO mensalidades (associacao_id, associado_id, mes, ano, valor, status, data_pagamento, observacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run([aid, associado_id, mes, ano, valor, status || 'Pendente', data_pagamento || null, observacao || '']);

    res.json({ id: (result as any).lastInsertRowid, message: 'Mensalidade criada' });
  } catch {
    res.status(400).json({ error: 'Mensalidade já existe para este mês/ano' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const db = getDb();
  db.prepare('DELETE FROM mensalidades WHERE id = ? AND associacao_id = ?').run([req.params.id, req.user!.associacao_id]);
  res.json({ message: 'Mensalidade removida' });
});

export default router;

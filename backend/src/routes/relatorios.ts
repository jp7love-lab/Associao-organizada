import { Router, Response } from 'express';
import * as XLSX from 'xlsx';
import { getDb } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const totalAtivos = (db.prepare("SELECT COUNT(*) as c FROM associados WHERE associacao_id=? AND situacao='Ativo'").get([aid]) as any).c;
  const totalInativos = (db.prepare("SELECT COUNT(*) as c FROM associados WHERE associacao_id=? AND situacao='Inativo'").get([aid]) as any).c;
  const totalAssociados = (db.prepare("SELECT COUNT(*) as c FROM associados WHERE associacao_id=?").get([aid]) as any).c;
  const limite = req.user!.limite_socios || 1000;

  const arrecadadoMes = (db.prepare(`
    SELECT COALESCE(SUM(valor),0) as total FROM mensalidades
    WHERE associacao_id=? AND status='Pago' AND mes=? AND ano=?
  `).get([aid, mesAtual, anoAtual]) as any).total;

  const pendenteMes = (db.prepare(`
    SELECT COALESCE(SUM(valor),0) as total FROM mensalidades
    WHERE associacao_id=? AND status='Pendente' AND mes=? AND ano=?
  `).get([aid, mesAtual, anoAtual]) as any).total;

  const inadimplentes = (db.prepare(`
    SELECT COUNT(DISTINCT associado_id) as c FROM mensalidades WHERE associacao_id=? AND status='Pendente'
  `).get([aid]) as any).c;

  const novosMes = (db.prepare(`
    SELECT COUNT(*) as c FROM associados
    WHERE associacao_id=? AND strftime('%m',data_entrada)=? AND strftime('%Y',data_entrada)=?
  `).get([aid, String(mesAtual).padStart(2,'0'), String(anoAtual)]) as any).c;

  const pagamentosPorMes = db.prepare(`
    SELECT mes, ano, SUM(valor) as total, COUNT(*) as qtd
    FROM mensalidades WHERE associacao_id=? AND status='Pago' AND ano=?
    GROUP BY mes ORDER BY mes ASC
  `).all([aid, anoAtual]);

  const associadosPorMes = db.prepare(`
    SELECT strftime('%m',data_entrada) as mes, COUNT(*) as qtd
    FROM associados WHERE associacao_id=? AND strftime('%Y',data_entrada)=?
    GROUP BY mes ORDER BY mes ASC
  `).all([aid, String(anoAtual)]);

  res.json({
    totalAtivos, totalInativos, totalAssociados, limite,
    arrecadadoMes, pendenteMes, inadimplentes, novosMes,
    pagamentosPorMes, associadosPorMes
  });
});

router.get('/financeiro', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { mes, ano } = req.query as any;

  const pagamentos = db.prepare(`
    SELECT m.*, a.nome as associado_nome, a.numero as associado_numero, a.whatsapp
    FROM mensalidades m JOIN associados a ON m.associado_id=a.id
    WHERE m.associacao_id=? AND m.mes=? AND m.ano=?
    ORDER BY a.nome ASC
  `).all([aid, mes, ano]);

  const resumo = db.prepare(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN m.status='Pago' THEN 1 ELSE 0 END) as pagos,
      SUM(CASE WHEN m.status='Pendente' THEN 1 ELSE 0 END) as pendentes,
      SUM(CASE WHEN m.status='Pago' THEN m.valor ELSE 0 END) as valor_arrecadado,
      SUM(CASE WHEN m.status='Pendente' THEN m.valor ELSE 0 END) as valor_pendente
    FROM mensalidades m JOIN associados a ON m.associado_id=a.id
    WHERE m.associacao_id=? AND m.mes=? AND m.ano=? AND a.situacao='Ativo'
  `).get([aid, mes, ano]);

  res.json({ pagamentos, resumo });
});

router.get('/exportar-excel', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const rows = db.prepare(`
    SELECT numero, nome, cpf, rg, telefone, whatsapp, cidade, estado,
      estado_civil, profissao, data_entrada, situacao
    FROM associados WHERE associacao_id=? ORDER BY nome ASC
  `).all([aid]) as any[];

  const ws = XLSX.utils.json_to_sheet(rows.map((a: any) => ({
    'Nº': a.numero, 'Nome': a.nome, 'CPF': a.cpf, 'RG': a.rg,
    'Telefone': a.telefone, 'WhatsApp': a.whatsapp,
    'Cidade': a.cidade, 'Estado': a.estado,
    'Estado Civil': a.estado_civil, 'Profissão': a.profissao,
    'Data de Entrada': a.data_entrada, 'Situação': a.situacao
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sócios');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=socios.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

router.get('/exportar-mensalidades', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const { mes, ano } = req.query as any;

  const rows = db.prepare(`
    SELECT a.numero, a.nome, m.mes, m.ano, m.valor, m.status, m.data_pagamento, m.recibo_numero
    FROM mensalidades m JOIN associados a ON m.associado_id=a.id
    WHERE m.associacao_id=? AND m.mes=? AND m.ano=?
    ORDER BY a.nome ASC
  `).all([aid, mes, ano]) as any[];

  const ws = XLSX.utils.json_to_sheet(rows.map((d: any) => ({
    'Nº Sócio': d.numero, 'Nome': d.nome, 'Mês': d.mes, 'Ano': d.ano,
    'Valor': `R$ ${parseFloat(d.valor).toFixed(2)}`, 'Status': d.status,
    'Data Pagamento': d.data_pagamento || '-', 'Nº Recibo': d.recibo_numero || '-'
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mensalidades');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename=mensalidades_${mes}_${ano}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

export default router;

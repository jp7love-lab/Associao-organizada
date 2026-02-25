import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, CheckCircle, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { Mensalidade } from '../../types';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const ANO_ATUAL = new Date().getFullYear();
const MES_ATUAL = new Date().getMonth() + 1;

export default function Mensalidades() {
  const { isAdmin, user } = useAuth();
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [mes, setMes] = useState(MES_ATUAL);
  const [ano, setAno] = useState(ANO_ATUAL);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [resumo, setResumo] = useState<any>(null);

  const fetchMensalidades = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get('/mensalidades', { params: { mes, ano, status: statusFiltro } }),
        api.get('/relatorios/financeiro', { params: { mes, ano } })
      ]);
      setMensalidades(r1.data);
      setResumo(r2.data.resumo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMensalidades(); }, [mes, ano, statusFiltro]);

  const gerarMes = async () => {
    if (!confirm(`Gerar mensalidades para ${MESES[mes - 1]}/${ano}?`)) return;
    setGerando(true);
    try {
      const r = await api.post('/mensalidades/gerar-mes', { mes, ano });
      alert(r.data.message);
      fetchMensalidades();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erro ao gerar mensalidades');
    }
    setGerando(false);
  };

  const registrarPagamento = async (m: Mensalidade) => {
    if (!confirm(`Registrar pagamento de ${m.associado_nome}?`)) return;
    try {
      await api.post(`/mensalidades/${m.id}/pagar`, {});
      fetchMensalidades();
    } catch {
      alert('Erro ao registrar pagamento');
    }
  };

  const cancelarPagamento = async (m: Mensalidade) => {
    if (!confirm('Cancelar este pagamento?')) return;
    await api.post(`/mensalidades/${m.id}/cancelar-pagamento`);
    fetchMensalidades();
  };

  const excluirMensalidade = async (m: Mensalidade) => {
    if (!confirm(`Excluir mensalidade de ${m.associado_nome} (${MESES[m.mes - 1]}/${m.ano})?\nEsta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/mensalidades/${m.id}`);
      fetchMensalidades();
    } catch {
      alert('Erro ao excluir mensalidade');
    }
  };

  const exportarExcel = () => {
    window.open(`/api/relatorios/exportar-mensalidades?mes=${mes}&ano=${ano}`, '_blank');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(`${user?.associacao_nome || 'Associação'} - Relatório de Mensalidades`, 14, 15);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`${MESES[mes - 1]}/${ano}`, 14, 23);
    if (resumo) {
      doc.setFontSize(10);
      doc.text(`Total: ${resumo.total} | Pagos: ${resumo.pagos} | Pendentes: ${resumo.pendentes}`, 14, 31);
      doc.text(`Arrecadado: R$ ${Number(resumo.valor_arrecadado || 0).toFixed(2)} | Pendente: R$ ${Number(resumo.valor_pendente || 0).toFixed(2)}`, 14, 38);
    }
    autoTable(doc, {
      startY: 45,
      head: [['Nº', 'Nome', 'Valor', 'Status', 'Pagamento', 'Recibo']],
      body: filtradas.map(m => [
        m.associado_numero || '',
        m.associado_nome || '',
        `R$ ${Number(m.valor).toFixed(2)}`,
        m.status,
        m.data_pagamento ? format(new Date(m.data_pagamento + 'T00:00:00'), 'dd/MM/yyyy') : '-',
        m.recibo_numero || '-'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] }
    });
    doc.save(`mensalidades_${mes}_${ano}.pdf`);
  };

  const filtradas = mensalidades.filter(m =>
    !busca || m.associado_nome?.toLowerCase().includes(busca.toLowerCase()) || m.associado_numero?.includes(busca)
  );

  const anos = Array.from({ length: 5 }, (_, i) => ANO_ATUAL - 2 + i);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mensalidades</h1>
          <p className="text-gray-500 text-sm">{filtradas.length} registro(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button onClick={gerarMes} disabled={gerando} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              {gerando ? 'Gerando...' : 'Gerar Mês'}
            </button>
          )}
          <button onClick={exportarPDF} className="btn-outline text-sm">PDF</button>
          <button onClick={exportarExcel} className="btn-outline text-sm">Excel</button>
        </div>
      </div>

      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: resumo.total, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'Pagos', value: resumo.pagos, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Pendentes', value: resumo.pendentes, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Arrecadado', value: `R$ ${Number(resumo.valor_arrecadado || 0).toFixed(2)}`, color: 'text-blue-700', bg: 'bg-blue-50' }
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3 text-center`}>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-5">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input-field w-auto">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className="input-field w-auto">
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)} className="input-field w-auto">
            <option value="">Todos</option>
            <option value="Pago">Pagos</option>
            <option value="Pendente">Pendentes</option>
          </select>
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar associado..." value={busca} onChange={e => setBusca(e.target.value)} className="input-field pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhuma mensalidade encontrada</p>
            {isAdmin && <button onClick={gerarMes} className="btn-primary mx-auto mt-3 text-sm"><Plus className="w-4 h-4" />Gerar mensalidades</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Associado</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 hidden sm:table-cell">Valor</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 hidden md:table-cell">Pagamento</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <div>
                        <p className="font-medium text-gray-800">{m.associado_nome}</p>
                        <p className="text-xs text-gray-400 font-mono">{m.associado_numero}</p>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell font-medium">R$ {Number(m.valor).toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className={m.status === 'Pago' ? 'badge-pago' : 'badge-pendente'}>{m.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell">
                      {m.data_pagamento ? format(new Date(m.data_pagamento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {m.status === 'Pendente' ? (
                          <button onClick={() => registrarPagamento(m)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />Pagar
                          </button>
                        ) : isAdmin ? (
                          <button onClick={() => cancelarPagamento(m)} className="text-xs text-orange-500 hover:bg-orange-50 px-2 py-1 rounded-lg font-medium">
                            Cancelar
                          </button>
                        ) : null}
                        {isAdmin && (
                          <button onClick={() => excluirMensalidade(m)} title="Excluir mensalidade"
                            className="text-xs text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

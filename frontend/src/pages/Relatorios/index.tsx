import React, { useEffect, useState } from 'react';
import { BarChart3, Download, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { Inadimplente } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const COLORS = ['#16a34a', '#ef4444'];
const ANO_ATUAL = new Date().getFullYear();

export default function Relatorios() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
  const [aba, setAba] = useState<'financeiro' | 'associados' | 'inadimplentes'>('financeiro');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/relatorios/dashboard'),
      api.get('/mensalidades/inadimplentes')
    ]).then(([r1, r2]) => {
      setDashboard(r1.data);
      setInadimplentes(r2.data);
      setLoading(false);
    });
  }, []);

  const exportarAssociadosExcel = () => window.open('/api/relatorios/exportar-excel', '_blank');

  const exportarInadimplentesPDF = () => {
    if (!inadimplentes.length) return;
    const nomeAssoc = user?.associacao_nome || 'Associação';
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(`${nomeAssoc} - Relatório de Inadimplentes`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 23);
    autoTable(doc, {
      startY: 30,
      head: [['Nº', 'Nome', 'Telefone', 'WhatsApp', 'Meses Pendentes', 'Total Devido']],
      body: inadimplentes.map(i => [
        i.numero, i.nome, i.telefone || '-', i.whatsapp || '-',
        String(i.meses_pendentes),
        `R$ ${Number(i.total_devido).toFixed(2)}`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] }
    });
    doc.save('inadimplentes.pdf');
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!dashboard) return null;

  const chartData = MESES.map((mes, i) => {
    const item = dashboard.pagamentosPorMes?.find((p: any) => p.mes === i + 1);
    return { mes, valor: item?.total || 0, qtd: item?.qtd || 0 };
  });

  const pieData = [
    { name: 'Ativos', value: dashboard.totalAtivos },
    { name: 'Inativos', value: dashboard.totalInativos }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          <p className="text-gray-500 text-sm">Análise e exportação de dados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportarAssociadosExcel} className="btn-outline text-sm">
            <Download className="w-4 h-4" />
            Exportar Associados (Excel)
          </button>
          <button onClick={exportarInadimplentesPDF} className="btn-danger text-sm">
            <Download className="w-4 h-4" />
            Inadimplentes (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Associados', value: dashboard.totalAssociados, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'Associados Ativos', value: dashboard.totalAtivos, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Inadimplentes', value: dashboard.inadimplentes, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Arrecadado no Mês', value: `R$ ${Number(dashboard.arrecadadoMes || 0).toFixed(2)}`, color: 'text-blue-700', bg: 'bg-blue-50' }
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-3 text-center`}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-gray-200 gap-1">
        {[
          { key: 'financeiro', label: 'Financeiro' },
          { key: 'associados', label: 'Associados' },
          { key: 'inadimplentes', label: `Inadimplentes (${inadimplentes.length})` }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setAba(t.key as any)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              aba === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'financeiro' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">Arrecadação por Mês ({ANO_ATUAL})</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, 'Arrecadado']} />
                <Bar dataKey="valor" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">Pagamentos por Mês ({ANO_ATUAL})</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [v, 'Pagamentos']} />
                <Bar dataKey="qtd" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {aba === 'associados' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="card flex flex-col items-center">
            <h2 className="font-semibold text-gray-700 mb-4 self-start">Situação dos Associados</h2>
            <PieChart width={260} height={220}>
              <Pie data={pieData} cx={130} cy={100} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">Resumo</h2>
            <div className="space-y-3">
              {[
                { label: 'Total de Associados', value: dashboard.totalAssociados, color: 'bg-gray-200' },
                { label: 'Associados Ativos', value: dashboard.totalAtivos, color: 'bg-green-400' },
                { label: 'Associados Inativos', value: dashboard.totalInativos, color: 'bg-red-400' },
                { label: 'Inadimplentes', value: dashboard.inadimplentes, color: 'bg-yellow-400' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                  <span className="font-bold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {aba === 'inadimplentes' && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Associados com Mensalidades Pendentes
          </h2>
          {inadimplentes.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum inadimplente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Associado</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden sm:table-cell">WhatsApp</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-600">Meses</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">Total Devido</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-600 hidden md:table-cell">Cobrar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inadimplentes.map(i => (
                    <tr key={i.id} className="hover:bg-red-50/50">
                      <td className="py-2 px-3">
                        <p className="font-medium">{i.nome}</p>
                        <p className="text-xs text-gray-400 font-mono">{i.numero}</p>
                      </td>
                      <td className="py-2 px-3 text-gray-500 hidden sm:table-cell">{i.whatsapp || i.telefone || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{i.meses_pendentes}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-red-600">R$ {Number(i.total_devido).toFixed(2)}</td>
                      <td className="py-2 px-3 text-center hidden md:table-cell">
                        {i.whatsapp && (
                          <a
                            href={`https://wa.me/55${i.whatsapp.replace(/\D/g, '')}?text=Olá ${i.nome}, você possui ${i.meses_pendentes} mensalidade(s) pendente(s) com a ${user?.associacao_nome || 'associação'} totalizando R$ ${Number(i.total_devido).toFixed(2)}. Por favor, regularize sua situação.`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 hover:text-green-700 text-xs underline"
                          >
                            WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

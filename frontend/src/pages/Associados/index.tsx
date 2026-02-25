import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Search, Filter, Edit, Eye, Trash2, Users, BarChart2, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import { Associado, Capacidade } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function Associados() {
  const { isAdmin, user } = useAuth();
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [capacidade, setCapacidade] = useState<Capacidade | null>(null);

  const fetchAssociados = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get('/associados', { params: { busca, situacao, page, limit: 15 } }),
        api.get('/associados/capacidade')
      ]);
      setAssociados(r1.data.associados);
      setTotal(r1.data.total);
      setPages(r1.data.pages);
      setCapacidade(r2.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssociados(); }, [busca, situacao, page]);

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Excluir o sócio "${nome}"? Esta ação não pode ser desfeita.`)) return;
    await api.delete(`/associados/${id}`);
    fetchAssociados();
  };

  const gerarListaPDF = async () => {
    const verde: [number, number, number] = [22, 101, 52];
    const cinza: [number, number, number] = [100, 100, 100];
    const nomeAssoc = user?.associacao_nome || 'Associação';

    // Buscar TODOS os ativos sem paginação
    const resp = await api.get('/associados', { params: { situacao: 'Ativo', limit: 1000, page: 1 } });
    const lista: Associado[] = resp.data.associados;

    const doc = new jsPDF();
    const dataGer = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    const addCabecalho = (pg: number) => {
      doc.setFillColor(...verde);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(nomeAssoc.toUpperCase(), 105, 11, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('LISTA DE SÓCIOS ATIVOS', 105, 20, { align: 'center' });
      // número da página
      doc.setFontSize(8);
      doc.text(`Página ${pg}`, 195, 20, { align: 'right' });
    };

    const addRodape = () => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(10, 288, 200, 288);
      doc.setFontSize(8);
      doc.setTextColor(...cinza);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em ${dataGer} — Total: ${lista.length} sócio(s) ativo(s) — Sistema AMFAC`, 105, 293, { align: 'center' });
    };

    let pg = 1;
    addCabecalho(pg);

    // Cabeçalho da tabela
    const drawTableHeader = (y: number) => {
      doc.setFillColor(240, 249, 244);
      doc.rect(10, y, 190, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...verde);
      doc.text('Nº', 13, y + 5);
      doc.text('NOME COMPLETO', 25, y + 5);
      doc.text('CPF', 105, y + 5);
      doc.text('TELEFONE', 145, y + 5);
      doc.text('ENTRADA', 175, y + 5);
      return y + 9;
    };

    let y = drawTableHeader(32);

    lista.forEach((a, i) => {
      // Nova página se necessário
      if (y > 275) {
        addRodape();
        doc.addPage();
        pg++;
        addCabecalho(pg);
        y = drawTableHeader(32);
      }

      // Linha zebrada
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(10, y - 1, 190, 7, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52);
      doc.text(a.numero || '-', 13, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      // Truncar nome longo
      const nome = a.nome.length > 35 ? a.nome.substring(0, 33) + '...' : a.nome;
      doc.text(nome, 25, y + 4);
      doc.text(a.cpf || '-', 105, y + 4);
      doc.text(a.telefone || a.whatsapp || '-', 145, y + 4);
      doc.text(a.data_entrada ? format(new Date(a.data_entrada + 'T00:00:00'), 'dd/MM/yyyy') : '-', 175, y + 4);

      // Linha separadora leve
      doc.setDrawColor(235, 235, 235);
      doc.setLineWidth(0.2);
      doc.line(10, y + 6, 200, y + 6);

      y += 7;
    });

    // Totalizador
    y += 4;
    if (y > 270) { addRodape(); doc.addPage(); pg++; addCabecalho(pg); y = 40; }
    doc.setFillColor(...verde);
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL DE SÓCIOS ATIVOS: ${lista.length}`, 105, y + 5.5, { align: 'center' });

    addRodape();
    doc.save(`lista_socios_ativos_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sócios</h1>
          <p className="text-gray-500 text-sm">{total} sócio(s) encontrado(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={gerarListaPDF} className="btn-outline text-sm">
            <FileText className="w-4 h-4" /> Lista PDF
          </button>
          <Link to="/associados/novo" className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Novo Sócio
          </Link>
        </div>
      </div>

      {capacidade && (
        <div className="card py-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Capacidade</span>
            </div>
            <span className="text-sm text-gray-500">
              <strong className="text-primary-700">{capacidade.total}</strong> / {capacidade.limite} sócios
              <span className="ml-2 text-xs text-gray-400">({capacidade.disponivel} vagas)</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${capacidade.percentual > 90 ? 'bg-red-500' : capacidade.percentual > 70 ? 'bg-accent-500' : 'bg-primary-500'}`}
              style={{ width: `${Math.min(capacidade.percentual, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar por nome, CPF ou número..."
              value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }}
              className="input-field pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select value={situacao} onChange={e => { setSituacao(e.target.value); setPage(1); }} className="input-field w-auto">
              <option value="Todos">Todos</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : associados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum sócio encontrado</p>
            <Link to="/associados/novo" className="btn-primary mx-auto mt-4 text-sm">
              <UserPlus className="w-4 h-4" /> Cadastrar primeiro sócio
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Nº</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Nome</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-600 hidden md:table-cell">CPF</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-600 hidden lg:table-cell">Telefone</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Situação</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {associados.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{a.numero}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {a.foto ? (
                            <img src={a.foto} alt={a.nome} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs flex-shrink-0">
                              {a.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{a.nome}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell font-mono text-xs">{a.cpf}</td>
                      <td className="py-2.5 px-3 text-gray-500 hidden lg:table-cell">{a.telefone || a.whatsapp || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={a.situacao === 'Ativo' ? 'badge-ativo' : 'badge-inativo'}>{a.situacao}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/associados/${a.id}`} className="p-1.5 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors" title="Ver detalhes">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/associados/${a.id}/editar`} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <button onClick={() => handleDelete(a.id, a.nome)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
                <span className="text-sm text-gray-600">Página {page} de {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

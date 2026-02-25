import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, BadgeCheck, CreditCard, User, MapPin, Phone, Calendar, FileText } from 'lucide-react';
import api from '../../services/api';
import { Associado, Mensalidade } from '../../types';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function DetalhesAssociado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [associado, setAssociado] = useState<Associado | null>(null);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [tab, setTab] = useState<'dados' | 'mensalidades'>('dados');

  useEffect(() => {
    api.get(`/associados/${id}`).then(r => setAssociado(r.data));
    api.get('/mensalidades', { params: { associado_id: id } }).then(r => setMensalidades(r.data));
  }, [id]);

  const gerarFichaPDF = () => {
    if (!associado) return;
    const doc = new jsPDF();
    const nomeAssoc = user?.associacao_nome || 'Associação';
    const verde = [22, 101, 52] as [number, number, number];
    const cinza = [100, 100, 100] as [number, number, number];

    // Cabeçalho
    doc.setFillColor(...verde);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(nomeAssoc.toUpperCase(), 105, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('FICHA CADASTRAL DO ASSOCIADO', 105, 24, { align: 'center' });

    // Foto ou inicial
    doc.setFillColor(240, 249, 244);
    doc.roundedRect(15, 42, 35, 42, 4, 4, 'F');
    doc.setTextColor(...verde);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(associado.nome.charAt(0).toUpperCase(), 32.5, 70, { align: 'center' });

    // Nome e número
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(associado.nome, 58, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cinza);
    doc.text(`Nº do Sócio: ${associado.numero}`, 58, 63);
    const badgeColor = associado.situacao === 'Ativo' ? [22, 163, 74] : [239, 68, 68];
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(58, 67, 28, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(associado.situacao, 72, 73, { align: 'center' });

    // Linha separadora
    doc.setDrawColor(...verde);
    doc.setLineWidth(0.5);
    doc.line(15, 90, 195, 90);

    // Seção: Identificação
    const secao = (titulo: string, y: number) => {
      doc.setFillColor(240, 249, 244);
      doc.rect(15, y, 180, 7, 'F');
      doc.setTextColor(...verde);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, 18, y + 5);
    };

    const campo = (label: string, valor: string, x: number, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...cinza);
      doc.text(label.toUpperCase(), x, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(valor || '-', x, y + 6);
    };

    let y = 95;
    secao('IDENTIFICAÇÃO', y);
    y += 12;
    campo('Nome Completo', associado.nome, 15, y);
    campo('CPF', associado.cpf || '-', 120, y);
    y += 14;
    campo('RG', associado.rg || '-', 15, y);
    campo('Data de Nascimento', associado.data_nascimento ? format(new Date(associado.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy') : '-', 80, y);
    campo('Estado Civil', associado.estado_civil || '-', 145, y);
    y += 14;
    campo('Nome da Mãe', associado.nome_mae || '-', 15, y);
    campo('Nome do Pai', associado.nome_pai || '-', 110, y);
    y += 14;
    campo('Profissão', associado.profissao || '-', 15, y);
    campo('NIS', associado.nis || '-', 110, y);
    campo('Entrada na Assoc.', associado.data_entrada ? format(new Date(associado.data_entrada + 'T00:00:00'), 'dd/MM/yyyy') : '-', 150, y);

    y += 16;
    secao('CONTATO', y);
    y += 12;
    campo('Telefone', associado.telefone || '-', 15, y);
    campo('WhatsApp', associado.whatsapp || '-', 80, y);

    y += 16;
    secao('ENDEREÇO', y);
    y += 12;
    const endCompleto = [associado.logradouro, associado.numero_end, associado.complemento].filter(Boolean).join(', ');
    campo('Logradouro', endCompleto || '-', 15, y);
    campo('CEP', associado.cep || '-', 145, y);
    y += 14;
    campo('Bairro', associado.bairro || '-', 15, y);
    campo('Cidade', associado.cidade || '-', 80, y);
    campo('Estado', associado.estado || '-', 155, y);

    // Rodapé
    const dataGer = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, 275, 195, 275);
    doc.setTextColor(...cinza);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${dataGer} — Sistema AMFAC`, 105, 281, { align: 'center' });

    // Linha de assinatura
    doc.line(15, 268, 90, 268);
    doc.text('Assinatura do Associado', 52, 273, { align: 'center' });
    doc.line(110, 268, 185, 268);
    doc.text('Assinatura do Responsável', 147, 273, { align: 'center' });

    const nomeSanitizado = associado.nome.replace(/\s+/g, '_').toLowerCase();
    doc.save(`ficha_${nomeSanitizado}_${associado.cpf?.replace(/\D/g, '') || associado.numero}.pdf`);
  };

  const gerarReciboPDF = (m: Mensalidade) => {
    if (!associado) return;
    const nomeAssoc = user?.associacao_nome || 'Associação';
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text(nomeAssoc, 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('RECIBO DE MENSALIDADE', 105, 42, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Recibo Nº: ${m.recibo_numero}`, 20, 56);
    doc.text(`Associado: ${associado.nome}`, 20, 66);
    doc.text(`Nº: ${associado.numero}`, 20, 74);
    doc.text(`CPF: ${associado.cpf}`, 20, 82);
    doc.text(`Referência: ${MESES[m.mes - 1]}/${m.ano}`, 20, 92);
    doc.text(`Valor: R$ ${Number(m.valor).toFixed(2)}`, 20, 100);
    doc.text(`Data de Pagamento: ${m.data_pagamento ? format(new Date(m.data_pagamento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}`, 20, 108);
    doc.setLineWidth(0.5);
    doc.line(20, 125, 190, 125);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Documento gerado pelo Sistema AMFAC', 105, 135, { align: 'center' });
    doc.save(`recibo_${m.recibo_numero}.pdf`);
  };

  if (!associado) return (
    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  );

  const endereco = [associado.logradouro, associado.numero_end, associado.complemento, associado.bairro, associado.cidade, associado.estado].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex-1">Detalhes do Associado</h1>
        <Link to={`/associados/${id}/editar`} className="btn-primary text-sm">
          <Edit className="w-4 h-4" /> Editar
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="flex-shrink-0">
            {associado.foto ? (
              <img src={associado.foto} alt={associado.nome} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center ring-4 ring-primary-50">
                <span className="text-3xl font-bold text-primary-600">{associado.nome.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-800">{associado.nome}</h2>
              <span className={associado.situacao === 'Ativo' ? 'badge-ativo' : 'badge-inativo'}>{associado.situacao}</span>
            </div>
            <p className="text-primary-600 font-mono font-semibold">{associado.numero}</p>
            <p className="text-gray-500 text-sm">{associado.profissao}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={gerarFichaPDF} className="btn-outline text-sm">
              <FileText className="w-4 h-4" /> Gerar PDF
            </button>
            <Link to={`/carteirinha?id=${id}`} className="btn-outline text-sm">
              <BadgeCheck className="w-4 h-4" /> Carteirinha
            </Link>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 gap-1">
        {[{ key: 'dados', label: 'Dados Pessoais' }, { key: 'mensalidades', label: 'Mensalidades' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dados' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><User className="w-4 h-4 text-primary-600" />Dados Pessoais</h3>
            {[
              ['CPF', associado.cpf], ['RG', associado.rg],
              ['Nascimento', associado.data_nascimento ? format(new Date(associado.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy') : '-'],
              ['Mãe', associado.nome_mae], ['Pai', associado.nome_pai],
              ['Estado Civil', associado.estado_civil], ['Profissão', associado.profissao],
              ['NIS', associado.nis || '-']
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v || '-'}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="card space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4 text-secondary-600" />Contato</h3>
              <div className="text-sm"><span className="text-gray-500">Telefone: </span><span className="font-medium">{associado.telefone || '-'}</span></div>
              <div className="text-sm"><span className="text-gray-500">WhatsApp: </span><span className="font-medium">{associado.whatsapp || '-'}</span></div>
            </div>
            <div className="card space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" />Endereço</h3>
              <p className="text-sm text-gray-700">{endereco || 'Não informado'}</p>
            </div>
            <div className="card space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-accent-600" />Associação</h3>
              <div className="text-sm"><span className="text-gray-500">Entrada: </span>
                <span className="font-medium">{associado.data_entrada ? format(new Date(associado.data_entrada + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'mensalidades' && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Histórico de Mensalidades</h3>
          {mensalidades.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Nenhuma mensalidade registrada</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Mês/Ano</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Valor</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Pagamento</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mensalidades.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{MESES[m.mes - 1]}/{m.ano}</td>
                      <td className="py-2 px-3">R$ {Number(m.valor).toFixed(2)}</td>
                      <td className="py-2 px-3"><span className={m.status === 'Pago' ? 'badge-pago' : 'badge-pendente'}>{m.status}</span></td>
                      <td className="py-2 px-3 text-gray-500">{m.data_pagamento ? format(new Date(m.data_pagamento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                      <td className="py-2 px-3">
                        {m.status === 'Pago' && (
                          <button onClick={() => gerarReciboPDF(m)} className="text-secondary-600 hover:underline text-xs flex items-center gap-1">
                            PDF
                          </button>
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

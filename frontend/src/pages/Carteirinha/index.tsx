import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, Download, Search, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { Associado } from '../../types';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { format, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Carteirinha() {
  const [searchParams] = useSearchParams();
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [associado, setAssociado] = useState<Associado | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [nomeAssociacao, setNomeAssociacao] = useState('Associação Organizada');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoB64, setLogoB64] = useState<string>('');
  const [frenteOuVerso, setFrenteOuVerso] = useState<'frente' | 'verso'>('frente');

  useEffect(() => {
    api.get('/associados/todos').then(r => setAssociados(r.data));
    api.get('/configuracoes').then(r => {
      setNomeAssociacao(r.data.nome_associacao || 'Associação Organizada');
      if (r.data.logo_url) {
        setLogoUrl(r.data.logo_url);
        toBase64(r.data.logo_url).then(setLogoB64);
      } else {
        toBase64('/logo.png').then(setLogoB64);
      }
    });
    const paramId = searchParams.get('id');
    if (paramId) setSelectedId(Number(paramId));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/associados/${selectedId}`).then(async r => {
      setAssociado(r.data);
      const qrUrl = await QRCode.toDataURL(
        JSON.stringify({ numero: r.data.numero, nome: r.data.nome, validade: format(addYears(new Date(), 1), 'dd/MM/yyyy') }),
        { width: 150, margin: 1, color: { dark: '#15803d', light: '#ffffff' } }
      );
      setQrDataUrl(qrUrl);
    });
  }, [selectedId]);

  function toBase64(url: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d')!.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
  }

  const validade = format(addYears(new Date(), 1), 'dd/MM/yyyy');

  const filtrados = associados.filter(a =>
    !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.numero.includes(busca)
  );

  const baixarPDF = async () => {
    if (!associado) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [86, 54] });

    // ═══════ FRENTE ═══════
    // fundo gradiente verde
    doc.setFillColor(21, 128, 61);
    doc.rect(0, 0, 86, 54, 'F');

    // cabeçalho
    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, 86, 16, 'F');

    // logo da associação (cabeçalho)
    if (logoB64) {
      try { doc.addImage(logoB64, 'PNG', 2, 1, 12, 12); } catch {}
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(nomeAssociacao, 44, 7, { align: 'center', maxWidth: 58 });
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text('CARTEIRA DE ASSOCIADO', 44, 12, { align: 'center' });

    // foto do sócio
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(3, 18, 20, 24, 2, 2, 'F');
    if (associado.foto) {
      try { doc.addImage(associado.foto, 'JPEG', 3.5, 18.5, 19, 23); } catch {}
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(16);
      doc.text(associado.nome.charAt(0).toUpperCase(), 13, 33, { align: 'center' });
    }

    // dados do sócio
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const nomeParts = associado.nome.split(' ');
    const nomeDisplay = nomeParts.length > 2 ? `${nomeParts[0]} ${nomeParts[nomeParts.length - 1]}` : associado.nome;
    doc.text(nomeDisplay, 26, 22, { maxWidth: 36 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text(`Nº: ${associado.numero}`, 26, 28);
    doc.text(`CPF: ${associado.cpf || '-'}`, 26, 33);
    doc.text(`Validade: ${validade}`, 26, 38);

    const sc = associado.situacao === 'Ativo' ? [74, 222, 128] : [248, 113, 113];
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.roundedRect(26, 40, 18, 5, 1, 1, 'F');
    doc.setTextColor(0);
    doc.setFontSize(5.5);
    doc.text(associado.situacao, 35, 43.5, { align: 'center' });

    // QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 63, 18, 20, 20);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4.5);
      doc.text('QR de Validação', 73, 40, { align: 'center' });
    }

    // rodapé faixa amarela
    doc.setFillColor(234, 179, 8);
    doc.rect(0, 52, 86, 2, 'F');

    // ═══════ VERSO ═══════
    doc.addPage([86, 54], 'landscape');

    doc.setFillColor(240, 253, 244);
    doc.rect(0, 0, 86, 54, 'F');

    // cabeçalho verso
    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, 86, 12, 'F');
    if (logoB64) {
      try { doc.addImage(logoB64, 'PNG', 1.5, 1, 9, 9); } catch {}
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(nomeAssociacao, 47, 6, { align: 'center', maxWidth: 55 });
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.text('DADOS DO ASSOCIADO', 47, 10, { align: 'center' });

    // dados completos
    const dados: [string, string][] = [
      ['Nome completo', associado.nome],
      ['Nº Associado', associado.numero],
      ['CPF', associado.cpf || '-'],
      ['RG', (associado as any).rg || '-'],
      ['Nasc.', (associado as any).data_nascimento ? format(new Date((associado as any).data_nascimento), 'dd/MM/yyyy') : '-'],
      ['Telefone', associado.telefone || associado.whatsapp || '-'],
      ['Cidade', (associado as any).cidade ? `${(associado as any).cidade}/${(associado as any).estado || ''}` : '-'],
      ['Entrada', (associado as any).data_entrada ? format(new Date((associado as any).data_entrada), 'dd/MM/yyyy') : '-'],
      ['Validade', validade],
      ['Situação', associado.situacao],
    ];

    let col1Y = 15, col2Y = 15;
    const half = Math.ceil(dados.length / 2);
    dados.forEach(([label, valor], i) => {
      const isCol2 = i >= half;
      const x = isCol2 ? 44 : 3;
      const y = isCol2 ? col2Y : col1Y;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(22, 101, 52);
      doc.text(label + ':', x, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(valor, x + doc.getTextWidth(label + ': '), y, { maxWidth: 36 });
      if (isCol2) col2Y += 4.5; else col1Y += 4.5;
    });

    // linha divisória vertical
    doc.setDrawColor(22, 101, 52);
    doc.setLineWidth(0.3);
    doc.line(43, 13, 43, 52);

    // rodapé verso
    doc.setFillColor(234, 179, 8);
    doc.rect(0, 52, 86, 2, 'F');
    doc.setTextColor(100);
    doc.setFontSize(3.5);
    doc.text('Esta carteira é pessoal e intransferível. Em caso de perda, comunique a associação.', 43, 52.8, { align: 'center' });

    doc.save(`carteirinha_${associado.numero}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Carteirinha Digital</h1>
        <p className="text-gray-500 text-sm">Frente e verso com todos os dados do associado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seletor */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">Selecionar Associado</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar por nome ou número..." value={busca} onChange={e => setBusca(e.target.value)} className="input-field pl-9" />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filtrados.map(a => (
              <div key={a.id} onClick={() => setSelectedId(a.id)}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedId === a.id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}>
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                  {a.nome.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.nome}</p>
                  <p className="text-xs text-gray-400 font-mono">{a.numero}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${(a as any).situacao === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {(a as any).situacao}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prévia da carteirinha */}
        <div className="card flex flex-col items-center justify-center">
          {!associado ? (
            <div className="text-center text-gray-400 py-12">
              <BadgeCheck className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>Selecione um associado para visualizar a carteirinha</p>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              {/* Toggle frente/verso */}
              <div className="flex rounded-lg overflow-hidden border border-primary-200 mb-4 w-fit mx-auto">
                <button onClick={() => setFrenteOuVerso('frente')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${frenteOuVerso === 'frente' ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-primary-50'}`}>
                  Frente
                </button>
                <button onClick={() => setFrenteOuVerso('verso')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${frenteOuVerso === 'verso' ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-primary-50'}`}>
                  Verso
                </button>
              </div>

              {frenteOuVerso === 'frente' ? (
                /* FRENTE */
                <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg,#15803d,#166534)' }}>
                  <div className="bg-primary-900 px-4 py-2 flex items-center gap-2">
                    <img src={logoUrl || '/logo.png'} alt="Logo" className="w-7 h-7 rounded-full object-contain bg-white p-0.5 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
                    <div>
                      <p className="text-white font-bold text-xs leading-tight">{nomeAssociacao}</p>
                      <p className="text-primary-300 text-xs">Carteira de Associado</p>
                    </div>
                  </div>
                  <div className="p-4 flex gap-4">
                    <div className="flex-shrink-0">
                      {associado.foto ? (
                        <img src={associado.foto} alt={associado.nome} className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/30" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-primary-400 flex items-center justify-center ring-2 ring-white/30">
                          <span className="text-3xl font-bold text-white">{associado.nome.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-white">
                      <p className="font-bold text-sm leading-tight">{associado.nome}</p>
                      <p className="text-primary-200 text-xs mt-1 font-mono">Nº {associado.numero}</p>
                      <p className="text-primary-200 text-xs">CPF: {associado.cpf || '-'}</p>
                      <p className="text-primary-200 text-xs">Validade: {validade}</p>
                      <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${associado.situacao === 'Ativo' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                        {associado.situacao}
                      </span>
                    </div>
                    {qrDataUrl && (
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <img src={qrDataUrl} alt="QR" className="w-16 h-16 rounded-lg bg-white p-0.5" />
                        <p className="text-primary-300 text-xs mt-1">Validar</p>
                      </div>
                    )}
                  </div>
                  <div className="h-2 bg-accent-400" />
                </div>
              ) : (
                /* VERSO */
                <div className="rounded-2xl overflow-hidden shadow-xl bg-green-50">
                  <div className="bg-primary-900 px-4 py-2 flex items-center gap-2">
                    <img src={logoUrl || '/logo.png'} alt="Logo" className="w-7 h-7 rounded-full object-contain bg-white p-0.5 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
                    <div>
                      <p className="text-white font-bold text-xs">{nomeAssociacao}</p>
                      <p className="text-primary-300 text-xs">Dados do Associado</p>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {[
                      ['Nome', associado.nome],
                      ['Nº Associado', associado.numero],
                      ['CPF', associado.cpf || '-'],
                      ['RG', (associado as any).rg || '-'],
                      ['Nascimento', (associado as any).data_nascimento ? format(new Date((associado as any).data_nascimento), 'dd/MM/yyyy') : '-'],
                      ['Telefone', associado.telefone || associado.whatsapp || '-'],
                      ['Cidade', (associado as any).cidade || '-'],
                      ['Estado Civil', (associado as any).estado_civil || '-'],
                      ['Profissão', (associado as any).profissao || '-'],
                      ['Entrada', (associado as any).data_entrada ? format(new Date((associado as any).data_entrada), 'dd/MM/yyyy') : '-'],
                    ].map(([label, valor]) => (
                      <div key={label}>
                        <p className="text-primary-700 font-semibold text-xs leading-tight">{label}</p>
                        <p className="text-gray-700 truncate">{valor}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-accent-400" />
                </div>
              )}

              <div className="flex gap-3 mt-4 justify-center">
                <button onClick={() => setFrenteOuVerso(f => f === 'frente' ? 'verso' : 'frente')} className="btn-outline text-sm">
                  <RotateCcw className="w-4 h-4" /> Virar
                </button>
                <button onClick={baixarPDF} className="btn-primary text-sm">
                  <Download className="w-4 h-4" /> Baixar PDF (Frente + Verso)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

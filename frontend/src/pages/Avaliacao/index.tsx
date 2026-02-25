import React, { useEffect, useState } from 'react';
import { Star, Send, CheckCircle, TrendingUp, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Avaliacao() {
  const { user } = useAuth();
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mediaData, setMediaData] = useState<{ media: number; total: number } | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/avaliacoes').then(r => setMediaData({ media: r.data.media, total: r.data.total })).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nota) { setErro('Selecione uma nota de 1 a 5 estrelas'); return; }
    setErro('');
    setEnviando(true);
    try {
      await api.post('/avaliacoes', { nota, comentario });
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const labels: Record<number, { text: string; color: string }> = {
    1: { text: 'Muito ruim', color: 'text-red-600' },
    2: { text: 'Ruim', color: 'text-orange-500' },
    3: { text: 'Regular', color: 'text-yellow-500' },
    4: { text: 'Bom', color: 'text-blue-500' },
    5: { text: 'Excelente!', color: 'text-green-600' },
  };

  const starsMedia = Math.round(mediaData?.media || 0);

  if (enviado) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Obrigado pelo Feedback!</h2>
      <div className="flex gap-1 mb-2">
        {[1,2,3,4,5].map(i => <Star key={i} className={`w-7 h-7 ${i <= nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
      </div>
      <p className="text-gray-500 max-w-sm">Sua avaliação foi registrada. Ela nos ajuda a melhorar continuamente o sistema para toda a associação.</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-yellow-100 rounded-xl">
          <Star className="w-7 h-7 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Avaliação do Aplicativo</h1>
          <p className="text-gray-500 text-sm">Sua opinião nos ajuda a melhorar o sistema</p>
        </div>
      </div>

      {/* Média geral */}
      {mediaData && mediaData.total > 0 && (
        <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-500">{Number(mediaData.media).toFixed(1)}</p>
              <div className="flex gap-0.5 justify-center mt-1">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= starsMedia ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
              </div>
            </div>
            <div className="border-l border-yellow-200 pl-4">
              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold">Avaliação Geral</span>
              </div>
              <p className="text-gray-500 text-sm">{mediaData.total} avaliação(ões) registrada(s)</p>
              <p className="text-xs text-gray-400 mt-1">Baseado nos usuários desta associação</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="text-center">
          <p className="font-semibold text-gray-700 mb-1">Olá, {user?.nome?.split(' ')[0]}!</p>
          <p className="text-gray-500 text-sm">Como você avalia o sistema de gestão da sua associação?</p>
        </div>

        {/* Estrelas */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => (
              <button key={i} type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setNota(i)}
                className="transition-transform hover:scale-110 active:scale-95">
                <Star className={`w-12 h-12 transition-colors ${i <= (hover || nota) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`} />
              </button>
            ))}
          </div>
          {(hover || nota) > 0 && (
            <span className={`text-base font-semibold ${labels[hover || nota].color}`}>
              {labels[hover || nota].text}
            </span>
          )}
          {!nota && !hover && <span className="text-gray-400 text-sm">Clique em uma estrela para avaliar</span>}
        </div>

        {/* Comentário */}
        <div>
          <label className="label flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Comentário (opcional)
          </label>
          <textarea
            className="input-field min-h-[100px] resize-none"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Conte o que você mais gosta, o que pode melhorar, sugestões de funcionalidades..."
          />
        </div>

        {/* Aspectos rápidos */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Quais aspectos você avalia bem? (opcional)</p>
          <div className="flex flex-wrap gap-2">
            {['Facilidade de uso', 'Visual moderno', 'Velocidade', 'Relatórios', 'Carteirinha', 'Mensalidades', 'Cadastro de sócios'].map(tag => (
              <button key={tag} type="button"
                onClick={() => setComentario(c => c ? `${c}, ${tag}` : tag)}
                className="px-3 py-1 text-xs rounded-full border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors">
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{erro}</div>
        )}

        <button type="submit" disabled={enviando} className="btn-primary w-full justify-center py-3">
          {enviando ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</span>
          ) : (
            <><Send className="w-4 h-4" /> Enviar Avaliação</>
          )}
        </button>
      </form>
    </div>
  );
}

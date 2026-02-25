import React, { useState } from 'react';
import { Shield, Send, Eye, EyeOff, CheckCircle, AlertTriangle, Phone, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIAS = [
  'Irregularidade financeira',
  'Conduta inadequada de membro',
  'Mau uso de recursos da associação',
  'Descumprimento de estatuto',
  'Assédio ou discriminação',
  'Problema de infraestrutura',
  'Sugestão de melhoria',
  'Outro',
];

export default function Denuncia() {
  const { user } = useAuth();
  const [anonima, setAnonima] = useState(false);
  const [form, setForm] = useState({ tipo: 'geral', categoria: '', descricao: '', nome_denunciante: user?.nome || '', contato: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao.trim()) { setErro('Descreva a denúncia/sugestão'); return; }
    if (!form.categoria) { setErro('Selecione uma categoria'); return; }
    setErro('');
    setEnviando(true);
    try {
      await api.post('/denuncias', { ...form, anonima });
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Denúncia Registrada!</h2>
      <p className="text-gray-500 max-w-md mb-2">
        Sua denúncia foi enviada com sucesso para a diretoria da associação.
        {anonima && ' Sua identidade foi mantida em sigilo.'}
      </p>
      <p className="text-xs text-gray-400 mb-6">Todas as denúncias são tratadas com seriedade e confidencialidade.</p>
      <button onClick={() => { setEnviado(false); setForm({ tipo: 'geral', categoria: '', descricao: '', nome_denunciante: user?.nome || '', contato: '' }); setAnonima(false); }}
        className="btn-primary">
        Nova Denúncia
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-100 rounded-xl">
          <Shield className="w-7 h-7 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Canal de Denúncias</h1>
          <p className="text-gray-500 text-sm">Registre ocorrências, irregularidades ou sugestões com segurança</p>
        </div>
      </div>

      {/* Aviso de segurança */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Sua denúncia é protegida</p>
          <p>Todas as informações são tratadas com sigilo pela diretoria. Você pode denunciar anonimamente ativando a opção abaixo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">

        {/* Modo anônimo */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            {anonima ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-primary-600" />}
            <div>
              <p className="font-semibold text-gray-700 text-sm">Denúncia Anônima</p>
              <p className="text-gray-400 text-xs">{anonima ? 'Sua identidade não será revelada' : 'Sua identidade será registrada'}</p>
            </div>
          </div>
          <button type="button" onClick={() => setAnonima(a => !a)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${anonima ? 'bg-primary-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${anonima ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Campos identificação (só se não anônimo) */}
        {!anonima && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Nome</label>
              <input className="input-field" value={form.nome_denunciante} onChange={e => set('nome_denunciante', e.target.value)} placeholder="Seu nome completo" />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contato (opcional)</label>
              <input className="input-field" value={form.contato} onChange={e => set('contato', e.target.value)} placeholder="Telefone ou e-mail" />
            </div>
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="label">Categoria *</label>
          <select className={`input-field ${!form.categoria && erro ? 'border-red-400' : ''}`} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            <option value="">Selecione uma categoria...</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Descrição */}
        <div>
          <label className="label">Descrição detalhada *</label>
          <textarea
            className={`input-field min-h-[140px] resize-none ${!form.descricao && erro ? 'border-red-400' : ''}`}
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
            placeholder="Descreva com detalhes o ocorrido: o que, quando, onde, quem estava envolvido..."
          />
          <p className="text-xs text-gray-400 mt-1">{form.descricao.length} caracteres</p>
        </div>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}

        <button type="submit" disabled={enviando} className="btn-primary w-full justify-center py-3">
          {enviando ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</span>
          ) : (
            <><Send className="w-4 h-4" /> Enviar Denúncia</>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400">
        Este canal é exclusivo para membros da associação. Denúncias falsas podem resultar em penalidades conforme o estatuto.
      </p>
    </div>
  );
}

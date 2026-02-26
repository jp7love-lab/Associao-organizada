import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [telaRecuperar, setTelaRecuperar] = useState(false);

  // Campos recuperação de senha
  const [recUsername, setRecUsername] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recNovaSenha, setRecNovaSenha] = useState('');
  const [recMsg, setRecMsg] = useState('');
  const [recErro, setRecErro] = useState('');
  const [recLoading, setRecLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecErro('');
    setRecMsg('');
    setRecLoading(true);
    try {
      const res = await api.post('/auth/recuperar-senha', {
        username: recUsername,
        email_associacao: recEmail,
        nova_senha: recNovaSenha
      });
      setRecMsg(res.data.message);
      setTimeout(() => { setTelaRecuperar(false); setRecMsg(''); }, 3000);
    } catch (e: any) {
      setRecErro(e.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setRecLoading(false);
    }
  };

  if (telaRecuperar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-secondary-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4 p-2">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary-600" /> Redefinir Senha
            </h2>
            <p className="text-sm text-gray-500 mb-5">Informe seu usuário e o e-mail cadastrado da associação para criar uma nova senha.</p>

            {recErro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{recErro}</div>}
            {recMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{recMsg}</div>}

            <form onSubmit={handleRecuperar} className="space-y-4">
              <div>
                <label className="label">Usuário</label>
                <input type="text" value={recUsername} onChange={e => setRecUsername(e.target.value)}
                  className="input-field" placeholder="Seu nome de usuário" required />
              </div>
              <div>
                <label className="label">E-mail da Associação</label>
                <input type="email" value={recEmail} onChange={e => setRecEmail(e.target.value)}
                  className="input-field" placeholder="email@suaassociacao.com" required />
              </div>
              <div>
                <label className="label">Nova Senha</label>
                <input type="password" value={recNovaSenha} onChange={e => setRecNovaSenha(e.target.value)}
                  className="input-field" placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
              <button type="submit" disabled={recLoading} className="w-full btn-primary justify-center py-3 text-base">
                <KeyRound className="w-5 h-5" />
                {recLoading ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>
            </form>

            <button onClick={() => setTelaRecuperar(false)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-secondary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white rounded-2xl shadow-xl mb-4 p-2">
            <img src="/logo.png" alt="Associação Organizada" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Associação Organizada</h1>
          <p className="text-primary-200 mt-1 text-sm">Gestão Inteligente para Associações</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Entrar no Sistema</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Usuário</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="input-field" placeholder="Seu nome de usuário" required autoFocus />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="Sua senha" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3 text-base">
              <LogIn className="w-5 h-5" />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => setTelaRecuperar(true)}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 mx-auto">
              <KeyRound className="w-3 h-3" /> Esqueci minha senha
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-3">Sua associação ainda não está cadastrada?</p>
            <Link to="/cadastro"
              className="inline-flex items-center gap-2 bg-accent-50 border border-accent-300 text-accent-700 hover:bg-accent-100 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm w-full justify-center">
              <UserPlus className="w-4 h-4" />
              Cadastrar Minha Associação
            </Link>
          </div>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          Sistema protegido conforme LGPD · © 2024
        </p>
      </div>
    </div>
  );
}

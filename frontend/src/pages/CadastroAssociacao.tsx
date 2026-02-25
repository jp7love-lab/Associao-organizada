import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Leaf, Eye, EyeOff, Building2, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface FormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  nomeAdmin: string;
  username: string;
  senha: string;
  confirmarSenha: string;
}

export default function CadastroAssociacao() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [etapa, setEtapa] = useState<1 | 2>(1);

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>();
  const senha = watch('senha');

  const avancarEtapa = async () => {
    const valid = await trigger(['nome', 'cnpj', 'email', 'telefone', 'cidade', 'estado']);
    if (valid) setEtapa(2);
  };

  const onSubmit = async (data: FormData) => {
    if (data.senha !== data.confirmarSenha) {
      setErro('As senhas não conferem');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const r = await api.post('/associacoes/cadastro', {
        nome: data.nome,
        cnpj: data.cnpj,
        email: data.email,
        telefone: data.telefone,
        cidade: data.cidade,
        estado: data.estado,
        nomeAdmin: data.nomeAdmin,
        username: data.username,
        senha: data.senha
      });
      loginWithToken(r.data.token, r.data.user);
      navigate('/');
    } catch (e: any) {
      setErro(e.response?.data?.error || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-secondary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-3">
            <Leaf className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">AMFAC</h1>
          <p className="text-primary-200 text-sm">Plataforma de Gestão de Associações</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Cadastrar Associação</h2>
              <p className="text-gray-500 text-sm">Etapa {etapa} de 2</p>
            </div>
            <div className="flex gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${etapa >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${etapa >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {etapa === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-700">Dados da Associação</h3>
                </div>

                <div>
                  <label className="label">Nome da Associação <span className="text-red-500">*</span></label>
                  <input className={`input-field ${errors.nome ? 'border-red-400' : ''}`}
                    placeholder="Ex: Associação de Moradores do Bairro..."
                    {...register('nome', { required: 'Nome obrigatório' })} />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">CNPJ</label>
                    <input className="input-field" placeholder="00.000.000/0001-00" {...register('cnpj')} />
                  </div>
                  <div>
                    <label className="label">Telefone <span className="text-red-500">*</span></label>
                    <input className={`input-field ${errors.telefone ? 'border-red-400' : ''}`}
                      placeholder="(00) 00000-0000"
                      {...register('telefone', { required: 'Telefone obrigatório' })} />
                  </div>
                </div>

                <div>
                  <label className="label">E-mail <span className="text-red-500">*</span></label>
                  <input type="email" className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="contato@suaassociacao.com"
                    {...register('email', { required: 'E-mail obrigatório' })} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Cidade <span className="text-red-500">*</span></label>
                    <input className={`input-field ${errors.cidade ? 'border-red-400' : ''}`}
                      {...register('cidade', { required: 'Cidade obrigatória' })} />
                  </div>
                  <div>
                    <label className="label">Estado <span className="text-red-500">*</span></label>
                    <select className={`input-field ${errors.estado ? 'border-red-400' : ''}`}
                      {...register('estado', { required: 'Estado obrigatório' })}>
                      <option value="">UF</option>
                      {ESTADOS_BR.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-primary-50 rounded-lg p-3 text-sm text-primary-700">
                  <p className="font-semibold mb-1">Plano Gratuito inclui:</p>
                  <p>• Até <strong>1.000 sócios</strong> cadastrados</p>
                  <p>• Carteirinhas digitais com QR Code</p>
                  <p>• Relatórios e exportação Excel/PDF</p>
                  <p>• Backup automático diário</p>
                </div>

                <button type="button" onClick={avancarEtapa} className="w-full btn-primary justify-center py-3">
                  Continuar
                </button>
              </div>
            )}

            {etapa === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-700">Conta do Administrador</h3>
                </div>

                <div>
                  <label className="label">Nome do Responsável <span className="text-red-500">*</span></label>
                  <input className={`input-field ${errors.nomeAdmin ? 'border-red-400' : ''}`}
                    placeholder="Nome completo"
                    {...register('nomeAdmin', { required: 'Nome obrigatório' })} />
                </div>

                <div>
                  <label className="label">Nome de Usuário <span className="text-red-500">*</span></label>
                  <input className={`input-field ${errors.username ? 'border-red-400' : ''}`}
                    placeholder="Ex: admin_associacao"
                    {...register('username', {
                      required: 'Usuário obrigatório',
                      minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                      pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Apenas letras, números e _' }
                    })} />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                </div>

                <div>
                  <label className="label">Senha <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'}
                      className={`input-field pr-10 ${errors.senha ? 'border-red-400' : ''}`}
                      placeholder="Mínimo 6 caracteres"
                      {...register('senha', { required: 'Senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
                </div>

                <div>
                  <label className="label">Confirmar Senha <span className="text-red-500">*</span></label>
                  <input type="password"
                    className={`input-field ${errors.confirmarSenha ? 'border-red-400' : ''}`}
                    placeholder="Repita a senha"
                    {...register('confirmarSenha', {
                      required: 'Confirme a senha',
                      validate: v => v === senha || 'As senhas não conferem'
                    })} />
                  {errors.confirmarSenha && <p className="text-red-500 text-xs mt-1">{errors.confirmarSenha.message}</p>}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setEtapa(1)}
                    className="btn-outline flex-1 justify-center">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button type="submit" disabled={loading}
                    className="btn-primary flex-1 justify-center py-3">
                    <CheckCircle className="w-4 h-4" />
                    {loading ? 'Cadastrando...' : 'Criar Associação'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem cadastro?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Fazer login</Link>
          </p>
        </div>

        <p className="text-center text-primary-300 text-xs mt-4">
          Sistema seguro · LGPD · AMFAC © 2024
        </p>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Camera, User } from 'lucide-react';
import api from '../../services/api';

const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];
const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface FormData {
  nome: string; cpf: string; rg: string; data_nascimento: string;
  nome_mae: string; nome_pai: string;
  cep: string; logradouro: string; numero_end: string; complemento: string;
  bairro: string; cidade: string; estado: string;
  telefone: string; whatsapp: string;
  estado_civil: string; profissao: string; nis: string;
  data_entrada: string; situacao: string; observacoes: string;
}

export default function CadastroAssociado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { situacao: 'Ativo', data_entrada: new Date().toISOString().split('T')[0] }
  });

  useEffect(() => {
    if (isEditing) {
      api.get(`/associados/${id}`).then(r => {
        const a = r.data;
        Object.keys(a).forEach(k => setValue(k as any, a[k] || ''));
        if (a.foto) setFotoPreview(a.foto);
      });
    }
  }, [id]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const buscarCep = async (cep: string) => {
    const c = cep.replace(/\D/g, '');
    if (c.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
      const data = await r.json();
      if (!data.erro) {
        setValue('logradouro', data.logradouro);
        setValue('bairro', data.bairro);
        setValue('cidade', data.localidade);
        setValue('estado', data.uf);
      }
    } catch {}
    setLoadingCep(false);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, v || ''));
      if (fotoFile) formData.append('foto', fotoFile);

      if (isEditing) {
        await api.put(`/associados/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/associados', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/associados');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', required = false, col = 1, ...rest }: any) => (
    <div className={col === 2 ? 'md:col-span-2' : ''}>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input
        type={type}
        className={`input-field ${(errors as any)[name] ? 'border-red-400' : ''}`}
        {...register(name, required ? { required: `${label} é obrigatório` } : {})}
        {...rest}
      />
      {(errors as any)[name] && <p className="text-red-500 text-xs mt-1">{(errors as any)[name]?.message as string}</p>}
    </div>
  );

  const Select = ({ label, name, options, required = false }: any) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <select
        className={`input-field ${(errors as any)[name] ? 'border-red-400' : ''}`}
        {...register(name, required ? { required: `${label} é obrigatório` } : {})}
      >
        <option value="">Selecione...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEditing ? 'Editar Associado' : 'Novo Associado'}</h1>
          <p className="text-gray-500 text-sm">Preencha os dados do associado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4 border-b pb-2">Foto do Associado</h2>
          <div className="flex items-center gap-5">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-dashed border-primary-300 flex items-center justify-center cursor-pointer hover:border-primary-500 overflow-hidden transition-colors bg-primary-50"
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-primary-400">
                  <Camera className="w-7 h-7 mx-auto" />
                  <span className="text-xs">Foto</span>
                </div>
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-sm">
                <Camera className="w-4 h-4" />
                {fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG até 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4 border-b pb-2">Dados Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome Completo" name="nome" required col={2} />
            <Field label="CPF" name="cpf" required placeholder="000.000.000-00" />
            <Field label="RG" name="rg" />
            <Field label="Data de Nascimento" name="data_nascimento" type="date" />
            <Field label="Nome da Mãe" name="nome_mae" required col={2} />
            <Field label="Nome do Pai" name="nome_pai" col={2} />
            <Select label="Estado Civil" name="estado_civil" options={ESTADOS_CIVIS} />
            <Field label="Profissão" name="profissao" />
            <Field label="NIS" name="nis" placeholder="Número do NIS (se tiver)" />
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4 border-b pb-2">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">CEP</label>
              <input
                type="text"
                className="input-field"
                placeholder="00000-000"
                {...register('cep')}
                onBlur={e => buscarCep(e.target.value)}
              />
              {loadingCep && <p className="text-xs text-primary-500 mt-1">Buscando CEP...</p>}
            </div>
            <Field label="Logradouro" name="logradouro" />
            <Field label="Número" name="numero_end" />
            <Field label="Complemento" name="complemento" />
            <Field label="Bairro" name="bairro" />
            <Field label="Cidade" name="cidade" />
            <div>
              <label className="label">Estado</label>
              <select className="input-field" {...register('estado')}>
                <option value="">Selecione...</option>
                {ESTADOS_BR.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4 border-b pb-2">Contato e Associação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Telefone" name="telefone" placeholder="(00) 00000-0000" />
            <Field label="WhatsApp" name="whatsapp" placeholder="(00) 00000-0000" />
            <Field label="Data de Entrada" name="data_entrada" type="date" required />
            <div>
              <label className="label">Situação <span className="text-red-500">*</span></label>
              <select className="input-field" {...register('situacao')}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Observações</label>
              <textarea rows={3} className="input-field resize-none" {...register('observacoes')} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Associado'}
          </button>
        </div>
      </form>
    </div>
  );
}

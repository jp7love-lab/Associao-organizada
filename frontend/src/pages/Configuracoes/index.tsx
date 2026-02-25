import React, { useEffect, useState, useRef } from 'react';
import {
  Settings, Save, DollarSign, Building2, Camera, Upload,
  HardDrive, Download, RefreshCw, CheckCircle, X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Configuracoes() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [backups, setBackups] = useState<string[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/configuracoes').then(r => {
      setConfigs(r.data);
      setLogoPreview(r.data.logo_url ? r.data.logo_url + '?t=' + Date.now() : '');
      setLoading(false);
    });
    api.get('/configuracoes/backups').then(r => setBackups(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await api.put('/configuracoes', configs);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    setUploadingLogo(true);
    const form = new FormData();
    form.append('logo', file);
    try {
      await api.post('/configuracoes/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBackup = async () => {
    const r = await api.post('/configuracoes/backup');
    alert(r.data.message);
    const r2 = await api.get('/configuracoes/backups');
    setBackups(r2.data);
  };

  const set = (k: string, v: string) => setConfigs(prev => ({ ...prev, [k]: v }));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
          <p className="text-gray-500 text-sm">Gerencie os dados da sua associação</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* VALOR DA MENSALIDADE — destaque */}
      <div className="card border-2 border-primary-200 bg-primary-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-600 rounded-xl">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-900">Valor da Mensalidade</h2>
            <p className="text-primary-700 text-sm">Valor cobrado mensalmente de cada sócio ativo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary-700">R$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={configs.valor_mensalidade || '30.00'}
            onChange={e => set('valor_mensalidade', e.target.value)}
            className="input-field text-2xl font-bold text-primary-900 max-w-[180px]"
            placeholder="0,00"
          />
          <span className="text-primary-600 text-sm">/ mês por sócio</span>
        </div>
      </div>

      {/* LOGO / FOTO DA ASSOCIAÇÃO */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-secondary-100 rounded-xl">
            <Camera className="w-5 h-5 text-secondary-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Logo da Associação</h2>
            <p className="text-gray-500 text-sm">Aparece no menu lateral, tela de login e carteirinhas</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl border-4 border-primary-200 bg-gray-50 overflow-hidden flex items-center justify-center shadow-sm">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-300">
                  <Building2 className="w-10 h-10 mx-auto mb-1" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
            {uploadingLogo && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">Formatos: JPG, PNG, GIF, WEBP<br />Tamanho máximo: 5 MB</p>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            <button onClick={() => logoInputRef.current?.click()} className="btn-primary text-sm" disabled={uploadingLogo}>
              <Upload className="w-4 h-4" />
              {uploadingLogo ? 'Enviando...' : logoPreview ? 'Trocar Logo' : 'Enviar Logo'}
            </button>
            {logoPreview && (
              <button onClick={() => setLogoPreview('')} className="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50">
                <X className="w-4 h-4" /> Remover preview
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DADOS DA ASSOCIAÇÃO */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-primary-100 rounded-xl">
            <Building2 className="w-5 h-5 text-primary-700" />
          </div>
          <h2 className="text-base font-bold text-gray-800">Dados da Associação</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nome da Associação</label>
            <input className="input-field" value={configs.nome_associacao || ''} onChange={e => set('nome_associacao', e.target.value)} />
          </div>
          <div>
            <label className="label">CNPJ</label>
            <input className="input-field" placeholder="00.000.000/0001-00" value={configs.cnpj_associacao || ''} onChange={e => set('cnpj_associacao', e.target.value)} />
          </div>
          <div>
            <label className="label">Presidente / Responsável</label>
            <input className="input-field" value={configs.presidente || ''} onChange={e => set('presidente', e.target.value)} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input-field" value={configs.telefone_associacao || ''} onChange={e => set('telefone_associacao', e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input-field" type="email" value={configs.email_associacao || ''} onChange={e => set('email_associacao', e.target.value)} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input-field" value={configs.cidade_associacao || ''} onChange={e => set('cidade_associacao', e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <input className="input-field" value={configs.estado_associacao || ''} onChange={e => set('estado_associacao', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Endereço completo</label>
            <input className="input-field" value={configs.endereco_associacao || ''} onChange={e => set('endereco_associacao', e.target.value)} />
          </div>
          <div>
            <label className="label">Limite de Sócios</label>
            <input className="input-field bg-gray-50" value={configs.limite_socios || '1000'} readOnly title="Definido no cadastro da associação" />
          </div>
        </div>
      </div>

      {/* BACKUP */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-accent-100 rounded-xl">
            <HardDrive className="w-5 h-5 text-accent-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Backup do Banco de Dados</h2>
            <p className="text-gray-500 text-sm">Faça backup e restaure seus dados com segurança</p>
          </div>
        </div>
        <button onClick={handleBackup} className="btn-primary mb-4">
          <HardDrive className="w-4 h-4" /> Fazer Backup Agora
        </button>
        {backups.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Backups disponíveis:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {backups.map((b, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600 font-mono">{b}</span>
                  <a href={`/api/configuracoes/backup/${b}`} download className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title="Baixar">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

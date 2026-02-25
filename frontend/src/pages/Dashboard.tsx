import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CreditCard, AlertTriangle, TrendingUp,
  UserPlus, DollarSign, Building2, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import api from '../services/api';
import { DashboardData } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/relatorios/dashboard').then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  if (!data) return null;

  const percentualCapacidade = Math.round((data.totalAssociados / (data.limite || 1000)) * 100);
  const chartData = MESES.map((mes, i) => {
    const item = data.pagamentosPorMes.find(p => p.mes === i + 1);
    return { mes, valor: item?.total || 0, qtd: item?.qtd || 0 };
  });

  const cards = [
    { title: 'Sócios Ativos', value: data.totalAtivos, icon: Users, color: 'text-primary-700', bg: 'bg-primary-100', sub: `${data.totalInativos} inativos` },
    { title: 'Arrecadado no Mês', value: `R$ ${Number(data.arrecadadoMes).toFixed(2)}`, icon: DollarSign, color: 'text-secondary-700', bg: 'bg-secondary-100', sub: `R$ ${Number(data.pendenteMes).toFixed(2)} pendente` },
    { title: 'Inadimplentes', value: data.inadimplentes, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100', sub: 'com pendências' },
    { title: 'Novos este Mês', value: data.novosMes, icon: UserPlus, color: 'text-accent-700', bg: 'bg-accent-100', sub: 'novos sócios' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Painel</h1>
          <p className="text-gray-500 text-sm">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 px-3 py-2 rounded-lg">
          <Building2 className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">{user?.associacao_nome}</span>
        </div>
      </div>

      {/* Barra de capacidade */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-semibold text-gray-700">Capacidade de Sócios</span>
          </div>
          <span className="text-sm text-gray-500">
            <span className="font-bold text-primary-700">{data.totalAssociados}</span> / {data.limite || 1000}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${percentualCapacidade > 90 ? 'bg-red-500' : percentualCapacidade > 70 ? 'bg-accent-500' : 'bg-primary-500'}`}
            style={{ width: `${Math.min(percentualCapacidade, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{percentualCapacidade}% utilizado</span>
          <span className="text-xs text-gray-400">{(data.limite || 1000) - data.totalAssociados} vagas disponíveis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <Icon className={`w-7 h-7 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Arrecadação Mensal ({new Date().getFullYear()})</h2>
          <ResponsiveContainer width="100%" height={220}>
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
          <h2 className="text-base font-semibold text-gray-700 mb-4">Pagamentos por Mês</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="qtd" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Pagamentos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/associados/novo" className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
            <UserPlus className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Novo Sócio</p>
            <p className="text-xs text-gray-400">Cadastrar novo membro</p>
          </div>
        </Link>
        <Link to="/mensalidades" className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="p-3 bg-secondary-100 rounded-xl group-hover:bg-secondary-200 transition-colors">
            <CreditCard className="w-6 h-6 text-secondary-700" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Mensalidades</p>
            <p className="text-xs text-gray-400">Gerenciar pagamentos</p>
          </div>
        </Link>
        <Link to="/relatorios" className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="p-3 bg-accent-100 rounded-xl group-hover:bg-accent-200 transition-colors">
            <TrendingUp className="w-6 h-6 text-accent-700" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Relatórios</p>
            <p className="text-xs text-gray-400">Ver relatórios</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

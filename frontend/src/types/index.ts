export interface User {
  id: number;
  username: string;
  nome: string;
  role: 'admin' | 'secretario';
  associacao_id: number;
  associacao_nome: string;
  limite_socios: number;
}

export interface Associacao {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  endereco: string;
  presidente: string;
  logo: string | null;
  limite_socios: number;
  status: string;
  created_at: string;
}

export interface Associado {
  id: number;
  associacao_id: number;
  numero: string;
  nome: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  nome_mae: string;
  nome_pai: string;
  cep: string;
  logradouro: string;
  numero_end: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefone: string;
  whatsapp: string;
  estado_civil: string;
  profissao: string;
  nis: string;
  data_entrada: string;
  situacao: 'Ativo' | 'Inativo';
  foto: string | null;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface Mensalidade {
  id: number;
  associacao_id: number;
  associado_id: number;
  associado_nome?: string;
  associado_numero?: string;
  mes: number;
  ano: number;
  valor: number;
  data_pagamento: string | null;
  status: 'Pago' | 'Pendente';
  recibo_numero: string | null;
  observacao: string;
  created_at: string;
}

export interface DashboardData {
  totalAtivos: number;
  totalInativos: number;
  totalAssociados: number;
  limite: number;
  arrecadadoMes: number;
  pendenteMes: number;
  inadimplentes: number;
  novosMes: number;
  pagamentosPorMes: Array<{ mes: number; ano: number; total: number; qtd: number }>;
  associadosPorMes: Array<{ mes: string; qtd: number }>;
}

export interface Configuracoes {
  valor_mensalidade: string;
  nome_associacao: string;
  cnpj_associacao: string;
  endereco_associacao: string;
  telefone_associacao: string;
  email_associacao: string;
  cidade_associacao: string;
  estado_associacao: string;
  presidente: string;
  limite_socios: string;
}

export interface Inadimplente {
  id: number;
  numero: string;
  nome: string;
  telefone: string;
  whatsapp: string;
  meses_pendentes: number;
  total_devido: number;
}

export interface Capacidade {
  total: number;
  ativos: number;
  limite: number;
  disponivel: number;
  percentual: number;
}

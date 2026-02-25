# Plataforma de Gestão de Associações

Sistema web multi-tenant completo para gestão de associados, controle de mensalidades, geração de carteirinhas digitais e relatórios. Cada associação se cadastra de forma independente e gerencia até **1.000 sócios**.

---

## Funcionalidades

- **Cadastro de associação** — cada associação cria sua própria conta (multi-tenant)
- **Login seguro** com perfis Administrador e Secretário
- **Cadastro completo de sócios** com foto, dados pessoais, endereço (busca automática por CEP)
- **Controle de mensalidades** com geração em lote, registro de pagamento e histórico
- **Emissão de recibos** em PDF com nome da associação
- **Carteirinha digital** com QR Code para validação, exportável em PDF
- **Relatórios** financeiros, lista de inadimplentes com link direto para WhatsApp
- **Dashboard** com gráficos de arrecadação e barra de capacidade de sócios
- **Exportação** para PDF e Excel
- **Backup automático** diário do banco de dados
- **Interface responsiva** — funciona em celular e computador

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Banco de dados | SQLite (via node-sqlite3-wasm) |
| Autenticação | JWT + bcrypt |
| PDF | jsPDF + jspdf-autotable |
| Gráficos | Recharts |
| Excel | ExcelJS |

---

## Instalação

### Pré-requisitos
- **Node.js v18+** ([https://nodejs.org](https://nodejs.org))

### Passos

**1. Instalar dependências do backend:**
```bash
cd backend
npm install
```

**2. Instalar dependências do frontend:**
```bash
cd ../frontend
npm install
```

---

## Executar o sistema

### Windows (duplo clique):
Execute o arquivo **`iniciar.bat`** na raiz do projeto.

### Linux/Mac:
```bash
chmod +x iniciar.sh
./iniciar.sh
```

### Manualmente (dois terminais):

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Acesse: **http://localhost:5173**

---

## Primeiro Acesso

1. Acesse **http://localhost:5173**
2. Clique em **"Cadastrar Minha Associação"**
3. Preencha os dados da associação (Etapa 1)
4. Crie a conta do administrador (Etapa 2)
5. Faça login e comece a cadastrar sócios

> Cada associação é totalmente independente. Os dados de uma associação não são visíveis para outra.

---

## Estrutura de Pastas

```
aplicativo AMFAC/
├── backend/
│   ├── src/
│   │   ├── routes/          # Rotas da API
│   │   │   ├── associacoes.ts   # Cadastro público de associações
│   │   │   ├── auth.ts          # Login e senha
│   │   │   ├── associados.ts    # CRUD de sócios
│   │   │   ├── mensalidades.ts  # Controle de mensalidades
│   │   │   ├── relatorios.ts    # Relatórios e exportação
│   │   │   └── configuracoes.ts # Configurações e backup
│   │   ├── middleware/
│   │   │   └── auth.ts          # Middleware JWT multi-tenant
│   │   └── database.ts          # Banco de dados SQLite
│   └── data/
│       └── amfac.db             # Arquivo SQLite (criado automaticamente)
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── CadastroAssociacao.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Associados/
│       │   ├── Mensalidades/
│       │   ├── Carteirinha/
│       │   ├── Relatorios/
│       │   └── Configuracoes/
│       ├── context/
│       │   └── AuthContext.tsx
│       └── services/
│           └── api.ts
│
├── iniciar.bat    # Iniciar no Windows
├── iniciar.sh     # Iniciar no Linux/Mac
└── README.md
```

---

## API Endpoints

### Públicos (sem autenticação)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/associacoes/cadastro` | Registrar nova associação |
| POST | `/api/auth/login` | Login |

### Protegidos (requer JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/associados` | Listar sócios (paginado) |
| POST | `/api/associados` | Cadastrar sócio |
| GET | `/api/associados/:id` | Detalhes do sócio |
| PUT | `/api/associados/:id` | Editar sócio |
| DELETE | `/api/associados/:id` | Excluir sócio |
| GET | `/api/mensalidades` | Listar mensalidades |
| POST | `/api/mensalidades/gerar-mes` | Gerar mensalidades do mês |
| POST | `/api/mensalidades/:id/pagar` | Registrar pagamento |
| GET | `/api/relatorios/dashboard` | Dados do painel |
| GET | `/api/relatorios/exportar-excel` | Exportar sócios (Excel) |
| GET | `/api/configuracoes` | Dados da associação |
| PUT | `/api/configuracoes` | Salvar configurações |
| POST | `/api/configuracoes/backup` | Fazer backup |

---

## Segurança

- Autenticação via **JWT** com expiração de 8 horas
- Senhas armazenadas com **bcrypt** (salt rounds: 10)
- Isolamento total de dados por `associacao_id` (multi-tenant)
- Conformidade com **LGPD**
- Acesso restrito por nível de usuário (admin / secretário)

---

## Perfis de Usuário

| Funcionalidade | Administrador | Secretário |
|---------------|:---:|:---:|
| Cadastrar sócios | ✅ | ✅ |
| Editar sócios | ✅ | ✅ |
| Excluir sócios | ✅ | ❌ |
| Registrar pagamentos | ✅ | ✅ |
| Cancelar pagamentos | ✅ | ❌ |
| Gerar mensalidades do mês | ✅ | ❌ |
| Ver relatórios | ✅ | ✅ |
| Alterar configurações | ✅ | ❌ |
| Fazer backup | ✅ | ❌ |

---

## Limite de Sócios

- Cada associação tem capacidade para **até 1.000 sócios**
- O dashboard e a tela de sócios exibem uma barra de capacidade
- Ao atingir o limite, o sistema bloqueia novos cadastros

---

## Backup

- Backup manual disponível em **Configurações > Backup**
- Arquivos salvos em `backend/backups/`
- Download do arquivo `.db` disponível diretamente pela interface

---

## Hospedagem

Para hospedar em produção:

1. **Backend**: qualquer servidor Node.js (Railway, Render, VPS)
2. **Frontend**: Vercel, Netlify, ou servir como arquivos estáticos via `npm run build`
3. **Banco de dados**: o SQLite é local — em produção, considere migrar para PostgreSQL

---

## Suporte

Sistema desenvolvido para associações rurais e de moradores.
Interface simples, responsiva e otimizada para internet rural.

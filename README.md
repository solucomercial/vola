# ✈️ VOLA - Gestão Inteligente de Viagens Corporativas

O **VOLA** é uma plataforma robusta de gerenciamento de viagens corporativas projetada para simplificar a reserva de voos, hotéis e aluguel de carros, integrando um fluxo de aprovação assíncrona e análise inteligente de custos.

---

## 📑 Índice

1. [🎯 Visão Geral](#-visão-geral)
2. [✨ Características Principais](#-características-principais)
3. [🏗️ Arquitetura](#️-arquitetura)
4. [📋 Pré-requisitos](#-pré-requisitos)
5. [🚀 Instalação](#-instalação)
6. [⚙️ Configuração](#️-configuração)
7. [🎮 Executar o Projeto](#-executar-o-projeto)
8. [📁 Estrutura de Arquivos](#-estrutura-de-arquivos)
9. [🔄 Fluxo de Trabalho](#-fluxo-de-trabalho)
10. [🗄️ Banco de Dados](#️-banco-de-dados)
11. [🔌 API](#-api)
12. [🧩 Componentes Principais](#-componentes-principais)
13. [🚀 Recursos Avançados](#-recursos-avançados)
14. [🛠️ Desenvolvimento](#️-desenvolvimento)
15. [🆘 Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

O projeto utiliza **Next.js 15** com a App Router para oferecer uma experiência de usuário fluida e performática. A stack tecnológica foca em tipagem estática rigorosa com **TypeScript** e persistência de dados eficiente com **Drizzle ORM** sobre **PostgreSQL**.

---

## ✨ Características Principais

* **Busca Split de Voos:** Estratégia inovadora que separa ida e volta para garantir os melhores preços e maior disponibilidade.
* **Gestão Multi-Serviço:** Interface unificada para voos, hotéis e aluguel de carros.
* **Aprovação Assíncrona via Email:** Fluxo de aprovação direto pelo email (via Resend) com botões de ação (Aprovar/Rejeitar).
* **Dashboard de Análise:** Gráficos interativos para visualização de gastos e métricas de viagem.
* **Análise de Emissões de Carbono:** Dados sobre impacto ambiental integrados nos resultados de voos.
* **Sistema de Notificações:** Alertas em tempo real para alterações de status em solicitações.
* **Role-Based Access Control (RBAC):** Níveis de acesso para Solicitantes, Aprovadores, Compradores e Admins.

---

## 🏗️ Arquitetura

A aplicação segue uma arquitetura em camadas para separação de responsabilidades:

```text
┌─────────────────────────────────────────────────────────┐
│              UI Layer (React + Tailwind CSS)            │
│       Components | Hooks | Context | App Router         │
├─────────────────────────────────────────────────────────┤
│            Business Layer (Server Actions)              │
│       Travel Logic | Approvals | Notification Logic     │
├─────────────────────────────────────────────────────────┤
│            Data Layer (Drizzle ORM + PG)                │
│       Schema | Migrations | Relations | Seed            │
├─────────────────────────────────────────────────────────┤
│           External APIs (SerpApi, RapidAPI)             │
│       Flights | Hotels | Cars | Email (Resend)          │
└─────────────────────────────────────────────────────────┘

```

---

## 📋 Pré-requisitos

* Node.js 20.x ou superior
* PostgreSQL 15+
* Chave de API da **SerpApi** (para voos e hotéis)
* Chave de API da **RapidAPI** (https://www.google.com/search?q=Booking.com para carros)
* Conta no **Resend** (para envio de emails)

---

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/solucomercial/vola.git
cd vola

```


2. Instale as dependências:
```bash
npm install

```


3. Prepare o banco de dados:
```bash
npm run db:push
npm run db:seed

```



---

## ⚙️ Configuração

Crie um arquivo `.env.local` na raiz do projeto com as seguintes chaves:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `SERPAPI_KEY` | Chave de acesso à SerpApi |
| `RAPIDAPI_KEY` | Chave de acesso à RapidAPI |
| `RESEND_API_KEY` | Chave de API do serviço Resend |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação (ex: http://localhost:3000) |

---

## 🎮 Executar o Projeto

**Desenvolvimento:**

```bash
npm run dev

```

**Produção:**

```bash
npm run build
npm run start

```

---

## 📁 Estrutura de Arquivos

```text
vola/
├── app/               # Rotas Next.js (Pages, API, Actions)
├── components/        # Componentes UI (RadixUI + Shadcn)
├── context/           # Provedores de estado global
├── db/                # Schema, migrações e seeds do Drizzle
├── hooks/             # Hooks customizados (ex: useFlightSplitSearch)
├── lib/               # Lógica de integração com APIs externas
├── types/             # Definições de tipos TypeScript
└── public/            # Ativos estáticos (imagens, logos)

```

---

## 🔄 Fluxo de Trabalho

1. **Solicitação:** O usuário busca e seleciona opções de viagem no frontend.
2. **Aprovação:** O sistema envia um email para o aprovador com os detalhes e links de aprovação rápida.
3. **Compra:** Após aprovada, a solicitação é encaminhada ao comprador para emissão final.

---

## 🗄️ Banco de Dados

O schema é gerenciado pelo Drizzle e inclui as seguintes tabelas principais:

* **users:** Dados de perfil e funções (requester, approver, buyer, admin).
* **travel_requests:** Registro detalhado de solicitações, opções selecionadas e status.
* **notifications:** Histórico de alertas para os usuários.

---

## 🔌 API

Endpoints principais disponíveis em `/app/api/`:

* `POST /api/flights/search-split`: Executa a busca de voos em duas etapas.
* `GET /api/approve`: Endpoint de callback para processar decisões de aprovação.
* `GET /api/notifications`: Recupera notificações do usuário logado.

---

## 🧩 Componentes Principais

1. **RoundTripSplitSearch:** Interface de busca de voos em duas colunas.
2. **ComparisonDialog:** Modal para comparar diferentes opções de viagem.
3. **StatusBadge:** Componente visual para indicar o estado da solicitação.
4. **FlightInfo/HotelInfo:** Cards detalhados para exibição de ofertas.

---

## 🚀 Recursos Avançados

* **Busca Split (Ida e Volta):** Resolve a limitação de resultados em buscas de volta tradicionais, buscando cada trecho de forma independente e paralela.
* **Server Actions:** Toda a lógica de manipulação de dados é feita via Server Actions para segurança e melhor performance (ex: `travel-requests.ts`).
* **Context API:** Gerenciamento de estado global para o carrinho de compras e sessões.

---

## 🛠️ Desenvolvimento

* **Linting:** `npm run lint` (utiliza ESLint 9).
* **Database:** Utilize `npx drizzle-kit studio` para visualizar os dados localmente.
* **Estilo:** Seguindo padrões Tailwind CSS 4 com suporte a temas.

---

## 🆘 Troubleshooting

* **Erro de API Key:** Verifique se a `SERPAPI_KEY` está corretamente configurada no `.env.local`.
* **Voo com Preço R$ 0:** O sistema filtra automaticamente resultados inválidos, mas verifique a disponibilidade de datas.
* **Email não enviado:** Certifique-se de que o domínio remetente está verificado no painel do Resend.

# Migração de Dados Mock para Banco de Dados Real

## Mudanças Implementadas

O projeto foi refatorado para usar **dados reais do banco de dados PostgreSQL** ao invés de dados mock em memória.

### Arquivos Criados/Modificados

#### Rotas de API Criadas:
- `app/api/users/route.ts` - Busca usuários do banco
- `app/api/notifications/route.ts` - Busca e atualiza notificações
- `app/api/notifications/unread-count/route.ts` - Conta notificações não lidas
- `app/api/requests/route.ts` - Busca solicitações de viagem

#### Arquivos Modificados:
- `context/app-context.tsx` - Refatorado para:
  - Carregar usuários, requests e notificações via API
  - Usar Server Actions para criar, aprovar e rejeitar requests
  - Adicionar estado de `loading`
  - Adicionar função `refreshData()` para recarregar dados

## Como Usar

### 1. Preparar o Banco de Dados

Certifique-se de que o banco PostgreSQL está rodando e configurado no `.env`:

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 2. Executar Migrações

```bash
npm run db:push
```

### 3. Popular o Banco com Dados Iniciais

```bash
npm run db:seed
```

Este comando cria os seguintes usuários no banco:
- **João Silva** (joao@solucoes.com) - Solicitante
- **Maria Santos** (maria@solucoes.com) - Aprovador
- **Carlos Admin** (carlos@solucoes.com) - Admin
- **Ana Compradora** (ana@solucoes.com) - Comprador

### 4. Iniciar o Projeto

```bash
npm run dev
```

## Diferenças do Comportamento Anterior

### Antes (Mock):
- Dados em memória, perdidos ao recarregar a página
- Dados iniciais hardcoded no código
- Operações síncronas instantâneas

### Agora (DB Real):
- Dados persistidos no PostgreSQL
- Dados carregados via API/Server Actions
- Operações assíncronas com estados de loading
- Dados compartilhados entre sessões

## Estrutura de Dados

### Usuários (`users`)
- `id`: ID do usuário
- `name`: Nome completo
- `email`: Email único
- `role`: Papel (requester, approver, admin, buyer)
- `avatar`: URL do avatar (opcional)

### Solicitações (`travel_requests`)
- Todos os campos anteriores
- Relacionado com `users.id`
- Status: pending, approved, rejected, purchased

### Notificações (`notifications`)
- Relacionado com `users.id` e `travel_requests.id`
- Tipos: approval, rejection, system, new_request
- Flag `read` para marcar como lida

## Server Actions Disponíveis

Todas as operações estão em `app/actions/travel-requests.ts`:

- `createTravelRequestAction()` - Criar solicitação
- `approveRequestAction()` - Aprovar solicitação
- `rejectRequestAction()` - Rejeitar solicitação
- `getUserRequestsAction()` - Buscar requests do usuário
- `getPendingRequestsAction()` - Buscar requests pendentes
- `markNotificationReadAction()` - Marcar notificação como lida
- E muitas outras...

## Contexto da Aplicação

O `AppContext` agora oferece:

```typescript
{
  currentUser: User               // Usuário atual
  setCurrentUser: (user) => void  // Trocar usuário
  users: User[]                   // Lista de todos os usuários
  requests: TravelRequest[]       // Requests carregadas
  notifications: Notification[]   // Notificações carregadas
  loading: boolean                // Estado de carregamento
  refreshData: () => Promise      // Recarregar dados do banco
  // ... métodos CRUD
}
```

## Solução de Problemas

### Banco vazio após iniciar
Execute o seed: `npm run db:seed`

### Erro de conexão com banco
Verifique `DATABASE_URL` no `.env`

### Loading infinito
Verifique se o banco está acessível e se as migrations foram aplicadas

## Scripts Úteis

```bash
# Ver estrutura do banco
npm run db:studio

# Executar seed novamente
npm run db:seed

# Aplicar migrations
npm run db:push

# Gerar novas migrations
npm run db:generate
```

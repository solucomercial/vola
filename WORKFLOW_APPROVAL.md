# Workflow de Aprovação Assíncrona - Guia de Configuração

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Resend - Serviço de Email
RESEND_API_KEY=re_sua_chave_api_aqui
RESEND_FROM_EMAIL=noreply@seu-dominio.com

# URL da Aplicação (para gerar links de aprovação)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Como Obter as Chaves

### 1. Resend API Key
1. Acesse [resend.com](https://resend.com)
2. Faça login ou crie uma conta
3. Vá para a seção de API Keys
4. Copie a chave e adicione ao `.env.local`

### 2. Email de Remetente (RESEND_FROM_EMAIL)
- Use um email do seu domínio ou `onboarding@resend.dev` para testes
- Certifique-se de verificar o domínio no Resend

## Fluxo Completo

### 1. Usuário submete carrinho
```
[app/requests/new/page.tsx] 
  → handleSubmitCart()
  → submitCartAction()
```

### 2. Backend processa e envia emails
```
[app/actions/travel-requests.ts]
  → submitCartAction()
    → Cria parent request
    → Cria child requests
    → Busca aprovadores
    → Envia email com botões de aprovação para cada aprovador
```

### 3. Aprovador clica no botão no email
```
Email HTML com dois botões:
  - ✓ Aprovar → GET /api/approve?requestId=xxx&action=approve
  - ✗ Rejeitar → GET /api/approve?requestId=xxx&action=reject
```

### 4. API Route processa
```
[app/api/approve/route.ts]
  → Valida parâmetros
  → Atualiza status da solicitação no banco
    - approve: status = "approved", approval_code gerado
    - reject: status = "rejected", rejection_reason preenchida
  → Redireciona para página de sucesso/erro
```

### 5. Página de confirmação
```
[app/approval-success/page.tsx]
  → Mostra resultado
  → Oferece opção de voltar para análise
  → Redireciona automaticamente em 10s
```

## Email Template

O email contém:

- **Header**: Gradiente com título "✈️ Nova Solicitação de Viagem"
- **Seção de Detalhes**: 
  - Nome do solicitante
  - Tabela com itens (trajeto, data, valor)
  - Total consolidado
- **Motivos**: Justificativa de cada solicitação
- **Botões de Ação**:
  - ✓ Aprovar (verde)
  - ✗ Rejeitar (vermelho)
- **Aviso**: Validade de 30 dias
- **Footer**: Informações sobre o sistema

## Estrutura de Dados

### Tabela travel_requests (Campos atualizados)
```typescript
status: "pending" | "approved" | "rejected"
approval_code?: string  // Gerado quando aprovado
rejection_reason?: string  // Preenchido quando rejeitado
approver_id?: string  // ID do usuário que aprovou/rejeitou
```

## Teste Local

1. Configure as variáveis de ambiente
2. Use email de teste: `onboarding@resend.dev` no `.env.local`
3. Crie um aprovador com email de teste
4. Submeta um carrinho
5. Verifique o email (pode levar até 1 minuto)
6. Clique no botão de aprovação/rejeição
7. Veja a página de confirmação

## Tratamento de Erros

- ✅ Email inválido: Log de erro, continua processamento
- ✅ API Resend indisponível: Email não é enviado, mas solicitação segue
- ✅ Link inválido: Redireciona para `/approval-error`
- ✅ Solicitação não encontrada: Redireciona para `/approval-error`

## Links Úteis

- [Documentação Resend](https://resend.com/docs)
- [Resend React Components](https://react.email/)
- [Email Templates](https://react.email/templates)

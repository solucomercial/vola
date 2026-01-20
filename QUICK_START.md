# 🎯 Busca Split de Voos - Guia Rápido

## 🚀 Start Rápido (5 minutos)

### 1. Backend - Usar a Função
```typescript
import { searchRoundTripSplit } from '@/lib/travel-api';

const resultado = await searchRoundTripSplit({
  origin: "GRU",
  destination: "CDG",
  outboundDate: "2026-03-03",
  returnDate: "2026-03-10",
  currency: "USD"
});

console.log(resultado.outboundResults);  // Voos de ida
console.log(resultado.returnResults);     // Voos de volta
console.log(resultado.statistics);        // Estatísticas
```

### 2. API Route - Criar Endpoint
```typescript
// app/api/flights/search-split/route.ts
import { searchRoundTripSplit } from '@/lib/travel-api';
export async function POST(request: Request) {
  const body = await request.json();
  const resultado = await searchRoundTripSplit(body);
  return Response.json(resultado);
}
```

### 3. Frontend - Usar Hook
```tsx
import { useFlightSplitSearch } from '@/hooks/useFlightSplitSearch';

function MyComponent() {
  const { search, results, selectOutbound, selectReturn, totalPrice } = useFlightSplitSearch();

  return (
    <button onClick={() => search({
      origin: 'GRU',
      destination: 'CDG',
      outboundDate: '2026-03-03',
      returnDate: '2026-03-10'
    })}>
      Buscar
    </button>
  );
}
```

### 4. Componente Completo
```tsx
import { RoundTripSplitSearch } from '@/components/round-trip-split-search';

export default function Page() {
  return <RoundTripSplitSearch />;
}
```

---

## 📁 Estrutura de Arquivos

```
vola/
├── lib/
│   ├── travel-api.ts                    ✅ Função principal
│   ├── test-split-search.ts             ✅ Script de teste
│   ├── FLIGHT_SEARCH_GUIDE.md           📚 Docs API
│   ├── FRONTEND_IMPLEMENTATION_GUIDE.md 📚 Guia frontend
│   └── examples/
│       ├── flight-search-examples.ts
│       └── round-trip-split-examples.ts ✅ 7 exemplos
│
├── app/api/flights/search-split/
│   └── route.ts                         ✅ API Route
│
├── components/
│   └── round-trip-split-search.tsx      ✅ Componente React
│
├── hooks/
│   └── useFlightSplitSearch.ts          ✅ Hooks customizados
│
├── examples/
│   └── hook-usage-examples.tsx          ✅ Exemplos de uso
│
└── IMPLEMENTATION_SUMMARY.md            📚 Resumo completo
```

---

## 🧪 Testar Agora

```bash
# Teste rápido
tsx lib/test-split-search.ts

# Exemplos avançados
tsx lib/examples/round-trip-split-examples.ts
```

---

## 💡 Como Funciona

```
┌──────────────────────────────────────────┐
│  searchRoundTripSplit({                  │
│    origin: "GRU", destination: "CDG",    │
│    outboundDate: "2026-03-03",           │
│    returnDate: "2026-03-10"              │
│  })                                      │
└──────────────────────────────────────────┘
                  │
      ┌───────────┴────────────┐
      │   Promise.all()        │
      └───────────┬────────────┘
                  │
    ┌─────────────┴──────────────┐
    │                            │
    ▼                            ▼
┌─────────┐                ┌─────────┐
│ IDA     │                │ VOLTA   │
│ GRU→CDG │                │ CDG→GRU │
│ type=2  │                │ type=2  │
└─────────┘                └─────────┘
    │                            │
    └─────────────┬──────────────┘
                  ▼
    ┌─────────────────────────────┐
    │ outboundResults: [...]      │
    │ returnResults: [...]        │
    │ statistics: {...}           │
    └─────────────────────────────┘
```

---

## ✨ Principais Vantagens

| Antes (Round-Trip) | Agora (Split) |
|--------------------|---------------|
| 1 requisição | 2 paralelas |
| 5-10 resultados total | 10-20 por trecho |
| Sem controle | Controle total |
| Combinação fixa | N × M combinações |

---

## 📚 Documentação Completa

1. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumo executivo
2. **[lib/FRONTEND_IMPLEMENTATION_GUIDE.md](lib/FRONTEND_IMPLEMENTATION_GUIDE.md)** - Guia frontend detalhado
3. **[lib/FLIGHT_SEARCH_GUIDE.md](lib/FLIGHT_SEARCH_GUIDE.md)** - Documentação API

---

## 🎯 Casos de Uso

### Busca Básica
```typescript
const result = await searchRoundTripSplit({
  origin: "GRU",
  destination: "CDG",
  outboundDate: "2026-03-03",
  returnDate: "2026-03-10"
});
```

### Com Filtros
```typescript
const result = await searchRoundTripSplit({
  origin: "GRU",
  destination: "CDG",
  outboundDate: "2026-03-03",
  returnDate: "2026-03-10",
  adults: 2,
  children: 1,
  travelClass: '2', // Premium
  maxResults: 15
});
```

### Análise de Combinações
```typescript
const { cheapest, fastest } = useFlightCombinations(
  result.outboundResults,
  result.returnResults
);

console.log(`Mais barato: $${cheapest.outbound.price + cheapest.return.price}`);
```

---

## 🛠️ Tecnologias

- **API:** SerpApi (Google Flights)
- **Backend:** Next.js API Routes
- **Frontend:** React Hooks
- **Language:** TypeScript
- **Testing:** Script dedicado

---

## ⚙️ Configuração

1. Adicione no `.env`:
```env
SERPAPI_KEY=your_key_here
```

2. Pronto! Tudo já está implementado.

---

## 🎨 UI Patterns Suportados

1. **Duas Colunas** (Desktop) - Ver `components/round-trip-split-search.tsx`
2. **Steps/Wizard** (Mobile) - Ver `lib/FRONTEND_IMPLEMENTATION_GUIDE.md`
3. **Tabs** (Compacto) - Ver guia de implementação

---

## 📊 Exemplo de Resposta

```json
{
  "success": true,
  "outboundResults": [
    {
      "id": "flight-0-...",
      "price": 500,
      "totalDuration": 720,
      "flights": [...],
      "isBestFlight": true
    }
  ],
  "returnResults": [...],
  "statistics": {
    "bestOutboundPrice": 500,
    "bestReturnPrice": 450,
    "bestCombinedPrice": 950
  },
  "metadata": {...}
}
```

---

## ✅ Checklist

- [x] Função `searchRoundTripSplit()` implementada
- [x] API Route criada
- [x] Hooks customizados
- [x] Componente React completo
- [x] Exemplos de uso
- [x] Testes funcionais
- [x] Documentação completa
- [x] Guia de implementação frontend

---

## 🚀 Próximo Passo

Escolha uma opção:

1. **Testar Agora:**
   ```bash
   tsx lib/test-split-search.ts
   ```

2. **Integrar no App:**
   ```tsx
   import { RoundTripSplitSearch } from '@/components/round-trip-split-search';
   ```

3. **Criar Seu Próprio:**
   Use o hook `useFlightSplitSearch()`

---

## 📞 Arquivos de Ajuda

- **Dúvida sobre API?** → `lib/FLIGHT_SEARCH_GUIDE.md`
- **Dúvida sobre Frontend?** → `lib/FRONTEND_IMPLEMENTATION_GUIDE.md`
- **Ver exemplos?** → `lib/examples/round-trip-split-examples.ts`
- **Testar?** → `lib/test-split-search.ts`

---

**Status:** ✅ **Pronto para Produção**

**Implementado por:** Especialista em Integração de APIs e TypeScript
**Data:** Janeiro 2026

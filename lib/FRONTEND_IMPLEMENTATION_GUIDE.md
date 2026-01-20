# Guia de Implementação Frontend: Busca Split de Voos

## 🎯 Visão Geral

Este guia explica como implementar a nova estratégia de busca de voos **Split** no frontend, onde os voos de **ida** e **volta** são buscados **separadamente** e o usuário pode combinar livremente as opções.

---

## 🆚 Split vs Round-Trip Tradicional

### Método Tradicional (Round-Trip)
```
API retorna: [Voo completo 1, Voo completo 2, ...]
Usuário escolhe: 1 opção completa (ida+volta juntas)
```

**Limitações:**
- ❌ Menos opções disponíveis
- ❌ Não permite mix de companhias
- ❌ Horários fixos da combinação

### Método Split (Novo)
```
API retorna: { 
  ida: [Voo A, Voo B, Voo C, ...],
  volta: [Voo X, Voo Y, Voo Z, ...]
}
Usuário escolhe: 1 ida + 1 volta = Combinação personalizada
```

**Vantagens:**
- ✅ Muito mais opções (N × M combinações)
- ✅ Mix de companhias aéreas
- ✅ Controle total sobre horários
- ✅ Otimização de preço por trecho

---

## 🎨 Padrões de UI Recomendados

### Opção 1: Layout de Duas Colunas (Recomendado)

```
┌─────────────────────────────────────────────────┐
│            Formulário de Busca                  │
└─────────────────────────────────────────────────┘

┌────────────────────┬────────────────────────────┐
│   🛫 VOOS DE IDA   │   🛬 VOOS DE VOLTA         │
├────────────────────┼────────────────────────────┤
│ [ ] Voo 1 - $500   │ [ ] Voo A - $450           │
│ [✓] Voo 2 - $550   │ [ ] Voo B - $500           │
│ [ ] Voo 3 - $600   │ [✓] Voo C - $480           │
│ ...                │ ...                        │
└────────────────────┴────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  RESUMO: Voo 2 + Voo C = $1,030  [CONFIRMAR]   │
└─────────────────────────────────────────────────┘
```

**Quando usar:**
- Desktop/Tablet (telas largas)
- Usuários que querem comparar lado a lado
- Experiência mais visual

**Implementação:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <FlightColumn title="Ida" flights={outboundResults} />
  <FlightColumn title="Volta" flights={returnResults} />
</div>
```

---

### Opção 2: Fluxo em Etapas (Steps)

```
Etapa 1: Escolha seu voo de IDA
┌─────────────────────────────────────────┐
│ [ ] Voo 1 - $500                        │
│ [✓] Voo 2 - $550                        │
│ [ ] Voo 3 - $600                        │
│                      [PRÓXIMO] →        │
└─────────────────────────────────────────┘

Etapa 2: Escolha seu voo de VOLTA
┌─────────────────────────────────────────┐
│ [ ] Voo A - $450                        │
│ [✓] Voo B - $500                        │
│ [ ] Voo C - $480                        │
│ ← [VOLTAR]          [CONFIRMAR] →      │
└─────────────────────────────────────────┘
```

**Quando usar:**
- Mobile (telas pequenas)
- Fluxo mais guiado/simples
- Usuários menos experientes

**Implementação:**
```tsx
{step === 1 && <OutboundSelection onNext={handleSelectOutbound} />}
{step === 2 && <ReturnSelection onBack={handleBack} onConfirm={handleConfirm} />}
```

---

### Opção 3: Abas (Tabs)

```
┌─────────────────────────────────────────┐
│ [🛫 Ida] [🛬 Volta] [📋 Resumo]         │
├─────────────────────────────────────────┤
│  Conteúdo da aba ativa                  │
│  ...                                    │
└─────────────────────────────────────────┘
```

**Quando usar:**
- Interface compacta necessária
- Múltiplas visualizações de dados
- Aplicativos mobile

---

## 💻 Implementação React/Next.js

### Estrutura de Estado

```typescript
interface FlightSelectionState {
  outbound: FlightSearchResult | null;
  return: FlightSearchResult | null;
}

const [selection, setSelection] = useState<FlightSelectionState>({
  outbound: null,
  return: null
});
```

### Fluxo Completo

```typescript
// 1. Buscar voos
const handleSearch = async () => {
  const result = await searchRoundTripSplit({
    origin: "GRU",
    destination: "CDG",
    outboundDate: "2026-03-03",
    returnDate: "2026-03-10"
  });
  
  setSearchResults(result);
};

// 2. Selecionar ida
const handleSelectOutbound = (flight: FlightSearchResult) => {
  setSelection(prev => ({ ...prev, outbound: flight }));
};

// 3. Selecionar volta
const handleSelectReturn = (flight: FlightSearchResult) => {
  setSelection(prev => ({ ...prev, return: flight }));
};

// 4. Calcular total
const totalPrice = selection.outbound?.price + selection.return?.price;

// 5. Confirmar reserva
const handleConfirm = () => {
  if (!selection.outbound || !selection.return) {
    alert("Selecione ambos os voos");
    return;
  }
  
  // Enviar para backend/processo de reserva
  processBooking(selection.outbound, selection.return);
};
```

---

## 🎯 UX Best Practices

### 1. Indicadores Visuais Claros

```tsx
// Mostrar o que está selecionado
<FlightCard 
  selected={selectedId === flight.id}
  className={selected ? "border-blue-500 bg-blue-50" : "border-gray-200"}
/>

// Badge visual
{selected && <Badge>✓ Selecionado</Badge>}
```

### 2. Resumo em Tempo Real

```tsx
<SummaryPanel>
  <div>Voo de Ida: {outbound?.airline} - ${outbound?.price}</div>
  <div>Voo de Volta: {return?.airline} - ${return?.price}</div>
  <div className="font-bold">Total: ${total}</div>
</SummaryPanel>
```

### 3. Validação de Seleção

```tsx
<Button 
  onClick={handleConfirm}
  disabled={!selection.outbound || !selection.return}
>
  {!selection.outbound && !selection.return 
    ? "Selecione os voos"
    : !selection.outbound 
    ? "Selecione o voo de ida"
    : !selection.return
    ? "Selecione o voo de volta"
    : "Confirmar Reserva"
  }
</Button>
```

### 4. Feedback de Loading

```tsx
{loading && (
  <div className="text-center py-8">
    <Spinner />
    <p>Buscando voos de ida e volta...</p>
    <p className="text-sm text-gray-500">Isso pode levar alguns segundos</p>
  </div>
)}
```

### 5. Estatísticas e Insights

```tsx
{statistics && (
  <InsightPanel>
    <Insight 
      icon="💰"
      label="Economia"
      value={`Você economiza $${savings} com esta combinação`}
    />
    <Insight 
      icon="⏱️"
      label="Duração Total"
      value={formatDuration(totalDuration)}
    />
    <Insight 
      icon="🌱"
      label="Sustentabilidade"
      value={carbonScore}
    />
  </InsightPanel>
)}
```

---

## 🔧 Funcionalidades Avançadas

### 1. Ordenação Customizada

```tsx
const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');

const sortedFlights = useMemo(() => {
  return [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'duration':
        return a.totalDuration - b.totalDuration;
      case 'departure':
        return a.flights[0].departureTime.localeCompare(b.flights[0].departureTime);
      default:
        return 0;
    }
  });
}, [flights, sortBy]);
```

### 2. Filtros Dinâmicos

```tsx
const [filters, setFilters] = useState({
  maxPrice: Infinity,
  directOnly: false,
  bestFlightOnly: false,
  airlines: [] as string[]
});

const filteredFlights = flights.filter(flight => {
  if (flight.price > filters.maxPrice) return false;
  if (filters.directOnly && flight.flights.length > 1) return false;
  if (filters.bestFlightOnly && !flight.isBestFlight) return false;
  if (filters.airlines.length > 0 && 
      !filters.airlines.includes(flight.flights[0].airline)) return false;
  return true;
});
```

### 3. Comparação de Combinações

```tsx
const [comparing, setComparing] = useState<{
  combo1: [FlightSearchResult, FlightSearchResult] | null;
  combo2: [FlightSearchResult, FlightSearchResult] | null;
}>({ combo1: null, combo2: null });

<ComparisonView 
  combo1={comparing.combo1}
  combo2={comparing.combo2}
  onClose={() => setComparing({ combo1: null, combo2: null })}
/>
```

### 4. Recomendações Inteligentes

```tsx
const getRecommendations = () => {
  // Melhor preço
  const cheapest = {
    outbound: outboundFlights[0],
    return: returnFlights[0],
    reason: "Combinação mais econômica"
  };
  
  // Mais rápido
  const fastest = {
    outbound: outboundFlights.sort((a, b) => a.totalDuration - b.totalDuration)[0],
    return: returnFlights.sort((a, b) => a.totalDuration - b.totalDuration)[0],
    reason: "Viagem mais rápida"
  };
  
  // Mais sustentável
  const greenest = {
    outbound: outboundFlights.filter(f => f.carbonEmissions).sort(...)[0],
    return: returnFlights.filter(f => f.carbonEmissions).sort(...)[0],
    reason: "Menor pegada de carbono"
  };
  
  return [cheapest, fastest, greenest];
};
```

---

## 📱 Responsividade

### Desktop (≥ 1024px)
```tsx
<div className="hidden lg:grid lg:grid-cols-2 gap-6">
  {/* Duas colunas lado a lado */}
</div>
```

### Tablet (768px - 1023px)
```tsx
<div className="hidden md:block lg:hidden">
  <Tabs>
    <TabsList>
      <TabsTrigger value="outbound">Ida</TabsTrigger>
      <TabsTrigger value="return">Volta</TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

### Mobile (< 768px)
```tsx
<div className="md:hidden">
  {step === 1 && <OutboundStep />}
  {step === 2 && <ReturnStep />}
  {step === 3 && <ConfirmationStep />}
</div>
```

---

## 🎨 Componentes Reutilizáveis

### FlightCard
```tsx
interface FlightCardProps {
  flight: FlightSearchResult;
  selected?: boolean;
  onSelect: () => void;
  type: 'outbound' | 'return';
}

export function FlightCard({ flight, selected, onSelect, type }: FlightCardProps) {
  return (
    <div 
      onClick={onSelect}
      className={cn(
        "border rounded-lg p-4 cursor-pointer transition-all",
        selected ? "border-blue-500 bg-blue-50" : "hover:shadow-md"
      )}
    >
      {/* Conteúdo do card */}
    </div>
  );
}
```

### PriceBreakdown
```tsx
interface PriceBreakdownProps {
  outbound: FlightSearchResult | null;
  return: FlightSearchResult | null;
  currency: string;
}

export function PriceBreakdown({ outbound, return: returnFlight, currency }: PriceBreakdownProps) {
  const total = (outbound?.price || 0) + (returnFlight?.price || 0);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Voo de Ida</span>
        <span>{currency} {outbound?.price.toFixed(2) || '-'}</span>
      </div>
      <div className="flex justify-between">
        <span>Voo de Volta</span>
        <span>{currency} {returnFlight?.price.toFixed(2) || '-'}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>{currency} {total.toFixed(2)}</span>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing

### Testes Unitários
```typescript
describe('FlightSelection', () => {
  it('deve calcular o preço total corretamente', () => {
    const outbound = { price: 500 };
    const return = { price: 450 };
    const total = calculateTotal(outbound, return);
    expect(total).toBe(950);
  });
  
  it('deve validar seleção completa', () => {
    const selection = { outbound: null, return: mockFlight };
    expect(isSelectionComplete(selection)).toBe(false);
  });
});
```

### Testes E2E (Cypress)
```typescript
describe('Flight Search Flow', () => {
  it('deve permitir buscar e selecionar voos', () => {
    cy.visit('/flights');
    cy.get('[data-testid="origin"]').type('GRU');
    cy.get('[data-testid="destination"]').type('CDG');
    cy.get('[data-testid="search-btn"]').click();
    
    cy.get('[data-testid="outbound-flight-0"]').click();
    cy.get('[data-testid="return-flight-0"]').click();
    cy.get('[data-testid="confirm-btn"]').should('be.enabled');
  });
});
```

---

## 📊 Analytics

### Eventos a Trackear
```typescript
// Busca realizada
trackEvent('flight_search', {
  origin,
  destination,
  outboundDate,
  returnDate,
  resultsCount: outboundResults.length + returnResults.length
});

// Seleção de voo
trackEvent('flight_selected', {
  type: 'outbound', // ou 'return'
  price: flight.price,
  airline: flight.flights[0].airline,
  isDirect: flight.flights.length === 1
});

// Reserva confirmada
trackEvent('booking_confirmed', {
  totalPrice,
  outboundPrice,
  returnPrice,
  origin,
  destination
});
```

---

## 🚀 Performance

### Otimizações
```typescript
// 1. Virtualização para listas grandes
import { FixedSizeList } from 'react-window';

// 2. Memoização
const FlightList = React.memo(({ flights }) => {
  return flights.map(flight => <FlightCard key={flight.id} flight={flight} />);
});

// 3. Debounce em filtros
const debouncedFilter = useMemo(
  () => debounce(applyFilters, 300),
  []
);

// 4. Lazy loading de imagens
<img loading="lazy" src={airline.logo} alt={airline.name} />
```

---

## ✅ Checklist de Implementação

- [ ] Integrar função `searchRoundTripSplit` no backend
- [ ] Criar componente de busca com formulário
- [ ] Implementar layout de duas colunas (ou steps)
- [ ] Adicionar estado de seleção de voos
- [ ] Criar componentes de FlightCard
- [ ] Implementar cálculo de preço total
- [ ] Adicionar validação de seleção
- [ ] Criar resumo da viagem
- [ ] Implementar botão de confirmação
- [ ] Adicionar loading states
- [ ] Implementar tratamento de erros
- [ ] Adicionar filtros e ordenação
- [ ] Tornar responsivo (mobile/tablet/desktop)
- [ ] Adicionar analytics
- [ ] Testar fluxo completo
- [ ] Otimizar performance

---

## 📚 Recursos Adicionais

- [Componente Completo (round-trip-split-search.tsx)](../components/round-trip-split-search.tsx)
- [Exemplos de Uso](../lib/examples/round-trip-split-examples.ts)
- [Documentação da API](../lib/FLIGHT_SEARCH_GUIDE.md)

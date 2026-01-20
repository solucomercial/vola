# Guia Completo: Busca de Voos com SerpApi

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Parâmetros da Função](#parâmetros-da-função)
3. [Tipos de Viagem](#tipos-de-viagem)
4. [Estrutura de Resposta](#estrutura-de-resposta)
5. [Paginação](#paginação)
6. [Filtros e "Best Flights"](#filtros-e-best-flights)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplos Práticos](#exemplos-práticos)
9. [Otimizações](#otimizações)

---

## 🎯 Visão Geral

A função `searchFlights()` é uma implementação otimizada para buscar voos usando a **SerpApi (Google Flights)**. Ela suporta:

- ✈️ **Voos de ida e volta** (Round Trip)
- 🛫 **Voos só de ida** (One Way)
- 🔍 **Filtros avançados** (classe, passageiros, moeda)
- 🌱 **Dados de emissão de carbono**
- 📊 **Informações detalhadas de escalas**
- ⚠️ **Tratamento robusto de erros**

---

## 📝 Parâmetros da Função

### Interface `FlightSearchConfig`

```typescript
interface FlightSearchConfig {
  origin: string;           // Código IATA (ex: "GRU", "CDG")
  destination: string;      // Código IATA (ex: "JFK", "LHR")
  outboundDate: string;     // Data de ida: "YYYY-MM-DD"
  returnDate?: string;      // Data de volta: "YYYY-MM-DD" (opcional)
  currency?: string;        // Padrão: "BRL"
  adults?: number;          // Padrão: 1
  children?: number;        // Padrão: 0
  travelClass?: '1' | '2' | '3' | '4';  // Padrão: '1'
  maxResults?: number;      // Padrão: 20
}
```

### Classes de Viagem (`travelClass`)

| Valor | Descrição |
|-------|-----------|
| `'1'` | **Econômica** (padrão) |
| `'2'` | **Premium Economy** |
| `'3'` | **Executiva** |
| `'4'` | **Primeira Classe** |

### Códigos IATA Comuns

| Aeroporto | Código |
|-----------|--------|
| São Paulo (Guarulhos) | `GRU` |
| São Paulo (Congonhas) | `CGH` |
| Rio de Janeiro (Galeão) | `GIG` |
| Rio de Janeiro (Santos Dumont) | `SDU` |
| Paris (Charles de Gaulle) | `CDG` |
| Nova York (JFK) | `JFK` |
| Londres (Heathrow) | `LHR` |
| Miami | `MIA` |

---

## 🛫 Tipos de Viagem

### Round Trip (Ida e Volta)

Quando você fornece `returnDate`, a API automaticamente configura `type=1`:

```typescript
const resultado = await searchFlights({
  origin: "GRU",
  destination: "CDG",
  outboundDate: "2026-03-03",
  returnDate: "2026-03-10"  // ← Define como Round Trip
});
```

### One Way (Só Ida)

Quando `returnDate` não é fornecido, usa `type=2`:

```typescript
const resultado = await searchFlights({
  origin: "GRU",
  destination: "MIA",
  outboundDate: "2026-04-15"
  // Sem returnDate = One Way
});
```

---

## 📊 Estrutura de Resposta

### `FlightSearchResponse`

```typescript
interface FlightSearchResponse {
  success: boolean;              // true se a busca foi bem-sucedida
  results: FlightSearchResult[]; // Array de voos encontrados
  metadata: {
    origin: string;
    destination: string;
    outboundDate: string;
    returnDate?: string;
    tripType: 'one-way' | 'round-trip';
    totalResults: number;
    currency: string;
    searchUrl?: string;          // URL do Google Flights
  };
  error?: string;                // Mensagem de erro (se houver)
  pagination?: {
    hasNextPage: boolean;
    nextPageToken?: string;
  };
}
```

### `FlightSearchResult`

Cada resultado contém:

```typescript
interface FlightSearchResult {
  id: string;
  price: number;                 // Preço total
  currency: string;
  totalDuration: number;         // Duração total em minutos
  flights: FlightLeg[];          // Segmentos do voo
  carbonEmissions?: {
    thisFlightGrams: number;
    typicalGrams: number;
    differencePercent: number;
  };
  bookingUrl?: string;
  isBestFlight: boolean;         // Filtro "Best Flights"
}
```

### `FlightLeg` (Segmento)

Cada segmento de voo contém:

```typescript
interface FlightLeg {
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  airplane?: string;
  departureAirport: string;
  departureAirportCode: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalAirportCode: string;
  arrivalTime: string;
  duration: number;              // Duração do segmento em minutos
  travelClass?: string;
  legroom?: string;
  amenities?: string[];
  layover?: {                    // Informações de escala
    duration: number;
    airport: string;
  };
}
```

---

## 📄 Paginação

### Como Funciona

A SerpApi retorna até **100 resultados por busca**, divididos em páginas. A função `searchFlights()` já verifica automaticamente se há mais páginas disponíveis.

### Estrutura da Paginação

```typescript
const resultado = await searchFlights(config);

if (resultado.pagination?.hasNextPage) {
  console.log('Há mais resultados disponíveis!');
  const token = resultado.pagination.nextPageToken;
  // Use o token para a próxima requisição
}
```

### Implementação de Paginação

#### Opção 1: Parâmetro `start` (Offset)

```typescript
async function buscarComPaginacao(config: FlightSearchConfig, pagina: number = 0) {
  const offset = pagina * 10; // 10 resultados por página
  
  const url = `https://serpapi.com/search.json?${params}&start=${offset}`;
  // Faça a requisição manual
}
```

#### Opção 2: Token da Próxima Página

```typescript
async function buscarProximaPagina(nextPageToken: string) {
  const url = `https://serpapi.com/search.json?serpapi_pagination=${nextPageToken}`;
  // Faça a requisição manual
}
```

#### Opção 3: Aumentar `maxResults`

A forma mais simples é aumentar o `maxResults` na configuração:

```typescript
const resultado = await searchFlights({
  origin: "GRU",
  destination: "CDG",
  outboundDate: "2026-03-03",
  returnDate: "2026-03-10",
  maxResults: 50  // ← Solicita mais resultados
});
```

> **⚠️ Nota:** A SerpApi cobra por requisição. Solicitar muitos resultados pode aumentar custos.

### Exemplo Completo: Scroll Infinito

```typescript
async function buscarTodosVoos(config: FlightSearchConfig) {
  let todosVoos: FlightSearchResult[] = [];
  let pagina = 0;
  let temMais = true;

  while (temMais) {
    const resultado = await searchFlights({
      ...config,
      maxResults: 20
    });

    if (!resultado.success) break;

    todosVoos.push(...resultado.results);
    temMais = resultado.pagination?.hasNextPage || false;
    pagina++;

    // Limite de segurança
    if (pagina >= 5) break;

    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return todosVoos;
}
```

---

## 🎯 Filtros e "Best Flights"

### O que são "Best Flights"?

O Google Flights categoriza automaticamente os melhores voos com base em:

- 💰 **Melhor preço**
- ⚡ **Menor duração**
- 🌱 **Menores emissões de CO₂**
- ⭐ **Melhor custo-benefício**

### Filtrando Best Flights

A função já identifica automaticamente via `isBestFlight`:

```typescript
const resultado = await searchFlights(config);

// Filtrar apenas os melhores voos
const melhoresVoos = resultado.results.filter(voo => voo.isBestFlight);

console.log(`${melhoresVoos.length} melhores voos encontrados`);
```

### Filtros Adicionais Implementáveis

#### 1. Filtro por Preço

```typescript
const voosAte500 = resultado.results.filter(voo => voo.price <= 500);
```

#### 2. Filtro por Duração

```typescript
const voosRapidos = resultado.results.filter(
  voo => voo.totalDuration <= 480 // Até 8 horas
);
```

#### 3. Filtro por Escalas

```typescript
// Voos diretos (sem escalas)
const voosDiretos = resultado.results.filter(
  voo => voo.flights.length === 1
);

// Máximo 1 escala
const maxUmaEscala = resultado.results.filter(
  voo => voo.flights.length <= 2
);
```

#### 4. Filtro por Companhia Aérea

```typescript
const voosLatam = resultado.results.filter(voo =>
  voo.flights.some(leg => leg.airline.includes("LATAM"))
);
```

#### 5. Filtro por Emissões de Carbono

```typescript
const voosSustentaveis = resultado.results.filter(voo => 
  voo.carbonEmissions && 
  voo.carbonEmissions.differencePercent < 0 // Abaixo da média
);
```

### Ordenação de Resultados

```typescript
// Ordenar por preço (menor primeiro)
const ordenadoPorPreco = [...resultado.results].sort(
  (a, b) => a.price - b.price
);

// Ordenar por duração (mais rápido primeiro)
const ordenadoPorDuracao = [...resultado.results].sort(
  (a, b) => a.totalDuration - b.totalDuration
);

// Ordenar por emissões de CO₂
const ordenadoPorCO2 = [...resultado.results]
  .filter(v => v.carbonEmissions)
  .sort((a, b) => 
    (a.carbonEmissions?.thisFlightGrams || 0) - 
    (b.carbonEmissions?.thisFlightGrams || 0)
  );
```

---

## ⚠️ Tratamento de Erros

### Validações Implementadas

A função valida automaticamente:

1. ✅ Parâmetros obrigatórios (`origin`, `destination`, `outboundDate`)
2. ✅ Formato de data (`YYYY-MM-DD`)
3. ✅ Presença da chave de API (`SERPAPI_KEY`)
4. ✅ Status da resposta HTTP
5. ✅ Erros retornados pela API

### Estrutura de Erro

```typescript
if (!resultado.success) {
  console.error('Erro:', resultado.error);
  // Metadata ainda está disponível
  console.log('Origem:', resultado.metadata.origin);
  console.log('Destino:', resultado.metadata.destination);
}
```

### Códigos de Erro Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Parâmetros obrigatórios faltando` | Faltam `origin`, `destination` ou `outboundDate` | Verificar configuração |
| `Data inválida` | Formato de data incorreto | Usar `YYYY-MM-DD` |
| `SERPAPI_KEY não configurada` | Variável de ambiente ausente | Configurar `.env` |
| `Erro na API SerpApi: 401` | Chave de API inválida | Verificar chave na SerpApi |
| `Erro na API SerpApi: 429` | Rate limit excedido | Aguardar ou aumentar plano |
| `Nenhum voo encontrado` | Sem resultados para os parâmetros | Ajustar datas/aeroportos |

### Exemplo de Try-Catch

```typescript
try {
  const resultado = await searchFlights(config);
  
  if (!resultado.success) {
    // Erro tratado pela função
    throw new Error(resultado.error);
  }
  
  // Processar resultados
  console.log(`${resultado.results.length} voos encontrados`);
  
} catch (error) {
  console.error('Erro crítico:', error);
  // Implementar fallback ou notificar usuário
}
```

---

## 💡 Exemplos Práticos

### 1. Busca Básica Ida e Volta

```typescript
const resultado = await searchFlights({
  origin: "GRU",
  destination: "CDG",
  outboundDate: "2026-03-03",
  returnDate: "2026-03-10",
  currency: "USD"
});

console.log(`Preço do voo mais barato: $${resultado.results[0]?.price}`);
```

### 2. Busca para Família

```typescript
const resultado = await searchFlights({
  origin: "GIG",
  destination: "MCO", // Orlando
  outboundDate: "2026-07-01",
  returnDate: "2026-07-15",
  adults: 2,
  children: 2,
  currency: "BRL"
});

console.log(`Viagem para 2 adultos e 2 crianças: R$ ${resultado.results[0]?.price}`);
```

### 3. Análise de Emissões

```typescript
const resultado = await searchFlights({
  origin: "GRU",
  destination: "LHR",
  outboundDate: "2026-05-20",
  returnDate: "2026-05-30"
});

const voosVerdes = resultado.results
  .filter(v => v.carbonEmissions && v.carbonEmissions.differencePercent < 0)
  .sort((a, b) => 
    (a.carbonEmissions?.differencePercent || 0) - 
    (b.carbonEmissions?.differencePercent || 0)
  );

console.log(`${voosVerdes.length} voos com emissões abaixo da média`);
```

### 4. Comparação de Classes

```typescript
async function compararClasses(origin: string, destination: string, date: string, returnDate: string) {
  const classes = ['1', '2', '3', '4'] as const;
  const nomes = ['Econômica', 'Premium', 'Executiva', 'Primeira'];
  
  for (let i = 0; i < classes.length; i++) {
    const resultado = await searchFlights({
      origin,
      destination,
      outboundDate: date,
      returnDate,
      travelClass: classes[i]
    });
    
    if (resultado.success && resultado.results.length > 0) {
      console.log(`${nomes[i]}: R$ ${resultado.results[0].price}`);
    }
    
    await new Promise(r => setTimeout(r, 1000)); // Rate limiting
  }
}
```

---

## 🚀 Otimizações

### 1. Cache de Resultados

```typescript
const cache = new Map<string, FlightSearchResponse>();

async function searchFlightsComCache(config: FlightSearchConfig) {
  const key = JSON.stringify(config);
  
  if (cache.has(key)) {
    const cached = cache.get(key)!;
    const idade = Date.now() - cached.timestamp;
    
    // Cache válido por 30 minutos
    if (idade < 30 * 60 * 1000) {
      console.log('Retornando do cache');
      return cached;
    }
  }
  
  const resultado = await searchFlights(config);
  resultado.timestamp = Date.now();
  cache.set(key, resultado);
  
  return resultado;
}
```

### 2. Debounce para Buscas em Tempo Real

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const buscarVoosDebounced = debounce(searchFlights, 500);
```

### 3. Parallel Requests (Múltiplas Rotas)

```typescript
async function compararRotas() {
  const rotas = [
    { origin: "GRU", destination: "CDG" },
    { origin: "GRU", destination: "LHR" },
    { origin: "GRU", destination: "FCO" } // Roma
  ];
  
  const resultados = await Promise.all(
    rotas.map(rota => 
      searchFlights({
        ...rota,
        outboundDate: "2026-06-01",
        returnDate: "2026-06-15"
      })
    )
  );
  
  resultados.forEach((resultado, index) => {
    if (resultado.success && resultado.results.length > 0) {
      const melhor = resultado.results[0];
      console.log(`${rotas[index].destination}: R$ ${melhor.price}`);
    }
  });
}
```

### 4. Rate Limiting

```typescript
class RateLimiter {
  private queue: (() => Promise<any>)[] = [];
  private running = 0;
  private maxConcurrent = 2;
  private minDelay = 1000; // ms

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift()!;
    
    await fn();
    await new Promise(r => setTimeout(r, this.minDelay));
    
    this.running--;
    this.process();
  }
}

const limiter = new RateLimiter();

// Uso
const resultado = await limiter.add(() => 
  searchFlights({
    origin: "GRU",
    destination: "CDG",
    outboundDate: "2026-03-03"
  })
);
```

---

## 📚 Recursos Adicionais

### Links Úteis

- [SerpApi Documentation](https://serpapi.com/google-flights-api)
- [Google Flights Search Parameters](https://serpapi.com/google-flights-api#api-parameters)
- [IATA Airport Codes](https://www.iata.org/en/publications/directories/code-search/)

### Variáveis de Ambiente Necessárias

```env
SERPAPI_KEY=your_serpapi_key_here
```

### Suporte

Para dúvidas ou problemas:
1. Verifique os logs de auditoria no console
2. Valide a chave da API no [SerpApi Dashboard](https://serpapi.com/dashboard)
3. Consulte o arquivo de exemplos: `lib/examples/flight-search-examples.ts`

---

## 🎓 Conclusão

A função `searchFlights()` oferece uma solução completa e robusta para busca de voos, com:

- ✅ Suporte a ida e volta
- ✅ Tratamento de erros robusto
- ✅ Dados detalhados de escalas
- ✅ Informações de emissões de carbono
- ✅ Filtros e ordenação flexíveis
- ✅ Suporte a paginação

Use os exemplos fornecidos como ponto de partida e adapte conforme suas necessidades específicas!

// lib/travel-api.ts

/**
 * Configuração para busca de voos
 */
export interface FlightSearchConfig {
  origin: string;           // Código IATA do aeroporto de origem (ex: "GRU")
  destination: string;      // Código IATA do aeroporto de destino (ex: "CDG")
  outboundDate: string;     // Data de ida (formato: YYYY-MM-DD)
  returnDate?: string;      // Data de volta (formato: YYYY-MM-DD) - opcional
  currency?: string;        // Moeda (padrão: "BRL")
  adults?: number;          // Número de adultos (padrão: 1)
  children?: number;        // Número de crianças (padrão: 0)
  travelClass?: '1' | '2' | '3' | '4'; // 1=Econômica, 2=Premium, 3=Executiva, 4=Primeira
  maxResults?: number;      // Limite de resultados (padrão: 20)
}

/**
 * Detalhes de um voo individual (segmento/leg)
 */
export interface FlightLeg {
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
  duration: number;         // Duração em minutos
  travelClass?: string;
  legroom?: string;
  amenities?: string[];
  layover?: {
    duration: number;       // Duração da escala em minutos
    airport: string;
  };
}

/**
 * Resultado formatado de busca de voo
 */
export interface FlightSearchResult {
  id: string;
  price: number;
  currency: string;
  totalDuration: number;    // Duração total em minutos
  flights: FlightLeg[];     // Array de segmentos (ida e/ou volta com escalas)
  carbonEmissions?: {
    thisFlightGrams: number;
    typicalGrams: number;
    differencePercent: number;
  };
  bookingUrl?: string;
  isBestFlight: boolean;    // Se está na categoria "best_flights"
}

/**
 * Resposta completa da busca de voos
 */
export interface FlightSearchResponse {
  success: boolean;
  results: FlightSearchResult[];
  metadata: {
    origin: string;
    destination: string;
    outboundDate: string;
    returnDate?: string;
    tripType: 'one-way' | 'round-trip';
    totalResults: number;
    currency: string;
    searchUrl?: string;
  };
  error?: string;
  pagination?: {
    hasNextPage: boolean;
    nextPageToken?: string;
  };
}

/**
 * Resposta da busca de voos em duas etapas (ida e volta separadas)
 */
export interface RoundTripSplitResponse {
  success: boolean;
  outboundResults: FlightSearchResult[];
  returnResults: FlightSearchResult[];
  metadata: {
    origin: string;
    destination: string;
    outboundDate: string;
    returnDate: string;
    currency: string;
    outboundSearchUrl?: string;
    returnSearchUrl?: string;
  };
  statistics?: {
    totalOutbound: number;
    totalReturn: number;
    bestOutboundPrice: number;
    bestReturnPrice: number;
    bestCombinedPrice: number;
  };
  error?: {
    outbound?: string;
    return?: string;
  };
}

export interface TravelOption {
  id: string;
  provider: string;
  price: number;
  details: string;
  bookingUrl?: string;
  departureTime?: string;
  arrivalTime?: string;
  flightNumber?: string;
  airplane?: string;
  legroom?: string;
  amenities?: string[];
  airlineLogo?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  images?: string[];
  rating?: number;
  reviewsCount?: number;
  locationDetails?: string;
  hotelAmenities?: string[];
  legType?: "outbound" | "return"; // Para ida/volta
}

const RAPID_HOST = 'booking-com15.p.rapidapi.com';
const BASE_URL_RAPID = `https://${RAPID_HOST}/api/v1`;

// Fallback de coordenadas para principais cidades brasileiras
const CITY_COORDINATES: Record<string, { latitude: number; longitude: number; name: string }> = {
  'sao paulo': { latitude: -23.5505, longitude: -46.6333, name: 'São Paulo' },
  'são paulo': { latitude: -23.5505, longitude: -46.6333, name: 'São Paulo' },
  'rio de janeiro': { latitude: -22.9068, longitude: -43.1729, name: 'Rio de Janeiro' },
  'belo horizonte': { latitude: -19.9191, longitude: -43.9386, name: 'Belo Horizonte' },
  'brasilia': { latitude: -15.7975, longitude: -47.8919, name: 'Brasília' },
  'brasília': { latitude: -15.7975, longitude: -47.8919, name: 'Brasília' },
  'salvador': { latitude: -12.9714, longitude: -38.5014, name: 'Salvador' },
  'fortaleza': { latitude: -3.7319, longitude: -38.5267, name: 'Fortaleza' },
  'recife': { latitude: -8.0476, longitude: -34.8770, name: 'Recife' },
  'porto alegre': { latitude: -30.0346, longitude: -51.2177, name: 'Porto Alegre' },
  'curitiba': { latitude: -25.4244, longitude: -49.2654, name: 'Curitiba' },
  'manaus': { latitude: -3.1190, longitude: -60.0217, name: 'Manaus' },
  'belém': { latitude: -1.4554, longitude: -48.4898, name: 'Belém' },
  'belem': { latitude: -1.4554, longitude: -48.4898, name: 'Belém' },
  'goiânia': { latitude: -16.6869, longitude: -49.2648, name: 'Goiânia' },
  'goiania': { latitude: -16.6869, longitude: -49.2648, name: 'Goiânia' },
  'campinas': { latitude: -22.9099, longitude: -47.0626, name: 'Campinas' },
  'natal': { latitude: -5.7945, longitude: -35.2110, name: 'Natal' },
  'florianópolis': { latitude: -27.5954, longitude: -48.5480, name: 'Florianópolis' },
  'florianopolis': { latitude: -27.5954, longitude: -48.5480, name: 'Florianópolis' },
  'vitória': { latitude: -20.3155, longitude: -40.3128, name: 'Vitória' },
  'vitoria': { latitude: -20.3155, longitude: -40.3128, name: 'Vitória' },
  'maceió': { latitude: -9.6658, longitude: -35.7353, name: 'Maceió' },
  'maceio': { latitude: -9.6658, longitude: -35.7353, name: 'Maceió' },
  'joão pessoa': { latitude: -7.1195, longitude: -34.8450, name: 'João Pessoa' },
  'joao pessoa': { latitude: -7.1195, longitude: -34.8450, name: 'João Pessoa' },
  'teresina': { latitude: -5.0892, longitude: -42.8019, name: 'Teresina' },
  'aracaju': { latitude: -10.9472, longitude: -37.0731, name: 'Aracaju' },
  'campo grande': { latitude: -20.4697, longitude: -54.6201, name: 'Campo Grande' },
  'cuiabá': { latitude: -15.6014, longitude: -56.0979, name: 'Cuiabá' },
  'cuiaba': { latitude: -15.6014, longitude: -56.0979, name: 'Cuiabá' },
  'são luís': { latitude: -2.5387, longitude: -44.2827, name: 'São Luís' },
  'sao luis': { latitude: -2.5387, longitude: -44.2827, name: 'São Luís' },
  'macapá': { latitude: 0.0347, longitude: -51.0694, name: 'Macapá' },
  'macapa': { latitude: 0.0347, longitude: -51.0694, name: 'Macapá' },
  'boa vista': { latitude: 2.8235, longitude: -60.6758, name: 'Boa Vista' },
  'rio branco': { latitude: -9.9754, longitude: -67.8249, name: 'Rio Branco' },
  'porto velho': { latitude: -8.7619, longitude: -63.9039, name: 'Porto Velho' },
  'palmas': { latitude: -10.1689, longitude: -48.3317, name: 'Palmas' }
};

/**
 * Função otimizada para buscar voos com suporte a ida e volta
 * 
 * @param config - Objeto de configuração da busca
 * @returns Promise com a resposta formatada da busca
 * 
 * @example
 * ```typescript
 * const result = await searchFlights({
 *   origin: "GRU",
 *   destination: "CDG",
 *   outboundDate: "2026-03-03",
 *   returnDate: "2026-03-10",
 *   currency: "USD"
 * });
 * ```
 */
export async function searchFlights(config: FlightSearchConfig): Promise<FlightSearchResponse> {
  const {
    origin,
    destination,
    outboundDate,
    returnDate,
    currency = "BRL",
    adults = 1,
    children = 0,
    travelClass = '1',
    maxResults = 20
  } = config;

  try {
    // Validação de parâmetros obrigatórios
    if (!origin || !destination || !outboundDate) {
      throw new Error("Parâmetros obrigatórios faltando: origin, destination e outboundDate são necessários");
    }

    // Validação de formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(outboundDate)) {
      throw new Error(`Data de ida inválida: ${outboundDate}. Use o formato YYYY-MM-DD`);
    }
    if (returnDate && !dateRegex.test(returnDate)) {
      throw new Error(`Data de volta inválida: ${returnDate}. Use o formato YYYY-MM-DD`);
    }

    // Determina o tipo de viagem: 1 = Ida e volta, 2 = Só ida
    const tripType = returnDate ? "1" : "2";
    const tripTypeLabel = returnDate ? "round-trip" : "one-way";

    // Validação da chave da API
    if (!process.env.SERPAPI_KEY) {
      throw new Error("SERPAPI_KEY não configurada nas variáveis de ambiente");
    }

    // Construção da URL com todos os parâmetros
    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: outboundDate,
      type: tripType,
      currency: currency.toUpperCase(),
      hl: "pt-br",
      gl: "br",
      adults: adults.toString(),
      children: children.toString(),
      travel_class: travelClass,
      api_key: process.env.SERPAPI_KEY
    });

    // Adiciona data de retorno se fornecida
    if (returnDate) {
      params.append("return_date", returnDate);
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;

    console.log(`\n[searchFlights] Buscando voos: ${origin} → ${destination}`);
    console.log(`[searchFlights] Tipo: ${tripTypeLabel}, Ida: ${outboundDate}${returnDate ? `, Volta: ${returnDate}` : ''}`);
    
    // LOG DETALHADO: Mostrar parâmetros da requisição
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('[searchFlights] PARÂMETROS DA REQUISIÇÃO SERPAPI:');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`engine: google_flights`);
    console.log(`departure_id: ${origin.toUpperCase()}`);
    console.log(`arrival_id: ${destination.toUpperCase()}`);
    console.log(`outbound_date: ${outboundDate}`);
    console.log(`type: ${tripType} ${tripType === '2' ? '(one-way)' : '(round-trip)'}`);
    console.log(`currency: ${currency.toUpperCase()}`);
    console.log(`adults: ${adults}`);
    console.log(`children: ${children}`);
    console.log(`travel_class: ${travelClass}`);
    if (returnDate) {
      console.log(`return_date: ${returnDate}`);
    }
    console.log('════════════════════════════════════════════════════════════');
    console.log(`\n📍 URL Completa:`);
    console.log(url);
    console.log('');

    // Realiza a requisição à API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro na API SerpApi: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Tratamento de erros da API
    if (data.error) {
      console.error('\n❌ ERRO DA SERPAPI:');
      console.error(`   ${data.error}`);
      console.error('\n📋 CONTEXTO DO ERRO:');
      console.error(`   Origin: ${origin} → Destination: ${destination}`);
      console.error(`   Outbound Date: ${outboundDate}`);
      if (returnDate) {
        console.error(`   Return Date: ${returnDate}`);
      }
      console.error(`   Trip Type: ${tripType} (${tripTypeLabel})`);
      console.error('');
      throw new Error(`Erro da SerpApi: ${data.error}`);
    }

    // Log detalhado para auditoria (sem erro)
    console.log("\n✅ RESPOSTA RECEBIDA DA SERPAPI");
    console.log(`   Rota: ${origin} → ${destination}`);
    console.log(`   Best Flights: ${(data.best_flights || []).length}`);
    console.log(`   Other Flights: ${(data.other_flights || []).length}`);
    console.log("\n==================== AUDITORIA: SERPAPI FLIGHTS (searchFlights) ====================");
    console.dir(data, { depth: null, colors: true });

    // Verifica se há resultados
    const bestFlights = data.best_flights || [];
    const otherFlights = data.other_flights || [];
    const allFlights = [...bestFlights, ...otherFlights];

    if (allFlights.length === 0) {
      console.warn(`[searchFlights] Nenhum voo encontrado para ${origin} → ${destination}`);
      return {
        success: true,
        results: [],
        metadata: {
          origin,
          destination,
          outboundDate,
          returnDate,
          tripType: tripTypeLabel,
          totalResults: 0,
          currency: currency.toUpperCase(),
          searchUrl: data.search_metadata?.google_flights_url
        },
        pagination: {
          hasNextPage: false
        }
      };
    }

    // Formata os resultados
    const results: FlightSearchResult[] = allFlights
      .slice(0, maxResults)
      .map((flight: any, index: number) => {
        const flights: FlightLeg[] = (flight.flights || []).map((leg: any, legIndex: number) => {
          const legData: FlightLeg = {
            airline: leg.airline || "Companhia Aérea",
            airlineLogo: leg.airline_logo,
            flightNumber: leg.flight_number || "N/A",
            airplane: leg.airplane,
            departureAirport: leg.departure_airport?.name || "Desconhecido",
            departureAirportCode: leg.departure_airport?.id || "",
            departureTime: leg.departure_airport?.time || "",
            arrivalAirport: leg.arrival_airport?.name || "Desconhecido",
            arrivalAirportCode: leg.arrival_airport?.id || "",
            arrivalTime: leg.arrival_airport?.time || "",
            duration: leg.duration || 0,
            travelClass: leg.travel_class,
            legroom: leg.legroom,
            amenities: leg.extensions || []
          };

          // Adiciona informações de escala/layover se existir
          if (legIndex < flight.flights.length - 1) {
            const nextLeg = flight.flights[legIndex + 1];
            if (nextLeg?.departure_airport?.time && leg.arrival_airport?.time) {
              legData.layover = {
                duration: flight.layovers?.[legIndex]?.duration || 0,
                airport: leg.arrival_airport?.name || ""
              };
            }
          }

          return legData;
        });

        return {
          id: `flight-${index}-${Date.now()}`,
          price: flight.price || 0,
          currency: currency.toUpperCase(),
          totalDuration: flight.total_duration || 0,
          flights,
          carbonEmissions: flight.carbon_emissions ? {
            thisFlightGrams: flight.carbon_emissions.this_flight,
            typicalGrams: flight.carbon_emissions.typical_for_this_route,
            differencePercent: flight.carbon_emissions.difference_percent
          } : undefined,
          bookingUrl: data.search_metadata?.google_flights_url,
          isBestFlight: bestFlights.includes(flight)
        };
      });

    // Informações de paginação
    const pagination = {
      hasNextPage: !!data.serpapi_pagination?.next,
      nextPageToken: data.serpapi_pagination?.next_page_token
    };

    console.log(`[searchFlights] ✓ ${results.length} voos encontrados`);

    return {
      success: true,
      results,
      metadata: {
        origin,
        destination,
        outboundDate,
        returnDate,
        tripType: tripTypeLabel,
        totalResults: results.length,
        currency: currency.toUpperCase(),
        searchUrl: data.search_metadata?.google_flights_url
      },
      pagination
    };

  } catch (error) {
    console.error("[searchFlights] ERRO:", error);
    
    return {
      success: false,
      results: [],
      metadata: {
        origin,
        destination,
        outboundDate,
        returnDate,
        tripType: returnDate ? "round-trip" : "one-way",
        totalResults: 0,
        currency: currency.toUpperCase()
      },
      error: error instanceof Error ? error.message : "Erro desconhecido ao buscar voos",
      pagination: {
        hasNextPage: false
      }
    };
  }
}

/**
 * Busca voos de ida e volta em duas etapas independentes (estratégia split)
 * 
 * Esta função realiza duas buscas separadas (uma para ida, outra para volta)
 * garantindo resultados mais completos e permitindo combinações flexíveis.
 * 
 * Vantagens sobre busca round-trip única:
 * - Mais opções de voos disponíveis
 * - Permite combinar diferentes companhias aéreas
 * - Melhor controle sobre preços e horários
 * - Resultados mais precisos para cada trecho
 * 
 * @param config - Configuração da busca (deve incluir returnDate)
 * @returns Promise com resultados separados de ida e volta
 * 
 * @example
 * ```typescript
 * const resultado = await searchRoundTripSplit({
 *   origin: "GRU",
 *   destination: "CDG",
 *   outboundDate: "2026-03-03",
 *   returnDate: "2026-03-10",
 *   currency: "USD",
 *   maxResults: 10
 * });
 * 
 * // Acessa voos de ida
 * console.log(`${resultado.outboundResults.length} voos de ida`);
 * 
 * // Acessa voos de volta
 * console.log(`${resultado.returnResults.length} voos de volta`);
 * 
 * // Melhor combinação
 * const melhorIda = resultado.outboundResults[0];
 * const melhorVolta = resultado.returnResults[0];
 * const precoTotal = melhorIda.price + melhorVolta.price;
 * ```
 */
export async function searchRoundTripSplit(
  config: Omit<FlightSearchConfig, 'returnDate'> & { returnDate: string }
): Promise<RoundTripSplitResponse> {
  const {
    origin,
    destination,
    outboundDate,
    returnDate,
    currency = "BRL",
    adults = 1,
    children = 0,
    travelClass = '1',
    maxResults = 20
  } = config;

  try {
    // Validações
    if (!origin || !destination || !outboundDate || !returnDate) {
      throw new Error("Parâmetros obrigatórios faltando: origin, destination, outboundDate e returnDate são necessários");
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(outboundDate)) {
      throw new Error(`Data de ida inválida: ${outboundDate}. Use o formato YYYY-MM-DD`);
    }
    if (!dateRegex.test(returnDate)) {
      throw new Error(`Data de volta inválida: ${returnDate}. Use o formato YYYY-MM-DD`);
    }

    // Valida se a data de volta é posterior à data de ida
    if (new Date(returnDate) <= new Date(outboundDate)) {
      throw new Error("A data de volta deve ser posterior à data de ida");
    }

    if (!process.env.SERPAPI_KEY) {
      throw new Error("SERPAPI_KEY não configurada nas variáveis de ambiente");
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  BUSCA SPLIT: Ida e Volta em Requisições Independentes   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\n📍 Rota: ${origin} ⇄ ${destination}`);
    console.log(`📅 Ida: ${outboundDate} | Volta: ${returnDate}`);
    console.log(`👥 Passageiros: ${adults} adulto(s), ${children} criança(s)`);
    console.log(`💰 Moeda: ${currency.toUpperCase()}\n`);

    // Configuração base para ambas as buscas
    const baseParams = {
      currency,
      adults,
      children,
      travelClass,
      maxResults
    };

    // ETAPA 1: Busca de IDA (origin → destination)
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ETAPA 1: BUSCA DE IDA                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n🛫 Buscando voos de IDA`);
    console.log('   Parâmetros:');
    console.log(`     • Origin (saída): ${origin.toUpperCase()}`);
    console.log(`     • Destination (chegada): ${destination.toUpperCase()}`);
    console.log(`     • Data: ${outboundDate}`);
    console.log(`     • Tipo: 2 (one-way)`);
    console.log(`     • Adultos: ${adults}, Crianças: ${children}`);
    console.log('');

    const outboundPromise = searchFlights({
      ...baseParams,
      origin,
      destination,
      outboundDate
      // SEM returnDate = type será 2 (one-way)
    }).then(result => {
      if (result.success) {
        console.log(`\n✅ IDA: ${result.results.length} voos encontrados`);
      } else {
        console.error(`\n❌ IDA: Erro na busca - ${result.error}`);
      }
      console.log('');
      return result;
    }).catch(err => {
      console.error(`\n❌ IDA: Erro na busca - ${err.message}\n`);
      return {
        success: false,
        results: [],
        error: err.message
      };
    });

    // ETAPA 2: Busca de VOLTA (destination → origin)
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ETAPA 2: BUSCA DE VOLTA                                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n🛬 Buscando voos de VOLTA`);
    console.log('   Parâmetros:');
    console.log(`     • Origin (saída): ${destination.toUpperCase()} ← invertido`);
    console.log(`     • Destination (chegada): ${origin.toUpperCase()} ← invertido`);
    console.log(`     • Data: ${returnDate}`);
    console.log(`     • Tipo: 2 (one-way)`);
    console.log(`     • Adultos: ${adults}, Crianças: ${children}`);
    console.log('');

    const returnPromise = searchFlights({
      ...baseParams,
      origin: destination,      // Invertido
      destination: origin,       // Invertido
      outboundDate: returnDate   // Data de retorno como "ida"
      // SEM returnDate = type será 2 (one-way)
    }).then(result => {
      if (result.success) {
        console.log(`\n✅ VOLTA: ${result.results.length} voos encontrados`);
      } else {
        console.error(`\n❌ VOLTA: Erro na busca - ${result.error}`);
      }
      console.log('');
      return result;
    }).catch(err => {
      console.error(`\n❌ VOLTA: Erro na busca - ${err.message}\n`);
      return {
        success: false,
        results: [],
        error: err.message
      };
    });

    // Executa ambas as buscas em paralelo
    console.log('\n⏳ Aguardando respostas da API...\n');
    const [outboundResponse, returnResponse] = await Promise.all([
      outboundPromise,
      returnPromise
    ]).catch(err => {
      console.error(`❌ Erro ao executar buscas em paralelo: ${err.message}`);
      throw err;
    });

    // Processa resultados de ida
    const outboundResults = outboundResponse.success ? outboundResponse.results : [];
    const outboundError = outboundResponse.success ? undefined : outboundResponse.error;

    // Processa resultados de volta
    const returnResults = returnResponse.success ? returnResponse.results : [];
    const returnError = returnResponse.success ? undefined : returnResponse.error;

    // Verifica se pelo menos uma busca foi bem-sucedida
    const overallSuccess = outboundResponse.success || returnResponse.success;

    // Log dos resultados
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMO DOS RESULTADOS                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (outboundResponse.success) {
      console.log(`✅ IDA: ${outboundResults.length} voos encontrados`);
    } else {
      console.error(`❌ IDA: Erro na busca`);
      console.error(`   Mensagem: ${outboundError}`);
    }

    if (returnResponse.success) {
      console.log(`✅ VOLTA: ${returnResults.length} voos encontrados`);
    } else {
      console.error(`❌ VOLTA: Erro na busca`);
      console.error(`   Mensagem: ${returnError}`);
    }

    // Linha separadora
    if (!outboundResponse.success || !returnResponse.success) {
      console.log('\n⚠️  AVISO: Pelo menos uma das buscas retornou erro.');
      if (!outboundResponse.success && !returnResponse.success) {
        console.log('   As DUAS buscas falharam. Verifique os logs de erro acima.');
      } else if (!outboundResponse.success) {
        console.log('   A busca de IDA falhou, mas a VOLTA pode ter sucesso.');
      } else {
        console.log('   A busca de VOLTA falhou, mas a IDA pode ter sucesso.');
      }
    }
    console.log('');

    // Calcula estatísticas
    let statistics = undefined;

    if (outboundResults.length > 0 && returnResults.length > 0) {
      const outboundPrices = outboundResults.map(f => f.price);
      const returnPrices = returnResults.map(f => f.price);

      const bestOutboundPrice = Math.min(...outboundPrices);
      const bestReturnPrice = Math.min(...returnPrices);
      const bestCombinedPrice = bestOutboundPrice + bestReturnPrice;

      statistics = {
        totalOutbound: outboundResults.length,
        totalReturn: returnResults.length,
        bestOutboundPrice,
        bestReturnPrice,
        bestCombinedPrice
      };

      console.log('\n📊 ESTATÍSTICAS:');
      console.log(`   Ida - Melhor preço: ${currency} ${bestOutboundPrice.toFixed(2)}`);
      console.log(`   Volta - Melhor preço: ${currency} ${bestReturnPrice.toFixed(2)}`);
      console.log(`   ─────────────────────────────────────────`);
      console.log(`   TOTAL (melhor combinação): ${currency} ${bestCombinedPrice.toFixed(2)}`);
    } else if (outboundResults.length === 0 && returnResults.length === 0) {
      console.error('\n⚠️  ATENÇÃO: Nenhum voo encontrado em ambas as buscas!');
    } else if (outboundResults.length === 0) {
      console.error('\n⚠️  ATENÇÃO: Nenhum voo de ida encontrado!');
    } else if (returnResults.length === 0) {
      console.error('\n⚠️  ATENÇÃO: Nenhum voo de volta encontrado!');
    }

    const response: RoundTripSplitResponse = {
      success: overallSuccess,
      outboundResults,
      returnResults,
      metadata: {
        origin,
        destination,
        outboundDate,
        returnDate,
        currency: currency.toUpperCase(),
        outboundSearchUrl: (outboundResponse.success && 'metadata' in outboundResponse) ? (outboundResponse as any).metadata?.searchUrl : undefined,
        returnSearchUrl: (returnResponse.success && 'metadata' in returnResponse) ? (returnResponse as any).metadata?.searchUrl : undefined
      },
      statistics,
      error: (outboundError || returnError) ? {
        outbound: outboundError,
        return: returnError
      } : undefined
    };

    console.log('\n✅ Busca split concluída!\n');

    return response;

  } catch (error) {
    console.error("\n❌ [searchRoundTripSplit] ERRO CRÍTICO:", error);
    
    return {
      success: false,
      outboundResults: [],
      returnResults: [],
      metadata: {
        origin,
        destination,
        outboundDate,
        returnDate,
        currency: currency.toUpperCase()
      },
      error: {
        outbound: error instanceof Error ? error.message : "Erro desconhecido",
        return: error instanceof Error ? error.message : "Erro desconhecido"
      }
    };
  }
}

export async function fetchFlightOffers(origin: string, destination: string, date: string, returnDate?: string, legType?: "outbound" | "return"): Promise<TravelOption[]> {
  try {
    // Se é uma busca round-trip (tem returnDate), usa a estratégia split
    if (returnDate) {
      console.log('\n[fetchFlightOffers] Detectada busca round-trip - usando stratégia SPLIT');
      const splitResult = await searchRoundTripSplit({
        origin,
        destination,
        outboundDate: date,
        returnDate,
        currency: 'BRL',
        adults: 1,
        children: 0,
        travelClass: '1',
        maxResults: 20
      });

      console.log(`\n[fetchFlightOffers] Resultados da busca split:
        IDA: ${splitResult.outboundResults.length} voos
        VOLTA: ${splitResult.returnResults.length} voos
      `);

      // Mapeia voos de IDA
      const outboundFlights = splitResult.outboundResults.map((f: any, index: number) => ({
        id: `flight-outbound-${index}`,
        provider: f.flights?.[0]?.airline || "Companhia Aérea",
        price: f.price || 0,
        details: `${f.flights?.[0]?.travelClass || 'Economy'} - Duração: ${f.totalDuration} min`,
        bookingUrl: f.searchUrl,
        departureTime: f.flights?.[0]?.departureTime,
        arrivalTime: f.flights?.[0]?.arrivalTime,
        flightNumber: f.flights?.[0]?.flightNumber,
        airplane: f.flights?.[0]?.airplane,
        legroom: f.flights?.[0]?.legroom,
        amenities: f.flights?.[0]?.extensions || [],
        airlineLogo: f.flights?.[0]?.airlineLogo,
        departureAirport: f.flights?.[0]?.departureAirport,
        arrivalAirport: f.flights?.[0]?.arrivalAirport,
        legType: "outbound" as const,
        rawData: f, // Guardar dados originais para referência
      }));

      // Mapeia voos de VOLTA
      const returnFlights = splitResult.returnResults.map((f: any, index: number) => ({
        id: `flight-return-${index}`,
        provider: f.flights?.[0]?.airline || "Companhia Aérea",
        price: f.price || 0,
        details: `${f.flights?.[0]?.travelClass || 'Economy'} - Duração: ${f.totalDuration} min`,
        bookingUrl: f.searchUrl,
        departureTime: f.flights?.[0]?.departureTime,
        arrivalTime: f.flights?.[0]?.arrivalTime,
        flightNumber: f.flights?.[0]?.flightNumber,
        airplane: f.flights?.[0]?.airplane,
        legroom: f.flights?.[0]?.legroom,
        amenities: f.flights?.[0]?.extensions || [],
        airlineLogo: f.flights?.[0]?.airlineLogo,
        departureAirport: f.flights?.[0]?.departureAirport,
        arrivalAirport: f.flights?.[0]?.arrivalAirport,
        legType: "return" as const,
        rawData: f, // Guardar dados originais para referência
      }));

      const allFlights = [...outboundFlights, ...returnFlights];
      
      console.log(`[fetchFlightOffers] Retornando ${allFlights.length} voos mapeados (${outboundFlights.length} IDA + ${returnFlights.length} VOLTA)`);
      
      return allFlights;
    }

    // Se é busca one-way, usa a função original
    const tripType = "2";
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origin.toUpperCase()}&arrival_id=${destination.toUpperCase()}&outbound_date=${date}&type=${tripType}&currency=BRL&api_key=${process.env.SERPAPI_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();

    console.log("\n==================== AUDITORIA: RAW SERPAPI (VOOS) ====================");
    console.dir(data, { depth: null, colors: true });

    const flights = [...(data.best_flights || []), ...(data.other_flights || [])];

    return flights.slice(0, 20).map((f: any, index: number) => ({
      id: `flight-${legType || 'single'}-${index}`,
      provider: f.flights[0]?.airline || "Companhia Aérea",
      price: f.price || 0,
      details: `${f.flights[0]?.travel_class || 'Economy'} - Duração: ${f.total_duration} min`,
      bookingUrl: data.search_metadata?.google_flights_url,
      departureTime: f.flights[0]?.departure_airport?.time?.split(' ')[1],
      arrivalTime: f.flights[0]?.arrival_airport?.time?.split(' ')[1],
      flightNumber: f.flights[0]?.flight_number,
      airplane: f.flights[0]?.airplane,
      legroom: f.flights[0]?.legroom,
      amenities: f.flights[0]?.extensions || [],
      airlineLogo: f.flights[0]?.airline_logo,
      departureAirport: f.flights[0]?.departure_airport?.name,
      arrivalAirport: f.flights[0]?.arrival_airport?.name,
      legType: legType || undefined,
    }));
  } catch (error) {
    console.error("[ERRO AUDITORIA] SerpApi Flights:", error);
    return [];
  }
}

export async function fetchHotelOffers(destination: string, checkIn: string, checkOut: string): Promise<TravelOption[]> {
  try {
    const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(destination + ' Hotels')}&check_in_date=${checkIn}&check_out_date=${checkOut}&currency=BRL&api_key=${process.env.SERPAPI_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();

    console.log("\n==================== AUDITORIA: RAW SERPAPI (HOTÉIS) ====================");
    console.dir(data, { depth: null, colors: true });

    return (data.properties || []).slice(0, 20).map((h: any, index: number) => {
      // Mapeamento de preço robusto para evitar o R$ 0
      const priceValue = h.rate_per_night?.lowest || 
                         h.rate_per_night?.extracted_lowest || 
                         h.total_rate?.lowest || 
                         h.total_rate?.extracted_lowest || 
                         0;

      return {
        id: `hotel-${index}`,
        provider: h.name,
        price: priceValue,
        details: h.description || 'Hospedagem selecionada via Google Hotels',
        bookingUrl: h.link,
        images: h.images?.map((img: any) => img.thumbnail) || [h.thumbnail],
        rating: h.overall_rating,
        reviewsCount: h.reviews,
        locationDetails: h.location_rating ? `${h.location_rating}/5 em localização` : "Localização central",
        hotelAmenities: h.amenities || []
      };
    });
  } catch (error) {
    console.error("[ERRO AUDITORIA] SerpApi Hotels:", error);
    return [];
  }
}

export async function fetchCarOffers(destination: string, date: string, returnDate: string): Promise<TravelOption[]> {
  try {
    if (!destination || destination.trim().length === 0) {
      console.error("[fetchCarOffers] Destino vazio ou inválido");
      return [];
    }

    console.log(`[fetchCarOffers] Buscando localização para: "${destination}"`);
    
    // Primeiro tenta o fallback local
    const normalizedDestination = destination.toLowerCase().trim();
    const fallbackCoords = CITY_COORDINATES[normalizedDestination];
    
    let latitude: number, longitude: number, locationName: string;

    if (fallbackCoords) {
      console.log(`[fetchCarOffers] Usando coordenadas do fallback para "${destination}"`);
      latitude = fallbackCoords.latitude;
      longitude = fallbackCoords.longitude;
      locationName = fallbackCoords.name;
    } else {
      // Se não encontrou no fallback, tenta a API
      console.log(`[fetchCarOffers] Tentando API de geocodificação para "${destination}"`);
      
      const locRes = await fetch(`${BASE_URL_RAPID}/cars/searchDestination?query=${encodeURIComponent(destination)}`, {
        headers: { 'x-rapidapi-key': process.env.RAPIDAPI_KEY || '', 'x-rapidapi-host': RAPID_HOST }
      });
      
      if (!locRes.ok) {
        console.error(`[fetchCarOffers] Erro ao geocodificar: ${locRes.status} ${locRes.statusText}`);
        throw new Error(`Geocodificação falhou: ${locRes.status}`);
      }

      const locData = await locRes.json();
      console.log(`[fetchCarOffers] Resposta de localização da API:`, locData);

      const location = locData.data?.[0];
      if (!location?.coordinates) {
        console.warn(`[fetchCarOffers] Localização "${destination}" não encontrada na API nem no fallback local`);
        return [];
      }

      latitude = location.coordinates.latitude;
      longitude = location.coordinates.longitude;
      locationName = location.name || destination;
    }

    console.log(`[fetchCarOffers] Coordenadas obtidas para "${locationName}": ${latitude}, ${longitude}`);

    const fmtDate = date.includes('T') ? date.split('T')[0] : date;
    const fmtReturnDate = returnDate.includes('T') ? returnDate.split('T')[0] : returnDate;

    const carUrl = `${BASE_URL_RAPID}/cars/searchCarRentals?pick_up_latitude=${latitude}&pick_up_longitude=${longitude}&drop_off_latitude=${latitude}&drop_off_longitude=${longitude}&pick_up_date=${fmtDate}&drop_off_date=${fmtReturnDate}&pick_up_time=10:00&drop_off_time=10:00&currency_code=BRL`;

    console.log(`[fetchCarOffers] Buscando carros com URL:`, carUrl);

    const res = await fetch(carUrl, {
      headers: { 'x-rapidapi-key': process.env.RAPIDAPI_KEY || '', 'x-rapidapi-host': RAPID_HOST }
    });

    if (!res.ok) {
      console.error(`[fetchCarOffers] Erro ao buscar carros: ${res.status} ${res.statusText}`);
      throw new Error(`Busca de carros falhou: ${res.status}`);
    }

    const data = await res.json();

    console.log("\n==================== AUDITORIA: RAW RAPIDAPI (CARROS) ====================");
    console.dir(data, { depth: null, colors: true });

    // Verifica se a API retornou erro
    if (data.status === false) {
      console.error(`[fetchCarOffers] Erro na API RapidAPI:`, data.message);
      console.warn(`[fetchCarOffers] Retornando dados mockados para teste...`);
      
      // Retorna dados mockados como fallback
      return getMockCarOffers(locationName, fmtDate, fmtReturnDate);
    }

    if (!data.data || data.data.length === 0) {
      console.info(`[fetchCarOffers] Nenhum carro disponível em "${locationName}" para ${fmtDate} - ${fmtReturnDate}`);
      console.warn(`[fetchCarOffers] Retornando dados mockados para teste...`);
      
      // Retorna dados mockados como fallback
      return getMockCarOffers(locationName, fmtDate, fmtReturnDate);
    }

    return (data.data || []).slice(0, 20).map((c: any, index: number) => ({
      id: `car-${index}`,
      provider: c.vendor_info?.name || "Locadora",
      price: c.price_info?.total_price || 0,
      details: `${c.vehicle_info?.label || 'Veículo'} - ${c.vehicle_info?.transmission || ''}`,
      bookingUrl: c.reservation_url
    }));
  } catch (error) {
    console.error("[fetchCarOffers] Erro completo:", error);
    throw error;
  }
}

// Função auxiliar para gerar dados mockados de carros
function getMockCarOffers(location: string, pickupDate: string, dropoffDate: string): TravelOption[] {
  const mockVehicles = [
    { provider: "Localiza", vehicle: "Fiat Mobi", transmission: "Manual" },
    { provider: "Hertz", vehicle: "Hyundai HB20", transmission: "Automático" },
    { provider: "Movida", vehicle: "Chevrolet Onix", transmission: "Manual" },
    { provider: "Unidas", vehicle: "Renault Sandero", transmission: "Automático" },
    { provider: "Budget", vehicle: "Fiat Uno", transmission: "Manual" },
    { provider: "Avis", vehicle: "Hyundai i30", transmission: "Automático" },
    { provider: "Enterprise", vehicle: "Volkswagen Polo", transmission: "Automático" },
    { provider: "Sixt", vehicle: "Honda City", transmission: "Automático" },
  ];

  // Calcula número de dias de locação para calcular preço
  const pickup = new Date(pickupDate);
  const dropoff = new Date(dropoffDate);
  const days = Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
  const validDays = Math.max(1, days);

  return mockVehicles.map((vehicle, index) => {
    // Preço base varia por locadora e tipo de veículo
    const basePrice = 100 + (index * 15);
    const totalPrice = Math.round(basePrice * validDays * 1.15); // Adiciona 15% de taxa

    return {
      id: `car-mock-${index}`,
      provider: vehicle.provider,
      price: totalPrice,
      details: `${vehicle.vehicle} - ${vehicle.transmission}`,
      bookingUrl: `https://www.${vehicle.provider.toLowerCase()}.com.br/reserva`
    };
  });
}

export interface LocationOption {
  iata: string;
  name: string;
  city: string;
  country: string;
}

// Lista de principais aeroportos para fallback
const MAJOR_AIRPORTS: LocationOption[] = [
  { iata: "GRU", city: "São Paulo", name: "Guarulhos (GRU)", country: "Brasil" },
  { iata: "CGH", city: "São Paulo", name: "Congonhas (CGH)", country: "Brasil" },
  { iata: "GIG", city: "Rio de Janeiro", name: "Galeão (GIG)", country: "Brasil" },
  { iata: "SDU", city: "Rio de Janeiro", name: "Santos Dumont (SDU)", country: "Brasil" },
  { iata: "BH", city: "Belo Horizonte", name: "Confins (BH)", country: "Brasil" },
  { iata: "BSB", city: "Brasília", name: "Brasília (BSB)", country: "Brasil" },
  { iata: "PRG", city: "Curitiba", name: "Afonso Pena (PRG)", country: "Brasil" },
  { iata: "POA", city: "Porto Alegre", name: "Salgado Filho (POA)", country: "Brasil" },
  { iata: "SSA", city: "Salvador", name: "Deputado Luís Eduardo (SSA)", country: "Brasil" },
  { iata: "REC", city: "Recife", name: "Gilberto Freyre (REC)", country: "Brasil" },
  { iata: "MCZ", city: "Maceió", name: "Zumbi dos Palmares (MCZ)", country: "Brasil" },
  { iata: "FOR", city: "Fortaleza", name: "Pinto Martins (FOR)", country: "Brasil" },
  { iata: "SLZ", city: "São Luís", name: "Marechal Cunha Machado (SLZ)", country: "Brasil" },
  { iata: "MAO", city: "Manaus", name: "Manaus (MAO)", country: "Brasil" },
  { iata: "UDI", city: "Uberlândia", name: "Uberlândia (UDI)", country: "Brasil" },
  { iata: "JPA", city: "João Pessoa", name: "Presidente Castro Pinto (JPA)", country: "Brasil" },
  { iata: "JDO", city: "Londrina", name: "Londrina (JDO)", country: "Brasil" },
  { iata: "AJU", city: "Aracaju", name: "Aracaju (AJU)", country: "Brasil" },
  { iata: "THE", city: "Teresina", name: "Teresina (THE)", country: "Brasil" },
  { iata: "MAE", city: "Maceió", name: "Zumbi dos Palmares (MAE)", country: "Brasil" },
  { iata: "NAT", city: "Natal", name: "Augusto Severo (NAT)", country: "Brasil" },
  { iata: "MCP", city: "Maceió", name: "Maceió (MCP)", country: "Brasil" },
  { iata: "VCP", city: "Campinas", name: "Viracopos (VCP)", country: "Brasil" },
  { iata: "RAF", city: "Ribeirão Preto", name: "Ribeirão Preto (RAF)", country: "Brasil" },
  { iata: "IGU", city: "Foz do Iguaçu", name: "Cataratas do Iguaçu (IGU)", country: "Brasil" },
  // Aeroportos internacionais
  { iata: "LAX", city: "Los Angeles", name: "Los Angeles Intl (LAX)", country: "EUA" },
  { iata: "JFK", city: "Nova York", name: "John F. Kennedy (JFK)", country: "EUA" },
  { iata: "CDG", city: "Paris", name: "Charles de Gaulle (CDG)", country: "França" },
  { iata: "LHR", city: "Londres", name: "Heathrow (LHR)", country: "Reino Unido" },
  { iata: "NRT", city: "Tóquio", name: "Narita (NRT)", country: "Japão" },
  { iata: "HND", city: "Tóquio", name: "Haneda (HND)", country: "Japão" },
  { iata: "SYD", city: "Sydney", name: "Sydney (SYD)", country: "Austrália" },
  { iata: "MEL", city: "Melbourne", name: "Melbourne (MEL)", country: "Austrália" },
];

export async function searchLocations(query: string): Promise<LocationOption[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const searchQuery = query.toLowerCase();
    
    // Filtra da lista local primeiro
    const localResults = MAJOR_AIRPORTS.filter((airport) => {
      return (
        airport.iata.toLowerCase().includes(searchQuery) ||
        airport.city.toLowerCase().includes(searchQuery) ||
        airport.name.toLowerCase().includes(searchQuery) ||
        airport.country.toLowerCase().includes(searchQuery)
      );
    });

    // Se encontrou resultados locais, retorna
    if (localResults.length > 0) {
      console.log(`[LocationSearch] Encontrados ${localResults.length} aeroportos locais para "${query}"`);
      return localResults.slice(0, 10);
    }

    // Se não encontrou localmente, tenta API (fallback)
    console.log(`[LocationSearch] Buscando na API para "${query}"`);
    const url = `https://serpapi.com/search.json?engine=google_flights&q=${encodeURIComponent(query)}&type=1&api_key=${process.env.SERPAPI_KEY}`;
    
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(5000) // Timeout de 5s
    });
    
    if (!res.ok) {
      console.warn(`[LocationSearch] API retornou status ${res.status}`);
      return [];
    }

    const data = await res.json();
    console.log(`[LocationSearch] API response:`, data);

    const locations: LocationOption[] = [];
    
    // Tenta extrair de suggestions
    if (data.best_flights) {
      data.best_flights.forEach((flight: any) => {
        if (flight.departure_airport?.id) {
          locations.push({
            iata: flight.departure_airport.id,
            name: flight.departure_airport.name || "",
            city: flight.departure_airport.city || "",
            country: flight.departure_airport.country || "",
          });
        }
        if (flight.arrival_airport?.id) {
          locations.push({
            iata: flight.arrival_airport.id,
            name: flight.arrival_airport.name || "",
            city: flight.arrival_airport.city || "",
            country: flight.arrival_airport.country || "",
          });
        }
      });
    }

    // Remove duplicatas
    const uniqueLocations = Array.from(
      new Map(locations.map((loc) => [loc.iata, loc])).values()
    );

    return uniqueLocations.slice(0, 10);
  } catch (error) {
    console.error("[LocationSearch] Erro ao buscar locais:", error);
    // Retorna resultados vazios ao invés de falhar completamente
    return [];
  }
}
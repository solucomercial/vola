/**
 * Exemplos de uso da função searchFlights
 * 
 * Este arquivo demonstra diferentes cenários de busca de voos
 * utilizando a SerpApi (Google Flights)
 */

import { searchFlights, FlightSearchConfig } from '../travel-api';

/**
 * Exemplo 1: Busca simples de ida e volta
 */
export async function exemploIdaVolta() {
  console.log('\n=== EXEMPLO 1: Busca Ida e Volta ===\n');
  
  const config: FlightSearchConfig = {
    origin: "GRU",           // São Paulo (Guarulhos)
    destination: "CDG",      // Paris (Charles de Gaulle)
    outboundDate: "2026-03-03",
    returnDate: "2026-03-10",
    currency: "USD"
  };

  const resultado = await searchFlights(config);
  
  if (resultado.success) {
    console.log(`✓ Encontrados ${resultado.results.length} voos`);
    console.log(`Tipo de viagem: ${resultado.metadata.tripType}`);
    
    // Exibe os 3 melhores voos
    resultado.results.slice(0, 3).forEach((voo, index) => {
      console.log(`\nVoo ${index + 1}:`);
      console.log(`  Preço: ${voo.price} ${voo.currency}`);
      console.log(`  Duração total: ${voo.totalDuration} minutos`);
      console.log(`  Melhor opção: ${voo.isBestFlight ? 'Sim' : 'Não'}`);
      console.log(`  Segmentos: ${voo.flights.length}`);
      
      voo.flights.forEach((segmento, segIndex) => {
        console.log(`    ${segIndex + 1}. ${segmento.departureAirportCode} → ${segmento.arrivalAirportCode}`);
        console.log(`       ${segmento.airline} ${segmento.flightNumber}`);
        console.log(`       ${segmento.departureTime} - ${segmento.arrivalTime}`);
        
        if (segmento.layover) {
          console.log(`       ⏱ Escala: ${segmento.layover.duration} min em ${segmento.layover.airport}`);
        }
      });
    });
  } else {
    console.error(`✗ Erro: ${resultado.error}`);
  }
}

/**
 * Exemplo 2: Busca somente ida
 */
export async function exemploSomenteIda() {
  console.log('\n=== EXEMPLO 2: Busca Somente Ida ===\n');
  
  const config: FlightSearchConfig = {
    origin: "GRU",
    destination: "MIA",      // Miami
    outboundDate: "2026-04-15",
    currency: "BRL"
  };

  const resultado = await searchFlights(config);
  
  if (resultado.success) {
    console.log(`✓ ${resultado.results.length} opções de voo encontradas`);
    
    // Filtra apenas os "best flights"
    const melhoresVoos = resultado.results.filter(v => v.isBestFlight);
    console.log(`Melhores voos: ${melhoresVoos.length}`);
    
    melhoresVoos.forEach((voo, index) => {
      console.log(`\n${index + 1}. R$ ${voo.price.toLocaleString('pt-BR')}`);
      console.log(`   Duração: ${Math.floor(voo.totalDuration / 60)}h ${voo.totalDuration % 60}min`);
      
      if (voo.carbonEmissions) {
        const diff = voo.carbonEmissions.differencePercent;
        console.log(`   Emissões de CO₂: ${diff > 0 ? '+' : ''}${diff}% em relação à média`);
      }
    });
  }
}

/**
 * Exemplo 3: Busca com filtros avançados
 */
export async function exemploFiltrosAvancados() {
  console.log('\n=== EXEMPLO 3: Busca com Filtros Avançados ===\n');
  
  const config: FlightSearchConfig = {
    origin: "SDU",           // Rio de Janeiro (Santos Dumont)
    destination: "BSB",      // Brasília
    outboundDate: "2026-02-20",
    returnDate: "2026-02-23",
    currency: "BRL",
    adults: 2,
    children: 1,
    travelClass: '2',        // Premium Economy
    maxResults: 10
  };

  const resultado = await searchFlights(config);
  
  if (resultado.success) {
    console.log(`Passageiros: ${config.adults} adultos, ${config.children} crianças`);
    console.log(`Classe: Premium Economy`);
    console.log(`\nResultados: ${resultado.results.length}`);
    
    // Analisa amenidades disponíveis
    const amenidadesPorVoo = resultado.results.map(voo => {
      const todasAmenidades = voo.flights.flatMap(f => f.amenities || []);
      return {
        price: voo.price,
        amenidades: [...new Set(todasAmenidades)]
      };
    });
    
    console.log('\nAmenidades encontradas nos voos:');
    amenidadesPorVoo.slice(0, 3).forEach((info, i) => {
      console.log(`\nVoo ${i + 1} (R$ ${info.price}):`);
      info.amenidades.forEach(a => console.log(`  • ${a}`));
    });
  }
}

/**
 * Exemplo 4: Tratamento de paginação
 */
export async function exemploPaginacao() {
  console.log('\n=== EXEMPLO 4: Verificação de Paginação ===\n');
  
  const config: FlightSearchConfig = {
    origin: "GIG",           // Rio de Janeiro (Galeão)
    destination: "JFK",      // Nova York
    outboundDate: "2026-06-01",
    returnDate: "2026-06-15",
    currency: "USD",
    maxResults: 50           // Solicita mais resultados
  };

  const resultado = await searchFlights(config);
  
  if (resultado.success) {
    console.log(`Resultados retornados: ${resultado.results.length}`);
    console.log(`Há mais páginas? ${resultado.pagination?.hasNextPage ? 'Sim' : 'Não'}`);
    
    if (resultado.pagination?.nextPageToken) {
      console.log(`Token da próxima página: ${resultado.pagination.nextPageToken}`);
      console.log('\nPara implementar paginação, você pode:');
      console.log('1. Usar o token para fazer uma nova requisição à SerpApi');
      console.log('2. Adicionar um parâmetro "start" à URL');
      console.log('3. Implementar scroll infinito ou botões de navegação');
    }
    
    // Estatísticas dos resultados
    const precoMedio = resultado.results.reduce((acc, v) => acc + v.price, 0) / resultado.results.length;
    const precoMinimo = Math.min(...resultado.results.map(v => v.price));
    const precoMaximo = Math.max(...resultado.results.map(v => v.price));
    
    console.log('\nEstatísticas de Preços:');
    console.log(`  Mínimo: $${precoMinimo.toFixed(2)}`);
    console.log(`  Médio: $${precoMedio.toFixed(2)}`);
    console.log(`  Máximo: $${precoMaximo.toFixed(2)}`);
  }
}

/**
 * Exemplo 5: Tratamento de erros
 */
export async function exemploTratamentoErros() {
  console.log('\n=== EXEMPLO 5: Tratamento de Erros ===\n');
  
  // Exemplo com dados inválidos
  const configInvalida: FlightSearchConfig = {
    origin: "INVALID",
    destination: "ALSO_INVALID",
    outboundDate: "2026-13-45",  // Data inválida
    currency: "XYZ"
  };

  const resultado = await searchFlights(configInvalida);
  
  if (!resultado.success) {
    console.log('✗ Erro capturado com sucesso:');
    console.log(`  Mensagem: ${resultado.error}`);
    console.log(`  Metadata preservada:`, resultado.metadata);
    console.log('\n✓ A aplicação não quebrou, erro tratado graciosamente');
  }
  
  // Exemplo com parâmetros faltando
  try {
    // @ts-expect-error - Testando validação
    await searchFlights({ origin: "GRU" });
  } catch (error) {
    console.log('\n✓ Validação de parâmetros obrigatórios funcionando');
  }
}

/**
 * Exemplo 6: Análise de escalas
 */
export async function exemploAnaliseEscalas() {
  console.log('\n=== EXEMPLO 6: Análise de Escalas ===\n');
  
  const config: FlightSearchConfig = {
    origin: "GRU",
    destination: "SYD",      // Sydney, Austrália (voos geralmente com escalas)
    outboundDate: "2026-07-10",
    currency: "BRL"
  };

  const resultado = await searchFlights(config);
  
  if (resultado.success && resultado.results.length > 0) {
    console.log('Análise de escalas nos voos encontrados:\n');
    
    resultado.results.slice(0, 5).forEach((voo, index) => {
      const totalSegmentos = voo.flights.length;
      const escalas = voo.flights.filter(f => f.layover).length;
      
      console.log(`Voo ${index + 1}: R$ ${voo.price.toLocaleString('pt-BR')}`);
      console.log(`  Segmentos: ${totalSegmentos}`);
      console.log(`  Escalas: ${escalas}`);
      
      if (escalas > 0) {
        voo.flights.forEach((segmento, segIndex) => {
          if (segmento.layover) {
            const horas = Math.floor(segmento.layover.duration / 60);
            const minutos = segmento.layover.duration % 60;
            console.log(`    → Escala ${segIndex + 1}: ${horas}h${minutos}min em ${segmento.layover.airport}`);
          }
        });
      }
      console.log('');
    });
  }
}

/**
 * Exemplo 7: Comparação de emissões de carbono
 */
export async function exemploEmissoesCarbono() {
  console.log('\n=== EXEMPLO 7: Análise de Emissões de Carbono ===\n');
  
  const config: FlightSearchConfig = {
    origin: "GRU",
    destination: "LHR",      // Londres
    outboundDate: "2026-05-20",
    returnDate: "2026-05-30",
    currency: "EUR"
  };

  const resultado = await searchFlights(config);
  
  if (resultado.success) {
    const voosComEmissoes = resultado.results.filter(v => v.carbonEmissions);
    
    if (voosComEmissoes.length > 0) {
      console.log(`${voosComEmissoes.length} voos com dados de emissão de CO₂\n`);
      
      // Ordena por emissões (menor para maior)
      const ordenadoPorEmissao = [...voosComEmissoes].sort(
        (a, b) => (a.carbonEmissions?.thisFlightGrams || 0) - (b.carbonEmissions?.thisFlightGrams || 0)
      );
      
      console.log('Top 3 voos mais sustentáveis:');
      ordenadoPorEmissao.slice(0, 3).forEach((voo, index) => {
        const emissao = voo.carbonEmissions!;
        console.log(`\n${index + 1}. €${voo.price}`);
        console.log(`   CO₂: ${(emissao.thisFlightGrams / 1000).toFixed(2)} kg`);
        console.log(`   vs Típico: ${(emissao.typicalGrams / 1000).toFixed(2)} kg`);
        console.log(`   Diferença: ${emissao.differencePercent}%`);
      });
    } else {
      console.log('Nenhum voo com dados de emissão disponíveis');
    }
  }
}

// Função principal para executar todos os exemplos
export async function executarTodosExemplos() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  EXEMPLOS DE USO: searchFlights (SerpApi)      ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  try {
    await exemploIdaVolta();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay entre requisições
    
    await exemploSomenteIda();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await exemploFiltrosAvancados();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await exemploPaginacao();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await exemploTratamentoErros();
    
    await exemploAnaliseEscalas();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await exemploEmissoesCarbono();
    
  } catch (error) {
    console.error('\n✗ Erro ao executar exemplos:', error);
  }
}

// Para executar: node --loader ts-node/esm lib/examples/flight-search-examples.ts
// Ou importar as funções individuais conforme necessário

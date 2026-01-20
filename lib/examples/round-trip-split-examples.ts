/**
 * Exemplos de uso da função searchRoundTripSplit
 * 
 * Demonstra como usar a busca split para obter melhores resultados
 * em voos de ida e volta
 */

import { searchRoundTripSplit, FlightSearchResult } from '../travel-api';

/**
 * Exemplo 1: Busca Básica Split
 */
export async function exemploBasicoSplit() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXEMPLO 1: Busca Split Básica (Ida e Volta Separadas)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const resultado = await searchRoundTripSplit({
    origin: "GRU",
    destination: "CDG",
    outboundDate: "2026-03-03",
    returnDate: "2026-03-10",
    currency: "USD",
    maxResults: 5
  });

  if (!resultado.success) {
    console.error('❌ Erro na busca');
    if (resultado.error?.outbound) {
      console.error('  Ida:', resultado.error.outbound);
    }
    if (resultado.error?.return) {
      console.error('  Volta:', resultado.error.return);
    }
    return;
  }

  console.log(`✅ Busca concluída com sucesso!\n`);
  console.log(`📊 Resultados:`);
  console.log(`   Voos de IDA: ${resultado.outboundResults.length}`);
  console.log(`   Voos de VOLTA: ${resultado.returnResults.length}`);

  if (resultado.statistics) {
    console.log(`\n💰 Melhor Combinação:`);
    console.log(`   Ida: $${resultado.statistics.bestOutboundPrice.toFixed(2)}`);
    console.log(`   Volta: $${resultado.statistics.bestReturnPrice.toFixed(2)}`);
    console.log(`   ─────────────────────────────`);
    console.log(`   TOTAL: $${resultado.statistics.bestCombinedPrice.toFixed(2)}`);
  }
}

/**
 * Exemplo 2: Encontrar Todas as Combinações Possíveis
 */
export async function exemploTodasCombinacoes() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXEMPLO 2: Analisando Todas as Combinações Possíveis');
  console.log('═══════════════════════════════════════════════════════════\n');

  const resultado = await searchRoundTripSplit({
    origin: "GIG",
    destination: "JFK",
    outboundDate: "2026-06-01",
    returnDate: "2026-06-15",
    currency: "BRL",
    maxResults: 10
  });

  if (!resultado.success) {
    console.error('❌ Erro na busca');
    return;
  }

  console.log(`Gerando ${resultado.outboundResults.length} × ${resultado.returnResults.length} = ${resultado.outboundResults.length * resultado.returnResults.length} combinações possíveis\n`);

  // Gera todas as combinações
  const combinacoes = [];

  for (const ida of resultado.outboundResults) {
    for (const volta of resultado.returnResults) {
      combinacoes.push({
        ida,
        volta,
        precoTotal: ida.price + volta.price,
        duracaoTotal: ida.totalDuration + volta.totalDuration,
        ambosDirectos: ida.flights.length === 1 && volta.flights.length === 1,
        ambosBestFlight: ida.isBestFlight && volta.isBestFlight
      });
    }
  }

  // Ordena por preço
  combinacoes.sort((a, b) => a.precoTotal - b.precoTotal);

  console.log('🏆 TOP 5 COMBINAÇÕES MAIS BARATAS:\n');

  combinacoes.slice(0, 5).forEach((combo, index) => {
    console.log(`${index + 1}. R$ ${combo.precoTotal.toFixed(2)}`);
    console.log(`   Ida: ${combo.ida.flights[0]?.airline} ${combo.ida.flights[0]?.flightNumber} - R$ ${combo.ida.price.toFixed(2)}`);
    console.log(`   Volta: ${combo.volta.flights[0]?.airline} ${combo.volta.flights[0]?.flightNumber} - R$ ${combo.volta.price.toFixed(2)}`);
    console.log(`   Escalas: ${combo.ida.flights.length - 1} (ida) + ${combo.volta.flights.length - 1} (volta)`);
    if (combo.ambosDirectos) console.log(`   ✈️  Ambos diretos!`);
    if (combo.ambosBestFlight) console.log(`   ⭐ Ambos são Best Flights!`);
    console.log('');
  });

  // Melhor combinação com voos diretos
  const melhorDireto = combinacoes.find(c => c.ambosDirectos);
  if (melhorDireto) {
    console.log('✈️  MELHOR COMBINAÇÃO COM VOOS DIRETOS:');
    console.log(`   Preço: R$ ${melhorDireto.precoTotal.toFixed(2)}`);
    console.log(`   Duração total: ${Math.floor(melhorDireto.duracaoTotal / 60)}h ${melhorDireto.duracaoTotal % 60}min\n`);
  }
}

/**
 * Exemplo 3: Comparar com Flexibilidade de Datas
 */
export async function exemploFlexibilidadeDatas() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXEMPLO 3: Comparando Preços com Datas Flexíveis');
  console.log('═══════════════════════════════════════════════════════════\n');

  const baseDate = new Date('2026-07-10');
  const datasCombinacoes = [];

  // Testa 3 datas de ida e 3 de volta
  for (let idaOffset = 0; idaOffset < 3; idaOffset++) {
    for (let voltaOffset = 7; voltaOffset < 10; voltaOffset++) {
      const dataIda = new Date(baseDate);
      dataIda.setDate(baseDate.getDate() + idaOffset);

      const dataVolta = new Date(baseDate);
      dataVolta.setDate(baseDate.getDate() + voltaOffset);

      datasCombinacoes.push({
        ida: dataIda.toISOString().split('T')[0],
        volta: dataVolta.toISOString().split('T')[0]
      });
    }
  }

  console.log(`Testando ${datasCombinacoes.length} combinações de datas...\n`);

  const resultados = [];

  for (const datas of datasCombinacoes) {
    const resultado = await searchRoundTripSplit({
      origin: "GRU",
      destination: "MIA",
      outboundDate: datas.ida,
      returnDate: datas.volta,
      currency: "BRL",
      maxResults: 3
    });

    if (resultado.success && resultado.statistics) {
      resultados.push({
        dataIda: datas.ida,
        dataVolta: datas.volta,
        precoTotal: resultado.statistics.bestCombinedPrice
      });

      console.log(`✓ ${datas.ida} - ${datas.volta}: R$ ${resultado.statistics.bestCombinedPrice.toFixed(2)}`);
    }

    // Delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Encontra a melhor data
  resultados.sort((a, b) => a.precoTotal - b.precoTotal);

  if (resultados.length > 0) {
    const melhor = resultados[0];
    console.log(`\n🎯 MELHOR DATA ENCONTRADA:`);
    console.log(`   Ida: ${melhor.dataIda}`);
    console.log(`   Volta: ${melhor.dataVolta}`);
    console.log(`   Preço: R$ ${melhor.precoTotal.toFixed(2)}`);
  }
}

/**
 * Exemplo 4: Filtros Customizados
 */
export async function exemploFiltrosCustomizados() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXEMPLO 4: Aplicando Filtros Customizados');
  console.log('═══════════════════════════════════════════════════════════\n');

  const resultado = await searchRoundTripSplit({
    origin: "BSB",
    destination: "GRU",
    outboundDate: "2026-05-15",
    returnDate: "2026-05-20",
    currency: "BRL",
    maxResults: 15
  });

  if (!resultado.success) {
    console.error('❌ Erro na busca');
    return;
  }

  console.log('Aplicando filtros personalizados...\n');

  // Filtro 1: Apenas voos diretos
  const idaDireta = resultado.outboundResults.filter(v => v.flights.length === 1);
  const voltaDireta = resultado.returnResults.filter(v => v.flights.length === 1);

  console.log('✈️  VOOS DIRETOS:');
  console.log(`   Ida: ${idaDireta.length} opções`);
  console.log(`   Volta: ${voltaDireta.length} opções`);

  if (idaDireta.length > 0 && voltaDireta.length > 0) {
    const melhorDireto = Math.min(...idaDireta.map(v => v.price)) + 
                         Math.min(...voltaDireta.map(v => v.price));
    console.log(`   Melhor preço (direto): R$ ${melhorDireto.toFixed(2)}\n`);
  }

  // Filtro 2: Apenas Best Flights
  const idaBest = resultado.outboundResults.filter(v => v.isBestFlight);
  const voltaBest = resultado.returnResults.filter(v => v.isBestFlight);

  console.log('⭐ BEST FLIGHTS:');
  console.log(`   Ida: ${idaBest.length} opções`);
  console.log(`   Volta: ${voltaBest.length} opções\n`);

  // Filtro 3: Voos com baixa emissão de carbono
  const idaEco = resultado.outboundResults.filter(v => 
    v.carbonEmissions && v.carbonEmissions.differencePercent < 0
  );
  const voltaEco = resultado.returnResults.filter(v => 
    v.carbonEmissions && v.carbonEmissions.differencePercent < 0
  );

  console.log('🌱 VOOS SUSTENTÁVEIS (emissão abaixo da média):');
  console.log(`   Ida: ${idaEco.length} opções`);
  console.log(`   Volta: ${voltaEco.length} opções\n`);

  // Filtro 4: Voos de manhã (antes das 12h)
  const filtrarPorHorario = (voos: FlightSearchResult[], periodo: 'manha' | 'tarde' | 'noite') => {
    return voos.filter(v => {
      const horario = v.flights[0]?.departureTime?.split(' ')[1];
      if (!horario) return false;

      const hora = parseInt(horario.split(':')[0]);

      switch (periodo) {
        case 'manha':
          return hora >= 6 && hora < 12;
        case 'tarde':
          return hora >= 12 && hora < 18;
        case 'noite':
          return hora >= 18 || hora < 6;
        default:
          return false;
      }
    });
  };

  const idaManha = filtrarPorHorario(resultado.outboundResults, 'manha');
  const voltaTarde = filtrarPorHorario(resultado.returnResults, 'tarde');

  console.log('🕐 FILTRO POR HORÁRIO:');
  console.log(`   Ida de manhã (6h-12h): ${idaManha.length} opções`);
  console.log(`   Volta à tarde (12h-18h): ${voltaTarde.length} opções\n`);
}

/**
 * Exemplo 5: Comparação Split vs Round-Trip Tradicional
 */
export async function exemploComparacaoMetodos() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXEMPLO 5: Comparando Busca Split vs Round-Trip');
  console.log('═══════════════════════════════════════════════════════════\n');

  const config = {
    origin: "GRU",
    destination: "LHR",
    outboundDate: "2026-08-01",
    returnDate: "2026-08-15",
    currency: "EUR",
    maxResults: 10
  };

  console.log('Buscando com método SPLIT...');
  const resultadoSplit = await searchRoundTripSplit(config);

  console.log('\nBuscando com método ROUND-TRIP tradicional...');
  const { searchFlights } = await import('../travel-api');
  const resultadoTradicional = await searchFlights(config);

  console.log('\n📊 COMPARAÇÃO:\n');

  if (resultadoSplit.success) {
    console.log('MÉTODO SPLIT:');
    console.log(`  ✓ Voos de ida: ${resultadoSplit.outboundResults.length}`);
    console.log(`  ✓ Voos de volta: ${resultadoSplit.returnResults.length}`);
    console.log(`  ✓ Combinações possíveis: ${resultadoSplit.outboundResults.length * resultadoSplit.returnResults.length}`);
    
    if (resultadoSplit.statistics) {
      console.log(`  ✓ Melhor preço: €${resultadoSplit.statistics.bestCombinedPrice.toFixed(2)}`);
    }
  }

  if (resultadoTradicional.success) {
    console.log('\nMÉTODO ROUND-TRIP:');
    console.log(`  ✓ Total de resultados: ${resultadoTradicional.results.length}`);
    
    if (resultadoTradicional.results.length > 0) {
      const melhorPreco = Math.min(...resultadoTradicional.results.map(v => v.price));
      console.log(`  ✓ Melhor preço: €${melhorPreco.toFixed(2)}`);
    }
  }

  console.log('\n💡 VANTAGENS DO MÉTODO SPLIT:');
  console.log('  • Mais flexibilidade na escolha de horários');
  console.log('  • Possibilidade de combinar diferentes companhias');
  console.log('  • Maior número de opções disponíveis');
  console.log('  • Melhor controle sobre cada trecho da viagem\n');
}

/**
 * Exemplo 6: Implementação de Cache
 */
export async function exemploCacheDeBuscas() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXEMPLO 6: Implementando Cache de Resultados');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Cache simples em memória
  const cache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  async function searchWithCache(config: any) {
    const cacheKey = JSON.stringify(config);
    const cached = cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log('📦 Retornando do cache...');
      return cached.data;
    }

    console.log('🔍 Buscando na API...');
    const resultado = await searchRoundTripSplit(config);

    cache.set(cacheKey, {
      data: resultado,
      timestamp: Date.now()
    });

    return resultado;
  }

  const config = {
    origin: "GRU",
    destination: "CDG",
    outboundDate: "2026-03-03",
    returnDate: "2026-03-10",
    currency: "USD"
  };

  // Primeira busca (sem cache)
  console.log('1ª Busca:');
  const inicio1 = Date.now();
  await searchWithCache(config);
  console.log(`Tempo: ${Date.now() - inicio1}ms\n`);

  // Segunda busca (com cache)
  console.log('2ª Busca (mesmos parâmetros):');
  const inicio2 = Date.now();
  await searchWithCache(config);
  console.log(`Tempo: ${Date.now() - inicio2}ms\n`);

  console.log(`✓ Cache funcionando! Tamanho do cache: ${cache.size} entradas`);
}

// Exporta função para executar todos os exemplos
export async function executarTodosExemplosSplit() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     EXEMPLOS: searchRoundTripSplit (Busca em 2 Etapas)    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await exemploBasicoSplit();
  await new Promise(r => setTimeout(r, 2000));

  await exemploTodasCombinacoes();
  await new Promise(r => setTimeout(r, 2000));

  await exemploFiltrosCustomizados();
  await new Promise(r => setTimeout(r, 2000));

  await exemploComparacaoMetodos();
  await new Promise(r => setTimeout(r, 2000));

  await exemploCacheDeBuscas();

  console.log('\n✅ Todos os exemplos foram executados!\n');
}

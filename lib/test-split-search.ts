/**
 * Script de teste para a função searchRoundTripSplit
 * 
 * Para executar:
 * 1. Configure SERPAPI_KEY no arquivo .env
 * 2. Execute: npm run test:split
 */

import { searchRoundTripSplit } from './travel-api';

async function testeRapidoSplit() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       TESTE: searchRoundTripSplit (Busca em 2 Etapas)   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const config = {
    origin: "GRU",           // São Paulo
    destination: "CDG",      // Paris
    outboundDate: "2026-03-03",
    returnDate: "2026-03-10",
    currency: "USD",
    maxResults: 5
  };

  console.log('📋 Configuração da Busca:');
  console.log(JSON.stringify(config, null, 2));
  console.log('\n⏳ Iniciando busca split...\n');

  const inicio = Date.now();
  const resultado = await searchRoundTripSplit(config);
  const duracao = Date.now() - inicio;

  console.log('\n═'.repeat(60));
  console.log(`\n⏱️  Tempo de execução: ${(duracao / 1000).toFixed(2)}s\n`);

  if (!resultado.success) {
    console.error('\n❌ ERRO NA BUSCA\n');
    
    if (resultado.error?.outbound) {
      console.error('Erro na busca de IDA:');
      console.error(`  ${resultado.error.outbound}\n`);
    }
    
    if (resultado.error?.return) {
      console.error('Erro na busca de VOLTA:');
      console.error(`  ${resultado.error.return}\n`);
    }
    
    return;
  }

  console.log('✅ BUSCA CONCLUÍDA COM SUCESSO!\n');
  console.log('═'.repeat(60));

  // Metadata
  console.log('\n📊 INFORMAÇÕES DA BUSCA:\n');
  console.log(`   Rota: ${resultado.metadata.origin} ⇄ ${resultado.metadata.destination}`);
  console.log(`   Data Ida: ${resultado.metadata.outboundDate}`);
  console.log(`   Data Volta: ${resultado.metadata.returnDate}`);
  console.log(`   Moeda: ${resultado.metadata.currency}`);
  
  if (resultado.metadata.outboundSearchUrl) {
    console.log(`\n   🔗 URL Busca Ida: ${resultado.metadata.outboundSearchUrl}`);
  }
  if (resultado.metadata.returnSearchUrl) {
    console.log(`   🔗 URL Busca Volta: ${resultado.metadata.returnSearchUrl}`);
  }

  // Resultados
  console.log('\n═'.repeat(60));
  console.log('\n📈 RESULTADOS:\n');
  console.log(`   🛫 Voos de IDA: ${resultado.outboundResults.length}`);
  console.log(`   🛬 Voos de VOLTA: ${resultado.returnResults.length}`);
  console.log(`   🔄 Combinações possíveis: ${resultado.outboundResults.length * resultado.returnResults.length}`);

  // Estatísticas
  if (resultado.statistics) {
    console.log('\n═'.repeat(60));
    console.log('\n💰 ESTATÍSTICAS DE PREÇOS:\n');
    console.log(`   Melhor voo de IDA: ${resultado.metadata.currency} $${resultado.statistics.bestOutboundPrice.toFixed(2)}`);
    console.log(`   Melhor voo de VOLTA: ${resultado.metadata.currency} $${resultado.statistics.bestReturnPrice.toFixed(2)}`);
    console.log('   ' + '─'.repeat(40));
    console.log(`   MELHOR COMBINAÇÃO: ${resultado.metadata.currency} $${resultado.statistics.bestCombinedPrice.toFixed(2)}`);
    
    // Economia potencial
    if (resultado.outboundResults.length > 1 && resultado.returnResults.length > 1) {
      const precoMaxIda = Math.max(...resultado.outboundResults.map(f => f.price));
      const precoMaxVolta = Math.max(...resultado.returnResults.map(f => f.price));
      const economia = (precoMaxIda + precoMaxVolta) - resultado.statistics.bestCombinedPrice;
      
      if (economia > 0) {
        console.log(`\n   💡 Economia máxima possível: ${resultado.metadata.currency} $${economia.toFixed(2)}`);
      }
    }
  }

  // Detalhes dos voos de IDA
  if (resultado.outboundResults.length > 0) {
    console.log('\n═'.repeat(60));
    console.log('\n🛫 VOOS DE IDA (Top 3):\n');

    resultado.outboundResults.slice(0, 3).forEach((voo, index) => {
      console.log(`\n   ${index + 1}. ${voo.flights[0]?.airline} ${voo.flights[0]?.flightNumber}`);
      console.log(`      Preço: $${voo.price.toFixed(2)}${voo.isBestFlight ? ' ⭐ BEST' : ''}`);
      
      const primeiroLeg = voo.flights[0];
      const ultimoLeg = voo.flights[voo.flights.length - 1];
      
      console.log(`      ${primeiroLeg?.departureAirportCode} ${primeiroLeg?.departureTime}`);
      console.log(`      → ${ultimoLeg?.arrivalAirportCode} ${ultimoLeg?.arrivalTime}`);
      
      const horas = Math.floor(voo.totalDuration / 60);
      const minutos = voo.totalDuration % 60;
      console.log(`      Duração: ${horas}h ${minutos}min`);
      
      if (voo.flights.length > 1) {
        console.log(`      ⚠️  ${voo.flights.length - 1} escala(s)`);
      } else {
        console.log(`      ✈️  Voo direto`);
      }
      
      if (voo.carbonEmissions) {
        const diff = voo.carbonEmissions.differencePercent;
        const symbol = diff < 0 ? '✓' : diff > 0 ? '⚠️' : '=';
        console.log(`      🌱 CO₂: ${(voo.carbonEmissions.thisFlightGrams / 1000).toFixed(1)} kg (${diff > 0 ? '+' : ''}${diff}% ${symbol})`);
      }
    });
  }

  // Detalhes dos voos de VOLTA
  if (resultado.returnResults.length > 0) {
    console.log('\n═'.repeat(60));
    console.log('\n🛬 VOOS DE VOLTA (Top 3):\n');

    resultado.returnResults.slice(0, 3).forEach((voo, index) => {
      console.log(`\n   ${index + 1}. ${voo.flights[0]?.airline} ${voo.flights[0]?.flightNumber}`);
      console.log(`      Preço: $${voo.price.toFixed(2)}${voo.isBestFlight ? ' ⭐ BEST' : ''}`);
      
      const primeiroLeg = voo.flights[0];
      const ultimoLeg = voo.flights[voo.flights.length - 1];
      
      console.log(`      ${primeiroLeg?.departureAirportCode} ${primeiroLeg?.departureTime}`);
      console.log(`      → ${ultimoLeg?.arrivalAirportCode} ${ultimoLeg?.arrivalTime}`);
      
      const horas = Math.floor(voo.totalDuration / 60);
      const minutos = voo.totalDuration % 60;
      console.log(`      Duração: ${horas}h ${minutos}min`);
      
      if (voo.flights.length > 1) {
        console.log(`      ⚠️  ${voo.flights.length - 1} escala(s)`);
      } else {
        console.log(`      ✈️  Voo direto`);
      }
      
      if (voo.carbonEmissions) {
        const diff = voo.carbonEmissions.differencePercent;
        const symbol = diff < 0 ? '✓' : diff > 0 ? '⚠️' : '=';
        console.log(`      🌱 CO₂: ${(voo.carbonEmissions.thisFlightGrams / 1000).toFixed(1)} kg (${diff > 0 ? '+' : ''}${diff}% ${symbol})`);
      }
    });
  }

  // Análise de combinações
  console.log('\n═'.repeat(60));
  console.log('\n🔍 ANÁLISE DE COMBINAÇÕES:\n');

  // Melhor combinação geral
  const melhorIda = resultado.outboundResults[0];
  const melhorVolta = resultado.returnResults[0];
  
  if (melhorIda && melhorVolta) {
    console.log('   💎 Combinação de menor preço:');
    console.log(`      Ida: ${melhorIda.flights[0]?.airline} - $${melhorIda.price.toFixed(2)}`);
    console.log(`      Volta: ${melhorVolta.flights[0]?.airline} - $${melhorVolta.price.toFixed(2)}`);
    console.log(`      Total: $${(melhorIda.price + melhorVolta.price).toFixed(2)}`);
  }

  // Combinação mais rápida
  const idaRapida = [...resultado.outboundResults].sort((a, b) => a.totalDuration - b.totalDuration)[0];
  const voltaRapida = [...resultado.returnResults].sort((a, b) => a.totalDuration - b.totalDuration)[0];
  
  if (idaRapida && voltaRapida) {
    const duracaoTotal = idaRapida.totalDuration + voltaRapida.totalDuration;
    const horasTotal = Math.floor(duracaoTotal / 60);
    const minutosTotal = duracaoTotal % 60;
    
    console.log('\n   ⚡ Combinação mais rápida:');
    console.log(`      Ida: ${idaRapida.flights[0]?.airline} - ${Math.floor(idaRapida.totalDuration / 60)}h ${idaRapida.totalDuration % 60}min`);
    console.log(`      Volta: ${voltaRapida.flights[0]?.airline} - ${Math.floor(voltaRapida.totalDuration / 60)}h ${voltaRapida.totalDuration % 60}min`);
    console.log(`      Duração total: ${horasTotal}h ${minutosTotal}min`);
    console.log(`      Preço: $${(idaRapida.price + voltaRapida.price).toFixed(2)}`);
  }

  // Voos diretos
  const idaDireta = resultado.outboundResults.filter(v => v.flights.length === 1);
  const voltaDireta = resultado.returnResults.filter(v => v.flights.length === 1);
  
  if (idaDireta.length > 0 && voltaDireta.length > 0) {
    const melhorIdaDireta = idaDireta[0];
    const melhorVoltaDireta = voltaDireta[0];
    
    console.log('\n   ✈️  Combinação com voos diretos:');
    console.log(`      Ida: ${melhorIdaDireta.flights[0]?.airline} - $${melhorIdaDireta.price.toFixed(2)}`);
    console.log(`      Volta: ${melhorVoltaDireta.flights[0]?.airline} - $${melhorVoltaDireta.price.toFixed(2)}`);
    console.log(`      Total: $${(melhorIdaDireta.price + melhorVoltaDireta.price).toFixed(2)}`);
  } else {
    console.log('\n   ⚠️  Nenhuma combinação com voos diretos disponível');
  }

  // Distribuição de escalas
  console.log('\n═'.repeat(60));
  console.log('\n📊 DISTRIBUIÇÃO DE ESCALAS:\n');

  const contarEscalas = (voos: typeof resultado.outboundResults) => {
    const distribuicao: Record<number, number> = {};
    voos.forEach(voo => {
      const escalas = voo.flights.length - 1;
      distribuicao[escalas] = (distribuicao[escalas] || 0) + 1;
    });
    return distribuicao;
  };

  const escalaIda = contarEscalas(resultado.outboundResults);
  const escalaVolta = contarEscalas(resultado.returnResults);

  console.log('   Voos de IDA:');
  Object.entries(escalaIda).sort().forEach(([escalas, count]) => {
    const label = escalas === '0' ? 'Direto' : `${escalas} escala(s)`;
    console.log(`      ${label}: ${count} voo(s)`);
  });

  console.log('\n   Voos de VOLTA:');
  Object.entries(escalaVolta).sort().forEach(([escalas, count]) => {
    const label = escalas === '0' ? 'Direto' : `${escalas} escala(s)`;
    console.log(`      ${label}: ${count} voo(s)`);
  });

  console.log('\n═'.repeat(60));
  console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!\n');
}

// Executa o teste
testeRapidoSplit().catch(error => {
  console.error('\n💥 ERRO CRÍTICO:', error);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
});

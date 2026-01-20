/**
 * Script de teste rápido para a função searchFlights
 * 
 * Para executar:
 * 1. Configure SERPAPI_KEY no arquivo .env
 * 2. Execute: npm run test:flights
 */

import { searchFlights } from './travel-api';

async function testeRapido() {
  console.log('\n🔍 Testando searchFlights - Voo de Ida e Volta\n');
  console.log('═'.repeat(60));
  
  const config = {
    origin: "GRU",           // São Paulo
    destination: "CDG",      // Paris
    outboundDate: "2026-03-03",
    returnDate: "2026-03-10",
    currency: "USD",
    maxResults: 5
  };

  console.log('\n📋 Configuração da Busca:');
  console.log(JSON.stringify(config, null, 2));
  console.log('\n⏳ Buscando voos...\n');

  const resultado = await searchFlights(config);

  if (!resultado.success) {
    console.error('\n❌ ERRO:', resultado.error);
    console.log('\n📊 Metadata:', resultado.metadata);
    return;
  }

  console.log('✅ Busca bem-sucedida!\n');
  console.log('═'.repeat(60));
  
  // Metadata
  console.log('\n📊 Informações da Busca:');
  console.log(`   Origem: ${resultado.metadata.origin}`);
  console.log(`   Destino: ${resultado.metadata.destination}`);
  console.log(`   Tipo: ${resultado.metadata.tripType}`);
  console.log(`   Ida: ${resultado.metadata.outboundDate}`);
  if (resultado.metadata.returnDate) {
    console.log(`   Volta: ${resultado.metadata.returnDate}`);
  }
  console.log(`   Moeda: ${resultado.metadata.currency}`);
  console.log(`   Resultados: ${resultado.metadata.totalResults}`);
  
  if (resultado.metadata.searchUrl) {
    console.log(`   🔗 URL: ${resultado.metadata.searchUrl}`);
  }

  // Paginação
  if (resultado.pagination) {
    console.log('\n📄 Paginação:');
    console.log(`   Há mais páginas? ${resultado.pagination.hasNextPage ? 'Sim ✓' : 'Não ✗'}`);
    if (resultado.pagination.nextPageToken) {
      console.log(`   Token: ${resultado.pagination.nextPageToken}`);
    }
  }

  // Resultados
  if (resultado.results.length === 0) {
    console.log('\n⚠️ Nenhum voo encontrado');
    return;
  }

  console.log('\n═'.repeat(60));
  console.log('\n✈️ VOOS ENCONTRADOS\n');

  resultado.results.forEach((voo, index) => {
    console.log(`\n🎫 Voo ${index + 1}${voo.isBestFlight ? ' ⭐ BEST FLIGHT' : ''}`);
    console.log('─'.repeat(60));
    console.log(`💰 Preço: ${voo.currency} $${voo.price.toFixed(2)}`);
    
    const horas = Math.floor(voo.totalDuration / 60);
    const minutos = voo.totalDuration % 60;
    console.log(`⏱️  Duração Total: ${horas}h ${minutos}min`);
    console.log(`🔗 Segmentos: ${voo.flights.length}`);

    // Emissões de carbono
    if (voo.carbonEmissions) {
      const { thisFlightGrams, typicalGrams, differencePercent } = voo.carbonEmissions;
      console.log(`\n🌱 Emissões de CO₂:`);
      console.log(`   Este voo: ${(thisFlightGrams / 1000).toFixed(2)} kg`);
      console.log(`   Típico: ${(typicalGrams / 1000).toFixed(2)} kg`);
      
      if (differencePercent < 0) {
        console.log(`   Diferença: ${differencePercent}% (Abaixo da média ✓)`);
      } else if (differencePercent > 0) {
        console.log(`   Diferença: +${differencePercent}% (Acima da média)`);
      } else {
        console.log(`   Diferença: ${differencePercent}% (Na média)`);
      }
    }

    // Detalhes dos segmentos
    console.log(`\n📍 Itinerário:`);
    voo.flights.forEach((segmento, segIndex) => {
      console.log(`\n   ${segIndex + 1}. ${segmento.airline} ${segmento.flightNumber}`);
      console.log(`      ${segmento.departureAirportCode} → ${segmento.arrivalAirportCode}`);
      console.log(`      ${segmento.departureTime} - ${segmento.arrivalTime}`);
      console.log(`      Duração: ${Math.floor(segmento.duration / 60)}h ${segmento.duration % 60}min`);
      
      if (segmento.airplane) {
        console.log(`      Aeronave: ${segmento.airplane}`);
      }
      
      if (segmento.travelClass) {
        console.log(`      Classe: ${segmento.travelClass}`);
      }
      
      if (segmento.legroom) {
        console.log(`      Espaço: ${segmento.legroom}`);
      }
      
      if (segmento.amenities && segmento.amenities.length > 0) {
        console.log(`      Amenidades: ${segmento.amenities.join(', ')}`);
      }
      
      // Escala
      if (segmento.layover) {
        const layoverHoras = Math.floor(segmento.layover.duration / 60);
        const layoverMin = segmento.layover.duration % 60;
        console.log(`\n      ⏱️  ESCALA: ${layoverHoras}h ${layoverMin}min`);
        console.log(`         em ${segmento.layover.airport}`);
      }
    });
  });

  // Estatísticas
  console.log('\n═'.repeat(60));
  console.log('\n📈 ESTATÍSTICAS\n');

  const precos = resultado.results.map(v => v.price);
  const duracoes = resultado.results.map(v => v.totalDuration);
  
  const precoMinimo = Math.min(...precos);
  const precoMaximo = Math.max(...precos);
  const precoMedio = precos.reduce((a, b) => a + b, 0) / precos.length;

  const duracaoMinima = Math.min(...duracoes);
  const duracaoMaxima = Math.max(...duracoes);

  console.log('💰 Preços:');
  console.log(`   Mínimo: ${config.currency} $${precoMinimo.toFixed(2)}`);
  console.log(`   Médio: ${config.currency} $${precoMedio.toFixed(2)}`);
  console.log(`   Máximo: ${config.currency} $${precoMaximo.toFixed(2)}`);

  console.log('\n⏱️  Durações:');
  console.log(`   Mais rápido: ${Math.floor(duracaoMinima / 60)}h ${duracaoMinima % 60}min`);
  console.log(`   Mais lento: ${Math.floor(duracaoMaxima / 60)}h ${duracaoMaxima % 60}min`);

  const bestFlights = resultado.results.filter(v => v.isBestFlight);
  console.log(`\n⭐ Best Flights: ${bestFlights.length} de ${resultado.results.length}`);

  const voosDiretos = resultado.results.filter(v => v.flights.length === 1);
  const voosUmaEscala = resultado.results.filter(v => v.flights.length === 2);
  const voosMaisEscalas = resultado.results.filter(v => v.flights.length > 2);

  console.log('\n🔀 Escalas:');
  console.log(`   Voos diretos: ${voosDiretos.length}`);
  console.log(`   1 escala: ${voosUmaEscala.length}`);
  console.log(`   2+ escalas: ${voosMaisEscalas.length}`);

  const voosComEmissoes = resultado.results.filter(v => v.carbonEmissions);
  if (voosComEmissoes.length > 0) {
    const emissoesAbaixoDaMedia = voosComEmissoes.filter(
      v => v.carbonEmissions && v.carbonEmissions.differencePercent < 0
    );
    console.log(`\n🌱 Emissões de CO₂:`);
    console.log(`   Dados disponíveis: ${voosComEmissoes.length} voos`);
    console.log(`   Abaixo da média: ${emissoesAbaixoDaMedia.length} voos`);
  }

  console.log('\n═'.repeat(60));
  console.log('\n✅ Teste concluído!\n');
}

// Executa o teste
testeRapido().catch(error => {
  console.error('\n💥 Erro crítico:', error);
  process.exit(1);
});

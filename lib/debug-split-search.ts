/**
 * Script de Debugging para a Busca Split
 * 
 * Mostra EXATAMENTE quais requisições estão sendo feitas à SerpApi
 * e qual é o erro retornado
 */

import { searchRoundTripSplit } from './travel-api';

async function debugSplit() {
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║               🔍 DEBUGGING: Busca Split de Voos                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const config = {
    origin: "GRU",
    destination: "CDG",
    outboundDate: "2026-03-03",
    returnDate: "2026-03-10",
    currency: "USD",
    maxResults: 3
  };

  console.log('INPUT PARAMETERS:');
  console.log(`  Origin: ${config.origin}`);
  console.log(`  Destination: ${config.destination}`);
  console.log(`  Outbound Date: ${config.outboundDate}`);
  console.log(`  Return Date: ${config.returnDate}`);
  console.log(`  Currency: ${config.currency}\n`);

  console.log('═'.repeat(80));
  console.log('Iniciando busca split...');
  console.log('═'.repeat(80));
  console.log('');

  try {
    const resultado = await searchRoundTripSplit(config);

    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('RESULTADO FINAL:');
    console.log('═'.repeat(80));
    
    if (resultado.success) {
      console.log('\n✅ SUCESSO!');
      console.log(`   Voos de IDA: ${resultado.outboundResults.length}`);
      console.log(`   Voos de VOLTA: ${resultado.returnResults.length}`);
      
      if (resultado.statistics) {
        console.log(`\n   Melhor combinação: ${config.currency} ${resultado.statistics.bestCombinedPrice.toFixed(2)}`);
      }
    } else {
      console.log('\n❌ FALHA NA BUSCA');
      if (resultado.error) {
        console.log(`\n   Erros:`, resultado.error);
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:');
    console.error(error);
  }
}

debugSplit();

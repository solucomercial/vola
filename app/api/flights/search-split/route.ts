/**
 * API Route: Busca Split de Voos (Ida e Volta Separadas)
 * 
 * Endpoint: POST /api/flights/search-split
 * 
 * Exemplo de uso:
 * POST /api/flights/search-split
 * {
 *   "origin": "GRU",
 *   "destination": "CDG",
 *   "outboundDate": "2026-03-03",
 *   "returnDate": "2026-03-10",
 *   "currency": "USD",
 *   "adults": 1,
 *   "children": 0,
 *   "travelClass": "1",
 *   "maxResults": 10
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchRoundTripSplit } from '@/lib/travel-api';

// Definição do schema de entrada
interface SearchSplitRequest {
  origin: string;
  destination: string;
  outboundDate: string;
  returnDate: string;
  currency?: string;
  adults?: number;
  children?: number;
  travelClass?: '1' | '2' | '3' | '4';
  maxResults?: number;
}

/**
 * POST /api/flights/search-split
 * Busca voos de ida e volta em requisições separadas
 */
export async function POST(request: NextRequest) {
  try {
    // Parse do body
    const body = await request.json() as SearchSplitRequest;

    // Validação básica
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationError 
        },
        { status: 400 }
      );
    }

    // Log da requisição
    console.log('\n[API] Requisição de busca split recebida:', {
      origin: body.origin,
      destination: body.destination,
      outboundDate: body.outboundDate,
      returnDate: body.returnDate,
      timestamp: new Date().toISOString()
    });

    // Executa a busca
    const resultado = await searchRoundTripSplit({
      origin: body.origin,
      destination: body.destination,
      outboundDate: body.outboundDate,
      returnDate: body.returnDate,
      currency: body.currency || 'BRL',
      adults: body.adults || 1,
      children: body.children || 0,
      travelClass: body.travelClass || '1',
      maxResults: body.maxResults || 20
    });

    // Log do resultado
    console.log('[API] Busca concluída:', {
      success: resultado.success,
      outboundCount: resultado.outboundResults.length,
      returnCount: resultado.returnResults.length,
      hasCombinedPrice: !!resultado.statistics?.bestCombinedPrice
    });

    // Retorna o resultado
    return NextResponse.json(resultado);

  } catch (error) {
    console.error('[API] Erro ao processar busca split:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        outboundResults: [],
        returnResults: [],
        metadata: {
          origin: '',
          destination: '',
          outboundDate: '',
          returnDate: '',
          currency: 'BRL'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/flights/search-split
 * Retorna informações sobre o endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/flights/search-split',
    method: 'POST',
    description: 'Busca voos de ida e volta em requisições separadas para máxima flexibilidade',
    parameters: {
      origin: {
        type: 'string',
        required: true,
        description: 'Código IATA do aeroporto de origem (ex: GRU)',
        example: 'GRU'
      },
      destination: {
        type: 'string',
        required: true,
        description: 'Código IATA do aeroporto de destino (ex: CDG)',
        example: 'CDG'
      },
      outboundDate: {
        type: 'string',
        required: true,
        description: 'Data de ida no formato YYYY-MM-DD',
        example: '2026-03-03'
      },
      returnDate: {
        type: 'string',
        required: true,
        description: 'Data de volta no formato YYYY-MM-DD',
        example: '2026-03-10'
      },
      currency: {
        type: 'string',
        required: false,
        default: 'BRL',
        description: 'Código da moeda (ex: USD, EUR, BRL)',
        example: 'USD'
      },
      adults: {
        type: 'number',
        required: false,
        default: 1,
        description: 'Número de adultos',
        example: 2
      },
      children: {
        type: 'number',
        required: false,
        default: 0,
        description: 'Número de crianças',
        example: 1
      },
      travelClass: {
        type: 'string',
        required: false,
        default: '1',
        description: 'Classe de viagem (1=Econômica, 2=Premium, 3=Executiva, 4=Primeira)',
        example: '1'
      },
      maxResults: {
        type: 'number',
        required: false,
        default: 20,
        description: 'Número máximo de resultados por trecho',
        example: 10
      }
    },
    response: {
      success: 'boolean',
      outboundResults: 'FlightSearchResult[]',
      returnResults: 'FlightSearchResult[]',
      metadata: 'object',
      statistics: 'object (opcional)',
      error: 'object (opcional)'
    },
    examples: {
      request: {
        origin: 'GRU',
        destination: 'CDG',
        outboundDate: '2026-03-03',
        returnDate: '2026-03-10',
        currency: 'USD',
        maxResults: 10
      }
    }
  });
}

/**
 * Valida os parâmetros da requisição
 */
function validateRequest(body: Partial<SearchSplitRequest>): string | null {
  // Campos obrigatórios
  if (!body.origin) {
    return 'Campo "origin" é obrigatório';
  }
  if (!body.destination) {
    return 'Campo "destination" é obrigatório';
  }
  if (!body.outboundDate) {
    return 'Campo "outboundDate" é obrigatório';
  }
  if (!body.returnDate) {
    return 'Campo "returnDate" é obrigatório';
  }

  // Validação de códigos IATA (3 letras)
  const iataRegex = /^[A-Z]{3}$/;
  if (!iataRegex.test(body.origin)) {
    return `Código de origem inválido: "${body.origin}". Use o formato de 3 letras (ex: GRU)`;
  }
  if (!iataRegex.test(body.destination)) {
    return `Código de destino inválido: "${body.destination}". Use o formato de 3 letras (ex: CDG)`;
  }

  // Validação de formato de data
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(body.outboundDate)) {
    return `Data de ida inválida: "${body.outboundDate}". Use o formato YYYY-MM-DD`;
  }
  if (!dateRegex.test(body.returnDate)) {
    return `Data de volta inválida: "${body.returnDate}". Use o formato YYYY-MM-DD`;
  }

  // Validação de datas
  const outboundDate = new Date(body.outboundDate);
  const returnDate = new Date(body.returnDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(outboundDate.getTime())) {
    return `Data de ida inválida: "${body.outboundDate}"`;
  }
  if (isNaN(returnDate.getTime())) {
    return `Data de volta inválida: "${body.returnDate}"`;
  }

  if (outboundDate < today) {
    return 'A data de ida não pode ser no passado';
  }
  if (returnDate <= outboundDate) {
    return 'A data de volta deve ser posterior à data de ida';
  }

  // Validação de classe de viagem
  if (body.travelClass && !['1', '2', '3', '4'].includes(body.travelClass)) {
    return `Classe de viagem inválida: "${body.travelClass}". Use: 1 (Econômica), 2 (Premium), 3 (Executiva), ou 4 (Primeira)`;
  }

  // Validação de passageiros
  if (body.adults !== undefined && (body.adults < 1 || body.adults > 9)) {
    return 'Número de adultos deve estar entre 1 e 9';
  }
  if (body.children !== undefined && (body.children < 0 || body.children > 8)) {
    return 'Número de crianças deve estar entre 0 e 8';
  }

  // Validação de maxResults
  if (body.maxResults !== undefined && (body.maxResults < 1 || body.maxResults > 100)) {
    return 'maxResults deve estar entre 1 e 100';
  }

  return null;
}

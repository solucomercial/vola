/**
 * Hook customizado para busca split de voos
 * 
 * Simplifica o uso da API de busca split no frontend
 */

'use client';

import { useState, useCallback } from 'react';
import { FlightSearchResult, RoundTripSplitResponse } from '@/lib/travel-api';

interface UseFlightSplitSearchParams {
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

interface FlightSelection {
  outbound: FlightSearchResult | null;
  return: FlightSearchResult | null;
}

interface UseFlightSplitSearchReturn {
  // Estado
  loading: boolean;
  error: string | null;
  results: RoundTripSplitResponse | null;
  selection: FlightSelection;
  
  // Ações
  search: (params: UseFlightSplitSearchParams) => Promise<void>;
  selectOutbound: (flight: FlightSearchResult) => void;
  selectReturn: (flight: FlightSearchResult) => void;
  clearSelection: () => void;
  reset: () => void;
  
  // Computed
  totalPrice: number | null;
  isSelectionComplete: boolean;
  canConfirm: boolean;
}

/**
 * Hook para busca split de voos
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     search, 
 *     loading, 
 *     results, 
 *     selectOutbound, 
 *     selectReturn,
 *     selection,
 *     totalPrice 
 *   } = useFlightSplitSearch();
 * 
 *   const handleSearch = () => {
 *     search({
 *       origin: 'GRU',
 *       destination: 'CDG',
 *       outboundDate: '2026-03-03',
 *       returnDate: '2026-03-10'
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleSearch} disabled={loading}>
 *         Buscar
 *       </button>
 *       {results && (
 *         <>
 *           {results.outboundResults.map(flight => (
 *             <FlightCard 
 *               key={flight.id} 
 *               flight={flight}
 *               onSelect={() => selectOutbound(flight)}
 *             />
 *           ))}
 *         </>
 *       )}
 *       {totalPrice && <p>Total: ${totalPrice}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFlightSplitSearch(): UseFlightSplitSearchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RoundTripSplitResponse | null>(null);
  const [selection, setSelection] = useState<FlightSelection>({
    outbound: null,
    return: null
  });

  /**
   * Realiza a busca de voos
   */
  const search = useCallback(async (params: UseFlightSplitSearchParams) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setSelection({ outbound: null, return: null });

    try {
      const response = await fetch('/api/flights/search-split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data: RoundTripSplitResponse = await response.json();

      if (!data.success) {
        throw new Error(
          data.error?.outbound || 
          data.error?.return || 
          'Erro ao buscar voos'
        );
      }

      setResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na busca de voos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Seleciona um voo de ida
   */
  const selectOutbound = useCallback((flight: FlightSearchResult) => {
    setSelection(prev => ({ ...prev, outbound: flight }));
  }, []);

  /**
   * Seleciona um voo de volta
   */
  const selectReturn = useCallback((flight: FlightSearchResult) => {
    setSelection(prev => ({ ...prev, return: flight }));
  }, []);

  /**
   * Limpa a seleção
   */
  const clearSelection = useCallback(() => {
    setSelection({ outbound: null, return: null });
  }, []);

  /**
   * Reseta todo o estado
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResults(null);
    setSelection({ outbound: null, return: null });
  }, []);

  // Computed values
  const totalPrice = selection.outbound && selection.return
    ? selection.outbound.price + selection.return.price
    : null;

  const isSelectionComplete = Boolean(selection.outbound && selection.return);
  const canConfirm = isSelectionComplete && !loading;

  return {
    // Estado
    loading,
    error,
    results,
    selection,
    
    // Ações
    search,
    selectOutbound,
    selectReturn,
    clearSelection,
    reset,
    
    // Computed
    totalPrice,
    isSelectionComplete,
    canConfirm
  };
}

/**
 * Hook para filtrar voos
 * 
 * @example
 * ```tsx
 * const { filteredFlights, setFilter } = useFlightFilters(flights);
 * 
 * setFilter({ maxPrice: 1000, directOnly: true });
 * ```
 */
export function useFlightFilters(flights: FlightSearchResult[] = []) {
  const [filters, setFilters] = useState({
    maxPrice: Infinity,
    minPrice: 0,
    directOnly: false,
    bestFlightsOnly: false,
    maxDuration: Infinity,
    airlines: [] as string[],
    maxStops: Infinity
  });

  const filteredFlights = flights.filter(flight => {
    // Filtro de preço
    if (flight.price < filters.minPrice || flight.price > filters.maxPrice) {
      return false;
    }

    // Filtro de voos diretos
    if (filters.directOnly && flight.flights.length > 1) {
      return false;
    }

    // Filtro de best flights
    if (filters.bestFlightsOnly && !flight.isBestFlight) {
      return false;
    }

    // Filtro de duração
    if (flight.totalDuration > filters.maxDuration) {
      return false;
    }

    // Filtro de companhias aéreas
    if (filters.airlines.length > 0) {
      const flightAirlines = flight.flights.map(f => f.airline);
      const hasAirline = filters.airlines.some(airline => 
        flightAirlines.includes(airline)
      );
      if (!hasAirline) return false;
    }

    // Filtro de número de escalas
    const stops = flight.flights.length - 1;
    if (stops > filters.maxStops) {
      return false;
    }

    return true;
  });

  return {
    filters,
    setFilter: setFilters,
    filteredFlights,
    count: filteredFlights.length
  };
}

/**
 * Hook para ordenar voos
 * 
 * @example
 * ```tsx
 * const { sortedFlights, sortBy, setSortBy } = useFlightSort(flights);
 * 
 * setSortBy('price'); // Ordena por preço
 * ```
 */
export function useFlightSort(flights: FlightSearchResult[] = []) {
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedFlights = [...flights].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'duration':
        comparison = a.totalDuration - b.totalDuration;
        break;
      case 'departure':
        const aTime = a.flights[0]?.departureTime || '';
        const bTime = b.flights[0]?.departureTime || '';
        comparison = aTime.localeCompare(bTime);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  return {
    sortedFlights,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder
  };
}

/**
 * Hook para análise de combinações
 * 
 * @example
 * ```tsx
 * const analysis = useFlightCombinations(outboundFlights, returnFlights);
 * 
 * console.log(analysis.cheapest);
 * console.log(analysis.fastest);
 * ```
 */
export function useFlightCombinations(
  outboundFlights: FlightSearchResult[] = [],
  returnFlights: FlightSearchResult[] = []
) {
  // Melhor preço
  const cheapest = outboundFlights.length > 0 && returnFlights.length > 0
    ? {
        outbound: outboundFlights.reduce((min, f) => f.price < min.price ? f : min),
        return: returnFlights.reduce((min, f) => f.price < min.price ? f : min)
      }
    : null;

  // Mais rápido
  const fastest = outboundFlights.length > 0 && returnFlights.length > 0
    ? {
        outbound: outboundFlights.reduce((min, f) => 
          f.totalDuration < min.totalDuration ? f : min
        ),
        return: returnFlights.reduce((min, f) => 
          f.totalDuration < min.totalDuration ? f : min
        )
      }
    : null;

  // Voos diretos
  const directFlights = {
    outbound: outboundFlights.filter(f => f.flights.length === 1),
    return: returnFlights.filter(f => f.flights.length === 1)
  };

  const hasDirect = directFlights.outbound.length > 0 && directFlights.return.length > 0;

  const cheapestDirect = hasDirect
    ? {
        outbound: directFlights.outbound.reduce((min, f) => 
          f.price < min.price ? f : min
        ),
        return: directFlights.return.reduce((min, f) => 
          f.price < min.price ? f : min
        )
      }
    : null;

  // Best flights
  const bestFlights = {
    outbound: outboundFlights.filter(f => f.isBestFlight),
    return: returnFlights.filter(f => f.isBestFlight)
  };

  return {
    cheapest,
    fastest,
    directFlights,
    cheapestDirect,
    bestFlights,
    totalCombinations: outboundFlights.length * returnFlights.length
  };
}

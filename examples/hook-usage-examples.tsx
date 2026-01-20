/**
 * Exemplo de uso dos hooks customizados de busca split
 */

'use client';

import { useFlightSplitSearch, useFlightFilters, useFlightSort, useFlightCombinations } from '@/hooks/useFlightSplitSearch';

/**
 * Exemplo 1: Uso Básico
 */
export function BasicSearchExample() {
  const { 
    search, 
    loading, 
    error,
    results, 
    selectOutbound, 
    selectReturn,
    selection,
    totalPrice,
    canConfirm 
  } = useFlightSplitSearch();

  const handleSearch = () => {
    search({
      origin: 'GRU',
      destination: 'CDG',
      outboundDate: '2026-03-03',
      returnDate: '2026-03-10',
      currency: 'USD'
    });
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    
    console.log('Reserva confirmada:', {
      outbound: selection.outbound,
      return: selection.return,
      totalPrice
    });
    
    // Aqui você implementaria a lógica de reserva
    alert(`Reserva confirmada! Total: $${totalPrice?.toFixed(2)}`);
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar Voos'}
      </button>

      {error && <div className="error">{error}</div>}

      {results && (
        <div>
          <h2>Voos de Ida ({results.outboundResults.length})</h2>
          {results.outboundResults.map(flight => (
            <div 
              key={flight.id}
              onClick={() => selectOutbound(flight)}
              className={selection.outbound?.id === flight.id ? 'selected' : ''}
            >
              {flight.flights[0]?.airline} - ${flight.price}
            </div>
          ))}

          <h2>Voos de Volta ({results.returnResults.length})</h2>
          {results.returnResults.map(flight => (
            <div 
              key={flight.id}
              onClick={() => selectReturn(flight)}
              className={selection.return?.id === flight.id ? 'selected' : ''}
            >
              {flight.flights[0]?.airline} - ${flight.price}
            </div>
          ))}

          {totalPrice && (
            <div>
              <p>Total: ${totalPrice.toFixed(2)}</p>
              <button onClick={handleConfirm} disabled={!canConfirm}>
                Confirmar Reserva
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Exemplo 2: Com Filtros
 */
export function SearchWithFilters() {
  const { search, results, loading } = useFlightSplitSearch();
  
  const {
    filteredFlights: filteredOutbound,
    setFilter: setOutboundFilter,
    count: outboundCount
  } = useFlightFilters(results?.outboundResults);

  const {
    filteredFlights: filteredReturn,
    setFilter: setReturnFilter,
    count: returnCount
  } = useFlightFilters(results?.returnResults);

  const handleApplyFilters = () => {
    // Filtros para voos de ida
    setOutboundFilter({
      maxPrice: 1000,
      directOnly: true,
      bestFlightsOnly: false,
      maxDuration: 600, // 10 horas
      airlines: [],
      minPrice: 0,
      maxStops: 1
    });

    // Filtros para voos de volta
    setReturnFilter({
      maxPrice: 1000,
      directOnly: false,
      bestFlightsOnly: true,
      maxDuration: Infinity,
      airlines: ['LATAM', 'Gol'],
      minPrice: 0,
      maxStops: 2
    });
  };

  return (
    <div>
      <button onClick={() => search({
        origin: 'GRU',
        destination: 'MIA',
        outboundDate: '2026-04-01',
        returnDate: '2026-04-15'
      })}>
        Buscar
      </button>

      <button onClick={handleApplyFilters}>
        Aplicar Filtros
      </button>

      {!loading && results && (
        <>
          <p>Ida: {outboundCount} de {results.outboundResults.length} voos</p>
          <p>Volta: {returnCount} de {results.returnResults.length} voos</p>

          {filteredOutbound.map(flight => (
            <div key={flight.id}>
              {flight.flights[0]?.airline} - ${flight.price}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/**
 * Exemplo 3: Com Ordenação
 */
export function SearchWithSorting() {
  const { search, results } = useFlightSplitSearch();
  
  const {
    sortedFlights: sortedOutbound,
    sortBy: outboundSortBy,
    setSortBy: setOutboundSortBy,
    sortOrder: outboundSortOrder,
    toggleSortOrder: toggleOutboundSort
  } = useFlightSort(results?.outboundResults);

  return (
    <div>
      <div>
        <label>Ordenar por:</label>
        <select 
          value={outboundSortBy} 
          onChange={(e) => setOutboundSortBy(e.target.value as any)}
        >
          <option value="price">Preço</option>
          <option value="duration">Duração</option>
          <option value="departure">Horário de partida</option>
        </select>

        <button onClick={toggleOutboundSort}>
          {outboundSortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {sortedOutbound.map(flight => (
        <div key={flight.id}>
          {flight.flights[0]?.airline} - ${flight.price}
        </div>
      ))}
    </div>
  );
}

/**
 * Exemplo 4: Análise de Combinações
 */
export function SearchWithAnalysis() {
  const { search, results } = useFlightSplitSearch();

  const analysis = useFlightCombinations(
    results?.outboundResults,
    results?.returnResults
  );

  return (
    <div>
      <button onClick={() => search({
        origin: 'GRU',
        destination: 'LHR',
        outboundDate: '2026-05-01',
        returnDate: '2026-05-15'
      })}>
        Buscar
      </button>

      {analysis.cheapest && (
        <div>
          <h3>💰 Combinação Mais Barata</h3>
          <p>Ida: {analysis.cheapest.outbound.flights[0]?.airline} - ${analysis.cheapest.outbound.price}</p>
          <p>Volta: {analysis.cheapest.return.flights[0]?.airline} - ${analysis.cheapest.return.price}</p>
          <p>Total: ${(analysis.cheapest.outbound.price + analysis.cheapest.return.price).toFixed(2)}</p>
        </div>
      )}

      {analysis.fastest && (
        <div>
          <h3>⚡ Combinação Mais Rápida</h3>
          <p>Ida: {Math.floor(analysis.fastest.outbound.totalDuration / 60)}h</p>
          <p>Volta: {Math.floor(analysis.fastest.return.totalDuration / 60)}h</p>
          <p>Total: {Math.floor((analysis.fastest.outbound.totalDuration + analysis.fastest.return.totalDuration) / 60)}h</p>
        </div>
      )}

      {analysis.cheapestDirect && (
        <div>
          <h3>✈️ Melhor Voo Direto</h3>
          <p>Ida: ${analysis.cheapestDirect.outbound.price}</p>
          <p>Volta: ${analysis.cheapestDirect.return.price}</p>
          <p>Total: ${(analysis.cheapestDirect.outbound.price + analysis.cheapestDirect.return.price).toFixed(2)}</p>
        </div>
      )}

      <p>Total de combinações: {analysis.totalCombinations}</p>
    </div>
  );
}

/**
 * Exemplo 5: Busca Completa com Todos os Recursos
 */
export function FullFeaturedSearch() {
  const { 
    search, 
    loading, 
    error,
    results, 
    selectOutbound, 
    selectReturn,
    selection,
    totalPrice,
    canConfirm,
    clearSelection,
    reset
  } = useFlightSplitSearch();

  const {
    filteredFlights: filteredOutbound,
    setFilter: setOutboundFilter,
    filters: outboundFilters
  } = useFlightFilters(results?.outboundResults);

  const {
    sortedFlights: sortedFilteredOutbound,
    sortBy,
    setSortBy
  } = useFlightSort(filteredOutbound);

  const analysis = useFlightCombinations(
    results?.outboundResults,
    results?.returnResults
  );

  const handleSearch = (formData: any) => {
    reset(); // Limpa tudo antes de nova busca
    search(formData);
  };

  const handleQuickFilter = (filter: 'cheap' | 'fast' | 'direct') => {
    switch (filter) {
      case 'cheap':
        setSortBy('price');
        break;
      case 'fast':
        setSortBy('duration');
        break;
      case 'direct':
        setOutboundFilter({ ...outboundFilters, directOnly: true });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de busca */}
      <div>
        <h2>Buscar Voos</h2>
        {/* Seu formulário aqui */}
        <button onClick={() => handleSearch({
          origin: 'GRU',
          destination: 'CDG',
          outboundDate: '2026-03-03',
          returnDate: '2026-03-10'
        })}>
          Buscar
        </button>
      </div>

      {/* Loading */}
      {loading && <div>Carregando...</div>}

      {/* Erro */}
      {error && <div className="error">{error}</div>}

      {/* Resultados */}
      {results && !loading && (
        <>
          {/* Análise rápida */}
          {analysis.cheapest && (
            <div className="bg-blue-50 p-4 rounded">
              <h3>📊 Análise Rápida</h3>
              <button onClick={() => {
                selectOutbound(analysis.cheapest!.outbound);
                selectReturn(analysis.cheapest!.return);
              }}>
                💰 Mais Barato: ${(analysis.cheapest.outbound.price + analysis.cheapest.return.price).toFixed(2)}
              </button>
              
              {analysis.fastest && (
                <button onClick={() => {
                  selectOutbound(analysis.fastest!.outbound);
                  selectReturn(analysis.fastest!.return);
                }}>
                  ⚡ Mais Rápido: {Math.floor((analysis.fastest.outbound.totalDuration + analysis.fastest.return.totalDuration) / 60)}h
                </button>
              )}
            </div>
          )}

          {/* Filtros rápidos */}
          <div>
            <button onClick={() => handleQuickFilter('cheap')}>💰 Mais Barato</button>
            <button onClick={() => handleQuickFilter('fast')}>⚡ Mais Rápido</button>
            <button onClick={() => handleQuickFilter('direct')}>✈️ Voos Diretos</button>
          </div>

          {/* Ordenação */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="price">Ordenar por Preço</option>
            <option value="duration">Ordenar por Duração</option>
            <option value="departure">Ordenar por Horário</option>
          </select>

          {/* Lista de voos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3>Voos de Ida ({sortedFilteredOutbound.length})</h3>
              {sortedFilteredOutbound.map(flight => (
                <div 
                  key={flight.id}
                  onClick={() => selectOutbound(flight)}
                  className={selection.outbound?.id === flight.id ? 'selected' : ''}
                >
                  {flight.flights[0]?.airline} - ${flight.price}
                  {flight.isBestFlight && <span>⭐</span>}
                </div>
              ))}
            </div>

            <div>
              <h3>Voos de Volta ({results.returnResults.length})</h3>
              {results.returnResults.map(flight => (
                <div 
                  key={flight.id}
                  onClick={() => selectReturn(flight)}
                  className={selection.return?.id === flight.id ? 'selected' : ''}
                >
                  {flight.flights[0]?.airline} - ${flight.price}
                  {flight.isBestFlight && <span>⭐</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Resumo e confirmação */}
          {totalPrice && (
            <div className="bg-gray-50 p-4 rounded">
              <h3>Sua Seleção</h3>
              <p>Ida: {selection.outbound?.flights[0]?.airline}</p>
              <p>Volta: {selection.return?.flights[0]?.airline}</p>
              <p className="font-bold text-xl">Total: ${totalPrice.toFixed(2)}</p>
              
              <div className="flex gap-2">
                <button onClick={clearSelection}>Limpar</button>
                <button onClick={() => {/* confirmar */}} disabled={!canConfirm}>
                  Confirmar Reserva
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

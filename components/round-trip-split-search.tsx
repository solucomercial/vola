/**
 * Exemplo de Componente React para Busca Split de Voos
 * 
 * Este componente demonstra como implementar a busca de ida e volta
 * com seleção independente de cada trecho.
 */

'use client';

import { useState } from 'react';
import { searchRoundTripSplit, FlightSearchResult, RoundTripSplitResponse } from '@/lib/travel-api';

interface FlightSelectionState {
  outbound: FlightSearchResult | null;
  return: FlightSearchResult | null;
}

export function RoundTripSplitSearch() {
  const [searchResults, setSearchResults] = useState<RoundTripSplitResponse | null>(null);
  const [selectedFlights, setSelectedFlights] = useState<FlightSelectionState>({
    outbound: null,
    return: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulário de busca
  const [searchForm, setSearchForm] = useState({
    origin: 'GRU',
    destination: 'CDG',
    outboundDate: '2026-03-03',
    returnDate: '2026-03-10',
    currency: 'USD'
  });

  /**
   * Realiza a busca de voos
   */
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSelectedFlights({ outbound: null, return: null });

    try {
      const resultado = await searchRoundTripSplit({
        origin: searchForm.origin,
        destination: searchForm.destination,
        outboundDate: searchForm.outboundDate,
        returnDate: searchForm.returnDate,
        currency: searchForm.currency,
        maxResults: 10
      });

      if (!resultado.success) {
        throw new Error('Erro ao buscar voos');
      }

      setSearchResults(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Seleciona um voo de ida
   */
  const handleSelectOutbound = (flight: FlightSearchResult) => {
    setSelectedFlights(prev => ({ ...prev, outbound: flight }));
  };

  /**
   * Seleciona um voo de volta
   */
  const handleSelectReturn = (flight: FlightSearchResult) => {
    setSelectedFlights(prev => ({ ...prev, return: flight }));
  };

  /**
   * Calcula o preço total da viagem
   */
  const getTotalPrice = () => {
    if (!selectedFlights.outbound || !selectedFlights.return) return null;
    return selectedFlights.outbound.price + selectedFlights.return.price;
  };

  /**
   * Finaliza a reserva
   */
  const handleConfirmBooking = () => {
    if (!selectedFlights.outbound || !selectedFlights.return) {
      alert('Selecione ambos os voos (ida e volta)');
      return;
    }

    const totalPrice = getTotalPrice();
    console.log('Reserva confirmada:', {
      outbound: selectedFlights.outbound,
      return: selectedFlights.return,
      totalPrice
    });

    // Aqui você implementaria a lógica de reserva
    alert(`Reserva confirmada! Total: ${searchForm.currency} ${totalPrice?.toFixed(2)}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Busca de Voos - Ida e Volta</h1>

      {/* Formulário de Busca */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Origem (ex: GRU)"
            value={searchForm.origin}
            onChange={(e) => setSearchForm({ ...searchForm, origin: e.target.value.toUpperCase() })}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Destino (ex: CDG)"
            value={searchForm.destination}
            onChange={(e) => setSearchForm({ ...searchForm, destination: e.target.value.toUpperCase() })}
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={searchForm.outboundDate}
            onChange={(e) => setSearchForm({ ...searchForm, outboundDate: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={searchForm.returnDate}
            onChange={(e) => setSearchForm({ ...searchForm, returnDate: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Buscando...' : 'Buscar Voos'}
          </button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Resultados */}
      {searchResults && (
        <>
          {/* Estatísticas */}
          {searchResults.statistics && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-lg mb-2">💡 Melhor Combinação</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Melhor Ida</p>
                  <p className="text-xl font-bold text-green-600">
                    {searchForm.currency} {searchResults.statistics.bestOutboundPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Melhor Volta</p>
                  <p className="text-xl font-bold text-green-600">
                    {searchForm.currency} {searchResults.statistics.bestReturnPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-green-700">
                    {searchForm.currency} {searchResults.statistics.bestCombinedPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Layout de Duas Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna IDA */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                  🛫
                </span>
                Voos de Ida ({searchResults.outboundResults.length})
              </h2>
              
              {searchResults.outboundResults.length === 0 ? (
                <p className="text-gray-500">Nenhum voo de ida encontrado</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.outboundResults.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      currency={searchForm.currency}
                      selected={selectedFlights.outbound?.id === flight.id}
                      onSelect={() => handleSelectOutbound(flight)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Coluna VOLTA */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                  🛬
                </span>
                Voos de Volta ({searchResults.returnResults.length})
              </h2>
              
              {searchResults.returnResults.length === 0 ? (
                <p className="text-gray-500">Nenhum voo de volta encontrado</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.returnResults.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      currency={searchForm.currency}
                      selected={selectedFlights.return?.id === flight.id}
                      onSelect={() => handleSelectReturn(flight)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumo da Seleção e Botão de Confirmação */}
          {(selectedFlights.outbound || selectedFlights.return) && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Sua Seleção</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Voo de Ida</p>
                  {selectedFlights.outbound ? (
                    <div className="bg-white p-3 rounded border">
                      <p className="font-semibold">
                        {selectedFlights.outbound.flights[0]?.airline} {selectedFlights.outbound.flights[0]?.flightNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {searchForm.currency} {selectedFlights.outbound.price.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Nenhum voo selecionado</p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Voo de Volta</p>
                  {selectedFlights.return ? (
                    <div className="bg-white p-3 rounded border">
                      <p className="font-semibold">
                        {selectedFlights.return.flights[0]?.airline} {selectedFlights.return.flights[0]?.flightNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {searchForm.currency} {selectedFlights.return.price.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Nenhum voo selecionado</p>
                  )}
                </div>
              </div>

              {getTotalPrice() && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Preço Total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {searchForm.currency} {getTotalPrice()!.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!selectedFlights.outbound || !selectedFlights.return}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Confirmar Reserva
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Componente de Card de Voo
 */
interface FlightCardProps {
  flight: FlightSearchResult;
  currency: string;
  selected: boolean;
  onSelect: () => void;
}

function FlightCard({ flight, currency, selected, onSelect }: FlightCardProps) {
  const firstLeg = flight.flights[0];
  const lastLeg = flight.flights[flight.flights.length - 1];
  const hasLayover = flight.flights.length > 1;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div
      onClick={onSelect}
      className={`
        border rounded-lg p-4 cursor-pointer transition-all
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-400 hover:shadow'
        }
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          {firstLeg?.airlineLogo && (
            <img src={firstLeg.airlineLogo} alt={firstLeg.airline} className="w-8 h-8" />
          )}
          <div>
            <p className="font-semibold">{firstLeg?.airline}</p>
            <p className="text-sm text-gray-600">{firstLeg?.flightNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600">
            {currency} {flight.price.toFixed(2)}
          </p>
          {flight.isBestFlight && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              ⭐ Best
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-lg font-semibold">{firstLeg?.departureTime?.split(' ')[1]}</p>
          <p className="text-sm text-gray-600">{firstLeg?.departureAirportCode}</p>
        </div>
        
        <div className="flex-1 mx-4 text-center">
          <p className="text-sm text-gray-500">{formatDuration(flight.totalDuration)}</p>
          <div className="w-full h-px bg-gray-300 my-1"></div>
          {hasLayover ? (
            <p className="text-xs text-orange-600">{flight.flights.length - 1} escala(s)</p>
          ) : (
            <p className="text-xs text-green-600">Direto</p>
          )}
        </div>
        
        <div className="text-right">
          <p className="text-lg font-semibold">{lastLeg?.arrivalTime?.split(' ')[1]}</p>
          <p className="text-sm text-gray-600">{lastLeg?.arrivalAirportCode}</p>
        </div>
      </div>

      {flight.carbonEmissions && (
        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
          <span className="mr-2">🌱</span>
          Emissões: {(flight.carbonEmissions.thisFlightGrams / 1000).toFixed(1)} kg CO₂
          {flight.carbonEmissions.differencePercent < 0 && (
            <span className="text-green-600 ml-2">
              ({flight.carbonEmissions.differencePercent}% abaixo da média)
            </span>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-blue-600 font-medium">✓ Selecionado</p>
        </div>
      )}
    </div>
  );
}

// lib/travel-api.ts
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
}

const RAPID_HOST = 'booking-com15.p.rapidapi.com';
const BASE_URL_RAPID = `https://${RAPID_HOST}/api/v1`;

export async function fetchFlightOffers(origin: string, destination: string, date: string, returnDate?: string): Promise<TravelOption[]> {
  try {
    const tripType = returnDate ? "1" : "2";
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origin.toUpperCase()}&arrival_id=${destination.toUpperCase()}&outbound_date=${date}&type=${tripType}&currency=BRL&api_key=${process.env.SERPAPI_KEY}${returnDate ? `&return_date=${returnDate}` : ''}`;
    
    const res = await fetch(url);
    const data = await res.json();

    console.log("\n==================== AUDITORIA: RAW SERPAPI (VOOS) ====================");
    console.dir(data, { depth: null, colors: true });

    const flights = [...(data.best_flights || []), ...(data.other_flights || [])];

    return flights.slice(0, 20).map((f: any, index: number) => ({
      id: `flight-${index}`,
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
    const locRes = await fetch(`${BASE_URL_RAPID}/cars/searchDestination?query=${encodeURIComponent(destination)}`, {
      headers: { 'x-rapidapi-key': process.env.RAPIDAPI_KEY || '', 'x-rapidapi-host': RAPID_HOST }
    });
    const locData = await locRes.json();
    const location = locData.data?.[0];

    if (!location?.coordinates) return [];

    const { latitude, longitude } = location.coordinates;

    const carUrl = `${BASE_URL_RAPID}/cars/searchCarRentals?pick_up_latitude=${latitude}&pick_up_longitude=${longitude}&drop_off_latitude=${latitude}&drop_off_longitude=${longitude}&pick_up_date=${date}&drop_off_date=${returnDate}&pick_up_time=10:00&drop_off_time=10:00&currency_code=BRL`;

    const res = await fetch(carUrl, {
      headers: { 'x-rapidapi-key': process.env.RAPIDAPI_KEY || '', 'x-rapidapi-host': RAPID_HOST }
    });
    const data = await res.json();

    console.log("\n==================== AUDITORIA: RAW RAPIDAPI (CARROS) ====================");
    console.dir(data, { depth: null, colors: true });

    return (data.data || []).slice(0, 20).map((c: any, index: number) => ({
      id: `car-${index}`,
      provider: c.vendor_info?.name || "Locadora",
      price: c.price_info?.total_price || 0,
      details: `${c.vehicle_info?.label || 'Veículo'} - ${c.vehicle_info?.transmission || ''}`,
      bookingUrl: c.reservation_url
    }));
  } catch (error) {
    console.error("[ERRO AUDITORIA] RapidAPI Cars:", error);
    return [];
  }
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
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

async function getDestinationId(cityName: string): Promise<string | null> {
  try {
    const url = `${BASE_URL_RAPID}/hotels/searchDestination?query=${encodeURIComponent(cityName)}`;
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        'x-rapidapi-host': RAPID_HOST
      }
    });
    const data = await res.json();
    return data.data?.[0]?.dest_id || null;
  } catch (error) {
    console.error("Erro ao buscar ID do destino:", error);
    return null;
  }
}

export async function fetchFlightOffers(origin: string, destination: string, date: string, returnDate?: string): Promise<TravelOption[]> {
  try {
    const tripType = returnDate ? "1" : "2";
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origin.toUpperCase()}&arrival_id=${destination.toUpperCase()}&outbound_date=${date}&type=${tripType}&currency=BRL&api_key=${process.env.SERPAPI_KEY}${returnDate ? `&return_date=${returnDate}` : ''}`;
    
    const res = await fetch(url);
    const data = await res.json();

    const flights = [...(data.best_flights || []), ...(data.other_flights || [])];

    return flights.slice(0, 20).map((f: any, index: number) => {
      const flightData = f.flights[0];
      return {
        id: `flight-${index}`,
        provider: flightData.airline,
        price: f.price || 0,
        details: `${flightData.travel_class} - Duração: ${f.total_duration} min`,
        bookingUrl: data.search_metadata?.google_flights_url,
        departureTime: flightData.departure_airport?.time?.split(' ')[1],
        arrivalTime: flightData.arrival_airport?.time?.split(' ')[1],
        flightNumber: flightData.flight_number,
        airplane: flightData.airplane,
        legroom: flightData.legroom,
        amenities: flightData.extensions || [],
        airlineLogo: flightData.airline_logo,
        departureAirport: flightData.departure_airport?.name,
        arrivalAirport: flightData.arrival_airport?.name,
      };
    });
  } catch (error) {
    console.error("Erro SerpApi Flights:", error);
    return [];
  }
}

export async function fetchHotelOffers(destination: string, checkIn: string, checkOut: string): Promise<TravelOption[]> {
  try {
    const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(destination + ' Hotels')}&check_in_date=${checkIn}&check_out_date=${checkOut}&currency=BRL&api_key=${process.env.SERPAPI_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();

    return (data.properties || []).slice(0, 20).map((h: any, index: number) => ({
      id: `hotel-${index}`,
      provider: h.name,
      // Fallback robusto para o preço: tenta várias propriedades do JSON da SerpApi
      price: h.rate_per_night?.extracted_value || h.rate_per_night?.value || h.total_rate?.extracted_value || h.total_rate?.value || 0,
      details: h.description || 'Hospedagem selecionada via Google Hotels',
      bookingUrl: h.link,
      images: h.images?.map((img: any) => img.thumbnail) || [h.thumbnail],
      rating: h.overall_rating,
      reviewsCount: h.reviews,
      locationDetails: h.location_rating ? `${h.location_rating}/5 em localização` : "Localização central",
      hotelAmenities: h.amenities || []
    }));
  } catch (error) {
    console.error("Erro SerpApi Hotels:", error);
    return [];
  }
}

export async function fetchCarOffers(destination: string, date: string, returnDate: string): Promise<TravelOption[]> {
  try {
    const destId = await getDestinationId(destination);
    if (!destId) return [];

    const url = `${BASE_URL_RAPID}/hotels/searchCars?dest_id=${destId}&arrival_date=${date}&departure_date=${returnDate}&currency=BRL`;
    const res = await fetch(url, {
      headers: { 'x-rapidapi-key': process.env.RAPIDAPI_KEY || '', 'x-rapidapi-host': RAPID_HOST }
    });
    const data = await res.json();
    const results = data.data?.result || [];

    return results.slice(0, 20).map((c: any, index: number) => ({
      id: `car-${index}`,
      provider: c.name || "Locadora",
      price: c.price || 0,
      details: c.description || "Veículo disponível",
      bookingUrl: c.url
    }));
  } catch (error) {
    console.error("Erro RapidAPI Cars:", error);
    return [];
  }
}
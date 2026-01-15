export interface TravelOption {
  id: string;
  provider: string;
  price: number;
  details: string;
  bookingUrl?: string;
}

// 1. Voos via SerpApi (Google Flights)
export async function fetchFlightOffers(origin: string, destination: string, date: string): Promise<TravelOption[]> {
  try {
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origin}&arrival_id=${destination}&outbound_date=${date}&currency=BRL&api_key=${process.env.SERPAPI_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    return (data.best_flights || []).slice(0, 5).map((f: any, index: number) => ({
      id: `flight-${index}`,
      provider: f.flights[0].airline,
      price: f.price,
      details: `${f.flights[0].travel_class} - ${f.total_duration} min`,
      bookingUrl: data.search_metadata.google_flights_url // Link direto do Google Flights
    }));
  } catch (error) {
    console.error("Erro SerpApi Flights:", error);
    return [];
  }
}

// 2. Hotéis e Carros via RapidAPI (Exemplo usando Booking.com da ApiDojo)
export async function fetchRapidApiOffers(type: 'hotel' | 'car', destination: string, date: string): Promise<TravelOption[]> {
  try {
    const endpoint = type === 'hotel' ? 'searchLocation' : 'searchCars'; // Ajustar conforme a documentação da API escolhida no RapidAPI
    const res = await fetch(`https://booking-com.p.rapidapi.com/v1/hotels/search?dest_type=city&arrival_date=${date}&order_by=price&adults_number=1&units=metric&room_number=1&dest_id=-2354024`, { // Exemplo de ID para SP/Brasil
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'booking-com.p.rapidapi.com'
      }
    });
    const data = await res.json();

    return (data.result || []).slice(0, 5).map((item: any) => ({
      id: item.hotel_id?.toString() || item.id,
      provider: item.hotel_name || item.name,
      price: item.min_total_price || 0,
      details: item.address || 'Disponível',
      bookingUrl: item.url // Link direto para reserva no Booking.com
    }));
  } catch (error) {
    console.error(`Erro RapidAPI ${type}:`, error);
    return [];
  }
}
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
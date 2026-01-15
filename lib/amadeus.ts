import Amadeus from 'amadeus';

export const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

export interface TravelOption {
  id: string;
  provider: string;
  price: number;
  details: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
}

// O nome deve ser EXATAMENTE fetchFlightOffers para as actions funcionarem
export async function fetchFlightOffers(origin: string, destination: string, date: string): Promise<TravelOption[]> {
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: '1',
      max: '5'
    });

    return response.data.map((offer: any) => ({
      id: offer.id,
      provider: offer.validatingAirlineCodes[0],
      price: parseFloat(offer.price.total),
      details: `${offer.itineraries[0].segments[0].cabin} - ${offer.numberOfBookableSeats} assentos restantes`,
      departureTime: offer.itineraries[0].segments[0].departure.at.split('T')[1],
      arrivalTime: offer.itineraries[0].segments[0].arrival.at.split('T')[1],
      duration: offer.itineraries[0].duration.replace('PT', '').toLowerCase(),
    }));
  } catch (error: any) {
    console.error("--- ERRO NA API AMADEUS ---", error.response?.result || error);
    return [];
  }
}
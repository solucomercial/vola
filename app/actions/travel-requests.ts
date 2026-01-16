// app/actions/travel-requests.ts
"use server"

import { db } from "@/db";
import { travelRequests } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { fetchFlightOffers, fetchHotelOffers, fetchCarOffers } from "@/lib/travel-api";

export async function searchOptionsAction(type: string, origin: string, destination: string, date: string, returnDate: string) {
  const fmtDate = new Date(date).toISOString().split('T')[0];
  const fmtReturnDate = new Date(returnDate).toISOString().split('T')[0];
  
  if (type === 'flight') return await fetchFlightOffers(origin, destination, fmtDate, fmtReturnDate);
  if (type === 'hotel') return await fetchHotelOffers(destination, fmtDate, fmtReturnDate);
  if (type === 'car') return await fetchCarOffers(destination, fmtDate, fmtReturnDate);
  
  return [];
}

export async function createTravelRequestAction(data: any) {
  try {
    await db.insert(travelRequests).values({
      ...data,
      departureDate: new Date(data.departureDate),
      returnDate: new Date(data.returnDate),
      bookingUrl: data.selectedOption.bookingUrl || null,
      status: "pending",
    });

    revalidatePath("/overview");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar solicitação:", error);
    return { success: false };
  }
}
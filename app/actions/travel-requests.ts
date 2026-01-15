"use server"

import { db } from "@/db";
import { travelRequests } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { fetchFlightOffers, fetchRapidApiOffers } from "@/lib/travel-api";

export async function searchOptionsAction(type: string, origin: string, destination: string, date: string) {
  const fmtDate = new Date(date).toISOString().split('T')[0];
  
  if (type === 'flight') return await fetchFlightOffers(origin, destination, fmtDate);
  if (type === 'hotel') return await fetchRapidApiOffers('hotel', destination, fmtDate);
  if (type === 'car') return await fetchRapidApiOffers('car', destination, fmtDate);
  
  return [];
}

export async function createTravelRequestAction(data: any) {
  try {
    await db.insert(travelRequests).values({
      userId: data.userId,
      userName: data.userName,
      type: data.type,
      origin: data.origin || null,
      destination: data.destination,
      departureDate: new Date(data.departureDate),
      returnDate: new Date(data.returnDate),
      reason: data.reason,
      selectedOption: data.selectedOption,
      alternatives: data.alternatives,
      bookingUrl: data.selectedOption.bookingUrl || null, // Salva o link de reserva
      status: "pending",
    });

    revalidatePath("/overview");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar:", error);
    return { success: false };
  }
}
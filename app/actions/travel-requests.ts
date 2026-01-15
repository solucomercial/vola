"use server"

import { db } from "@/db";
import { travelRequests } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { fetchFlightOffers } from "@/lib/amadeus";

export async function searchOptionsAction(type: string, origin: string, destination: string, date: string) {
  if (type === 'flight') {
    return await fetchFlightOffers(origin, destination, date);
  }
  // Implementar hotel e car de forma similar
  return [];
}

export async function createTravelRequestAction(data: any) {
  try {
    await db.insert(travelRequests).values({
      userId: data.userId,
      userName: data.userName,
      type: data.type,
      origin: data.origin,
      destination: data.destination,
      departureDate: new Date(data.departureDate),
      returnDate: new Date(data.returnDate),
      reason: data.reason,
      selectedOption: data.selectedOption,
      alternatives: data.alternatives,
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
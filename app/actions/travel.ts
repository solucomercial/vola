"use server"

import { db } from "@/db";
import { travelRequests } from "@/db/schema";
import { fetchFlightOffers } from "@/lib/travel-api";
import { revalidatePath } from "next/cache";

// 1. Action para buscar opções reais de voo
export async function searchTravelOptionsAction(origin: string, destination: string, date: string) {
  const flightData = await fetchFlightOffers(origin, destination, date);
  
  // Aqui você deve mapear os dados da Amadeus para o seu formato TravelOption
  // Por enquanto, retornamos os dados brutos para teste
  return flightData;
}

// 2. Action para salvar uma nova solicitação no Postgres
export async function createTravelRequestAction(formData: any) {
  try {
    await db.insert(travelRequests).values({
      ...formData,
      status: "pending",
      createdAt: new Date(),
    });

    // Limpa o cache das páginas para mostrar os dados novos
    revalidatePath("/overview");
    revalidatePath("/requests");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar solicitação:", error);
    return { success: false, error: "Falha ao gravar no banco de dados." };
  }
}
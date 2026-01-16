// app/actions/travel-requests.ts
"use server"

import { db } from "@/db";
import { travelRequests, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { fetchFlightOffers, fetchHotelOffers, fetchCarOffers } from "@/lib/travel-api";

// Função para procurar solicitações pendentes para a tela de análise
export async function getPendingRequestsAction() {
  try {
    const results = await db.select().from(travelRequests).where(eq(travelRequests.status, "pending"));
    return results;
  } catch (error) {
    console.error("Erro ao procurar solicitações pendentes:", error);
    return [];
  }
}

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
    const [newReq] = await db.insert(travelRequests).values({
      ...data,
      departureDate: new Date(data.departureDate),
      returnDate: new Date(data.returnDate),
      bookingUrl: data.selectedOption.bookingUrl || null,
      status: "pending",
    }).returning();

    const admins = await db.select().from(users).where(eq(users.role, "approver"));
    if (admins.length > 0) {
      const notifs = admins.map(admin => ({
        userId: admin.id,
        type: "new_request" as const,
        title: "Nova Solicitação",
        message: `${data.userName} submeteu uma solicitação de ${data.type} para ${data.destination}.`,
        requestId: newReq.id
      }));
      await db.insert(notifications).values(notifs);
    }

    revalidatePath("/analysis");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar solicitação:", error);
    return { success: false };
  }
}

export async function approveRequestAction(requestId: string, approverId: string) {
  try {
    const approvalCode = `APR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const [updated] = await db.update(travelRequests)
      .set({ status: "approved", approvalCode, approverId })
      .where(eq(travelRequests.id, requestId))
      .returning();

    await db.insert(notifications).values({
      userId: updated.userId,
      type: "approval",
      title: "Solicitação Aprovada",
      message: `A sua viagem para ${updated.destination} foi aprovada. Código: ${approvalCode}`,
      requestId: updated.id
    });

    revalidatePath("/analysis");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function rejectRequestAction(requestId: string, approverId: string, reason: string) {
  try {
    const [updated] = await db.update(travelRequests)
      .set({ status: "rejected", rejectionReason: reason, approverId })
      .where(eq(travelRequests.id, requestId))
      .returning();

    await db.insert(notifications).values({
      userId: updated.userId,
      type: "rejection",
      title: "Solicitação Rejeitada",
      message: `A sua viagem para ${updated.destination} foi rejeitada. Motivo: ${reason}`,
      requestId: updated.id
    });

    revalidatePath("/analysis");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateRequestOptionAction(requestId: string, selectedOption: any) {
  try {
    const [updated] = await db.update(travelRequests)
      .set({ 
        selectedOption: selectedOption,
        bookingUrl: selectedOption.bookingUrl || null
      })
      .where(eq(travelRequests.id, requestId))
      .returning();

    revalidatePath("/analysis");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar opção da solicitação:", error);
    return { success: false };
  }
}
// app/actions/travel-requests.ts
"use server"

import { db } from "@/db";
import { travelRequests, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { fetchFlightOffers, fetchHotelOffers, fetchCarOffers, searchLocations } from "@/lib/travel-api";

// Função para obter usuário por ID
export async function getUserAction(userId: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
}

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

// Função para procurar solicitações do usuário
export async function getUserRequestsAction(userId: string) {
  try {
    const results = await db.select().from(travelRequests).where(eq(travelRequests.userId, userId));
    return results;
  } catch (error) {
    console.error("Erro ao procurar solicitações do usuário:", error);
    return [];
  }
}

// Função para obter notificações do usuário
export async function getNotificationsAction(userId: string) {
  try {
    const results = await db.select().from(notifications).where(eq(notifications.userId, userId));
    return results;
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }
}

// Função para marcar notificação como lida
export async function markNotificationReadAction(notificationId: string) {
  try {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return { success: false };
  }
}

// Função para obter todos os dados para o overview
export async function getOverviewDataAction() {
  try {
    const allRequests = await db.select().from(travelRequests);
    const allUsers = await db.select().from(users);
    
    return {
      requests: allRequests,
      users: allUsers,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do overview:", error);
    return { requests: [], users: [] };
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

export async function createTravelRequestAction(data: {
  userId: string;
  userName: string;
  type: "flight" | "hotel" | "car";
  origin: string | null;
  destination: string;
  departureDate: string;
  returnDate: string;
  costCenter: string;
  reason: string;
  selectedOption: any;
  alternatives: any[];
}) {
  try {
    // 1. Cria a solicitação principal
    const newReqResult = await db.insert(travelRequests).values({
      userId: data.userId,
      userName: data.userName,
      type: data.type,
      origin: data.origin,
      destination: data.destination,
      departureDate: new Date(data.departureDate),
      returnDate: new Date(data.returnDate),
      costCenter: data.costCenter,
      reason: data.reason,
      selectedOption: data.selectedOption,
      alternatives: data.alternatives,
      bookingUrl: data.selectedOption.bookingUrl || null,
      status: "pending",
    }).returning();
    const newReq = Array.isArray(newReqResult) ? newReqResult[0] : newReqResult;

    // 2. Tenta enviar notificações (encapsulado para não quebrar o fluxo principal)
    try {
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
    } catch (notifError) {
      console.error("Erro ao gerar notificações (não crítico):", notifError);
      // O fluxo continua pois a solicitação já foi salva
    }

    // 3. Atualiza as rotas e retorna sucesso
    revalidatePath("/analysis");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro crítico ao salvar solicitação:", error);
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

    try {
      await db.insert(notifications).values({
        userId: updated.userId,
        type: "approval",
        title: "Solicitação Aprovada",
        message: `A sua viagem para ${updated.destination} foi aprovada. Código: ${approvalCode}`,
        requestId: updated.id
      });
    } catch (e) {
      console.error("Erro na notificação de aprovação:", e);
    }

    revalidatePath("/analysis");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar solicitação:", error);
    return { success: false };
  }
}

export async function rejectRequestAction(requestId: string, approverId: string, reason: string) {
  try {
    const [updated] = await db.update(travelRequests)
      .set({ status: "rejected", rejectionReason: reason, approverId })
      .where(eq(travelRequests.id, requestId))
      .returning();

    try {
      await db.insert(notifications).values({
        userId: updated.userId,
        type: "rejection",
        title: "Solicitação Rejeitada",
        message: `A sua viagem para ${updated.destination} foi rejeitada. Motivo: ${reason}`,
        requestId: updated.id
      });
    } catch (e) {
      console.error("Erro na notificação de rejeição:", e);
    }

    revalidatePath("/analysis");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro ao rejeitar solicitação:", error);
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
// Função para buscar locais (Server Action)
export async function searchLocationsAction(query: string) {
  try {
    console.log(`[Server Action] searchLocationsAction chamada com query: "${query}"`);
    const locations = await searchLocations(query);
    console.log(`[Server Action] Retornando ${locations.length} locais`);
    return locations;
  } catch (error) {
    console.error("[Server Action] Erro ao buscar locais:", error);
    return [];
  }
}

// Interface para item do carrinho
export interface CartItem {
  type: "flight" | "hotel" | "car";
  origin: string | null;
  destination: string;
  departureDate: string;
  returnDate: string;
  costCenter: string;
  reason: string;
  selectedOption: any;
  alternatives: any[];
}

// Função para submeter carrinho completo
export async function submitCartAction(cartItems: CartItem[], userId: string, userName: string) {
  try {
    if (cartItems.length === 0) {
      return { success: false, error: "Carrinho vazio" };
    }

    // 1. Cria um pedido pai (request vazio para vincular os itens)
    const parentRequestResult = await db.insert(travelRequests).values({
      userId,
      userName,
      type: "flight", // tipo dummy para o pai
      destination: "Múltiplos Destinos",
      departureDate: new Date(),
      returnDate: new Date(),
      costCenter: "CART",
      reason: "Carrinho de Viagem com Múltiplos Itens",
      selectedOption: { items: cartItems.length },
      alternatives: [],
      status: "pending",
    }).returning();
    const parentRequest = Array.isArray(parentRequestResult) ? parentRequestResult[0] : parentRequestResult;

    // 2. Cria um request para cada item do carrinho vinculado ao pai
    const childRequestsPromises = cartItems.map(async (item) => {
      const newReqResult = await db.insert(travelRequests).values({
        userId,
        userName,
        type: item.type,
        origin: item.origin,
        destination: item.destination,
        departureDate: new Date(item.departureDate),
        returnDate: new Date(item.returnDate),
        costCenter: item.costCenter,
        reason: item.reason,
        selectedOption: item.selectedOption,
        alternatives: item.alternatives,
        bookingUrl: item.selectedOption.bookingUrl || null,
        parentRequestId: parentRequest.id,
        status: "pending",
      }).returning();
      return Array.isArray(newReqResult) ? newReqResult[0] : newReqResult;
    });
    const childRequests = await Promise.all(childRequestsPromises);

    // 3. Cria notificações para aprovadores
    try {
      const admins = await db.select().from(users).where(eq(users.role, "approver"));
      if (admins.length > 0) {
        const notifs = admins.map(admin => ({
          userId: admin.id,
          type: "new_request" as const,
          title: "Novo Carrinho de Viagem",
          message: `${userName} submeteu um carrinho com ${cartItems.length} item(ns) de viagem.`,
          requestId: parentRequest.id
        }));
        await db.insert(notifications).values(notifs);
      }
    } catch (notifError) {
      console.error("Erro ao gerar notificações (não crítico):", notifError);
    }

    revalidatePath("/requests");
    return { success: true, parentRequestId: parentRequest.id, childRequests };
  } catch (error) {
    console.error("Erro ao submeter carrinho:", error);
    return { success: false, error: "Erro ao processar carrinho" };
  }
}
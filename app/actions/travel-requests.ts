// app/actions/travel-requests.ts
"use server"

import { db } from "@/db";
import { travelRequests, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { fetchFlightOffers, fetchHotelOffers, fetchCarOffers, searchLocations, fetchFlightOffersWithStats } from "@/lib/travel-api";
import { Resend } from "resend";

// Inicializa Resend com a chave de API
const resend = new Resend(process.env.RESEND_API_KEY);

// Função auxiliar para enviar email de aprovação
async function sendApprovalEmail(approverEmail: string, requesterName: string, requestId: string, cartItems: any[]) {
  try {
    const approveUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/approve?requestId=${requestId}&action=approve`;
    const rejectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/approve?requestId=${requestId}&action=reject`;

    const itemsSummary = cartItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${idx + 1}. ${item.type === 'flight' ? `${item.origin} → ${item.destination}` : item.destination}</td>
        <td style="padding: 12px; text-align: center;">${new Date(item.departureDate).toLocaleDateString('pt-BR')}</td>
        <td style="padding: 12px; text-align: right;">R$ ${item.selectedOption.price.toLocaleString('pt-BR')}</td>
      </tr>
    `).join('');

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.selectedOption.price || 0), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 32px; }
            .section { margin: 24px 0; }
            .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
            .info-box { background: #f3f4f6; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px; margin: 12px 0; }
            .info-box p { margin: 0; color: #374151; font-size: 14px; }
            .info-box strong { color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            table th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb; }
            .total-row { background: #f0f4ff; font-weight: 600; color: #667eea; padding: 12px; text-align: right; }
            .button-group { display: flex; gap: 12px; margin-top: 24px; justify-content: center; }
            .button { display: inline-block; padding: 12px 32px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 14px; }
            .button-approve { background: #10b981; color: white; }
            .button-approve:hover { background: #059669; }
            .button-reject { background: #ef4444; color: white; }
            .button-reject:hover { background: #dc2626; }
            .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✈️ Nova Solicitação de Viagem</h1>
            </div>
            <div class="content">
              <div class="section">
                <p style="margin: 0; color: #374151; font-size: 16px;">Olá,</p>
                <p style="margin: 12px 0; color: #6b7280;">Uma nova solicitação de viagem foi submetida por <strong>${requesterName}</strong> e aguarda sua aprovação.</p>
              </div>

              <div class="section">
                <div class="section-title">Itens Solicitados</div>
                <table>
                  <thead>
                    <tr>
                      <th>Trajeto/Destino</th>
                      <th>Data</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsSummary}
                    <tr class="total-row">
                      <td colspan="2">TOTAL</td>
                      <td>R$ ${totalPrice.toLocaleString('pt-BR')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="section">
                <div class="section-title">Motivos das Solicitações</div>
                ${cartItems.map((item, idx) => `
                  <div class="info-box">
                    <p><strong>Item ${idx + 1}:</strong> ${item.reason}</p>
                  </div>
                `).join('')}
              </div>

              <div class="section" style="text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px; margin-bottom: 20px;">Por favor, revise os detalhes e tome uma decisão:</p>
                <div class="button-group">
                  <a href="${approveUrl}" class="button button-approve">✓ Aprovar</a>
                  <a href="${rejectUrl}" class="button button-reject">✗ Rejeitar</a>
                </div>
              </div>

              <div class="section" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-top: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Nota:</strong> Os links acima expiram em 30 dias. Acesse o painel de análise para obter mais detalhes.
                </p>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0; margin-bottom: 8px;">Este é um email automático. Por favor, não responda.</p>
              <p style="margin: 0;">Sistema de Gestão de Viagens © 2026</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Em desenvolvimento/teste, Resend só permite enviar para o email verificado
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const testEmails = [
      'guilherme.machado@solucoesterceirizadas.com.br',
      'ti@solucoesterceirizadas.com.br'
    ];
    
    if (isDevelopment) {
      console.log(`[sendApprovalEmail] MODO DESENVOLVIMENTO: Email seria enviado para ${approverEmail}, mas será enviado para ${testEmails.join(', ')}`);
    }

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@solucoesterceirizadas.cloud',
      to: isDevelopment ? testEmails : approverEmail,
      subject: `Nova Solicitação de Viagem - ${requesterName}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("[sendApprovalEmail] Erro ao enviar email:", response.error);
      return false;
    }

    console.log(`[sendApprovalEmail] Email enviado com sucesso para ${isDevelopment ? testEmails.join(', ') : approverEmail}`);
    return true;
  } catch (error) {
    console.error("[sendApprovalEmail] Erro:", error);
    return false;
  }
}

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
    // Filtra registros "pai" do carrinho (Múltiplos Destinos)
    return results.filter(r => r.destination !== "Múltiplos Destinos");
  } catch (error) {
    console.error("Erro ao procurar solicitações pendentes:", error);
    return [];
  }
}

// Função para procurar solicitações do usuário
export async function getUserRequestsAction(userId: string) {
  try {
    const results = await db.select().from(travelRequests).where(eq(travelRequests.userId, userId));
    // Filtra registros "pai" do carrinho (Múltiplos Destinos)
    return results.filter(r => r.destination !== "Múltiplos Destinos");
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
    
    // Filtra registros "pai" do carrinho (Múltiplos Destinos)
    return {
      requests: allRequests.filter(r => r.destination !== "Múltiplos Destinos"),
      users: allUsers,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do overview:", error);
    return { requests: [], users: [] };
  }
}

export async function searchOptionsAction(type: string, origin: string, destination: string, date: string, returnDate: string, isRoundTrip: boolean = false) {
  const fmtDate = new Date(date).toISOString().split('T')[0];
  const fmtReturnDate = returnDate ? new Date(returnDate).toISOString().split('T')[0] : undefined;
  
  if (type === 'flight' && isRoundTrip) {
    // Para round-trip, busca usando a estratégia split que retorna estatísticas
    const result = await fetchFlightOffersWithStats(origin, destination, fmtDate, fmtReturnDate!);
    return result;
  }
  
  // Para one-way, não passa returnDate
  if (type === 'flight') {
    const options = await fetchFlightOffers(origin, destination, fmtDate, isRoundTrip ? fmtReturnDate : undefined);
    return { options, statistics: null };
  }
  if (type === 'hotel') {
    const options = await fetchHotelOffers(destination, fmtDate, fmtReturnDate || fmtDate);
    return { options, statistics: null };
  }
  if (type === 'car') {
    const options = await fetchCarOffers(destination, fmtDate, fmtReturnDate || fmtDate);
    return { options, statistics: null };
  }
  
  return { options: [], statistics: null };
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

// Função para obter solicitações aprovadas (para tela de compras)
export async function getApprovedRequestsAction() {
  try {
    const results = await db.select().from(travelRequests).where(eq(travelRequests.status, "approved"));
    // Filtra registros "pai" do carrinho (Múltiplos Destinos)
    return results.filter(r => r.destination !== "Múltiplos Destinos");
  } catch (error) {
    console.error("Erro ao buscar solicitações aprovadas:", error);
    return [];
  }
}

// Função para marcar compra como concluída
export async function completePurchaseAction(requestId: string, buyerId: string, confirmationCodes: string[]) {
  try {
    const [updated] = await db.update(travelRequests)
      .set({ 
        status: "purchased", 
        buyerId: buyerId,
        purchaseConfirmationCodes: confirmationCodes
      })
      .where(eq(travelRequests.id, requestId))
      .returning();

    try {
      const codesText = confirmationCodes.join(', ')
      await db.insert(notifications).values({
        userId: updated.userId,
        type: "system",
        title: "Viagem Confirmada",
        message: `A sua viagem para ${updated.destination} foi comprada e confirmada! Localizadores para check-in: ${codesText}`,
        requestId: updated.id
      });
    } catch (e) {
      console.error("Erro na notificação de compra:", e);
    }

    revalidatePath("/purchase");
    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Erro ao confirmar compra:", error);
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
  justification: string | null;
  selectedOption: any;
  alternatives: any[];
}

// Função para submeter carrinho completo
export async function submitCartAction(cartItems: CartItem[], userId: string, userName: string) {
  try {
    if (cartItems.length === 0) {
      return { success: false, error: "Carrinho vazio" };
    }

    // Helper para encontrar o menor preço
    const findLowestPrice = (options: any[]): number | null => {
      if (!options || options.length === 0) return null;
      const prices = options.map((o) => o.selectedOption?.price || 0).filter((p) => p > 0);
      return prices.length > 0 ? Math.min(...prices) : null;
    };

    // Validação aprimorada: detecta viagens de ida e volta e valida contra bestCombinedPrice
    for (const item of cartItems) {
      const itemPrice = item.selectedOption?.price || 0;
      
      // Verifica se é uma viagem de ida e volta (round-trip)
      const isRoundTrip = item.returnDate && item.returnDate !== item.departureDate;
      const isSplitStrategy = item.selectedOption?.legType !== undefined || 
                             item.alternatives?.some((alt: any) => alt.selectedOption?.legType !== undefined);
      
      // Se for voo de ida e volta, aplica nova lógica de validação
      if (item.type === 'flight' && (isRoundTrip || isSplitStrategy)) {
        // Busca voos de ida e volta nos alternatives
        const outboundFlight = item.alternatives?.find((alt: any) => 
          alt.selectedOption?.legType === 'outbound'
        );
        const returnFlight = item.alternatives?.find((alt: any) => 
          alt.selectedOption?.legType === 'return'
        );
        
        // Se há dados de ida e volta separados
        if (outboundFlight && returnFlight) {
          const outboundPrice = outboundFlight.selectedOption?.price || 0;
          const returnPrice = returnFlight.selectedOption?.price || 0;
          const totalSelectedPrice = outboundPrice + returnPrice;
          
          // Verifica se há estatísticas de preço de referência
          const bestCombinedPrice = item.selectedOption?.statistics?.bestCombinedPrice;
          
          if (bestCombinedPrice !== undefined) {
            // Compara soma total com o melhor preço combinado
            if (totalSelectedPrice > bestCombinedPrice && !item.justification) {
              return {
                success: false,
                error: `Justificativa obrigatória para o voo "${item.origin} → ${item.destination}". A combinação selecionada (R$ ${totalSelectedPrice.toFixed(2)}) não é a mais econômica (melhor opção: R$ ${bestCombinedPrice.toFixed(2)}).`,
              };
            }
          } else {
            // Fallback: validação individual por trecho se não há bestCombinedPrice
            console.warn(`[submitCartAction] bestCombinedPrice não disponível para ${item.origin} → ${item.destination}, usando validação por trecho`);
            
            // Valida ida
            const allOutboundPrices = item.alternatives
              ?.filter((alt: any) => alt.selectedOption?.legType === 'outbound')
              .map((alt: any) => alt.selectedOption?.price || 0)
              .filter((p: number) => p > 0);
            
            if (allOutboundPrices && allOutboundPrices.length > 0) {
              const lowestOutboundPrice = Math.min(...allOutboundPrices);
              if (outboundPrice > lowestOutboundPrice && !item.justification) {
                return {
                  success: false,
                  error: `Justificativa obrigatória para o voo de IDA "${item.origin} → ${item.destination}" pois não é a opção mais barata.`,
                };
              }
            }
            
            // Valida volta
            const allReturnPrices = item.alternatives
              ?.filter((alt: any) => alt.selectedOption?.legType === 'return')
              .map((alt: any) => alt.selectedOption?.price || 0)
              .filter((p: number) => p > 0);
            
            if (allReturnPrices && allReturnPrices.length > 0) {
              const lowestReturnPrice = Math.min(...allReturnPrices);
              if (returnPrice > lowestReturnPrice && !item.justification) {
                return {
                  success: false,
                  error: `Justificativa obrigatória para o voo de VOLTA "${item.destination} → ${item.origin}" pois não é a opção mais barata.`,
                };
              }
            }
          }
        } else {
          // Fallback para formato antigo: validação simples de preço único
          const allPrices = cartItems.map((ci) => ci.selectedOption?.price || 0);
          const lowestPrice = Math.min(...allPrices);
          
          if (itemPrice > lowestPrice && !item.justification) {
            return {
              success: false,
              error: `Justificativa obrigatória para o item "${item.destination}" pois não é a opção mais barata.`,
            };
          }
        }
      } else {
        // Para hotéis, carros, e voos one-way, mantém validação tradicional
        const allPrices = cartItems.map((ci) => ci.selectedOption?.price || 0);
        const lowestPrice = Math.min(...allPrices);
        
        if (itemPrice > lowestPrice && !item.justification) {
          return {
            success: false,
            error: `Justificativa obrigatória para o item "${item.destination}" pois não é a opção mais barata.`,
          };
        }
      }
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
        returnDate: item.returnDate ? new Date(item.returnDate) : new Date(item.departureDate),
        costCenter: item.costCenter,
        reason: item.reason,
        justification: item.justification,
        selectedOption: item.selectedOption,
        alternatives: item.alternatives,
        bookingUrl: item.selectedOption.bookingUrl || null,
        parentRequestId: parentRequest.id,
        status: "pending",
      }).returning();
      return Array.isArray(newReqResult) ? newReqResult[0] : newReqResult;
    });
    const childRequests = await Promise.all(childRequestsPromises);

    // 3. Cria notificações para aprovadores e envia emails
    try {
      const approvers = await db.select().from(users).where(eq(users.role, "approver"));
      if (approvers.length > 0) {
        const notifs = approvers.map(approver => ({
          userId: approver.id,
          type: "new_request" as const,
          title: "Novo Carrinho de Viagem",
          message: `${userName} submeteu um carrinho com ${cartItems.length} item(ns) de viagem.`,
          requestId: parentRequest.id
        }));
        await db.insert(notifications).values(notifs);

        // Envia emails para todos os aprovadores em paralelo
        const emailPromises = approvers
          .filter(approver => approver.email) // Filtra apenas aprovadores com email
          .map(approver => 
            sendApprovalEmail(approver.email, userName, parentRequest.id, cartItems)
          );
        
        const emailResults = await Promise.allSettled(emailPromises);
        const successCount = emailResults.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`[submitCartAction] ${successCount}/${emailResults.length} emails enviados com sucesso`);
      }
    } catch (notifError) {
      console.error("Erro ao gerar notificações/emails (não crítico):", notifError);
    }

    revalidatePath("/requests");
    return { success: true, parentRequestId: parentRequest.id, childRequests };
  } catch (error) {
    console.error("Erro ao submeter carrinho:", error);
    return { success: false, error: "Erro ao processar carrinho" };
  }
}
// app/api/approve/route.ts
import { db } from "@/db";
import { travelRequests, notifications, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");
    const action = searchParams.get("action");

    // Validação
    if (!requestId || !action || !["approve", "reject"].includes(action)) {
      return new Response("Parâmetros inválidos", { status: 400 });
    }

    console.log(`[/api/approve] Processando ${action} para requestId: ${requestId}`);

    let updatedRequest: any = null;
    try {
      // Atualiza o status da solicitação (pai e filhos, se houver)
      const newStatus = action === "approve" ? "approved" : "rejected";
      const approvalCode = action === "approve" ? `APR-${Date.now()}` : undefined;

      const result = await db
        .update(travelRequests)
        .set({ 
          status: newStatus as "approved" | "rejected" | "pending" | "purchased",
          approvalCode,
          rejectionReason: action === "reject" ? "Rejeitado via link de email" : undefined
        })
        .where(
          or(
            eq(travelRequests.id, requestId),
            eq(travelRequests.parentRequestId, requestId)
          )
        )
        .returning();

      if (!result || result.length === 0) {
        console.error(`[/api/approve] Solicitação ${requestId} não encontrada`);
        updatedRequest = null;
      } else {
        updatedRequest = result.find((r: any) => r.id === requestId) || result[0];
      }

    console.log(
      `[/api/approve] Solicitação ${requestId} ${action === "approve" ? "aprovada" : "rejeitada"} com sucesso`
    );

    // Criar notificações
    try {
      if (action === "approve") {
        // Notifica o solicitante que foi aprovado
        await db.insert(notifications).values({
          userId: updatedRequest.userId,
          type: "approval",
          title: "Solicitação Aprovada",
          message: `Sua solicitação para ${updatedRequest.destination} foi aprovada e está na fila de compra.`,
          requestId: updatedRequest.id
        });

        // Buscar todos os buyers e admin para notificar
        const buyers = await db.select().from(users).where(eq(users.role, "buyer"));
        const admins = await db.select().from(users).where(eq(users.role, "admin"));
        const notifyUsers = [...buyers, ...admins];

        // Notifica compradores e admins que há uma nova solicitação aprovada para compra
        for (const user of notifyUsers) {
          await db.insert(notifications).values({
            userId: user.id,
            type: "system",
            title: "Nova Solicitação para Compra",
            message: `Solicitação de ${updatedRequest.userName} para ${updatedRequest.destination} foi aprovada e aguarda compra.`,
            requestId: updatedRequest.id
          });
        }
      } else {
        // Notifica o solicitante que foi rejeitado
        await db.insert(notifications).values({
          userId: updatedRequest.userId,
          type: "rejection",
          title: "Solicitação Rejeitada",
          message: `Sua solicitação para ${updatedRequest.destination} foi rejeitada via email.`,
          requestId: updatedRequest.id
        });
      }
    } catch (notifError) {
      console.error("[/api/approve] Erro ao criar notificações:", notifError);
    }
  } catch (error) {
    console.error("[/api/approve] Erro:", error);
    redirect("/approval-error?reason=server-error");
  }

  // Redireciona para página de sucesso com mensagem
  if (!updatedRequest) {
    redirect("/approval-error?reason=not-found");
  }
  const successMessage = action === "approve" 
    ? `Solicitação aprovada com código: ${updatedRequest.approvalCode}`
    : "Solicitação rejeitada";

  redirect(
    `/approval-success?status=${action}&requestId=${requestId}&message=${encodeURIComponent(
      successMessage
    )}`
  );
}

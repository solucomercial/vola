// app/api/approve/route.ts
import { db } from "@/db";
import { travelRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");
    const action = searchParams.get("action");

    // Validação
    if (!requestId || !action || !["approve", "reject"].includes(action)) {
      return new Response("Parâmetros inválidos", { status: 400 });
    }

    console.log(`[/api/approve] Processando ${action} para requestId: ${requestId}`);

    // Atualiza o status da solicitação
    const newStatus = action === "approve" ? "approved" : "rejected";
    
    const result = await db
      .update(travelRequests)
      .set({ 
        status: newStatus as "approved" | "rejected" | "pending",
        approvalCode: action === "approve" ? `APR-${Date.now()}` : undefined,
        rejectionReason: action === "reject" ? "Rejeitado via link de email" : undefined
      })
      .where(eq(travelRequests.id, requestId))
      .returning();

    if (!result || result.length === 0) {
      console.error(`[/api/approve] Solicitação ${requestId} não encontrada`);
      redirect("/approval-error?reason=not-found");
    }

    const updatedRequest = result[0];

    console.log(
      `[/api/approve] Solicitação ${requestId} ${action === "approve" ? "aprovada" : "rejeitada"} com sucesso`
    );

    // Redireciona para página de sucesso com mensagem
    const successMessage = action === "approve" 
      ? `Solicitação aprovada com código: ${updatedRequest.approvalCode}`
      : "Solicitação rejeitada";

    redirect(
      `/approval-success?status=${action}&requestId=${requestId}&message=${encodeURIComponent(
        successMessage
      )}`
    );
  } catch (error) {
    console.error("[/api/approve] Erro:", error);
    redirect("/approval-error?reason=server-error");
  }
}

import { db } from "@/db"
import { users, travelRequests, notifications } from "@/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Testa conexão e retorna contagem de registros
    const userCount = await db.select().from(users)
    const requestCount = await db.select().from(travelRequests)
    const notificationCount = await db.select().from(notifications)

    return NextResponse.json({
      status: "✓ Conexão com banco OK",
      tables: {
        users: userCount.length,
        travelRequests: requestCount.length,
        notifications: notificationCount.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "✗ Erro na conexão",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}

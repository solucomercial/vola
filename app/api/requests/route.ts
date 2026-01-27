import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { travelRequests } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    let whereConditions = [];

    if (userId) {
      whereConditions.push(eq(travelRequests.userId, userId));
    }

    if (status) {
      whereConditions.push(eq(travelRequests.status, status as any));
    }

    const results = whereConditions.length > 0
      ? await db.select().from(travelRequests).where(and(...whereConditions)).orderBy(desc(travelRequests.createdAt))
      : await db.select().from(travelRequests).orderBy(desc(travelRequests.createdAt));
    
    // Filtra registros "pai" do carrinho (Múltiplos Destinos)
    return NextResponse.json(results.filter((r: any) => r.destination !== "Múltiplos Destinos"));
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return NextResponse.json({ count: result[0]?.count || 0 });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}

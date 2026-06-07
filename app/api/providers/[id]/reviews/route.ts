import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const providerId = parseInt(id);
  const body = await req.json();
  const { userUuid, nickname, rating, comment } = body;

  if (!userUuid || !nickname || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.providerId, providerId), eq(reviews.userUuid, userUuid)));

  if (existing.length > 0) {
    return NextResponse.json({ error: "You already reviewed this provider" }, { status: 409 });
  }

  const [review] = await db
    .insert(reviews)
    .values({ providerId, userUuid, nickname, rating, comment })
    .returning();

  return NextResponse.json(review, { status: 201 });
}

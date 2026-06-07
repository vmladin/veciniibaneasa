import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { providers, categories, reviews } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const providerId = parseInt(id);

  const [row] = await db
    .select({
      id: providers.id,
      name: providers.name,
      phone: providers.phone,
      email: providers.email,
      description: providers.description,
      services: providers.services,
      categoryId: providers.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      address: providers.address,
      lat: providers.lat,
      lng: providers.lng,
      addedByNickname: providers.addedByNickname,
      createdAt: providers.createdAt,
      updatedAt: providers.updatedAt,
      avgRating: sql<number>`ROUND(AVG(${reviews.rating}), 1)`,
      reviewCount: count(reviews.id),
    })
    .from(providers)
    .leftJoin(categories, eq(providers.categoryId, categories.id))
    .leftJoin(reviews, eq(providers.id, reviews.providerId))
    .where(eq(providers.id, providerId))
    .groupBy(providers.id, categories.name, categories.icon);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const providerReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.providerId, providerId))
    .orderBy(reviews.createdAt);

  return NextResponse.json({ ...row, reviews: providerReviews });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminPassword = req.headers.get("x-admin-password");
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, email, description, services, categoryId, address, lat, lng } = body;

  const [updated] = await db
    .update(providers)
    .set({ name, phone, email, description, services, categoryId, address, lat, lng, updatedAt: new Date() })
    .where(eq(providers.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminPassword = req.headers.get("x-admin-password");
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(providers).where(eq(providers.id, parseInt(id)));
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { providers, categories, reviews } from "@/lib/db/schema";
import { eq, ilike, or, desc, count, sql, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");
  const search = searchParams.get("search");

  const conditions = [];
  if (categoryId) conditions.push(eq(providers.categoryId, parseInt(categoryId)));
  if (search) {
    conditions.push(
      or(
        ilike(providers.name, `%${search}%`),
        ilike(providers.description, `%${search}%`),
        ilike(providers.services, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length === 0
    ? undefined
    : conditions.length === 1
    ? conditions[0]
    : and(...conditions);

  const rows = await db
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
      avgRating: sql<number>`ROUND(AVG(${reviews.rating}), 1)`,
      reviewCount: count(reviews.id),
    })
    .from(providers)
    .leftJoin(categories, eq(providers.categoryId, categories.id))
    .leftJoin(reviews, eq(providers.id, reviews.providerId))
    .where(whereClause)
    .groupBy(providers.id, categories.name, categories.icon)
    .orderBy(desc(providers.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, description, services, categoryId, address, lat, lng, addedByNickname } = body;

  if (!name || !categoryId) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }

  const [provider] = await db
    .insert(providers)
    .values({ name, phone, email, description, services, categoryId, address, lat, lng, addedByNickname })
    .returning();

  return NextResponse.json(provider, { status: 201 });
}

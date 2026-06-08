import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");
  const type = searchParams.get("type");
  const category = searchParams.get("category");

  if (all) {
    const rows = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
    return NextResponse.json(rows);
  }

  const conditions = [
    eq(announcements.resolved, false),
    ...(type ? [eq(announcements.type, type)] : []),
    ...(category ? [eq(announcements.category, category)] : []),
  ];

  const rows = await db
    .select()
    .from(announcements)
    .where(and(...conditions))
    .orderBy(desc(announcements.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { type, category, title, description, price, images, contact, zone, nickname } =
    await req.json();

  if (!title?.trim() || !contact?.trim() || !type || !category) {
    return NextResponse.json({ error: "Date obligatorii lipsă" }, { status: 400 });
  }

  const expiresAt = new Date("2099-12-31T23:59:59Z");

  const [row] = await db
    .insert(announcements)
    .values({
      type,
      category,
      title: title.trim(),
      description: description?.trim() || null,
      price: price?.trim() || null,
      images: images ?? null,
      contact: contact.trim(),
      zone: zone ?? null,
      nickname: nickname?.trim() || "Vecin anonim",
      resolved: false,
      expiresAt,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // Public: mark a specific announcement as resolved
  if (body.resolveId) {
    await db
      .update(announcements)
      .set({ resolved: true })
      .where(eq(announcements.id, body.resolveId));
    return NextResponse.json({ ok: true });
  }

  // Admin: full edit
  const pw = req.headers.get("x-admin-password");
  if (pw !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, type, category, title, description, price, images, contact, zone, nickname, resolved } =
    body;
  if (!id) return NextResponse.json({ error: "ID lipsă" }, { status: 400 });

  const [row] = await db
    .update(announcements)
    .set({
      type,
      category,
      title: title?.trim(),
      description: description?.trim() || null,
      price: price?.trim() || null,
      images: images ?? null,
      contact: contact?.trim() || null,
      zone: zone ?? null,
      nickname: nickname?.trim() || null,
      resolved: resolved ?? false,
    })
    .where(eq(announcements.id, id))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (pw !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(announcements).where(eq(announcements.id, id));
  return NextResponse.json({ ok: true });
}

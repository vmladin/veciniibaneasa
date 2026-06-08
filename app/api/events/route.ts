import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { gte, eq, asc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const all = searchParams.get("all");
  const today = new Date().toISOString().slice(0, 10);

  const rows = date
    ? await db.select().from(events).where(eq(events.date, date)).orderBy(asc(events.time))
    : all
    ? await db.select().from(events).orderBy(asc(events.date), asc(events.time))
    : await db.select().from(events).where(gte(events.date, today)).orderBy(asc(events.date), asc(events.time));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { title, description, date, time, location, lat, lng, image, addedByNickname } = await req.json();
  if (!title?.trim() || !date) {
    return NextResponse.json({ error: "Titlu și dată sunt obligatorii" }, { status: 400 });
  }
  const [row] = await db.insert(events).values({
    title: title.trim(),
    description: description?.trim() || null,
    date,
    time: time?.trim() || null,
    location: location?.trim() || null,
    lat: lat ?? null,
    lng: lng ?? null,
    image: image ?? null,
    addedByNickname: addedByNickname?.trim() || "Vecin anonim",
  }).returning();
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // Public: attend an event (increment)
  if (body.attendId) {
    const [row] = await db.update(events)
      .set({ attendees: sql`${events.attendees} + 1` })
      .where(eq(events.id, body.attendId))
      .returning();
    return NextResponse.json(row);
  }

  // Public: unattend an event (decrement, floor 0)
  if (body.unattendId) {
    const [row] = await db.update(events)
      .set({ attendees: sql`GREATEST(${events.attendees} - 1, 0)` })
      .where(eq(events.id, body.unattendId))
      .returning();
    return NextResponse.json(row);
  }

  // Admin: edit event
  const pw = req.headers.get("x-admin-password");
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, title, description, date, time, location, lat, lng, image, addedByNickname } = body;
  if (!id || !title?.trim() || !date) return NextResponse.json({ error: "Date lipsă" }, { status: 400 });
  const [row] = await db.update(events).set({
    title: title.trim(),
    description: description?.trim() || null,
    date,
    time: time?.trim() || null,
    location: location?.trim() || null,
    lat: lat ?? null,
    lng: lng ?? null,
    image: image ?? null,
    addedByNickname: addedByNickname?.trim() || null,
  }).where(eq(events.id, id)).returning();
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ ok: true });
}

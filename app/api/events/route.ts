import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { gte, eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const today = new Date().toISOString().slice(0, 10);

  const rows = date
    ? await db.select().from(events).where(eq(events.date, date)).orderBy(asc(events.time))
    : await db.select().from(events).where(gte(events.date, today)).orderBy(asc(events.date), asc(events.time));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { title, description, date, time, location, addedByNickname } = await req.json();
  if (!title?.trim() || !date) {
    return NextResponse.json({ error: "Titlu și dată sunt obligatorii" }, { status: 400 });
  }
  const [row] = await db.insert(events).values({
    title: title.trim(),
    description: description?.trim() || null,
    date,
    time: time?.trim() || null,
    location: location?.trim() || null,
    addedByNickname: addedByNickname?.trim() || "Vecin anonim",
  }).returning();
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ ok: true });
}

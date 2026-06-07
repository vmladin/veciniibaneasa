import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const { providerName, providerId, reasons, details } = await req.json();

  if (!providerName || !providerId || !reasons?.length) {
    return NextResponse.json({ error: "Date lipsă" }, { status: 400 });
  }

  await db.insert(reports).values({
    providerId,
    providerName,
    reasons: (reasons as string[]).join(", "),
    details: details || null,
  });

  return NextResponse.json({ ok: true });
}

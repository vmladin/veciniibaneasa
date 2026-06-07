import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { providerName, providerId, reasons, details } = await req.json();

  if (!providerName || !reasons?.length) {
    return NextResponse.json({ error: "Date lipsă" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Resend not configured — log and return success so UX still works
    console.warn("[report] RESEND_API_KEY not set. Report not emailed:", { providerName, reasons, details });
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);

  const html = `
    <h2 style="margin:0 0 12px">⚠️ Raport nou — Vecinii Băneasa</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:8px;background:#f5f0eb;font-weight:bold;width:160px">Furnizor</td>
          <td style="padding:8px;border-bottom:1px solid #e0d8d0">${providerName}</td></tr>
      <tr><td style="padding:8px;background:#f5f0eb;font-weight:bold">ID furnizor</td>
          <td style="padding:8px;border-bottom:1px solid #e0d8d0">${providerId}</td></tr>
      <tr><td style="padding:8px;background:#f5f0eb;font-weight:bold">Motive</td>
          <td style="padding:8px;border-bottom:1px solid #e0d8d0">${reasons.join(", ")}</td></tr>
      <tr><td style="padding:8px;background:#f5f0eb;font-weight:bold">Detalii</td>
          <td style="padding:8px">${details || "—"}</td></tr>
    </table>
    <p style="margin-top:20px;font-size:12px;color:#888">
      Trimis de pe <a href="https://veciniiibaneasa.ro">veciniiibaneasa.ro</a>
    </p>
  `;

  const fromAddress = process.env.RESEND_FROM ?? "noreply@veciniiibaneasa.ro";

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: "vmladin@gmail.com",
    subject: `[Raport] ${providerName}`,
    html,
  });

  if (error) {
    console.error("[report] Resend error:", error);
    return NextResponse.json({ error: "Email error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

"use client";
import { useEffect, useState } from "react";

const MONTHS_SHORT = ["ian","feb","mar","apr","mai","iun","iul","aug","sep","oct","nov","dec"];

function fmtTs(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
function fmtDate(ymd: string) {
  const [, m, d] = ymd.split("-");
  return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]}`;
}

function Stars({ rating, count }: { rating: number; count: number }) {
  const r = Math.round(rating);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 11, color: i <= r ? "var(--vb-star)" : "var(--vb-star-empty)" }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: "var(--vb-text-l)", marginLeft: 3 }}>
        {rating > 0 ? Number(rating).toFixed(1) : "—"} ({count})
      </span>
    </span>
  );
}

interface PItem { id: number; name: string; description?: string|null; categoryName?: string|null; categoryIcon?: string|null; avgRating: number; reviewCount: number; createdAt: string; }
interface EItem { id: number; title: string; description?: string|null; date: string; attendees: number; }
interface AItem { id: number; title: string; description?: string|null; category: string; type: string; createdAt: string; }

const CAT_ICON: Record<string,string> = { mobila:"🛋️",electrocasnice:"⚡",electronice:"💻",haine:"👗",carti:"📚",sport:"🏃",copii:"👶",gradinarit:"🌱",auto:"🚗",animale:"🐾",servicii:"🔧",altele:"📦" };
const CAT_LABEL: Record<string,string> = { mobila:"Mobilă",electrocasnice:"Electrocasnice",electronice:"Electronică",haine:"Haine",carti:"Cărți",sport:"Sport",copii:"Copii",gradinarit:"Grădinărit",auto:"Auto",animale:"Animale",servicii:"Servicii",altele:"Altele" };

const DESC_CLAMP: React.CSSProperties = { margin: "0 0 8px", fontSize: 12.5, color: "var(--vb-text-m)", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" };

function ColHeader({ dot, label, href, linkLabel }: { dot: string; label: string; href: string; linkLabel: string }) {
  return (
    <div className="lp-latest-col-hd">
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--vb-text)" }}>{label}</span>
      </div>
      <a href={href} style={{ fontSize: 12.5, fontWeight: 800, color: "var(--vb-accent)", textDecoration: "none", whiteSpace: "nowrap" }}>{linkLabel}</a>
    </div>
  );
}

export default function LatestSection() {
  const [providers, setProviders] = useState<PItem[]>([]);
  const [evts, setEvts]           = useState<EItem[]>([]);
  const [anns, setAnns]           = useState<AItem[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/providers?sort=newest").then(r => r.json()),
      fetch("/api/events").then(r => r.json()),
      fetch("/api/announcements").then(r => r.json()),
    ]).then(([p, e, a]) => {
      setProviders(Array.isArray(p) ? p.slice(0, 3) : []);
      setEvts(Array.isArray(e) ? e.slice(0, 3) : []);
      setAnns(Array.isArray(a) ? a.slice(0, 3) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <section style={{ padding: "80px 24px 88px", background: "var(--background)", borderBottom: "1.5px solid var(--border)" }}>
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "var(--vb-accent)", marginBottom: 14 }}>
          Ultimele noutăți
        </div>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "var(--vb-text)", lineHeight: 1.2, margin: 0 }}>
          Ce se întâmplă în cartier
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--vb-text-l)", fontSize: 14, padding: "24px 0" }}>Se încarcă...</div>
      ) : (
        <div className="lp-latest-grid">

          {/* ── Director Furnizori ── */}
          <div className="lp-latest-col">
            <ColHeader dot="var(--vb-accent)" label="Director Furnizori" href="/director" linkLabel="Vezi toți →" />
            {providers.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--vb-text-l)", textAlign: "center", padding: "20px 0" }}>Niciun furnizor momentan.</p>
            ) : providers.map(p => (
              <a key={p.id} href={`/director?p=${p.id}`} className="lp-mini-card" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "var(--vb-text)", lineHeight: 1.3 }}>{p.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--vb-text-l)", flexShrink: 0 }}>{fmtTs(p.createdAt)}</span>
                </div>
                {p.description && <p style={DESC_CLAMP}>{p.description}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {p.categoryName && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "var(--vb-accent-lt)", color: "var(--vb-accent)", fontSize: 11.5, fontWeight: 700 }}>
                      {p.categoryIcon} {p.categoryName}
                    </span>
                  )}
                  <Stars rating={p.avgRating ?? 0} count={p.reviewCount ?? 0} />
                </div>
              </a>
            ))}
          </div>

          {/* ── Evenimente ── */}
          <div className="lp-latest-col">
            <ColHeader dot="oklch(0.48 0.12 145)" label="Evenimente" href="/evenimente" linkLabel="Vezi toate →" />
            {evts.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--vb-text-l)", textAlign: "center", padding: "20px 0" }}>Niciun eveniment viitor.</p>
            ) : evts.map(e => (
              <div key={e.id} className="lp-mini-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "var(--vb-text)", lineHeight: 1.3 }}>{e.title}</span>
                  <span style={{ fontSize: 11.5, color: "var(--vb-text-l)", flexShrink: 0 }}>{fmtDate(e.date)}</span>
                </div>
                {e.description && <p style={DESC_CLAMP}>{e.description}</p>}
                {e.attendees > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 20, background: "oklch(0.92 0.055 145)", color: "oklch(0.30 0.10 145)", fontSize: 11.5, fontWeight: 800 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.48 0.12 145)", display: "inline-block" }} />
                    Înscris: {e.attendees} {e.attendees === 1 ? "vecin" : "vecini"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Anunțuri ── */}
          <div className="lp-latest-col">
            <ColHeader dot="var(--vb-accent)" label="Anunțuri" href="/anunturi" linkLabel="Vezi toate →" />
            {anns.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--vb-text-l)", textAlign: "center", padding: "20px 0" }}>Niciun anunț momentan.</p>
            ) : anns.map(a => (
              <div key={a.id} className="lp-mini-card" onClick={() => { window.location.href = `/anunturi?a=${a.id}`; }} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "var(--vb-text)", lineHeight: 1.3 }}>{a.title}</span>
                  <span style={{ fontSize: 11.5, color: "var(--vb-text-l)", flexShrink: 0 }}>{fmtTs(a.createdAt)}</span>
                </div>
                {a.description && <p style={DESC_CLAMP}>{a.description}</p>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "var(--vb-accent-lt)", color: "var(--vb-accent)", fontSize: 11.5, fontWeight: 700 }}>
                    {CAT_ICON[a.category] ?? "📦"} {CAT_LABEL[a.category] ?? a.category}
                  </span>
                  <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 11.5, fontWeight: 800, background: a.type === "ofer" ? "oklch(0.92 0.040 148)" : "oklch(0.92 0.030 240)", color: a.type === "ofer" ? "oklch(0.28 0.10 148)" : "oklch(0.28 0.10 240)" }}>
                    {a.type === "ofer" ? "✦ Ofer" : "⟵ Caut"}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </section>
  );
}

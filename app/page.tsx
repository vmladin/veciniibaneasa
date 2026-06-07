"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Avatar } from "@/components/avatar";
import { getUserUuid, getNickname, setNickname } from "@/lib/user-identity";

const ProviderMap = dynamic(
  () => import("@/components/provider-map").then((m) => m.ProviderMap),
  { ssr: false }
);

// ── Types ────────────────────────────────────────────────────────────────────

interface Category { id: number; name: string; slug: string; icon: string }

interface Review {
  id: number; nickname: string; rating: number; comment?: string | null; createdAt: string;
}

interface Provider {
  id: number; name: string; phone?: string | null; whatsapp?: string | null;
  email?: string | null; description?: string | null; services?: string | null;
  priceRange?: string | null; hours?: string | null; zone?: string | null;
  website?: string | null; social?: string | null;
  categoryId: number; categoryName?: string | null; categoryIcon?: string | null;
  address?: string | null; lat?: number | null; lng?: number | null;
  addedByNickname?: string | null; avgRating?: number | null; reviewCount?: number | null;
  reviews?: Review[];
}

// ── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 16 16">
          <polygon
            points="8,1.5 10.2,6 15,6.5 11.5,10 12.5,14.5 8,12 3.5,14.5 4.5,10 1,6.5 5.8,6"
            fill={rating >= i - 0.25 ? "var(--vb-star)" : "var(--vb-star-empty)"}
          />
        </svg>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={32} height={32} viewBox="0 0 16 16"
          style={{ cursor: "pointer", transform: (hov || value) >= i ? "scale(1.18)" : "scale(1)", transition: "transform 0.1s" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(0)}
          onClick={() => onChange(i)}
        >
          <polygon points="8,1.5 10.2,6 15,6.5 11.5,10 12.5,14.5 8,12 3.5,14.5 4.5,10 1,6.5 5.8,6"
            fill={(hov || value) >= i ? "var(--vb-star)" : "var(--vb-star-empty)"} />
        </svg>
      ))}
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ children, onClose, title, size = "md" }: {
  children: React.ReactNode; onClose: () => void; title: string | null; size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="vb-overlay" onClick={onClose}>
      <div className={`vb-modal vb-modal-${size}`} onClick={(e) => e.stopPropagation()}>
        {title !== null ? (
          <div className="vb-modal-hd">
            <h2>{title}</h2>
            <button className="vb-modal-close" onClick={onClose}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px 0" }}>
            <button className="vb-modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="vb-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Provider detail modal ─────────────────────────────────────────────────────

function DetailModal({ provider, onClose, onReview, onReport }: {
  provider: Provider; onClose: () => void;
  onReview: (id: number) => void; onReport: (id: number) => void;
}) {
  const rating = Number(provider.avgRating) || 0;
  const waHref = provider.whatsapp
    ? `https://wa.me/${provider.whatsapp.replace(/\D/g, "")}`
    : provider.phone
    ? `https://wa.me/${provider.phone.replace(/\D/g, "").replace(/^0/, "40")}`
    : null;

  return (
    <Modal onClose={onClose} title={null} size="lg">
      {/* Header */}
      <div style={{ display: "flex", gap: 18, alignItems: "center", paddingBottom: 20, borderBottom: "1.5px solid var(--border)", marginBottom: 20 }}>
        <Avatar name={provider.name} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{provider.name}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <span className="vb-cat-badge">{provider.categoryIcon} {provider.categoryName}</span>
            {provider.zone && <span style={{ fontSize: 12.5, color: "var(--vb-text-m)" }}>📍 {provider.zone}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Stars rating={rating} size={17} />
            <span style={{ fontWeight: 800, fontSize: 15 }}>{rating > 0 ? rating.toFixed(1) : "—"}</span>
            <span style={{ fontSize: 13, color: "var(--vb-text-l)" }}>({provider.reviewCount ?? 0} recenzii)</span>
          </div>
        </div>
      </div>

      {provider.description && (
        <p style={{ fontSize: 15, color: "var(--vb-text-m)", lineHeight: 1.65, marginBottom: 18 }}>{provider.description}</p>
      )}
      {provider.services && (
        <p style={{ fontSize: 14, color: "var(--vb-text-m)", lineHeight: 1.6, marginBottom: 18 }}><strong>Servicii:</strong> {provider.services}</p>
      )}

      {/* Info grid */}
      <div className="vb-info-grid">
        {provider.priceRange && <div className="vb-info-cell"><div className="vb-info-label">Prețuri</div><div className="vb-info-val">💰 {provider.priceRange}</div></div>}
        {provider.hours     && <div className="vb-info-cell"><div className="vb-info-label">Program</div><div className="vb-info-val">🕐 {provider.hours}</div></div>}
        {provider.zone      && <div className="vb-info-cell"><div className="vb-info-label">Zonă</div><div className="vb-info-val">📍 {provider.zone}</div></div>}
        {provider.website   && <div className="vb-info-cell"><div className="vb-info-label">Website</div><div className="vb-info-val">🌐 {provider.website}</div></div>}
        {provider.address   && <div className="vb-info-cell"><div className="vb-info-label">Adresă</div><div className="vb-info-val">🏠 {provider.address}</div></div>}
        {provider.email     && <div className="vb-info-cell"><div className="vb-info-label">Email</div><div className="vb-info-val">✉️ {provider.email}</div></div>}
      </div>

      {/* Map */}
      <ProviderMap lat={provider.lat} lng={provider.lng} zone={provider.zone} name={provider.name} address={provider.address} />

      {/* Contact buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {provider.phone && (
          <a className="vb-btn-phone" href={`tel:${provider.phone.replace(/\s/g, "")}`} style={{ flex: 1, justifyContent: "center" }}>
            📞 {provider.phone}
          </a>
        )}
        {waHref && (
          <a className="vb-btn-wa" href={waHref} target="_blank" rel="noopener" style={{ flex: 1, justifyContent: "center" }}>
            💬 WhatsApp
          </a>
        )}
        {provider.social && (
          <span style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, fontSize: 13, fontWeight: 700, background: "oklch(0.91 0.028 280)", color: "oklch(0.42 0.082 280)" }}>
            📷 {provider.social}
          </span>
        )}
      </div>

      <div className="vb-divider" />

      {/* Reviews */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 900 }}>Recenzii ({provider.reviews?.length ?? 0})</h3>
        <button className="vb-btn-primary" style={{ fontSize: 13, padding: "7px 16px" }} onClick={() => onReview(provider.id)}>
          + Adaugă recenzie
        </button>
      </div>

      {(!provider.reviews || provider.reviews.length === 0) ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--vb-text-l)", fontSize: 14 }}>
          Fii primul care lasă o recenzie!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {provider.reviews.map((r) => (
            <div className="vb-review-card" key={r.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14 }}>
                  <Avatar name={r.nickname} size={30} /> {r.nickname}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Stars rating={r.rating} size={12} />
                  <span style={{ fontSize: 11.5, color: "var(--vb-text-l)" }}>
                    {new Date(r.createdAt).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              {r.comment && <p style={{ fontSize: 14, color: "var(--vb-text-m)", lineHeight: 1.55 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {provider.addedByNickname && (
        <p style={{ fontSize: 11, color: "var(--vb-text-l)", marginTop: 18 }}>
          Adăugat de <strong>{provider.addedByNickname}</strong>
        </p>
      )}

      <div style={{ textAlign: "right", marginTop: 18 }}>
        <button style={{ background: "none", border: "none", fontSize: 12, color: "var(--vb-text-l)", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
          onClick={() => onReport(provider.id)}>
          Raportează acest furnizor
        </button>
      </div>
    </Modal>
  );
}

// ── Add provider modal ────────────────────────────────────────────────────────
// NOTE: All inputs are inlined — never define sub-components inside a component
// body, as React recreates them on every render causing inputs to lose focus.

function AddProviderModal({ categories, onClose, onAdded }: {
  categories: Category[]; onClose: () => void; onAdded: () => void;
}) {
  const [nickname, setNicknameState] = useState(getNickname());
  const [name, setName]               = useState("");
  const [categoryId, setCategoryId]   = useState("");
  const [phone, setPhone]             = useState("");
  const [whatsapp, setWhatsapp]       = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange]   = useState("");
  const [hours, setHours]             = useState("");
  const [zoneOrAddress, setZoneOrAddress] = useState("");
  const [lat, setLat]                 = useState<number | null>(null);
  const [lng, setLng]                 = useState<number | null>(null);
  const [geocoding, setGeocoding]     = useState(false);
  const [geocodeMsg, setGeocodeMsg]   = useState("");
  const [website, setWebsite]         = useState("");
  const [social, setSocial]           = useState("");
  const [err, setErr]                 = useState<Record<string, string>>({});
  const [submitting, setSubmitting]   = useState(false);

  async function geocode() {
    if (!zoneOrAddress.trim()) return;
    setGeocoding(true); setGeocodeMsg("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(zoneOrAddress)}&format=json&limit=1`,
        { headers: { "Accept-Language": "ro" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        setGeocodeMsg("✓ Locație exactă găsită — harta va afișa pinul precis.");
      } else {
        setGeocodeMsg("Adresa nu a fost găsită — va fi folosită zona ca aproximare.");
      }
    } catch {
      setGeocodeMsg("Eroare la geocodare — va fi folosită zona ca aproximare.");
    }
    setGeocoding(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Câmp obligatoriu";
    if (!categoryId) errors.categoryId = "Câmp obligatoriu";
    if (!phone.trim()) errors.phone = "Câmp obligatoriu";
    if (!description.trim()) errors.description = "Câmp obligatoriu";
    if (Object.keys(errors).length) { setErr(errors); return; }

    setSubmitting(true);
    setNickname(nickname);
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, phone, whatsapp, description, priceRange, hours,
        zone: zoneOrAddress, lat, lng, website, social,
        categoryId: parseInt(categoryId),
        addedByNickname: nickname || "Vecin anonim",
        userUuid: getUserUuid(),
      }),
    });
    setSubmitting(false);
    if (res.ok) { onAdded(); onClose(); }
  }

  const errStyle = { color: "oklch(0.55 0.10 22)", fontSize: 12, marginTop: 4 };
  const fieldWrap = { marginBottom: 14 } as React.CSSProperties;
  const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 } as React.CSSProperties;

  return (
    <Modal onClose={onClose} title="Adaugă Furnizor" size="md">
      <form onSubmit={submit}>
        {/* Nickname */}
        <div style={fieldWrap}>
          <input className="vb-form-input" placeholder="Porecla / numele tău (opțional)"
            value={nickname} onChange={(e) => setNicknameState(e.target.value)} />
        </div>

        {/* Category */}
        <div style={fieldWrap}>
          <select className={`vb-form-input${err.categoryId ? " err" : ""}`}
            value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Alege categoria *</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          {err.categoryId && <div style={errStyle}>{err.categoryId}</div>}
        </div>

        {/* Name */}
        <div style={fieldWrap}>
          <input className={`vb-form-input${err.name ? " err" : ""}`} placeholder="Numele furnizorului *"
            value={name} onChange={(e) => setName(e.target.value)} />
          {err.name && <div style={errStyle}>{err.name}</div>}
        </div>

        {/* Phone + WhatsApp */}
        <div style={row2}>
          <div>
            <input className={`vb-form-input${err.phone ? " err" : ""}`} placeholder="Telefon *"
              value={phone} onChange={(e) => setPhone(e.target.value)} />
            {err.phone && <div style={errStyle}>{err.phone}</div>}
          </div>
          <input className="vb-form-input" placeholder="WhatsApp (ex: 40721...)"
            value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>

        {/* Description */}
        <div style={fieldWrap}>
          <textarea className={`vb-form-input${err.description ? " err" : ""}`}
            placeholder="Descriere servicii *" rows={3}
            value={description} onChange={(e) => setDescription(e.target.value)}
            style={{ resize: "vertical" }} />
          {err.description && <div style={errStyle}>{err.description}</div>}
        </div>

        {/* Price + Hours */}
        <div style={row2}>
          <input className="vb-form-input" placeholder="Interval preț (ex: 100–300 RON)"
            value={priceRange} onChange={(e) => setPriceRange(e.target.value)} />
          <input className="vb-form-input" placeholder="Program (ex: L–V 8:00–18:00)"
            value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>

        {/* Zone / Address with geocode */}
        <div style={fieldWrap}>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="vb-form-input" style={{ flex: 1 }}
              placeholder="Zonă (ex: Băneasa, Pipera) sau adresă exactă"
              value={zoneOrAddress}
              onChange={(e) => { setZoneOrAddress(e.target.value); setLat(null); setLng(null); setGeocodeMsg(""); }} />
            <button type="button" onClick={geocode} disabled={!zoneOrAddress || geocoding}
              title="Geocodează adresa exactă"
              style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--card)", cursor: "pointer", flexShrink: 0, fontSize: 16 }}>
              {geocoding ? "…" : "📍"}
            </button>
          </div>
          {geocodeMsg && (
            <div style={{ fontSize: 12, marginTop: 4, color: lat ? "oklch(0.45 0.10 148)" : "var(--vb-text-l)" }}>
              {geocodeMsg}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--vb-text-l)", marginTop: 4 }}>
            Scrie o zonă pentru localizare aproximativă, sau o adresă completă și apasă 📍 pentru localizare exactă pe hartă.
          </div>
        </div>

        {/* Website + Social */}
        <div style={row2}>
          <input className="vb-form-input" placeholder="Website (opțional)"
            value={website} onChange={(e) => setWebsite(e.target.value)} />
          <input className="vb-form-input" placeholder="Instagram / social (opțional)"
            value={social} onChange={(e) => setSocial(e.target.value)} />
        </div>

        <button type="submit" className="vb-btn-primary" disabled={submitting}
          style={{ width: "100%", padding: 14, fontSize: 15 }}>
          {submitting ? "Se adaugă..." : "Adaugă Furnizorul"}
        </button>
      </form>
    </Modal>
  );
}

// ── Add review modal ──────────────────────────────────────────────────────────

function ReviewModal({ provider, onClose, onDone }: {
  provider: Provider; onClose: () => void; onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [nickname, setNicknameState] = useState(getNickname());
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setErr("Selectează o notă"); return; }
    if (!comment.trim()) { setErr("Comentariul este obligatoriu"); return; }
    setSubmitting(true);
    setNickname(nickname);
    const res = await fetch(`/api/providers/${provider.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userUuid: getUserUuid(), nickname: nickname.trim() || "Vecin Anonim", rating, comment }),
    });
    setSubmitting(false);
    if (res.status === 409) { setAlreadyReviewed(true); return; }
    if (res.ok) onDone();
    else setErr("Eroare la trimiterea recenziei.");
  }

  if (alreadyReviewed) return (
    <Modal onClose={onClose} title={`Recenzie — ${provider.name}`} size="sm">
      <div style={{ textAlign: "center", padding: "24px 0", color: "var(--vb-text-m)" }}>
        Ai lăsat deja o recenzie pentru acest furnizor.
      </div>
    </Modal>
  );

  return (
    <Modal onClose={onClose} title={`Recenzie — ${provider.name}`} size="sm">
      <form onSubmit={submit}>
        <div style={{ textAlign: "center", padding: "8px 0 18px" }}>
          <div style={{ fontSize: 13, color: "var(--vb-text-m)", marginBottom: 10 }}>Nota ta</div>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <input className="vb-form-input" placeholder="Numele tău (opțional)"
            value={nickname} onChange={(e) => setNicknameState(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <textarea className="vb-form-input" placeholder="Spune-le vecinilor experiența ta..."
            rows={4} value={comment} onChange={(e) => setComment(e.target.value)} style={{ resize: "vertical" }} />
        </div>
        {err && <div style={{ color: "oklch(0.55 0.10 22)", fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button type="submit" className="vb-btn-primary" disabled={submitting} style={{ width: "100%", padding: 13, fontSize: 15 }}>
          {submitting ? "Se trimite..." : "Trimite Recenzia"}
        </button>
      </form>
    </Modal>
  );
}

// ── Report modal ──────────────────────────────────────────────────────────────

function ReportModal({ provider, onClose, onDone }: {
  provider: Provider; onClose: () => void; onDone: () => void;
}) {
  const REASONS = ["Informații incorecte", "Furnizor nu mai activează", "Experiență negativă / înșelătorie", "Număr de telefon greșit", "Altele"];
  const [sel, setSel] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  const toggle = (r: string) => setSel((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  if (sent) return (
    <Modal onClose={onClose} title="Raport trimis" size="sm">
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
        <p style={{ color: "var(--vb-text-m)", fontSize: 15 }}>Mulțumim! Raportul tău a fost trimis.</p>
      </div>
    </Modal>
  );

  return (
    <Modal onClose={onClose} title={`Raportează — ${provider.name}`} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); setSent(true); setTimeout(onDone, 1800); }}>
        <p style={{ fontSize: 13.5, color: "var(--vb-text-m)", marginBottom: 14 }}>Selectează motivul raportării:</p>
        {REASONS.map((r) => (
          <label key={r} className="vb-check-item">
            <input type="checkbox" checked={sel.includes(r)} onChange={() => toggle(r)} /> {r}
          </label>
        ))}
        <div style={{ height: 14 }} />
        <textarea className="vb-form-input" placeholder="Detalii suplimentare (opțional)" rows={3}
          value={details} onChange={(e) => setDetails(e.target.value)} style={{ marginBottom: 16, resize: "vertical" }} />
        <button type="submit" className="vb-btn-primary" style={{ width: "100%", padding: 12 }}>Trimite Raportul</button>
      </form>
    </Modal>
  );
}

// ── Provider card ─────────────────────────────────────────────────────────────

function ProviderCard({ provider, onOpen }: { provider: Provider; onOpen: () => void }) {
  const rating = Number(provider.avgRating) || 0;
  const waHref = provider.whatsapp
    ? `https://wa.me/${provider.whatsapp.replace(/\D/g, "")}`
    : provider.phone
    ? `https://wa.me/${provider.phone.replace(/\D/g, "").replace(/^0/, "40")}`
    : null;

  return (
    <div className="vb-card" onClick={onOpen}>
      <div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginBottom: 13 }}>
        <Avatar name={provider.name} size={50} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{provider.name}</div>
          <span className="vb-cat-badge">{provider.categoryIcon} {provider.categoryName}</span>
        </div>
      </div>
      {provider.description && (
        <p style={{ fontSize: 13.5, color: "var(--vb-text-m)", lineHeight: 1.55, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {provider.description}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Stars rating={rating} />
        <span style={{ fontWeight: 800, fontSize: 14 }}>{rating > 0 ? rating.toFixed(1) : "—"}</span>
        <span style={{ fontSize: 13, color: "var(--vb-text-l)" }}>({provider.reviewCount ?? 0})</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 14 }}>
        {provider.zone      && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--vb-text-m)" }}><span>📍</span><span>{provider.zone}</span></div>}
        {provider.priceRange && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--vb-text-m)" }}><span>💰</span><span>{provider.priceRange}</span></div>}
        {provider.hours     && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--vb-text-m)" }}><span>🕐</span><span>{provider.hours}</span></div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {provider.phone && (
          <a className="vb-btn-phone" href={`tel:${provider.phone.replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()}>📞 Sună</a>
        )}
        {waHref && (
          <a className="vb-btn-wa" href={waHref} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>💬 WhatsApp</a>
        )}
      </div>
    </div>
  );
}

// ── House logo ─────────────────────────────────────────────────────────────────

function HouseLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 11.5L12 3l9 8.5V20.5a.5.5 0 01-.5.5H15v-6H9v6H3.5a.5.5 0 01-.5-.5V11.5z"
        fill="var(--vb-accent)" opacity="0.25" stroke="var(--vb-accent)" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [reviewProvider, setReviewProvider] = useState<Provider | null>(null);
  const [reportProvider, setReportProvider] = useState<Provider | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCat !== "all") params.set("category", String(activeCat));
    if (search) params.set("search", search);
    params.set("sort", sortBy);
    const data = await fetch(`/api/providers?${params}`).then((r) => r.json());
    setProviders(data);
    setLoading(false);
  }, [activeCat, search, sortBy]);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  const catCounts = useMemo(() => {
    const m: Record<number, number> = {};
    providers.forEach((p) => { m[p.categoryId] = (m[p.categoryId] ?? 0) + 1; });
    return m;
  }, [providers]);

  async function openDetail(provider: Provider) {
    const data = await fetch(`/api/providers/${provider.id}`).then((r) => r.json());
    setDetailProvider(data);
  }

  function handleReview(id: number) {
    const p = detailProvider?.id === id ? detailProvider : providers.find((x) => x.id === id) ?? null;
    setDetailProvider(null);
    setReviewProvider(p);
  }

  function handleReport(id: number) {
    const p = detailProvider?.id === id ? detailProvider : providers.find((x) => x.id === id) ?? null;
    setDetailProvider(null);
    setReportProvider(p);
  }

  return (
    <div>
      {/* ── Header ── */}
      <header className="vb-header">
        <div className="vb-header-inner">
          <div className="vb-logo">
            <div className="vb-logo-mark"><HouseLogo /></div>
            <div>
              <div className="vb-logo-title">Vecinii Băneasa</div>
              <div className="vb-logo-sub">Furnizorii cartierului nostru</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" }}>
            <div className="vb-search-wrap">
              <span className="vb-search-icon">🔍</span>
              <input className="vb-search-input" type="text" placeholder="Caută un furnizor..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button className="vb-search-clear" onClick={() => setSearch("")}>✕</button>}
            </div>
            <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>+ Adaugă</button>
          </div>
        </div>
      </header>

      {/* ── Categories ── */}
      <div className="vb-cat-scroll-wrap"><div className="vb-cat-scroll">
        <button className={`vb-cat-chip${activeCat === "all" ? " active" : ""}`} onClick={() => setActiveCat("all")}>
          🏘️ Toți
        </button>
        {categories.map((c) => (
          <button key={c.id} className={`vb-cat-chip${activeCat === c.id ? " active" : ""}`}
            onClick={() => setActiveCat(activeCat === c.id ? "all" : c.id)}>
            {c.icon} {c.name}
            {catCounts[c.id] > 0 && (
              <span style={{ background: activeCat === c.id ? "rgba(255,255,255,0.25)" : "var(--border)", borderRadius: "50%", minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>
                {catCounts[c.id]}
              </span>
            )}
          </button>
        ))}
      </div></div>

      {/* ── Sort bar ── */}
      <div className="vb-sort-bar">
        <span className="vb-sort-count">
          {loading ? "Se încarcă..." : `${providers.length} furnizor${providers.length !== 1 ? "i" : ""}`}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--vb-text-l)" }}>Sortează:</span>
          <select className="vb-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rating">Rating</option>
            <option value="reviews">Nr. recenzii</option>
            <option value="newest">Cei mai noi</option>
          </select>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "72px 24px", color: "var(--vb-text-l)", fontSize: 15 }}>Se încarcă...</div>
      ) : providers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "72px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🏘️</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Niciun furnizor găsit</h3>
          <p style={{ color: "var(--vb-text-m)", marginBottom: 24, fontSize: 15 }}>
            {search ? `Niciun rezultat pentru „${search}"` : "Fii primul care adaugă un furnizor în această categorie!"}
          </p>
          <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>+ Adaugă Furnizor</button>
        </div>
      ) : (
        <div className="vb-grid">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} onOpen={() => openDetail(p)} />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {detailProvider && (
        <DetailModal provider={detailProvider} onClose={() => setDetailProvider(null)}
          onReview={handleReview} onReport={handleReport} />
      )}
      {showAdd && (
        <AddProviderModal categories={categories} onClose={() => setShowAdd(false)}
          onAdded={() => { loadProviders(); flash("Furnizor adăugat cu succes! 🎉"); }} />
      )}
      {reviewProvider && (
        <ReviewModal provider={reviewProvider} onClose={() => setReviewProvider(null)}
          onDone={() => { setReviewProvider(null); loadProviders(); flash("Recenzia ta a fost adăugată! ⭐"); }} />
      )}
      {reportProvider && (
        <ReportModal provider={reportProvider} onClose={() => setReportProvider(null)}
          onDone={() => { setReportProvider(null); flash("Raport trimis. Mulțumim!"); }} />
      )}

      {/* ── Toast ── */}
      {toast && <div className="vb-toast">{toast}</div>}
    </div>
  );
}

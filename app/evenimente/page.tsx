"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const CLOUDINARY_CLOUD = "dovhwewtx";
const CLOUDINARY_PRESET = "vecinii";

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", 0.82);
      };
      img.onerror = reject;
      img.src = ev.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadToCloudinary(file: File): Promise<string> {
  const blob = await compressImage(file);
  const fd = new FormData();
  fd.append("file", blob, "event.jpg");
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  return data.secure_url as string;
}
import { getNickname, setNickname } from "@/lib/user-identity";

const ProviderMap = dynamic(
  () => import("@/components/provider-map").then((m) => m.ProviderMap),
  { ssr: false }
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Event {
  id: number;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  time?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  attendees: number;
  image?: string | null;
  addedByNickname?: string | null;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_RO = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const MONTHS_RO = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(ymd: string) {
  const [y, m, d] = ymd.split("-");
  return `${parseInt(d)} ${MONTHS_RO[parseInt(m) - 1]} ${y}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  // 0=Sun → convert to Mon-first (0=Mon)
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function Calendar({ selected, onSelect, eventDates }: {
  selected: string | null;
  onSelect: (ymd: string | null) => void;
  eventDates: Set<string>;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayYMD = toYMD(today);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDay = firstDayOfMonth(viewYear, viewMonth);

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: "20px 16px", boxShadow: "var(--vb-shadow)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prev} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--vb-text-m)", padding: "4px 8px", borderRadius: 6 }}>‹</button>
        <span style={{ fontWeight: 900, fontSize: 16, color: "var(--vb-text)" }}>{MONTHS_RO[viewMonth]} {viewYear}</span>
        <button onClick={next} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--vb-text-m)", padding: "4px 8px", borderRadius: 6 }}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
        {DAYS_RO.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "var(--vb-text-l)", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = ymd === todayYMD;
          const isSelected = ymd === selected;
          const hasEvent = eventDates.has(ymd);
          const isPast = ymd < todayYMD;

          return (
            <button
              key={i}
              onClick={() => onSelect(isSelected ? null : ymd)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: 40, borderRadius: 8, border: isToday && !isSelected ? "2px solid var(--vb-accent)" : "2px solid transparent",
                background: isSelected ? "var(--vb-accent)" : "none",
                color: isSelected ? "#fff" : isPast ? "var(--vb-text-l)" : "var(--vb-text)",
                fontWeight: isToday || isSelected ? 900 : 600,
                fontSize: 13.5, cursor: "pointer", position: "relative",
                opacity: isPast ? 0.55 : 1,
                transition: "background 0.12s",
              }}
            >
              {day}
              {hasEvent && (
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: isSelected ? "rgba(255,255,255,0.8)" : "var(--vb-accent)",
                  position: "absolute", bottom: 4,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <button onClick={() => onSelect(null)}
          style={{ marginTop: 12, width: "100%", background: "none", border: "1.5px solid var(--border)", borderRadius: 8, padding: "6px 0", fontSize: 12.5, fontWeight: 700, color: "var(--vb-text-m)", cursor: "pointer" }}>
          × Șterge selecția
        </button>
      )}
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event, onShare }: { event: Event; onShare: () => void }) {
  const [count, setCount] = useState(event.attendees ?? 0);
  const [attended, setAttended] = useState(false);

  useEffect(() => {
    setAttended(localStorage.getItem(`vb-att-${event.id}`) === "1");
  }, [event.id]);

  async function handleAttend() {
    if (attended) {
      setAttended(false);
      setCount(c => Math.max(0, c - 1));
      localStorage.removeItem(`vb-att-${event.id}`);
      await fetch("/api/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unattendId: event.id }) });
    } else {
      setAttended(true);
      setCount(c => c + 1);
      localStorage.setItem(`vb-att-${event.id}`, "1");
      await fetch("/api/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendId: event.id }) });
    }
  }

  return (
    <div style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "18px 20px", boxShadow: "var(--vb-shadow)", overflow: "hidden" }}>
      {event.image && (
        <div style={{ margin: "-18px -20px 16px", background: "var(--background)", lineHeight: 0 }}>
          <img src={event.image} alt={event.title} style={{ width: "100%", height: "auto", maxHeight: 420, objectFit: "contain", display: "block" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Date block */}
        <div style={{ flexShrink: 0, background: "var(--vb-accent-lt)", borderRadius: 10, padding: "8px 12px", textAlign: "center", minWidth: 52 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--vb-accent)", lineHeight: 1 }}>
            {parseInt(event.date.slice(8))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--vb-accent)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {MONTHS_RO[parseInt(event.date.slice(5, 7)) - 1].slice(0, 3)}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 15.5, marginBottom: 4, color: "var(--vb-text)" }}>{event.title}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginBottom: event.description ? 8 : 0 }}>
            {event.time && (
              <span style={{ fontSize: 12.5, color: "var(--vb-text-m)", display: "flex", alignItems: "center", gap: 4 }}>
                🕐 {event.time}
              </span>
            )}
            {event.location && (
              <span style={{ fontSize: 12.5, color: "var(--vb-text-m)", display: "flex", alignItems: "center", gap: 4 }}>
                📍 {event.location}
              </span>
            )}
          </div>
          {event.description && (
            <p style={{ fontSize: 13.5, color: "var(--vb-text-m)", lineHeight: 1.55, margin: 0 }}>{event.description}</p>
          )}
        </div>
      </div>
      {(event.lat && event.lng) && (
        <div style={{ marginTop: 14 }}>
          <ProviderMap lat={event.lat} lng={event.lng} name={event.title} address={event.location ?? undefined} />
        </div>
      )}
      {event.addedByNickname && (
        <div style={{ fontSize: 11.5, color: "var(--vb-text-l)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          Adăugat de <strong>{event.addedByNickname}</strong>
        </div>
      )}
      {/* Attendees + Particip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
        {count > 0 ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "oklch(0.92 0.055 145)", color: "oklch(0.30 0.10 145)", fontSize: 12, fontWeight: 800 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.48 0.12 145)", display: "inline-block" }} />
            {count} {count === 1 ? "vecin participă" : "vecini participă"}
          </span>
        ) : <span />}
        <button
          onClick={handleAttend}
          style={{ padding: "6px 16px", borderRadius: 8, border: `1.5px solid ${attended ? "oklch(0.50 0.12 145)" : "var(--border)"}`, background: attended ? "oklch(0.92 0.055 145)" : "none", color: attended ? "oklch(0.30 0.10 145)" : "var(--vb-text-m)", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}
        >
          {attended ? "✓ Participi" : "Particip"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 8 }}>
        <span />
        <button
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          title="Distribuie"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--card)", cursor: "pointer", color: "var(--vb-text-m)", flexShrink: 0, transition: "border-color 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--vb-accent)"; e.currentTarget.style.color = "var(--vb-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--vb-text-m)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Add Event Modal ───────────────────────────────────────────────────────────

function AddEventModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const mouseDownOnOverlay = useRef(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState("");
  const [nickname, setNicknameState] = useState(getNickname());
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function geocode() {
    if (!location.trim()) return;
    setGeocoding(true); setGeocodeMsg("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        setGeocodeMsg("✓ Locație găsită pe hartă");
      } else {
        setGeocodeMsg("Adresa nu a fost găsită.");
      }
    } catch {
      setGeocodeMsg("Eroare la geocodare.");
    }
    setGeocoding(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Câmp obligatoriu";
    if (!date) errors.date = "Câmp obligatoriu";
    if (Object.keys(errors).length) { setErr(errors); return; }

    setSubmitting(true);
    if (nickname) setNickname(nickname);
    let uploadedImage: string | null = null;
    if (imageFile) {
      setImageUploading(true);
      try { uploadedImage = await uploadToCloudinary(imageFile); }
      catch { setImageUploading(false); setSubmitting(false); return; }
      setImageUploading(false);
    }
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date, time, location, lat, lng, image: uploadedImage, addedByNickname: nickname || "Vecin anonim" }),
    });
    setSubmitting(false);
    if (res.ok) { onAdded(); onClose(); }
  }

  return (
    <div className="vb-overlay" ref={overlayRef} onMouseDown={(e) => { mouseDownOnOverlay.current = e.target === overlayRef.current; }} onMouseUp={(e) => { if (mouseDownOnOverlay.current && e.target === overlayRef.current) onClose(); }}>
      <div className="vb-modal vb-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="vb-modal-hd">
          <h2>Adaugă Eveniment</h2>
          <button className="vb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="vb-modal-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Titlu *</label>
              <input className={`vb-form-input${err.title ? " err" : ""}`} placeholder="ex: Adunare locatari bloc 3" value={title} onChange={e => { setTitle(e.target.value); setErr(x => ({ ...x, title: "" })); }} />
              {err.title && <div style={{ fontSize: 11.5, color: "oklch(0.55 0.10 22)", marginTop: 3 }}>{err.title}</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Dată *</label>
                <input type="date" className={`vb-form-input${err.date ? " err" : ""}`} value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => { setDate(e.target.value); setErr(x => ({ ...x, date: "" })); }} />
                {err.date && <div style={{ fontSize: 11.5, color: "oklch(0.55 0.10 22)", marginTop: 3 }}>{err.date}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Ora</label>
                <input type="time" className="vb-form-input" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Locație</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="vb-form-input"
                  placeholder="ex: Parcul din spatele blocului 7"
                  value={location}
                  onChange={e => { setLocation(e.target.value); setLat(null); setLng(null); setGeocodeMsg(""); }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={geocode}
                  disabled={geocoding || !location.trim()}
                  title="Găsește pe hartă"
                  style={{ flexShrink: 0, padding: "0 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--card)", cursor: "pointer", fontSize: 17, opacity: !location.trim() ? 0.4 : 1, transition: "opacity 0.15s" }}
                >
                  {geocoding ? "…" : "📍"}
                </button>
              </div>
              {geocodeMsg && (
                <div style={{ fontSize: 12, marginTop: 4, color: lat ? "oklch(0.45 0.10 148)" : "var(--vb-text-l)" }}>{geocodeMsg}</div>
              )}
              {lat && lng && (
                <div style={{ marginTop: 10, borderRadius: 10, overflow: "hidden" }}>
                  <ProviderMap lat={lat} lng={lng} name={title || "Eveniment"} address={location} />
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Descriere</label>
              <textarea className="vb-form-input" rows={3} placeholder="Detalii despre eveniment..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "vertical" }} />
            </div>

            {/* Image upload */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Imagine (opțional)</label>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, display: "block" }} />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(""); }}
                    style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 16px", border: "1.5px dashed var(--border)", borderRadius: 10, cursor: "pointer", color: "var(--vb-text-l)", fontSize: 13, background: "var(--background)" }}>
                  <span style={{ fontSize: 22 }}>🖼️</span>
                  <span>Click pentru a adăuga o imagine</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
                </label>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Numele tău</label>
              <input className="vb-form-input" placeholder="Vecin anonim" value={nickname} onChange={e => setNicknameState(e.target.value)} />
            </div>

            <button type="submit" className="vb-btn-primary" disabled={submitting} style={{ padding: "11px 0", marginTop: 4 }}>
              {imageUploading ? "Se încarcă imaginea..." : submitting ? "Se adaugă..." : "Adaugă Evenimentul"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EvenimentePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEventDates, setAllEventDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function shareEvent(ev: { id: number; title: string }) {
    const url = `${window.location.origin}/evenimente`;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try { await navigator.share({ title: ev.title, text: `📅 ${ev.title} — Vecinii Băneasa`, url }); return; }
      catch (err: unknown) { if (err instanceof Error && err.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); }
    catch {
      const el = document.createElement("textarea"); el.value = url;
      el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    flash("Link copiat! 🔗");
  }

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const url = selectedDate ? `/api/events?date=${selectedDate}` : "/api/events";
    const data = await fetch(url).then(r => r.json());
    setEvents(data);
    setLoading(false);
  }, [selectedDate]);

  // load all future dates for dot indicators (always unfiltered)
  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then((data: Event[]) => {
      setAllEventDates(new Set(data.map(e => e.date)));
    });
  }, [showAdd]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Header */}
      <header className="vb-header">
        <div className="vb-header-inner" style={{ justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div className="vb-logo">
              <div className="vb-logo-mark">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11.5L12 3l9 8.5V20.5a.5.5 0 01-.5.5H15v-6H9v6H3.5a.5.5 0 01-.5-.5V11.5z"
                    fill="oklch(0.62 0.082 36)" fillOpacity="0.42"
                    stroke="oklch(0.62 0.082 36)" strokeOpacity="0.95"
                    strokeWidth="0.8" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="vb-logo-title">Vecinii Băneasa</div>
                <div className="vb-logo-sub">Evenimente</div>
              </div>
            </div>
          </a>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/director" style={{ fontSize: 13, fontWeight: 700, color: "var(--vb-text-m)", textDecoration: "none", padding: "5px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>🏘️ Director</a>
            <a href="/anunturi" style={{ fontSize: 13, fontWeight: 700, color: "var(--vb-text-m)", textDecoration: "none", padding: "5px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>📢 Anunțuri</a>
            <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>+ Adaugă</button>
          </div>
        </div>
      </header>

      <div className="vb-events-layout" style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px 60px" }}>

        {/* Left: Calendar */}
        <div style={{ position: "sticky", top: 80 }}>
          <Calendar selected={selectedDate} onSelect={setSelectedDate} eventDates={allEventDates} />
          <p style={{ fontSize: 12, color: "var(--vb-text-l)", textAlign: "center", marginTop: 10 }}>
            ● zilele cu eveniment
          </p>
        </div>

        {/* Right: Event list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--vb-text)" }}>
              {selectedDate
                ? formatDate(selectedDate)
                : "Evenimente viitoare"}
            </h2>
            <span style={{ fontSize: 13, color: "var(--vb-text-l)", fontWeight: 600 }}>
              {loading ? "" : `${events.length} eveniment${events.length !== 1 ? "e" : ""}`}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--vb-text-l)" }}>Se încarcă...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <p style={{ color: "var(--vb-text-m)", fontSize: 15, marginBottom: 20 }}>
                {selectedDate ? "Niciun eveniment în această zi." : "Niciun eveniment planificat."}
              </p>
              <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>+ Adaugă primul eveniment</button>
            </div>
          ) : (
            <div className="vb-events-grid">
              {events.map(e => <EventCard key={e.id} event={e} onShare={() => shareEvent(e)} />)}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onAdded={() => { loadEvents(); flash("Eveniment adăugat! 🎉"); }} />}
      {toast && <div className="vb-toast">{toast}</div>}
    </div>
  );
}

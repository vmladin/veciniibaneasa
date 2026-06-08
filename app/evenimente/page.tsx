"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { getNickname, setNickname } from "@/lib/user-identity";

// ── Cloudinary ────────────────────────────────────────────────────────────────

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

const ProviderMap = dynamic(
  () => import("@/components/provider-map").then((m) => m.ProviderMap),
  { ssr: false }
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Event {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  attendees: number;
  image?: string | null;
  addedByNickname?: string | null;
  createdAt: string;
}

// ── Constants & helpers ───────────────────────────────────────────────────────

const MONTHS_RO = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];
const MONTHS_SHORT = ["IAN","FEB","MAR","APR","MAI","IUN","IUL","AUG","SEP","OCT","NOV","DEC"];
const DAYS_RO = ["Lu","Ma","Mi","Jo","Vi","Sâ","Du"];

const CARD_GRADIENTS = [
  "linear-gradient(145deg, oklch(0.80 0.13 45), oklch(0.64 0.16 25))",
  "linear-gradient(145deg, oklch(0.80 0.12 140), oklch(0.64 0.14 155))",
  "linear-gradient(145deg, oklch(0.86 0.09 320), oklch(0.74 0.12 300))",
  "linear-gradient(145deg, oklch(0.88 0.10 70), oklch(0.76 0.13 50))",
  "linear-gradient(145deg, oklch(0.78 0.07 240), oklch(0.62 0.10 260))",
  "linear-gradient(145deg, oklch(0.82 0.10 36), oklch(0.68 0.12 18))",
  "linear-gradient(145deg, oklch(0.72 0.14 140), oklch(0.58 0.15 160))",
];

// Vary aspect ratio per card for masonry variety
const ASPECT_RATIOS = ["4/3", "3/2", "16/9", "1/1", "3/2"];

function getGradient(id: number) { return CARD_GRADIENTS[id % CARD_GRADIENTS.length]; }
function getAspect(id: number) { return ASPECT_RATIOS[id % ASPECT_RATIOS.length]; }

function isPast(dateStr: string) {
  return dateStr < new Date().toISOString().slice(0, 10);
}

function groupByMonth(evts: Event[]) {
  const map = new Map<string, { label: string; events: Event[]; ts: number }>();
  evts.forEach(e => {
    const [y, m] = e.date.split("-");
    const key = `${y}-${m}`;
    if (!map.has(key)) {
      map.set(key, {
        label: `${MONTHS_RO[parseInt(m) - 1]} ${y}`,
        events: [],
        ts: new Date(`${y}-${m}-01T00:00:00`).getTime(),
      });
    }
    map.get(key)!.events.push(e);
  });
  return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
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

  const todayYMD = today.toISOString().slice(0, 10);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prev} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vb-text-m)", fontSize: 16, padding: "3px 7px", borderRadius: 6 }}>‹</button>
        <span style={{ fontFamily: "var(--font-serif, 'DM Serif Display', Georgia, serif)", fontSize: 16, color: "var(--vb-text)", fontWeight: 400 }}>
          {MONTHS_RO[viewMonth]} {viewYear}
        </span>
        <button onClick={next} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vb-text-m)", fontSize: 16, padding: "3px 7px", borderRadius: 6 }}>›</button>
      </div>
      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {DAYS_RO.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 900, color: "var(--vb-text-l)", padding: "3px 0 6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = ymd === todayYMD;
          const isSelected = ymd === selected;
          const hasEvent = eventDates.has(ymd);
          return (
            <button
              key={i}
              onClick={() => hasEvent ? onSelect(isSelected ? null : ymd) : undefined}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: 34, borderRadius: 7, border: "none", fontSize: 12.5, fontWeight: hasEvent ? 900 : 700,
                cursor: hasEvent ? "pointer" : "default",
                background: isSelected ? "var(--vb-accent)" : isToday ? "var(--vb-accent-lt)" : "none",
                color: isSelected ? "#fff" : isToday ? "var(--vb-accent)" : hasEvent ? "var(--vb-text)" : "var(--vb-text-l)",
                position: "relative", transition: "background 0.12s",
              }}
            >
              {day}
              {hasEvent && (
                <span style={{
                  position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                  width: 4, height: 4, borderRadius: "50%",
                  background: isSelected ? "rgba(255,255,255,0.8)" : "var(--vb-accent)",
                }} />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "var(--vb-text-l)", fontWeight: 700, marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--vb-accent)", display: "inline-block" }} />
        Zile cu eveniment
      </div>
    </div>
  );
}

// ── Date badge overlay (on card image / gradient) ─────────────────────────────

function DateBadge({ date }: { date: string }) {
  const [, m, d] = date.split("-");
  return (
    <div style={{
      position: "absolute", bottom: 12, left: 12,
      background: "oklch(1 0 0 / 0.92)", backdropFilter: "blur(8px)",
      borderRadius: 10, padding: "6px 10px", textAlign: "center", minWidth: 46,
      boxShadow: "0 2px 8px oklch(0.2 0.02 40/0.18)",
    }}>
      <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: "var(--vb-accent)" }}>{parseInt(d)}</div>
      <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--vb-text-m)", textTransform: "uppercase", letterSpacing: 1, marginTop: 1 }}>
        {MONTHS_SHORT[parseInt(m) - 1]}
      </div>
    </div>
  );
}

// ── Particip button (self-contained, DB-backed) ───────────────────────────────

function PartButton({ event, onDelta, style: styleProp }: {
  event: Event;
  onDelta: (delta: number) => void;
  style?: React.CSSProperties;
}) {
  const [attended, setAttended] = useState(false);
  useEffect(() => {
    setAttended(localStorage.getItem(`vb-att-${event.id}`) === "1");
  }, [event.id]);

  async function handle(e: React.MouseEvent) {
    e.stopPropagation();
    if (attended) {
      setAttended(false); onDelta(-1);
      localStorage.removeItem(`vb-att-${event.id}`);
      fetch("/api/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unattendId: event.id }) });
    } else {
      setAttended(true); onDelta(1);
      localStorage.setItem(`vb-att-${event.id}`, "1");
      fetch("/api/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendId: event.id }) });
    }
  }

  return (
    <button onClick={handle} style={{
      padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 800,
      border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s",
      background: attended ? "var(--ev-green-bg, oklch(0.92 0.040 148))" : "var(--vb-accent)",
      color: attended ? "var(--ev-green, oklch(0.44 0.095 148))" : "#fff",
      ...styleProp,
    }}>
      {attended ? "✓ Participi" : "Particip"}
    </button>
  );
}

// ── Event Card (masonry) ──────────────────────────────────────────────────────

function EventCard({ event, onOpen, onDelta }: {
  event: Event;
  onOpen: () => void;
  onDelta: (id: number, delta: number) => void;
}) {
  const past = isPast(event.date);
  const gradient = getGradient(event.id);
  const aspect = getAspect(event.id);
  const [count, setCount] = useState(event.attendees ?? 0);
  useEffect(() => { setCount(event.attendees ?? 0); }, [event.attendees]);

  return (
    <div className={`ev-card${past ? " ev-card-past" : ""}`} onClick={onOpen}>

      {/* ── Header: image or gradient ── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {event.image ? (
          <div style={{ background: "var(--background)", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img
              src={event.image} alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
        ) : (
          <div style={{ background: gradient, aspectRatio: aspect, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, opacity: 0.28 }}>📅</div>
          </div>
        )}
        <DateBadge date={event.date} />
        {past && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "oklch(0.2 0.01 40/0.65)", color: "#fff",
            fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20,
            backdropFilter: "blur(4px)", letterSpacing: "0.5px",
          }}>TRECUT</div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ fontSize: 15.5, fontWeight: 900, lineHeight: 1.3, marginBottom: 7, color: "var(--vb-text)" }}>
          {event.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5, color: "var(--vb-text-m)", fontWeight: 700, marginBottom: event.description ? 10 : 12, flexWrap: "wrap" }}>
          {event.time && <span>🕐 {event.time}</span>}
          {event.location && <span>📍 {event.location}</span>}
        </div>
        {event.description && (
          <p style={{ fontSize: 13.5, color: "var(--vb-text-m)", lineHeight: 1.58, marginBottom: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
            {event.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
            {event.addedByNickname && (
              <div style={{ fontSize: 12, color: "var(--vb-text-l)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Adăugat de {event.addedByNickname}
              </div>
            )}
            {count > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "var(--ev-green, oklch(0.44 0.095 148))" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ev-green, oklch(0.44 0.095 148))", flexShrink: 0 }} />
                {count} vecini participă
              </div>
            )}
          </div>
          {!past && (
            <PartButton event={{ ...event, attendees: count }} onDelta={delta => { setCount(c => Math.max(0, c + delta)); onDelta(event.id, delta); }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ event, onClose, onDelta, onShare }: {
  event: Event;
  onClose: () => void;
  onDelta: (id: number, delta: number) => void;
  onShare: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const mdRef = useRef(false);
  const past = isPast(event.date);
  const [count, setCount] = useState(event.attendees ?? 0);
  useEffect(() => { setCount(event.attendees ?? 0); }, [event.attendees]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const [y, m, d] = event.date.split("-");
  const dateLabel = `${parseInt(d)} ${MONTHS_RO[parseInt(m) - 1]} ${y}`;
  const gradient = getGradient(event.id);

  return (
    <div
      ref={overlayRef}
      className="vb-overlay"
      onMouseDown={e => { mdRef.current = e.target === overlayRef.current; }}
      onMouseUp={e => { if (mdRef.current && e.target === overlayRef.current) onClose(); }}
    >
      <div className="vb-modal" style={{ maxWidth: 560, maxHeight: "88vh", overflowY: "auto", borderRadius: 22 }} onClick={e => e.stopPropagation()}>

        {/* Header: image or gradient */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          {event.image ? (
            <img src={event.image} alt={event.title} style={{ width: "100%", height: "auto", maxHeight: 320, objectFit: "contain", background: "var(--background)", display: "block" }} />
          ) : (
            <div style={{ background: gradient, height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72 }}>
              <span style={{ opacity: 0.32 }}>📅</span>
            </div>
          )}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 12, right: 12, background: "oklch(1 0 0 / 0.85)", backdropFilter: "blur(6px)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 13, color: "var(--vb-text-m)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px 30px" }}>
          <h2 style={{ fontFamily: "var(--font-serif, 'DM Serif Display', Georgia, serif)", fontSize: 26, fontWeight: 400, lineHeight: 1.2, marginBottom: 10, color: "var(--vb-text)" }}>
            {event.title}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13.5, color: "var(--vb-text-m)", fontWeight: 700, marginBottom: 16 }}>
            <span>🗓 {dateLabel}</span>
            {event.time && <span>🕐 {event.time}</span>}
            {event.location && <span>📍 {event.location}</span>}
          </div>
          {event.description && (
            <p style={{ fontSize: 14.5, color: "var(--vb-text-m)", lineHeight: 1.68, marginBottom: 22 }}>
              {event.description}
            </p>
          )}

          {/* Map */}
          {event.lat && event.lng && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: "var(--vb-text-l)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                📍 Zona de activitate
              </div>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--border)", marginBottom: 22 }}>
                <ProviderMap lat={event.lat} lng={event.lng} name={event.title} address={event.location ?? ""} />
              </div>
            </>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1.5px solid var(--border)" }}>
            <div>
              {event.addedByNickname && (
                <div style={{ fontSize: 12, color: "var(--vb-text-l)", fontWeight: 700, marginBottom: 4 }}>Adăugat de {event.addedByNickname}</div>
              )}
              {count > 0 && (
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ev-green, oklch(0.44 0.095 148))", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ev-green, oklch(0.44 0.095 148))" }} />
                  {count} vecini participă
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 9 }}>
              <button
                onClick={onShare}
                style={{ background: "var(--background)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "var(--vb-text-m)", fontWeight: 700, transition: "all 0.14s" }}
              >↗ Share</button>
              {!past && (
                <PartButton
                  event={{ ...event, attendees: count }}
                  onDelta={delta => { setCount(c => Math.max(0, c + delta)); onDelta(event.id, delta); }}
                  style={{ padding: "9px 20px", fontSize: 14, borderRadius: 11 }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Event Modal (unchanged workflow) ──────────────────────────────────────

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
    } catch { setGeocodeMsg("Eroare la geocodare."); }
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

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="vb-overlay" ref={overlayRef}
      onMouseDown={e => { mouseDownOnOverlay.current = e.target === overlayRef.current; }}
      onMouseUp={e => { if (mouseDownOnOverlay.current && e.target === overlayRef.current) onClose(); }}
    >
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
                <input className="vb-form-input" placeholder="ex: Parcul din spatele blocului 7" value={location}
                  onChange={e => { setLocation(e.target.value); setLat(null); setLng(null); setGeocodeMsg(""); }} style={{ flex: 1 }} />
                <button type="button" onClick={geocode} disabled={geocoding || !location.trim()} title="Găsește pe hartă"
                  style={{ flexShrink: 0, padding: "0 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--card)", cursor: "pointer", fontSize: 17, opacity: !location.trim() ? 0.4 : 1 }}>
                  {geocoding ? "…" : "📍"}
                </button>
              </div>
              {geocodeMsg && <div style={{ fontSize: 12, marginTop: 4, color: lat ? "oklch(0.45 0.10 148)" : "var(--vb-text-l)" }}>{geocodeMsg}</div>}
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
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Imagine (opțional)</label>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, display: "block" }} />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                    style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
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

type Filter = "viitoare" | "trecute" | "toate";

export default function EvenimentePage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<Filter>("viitoare");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<Event | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function loadEvents() {
    setLoading(true);
    const data = await fetch("/api/events?all=1").then(r => r.json());
    setAllEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadEvents(); }, []);

  // Client-side filtering
  const filtered = useMemo(() => {
    let list = allEvents;
    if (selectedDate) {
      list = list.filter(e => e.date === selectedDate);
    } else {
      if (filter === "viitoare") list = list.filter(e => e.date >= today);
      else if (filter === "trecute") list = list.filter(e => e.date < today);
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [allEvents, filter, selectedDate, today]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);
  const allEventDates = useMemo(() => new Set(allEvents.map(e => e.date)), [allEvents]);
  const futureCount = allEvents.filter(e => e.date >= today).length;
  const totalParticipants = allEvents.reduce((s, e) => s + (e.attendees ?? 0), 0);

  function handleDelta(id: number, delta: number) {
    setAllEvents(prev => prev.map(e => e.id === id ? { ...e, attendees: Math.max(0, (e.attendees ?? 0) + delta) } : e));
    setDetail(prev => prev?.id === id ? { ...prev, attendees: Math.max(0, (prev.attendees ?? 0) + delta) } : prev);
  }

  function shareEvent(ev: Event) {
    const url = `${window.location.origin}/evenimente`;
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) && navigator.share) {
      navigator.share({ title: ev.title, text: `📅 ${ev.title}`, url }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(url).then(() => flash("Link copiat! 🔗")).catch(() => flash("Link copiat! 🔗"));
  }

  const [y, m, d] = (selectedDate ?? "").split("-");
  const selectedLabel = selectedDate
    ? `${parseInt(d)} ${MONTHS_RO[parseInt(m) - 1]} ${y}`
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* ── Header ── */}
      <header className="vb-header">
        <div className="vb-header-inner" style={{ justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div className="vb-logo">
              <div className="vb-logo-mark">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11.5L12 3l9 8.5V20.5a.5.5 0 01-.5.5H15v-6H9v6H3.5a.5.5 0 01-.5-.5V11.5z"
                    fill="oklch(0.62 0.082 36)" fillOpacity="0.42"
                    stroke="oklch(0.62 0.082 36)" strokeWidth="0.9" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="vb-logo-name">Vecinii Băneasa</div>
                <div className="vb-logo-sub">Evenimente</div>
              </div>
            </div>
          </a>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/director" style={{ fontSize: 13, fontWeight: 700, color: "var(--vb-text-m)", textDecoration: "none", padding: "5px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>🏘️ Director</a>
            <a href="/anunturi" style={{ fontSize: 13, fontWeight: 700, color: "var(--vb-text-m)", textDecoration: "none", padding: "5px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>📢 Anunțuri</a>
            <button className="vb-btn-primary" onClick={() => setShowAdd(true)} style={{ padding: "7px 16px", fontSize: 13 }}>
              + Adaugă
            </button>
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="ev-page">

        {/* Sidebar */}
        <aside className="ev-sidebar">
          <Calendar selected={selectedDate} onSelect={setSelectedDate} eventDates={allEventDates} />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              style={{ marginTop: 12, background: "var(--vb-accent-lt)", border: "none", color: "var(--vb-accent)", fontWeight: 800, fontSize: 12, padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}
            >✕ Resetează filtrul</button>
          )}
          <div className="ev-stats">
            <div className="ev-stat-pill">
              <div className="ev-stat-label">Evenimente viitoare</div>
              <div className="ev-stat-val">{futureCount}</div>
            </div>
            <div className="ev-stat-pill">
              <div className="ev-stat-label">Vecini participanți</div>
              <div className="ev-stat-val">{totalParticipants}</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="ev-main">

          {/* Filter bar */}
          <div className="ev-filters">
            {selectedDate ? (
              <div style={{ fontFamily: "var(--font-serif, 'DM Serif Display', Georgia, serif)", fontSize: 20, color: "var(--vb-text)" }}>
                {selectedLabel}
              </div>
            ) : (
              <div className="ev-filter-tabs">
                {(["viitoare", "trecute", "toate"] as const).map(f => (
                  <button key={f} className={`ev-filter-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                    {f === "viitoare" ? "Viitoare" : f === "trecute" ? "Trecute" : "Toate"}
                  </button>
                ))}
              </div>
            )}
            <span className="ev-count">
              {loading ? "" : `${filtered.length} eveniment${filtered.length !== 1 ? "e" : ""}`}
            </span>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--vb-text-l)", fontSize: 15 }}>Se încarcă...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 24px" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🗓</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Niciun eveniment</h3>
              <p style={{ color: "var(--vb-text-m)", fontSize: 15, marginBottom: 24 }}>
                {filter === "viitoare" ? "Nu există evenimente viitoare. Fii primul care adaugă!" : "Niciun eveniment în această perioadă."}
              </p>
              <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>+ Adaugă Eveniment</button>
            </div>
          ) : (
            grouped.map(group => (
              <div className="ev-month-section" key={group.label}>
                <div className="ev-month-heading">
                  <div className="ev-month-label">{group.label}</div>
                  <div className="ev-month-line" />
                  <div className="ev-month-count">{group.events.length} eveniment{group.events.length !== 1 ? "e" : ""}</div>
                </div>
                <div className="ev-masonry">
                  {group.events.map(ev => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onOpen={() => setDetail(ev)}
                      onDelta={handleDelta}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {detail && (
        <DetailModal
          event={detail}
          onClose={() => setDetail(null)}
          onDelta={handleDelta}
          onShare={() => shareEvent(detail)}
        />
      )}
      {showAdd && (
        <AddEventModal onClose={() => setShowAdd(false)} onAdded={() => { loadEvents(); flash("Eveniment adăugat! 📅"); }} />
      )}
      {toast && <div className="vb-toast">{toast}</div>}
    </div>
  );
}

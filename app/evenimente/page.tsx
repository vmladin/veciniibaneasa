"use client";

import { useEffect, useState, useCallback } from "react";
import { getNickname, setNickname } from "@/lib/user-identity";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Event {
  id: number;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  time?: string | null;
  location?: string | null;
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

function EventCard({ event }: { event: Event }) {
  return (
    <div style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "18px 20px", boxShadow: "var(--vb-shadow)" }}>
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
      {event.addedByNickname && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--vb-text-l)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          Adăugat de <strong>{event.addedByNickname}</strong>
        </div>
      )}
    </div>
  );
}

// ── Add Event Modal ───────────────────────────────────────────────────────────

function AddEventModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [nickname, setNicknameState] = useState(getNickname());
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Câmp obligatoriu";
    if (!date) errors.date = "Câmp obligatoriu";
    if (Object.keys(errors).length) { setErr(errors); return; }

    setSubmitting(true);
    if (nickname) setNickname(nickname);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date, time, location, addedByNickname: nickname || "Vecin anonim" }),
    });
    setSubmitting(false);
    if (res.ok) { onAdded(); onClose(); }
  }

  return (
    <div className="vb-overlay" onClick={onClose}>
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
              <input className="vb-form-input" placeholder="ex: Parcul din spatele blocului 7" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Descriere</label>
              <textarea className="vb-form-input" rows={3} placeholder="Detalii despre eveniment..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "vertical" }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>Numele tău</label>
              <input className="vb-form-input" placeholder="Vecin anonim" value={nickname} onChange={e => setNicknameState(e.target.value)} />
            </div>

            <button type="submit" className="vb-btn-primary" disabled={submitting} style={{ padding: "11px 0", marginTop: 4 }}>
              {submitting ? "Se adaugă..." : "Adaugă Evenimentul"}
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
              <div className="vb-logo-mark" style={{ fontSize: 20 }}>🏘️</div>
              <div>
                <div className="vb-logo-title">Vecinii Băneasa</div>
                <div className="vb-logo-sub">Evenimente</div>
              </div>
            </div>
          </a>
          <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>+ Adaugă</button>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {events.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onAdded={() => { loadEvents(); flash("Eveniment adăugat! 🎉"); }} />}
      {toast && <div className="vb-toast">{toast}</div>}
    </div>
  );
}

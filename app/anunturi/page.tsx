"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { getNickname, setNickname } from "@/lib/user-identity";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "mobila",         label: "Mobilă & Deco",       icon: "🛋️" },
  { value: "electrocasnice", label: "Electrocasnice",       icon: "⚡" },
  { value: "electronice",    label: "Electronică & IT",     icon: "💻" },
  { value: "haine",          label: "Haine & Accesorii",   icon: "👗" },
  { value: "carti",          label: "Cărți & Jocuri",       icon: "📚" },
  { value: "sport",          label: "Sport & Fitness",      icon: "🏃" },
  { value: "copii",          label: "Copii & Bebeluși",    icon: "👶" },
  { value: "gradinarit",     label: "Grădinărit",           icon: "🌱" },
  { value: "auto",           label: "Auto & Moto",          icon: "🚗" },
  { value: "animale",          label: "Animale de companie",    icon: "🐾" },
  { value: "servicii",         label: "Servicii",               icon: "🔧" },
  { value: "agroalimentare",   label: "Produse agroalimentare", icon: "🌾" },
  { value: "altele",           label: "Altele",                 icon: "📦" },
];

const ZONES = ["Băneasa", "Pipera", "Floreasca", "Aviației", "Herăstrău", "Altă zonă"];

const CLOUDINARY_CLOUD = "dovhwewtx";
const CLOUDINARY_PRESET = "vecinii";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Announcement {
  id: number;
  type: "ofer" | "caut";
  category: string;
  title: string;
  description?: string | null;
  price?: string | null;
  images?: string | null;
  contact?: string | null;
  whatsapp?: string | null;
  zone?: string | null;
  nickname?: string | null;
  resolved: boolean;
  expiresAt: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getImages(ann: Announcement): string[] {
  if (!ann.images) return [];
  try { return JSON.parse(ann.images) as string[]; } catch { return []; }
}

function getCat(val: string) {
  return CATEGORIES.find(c => c.value === val) ?? { icon: "📦", label: val };
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "acum";
  if (diff < 3600) return `acum ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `acum ${days} ${days === 1 ? "zi" : "zile"}`;
  return new Date(dateStr).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const MAX = 1200;
      const scale = img.width > MAX ? MAX / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error("canvas toBlob failed"))),
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("img load")); };
    img.src = objUrl;
  });
}

async function uploadToCloudinary(file: File): Promise<string> {
  const blob = await compressImage(file);
  const fd = new FormData();
  fd.append("file", blob, "img.jpg");
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

// ── Image Picker ──────────────────────────────────────────────────────────────

function ImagePicker({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    onChange([...files, ...picked].slice(0, 3));
    e.target.value = "";
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {files.map((f, i) => {
          const src = URL.createObjectURL(f);
          return (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={src}
                alt=""
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1.5px solid var(--border)", display: "block" }}
              />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: -7, right: -7, width: 22, height: 22, borderRadius: "50%", background: "oklch(0.55 0.10 22)", border: "2px solid var(--card)", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              >×</button>
            </div>
          );
        })}
        {files.length < 3 && (
          <label style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--vb-text-l)", gap: 3, transition: "border-color 0.15s" }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>FOTO</span>
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleInput} />
          </label>
        )}
      </div>
      <p style={{ fontSize: 11, color: "var(--vb-text-l)", marginTop: 5 }}>
        Maxim 3 fotografii · Comprimate automat la 1200px înainte de upload
      </p>
    </div>
  );
}

// ── Category Dropdown (multi-select) ─────────────────────────────────────────

function AnnCategoryDropdown({ selected, onChange }: {
  selected: string[];
  onChange: (cats: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val]);
  }

  const label =
    selected.length === 0
      ? "Toate categoriile"
      : selected.length === 1
      ? getCat(selected[0]).label
      : `${selected.length} categorii selectate`;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 12px", border: "1.5px solid var(--border)", borderRadius: 8,
          fontSize: 13, fontFamily: "inherit", fontWeight: 700, color: "var(--vb-text)",
          background: selected.length > 0 ? "var(--vb-accent-lt)" : "var(--card)",
          cursor: "pointer", minWidth: 185,
        }}
      >
        <span style={{ flex: 1, textAlign: "left", color: selected.length > 0 ? "var(--vb-accent)" : "var(--vb-text)" }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: "var(--vb-text-l)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          background: "var(--card)", border: "1.5px solid var(--border)",
          borderRadius: 12, boxShadow: "var(--vb-shadow-hv)", zIndex: 200,
          minWidth: 230, maxHeight: 360, overflowY: "auto", padding: "6px 0",
        }}>
          <button
            onClick={() => { onChange([]); setOpen(false); }}
            style={{
              width: "100%", padding: "9px 14px", textAlign: "left", border: "none",
              background: selected.length === 0 ? "var(--vb-accent-lt)" : "transparent",
              cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13,
              color: selected.length === 0 ? "var(--vb-accent)" : "var(--vb-text)",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            🏘️ Toate categoriile
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          {CATEGORIES.map(c => {
            const active = selected.includes(c.value);
            return (
              <label
                key={c.value}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px", cursor: "pointer",
                  background: active ? "var(--vb-accent-lt)" : "transparent",
                  fontSize: 13, fontWeight: 700,
                  color: active ? "var(--vb-accent)" : "var(--vb-text-m)",
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggle(c.value)}
                  style={{ accentColor: "var(--vb-accent)", width: 15, height: 15, cursor: "pointer" }}
                />
                {c.icon} {c.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Announcement Detail Modal ─────────────────────────────────────────────────

function AnnDetailModal({ ann, onClose, onResolved }: {
  ann: Announcement;
  onClose: () => void;
  onResolved: () => void;
}) {
  const overlayRefDetail = useRef<HTMLDivElement>(null);
  const mouseDownDetail = useRef(false);
  const imgs = getImages(ann);
  const [imgIdx, setImgIdx] = useState(0);
  const cat = getCat(ann.category);
  const isOfer = ann.type === "ofer";
  const days = daysLeft(ann.expiresAt);

  const typeColor = isOfer
    ? { bg: "oklch(0.92 0.040 148)", text: "oklch(0.28 0.10 148)", label: "✦ OFER" }
    : { bg: "oklch(0.92 0.030 240)", text: "oklch(0.28 0.10 240)", label: "⟵ CAUT" };

  async function handleResolve() {
    if (!confirm(isOfer ? "Marchezi articolul ca vândut?" : "Marchezi căutarea ca rezolvată?")) return;
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolveId: ann.id }),
    });
    onResolved();
    onClose();
  }

  return (
    <div className="vb-overlay" ref={overlayRefDetail} onMouseDown={(e) => { mouseDownDetail.current = e.target === overlayRefDetail.current; }} onMouseUp={(e) => { if (mouseDownDetail.current && e.target === overlayRefDetail.current) onClose(); }}>
      <div className="vb-modal vb-modal-md" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 0" }}>
          <button className="vb-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Image gallery */}
        {imgs.length > 0 && (
          <div style={{ padding: "0 16px 4px" }}>
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "var(--background)" }}>
              <img
                src={imgs[imgIdx]}
                alt={ann.title}
                style={{ width: "100%", height: 280, objectFit: "contain", display: "block" }}
              />
              {imgs.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                    style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.52)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                  >‹</button>
                  <button
                    onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.52)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                  >›</button>
                  <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                    {imgs.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)} style={{ width: 7, height: 7, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.45)" }} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {imgs.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {imgs.map((url, i) => (
                  <img
                    key={i} src={url} alt="" onClick={() => setImgIdx(i)}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: `2.5px solid ${i === imgIdx ? "var(--vb-accent)" : "var(--border)"}`, opacity: i === imgIdx ? 1 : 0.55, transition: "all 0.15s" }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="vb-modal-body" style={{ paddingTop: imgs.length > 0 ? 14 : 0 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: typeColor.bg, color: typeColor.text }}>
              {typeColor.label}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "var(--vb-accent-lt)", color: "var(--vb-accent)", fontSize: 12, fontWeight: 800 }}>
              {cat.icon} {cat.label}
            </span>
          </div>

          {/* Title */}
          <h2 style={{ margin: "0 0 8px", fontSize: 21, fontWeight: 900, color: "var(--vb-text)", lineHeight: 1.25 }}>{ann.title}</h2>

          {/* Price */}
          {ann.price && (
            <p style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900, color: "var(--vb-accent)" }}>{ann.price}</p>
          )}

          {/* Description */}
          {ann.description && (
            <p style={{ margin: "0 0 16px", fontSize: 14.5, color: "var(--vb-text-m)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{ann.description}</p>
          )}

          {/* Meta row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: "var(--vb-text-l)", marginBottom: 18, background: "var(--background)", borderRadius: 10, padding: "10px 14px" }}>
            {ann.zone && <span>📍 {ann.zone}</span>}
            <span>🕐 {timeAgo(ann.createdAt)}</span>
            {ann.nickname && <span>👤 {ann.nickname}</span>}
            {days <= 5 && days > 0 && <span style={{ color: "oklch(0.55 0.10 22)", fontWeight: 700 }}>⚠ expiră în {days}z</span>}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ann.contact && (
              <a
                href={`tel:${ann.contact.replace(/\s/g, "")}`}
                className="vb-btn-primary"
                style={{ textAlign: "center", textDecoration: "none", padding: "13px 0", fontSize: 15 }}
              >
                📞 {ann.contact}
              </a>
            )}
            {ann.whatsapp && (
              <a
                href={`https://wa.me/${ann.whatsapp.replace(/\D/g, "")}`}
                className="vb-btn-wa"
                target="_blank"
                rel="noopener"
                style={{ textAlign: "center", textDecoration: "none", padding: "13px 0", fontSize: 15 }}
              >
                💬 WhatsApp
              </a>
            )}
            <button
              onClick={handleResolve}
              style={{ padding: "10px 0", borderRadius: 10, border: "1.5px solid var(--border)", background: "none", color: "var(--vb-text-m)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            >
              ✓ Marchează ca {isOfer ? "vândut" : "găsit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Announcement Card ─────────────────────────────────────────────────────────

function AnnouncementCard({ ann, onOpen, onResolved, onShare }: { ann: Announcement; onOpen: () => void; onResolved: () => void; onShare: () => void }) {
  const imgs = getImages(ann);
  const cat = getCat(ann.category);
  const days = daysLeft(ann.expiresAt);
  const isOfer = ann.type === "ofer";

  async function handleResolve() {
    if (!confirm(isOfer ? "Marchezi articolul ca vândut?" : "Marchezi căutarea ca rezolvată?")) return;
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolveId: ann.id }),
    });
    onResolved();
  }

  const typeColor = isOfer
    ? { bg: "oklch(0.92 0.040 148)", text: "oklch(0.28 0.10 148)", label: "✦ OFER" }
    : { bg: "oklch(0.92 0.030 240)", text: "oklch(0.28 0.10 240)", label: "⟵ CAUT" };

  return (
    <div
      style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--vb-shadow)", display: "flex", flexDirection: "column", cursor: "pointer", transition: "transform 0.18s, box-shadow 0.18s" }}
      onClick={onOpen}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--vb-shadow-hv)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "var(--vb-shadow)"; }}
    >
      {/* Featured image or placeholder strip */}
      {imgs.length > 0 ? (
        <div style={{ position: "relative" }}>
          <img
            src={imgs[0]}
            alt={ann.title}
            style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
          />
          {imgs.length > 1 && (
            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: 11.5, fontWeight: 700 }}>
              +{imgs.length - 1} foto
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: 64, background: isOfer ? "oklch(0.94 0.040 148)" : "oklch(0.92 0.028 240)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          {cat.icon}
        </div>
      )}

      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 800, background: typeColor.bg, color: typeColor.text }}>
            {typeColor.label}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, background: "var(--vb-accent-lt)", color: "var(--vb-accent)", fontSize: 11.5, fontWeight: 800 }}>
            {cat.icon} {cat.label}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "var(--vb-text)", lineHeight: 1.3 }}>{ann.title}</h3>

        {/* Price */}
        {ann.price && (
          <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "var(--vb-accent)" }}>{ann.price}</p>
        )}

        {/* Description (2 lines max) */}
        {ann.description && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--vb-text-m)", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
            {ann.description}
          </p>
        )}

        {/* Zone + time + expiry */}
        <div style={{ display: "flex", gap: 10, fontSize: 11.5, color: "var(--vb-text-l)", flexWrap: "wrap", marginTop: "auto" }}>
          {ann.zone && <span>📍 {ann.zone}</span>}
          <span>{timeAgo(ann.createdAt)}</span>
          {days <= 5 && days > 0 && (
            <span style={{ color: "oklch(0.55 0.10 22)", fontWeight: 700 }}>⚠ expiră în {days}z</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
          {ann.contact && (
            <a
              href={`tel:${ann.contact.replace(/\s/g, "")}`}
              className="vb-btn-phone"
              style={{ flex: ann.whatsapp ? "unset" : 1, justifyContent: "center", textDecoration: "none" }}
              onClick={e => e.stopPropagation()}
            >
              📞 {ann.contact}
            </a>
          )}
          {ann.whatsapp && (
            <a
              href={`https://wa.me/${ann.whatsapp.replace(/\D/g, "")}`}
              className="vb-btn-wa"
              target="_blank"
              rel="noopener"
              style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
              onClick={e => e.stopPropagation()}
            >
              💬 WhatsApp
            </a>
          )}
          <button
            onClick={e => { e.stopPropagation(); handleResolve(); }}
            title={isOfer ? "Marchează ca vândut" : "Marchează ca găsit"}
            style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid var(--border)", background: "none", color: "var(--vb-text-l)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}
          >
            ✓ {isOfer ? "Vândut" : "Găsit"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            title="Distribuie"
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--card)", cursor: "pointer", color: "var(--vb-text-m)", flexShrink: 0, transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--vb-accent)"; e.currentTarget.style.color = "var(--vb-accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--vb-text-m)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>

        {ann.nickname && (
          <p style={{ margin: 0, fontSize: 11, color: "var(--vb-text-l)" }}>
            de <strong>{ann.nickname}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────────────────

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const overlayRefAdd = useRef<HTMLDivElement>(null);
  const mouseDownAdd = useRef(false);
  const [type, setType] = useState<"ofer" | "caut">("ofer");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [whatsappVal, setWhatsappVal] = useState("");
  const [zone, setZone] = useState("");
  const [nicknameVal, setNicknameVal] = useState(getNickname());
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Câmp obligatoriu";
    if (!contact.trim()) errors.contact = "Adaugă un număr de contact";
    if (Object.keys(errors).length) { setErr(errors); return; }

    setSubmitting(true);
    if (nicknameVal) setNickname(nicknameVal);

    let imageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadStep(`Se încarcă foto ${i + 1} din ${files.length}...`);
      try {
        const url = await uploadToCloudinary(files[i]);
        imageUrls.push(url);
      } catch {
        // skip failed uploads silently
      }
    }
    setUploadStep("");

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        category,
        title: title.trim(),
        description: description.trim() || null,
        price: price.trim() || null,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        contact: contact.trim(),
        whatsapp: whatsappVal.trim() || null,
        zone: zone || null,
        nickname: nicknameVal || "Vecin anonim",
      }),
    });
    setSubmitting(false);
    if (res.ok) { onAdded(); onClose(); }
  }

  const lbl = (text: string, required = false) => (
    <label style={{ fontSize: 12, fontWeight: 800, color: "var(--vb-text-l)", display: "block", marginBottom: 5 }}>
      {text}
      {required && <span style={{ color: "oklch(0.55 0.10 22)" }}> *</span>}
    </label>
  );

  return (
    <div className="vb-overlay" ref={overlayRefAdd} onMouseDown={(e) => { mouseDownAdd.current = e.target === overlayRefAdd.current; }} onMouseUp={(e) => { if (mouseDownAdd.current && e.target === overlayRefAdd.current) onClose(); }}>
      <div className="vb-modal vb-modal-md" onClick={e => e.stopPropagation()}>
        <div className="vb-modal-hd">
          <h2>Adaugă Anunț</h2>
          <button className="vb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="vb-modal-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Type toggle */}
            <div>
              {lbl("Tip anunț")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["ofer", "caut"] as const).map(t => {
                  const active = type === t;
                  const isOfer = t === "ofer";
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      style={{
                        padding: "12px 0", borderRadius: 10,
                        border: "2px solid",
                        fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
                        borderColor: active ? (isOfer ? "oklch(0.40 0.10 148)" : "oklch(0.40 0.10 240)") : "var(--border)",
                        background: active ? (isOfer ? "oklch(0.92 0.040 148)" : "oklch(0.92 0.030 240)") : "var(--card)",
                        color: active ? (isOfer ? "oklch(0.28 0.10 148)" : "oklch(0.28 0.10 240)") : "var(--vb-text-m)",
                        transition: "all 0.15s",
                      }}
                    >
                      {t === "ofer" ? "✦ Ofer" : "⟵ Caut"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category + Title */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 10 }}>
              <div>
                {lbl("Categorie")}
                <select className="vb-form-input" value={category} onChange={e => setCategory(e.target.value)} style={{ cursor: "pointer" }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                {lbl("Titlu", true)}
                <input
                  className={`vb-form-input${err.title ? " err" : ""}`}
                  placeholder="ex: Canapea extensibilă, iPhone 14..."
                  value={title}
                  onChange={e => { setTitle(e.target.value); setErr(x => ({ ...x, title: "" })); }}
                />
                {err.title && <div style={{ fontSize: 11.5, color: "oklch(0.55 0.10 22)", marginTop: 3 }}>{err.title}</div>}
              </div>
            </div>

            {/* Description */}
            <div>
              {lbl("Descriere")}
              <textarea
                className="vb-form-input"
                rows={3}
                placeholder="Stare, dimensiuni, detalii relevante..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Price + Zone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                {lbl("Preț")}
                <input
                  className="vb-form-input"
                  placeholder="ex: 250 RON"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                  {["Gratuit", "Negociabil"].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrice(price === p ? "" : p)}
                      style={{
                        padding: "4px 11px", borderRadius: 20, border: "1.5px solid",
                        borderColor: price === p ? "var(--vb-accent)" : "var(--border)",
                        background: price === p ? "var(--vb-accent-lt)" : "none",
                        color: price === p ? "var(--vb-accent)" : "var(--vb-text-l)",
                        fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div>
                {lbl("Zona")}
                <select className="vb-form-input" value={zone} onChange={e => setZone(e.target.value)} style={{ cursor: "pointer" }}>
                  <option value="">— Selectează —</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>

            {/* Images */}
            <div>
              {lbl("Fotografii (opțional)")}
              <ImagePicker files={files} onChange={setFiles} />
            </div>

            {/* Contact + Nickname */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                {lbl("Număr de telefon", true)}
                <input
                  className={`vb-form-input${err.contact ? " err" : ""}`}
                  placeholder="07xx xxx xxx"
                  value={contact}
                  onChange={e => { setContact(e.target.value); setErr(x => ({ ...x, contact: "" })); }}
                />
                {err.contact && <div style={{ fontSize: 11.5, color: "oklch(0.55 0.10 22)", marginTop: 3 }}>{err.contact}</div>}
              </div>
              <div>
                {lbl("Numele tău")}
                <input
                  className="vb-form-input"
                  placeholder="Vecin anonim"
                  value={nicknameVal}
                  onChange={e => setNicknameVal(e.target.value)}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              {lbl("WhatsApp (opțional)")}
              <input
                className="vb-form-input"
                placeholder="ex: 40721000000 (cu prefix de țară)"
                value={whatsappVal}
                onChange={e => setWhatsappVal(e.target.value)}
              />
              <p style={{ fontSize: 11, color: "var(--vb-text-l)", marginTop: 4 }}>
                Lasă gol pentru a folosi același număr ca telefonul de contact.
              </p>
            </div>

            {/* Info box */}
            <div style={{ background: "var(--background)", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "var(--vb-text-m)", lineHeight: 1.5 }}>
              ℹ️ Anunțul va fi activ <strong>30 de zile</strong>, după care expiră automat. Marchează‑l ca vândut/găsit când nu mai e disponibil.
            </div>

            {uploadStep && (
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--vb-accent)", fontWeight: 700 }}>{uploadStep}</div>
            )}

            <button type="submit" className="vb-btn-primary" disabled={submitting} style={{ padding: "12px 0", marginTop: 2 }}>
              {submitting && !uploadStep ? "Se publică..." : uploadStep ? uploadStep : "Publică Anunțul"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnunturiPage() {
  const [allAnns, setAllAnns] = useState<Announcement[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "ofer" | "caut">("all");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [openAnn, setOpenAnn] = useState<Announcement | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function shareAnn(ann: Announcement) {
    const url = `${window.location.origin}/anunturi?a=${ann.id}`;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try { await navigator.share({ title: ann.title, text: `${ann.title} — Vecinii Băneasa`, url }); return; }
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

  const loadAnns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    const data = await fetch(`/api/announcements?${params}`).then(r => r.json());
    const rows: Announcement[] = Array.isArray(data) ? data : [];
    setAllAnns(rows);
    setLoading(false);
    // Deep-link: ?a=id auto-opens that announcement
    const sp = new URLSearchParams(window.location.search);
    const annId = sp.get("a");
    if (annId) {
      const target = rows.find(r => r.id === Number(annId));
      if (target) { setOpenAnn(target); history.replaceState(null, "", "/anunturi"); }
    }
  }, [typeFilter]);

  // client-side multi-category filter
  const anns = useMemo(
    () => selectedCats.length === 0 ? allAnns : allAnns.filter(a => selectedCats.includes(a.category)),
    [allAnns, selectedCats],
  );

  useEffect(() => { loadAnns(); }, [loadAnns]);

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
                    stroke="oklch(0.62 0.082 36)" strokeOpacity="0.95"
                    strokeWidth="0.8" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="vb-logo-title">Vecinii Băneasa</div>
                <div className="vb-logo-sub">Anunțuri</div>
              </div>
            </div>
          </a>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/director" style={{ fontSize: 13, fontWeight: 700, color: "var(--vb-text-m)", textDecoration: "none", padding: "5px 10px", borderRadius: 8 }}>🏘️ Director</a>
            <a href="/evenimente" style={{ fontSize: 13, fontWeight: 700, color: "var(--vb-text-m)", textDecoration: "none", padding: "5px 10px", borderRadius: 8 }}>📅 Evenimente</a>
            <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>+ Anunț</button>
          </div>
        </div>
      </header>

      {/* ── Filters ── */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "12px 20px 10px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Type toggle */}
        <div style={{ display: "flex", borderRadius: 10, border: "1.5px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
          {(["all", "ofer", "caut"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: "7px 14px", border: "none", cursor: "pointer", fontFamily: "inherit",
                fontWeight: 700, fontSize: 13,
                background: typeFilter === t ? "var(--vb-accent)" : "var(--card)",
                color: typeFilter === t ? "#fff" : "var(--vb-text-m)",
                transition: "all 0.15s",
              }}
            >
              {t === "all" ? "Toate" : t === "ofer" ? "✦ Ofer" : "⟵ Caut"}
            </button>
          ))}
        </div>

        {/* Category multi-select dropdown */}
        <AnnCategoryDropdown selected={selectedCats} onChange={setSelectedCats} />
      </div>

      {/* ── Count ── */}
      <div style={{ padding: "10px 24px 0", fontSize: 13, color: "var(--vb-text-l)", fontWeight: 600 }}>
        {!loading && `${anns.length} anunț${anns.length !== 1 ? "uri" : ""} active`}
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 20px 72px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "72px 0", color: "var(--vb-text-l)" }}>Se încarcă...</div>
        ) : anns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📋</div>
            <p style={{ color: "var(--vb-text-m)", fontSize: 16, marginBottom: 24 }}>
              {typeFilter !== "all" || selectedCats.length > 0
                ? "Niciun anunț cu filtrele selectate."
                : "Niciun anunț activ momentan. Fii primul!"}
            </p>
            <button className="vb-btn-primary" onClick={() => setShowAdd(true)}>
              + Adaugă un anunț
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 18 }}>
            {anns.map(ann => (
              <AnnouncementCard
                key={ann.id}
                ann={ann}
                onOpen={() => setOpenAnn(ann)}
                onShare={() => shareAnn(ann)}
                onResolved={() => {
                  loadAnns();
                  flash(ann.type === "ofer" ? "Marcat ca vândut! ✓" : "Marcat ca găsit! ✓");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { loadAnns(); flash("Anunț publicat! 🎉"); }}
        />
      )}
      {openAnn && (
        <AnnDetailModal
          ann={openAnn}
          onClose={() => setOpenAnn(null)}
          onResolved={() => { setOpenAnn(null); loadAnns(); flash(openAnn.type === "ofer" ? "Marcat ca vândut! ✓" : "Marcat ca găsit! ✓"); }}
        />
      )}
      {toast && <div className="vb-toast">{toast}</div>}
    </div>
  );
}

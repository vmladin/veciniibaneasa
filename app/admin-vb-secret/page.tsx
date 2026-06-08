"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { Loader2, Trash2, Edit2, X, Check, Phone, Mail, MapPin, Flag, CheckCircle, Calendar } from "lucide-react";

const ProviderMap = dynamic(
  () => import("@/components/provider-map").then((m) => m.ProviderMap),
  { ssr: false }
);

const MONTHS_RO = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];

interface Category { id: number; name: string; icon: string; }

interface Provider {
  id: number; name: string; phone?: string | null; whatsapp?: string | null; email?: string | null;
  description?: string | null; services?: string | null; categoryId: number;
  categoryName?: string | null; categoryIcon?: string | null;
  address?: string | null; lat?: number | null; lng?: number | null;
  website?: string | null; social?: string | null;
  addedByNickname?: string | null; avgRating?: number | null; reviewCount?: number | null;
}

interface Report {
  id: number; providerId: number; providerName: string;
  reasons: string; details?: string | null;
  resolved: boolean; createdAt: string;
}

interface Event {
  id: number; title: string; description?: string | null;
  date: string; time?: string | null; location?: string | null;
  lat?: number | null; lng?: number | null;
  attendees?: number; image?: string | null;
  addedByNickname?: string | null; createdAt: string;
}

interface Announcement {
  id: number; type: string; category: string; title: string;
  description?: string | null; price?: string | null; images?: string | null;
  contact?: string | null; zone?: string | null; nickname?: string | null;
  resolved: boolean; expiresAt: string; createdAt: string;
}

const ANN_CATEGORIES: Record<string, { label: string; icon: string }> = {
  mobila:         { label: "Mobilă & Deco",       icon: "ðŸ›‹ï¸" },
  electrocasnice: { label: "Electrocasnice",       icon: "âš¡" },
  electronice:    { label: "Electronică & IT",     icon: "ðŸ’»" },
  haine:          { label: "Haine & Accesorii",   icon: "ðŸ‘—" },
  carti:          { label: "Cărți & Jocuri",       icon: "ðŸ“š" },
  sport:          { label: "Sport & Fitness",      icon: "ðŸƒ" },
  copii:          { label: "Copii & Bebeluși",    icon: "ðŸ‘¶" },
  gradinarit:     { label: "Grădinărit",           icon: "ðŸŒ±" },
  auto:           { label: "Auto & Moto",          icon: "ðŸš—" },
  animale:        { label: "Animale de companie",  icon: "ðŸ¾" },
  servicii:       { label: "Servicii",             icon: "ðŸ”§" },
  altele:         { label: "Altele",               icon: "ðŸ“¦" },
};

const SESSION_KEY = "vb_admin_password";
const CLOUDINARY_CLOUD = "dovhwewtx";
const CLOUDINARY_PRESET = "vecinii";

function compressImage(file: File, maxPx = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", quality);
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
  fd.append("file", blob, "image.jpg");
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
}


function tabStyle(active: boolean, danger = false) {
  return {
    padding: "8px 20px", borderRadius: 8, border: "1.5px solid",
    fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
    borderColor: active ? (danger ? "oklch(0.55 0.10 22)" : "var(--vb-accent)") : "var(--border)",
    background: active ? (danger ? "oklch(0.55 0.10 22)" : "var(--vb-accent)") : "var(--card)",
    color: active ? "#fff" : "var(--vb-text-m)",
  } as React.CSSProperties;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"providers" | "events" | "announcements" | "reports">("providers");

  // Providers state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [providerForm, setProviderForm] = useState<Partial<Provider>>({});
  const [savingProvider, setSavingProvider] = useState(false);
  const [deletingProviderId, setDeletingProviderId] = useState<number | null>(null);
  const [providerGeoMsg, setProviderGeoMsg] = useState("");
  const [providerGeocoding, setProviderGeocoding] = useState(false);

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState<Partial<Event>>({});
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [eventGeoMsg, setEventGeoMsg] = useState("");
  const [eventGeocoding, setEventGeocoding] = useState(false);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [eventImageUploading, setEventImageUploading] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnId, setEditingAnnId] = useState<number | null>(null);
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({});
  const [savingAnn, setSavingAnn] = useState(false);
  const [deletingAnnId, setDeletingAnnId] = useState<number | null>(null);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);

  function storedPassword() {
    return typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) ?? "" : "";
  }

  useEffect(() => {
    const saved = storedPassword();
    if (saved) verifyAndLoad(saved);
  }, []);

  async function verifyAndLoad(pw: string) {
    setLoading(true);
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, pw);
      setAuthed(true);
      await Promise.all([loadProviders(), loadEvents(), loadAnnouncements(), loadReports()]);
    } else {
      setAuthError("Parolă incorectă.");
      setLoading(false);
    }
  }

  // â”€â”€ Providers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function loadProviders() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([fetch("/api/providers"), fetch("/api/categories")]);
    setProviders(await pRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  }

  function startEditProvider(p: Provider) {
    setEditingProviderId(p.id);
    setProviderGeoMsg("");
    setProviderForm({
      name: p.name, phone: p.phone ?? "", whatsapp: p.whatsapp ?? "", email: p.email ?? "",
      description: p.description ?? "", services: p.services ?? "",
      categoryId: p.categoryId, address: p.address ?? "",
      website: p.website ?? "", social: p.social ?? "",
      lat: p.lat ?? null, lng: p.lng ?? null,
    });
  }

  async function geocodeProvider() {
    const addr = providerForm.address ?? "";
    if (!addr) return;
    setProviderGeocoding(true); setProviderGeoMsg("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setProviderForm((f) => ({ ...f, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
        setProviderGeoMsg(`âœ“ ${parseFloat(data[0].lat).toFixed(5)}, ${parseFloat(data[0].lon).toFixed(5)}`);
      } else { setProviderGeoMsg("Adresa nu a fost găsită."); }
    } catch { setProviderGeoMsg("Eroare la geocodare."); }
    setProviderGeocoding(false);
  }

  async function saveProvider(id: number) {
    setSavingProvider(true);
    await fetch(`/api/providers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify(providerForm),
    });
    setEditingProviderId(null);
    setSavingProvider(false);
    await loadProviders();
  }

  async function deleteProvider(id: number) {
    if (!confirm("Ești sigur că vrei să ștergi acest furnizor?")) return;
    setDeletingProviderId(id);
    await fetch(`/api/providers/${id}`, { method: "DELETE", headers: { "x-admin-password": storedPassword() } });
    setDeletingProviderId(null);
    await loadProviders();
  }

  // â”€â”€ Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function loadEvents() {
    const res = await fetch("/api/events?all=1");
    if (res.ok) setEvents(await res.json());
  }

  function startEditEvent(e: Event) {
    setEditingEventId(e.id);
    setEventGeoMsg("");
    setEventImageFile(null);
    setEventImagePreview(null);
    setEventForm({
      title: e.title, description: e.description ?? "",
      date: e.date, time: e.time ?? "", location: e.location ?? "",
      lat: e.lat ?? null, lng: e.lng ?? null,
      image: e.image ?? null,
      addedByNickname: e.addedByNickname ?? "",
    });
  }

  async function geocodeEvent() {
    const loc = eventForm.location ?? "";
    if (!loc) return;
    setEventGeocoding(true); setEventGeoMsg("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setEventForm((f) => ({ ...f, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
        setEventGeoMsg(`âœ“ ${parseFloat(data[0].lat).toFixed(5)}, ${parseFloat(data[0].lon).toFixed(5)}`);
      } else { setEventGeoMsg("Adresa nu a fost găsită."); }
    } catch { setEventGeoMsg("Eroare la geocodare."); }
    setEventGeocoding(false);
  }

  async function saveEvent(id: number) {
    setSavingEvent(true);
    let imageUrl = eventForm.image ?? null;
    if (eventImageFile) {
      setEventImageUploading(true);
      try { imageUrl = await uploadToCloudinary(eventImageFile); } catch { /* keep existing */ }
      setEventImageUploading(false);
    }
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify({ id, ...eventForm, image: imageUrl }),
    });
    setEditingEventId(null);
    setSavingEvent(false);
    setEventImageFile(null);
    setEventImagePreview(null);
    await loadEvents();
  }

  async function deleteEvent(id: number) {
    if (!confirm("Ești sigur că vrei să ștergi acest eveniment?")) return;
    setDeletingEventId(id);
    await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify({ id }),
    });
    setDeletingEventId(null);
    await loadEvents();
  }

  // â”€â”€ Announcements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function loadAnnouncements() {
    const res = await fetch("/api/announcements?all=1");
    if (res.ok) setAnnouncements(await res.json());
  }

  function startEditAnn(a: Announcement) {
    setEditingAnnId(a.id);
    setAnnForm({
      type: a.type, category: a.category, title: a.title,
      description: a.description ?? "", price: a.price ?? "",
      contact: a.contact ?? "", zone: a.zone ?? "",
      nickname: a.nickname ?? "", resolved: a.resolved,
    });
  }

  async function saveAnn(id: number) {
    setSavingAnn(true);
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify({ id, ...annForm }),
    });
    setEditingAnnId(null);
    setSavingAnn(false);
    await loadAnnouncements();
  }

  async function deleteAnn(id: number) {
    if (!confirm("Ești sigur că vrei să ștergi acest anunț?")) return;
    setDeletingAnnId(id);
    await fetch("/api/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify({ id }),
    });
    setDeletingAnnId(null);
    await loadAnnouncements();
  }

  async function toggleAnnResolved(a: Announcement) {
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify({ ...a, resolved: !a.resolved }),
    });
    await loadAnnouncements();
  }

  // â”€â”€ Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function loadReports() {
    const res = await fetch("/api/admin/reports", { headers: { "x-admin-password": storedPassword() } });
    if (res.ok) setReports(await res.json());
  }

  async function toggleResolved(r: Report) {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify({ id: r.id, resolved: !r.resolved }),
    });
    await loadReports();
  }

  async function deleteReport(id: number) {
    await fetch("/api/admin/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify({ id }),
    });
    await loadReports();
  }

  const openReports = reports.filter((r) => !r.resolved);
  const resolvedReports = reports.filter((r) => r.resolved);

  if (!authed) {
    return (
      <main className="max-w-sm mx-auto px-4 py-32">
        <Card>
          <CardHeader><CardTitle>Admin Vecinii Băneasa</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); verifyAndLoad(password); }} className="flex flex-col gap-3">
              <Input type="password" placeholder="Parolă admin" value={password}
                onChange={(e) => setPassword(e.target.value)} autoFocus />
              {authError && <p className="text-sm text-destructive">{authError}</p>}
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 size={14} className="animate-spin mr-2" />}
                Intră
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin â€” Vecinii Băneasa</h1>
        <div className="flex gap-2">
          <Badge variant="outline">{providers.length} furnizori</Badge>
          <Badge variant="outline">{events.length} evenimente</Badge>
          <Badge variant="outline">{announcements.length} anunțuri</Badge>
          {openReports.length > 0 && <Badge variant="destructive">{openReports.length} rapoarte noi</Badge>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={() => setTab("providers")} style={tabStyle(tab === "providers")}>Furnizori ({providers.length})</button>
        <button onClick={() => setTab("events")} style={tabStyle(tab === "events")}>ðŸ“… Evenimente ({events.length})</button>
        <button onClick={() => setTab("announcements")} style={tabStyle(tab === "announcements")}>ðŸ“¢ Anunțuri ({announcements.length})</button>
        <button onClick={() => setTab("reports")} style={tabStyle(tab === "reports", openReports.length > 0)}>
          Rapoarte {openReports.length > 0 ? `(${openReports.length} noi)` : `(${reports.length})`}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" size={32} /></div>

      ) : tab === "providers" ? (
        <div className="flex flex-col gap-4">
          {providers.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                {editingProviderId === p.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">Categorie</label>
                        <select className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm mt-1"
                          value={providerForm.categoryId}
                          onChange={(e) => setProviderForm((f) => ({ ...f, categoryId: parseInt(e.target.value) }))}>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Nume</label>
                        <Input className="mt-1" value={providerForm.name ?? ""} onChange={(e) => setProviderForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Telefon</label>
                        <Input className="mt-1" value={providerForm.phone ?? ""} onChange={(e) => setProviderForm((f) => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">WhatsApp</label>
                        <Input className="mt-1" placeholder="ex: 40721000000 (fără +, cu prefix)" value={providerForm.whatsapp ?? ""} onChange={(e) => setProviderForm((f) => ({ ...f, whatsapp: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Email</label>
                        <Input className="mt-1" value={providerForm.email ?? ""} onChange={(e) => setProviderForm((f) => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Descriere</label>
                      <Textarea className="mt-1" rows={2} value={providerForm.description ?? ""} onChange={(e) => setProviderForm((f) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Servicii</label>
                      <Textarea className="mt-1" rows={2} value={providerForm.services ?? ""} onChange={(e) => setProviderForm((f) => ({ ...f, services: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Website</label>
                      <Input className="mt-1" value={providerForm.website ?? ""} placeholder="https://..." onChange={(e) => setProviderForm((f) => ({ ...f, website: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Instagram</label>
                      <Input className="mt-1" value={providerForm.social ?? ""} placeholder="@username sau URL complet" onChange={(e) => setProviderForm((f) => ({ ...f, social: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Adresă + Pin hartă</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={providerForm.address ?? ""} placeholder="Str. Exemplu nr. 1, București"
                          onChange={(e) => { setProviderForm((f) => ({ ...f, address: e.target.value })); setProviderGeoMsg(""); }} />
                        <Button type="button" size="sm" variant="outline" onClick={geocodeProvider} disabled={providerGeocoding || !providerForm.address} title="Găsește coordonatele">
                          {providerGeocoding ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
                        </Button>
                      </div>
                      {providerGeoMsg && <p className={`text-xs mt-1 ${providerForm.lat ? "text-green-600" : "text-muted-foreground"}`}>{providerGeoMsg}</p>}
                      {providerForm.lat && providerForm.lng && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          <ProviderMap lat={providerForm.lat} lng={providerForm.lng} name={providerForm.name ?? ""} address={providerForm.address} />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveProvider(p.id)} disabled={savingProvider}>
                        {savingProvider ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvează
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingProviderId(null)}>
                        <X size={13} /> Anulează
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span>{p.categoryIcon}</span>
                        <Badge variant="secondary" className="text-xs">{p.categoryName}</Badge>
                        <StarRating value={Math.round(Number(p.avgRating) || 0)} size={14} />
                        <span className="text-xs text-muted-foreground">({p.reviewCount} recenzii)</span>
                      </div>
                      <p className="font-semibold">{p.name}</p>
                      <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                        {p.phone && <span className="flex items-center gap-1"><Phone size={11} />{p.phone}</span>}
                        {p.email && <span className="flex items-center gap-1"><Mail size={11} />{p.email}</span>}
                        {p.address && <span className="flex items-center gap-1"><MapPin size={11} />{p.address}</span>}
                        {p.addedByNickname && <span>Adăugat de: {p.addedByNickname}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => startEditProvider(p)}><Edit2 size={13} /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteProvider(p.id)} disabled={deletingProviderId === p.id}>
                        {deletingProviderId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      ) : tab === "events" ? (
        <div className="flex flex-col gap-4">
          {events.length === 0 && <p className="text-muted-foreground text-center py-16">Niciun eveniment.</p>}
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="p-4">
                {editingEventId === ev.id ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-medium">Titlu</label>
                      <Input className="mt-1" value={eventForm.title ?? ""} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">Dată</label>
                        <Input type="date" className="mt-1" value={eventForm.date ?? ""} onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Ora</label>
                        <Input type="time" className="mt-1" value={eventForm.time ?? ""} onChange={(e) => setEventForm((f) => ({ ...f, time: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Locație + Pin hartă</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={eventForm.location ?? ""} placeholder="ex: Parcul Băneasa"
                          onChange={(e) => { setEventForm((f) => ({ ...f, location: e.target.value })); setEventGeoMsg(""); }} />
                        <Button type="button" size="sm" variant="outline" onClick={geocodeEvent} disabled={eventGeocoding || !eventForm.location} title="Găsește pe hartă">
                          {eventGeocoding ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
                        </Button>
                      </div>
                      {eventGeoMsg && <p className={`text-xs mt-1 ${eventForm.lat ? "text-green-600" : "text-muted-foreground"}`}>{eventGeoMsg}</p>}
                      {eventForm.lat && eventForm.lng && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          <ProviderMap lat={eventForm.lat} lng={eventForm.lng} name={eventForm.title ?? "Eveniment"} address={eventForm.location} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium">Descriere</label>
                      <Textarea className="mt-1" rows={3} value={eventForm.description ?? ""} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Imagine eveniment (opțional)</label>
                      {eventForm.image && !eventImagePreview && (
                        <div className="mt-2 relative inline-block">
                          <img src={eventForm.image} alt="imagine curentă" style={{ width: "100%", maxWidth: 320, height: 160, objectFit: "cover", borderRadius: 8, display: "block" }} />
                          <button type="button" onClick={() => setEventForm(f => ({ ...f, image: null }))}
                            style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <X size={13} color="#fff" />
                          </button>
                        </div>
                      )}
                      {eventImagePreview && (
                        <div className="mt-2 relative inline-block">
                          <img src={eventImagePreview} alt="previzualizare" style={{ width: "100%", maxWidth: 320, height: 160, objectFit: "cover", borderRadius: 8, display: "block" }} />
                          <button type="button" onClick={() => { setEventImageFile(null); setEventImagePreview(null); }}
                            style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <X size={13} color="#fff" />
                          </button>
                        </div>
                      )}
                      {!eventForm.image && !eventImagePreview && (
                        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--border)", borderRadius: 8, padding: "20px 16px", cursor: "pointer", marginTop: 8, color: "var(--vb-text-l)", fontSize: 13 }}>
                          <span style={{ fontSize: 22, marginBottom: 4 }}>🖼</span>
                          <span>Alege o imagine</span>
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setEventImageFile(f);
                            const reader = new FileReader();
                            reader.onload = (ev) => setEventImagePreview(ev.target!.result as string);
                            reader.readAsDataURL(f);
                          }} />
                        </label>
                      )}
                      {eventImageUploading && <p className="text-xs text-muted-foreground mt-1">Se încarcă imaginea...</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium">Adăugat de</label>
                      <Input className="mt-1" value={eventForm.addedByNickname ?? ""} onChange={(e) => setEventForm((f) => ({ ...f, addedByNickname: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEvent(ev.id)} disabled={savingEvent}>
                        {savingEvent ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvează
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingEventId(null)}>
                        <X size={13} /> Anulează
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Calendar size={13} className="text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          {parseInt(ev.date.slice(8))} {MONTHS_RO[parseInt(ev.date.slice(5,7))-1]} {ev.date.slice(0,4)}
                          {ev.time && ` Â· ${ev.time}`}
                        </span>
                        {new Date(ev.date) < new Date(new Date().toISOString().slice(0,10)) && (
                          <Badge variant="secondary" className="text-xs">trecut</Badge>
                        )}
                      </div>
                      <p className="font-semibold">{ev.title}</p>
                      <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                        {ev.location && <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>}
                        {ev.addedByNickname && <span>Adăugat de: {ev.addedByNickname}</span>}
                        {(ev as Event).image && <span>🖼 Are imagine</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => startEditEvent(ev)}><Edit2 size={13} /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteEvent(ev.id)} disabled={deletingEventId === ev.id}>
                        {deletingEventId === ev.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      ) : tab === "announcements" ? (
        <div className="flex flex-col gap-4">
          {announcements.length === 0 && <p className="text-muted-foreground text-center py-16">Niciun anunț.</p>}
          {announcements.map((ann) => {
            const cat = ANN_CATEGORIES[ann.category] ?? { icon: "ðŸ“¦", label: ann.category };
            const imgCount = (() => { try { return ann.images ? JSON.parse(ann.images).length : 0; } catch { return 0; } })();
            const isExpired = new Date(ann.expiresAt) < new Date();
            return (
              <Card key={ann.id}>
                <CardContent className="p-4">
                  {editingAnnId === ann.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">Tip</label>
                          <select className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm mt-1"
                            value={annForm.type} onChange={e => setAnnForm(f => ({ ...f, type: e.target.value }))}>
                            <option value="ofer">âœ¦ Ofer</option>
                            <option value="caut">âŸµ Caut</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Categorie</label>
                          <select className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm mt-1"
                            value={annForm.category} onChange={e => setAnnForm(f => ({ ...f, category: e.target.value }))}>
                            {Object.entries(ANN_CATEGORIES).map(([v, c]) => (
                              <option key={v} value={v}>{c.icon} {c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Titlu</label>
                        <Input className="mt-1" value={annForm.title ?? ""} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Descriere</label>
                        <Textarea className="mt-1" rows={2} value={annForm.description ?? ""} onChange={e => setAnnForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">Preț</label>
                          <Input className="mt-1" value={annForm.price ?? ""} onChange={e => setAnnForm(f => ({ ...f, price: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Contact</label>
                          <Input className="mt-1" value={annForm.contact ?? ""} onChange={e => setAnnForm(f => ({ ...f, contact: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Zonă</label>
                          <Input className="mt-1" value={annForm.zone ?? ""} onChange={e => setAnnForm(f => ({ ...f, zone: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Adăugat de</label>
                          <Input className="mt-1" value={annForm.nickname ?? ""} onChange={e => setAnnForm(f => ({ ...f, nickname: e.target.value }))} />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={annForm.resolved ?? false} onChange={e => setAnnForm(f => ({ ...f, resolved: e.target.checked }))} />
                        Marcat ca rezolvat
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveAnn(ann.id)} disabled={savingAnn}>
                          {savingAnn ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvează
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAnnId(null)}>
                          <X size={13} /> Anulează
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={ann.type === "ofer" ? "default" : "secondary"} className="text-xs">
                            {ann.type === "ofer" ? "âœ¦ OFER" : "âŸµ CAUT"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{cat.icon} {cat.label}</Badge>
                          {ann.resolved && <Badge variant="secondary" className="text-xs">âœ“ rezolvat</Badge>}
                          {isExpired && !ann.resolved && <Badge variant="destructive" className="text-xs">expirat</Badge>}
                          {imgCount > 0 && <span className="text-xs text-muted-foreground">ðŸ–¼ {imgCount} foto</span>}
                        </div>
                        <p className="font-semibold">{ann.title}</p>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                          {ann.price && <span className="font-bold text-primary">{ann.price}</span>}
                          {ann.contact && <span className="flex items-center gap-1"><Phone size={11} />{ann.contact}</span>}
                          {ann.zone && <span className="flex items-center gap-1"><MapPin size={11} />{ann.zone}</span>}
                          {ann.nickname && <span>Adăugat de: {ann.nickname}</span>}
                          <span>Expiră: {new Date(ann.expiresAt).toLocaleDateString("ro-RO")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                        <Button size="sm" variant={ann.resolved ? "outline" : "secondary"} onClick={() => toggleAnnResolved(ann)}>
                          <CheckCircle size={13} /> {ann.resolved ? "Redeschide" : "Rezolvat"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEditAnn(ann)}><Edit2 size={13} /></Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteAnn(ann.id)} disabled={deletingAnnId === ann.id}>
                          {deletingAnnId === ann.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

      ) : (
        <div className="flex flex-col gap-6">
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">Niciun raport momentan.</p>
          ) : (
            <>
              {openReports.length > 0 && (
                <div>
                  <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                    <Flag size={15} style={{ color: "oklch(0.55 0.10 22)" }} /> Rapoarte noi ({openReports.length})
                  </h2>
                  <div className="flex flex-col gap-3">
                    {openReports.map((r) => (
                      <ReportCard key={r.id} report={r} onResolve={() => toggleResolved(r)} onDelete={() => deleteReport(r.id)}
                        onEdit={() => { const p = providers.find(x => x.id === r.providerId); if (p) { setTab("providers"); startEditProvider(p); window.scrollTo({ top: 0, behavior: "smooth" }); } }} />
                    ))}
                  </div>
                </div>
              )}
              {resolvedReports.length > 0 && (
                <div>
                  <h2 className="font-bold text-base mb-3 flex items-center gap-2 text-muted-foreground">
                    <CheckCircle size={15} /> Rezolvate ({resolvedReports.length})
                  </h2>
                  <div className="flex flex-col gap-3 opacity-60">
                    {resolvedReports.map((r) => (
                      <ReportCard key={r.id} report={r} onResolve={() => toggleResolved(r)} onDelete={() => deleteReport(r.id)}
                        onEdit={() => { const p = providers.find(x => x.id === r.providerId); if (p) { setTab("providers"); startEditProvider(p); window.scrollTo({ top: 0, behavior: "smooth" }); } }} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}

function ReportCard({ report, onResolve, onDelete, onEdit }: {
  report: Report; onResolve: () => void; onDelete: () => void; onEdit?: () => void;
}) {
  const date = new Date(report.createdAt).toLocaleDateString("ro-RO", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Flag size={13} style={{ color: report.resolved ? "var(--vb-text-l)" : "oklch(0.55 0.10 22)", flexShrink: 0 }} />
              <span className="font-semibold">{report.providerName}</span>
              <span className="text-xs text-muted-foreground">{date}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1"><strong>Motive:</strong> {report.reasons}</p>
            {report.details && <p className="text-sm text-muted-foreground"><strong>Detalii:</strong> {report.details}</p>}
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit} title="Mergi la furnizor și editează">
                <Edit2 size={13} /> Editează
              </Button>
            )}
            <Button size="sm" variant={report.resolved ? "outline" : "secondary"} onClick={onResolve}>
              <CheckCircle size={13} /> {report.resolved ? "Redeschide" : "Rezolvat"}
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 size={13} /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

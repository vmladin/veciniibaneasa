"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { Loader2, Trash2, Edit2, X, Check, Phone, Mail, MapPin, Flag, CheckCircle } from "lucide-react";

interface Category { id: number; name: string; icon: string; }

interface Provider {
  id: number; name: string; phone?: string | null; email?: string | null;
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

const SESSION_KEY = "vb_admin_password";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"providers" | "reports">("providers");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Provider>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState("");

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
      await Promise.all([loadProviders(), loadReports()]);
    } else {
      setAuthError("Parolă incorectă.");
      setLoading(false);
    }
  }

  async function loadProviders() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([fetch("/api/providers"), fetch("/api/categories")]);
    setProviders(await pRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  }

  async function loadReports() {
    const res = await fetch("/api/admin/reports", {
      headers: { "x-admin-password": storedPassword() },
    });
    if (res.ok) setReports(await res.json());
  }

  function startEdit(p: Provider) {
    setEditingId(p.id);
    setGeocodeMsg("");
    setEditForm({
      name: p.name, phone: p.phone ?? "", email: p.email ?? "",
      description: p.description ?? "", services: p.services ?? "",
      categoryId: p.categoryId, address: p.address ?? "",
      website: p.website ?? "", social: p.social ?? "",
      lat: p.lat ?? null, lng: p.lng ?? null,
    });
  }

  async function geocodeAddress() {
    const addr = editForm.address ?? "";
    if (!addr) return;
    setGeocoding(true); setGeocodeMsg("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setEditForm((f) => ({ ...f, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
        setGeocodeMsg(`✓ ${parseFloat(data[0].lat).toFixed(5)}, ${parseFloat(data[0].lon).toFixed(5)}`);
      } else {
        setGeocodeMsg("Adresa nu a fost găsită.");
      }
    } catch {
      setGeocodeMsg("Eroare la geocodare.");
    }
    setGeocoding(false);
  }

  async function saveEdit(id: number) {
    setSaving(true);
    await fetch(`/api/providers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": storedPassword() },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    setSaving(false);
    await loadProviders();
  }

  async function deleteProvider(id: number) {
    if (!confirm("Ești sigur că vrei să ștergi acest furnizor?")) return;
    setDeletingId(id);
    await fetch(`/api/providers/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": storedPassword() },
    });
    setDeletingId(null);
    await loadProviders();
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
        <h1 className="text-2xl font-bold">Admin — Vecinii Băneasa</h1>
        <div className="flex gap-2">
          <Badge variant="outline">{providers.length} furnizori</Badge>
          {openReports.length > 0 && (
            <Badge variant="destructive">{openReports.length} rapoarte noi</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab("providers")}
          style={{
            padding: "8px 20px", borderRadius: 8, border: "1.5px solid",
            fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            borderColor: tab === "providers" ? "var(--vb-accent)" : "var(--border)",
            background: tab === "providers" ? "var(--vb-accent)" : "var(--card)",
            color: tab === "providers" ? "#fff" : "var(--vb-text-m)",
          }}
        >
          Furnizori ({providers.length})
        </button>
        <button
          onClick={() => setTab("reports")}
          style={{
            padding: "8px 20px", borderRadius: 8, border: "1.5px solid",
            fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            borderColor: tab === "reports" ? (openReports.length > 0 ? "oklch(0.55 0.10 22)" : "var(--vb-accent)") : "var(--border)",
            background: tab === "reports" ? (openReports.length > 0 ? "oklch(0.55 0.10 22)" : "var(--vb-accent)") : "var(--card)",
            color: tab === "reports" ? "#fff" : "var(--vb-text-m)",
          }}
        >
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
                {editingId === p.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">Categorie</label>
                        <select
                          className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm mt-1"
                          value={editForm.categoryId}
                          onChange={(e) => setEditForm((f) => ({ ...f, categoryId: parseInt(e.target.value) }))}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Nume</label>
                        <Input className="mt-1" value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Telefon</label>
                        <Input className="mt-1" value={editForm.phone ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Email</label>
                        <Input className="mt-1" value={editForm.email ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Descriere</label>
                      <Textarea className="mt-1" rows={2} value={editForm.description ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Servicii</label>
                      <Textarea className="mt-1" rows={2} value={editForm.services ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, services: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Website</label>
                      <Input className="mt-1" value={editForm.website ?? ""} placeholder="https://..." onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Instagram</label>
                      <Input className="mt-1" value={editForm.social ?? ""} placeholder="@username sau URL complet" onChange={(e) => setEditForm((f) => ({ ...f, social: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium">Adresă + Pin hartă</label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editForm.address ?? ""}
                          placeholder="Str. Exemplu nr. 1, București"
                          onChange={(e) => { setEditForm((f) => ({ ...f, address: e.target.value })); setGeocodeMsg(""); }}
                        />
                        <Button type="button" size="sm" variant="outline" onClick={geocodeAddress} disabled={geocoding || !editForm.address} title="Găsește coordonatele">
                          {geocoding ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
                        </Button>
                      </div>
                      {geocodeMsg && (
                        <p className={`text-xs mt-1 ${editForm.lat ? "text-green-600" : "text-muted-foreground"}`}>{geocodeMsg}</p>
                      )}
                      {editForm.lat && editForm.lng && (
                        <p className="text-xs text-muted-foreground mt-1">📍 {editForm.lat.toFixed(5)}, {editForm.lng.toFixed(5)}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(p.id)} disabled={saving}>
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        Salvează
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
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
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)}><Edit2 size={13} /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteProvider(p.id)} disabled={deletingId === p.id}>
                        {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
                      <ReportCard key={r.id} report={r} onResolve={() => toggleResolved(r)} onDelete={() => deleteReport(r.id)} />
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
                      <ReportCard key={r.id} report={r} onResolve={() => toggleResolved(r)} onDelete={() => deleteReport(r.id)} />
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

function ReportCard({ report, onResolve, onDelete }: {
  report: Report;
  onResolve: () => void;
  onDelete: () => void;
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
            <p className="text-sm text-muted-foreground mb-1">
              <strong>Motive:</strong> {report.reasons}
            </p>
            {report.details && (
              <p className="text-sm text-muted-foreground">
                <strong>Detalii:</strong> {report.details}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant={report.resolved ? "outline" : "secondary"} onClick={onResolve}>
              <CheckCircle size={13} />
              {report.resolved ? "Redeschide" : "Rezolvat"}
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 size={13} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

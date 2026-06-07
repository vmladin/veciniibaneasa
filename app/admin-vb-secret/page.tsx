"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { Loader2, Trash2, Edit2, X, Check, Phone, Mail, MapPin } from "lucide-react";

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Provider {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  services?: string | null;
  categoryId: number;
  categoryName?: string | null;
  categoryIcon?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  addedByNickname?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
}

const SESSION_KEY = "vb_admin_password";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Provider>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      await loadProviders();
    } else {
      setAuthError("Parolă incorectă.");
      setLoading(false);
    }
  }

  async function loadProviders() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch("/api/providers"),
      fetch("/api/categories"),
    ]);
    setProviders(await pRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  }

  function startEdit(p: Provider) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      phone: p.phone ?? "",
      email: p.email ?? "",
      description: p.description ?? "",
      services: p.services ?? "",
      categoryId: p.categoryId,
      address: p.address ?? "",
    });
  }

  async function saveEdit(id: number) {
    setSaving(true);
    await fetch(`/api/providers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": storedPassword(),
      },
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

  if (!authed) {
    return (
      <main className="max-w-sm mx-auto px-4 py-32">
        <Card>
          <CardHeader>
            <CardTitle>Admin Vecinii Băneasa</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); verifyAndLoad(password); }}
              className="flex flex-col gap-3"
            >
              <Input
                type="password"
                placeholder="Parolă admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
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
        <Badge variant="outline">{providers.length} furnizori</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
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
                      <label className="text-xs font-medium">Adresă</label>
                      <Input className="mt-1" value={editForm.address ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
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
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteProvider(p.id)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserUuid, getNickname, setNickname } from "@/lib/user-identity";
import { Loader2, MapPin } from "lucide-react";

interface Category { id: number; name: string; icon: string }

export default function AddProviderPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nickname, setNicknameState] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", email: "", description: "", services: "",
    priceRange: "", hours: "", zone: "", website: "", social: "", categoryId: "", address: "",
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNicknameState(getNickname());
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function geocodeAddress() {
    if (!form.address.trim()) return;
    setGeocoding(true); setGeocodeError("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=json&limit=1`, { headers: { "Accept-Language": "ro" } });
      const data = await res.json();
      if (data.length > 0) { setLat(parseFloat(data[0].lat)); setLng(parseFloat(data[0].lon)); }
      else setGeocodeError("Adresa nu a fost găsită.");
    } catch { setGeocodeError("Eroare la căutarea adresei."); }
    finally { setGeocoding(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.phone || !form.description) {
      setError("Numele, categoria, telefonul și descrierea sunt obligatorii."); return;
    }
    setSubmitting(true); setError("");
    setNickname(nickname);
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: parseInt(form.categoryId), lat, lng, addedByNickname: nickname || "Vecin anonim" }),
    });
    if (res.ok) { router.push("/"); }
    else { setError("A apărut o eroare. Încearcă din nou."); setSubmitting(false); }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border text-sm font-[inherit] outline-none transition-colors focus:border-[var(--vb-accent)]";

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px 64px" }}>
      <div style={{ background: "var(--card)", borderRadius: 20, padding: 32, boxShadow: "var(--vb-shadow)", border: "1.5px solid var(--border)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 24 }}>Adaugă un furnizor de servicii</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <input className="vb-form-input" placeholder="Porecla / numele tău (opțional)" value={nickname} onChange={(e) => setNicknameState(e.target.value)} />

          <select name="categoryId" value={form.categoryId} onChange={handleChange} className="vb-form-input" required>
            <option value="">Alege categoria *</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <input name="name" className="vb-form-input" placeholder="Numele furnizorului *" value={form.name} onChange={handleChange} required />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input name="phone" className="vb-form-input" placeholder="Telefon *" value={form.phone} onChange={handleChange} />
            <input name="whatsapp" className="vb-form-input" placeholder="WhatsApp (ex: 40721...)" value={form.whatsapp} onChange={handleChange} />
          </div>

          <textarea name="description" className="vb-form-input" placeholder="Descriere servicii *" rows={3} value={form.description} onChange={handleChange} style={{ resize: "vertical" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input name="priceRange" className="vb-form-input" placeholder="Interval preț (ex: 100–300 RON)" value={form.priceRange} onChange={handleChange} />
            <input name="hours" className="vb-form-input" placeholder="Program (ex: L–V 8:00–18:00)" value={form.hours} onChange={handleChange} />
          </div>

          <input name="zone" className="vb-form-input" placeholder="Zonă deservită (ex: Băneasa, Pipera)" value={form.zone} onChange={handleChange} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input name="website" className="vb-form-input" placeholder="Website (opțional)" value={form.website} onChange={handleChange} />
            <input name="social" className="vb-form-input" placeholder="Instagram / social (opțional)" value={form.social} onChange={handleChange} />
          </div>

          <input name="email" type="email" className="vb-form-input" placeholder="Email (opțional)" value={form.email} onChange={handleChange} />

          <div>
            <p style={{ fontSize: 12, color: "var(--vb-text-l)", marginBottom: 6 }}>Adresă fizică (opțional — pentru servicii la sediu)</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="address" className="vb-form-input" placeholder="ex: Str. Aeroportului 12, Sector 1" value={form.address} onChange={(e) => { handleChange(e); setLat(null); setLng(null); }} style={{ flex: 1 }} />
              <button type="button" onClick={geocodeAddress} disabled={!form.address || geocoding}
                style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--card)", cursor: "pointer", flexShrink: 0 }}>
                {geocoding ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <MapPin size={16} />}
              </button>
            </div>
            {geocodeError && <p style={{ fontSize: 12, color: "oklch(0.55 0.10 22)", marginTop: 4 }}>{geocodeError}</p>}
            {lat && lng && <p style={{ fontSize: 12, color: "oklch(0.45 0.10 148)", marginTop: 4 }}>✓ Locație găsită ({lat.toFixed(4)}, {lng.toFixed(4)})</p>}
          </div>

          {error && <p style={{ color: "oklch(0.55 0.10 22)", fontSize: 14 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="vb-btn-primary" disabled={submitting} style={{ flex: 1, padding: 14, fontSize: 15 }}>
              {submitting ? "Se adaugă..." : "Adaugă Furnizorul"}
            </button>
            <button type="button" className="vb-btn-outline" onClick={() => router.back()}>Anulează</button>
          </div>
        </form>
      </div>
    </main>
  );
}

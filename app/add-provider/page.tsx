"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserUuid, getNickname, setNickname } from "@/lib/user-identity";
import { MapPin, Loader2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function AddProviderPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nickname, setNicknameState] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    services: "",
    categoryId: "",
    address: "",
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNicknameState(getNickname());
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function geocodeAddress() {
    if (!form.address.trim()) return;
    setGeocoding(true);
    setGeocodeError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=json&limit=1`,
        { headers: { "Accept-Language": "ro" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        setGeocodeError("");
      } else {
        setGeocodeError("Adresa nu a fost găsită. Verifică și încearcă din nou.");
      }
    } catch {
      setGeocodeError("Eroare la căutarea adresei.");
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.categoryId) {
      setError("Numele și categoria sunt obligatorii.");
      return;
    }
    if (!nickname.trim()) {
      setError("Te rugăm să introduci porecla/numele tău.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNickname(nickname);

    const payload = {
      ...form,
      categoryId: parseInt(form.categoryId),
      lat: lat ?? null,
      lng: lng ?? null,
      addedByNickname: nickname,
      userUuid: getUserUuid(),
    };

    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const provider = await res.json();
      router.push(`/providers/${provider.id}`);
    } else {
      setError("A apărut o eroare. Încearcă din nou.");
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Adaugă un furnizor de servicii</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Porecla / numele tău *</label>
              <Input
                placeholder="ex: Maria din bloc 3"
                value={nickname}
                onChange={(e) => setNicknameState(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Salvat local în browser. Apare la recenziile tale.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Categorie *</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Alege categoria...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Nume furnizor *</label>
              <Input name="name" placeholder="ex: Ion Popescu" value={form.name} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Telefon</label>
                <Input name="phone" placeholder="07xx xxx xxx" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input name="email" type="email" placeholder="email@exemplu.ro" value={form.email} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Descriere</label>
              <Textarea
                name="description"
                placeholder="Câteva cuvinte despre furnizor..."
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Servicii oferite</label>
              <Textarea
                name="services"
                placeholder="ex: Instalare aer condiționat, revizie, reparații..."
                value={form.services}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Adresă fizică (opțional — pentru servicii la sediu)
              </label>
              <div className="flex gap-2">
                <Input
                  name="address"
                  placeholder="ex: Str. Aeroportului 12, Sector 1, București"
                  value={form.address}
                  onChange={(e) => {
                    handleChange(e);
                    setLat(null);
                    setLng(null);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={geocodeAddress}
                  disabled={!form.address || geocoding}
                  className="shrink-0"
                >
                  {geocoding ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                </Button>
              </div>
              {geocodeError && <p className="text-xs text-destructive mt-1">{geocodeError}</p>}
              {lat && lng && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Locație găsită ({lat.toFixed(4)}, {lng.toFixed(4)}) — harta va fi afișată pe pagina furnizorului.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Adaugă furnizorul
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Anulează
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

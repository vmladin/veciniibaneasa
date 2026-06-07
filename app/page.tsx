"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

interface Provider {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  address?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", String(selectedCategory));
    if (search) params.set("search", search);
    fetch(`/api/providers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        setLoading(false);
      });
  }, [selectedCategory, search]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Vecinii Băneasa</h1>
        <p className="text-muted-foreground">Servicii locale recomandate de vecini</p>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Caută serviciu sau furnizor..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/add-provider">
          <Button>
            <Plus size={16} className="mr-1" /> Adaugă
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-muted"
          }`}
        >
          Toate
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-16">Se încarcă...</div>
      ) : providers.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <p className="text-lg mb-2">Niciun furnizor găsit.</p>
          <Link href="/add-provider">
            <Button variant="outline">Fii primul care adaugă!</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </main>
  );
}

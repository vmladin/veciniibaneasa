"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUserUuid, getNickname, setNickname } from "@/lib/user-identity";
import { Phone, Mail, MapPin, ArrowLeft, Loader2, User } from "lucide-react";

const ProviderMap = dynamic(
  () => import("@/components/provider-map").then((m) => m.ProviderMap),
  { ssr: false }
);

interface Review {
  id: number;
  nickname: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

interface Provider {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  services?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  addedByNickname?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
  reviews: Review[];
}

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNicknameState] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  async function loadProvider() {
    const res = await fetch(`/api/providers/${id}`);
    if (!res.ok) { router.push("/"); return; }
    const data = await res.json();
    setProvider(data);
    setLoading(false);

    const uuid = getUserUuid();
    const hasReviewed = data.reviews.some((r: Review) => {
      return false; // uuid is not returned in review for privacy; check via 409 on submit
    });
    setAlreadyReviewed(hasReviewed);
  }

  useEffect(() => {
    setNicknameState(getNickname());
    loadProvider();
  }, [id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setReviewError("Te rugăm să alegi o notă."); return; }
    if (!nickname.trim()) { setReviewError("Introdu porecla / numele tău."); return; }

    setSubmitting(true);
    setReviewError("");
    setNickname(nickname);

    const res = await fetch(`/api/providers/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userUuid: getUserUuid(), nickname, rating, comment }),
    });

    if (res.status === 409) {
      setAlreadyReviewed(true);
      setReviewError("Ai lăsat deja o recenzie pentru acest furnizor.");
    } else if (res.ok) {
      setRating(0);
      setComment("");
      setAlreadyReviewed(true);
      await loadProvider();
    } else {
      setReviewError("Eroare la trimiterea recenziei.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!provider) return null;

  const avgRating = Number(provider.avgRating) || 0;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={16} /> Înapoi
      </button>

      {/* Provider header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{provider.categoryIcon}</span>
          <Badge variant="secondary">{provider.categoryName}</Badge>
        </div>
        <h1 className="text-2xl font-bold mb-2">{provider.name}</h1>

        <div className="flex items-center gap-3 mb-4">
          <StarRating value={Math.round(avgRating)} size={22} />
          <span className="text-sm text-muted-foreground">
            {avgRating > 0 ? `${avgRating} din 5` : "Fără recenzii încă"} · {provider.reviewCount} recenz{Number(provider.reviewCount) === 1 ? "ie" : "ii"}
          </span>
        </div>

        {provider.description && (
          <p className="text-muted-foreground mb-3">{provider.description}</p>
        )}

        {provider.services && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Servicii</p>
            <p className="text-sm text-muted-foreground">{provider.services}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 text-sm">
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex items-center gap-2 text-foreground hover:underline">
              <Phone size={15} className="text-muted-foreground" /> {provider.phone}
            </a>
          )}
          {provider.email && (
            <a href={`mailto:${provider.email}`} className="flex items-center gap-2 text-foreground hover:underline">
              <Mail size={15} className="text-muted-foreground" /> {provider.email}
            </a>
          )}
          {provider.address && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={15} /> {provider.address}
            </span>
          )}
        </div>

        {provider.addedByNickname && (
          <p className="text-xs text-muted-foreground mt-3">
            Adăugat de <span className="font-medium">{provider.addedByNickname}</span>
          </p>
        )}
      </div>

      {/* Map */}
      {provider.lat && provider.lng && (
        <div className="mb-6">
          <ProviderMap lat={provider.lat} lng={provider.lng} name={provider.name} address={provider.address} />
        </div>
      )}

      <Separator className="mb-6" />

      {/* Review form */}
      {!alreadyReviewed ? (
        <Card className="mb-8">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Lasă o recenzie</h2>
            <form onSubmit={submitReview} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Porecla / numele tău</label>
                <Input
                  placeholder="ex: Ion din bd. Bucureștii Noi"
                  value={nickname}
                  onChange={(e) => setNicknameState(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Notă *</label>
                <StarRating value={rating} onChange={setRating} size={28} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Comentariu (opțional)</label>
                <Textarea
                  placeholder="Experiența ta cu acest furnizor..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
              {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
                Trimite recenzia
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 p-3 bg-muted rounded-md text-sm text-muted-foreground">
          Ai lăsat deja o recenzie pentru acest furnizor.
        </div>
      )}

      {/* Reviews list */}
      <div>
        <h2 className="font-semibold mb-4">
          Recenzii ({provider.reviews.length})
        </h2>
        {provider.reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nicio recenzie încă. Fii primul!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {provider.reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{review.nickname}</span>
                  </div>
                  <StarRating value={review.rating} size={15} />
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(review.createdAt).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

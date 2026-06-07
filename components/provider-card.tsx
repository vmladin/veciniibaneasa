import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { Phone, Mail, MapPin, MessageSquare } from "lucide-react";

interface ProviderCardProps {
  provider: {
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
  };
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const rating = Number(provider.avgRating) || 0;

  return (
    <Link href={`/providers/${provider.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">{provider.categoryIcon}</span>
                <Badge variant="secondary" className="text-xs">
                  {provider.categoryName}
                </Badge>
              </div>
              <h3 className="font-semibold text-base mt-1">{provider.name}</h3>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <StarRating value={Math.round(rating)} size={16} />
              <span className="text-xs text-muted-foreground mt-0.5">
                {rating > 0 ? `${rating} · ` : ""}
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={11} />
                  {provider.reviewCount ?? 0}
                </span>
              </span>
            </div>
          </div>

          {provider.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{provider.description}</p>
          )}

          <div className="flex flex-col gap-1 text-sm">
            {provider.phone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone size={13} /> {provider.phone}
              </span>
            )}
            {provider.email && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail size={13} /> {provider.email}
              </span>
            )}
            {provider.address && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin size={13} /> {provider.address}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

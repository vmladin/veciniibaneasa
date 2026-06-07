"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
        >
          <Star
            size={size}
            className={cn(
              star <= value ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

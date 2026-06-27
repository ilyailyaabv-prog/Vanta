"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  thumbnailGradient: string;
  duration: string;
  category: string;
}

interface FeaturedSectionProps {
  items?: FeaturedItem[];
}

/* ─────────────────────────────────────────────
 * Vanta — FeaturedSection Component
 * Hero carousel with gradient thumbnails,
 * text overlay, and dot navigation.
 * ───────────────────────────────────────────── */

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function FeaturedSection({ items = [] }: FeaturedSectionProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    if (items.length === 0) return;
    setCurrent((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  // Auto-rotate every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const item = items[current];

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
        {/* Gradient background */}
        <div
          className="aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/9]"
          style={{ background: item.thumbnailGradient }}
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-12">
          <div className="max-w-xl">
            {/* Category badge */}
            <Badge variant="copper" size="md" className="mb-3 w-fit">
              {item.category}
            </Badge>

            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {item.title}
            </h2>

            {/* Description */}
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/70 sm:text-base sm:line-clamp-3">
              {item.description}
            </p>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-3 sm:mt-6">
              <Button size="lg" className="gap-2">
                <PlayIcon className="h-5 w-5" />
                Watch Now
              </Button>
              <Button variant="secondary" size="lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 16 16 12 12 8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                More Info
              </Button>
            </div>
          </div>

          {/* Duration badge top-right */}
          <div className="absolute right-4 top-4 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm sm:right-6 sm:top-6">
            {item.duration}
          </div>
        </div>
      </div>

      {/* Dot navigation */}
      <div className="mt-4 flex items-center justify-center gap-2 sm:mt-5">
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === current
                ? "w-8 bg-copper"
                : "w-2 bg-secondary hover:bg-muted-foreground",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
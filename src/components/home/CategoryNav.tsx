"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CategoryData } from "@/types";

interface CategoryNavProps {
  categories?: CategoryData[];
}

/* ─────────────────────────────────────────────
 * Vanta — CategoryNav Component
 * Horizontal scroll pill navigation with
 * copper active state and fade edges.
 * ───────────────────────────────────────────── */

export function CategoryNav({ categories = [] }: CategoryNavProps) {
  const [active, setActive] = useState<string>("cat-all");

  return (
    <nav className="relative">
      {/* Fade edges */}
      <div className="category-fade-left" />
      <div className="category-fade-right" />

      {/* Scrollable container */}
      <div
        className={cn(
          "flex items-center gap-2 overflow-x-auto py-3",
          "scrollbar-hide",
          "px-4 sm:px-6 lg:px-8",
        )}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActive(cat.id)}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium",
              "transition-all duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active === cat.id
                ? "bg-copper text-copper-foreground shadow-sm shadow-copper/10"
                : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground border border-border",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
"use client";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Vanta — Active Filters Component
 * Displays currently applied filter badges with
 * the ability to remove individual filters or
 * clear all at once.
 * ───────────────────────────────────────────── */

interface ActiveFiltersProps {
  filters: Record<string, string>;
  onRemove: (filterId: string) => void;
  onClearAll: () => void;
  className?: string;
}

/* ── Filter Labels ── */

const filterLabels: Record<string, string> = {
  "filter-category": "Category",
  "filter-duration": "Duration",
  "filter-sort": "Sort",
};

const filterValueLabels: Record<string, Record<string, string>> = {
  "filter-category": {
    Music: "Music",
    Documentary: "Documentary",
    Tutorial: "Tutorial",
    Travel: "Travel",
    Series: "Series",
    Interview: "Interview",
    Art: "Art",
    Meditation: "Meditation",
  },
  "filter-duration": {
    short: "Short (< 15 min)",
    medium: "Medium (15–45 min)",
    long: "Long (45–90 min)",
    feature: "Feature (> 90 min)",
  },
  "filter-sort": {
    relevance: "Relevance",
    views: "Most Viewed",
    newest: "Newest",
    oldest: "Oldest",
    duration: "Duration",
  },
};

/* ── X Icon ── */

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/* ── Active Filters ── */

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const activeEntries = Object.entries(filters).filter(
    ([, value]) => value !== "" && value !== "relevance",
  );

  if (activeEntries.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">Active filters:</span>

      {activeEntries.map(([filterId, value]) => {
        const groupLabel = filterLabels[filterId] || filterId;
        const valueLabel =
          filterValueLabels[filterId]?.[value] || value;

        return (
          <span
            key={filterId}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-foreground transition-all duration-200 hover:border-border-light"
          >
            <span className="text-muted-foreground">{groupLabel}:</span>{" "}
            <span className="font-medium">{valueLabel}</span>
            <button
              type="button"
              onClick={() => onRemove(filterId)}
              className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors duration-200 hover:bg-secondary-foreground/10 hover:text-foreground"
              aria-label={`Remove ${groupLabel} filter`}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-xs text-copper transition-colors duration-200 hover:text-copper-light"
      >
        Clear all
      </button>
    </div>
  );
}
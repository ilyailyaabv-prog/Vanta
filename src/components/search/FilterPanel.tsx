"use client";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Vanta — Filter Panel Component
 * Sidebar filter controls for the search page.
 * ───────────────────────────────────────────── */

interface FilterPanelProps {
  activeFilters: Record<string, string>;
  onFilterChange: (filterId: string, value: string) => void;
}

/* ── Filter Definitions ── */

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

const filterGroups: FilterGroup[] = [
  {
    id: "filter-category",
    label: "Category",
    options: [
      { value: "", label: "All" },
      { value: "Music", label: "Music" },
      { value: "Documentary", label: "Documentary" },
      { value: "Tutorial", label: "Tutorial" },
      { value: "Travel", label: "Travel" },
      { value: "Series", label: "Series" },
      { value: "Interview", label: "Interview" },
      { value: "Art", label: "Art" },
      { value: "Meditation", label: "Meditation" },
    ],
  },
  {
    id: "filter-duration",
    label: "Duration",
    options: [
      { value: "", label: "Any" },
      { value: "short", label: "Short (< 15 min)" },
      { value: "medium", label: "Medium (15–45 min)" },
      { value: "long", label: "Long (45–90 min)" },
      { value: "feature", label: "Feature (> 90 min)" },
    ],
  },
  {
    id: "filter-sort",
    label: "Sort By",
    options: [
      { value: "relevance", label: "Relevance" },
      { value: "views", label: "Most Viewed" },
      { value: "newest", label: "Newest" },
      { value: "oldest", label: "Oldest" },
      { value: "duration", label: "Duration" },
    ],
  },
];

/* ── Chevron Icon ── */

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ── Filter Panel ── */

export function FilterPanel({ activeFilters, onFilterChange }: FilterPanelProps) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">
        Filters
      </h2>

      <div className="space-y-5">
        {filterGroups.map((group) => (
          <fieldset key={group.id}>
            <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </legend>

            <div className="space-y-1">
              {group.options.map((option) => {
                const isActive = activeFilters[group.id] === option.value;
                const isDefault = option.value === "";

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onFilterChange(group.id, option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-all duration-200",
                      isActive && !isDefault
                        ? "bg-copper-subtle text-copper-light font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <span>{option.label}</span>
                    {isActive && !isDefault && (
                      <ChevronDown className="h-3.5 w-3.5 rotate-180 text-copper" />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </aside>
  );
}
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import type { PerformerData } from "@/types";

/* ─────────────────────────────────────────────
 * Vanta — Performers Index Client Component
 * Searchable grid with avatar, name, video count.
 * ───────────────────────────────────────────── */

/* ── SVG Icons ── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/* ── PerformerCard Component ── */

function PerformerCard({ performer }: { performer: PerformerData }) {
  return (
    <Link
      href={`/performers/${performer.slug}`}
      className="group flex flex-col items-center rounded-2xl bg-card p-6 transition-all duration-300 ease-out hover:bg-card-hover video-card-shadow"
    >
      {/* Avatar */}
      <div
        className="h-20 w-20 rounded-full transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
        style={{ background: performer.avatarGradient }}
      />

      {/* Name */}
      <h3 className="mt-4 text-center text-sm font-semibold text-foreground transition-colors group-hover:text-copper-light">
        {performer.name}
      </h3>

      {/* Video count */}
      <p className="mt-1 text-xs text-muted-foreground">
        {performer.videoCount} {performer.videoCount === 1 ? "video" : "videos"}
      </p>

      {/* Tags preview */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {performer.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

/* ── Client Component ── */

export function PerformersIndexClient({
  initialPerformers,
}: {
  initialPerformers: PerformerData[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPerformers = useMemo(() => {
    if (!searchQuery.trim()) return initialPerformers;

    const q = searchQuery.toLowerCase();
    return initialPerformers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q)),
    );
  }, [searchQuery, initialPerformers]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Performers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover talented creators and filmmakers
        </p>

        {/* Search */}
        <div className="mt-4 max-w-md">
          <Input
            placeholder="Search performers..."
            icon={<SearchIcon />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            wrapperClassName="w-full"
          />
        </div>
      </div>

      {/* ── Results count ── */}
      <p className="mb-5 text-sm text-muted-foreground">
        {filteredPerformers.length}{" "}
        {filteredPerformers.length === 1 ? "performer" : "performers"}
      </p>

      {/* ── Grid ── */}
      {filteredPerformers.length > 0 ? (
        <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredPerformers.map((performer) => (
            <PerformerCard key={performer.id} performer={performer} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <SearchIcon className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No performers found</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Try adjusting your search query
          </p>
        </div>
      )}
    </div>
  );
}
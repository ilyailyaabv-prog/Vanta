"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Pagination } from "@/components/ui/Pagination";
import type { VideoData, PerformerData } from "@/types";

/* ── SVG Icons ── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/* ── Constants ── */

const ITEMS_PER_PAGE = 12;

/* ── SearchClient Component ── */

interface SearchClientProps {
  initialAllVideos: VideoData[];
  initialPerformers: PerformerData[];
  initialAllTags: { name: string; slug: string; videoCount: number; performerCount: number }[];
}

function SearchInner({
  initialAllVideos,
  initialPerformers,
  initialAllTags,
}: SearchClientProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"all" | "videos" | "performers" | "tags">("all");

  const allVideos = initialAllVideos;
  const allPerformers = initialPerformers;
  const tags = initialAllTags;

  // Filter performers by query
  const filteredPerformers = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allPerformers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
    );
  }, [allPerformers, query]);

  // Filter tags by query
  const filteredTags = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, query]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    let results = allVideos;

    if (activeTag) {
      results = results.filter((v) =>
        v.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()),
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.description?.toLowerCase().includes(q) ?? false) ||
          v.tags.some((t) => t.toLowerCase().includes(q)) ||
          v.performers.some((p) => p.name.toLowerCase().includes(q)),
      );
    }

    return results;
  }, [allVideos, query, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const searchQuery = query.trim();
  const hasResults = filteredVideos.length > 0 || filteredPerformers.length > 0 || filteredTags.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Search header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find videos, performers, and collections
        </p>
      </div>

      {/* Search input */}
      <div className="relative mb-6 max-w-xl">
        <Input
          type="search"
          placeholder="Search videos, performers, tags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentPage(1);
          }}
          icon={<SearchIcon />}
        />
      </div>

      {/* Active filters */}
      {(activeTag || searchQuery) && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Filters:
          </span>
          {activeTag && (
            <Badge variant="copper" size="md">
              <TagIcon className="h-3 w-3" />
              {activeTag}
              <button
                onClick={() => {
                  setActiveTag(null);
                  setCurrentPage(1);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-copper/20"
                aria-label={`Remove ${activeTag} filter`}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              Results for &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      {searchQuery && (
        <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
          <button
            onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "all" ? "bg-copper text-copper-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => { setActiveTab("videos"); setCurrentPage(1); }}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "videos" ? "bg-copper text-copper-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Videos ({filteredVideos.length})
          </button>
          <button
            onClick={() => { setActiveTab("performers"); setCurrentPage(1); }}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "performers" ? "bg-copper text-copper-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Performers ({filteredPerformers.length})
          </button>
          <button
            onClick={() => { setActiveTab("tags"); setCurrentPage(1); }}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "tags" ? "bg-copper text-copper-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tags ({filteredTags.length})
          </button>
        </div>
      )}

      {/* Tag filters */}
      {!searchQuery && (
        <div className="mb-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => {
                setActiveTag(activeTag === tag.name ? null : tag.name);
                setCurrentPage(1);
              }}
            >
              <Badge
                variant={activeTag === tag.name ? "copper" : "gray"}
                size="sm"
              >
                {tag.name}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      <div>
        {searchQuery && (
          <p className="mb-4 text-sm text-muted-foreground">
            {filteredVideos.length + filteredPerformers.length + filteredTags.length}{" "}
            {(filteredVideos.length + filteredPerformers.length + filteredTags.length) === 1 ? "result" : "results"}
            {activeTag && ` for tag "${activeTag}"`}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        )}

        {/* Performer results */}
        {(activeTab === "all" || activeTab === "performers") && filteredPerformers.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Performers
            </h2>
            <div className="flex flex-wrap gap-3">
              {filteredPerformers.map((p) => (
                <Link
                  key={p.slug}
                  href={`/performers/${p.slug}`}
                  className="group inline-flex items-center gap-3 rounded-xl bg-secondary px-4 py-2.5 transition-all duration-200 hover:bg-accent"
                >
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{ background: p.avatarGradient }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground transition-colors group-hover:text-copper-light">
                      {p.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.videoCount} videos
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tag results */}
        {(activeTab === "all" || activeTab === "tags") && filteredTags.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => (
                <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name.toLowerCase())}`}>
                  <Badge variant="gray" size="md">
                    <TagIcon className="h-3 w-3" />
                    {tag.name}
                    <span className="ml-1 text-muted-foreground/50">{tag.videoCount}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {(activeTab === "all" || activeTab === "videos") && (
          <>
            {paginatedVideos.length > 0 ? (
              <VideoGrid videos={paginatedVideos} />
            ) : searchQuery && activeTab === "videos" ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
                <SearchIcon className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No videos found
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : null}
          </>
        )}

        {/* Empty state */}
        {searchQuery && !hasResults && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <SearchIcon className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No results found
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {(activeTab === "all" || activeTab === "videos") && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Export with Suspense wrapper ── */

export function SearchClient(props: SearchClientProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-copper border-t-transparent" />
          </div>
        </div>
      }
    >
      <SearchInner {...props} />
    </Suspense>
  );
}
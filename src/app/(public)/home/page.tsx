import Link from "next/link";
import { PerformerSpotlight } from "@/components/home/PerformerSpotlight";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Badge } from "@/components/ui/Badge";
import {
  getSpotlightPerformer,
  getHomeCollections,
  getFeaturedPerformers,
  getStaffPicks,
  getAllTags,
} from "@/server/queries";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
 * Vanta — Public Homepage
 * Performer-centered layout:
 *  - Performer spotlight (hero)
 *  - Curated collections grid
 *  - Featured performers row
 *  - Staff picks videos
 *  - Tag cloud
 * ───────────────────────────────────────────── */

export default async function HomePage() {
  const [spotlight, collections, featuredPerformers, staffPicks, allTags] =
    await Promise.all([
      getSpotlightPerformer(),
      getHomeCollections(),
      getFeaturedPerformers(),
      getStaffPicks(),
      getAllTags(),
    ]);

  const performers = featuredPerformers;
  const displayTags = allTags.slice(0, 12);

  return (
    <div className="flex flex-col gap-10 pb-12 pt-4 sm:gap-14 sm:pt-6 sm:pb-16">
      {/* ── Performer Spotlight (hero) ── */}
      {spotlight && <PerformerSpotlight performer={spotlight} />}

      {/* ── Curated Collections ── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Curated Collections"
          actionLabel="View All"
          actionHref="/collections"
        />
        <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {collections.slice(0, 3).map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] video-card-shadow"
            >
              <div
                className="aspect-video w-full"
                style={{ background: collection.gradient }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  {collection.title}
                </h3>
                <p className="mt-1 text-sm text-white/60 line-clamp-1">
                  {collection.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-white/50">
                  <span>{collection.performerSlugs.length} performers</span>
                  <span>{collection.videoSlugs.length} videos</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Performers ── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Featured Performers"
          actionLabel="View All"
          actionHref="/performers"
        />
        <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {performers.map((performer) => (
            <Link
              key={performer.id}
              href={`/performers/${performer.slug}`}
              className="group flex flex-col items-center rounded-2xl bg-card p-5 transition-all duration-300 hover:bg-card-hover video-card-shadow"
            >
              <div
                className="h-20 w-20 rounded-full transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
                style={{ background: performer.avatarGradient }}
              />
              <h3 className="mt-3 text-center text-sm font-semibold text-foreground transition-colors group-hover:text-copper-light">
                {performer.name}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {performer.videoCount} videos
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {performer.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Staff Picks ── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Staff Picks" />
        <VideoGrid videos={staffPicks} />
      </section>

      {/* ── Browse by Tag ── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Browse by Tag"
          actionLabel="All Tags"
          actionHref="/tags"
        />
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name.toLowerCase())}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
            >
              {tag.name}
              <span className="text-xs text-muted-foreground/50">
                {tag.videoCount}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
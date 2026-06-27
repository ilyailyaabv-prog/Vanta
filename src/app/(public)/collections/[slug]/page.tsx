import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { VideoGrid } from "@/components/video/VideoGrid";
import { getAllPerformers, getVideoBySlug } from "@/server/queries";
import { getCollectionBySlug } from "@/server/queries/collections";

export const dynamic = "force-dynamic";
/* ─────────────────────────────────────────────
 * Vanta — Collection Detail Page
 * Collection header with performers and videos.
 * ───────────────────────────────────────────── */

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const [collection, allPerformers] = await Promise.all([
    getCollectionBySlug(slug),
    getAllPerformers(),
  ]);

  if (!collection) {
    notFound();
  }

  // Load videos from collection's video slugs
  const videoPromises = collection.videoSlugs.map((videoSlug: string) => getVideoBySlug(videoSlug));
  const videoResults = await Promise.all(videoPromises);
  const uniqueVideos = videoResults.filter((v): v is NonNullable<typeof v> => v !== null);

  const performerMap = new Map(allPerformers.map((p) => [p.slug, p]));
  const performers = collection.performerSlugs
    .map((s: string) => performerMap.get(s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ── Back link ── */}
      <Link
        href="/collections"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All Collections
      </Link>

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="aspect-video w-full sm:aspect-[3/1]"
          style={{ background: collection.gradient }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            {collection.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/60 sm:text-base">
            {collection.description}
          </p>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {collection.tags.map((tag) => (
              <Badge key={tag} variant="gray" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performers in this collection ── */}
      {performers.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Performers
          </h2>
          <div className="flex flex-wrap gap-3">
            {performers.map((p) => (
              <Link
                key={p.id}
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

      {/* ── Videos ── */}
      <section className="mt-8 sm:mt-10">
        <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Videos in this Collection
        </h2>
        {uniqueVideos.length > 0 ? (
          <VideoGrid videos={uniqueVideos} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <p className="text-sm text-muted-foreground">No videos in this collection yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
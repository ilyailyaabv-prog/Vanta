import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { VideoGrid } from "@/components/video/VideoGrid";
import {
  getVideosForTag,
  getPerformersForTag,
  getAllTags,
} from "@/server/queries";

export const dynamic = "force-dynamic";
/* ─────────────────────────────────────────────
 * Vanta — Tag Detail Page
 * Videos filtered by tag + associated performers.
 * ───────────────────────────────────────────── */

interface Props {
  params: Promise<{ tag: string }>;
}

export default async function TagDetailPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  // Capitalize for display
  const displayTag = decodedTag.charAt(0).toUpperCase() + decodedTag.slice(1);

  const [videos, performers, allTags] = await Promise.all([
    getVideosForTag(displayTag),
    getPerformersForTag(displayTag),
    getAllTags(),
  ]);

  if (videos.length === 0 && performers.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ── Back link ── */}
      <Link
        href="/tags"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All Tags
      </Link>

      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {displayTag}
          </h1>
          <Badge variant="gray" size="md">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </Badge>
        </div>
      </div>

      {/* ── Performers with this tag ── */}
      {performers.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
      <section>
        <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Videos
        </h2>
        {videos.length > 0 ? (
          <VideoGrid videos={videos} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <p className="text-sm text-muted-foreground">No videos with this tag yet</p>
          </div>
        )}
      </section>

      {/* ── Related tags ── */}
      {allTags.length > 0 && (
        <>
          <hr className="my-8 border-border sm:my-10" />
          <section>
            <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Browse More Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter((t) => t.name !== displayTag)
                .slice(0, 8)
                .map((t) => (
                  <Link
                    key={t.name}
                    href={`/tags/${encodeURIComponent(t.name.toLowerCase())}`}
                    className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                  >
                    {t.name}
                  </Link>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
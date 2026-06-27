import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { VideoGrid } from "@/components/video/VideoGrid";
import {
  getPerformerBySlug,
  getVideosForPerformer,
  getRelatedPerformers,
} from "@/server/queries";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
 * Vanta — Performer Profile Page
 * Avatar, bio, tags, video grid, related performers.
 * Mobile-first responsive layout.
 * ───────────────────────────────────────────── */

/* ── SVG Icons ── */

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

/* ── RelatedPerformerCard Component ── */

function RelatedPerformerCard({
  slug,
  name,
  avatarGradient,
  videoCount,
}: {
  slug: string;
  name: string;
  avatarGradient: string;
  videoCount: number;
}) {
  return (
    <Link
      href={`/performers/${slug}`}
      className="group inline-flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 transition-all duration-200 hover:bg-accent"
    >
      <div
        className="h-10 w-10 shrink-0 rounded-full"
        style={{ background: avatarGradient }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground transition-colors group-hover:text-copper-light">
          {name}
        </span>
        <span className="text-xs text-muted-foreground">
          {videoCount} {videoCount === 1 ? "video" : "videos"}
        </span>
      </div>
    </Link>
  );
}

/* ── Page Component ── */

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PerformerProfilePage({ params }: Props) {
  const { slug } = await params;
  const performer = await getPerformerBySlug(slug);

  if (!performer) {
    notFound();
  }

  const [performerVideos, relatedPerformers] = await Promise.all([
    getVideosForPerformer(performer.slug),
    getRelatedPerformers(performer.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ── Back link ── */}
      <Link
        href="/performers"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All Performers
      </Link>

      {/* ── Header ── */}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Large avatar */}
        <div
          className="h-24 w-24 shrink-0 rounded-full sm:h-32 sm:w-32"
          style={{ background: performer.avatarGradient }}
        />

        {/* Info */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {performer.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1.5">
              <VideoIcon className="h-4 w-4" />
              {performer.videoCount} {performer.videoCount === 1 ? "video" : "videos"}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              Joined {performer.joinedAt}
            </span>
          </div>

          {/* Bio */}
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {performer.bio}
          </p>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {performer.tags.map((tag) => (
              <Badge key={tag} variant="gray" size="md">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <hr className="my-8 border-border sm:my-10" />

      {/* ── Video Grid ── */}
      <section>
        <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Videos
        </h2>
        {performerVideos.length > 0 ? (
          <VideoGrid videos={performerVideos} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <VideoIcon className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No videos yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              This performer hasn't published any videos yet
            </p>
          </div>
        )}
      </section>

      {/* ── Related Performers ── */}
      {relatedPerformers.length > 0 && (
        <>
          <hr className="my-8 border-border sm:my-10" />
          <section>
            <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Related Performers
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedPerformers.map((rp) => (
                <RelatedPerformerCard
                  key={rp.id}
                  slug={rp.slug}
                  name={rp.name}
                  avatarGradient={rp.avatarGradient}
                  videoCount={rp.videoCount}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
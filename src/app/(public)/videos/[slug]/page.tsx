import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { VideoGrid } from "@/components/video/VideoGrid";
import {
  getVideoBySlug,
  getVideosByPerformerForVideo,
  getRecommendedVideos,
  getPrimaryVideoSource,
} from "@/server/queries";
import { getStorageAdapter } from "@/server/storage";
import { formatViews } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
 * Vanta — Video Detail Page
 * Large HTML5 video player, performers highlighted,
 * tags, "More from" the performer, recommended.
 * ───────────────────────────────────────────── */

/* ── SVG Icons ── */

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

/* ── Page Component ── */

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VideoDetailPage({ params }: Props) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) {
    notFound();
  }

  // Load the primary video source from MediaAsset
  const videoSource = await getPrimaryVideoSource(video.id);
  const storage = getStorageAdapter();
  const videoUrl = videoSource && storage ? storage.getPublicUrl(videoSource.storageKey) : null;

  const [moreFromPerformer, recommended] = await Promise.all([
    getVideosByPerformerForVideo(slug),
    getRecommendedVideos(slug, 8),
  ]);

  const hasMoreFromPerformer = moreFromPerformer.length > 0;
  const displayRecommended = hasMoreFromPerformer
    ? recommended.slice(0, 4)
    : recommended;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* ── Player Area ── */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-black">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="h-full w-full"
            poster={video.thumbnailUrl ?? undefined}
            preload="metadata"
          >
            Your browser does not support the video element.
          </video>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: video.thumbnailGradient }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-copper text-copper-foreground opacity-60 sm:h-20 sm:w-20">
              <svg className="ml-1 h-8 w-8 sm:h-10 sm:w-10" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        )}

        {video.isPremium && (
          <div className="absolute left-4 top-4">
            <Badge variant="copper" size="md">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Premium
            </Badge>
          </div>
        )}

        {!videoUrl && (
          <div className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm">
            {video.duration}
          </div>
        )}
      </div>

      {/* ── Title & Metadata ── */}
      <div className="mt-5 sm:mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              {video.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <EyeIcon className="h-4 w-4" />
                {formatViews(video.views)} views
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                {video.publishedAt}
              </span>
              {video.isPremium && (
                <Badge variant="copper" size="sm">
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>

        {video.description && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {video.description}
          </p>
        )}
      </div>

      {/* ── Performers (primary section) ── */}
      {video.performers && video.performers.length > 0 && (
        <section className="mt-6 sm:mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Performers
          </h2>
          <div className="flex flex-wrap gap-3">
            {video.performers.map((performer) => (
              <Link
                key={performer.slug}
                href={`/performers/${performer.slug}`}
                className="group inline-flex items-center gap-3 rounded-xl bg-secondary px-4 py-2.5 transition-all duration-200 hover:bg-accent"
              >
                <div
                  className="h-8 w-8 rounded-full"
                  style={{ background: performer.avatarGradient }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-copper-light">
                    {performer.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {performer.videoCount} videos
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Tags ── */}
      {video.tags && video.tags.length > 0 && (
        <section className="mt-5 sm:mt-6">
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}>
                <Badge variant="gray" size="md">
                  <TagIcon className="h-3 w-3" />
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Divider ── */}
      <hr className="my-8 border-border sm:my-10" />

      {/* ── More from Performer ── */}
      {hasMoreFromPerformer && (
        <section className="mb-8 sm:mb-10">
          <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
            More from{" "}
            {video.performers[0]?.name ?? "Performer"}
          </h2>
          <VideoGrid videos={moreFromPerformer} />
        </section>
      )}

      {/* ── Related Videos ── */}
      {displayRecommended.length > 0 && (
        <section>
          <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Related Videos
          </h2>
          <VideoGrid videos={displayRecommended} />
        </section>
      )}
    </div>
  );
}
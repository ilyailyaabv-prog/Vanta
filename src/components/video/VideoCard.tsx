import { cn, formatViews } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { VideoData } from "@/types";

/* ─────────────────────────────────────────────
 * Vanta — VideoCard Component
 * 16:9 thumbnail, duration overlay, performer
 * name, premium badge. Performer-centered.
 * ───────────────────────────────────────────── */

/* ── SVG Icons ── */

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ── VideoCard Component ── */

interface VideoCardProps {
  video: VideoData;
  className?: string;
  style?: React.CSSProperties;
}

export function VideoCard({ video, className, style }: VideoCardProps) {
  const primaryPerformer = video.performers?.[0] ?? null;

  return (
    <a
      href={`/videos/${video.slug}`}
      className={cn(
        "group relative flex flex-col rounded-2xl bg-card transition-all duration-300 ease-out",
        "hover:bg-card-hover",
        "video-card-shadow",
        "animate-fade-in-up",
        className,
      )}
      style={style}
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-video overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
          style={{ background: video.thumbnailGradient }}
        />

        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-copper/90 text-copper-foreground shadow-lg shadow-copper/20 transition-transform duration-300 group-hover:scale-110">
            <PlayIcon className="ml-0.5 h-5 w-5" />
          </div>
        </div>

        {/* Premium badge */}
        {video.isPremium && (
          <div className="absolute left-2 top-2">
            <Badge variant="copper" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Premium
            </Badge>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-white/90 backdrop-blur-sm">
          {video.duration}
        </div>
      </div>

      {/* ── Metadata ── */}
      <div className="flex flex-col gap-1.5 px-3 pb-3 pt-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-copper-light">
          {video.title}
        </h3>

        {/* Performer name — primary discovery axis (informational, clickable on video page) */}
        {primaryPerformer && (
          <span className="text-xs text-muted-foreground">
            by {primaryPerformer.name}
          </span>
        )}

        {/* Views — demoted, minimal */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <EyeIcon className="h-3 w-3" />
            {formatViews(video.views)}
          </span>
        </div>
      </div>
    </a>
  );
}
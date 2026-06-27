import { cn } from "@/lib/utils";
import { VideoCard } from "@/components/video/VideoCard";
import type { VideoData } from "@/types";

/* ─────────────────────────────────────────────
 * Vanta — VideoGrid Component
 * Responsive CSS Grid: 1 → 2 → 3 → 4 columns
 * ───────────────────────────────────────────── */

interface VideoGridProps {
  videos: VideoData[];
  className?: string;
}

export function VideoGrid({ videos, className }: VideoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5 lg:gap-6",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
        />
      ))}
    </div>
  );
}
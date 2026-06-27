import Link from "next/link";
import { getAllTags } from "@/server/queries";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
 * Vanta — Tags Index Page
 * Tag cloud weighted by video count.
 * ───────────────────────────────────────────── */

export default async function TagsIndexPage() {
  const allTags = await getAllTags();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Tags
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse videos and performers by tag
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {allTags.map((tag) => {
          const videoCount = tag.videoCount;

          // Size based on video count
          const sizeClass =
            videoCount >= 4
              ? "text-base px-5 py-2.5"
              : videoCount >= 2
                ? "text-sm px-4 py-2"
                : "text-xs px-3 py-1.5";

          return (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name.toLowerCase())}`}
              className={`inline-flex items-center gap-2 rounded-full bg-secondary font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground ${sizeClass}`}
            >
              {tag.name}
              <span className="text-muted-foreground/50">
                {videoCount}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
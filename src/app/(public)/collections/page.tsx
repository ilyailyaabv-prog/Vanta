import Link from "next/link";
import { getPublishedCollections } from "@/server/queries/collections";
import { getAllPerformers } from "@/server/queries";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
 * Vanta — Collections Index Page
 * Grid of all curated collections from PostgreSQL.
 * ───────────────────────────────────────────── */

export default async function CollectionsIndexPage() {
  const [collections, allPerformers] = await Promise.all([
    getPublishedCollections(),
    getAllPerformers(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Collections
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated selections of Vanta's finest performances
        </p>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => {
          const performerMap = new Map(allPerformers.map((p) => [p.slug, p]));
          const collectionPerformers = collection.performerSlugs
            .map((s) => performerMap.get(s))
            .filter(Boolean);

          return (
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
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  {collection.title}
                </h2>
                <p className="mt-1 text-sm text-white/60 line-clamp-2">
                  {collection.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-white/50">
                  <span>{collection.performerSlugs.length} performers</span>
                  <span>{collection.videoSlugs.length} videos</span>
                </div>
                {collectionPerformers.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    {collectionPerformers.map((p) => (
                      <div
                        key={p!.id}
                        className="h-6 w-6 rounded-full border border-white/20"
                        style={{ background: p!.avatarGradient }}
                        title={p!.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

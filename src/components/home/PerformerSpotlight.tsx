import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { PerformerData } from "@/types";

/* ─────────────────────────────────────────────
 * Vanta — PerformerSpotlight Component
 * Full-width hero featuring a performer instead
 * of a video. Replaces the generic FeaturedSection.
 * ───────────────────────────────────────────── */

interface PerformerSpotlightProps {
  performer: PerformerData;
}

export function PerformerSpotlight({ performer }: PerformerSpotlightProps) {

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{ background: performer.avatarGradient }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        {/* Content */}
        <div className="relative flex flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:gap-8 sm:px-10 sm:py-16">
          {/* Avatar */}
          <div
            className="h-28 w-28 shrink-0 rounded-full border-4 border-white/10 shadow-2xl sm:h-36 sm:w-36"
            style={{ background: performer.avatarGradient }}
          />

          {/* Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold uppercase tracking-widest text-copper-light">
              Performer Spotlight
            </h2>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              {performer.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
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

            {/* CTA */}
            <div className="mt-5">
              <Link href={`/performers/${performer.slug}`}>
                <Button variant="primary" size="lg">
                  View Work
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
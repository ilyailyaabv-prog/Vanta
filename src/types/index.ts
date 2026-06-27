/* ─────────────────────────────────────────────
 * Vanta — Shared Types
 * Maps Prisma models to component-consumable shapes.
 * All visual placeholders (gradients) are generated
 * deterministically from entity IDs.
 * ───────────────────────────────────────────── */

/** Video as consumed by VideoCard, VideoGrid, and detail pages */
export interface VideoData {
  id: string;
  title: string;
  slug: string;
  duration: string; // formatted "H:MM:SS" or "M:SS"
  durationSeconds: number;
  views: number;
  publishedAt: string; // relative time string like "2 days ago"
  publishedAtDate: Date;
  thumbnailGradient: string; // deterministic gradient from id
  thumbnailUrl: string | null;
  category: string; // first tag or "Uncategorized"
  isFeatured: boolean;
  isPremium: boolean;
  description: string | null;
  performerSlugs: string[];
  performers: PerformerSummary[];
  tags: string[];
}

/** Performer as consumed by performer cards, spotlight, and detail pages */
export interface PerformerData {
  id: string;
  name: string;
  slug: string;
  avatarGradient: string; // deterministic gradient from id
  avatarUrl: string | null;
  videoCount: number;
  bio: string | null;
  tags: string[];
  joinedAt: string; // formatted like "January 2024"
  relatedSlugs: string[];
}

/** Lightweight performer reference for video cards */
export interface PerformerSummary {
  id: string;
  name: string;
  slug: string;
  avatarGradient: string;
  videoCount: number;
}

/** Collection as consumed by collection cards and detail pages */
export interface CollectionData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  gradient: string; // deterministic gradient from id
  performerSlugs: string[];
  videoSlugs: string[];
  tags: string[];
}

/** Tag as consumed by tag pages */
export interface TagData {
  name: string;
  slug: string;
  videoCount: number;
  performerCount: number;
}

/** Category nav item */
export interface CategoryData {
  id: string;
  label: string;
  slug: string;
  isActive?: boolean;
}
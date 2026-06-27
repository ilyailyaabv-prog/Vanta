import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind CSS conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Simple hash from string to a number in [0, range).
 * Used for deterministic gradient generation.
 */
function hashStr(str: string, range: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % range;
}

/** Predefined gradient palettes indexed by hash */
const GRADIENT_PALETTES: [string, string, string][] = [
  ["#0d0d0d", "#1a1a2e", "#16213e"],
  ["#1a0a2e", "#2d1b4e", "#4a2d6b"],
  ["#0d1b2a", "#1b2d3d", "#2d4a5c"],
  ["#1a1a2e", "#2d3561", "#4a5d8a"],
  ["#1c1c1c", "#2c2c2c", "#3a3a3a"],
  ["#0a1628", "#1a2d4a", "#2d4a6b"],
  ["#1c0a00", "#3d1f00", "#5c3a00"],
  ["#1c1510", "#2d2018", "#4a3528"],
  ["#0d1b1b", "#1a2d2d", "#2d4a4a"],
  ["#1a0a00", "#3d1a00", "#5c2a00"],
  ["#1a0a0a", "#2d1515", "#4a2525"],
  ["#00000d", "#0a0a1a", "#1a1a2d"],
];

/** Generate a deterministic gradient string from an entity id */
export function generateGradient(id: string): string {
  const palette = GRADIENT_PALETTES[hashStr(id, GRADIENT_PALETTES.length)];
  return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 30%, ${palette[2]} 60%, ${palette[2]} 100%)`;
}

/**
 * Format view count to short form (1.2K, 3.4M, etc.)
 */
export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
}

/**
 * Format duration seconds to "H:MM:SS" or "M:SS"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Format a Date to a relative time string like "2 days ago", "1 week ago"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Format a Date to "Month YYYY" (e.g. "January 2024")
 */
export function formatJoinDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

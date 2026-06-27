import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Vanta — SectionHeader Component
 * Reusable section title with optional
 * "View All" action link.
 * ───────────────────────────────────────────── */

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
  onAction,
  className,
}: SectionHeaderProps) {
  const actionClass = cn(
    "inline-flex items-center gap-1 text-sm font-medium text-muted-foreground",
    "transition-colors duration-200 hover:text-foreground",
  );

  return (
    <div className={cn("mb-5 flex items-center justify-between sm:mb-6", className)}>
      <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link href={actionHref} className={actionClass}>
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
      {actionLabel && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className={actionClass}
        >
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

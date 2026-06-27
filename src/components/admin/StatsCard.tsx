import { cn } from "@/lib/utils";

/* ── Trend Icons ── */

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function TrendingDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

/* ── StatsCard Component ── */

interface StatsCardProps {
  title: string;
  value: string;
  trend?: "up" | "down";
  percentage?: string;
  subtitle: string;
}

export function StatsCard({ title, value, trend, percentage, subtitle }: StatsCardProps) {
  const isUp = trend === "up";

  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card p-5 transition-all duration-200",
        "hover:border-copper/30 hover:bg-card-hover hover:shadow-lg hover:shadow-copper/5",
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {trend && percentage && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              isUp
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400",
            )}
          >
            {isUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
            {percentage}
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
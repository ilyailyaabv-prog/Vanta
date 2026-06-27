import type { ActivityLogEntry } from "@/server/queries/activity";

/* ── Activity Icon ── */

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

/* ── RecentActivity Component ── */

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface RecentActivityProps {
  activities: ActivityLogEntry[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Recent Activity
      </h3>
      {activities.length > 0 ? (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity.id}>
              <div className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent">
                <ActivityIcon className="mt-0.5 shrink-0 text-copper" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {activity.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    by {activity.user?.email ?? "System"} &middot;{" "}
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No recent activity.
          </p>
        </div>
      )}
    </div>
  );
}

import { StatsCard } from "@/components/admin/StatsCard";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { getAdminStats, getTopVideos, getTopPerformers } from "@/server/queries/admin";
import { getRecentActivity } from "@/server/queries/activity";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [stats, topVideos, topPerformers, activities] = await Promise.all([
    getAdminStats(),
    getTopVideos(5),
    getTopPerformers(5),
    getRecentActivity(50),
  ]);

  // Count pending moderation items
  const { prisma } = await import("@/server/db/prisma");
  const pendingModeration = await prisma.report.count({ where: { status: "pending" } });

  // Storage usage
  const storageAgg = await prisma.mediaAsset.aggregate({
    _sum: { fileSize: true },
  });
  const totalStorageBytes = storageAgg._sum.fileSize ?? BigInt(0);
  const totalStorageGB = Number(totalStorageBytes) / (1024 * 1024 * 1024);

  // Published vs drafts
  const publishedCount = await prisma.video.count({ where: { status: "published" } });
  const draftCount = await prisma.video.count({ where: { status: "draft" } });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your platform activity and performance metrics.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          subtitle={`${stats.usersRegisteredToday} registered today`}
        />
        <StatsCard
          title="Total Videos"
          value={stats.totalVideos.toLocaleString()}
          subtitle={`${stats.videosPublishedToday} published today`}
        />
        <StatsCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          subtitle="Across all videos"
        />
        <StatsCard
          title="Performers"
          value={stats.totalPerformers.toLocaleString()}
          subtitle={`${stats.totalTags} tags in ${stats.totalTagGroups} groups`}
        />
      </div>

      {/* Additional stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Published Videos"
          value={publishedCount.toLocaleString()}
          subtitle={`${draftCount} drafts`}
        />
        <StatsCard
          title="Storage Used"
          value={`${totalStorageGB.toFixed(2)} GB`}
          subtitle="Media assets"
        />
        <StatsCard
          title="Pending Moderation"
          value={pendingModeration.toLocaleString()}
          subtitle="Reports awaiting review"
        />
        <StatsCard
          title="Activity Events"
          value={activities.length.toLocaleString()}
          subtitle="Recent log entries"
        />
      </div>

      {/* Top videos and performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Top Videos</h3>
          {topVideos.length > 0 ? (
            <ul className="space-y-2">
              {topVideos.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/admin/videos/${v.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                  >
                    <span className="truncate text-sm text-foreground">{v.title}</span>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {v.viewCount.toLocaleString()} views
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">No videos yet.</p>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Top Performers</h3>
          {topPerformers.length > 0 ? (
            <ul className="space-y-2">
              {topPerformers.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/performers/${p.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                  >
                    <span className="truncate text-sm text-foreground">{p.name}</span>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {p.videoCount} videos
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">No performers yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={activities} />
    </div>
  );
}
import { prisma } from "@/server/db/prisma";

export interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalPerformers: number;
  totalTags: number;
  totalTagGroups: number;
  videosPublishedToday: number;
  usersRegisteredToday: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: Date;
}

export interface TopVideoItem {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  status: string;
  publishedAt: Date | null;
}

export interface TopPerformerItem {
  id: string;
  name: string;
  slug: string;
  videoCount: number;
  totalViews: bigint;
}

/**
 * Get aggregate admin dashboard statistics from the database.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [userCount, videoCount, viewAgg, performerCount, tagCount, tagGroupCount, videosToday, usersToday] =
    await Promise.all([
      prisma.user.count(),
      prisma.video.count({ where: { status: "published" } }),
      prisma.video.aggregate({ _sum: { viewCount: true } }),
      prisma.model.count(),
      prisma.tag.count(),
      prisma.tagGroup.count(),
      prisma.video.count({
        where: {
          publishedAt: { gte: today },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),
    ]);

  return {
    totalUsers: userCount,
    totalVideos: videoCount,
    totalViews: viewAgg._sum.viewCount ?? 0,
    totalPerformers: performerCount,
    totalTags: tagCount,
    totalTagGroups: tagGroupCount,
    videosPublishedToday: videosToday,
    usersRegisteredToday: usersToday,
  };
}

/**
 * Get recent activity for the admin dashboard.
 */
export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  // Combine recent video uploads and moderator actions
  const recentVideos = await prisma.video.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      uploader: {
        include: { profile: { select: { username: true } } },
      },
    },
  });

  return recentVideos.map((v) => ({
    id: v.id,
    type: "video_published",
    description: `"${v.title}" was published`,
    user: v.uploader?.profile?.username ?? v.uploader?.email ?? "Unknown",
    timestamp: v.publishedAt ?? v.createdAt,
  }));
}

/**
 * Get top performing videos by view count.
 */
export async function getTopVideos(limit = 5): Promise<TopVideoItem[]> {
  const videos = await prisma.video.findMany({
    where: { status: "published" },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      status: true,
      publishedAt: true,
    },
  });

  return videos;
}

/**
 * Get top performers by total views.
 */
export async function getTopPerformers(limit = 5): Promise<TopPerformerItem[]> {
  const performers = await prisma.model.findMany({
    orderBy: { totalViews: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      videoCount: true,
      totalViews: true,
    },
  });

  return performers;
}

/**
 * Get chart data points for views over recent days.
 */
export async function getViewsChartData(days = 30): Promise<{ date: string; views: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Aggregate views by date from video_view table
  const viewData = await prisma.videoView.groupBy({
    by: ["viewedAt"],
    where: {
      viewedAt: { gte: since },
    },
    _count: { id: true },
  });

  // Build a map of date → count
  const countByDate = new Map<string, number>();
  for (const entry of viewData) {
    const dateKey = entry.viewedAt.toISOString().slice(0, 10);
    countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + entry._count.id);
  }

  // Fill in all dates in range
  const result: { date: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(since);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().slice(0, 10);
    result.push({
      date: dateKey,
      views: countByDate.get(dateKey) ?? 0,
    });
  }

  return result;
}
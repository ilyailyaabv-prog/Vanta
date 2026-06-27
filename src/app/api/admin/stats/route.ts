import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/auth-helpers";
import { getAdminStats, getTopVideos, getTopPerformers, getRecentActivity } from "@/server/queries/admin";

/**
 * GET /api/admin/stats
 * Returns all dashboard statistics.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [stats, topVideos, topPerformers, recentActivity] = await Promise.all([
    getAdminStats(),
    getTopVideos(5),
    getTopPerformers(5),
    getRecentActivity(10),
  ]);

  return NextResponse.json({
    stats,
    topVideos,
    topPerformers,
    recentActivity,
  });
}
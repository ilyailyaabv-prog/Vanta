import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/auth-helpers";
import { getRecentActivity } from "@/server/queries/activity";

/**
 * GET /api/admin/activity
 * Get recent activity log entries.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const activities = await getRecentActivity(limit);
  return NextResponse.json({ activities });
}
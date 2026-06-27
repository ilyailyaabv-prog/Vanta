import { prisma } from "@/server/db/prisma";
import type { ActivityEntityType } from "@prisma/client";

export interface ActivityLogEntry {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  description: string;
  userId: string | null;
  user?: { email: string } | null;
  createdAt: Date;
}

/**
 * Record an activity in the activity log.
 */
export async function recordActivity(params: {
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  description: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      description: params.description,
      userId: params.userId ?? null,
      metadata: (params.metadata ?? undefined) as any,
    },
  });
}

/**
 * Get recent activity log entries.
 */
export async function getRecentActivity(limit = 50): Promise<ActivityLogEntry[]> {
  const entries = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true } },
    },
  });

  return entries.map((e) => ({
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    action: e.action,
    description: e.description,
    userId: e.userId,
    user: e.user ? { email: e.user.email } : null,
    createdAt: e.createdAt,
  }));
}
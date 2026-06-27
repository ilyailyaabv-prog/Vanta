import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageTags } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";

/**
 * GET /api/admin/tag-groups
 * List all tag groups.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const groups = await prisma.tagGroup.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { tags: true } },
    },
  });

  return NextResponse.json({
    tagGroups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      sortOrder: g.sortOrder,
      isActive: g.isActive,
      tagCount: g._count.tags,
    })),
  });
}
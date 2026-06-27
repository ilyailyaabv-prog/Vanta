import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageTags } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { recordActivity } from "@/server/queries/activity";

/**
 * GET /api/admin/tags
 * List all tags with search, pagination, and filtering.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tagGroupId = searchParams.get("tagGroupId") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { slug: { contains: search, mode: "insensitive" as const } },
    ];
  }

  if (tagGroupId) {
    where.tagGroupId = tagGroupId;
  }

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      include: {
        tagGroup: { select: { id: true, name: true } },
        _count: { select: { videoTags: true } },
      },
    }),
    prisma.tag.count({ where }),
  ]);

  return NextResponse.json({
    tags: tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      tagGroupId: t.tagGroupId,
      tagGroup: t.tagGroup,
      isActive: t.isActive,
      videoCount: t._count.videoTags,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/admin/tags
 * Create a new tag.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, slug, tagGroupId, description } = body;

  if (!name || !slug || !tagGroupId) {
    return NextResponse.json(
      { error: "Name, slug, and tagGroupId are required" },
      { status: 400 },
    );
  }

  // Check slug uniqueness
  const slugExists = await prisma.tag.findUnique({ where: { slug } });
  if (slugExists) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  // Check name+group uniqueness
  const sameName = await prisma.tag.findFirst({
    where: {
      tagGroupId,
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (sameName) {
    return NextResponse.json(
      { error: "Tag name already exists in this group" },
      { status: 409 },
    );
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      slug,
      tagGroupId,
      description: description ?? null,
    },
  });

  await recordActivity({
    entityType: "tag",
    entityId: tag.id,
    action: "tag created",
    description: `Tag "${tag.name}" was created`,
    userId: session.user.id,
  });

  return NextResponse.json({ tag }, { status: 201 });
}
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageTags } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { recordActivity } from "@/server/queries/activity";

/**
 * GET /api/admin/collections
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { slug: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip,
      take: limit,
      include: {
        _count: { select: { collectionVideos: true, collectionModels: true } },
      },
    }),
    prisma.collection.count({ where }),
  ]);

  return NextResponse.json({
    collections: collections.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      sortOrder: c.sortOrder,
      isFeatured: c.isFeatured,
      isPublished: c.isPublished,
      videoCount: c._count.collectionVideos,
      performerCount: c._count.collectionModels,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/admin/collections
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { title, slug, description, coverImageUrl, sortOrder, isFeatured, isPublished } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }

  const slugExists = await prisma.collection.findUnique({ where: { slug } });
  if (slugExists) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const collection = await prisma.collection.create({
    data: {
      title,
      slug,
      description: description ?? null,
      coverImageUrl: coverImageUrl ?? null,
      sortOrder: sortOrder ?? 0,
      isFeatured: isFeatured ?? false,
      isPublished: isPublished ?? false,
    },
  });

  await recordActivity({
    entityType: "collection",
    entityId: collection.id,
    action: "collection created",
    description: `Collection "${collection.title}" was created`,
    userId: session.user.id,
  });

  return NextResponse.json({ collection }, { status: 201 });
}
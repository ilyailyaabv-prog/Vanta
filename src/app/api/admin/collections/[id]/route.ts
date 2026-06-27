import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageTags } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { recordActivity } from "@/server/queries/activity";

/**
 * GET /api/admin/collections/[id]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      collectionVideos: {
        orderBy: { sortOrder: "asc" },
        include: {
          video: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
        },
      },
      collectionModels: {
        orderBy: { sortOrder: "asc" },
        include: {
          model: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: collection.id,
    title: collection.title,
    slug: collection.slug,
    description: collection.description,
    coverImageUrl: collection.coverImageUrl,
    sortOrder: collection.sortOrder,
    isFeatured: collection.isFeatured,
    isPublished: collection.isPublished,
    videoCount: collection.videoCount,
    performerCount: collection.performerCount,
    videos: collection.collectionVideos.map((cv) => ({
      id: cv.video.id,
      title: cv.video.title,
      slug: cv.video.slug,
      thumbnailUrl: cv.video.thumbnailUrl,
      sortOrder: cv.sortOrder,
    })),
    models: collection.collectionModels.map((cm) => ({
      id: cm.model.id,
      name: cm.model.name,
      slug: cm.model.slug,
      avatarUrl: cm.model.avatarUrl,
    })),
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  });
}

/**
 * PATCH /api/admin/collections/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  // Handle slug uniqueness
  if (body.slug && body.slug !== existing.slug) {
    const slugExists = await prisma.collection.findUnique({ where: { slug: body.slug } });
    if (slugExists) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  // Handle video attachments
  if (body.videoIds) {
    // Remove existing videos
    await prisma.collectionVideo.deleteMany({ where: { collectionId: id } });
    // Add new videos with sort order
    for (let i = 0; i < body.videoIds.length; i++) {
      await prisma.collectionVideo.create({
        data: {
          collectionId: id,
          videoId: body.videoIds[i],
          sortOrder: i,
        },
      });
    }
  }

  // Handle model/performer attachments
  if (body.modelIds) {
    await prisma.collectionModel.deleteMany({ where: { collectionId: id } });
    for (let i = 0; i < body.modelIds.length; i++) {
      await prisma.collectionModel.create({
        data: {
          collectionId: id,
          modelId: body.modelIds[i],
          sortOrder: i,
        },
      });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.coverImageUrl !== undefined) updateData.coverImageUrl = body.coverImageUrl;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
  if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;

  // Update video/performer counts
  if (body.videoIds) {
    updateData.videoCount = body.videoIds.length;
  }
  if (body.modelIds) {
    updateData.performerCount = body.modelIds.length;
  }

  const updated = await prisma.collection.update({
    where: { id },
    data: updateData,
  });

  await recordActivity({
    entityType: "collection",
    entityId: updated.id,
    action: "collection edited",
    description: `Collection "${updated.title}" was updated`,
    userId: session.user.id,
  });

  return NextResponse.json({ collection: updated });
}

/**
 * DELETE /api/admin/collections/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  await prisma.collection.delete({ where: { id } });

  await recordActivity({
    entityType: "collection",
    entityId: collection.id,
    action: "collection deleted",
    description: `Collection "${collection.title}" was deleted`,
    userId: session.user.id,
  });

  return NextResponse.json({ success: true });
}
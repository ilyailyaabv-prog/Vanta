import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageVideos } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const updateVideoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "processing", "published", "archived", "rejected"]).optional(),
  accessLevel: z.enum(["public", "unlisted", "private", "premium"]).optional(),
  isFeatured: z.boolean().optional(),
  performerIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/admin/videos/[id]
 * Get a single video by ID with its relations.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      _count: { select: { videoModels: true, videoTags: true } },
      videoModels: {
        include: {
          model: { select: { id: true, name: true, slug: true } },
        },
      },
      videoTags: {
        include: {
          tag: { select: { id: true, name: true, slug: true } },
        },
      },
      uploader: {
        include: { profile: { select: { username: true } } },
      },
    },
  });

  if (!video) {
    return NextResponse.json(
      { error: "Video not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ video });
}

/**
 * PUT /api/admin/videos/[id]
 * Update a video.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateVideoSchema.parse(body);

    // Check if video exists
    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Video not found." },
        { status: 404 },
      );
    }

    // Check slug uniqueness if changing
    if (parsed.slug && parsed.slug !== existing.slug) {
      const slugExists = await prisma.video.findUnique({
        where: { slug: parsed.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A video with this slug already exists." },
          { status: 409 },
        );
      }
    }

    // Build update data - exclude relations handled separately
    const { performerIds, tagIds, ...videoFields } = parsed;

    // Update performer associations if provided
    if (performerIds !== undefined) {
      // Verify performers exist
      if (performerIds.length > 0) {
        const performers = await prisma.model.findMany({
          where: { id: { in: performerIds } },
          select: { id: true },
        });
        if (performers.length !== performerIds.length) {
          return NextResponse.json(
            { error: "One or more performers not found." },
            { status: 422 },
          );
        }
      }

      // Remove existing and add new associations
      await prisma.videoModel.deleteMany({ where: { videoId: id } });
      if (performerIds.length > 0) {
        await prisma.videoModel.createMany({
          data: performerIds.map((modelId) => ({
            videoId: id,
            modelId,
          })),
        });
      }
    }

    // Update tag associations if provided
    if (tagIds !== undefined) {
      if (tagIds.length > 0) {
        const tags = await prisma.tag.findMany({
          where: { id: { in: tagIds } },
          select: { id: true },
        });
        if (tags.length !== tagIds.length) {
          return NextResponse.json(
            { error: "One or more tags not found." },
            { status: 422 },
          );
        }
      }

      await prisma.videoTag.deleteMany({ where: { videoId: id } });
      if (tagIds.length > 0) {
        await prisma.videoTag.createMany({
          data: tagIds.map((tagId) => ({
            videoId: id,
            tagId,
          })),
        });
      }
    }

    // Handle publish/unpublish logic
    const data: any = { ...videoFields };
    if (data.status === "published" && existing.status !== "published") {
      data.publishedAt = new Date();
    } else if (data.status && data.status !== "published") {
      data.publishedAt = null;
    }

    const video = await prisma.video.update({
      where: { id },
      data,
      include: {
        _count: { select: { videoModels: true, videoTags: true } },
        videoModels: {
          include: {
            model: { select: { id: true, name: true, slug: true } },
          },
        },
        videoTags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({ video });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 422 },
      );
    }
    console.error("Failed to update video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/videos/[id]
 * Delete a video.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Video not found." },
      { status: 404 },
    );
  }

  // Cascade deletes handled by Prisma schema (onDelete: Cascade on related tables)
  await prisma.video.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/admin/videos/[id]/publish
 * Toggle publish/unpublish status.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Video not found." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "publish") {
      const video = await prisma.video.update({
        where: { id },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      });
      return NextResponse.json({ video });
    } else if (action === "unpublish") {
      const video = await prisma.video.update({
        where: { id },
        data: {
          status: "draft",
          publishedAt: null,
        },
      });
      return NextResponse.json({ video });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'publish' or 'unpublish'." },
      { status: 422 },
    );
  } catch (error) {
    console.error("Failed to update video status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
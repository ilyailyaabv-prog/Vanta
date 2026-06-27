import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageTags } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { recordActivity } from "@/server/queries/activity";

/**
 * GET /api/admin/tags/[id]
 * Get a single tag by ID.
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
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      tagGroup: { select: { id: true, name: true } },
      _count: { select: { videoTags: true } },
    },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    tagGroupId: tag.tagGroupId,
    tagGroup: tag.tagGroup,
    isActive: tag.isActive,
    videoCount: tag._count.videoTags,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  });
}

/**
 * PATCH /api/admin/tags/[id]
 * Update a tag.
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
  const { name, slug, tagGroupId, description, isActive } = body;

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // Check slug uniqueness if changing
  if (slug && slug !== existing.slug) {
    const slugExists = await prisma.tag.findUnique({ where: { slug } });
    if (slugExists) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  // Check name+group uniqueness if changing
  if ((name || tagGroupId) && name && tagGroupId) {
    const sameName = await prisma.tag.findFirst({
      where: {
        tagGroupId: tagGroupId ?? existing.tagGroupId,
        name: { equals: name ?? existing.name, mode: "insensitive" },
        id: { not: id },
      },
    });
    if (sameName) {
      return NextResponse.json(
        { error: "Tag name already exists in this group" },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.tag.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(tagGroupId !== undefined && { tagGroupId }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await recordActivity({
    entityType: "tag",
    entityId: updated.id,
    action: "tag edited",
    description: `Tag "${updated.name}" was updated`,
    userId: session.user.id,
  });

  return NextResponse.json({ tag: updated });
}

/**
 * DELETE /api/admin/tags/[id]
 * Delete a tag.
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

  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id } });

  await recordActivity({
    entityType: "tag",
    entityId: tag.id,
    action: "tag deleted",
    description: `Tag "${tag.name}" was deleted`,
    userId: session.user.id,
  });

  return NextResponse.json({ success: true });
}
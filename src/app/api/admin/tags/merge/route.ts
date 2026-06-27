import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageTags } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { recordActivity } from "@/server/queries/activity";

/**
 * POST /api/admin/tags/merge
 * Merge two tags: sourceTagId into targetTagId.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageTags(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { sourceTagId, targetTagId } = body;

  if (!sourceTagId || !targetTagId) {
    return NextResponse.json(
      { error: "sourceTagId and targetTagId are required" },
      { status: 400 },
    );
  }

  if (sourceTagId === targetTagId) {
    return NextResponse.json(
      { error: "Cannot merge a tag into itself" },
      { status: 400 },
    );
  }

  const [sourceTag, targetTag] = await Promise.all([
    prisma.tag.findUnique({ where: { id: sourceTagId } }),
    prisma.tag.findUnique({ where: { id: targetTagId } }),
  ]);

  if (!sourceTag || !targetTag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // Move all video-tag associations from source to target (avoid duplicates)
  const sourceVideoTags = await prisma.videoTag.findMany({
    where: { tagId: sourceTagId },
    select: { videoId: true },
  });

  for (const vt of sourceVideoTags) {
    const existing = await prisma.videoTag.findUnique({
      where: {
        videoId_tagId: {
          videoId: vt.videoId,
          tagId: targetTagId,
        },
      },
    });
    if (!existing) {
      await prisma.videoTag.create({
        data: {
          videoId: vt.videoId,
          tagId: targetTagId,
        },
      });
    }
  }

  // Update video count for target tag
  const newVideoCount = await prisma.videoTag.count({
    where: { tagId: targetTagId },
  });
  await prisma.tag.update({
    where: { id: targetTagId },
    data: { videoCount: newVideoCount },
  });

  // Delete the source tag
  const sourceName = sourceTag.name;
  await prisma.tag.delete({ where: { id: sourceTagId } });

  await recordActivity({
    entityType: "tag",
    entityId: targetTagId,
    action: "tag edited",
    description: `Tag "${sourceName}" was merged into "${targetTag.name}"`,
    userId: session.user.id,
  });

  return NextResponse.json({
    success: true,
    message: `"${sourceName}" merged into "${targetTag.name}"`,
    targetTag,
  });
}
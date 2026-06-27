import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageVideos } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { getStorageAdapter } from "@/server/storage";

/**
 * DELETE /api/admin/media/[id]
 *
 * Delete a media asset (thumbnail) by its ID.
 * Removes the file from Cloudflare R2, deletes the MediaAsset record,
 * and clears the video's thumbnailUrl if this asset was the current thumbnail.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Fetch the media asset
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { id },
      include: { video: { select: { id: true, thumbnailUrl: true } } },
    });

    if (!mediaAsset) {
      return NextResponse.json(
        { error: "Media asset not found." },
        { status: 404 },
      );
    }

    // Delete the file from R2 storage (if configured)
    const storage = getStorageAdapter();
    if (storage) {
      try {
        await storage.deleteFile(mediaAsset.storageKey);

        // If this asset's URL matches the video's current thumbnailUrl, clear it
        const publicUrl = storage.getPublicUrl(mediaAsset.storageKey);
        if (mediaAsset.video.thumbnailUrl === publicUrl) {
          await prisma.video.update({
            where: { id: mediaAsset.videoId },
            data: { thumbnailUrl: null },
          });
        }
      } catch (deleteError) {
        console.error("Failed to delete file from storage:", deleteError);
        // Continue anyway, remove the DB record
      }
    }

    // Delete the MediaAsset record
    await prisma.mediaAsset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete media asset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
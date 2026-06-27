import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageVideos } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { getStorageAdapter } from "@/server/storage";

/**
 * GET /api/admin/videos/[id]/media
 * List media assets for a video, including derived public URLs.
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
    select: { id: true },
  });

  if (!video) {
    return NextResponse.json(
      { error: "Video not found." },
      { status: 404 },
    );
  }

  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { videoId: id },
    orderBy: { createdAt: "desc" },
  });

  // Derive public URLs for each asset
  const storage = getStorageAdapter();
  const assetsWithUrls = mediaAssets.map((asset) => ({
    ...asset,
    publicUrl: storage ? storage.getPublicUrl(asset.storageKey) : null,
  }));

  return NextResponse.json({ mediaAssets: assetsWithUrls });
}

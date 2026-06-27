import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";

/**
 * GET /api/admin/media
 * List media assets with filtering and search.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const assetType = searchParams.get("assetType") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.fileName = { contains: search, mode: "insensitive" as const };
  }

  if (assetType) {
    where.assetType = assetType;
  }

  const [media, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        video: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.mediaAsset.count({ where }),
  ]);

  return NextResponse.json({
    media: media.map((m) => ({
      id: m.id,
      assetType: m.assetType,
      fileName: m.fileName,
      mimeType: m.mimeType,
      fileSize: m.fileSize,
      storageKey: m.storageKey,
      width: m.width,
      height: m.height,
      createdAt: m.createdAt,
      video: m.video,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
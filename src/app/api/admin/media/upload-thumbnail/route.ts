import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageVideos } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { getStorageAdapter } from "@/server/storage";
import { randomUUID } from "crypto";

// Allowed MIME types for thumbnails
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/admin/media/upload-thumbnail
 *
 * Upload a thumbnail image for a video.
 * Accepts multipart/form-data with:
 *   - file: the image file
 *   - videoId: the UUID of the video to associate the thumbnail with
 *
 * Validates file type (jpg, jpeg, png, webp) and size (max 5 MB).
 * Uploads to Cloudflare R2, creates a MediaAsset record, and updates
 * the video's thumbnailUrl.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const videoId = formData.get("videoId") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 422 },
      );
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "No videoId provided." },
        { status: 422 },
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed types: jpg, jpeg, png, webp.",
        },
        { status: 422 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 5 MB.",
        },
        { status: 422 },
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, slug: true, thumbnailUrl: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found." },
        { status: 404 },
      );
    }

    // Generate a unique storage key
    const ext = ALLOWED_EXTENSIONS[file.type] || ".jpg";
    const storageKey = `thumbnails/${videoId}/${randomUUID()}${ext}`;

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 (if configured)
    const storage = getStorageAdapter();
    if (!storage) {
      return NextResponse.json(
        { error: "Storage is not configured. Please set R2 environment variables." },
        { status: 503 },
      );
    }
    const uploadResult = await storage.uploadFile(storageKey, buffer, {
      contentType: file.type,
      isPublic: true,
    });

    // Create MediaAsset record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        videoId,
        assetType: "THUMBNAIL",
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageKey,
        storageProvider: "r2",
      },
    });

    // Update video's thumbnailUrl
    await prisma.video.update({
      where: { id: videoId },
      data: { thumbnailUrl: uploadResult.publicUrl },
    });

    return NextResponse.json(
      {
        mediaAsset,
        url: uploadResult.publicUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload thumbnail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
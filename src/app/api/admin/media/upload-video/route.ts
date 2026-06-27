import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageVideos } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { getStorageAdapter } from "@/server/storage";
import { env } from "@/env";
import { randomUUID } from "crypto";

// Allowed MIME types for video uploads
const ALLOWED_MIME_TYPES = ["video/mp4"];

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "video/mp4": ".mp4",
};

/**
 * POST /api/admin/media/upload-video
 *
 * Upload an MP4 video file for a video.
 * Accepts multipart/form-data with:
 *   - file: the MP4 file
 *   - videoId: the UUID of the video to associate the source with
 *
 * Validates file type (mp4 only) and size (configurable via MAX_VIDEO_UPLOAD_SIZE env).
 * Uploads to Cloudflare R2, creates a MediaAsset record with assetType=VIDEO_SOURCE.
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

    // Validate file type — MP4 only
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only MP4 video files are allowed.",
        },
        { status: 422 },
      );
    }

    // Validate file size
    const maxSizeBytes = env.MAX_VIDEO_UPLOAD_SIZE * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${env.MAX_VIDEO_UPLOAD_SIZE} MB.`,
        },
        { status: 422 },
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, slug: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found." },
        { status: 404 },
      );
    }

    // Generate a unique storage key
    const ext = ALLOWED_EXTENSIONS[file.type] || ".mp4";
    const storageKey = `videos/${videoId}/source_${randomUUID()}${ext}`;

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

    // Create MediaAsset record with VIDEO_SOURCE type
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        videoId,
        assetType: "VIDEO_SOURCE",
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageKey,
        storageProvider: "r2",
      },
    });

    return NextResponse.json(
      {
        mediaAsset: {
          id: mediaAsset.id,
          assetType: mediaAsset.assetType,
          fileName: mediaAsset.fileName,
          mimeType: mediaAsset.mimeType,
          fileSize: mediaAsset.fileSize,
          storageKey: mediaAsset.storageKey,
          publicUrl: uploadResult.publicUrl,
          createdAt: mediaAsset.createdAt,
        },
        url: uploadResult.publicUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
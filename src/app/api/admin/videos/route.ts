import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageVideos } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const createVideoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  accessLevel: z.enum(["public", "unlisted", "private", "premium"]).optional().default("public"),
  isFeatured: z.boolean().optional().default(false),
  performerIds: z.array(z.string().uuid()).optional().default([]),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * GET /api/admin/videos
 * List all videos with optional search, status filter, performer filter, and pagination.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const performerId = searchParams.get("performerId") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { slug: { contains: search, mode: "insensitive" as const } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (performerId) {
    where.videoModels = {
      some: { modelId: performerId },
    };
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        _count: { select: { videoModels: true, videoTags: true } },
        videoModels: {
          include: {
            model: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      slug: v.slug,
      description: v.description,
      status: v.status,
      accessLevel: v.accessLevel,
      isFeatured: v.isFeatured,
      viewCount: v.viewCount,
      thumbnailUrl: v.thumbnailUrl,
      durationSeconds: v.durationSeconds,
      performerCount: v._count.videoModels,
      tagCount: v._count.videoTags,
      performers: v.videoModels.map((vm) => vm.model),
      publishedAt: v.publishedAt,
      createdAt: v.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/admin/videos
 * Create a new video.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageVideos(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createVideoSchema.parse(body);

    const slug = parsed.slug || slugify(parsed.title);

    // Check slug uniqueness
    const existing = await prisma.video.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A video with this slug already exists." },
        { status: 409 },
      );
    }

    // Verify performers exist if provided
    if (parsed.performerIds.length > 0) {
      const performers = await prisma.model.findMany({
        where: { id: { in: parsed.performerIds } },
        select: { id: true },
      });
      if (performers.length !== parsed.performerIds.length) {
        return NextResponse.json(
          { error: "One or more performers not found." },
          { status: 422 },
        );
      }
    }

    // Verify tags exist if provided
    if (parsed.tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: parsed.tagIds } },
        select: { id: true },
      });
      if (tags.length !== parsed.tagIds.length) {
        return NextResponse.json(
          { error: "One or more tags not found." },
          { status: 422 },
        );
      }
    }

    // Create video with relations
    const video = await prisma.video.create({
      data: {
        title: parsed.title,
        slug,
        description: parsed.description ?? null,
        status: parsed.status,
        accessLevel: parsed.accessLevel,
        isFeatured: parsed.isFeatured,
        // Required fields with sensible defaults (no file upload in this phase)
        durationSeconds: 0,
        storageKey: `manual/${slug}`,
        fileSizeBytes: 0,
        mimeType: "video/mp4",
        publishedAt: parsed.status === "published" ? new Date() : null,
        videoModels: {
          create: parsed.performerIds.map((modelId) => ({
            modelId,
          })),
        },
        videoTags: {
          create: parsed.tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
      include: {
        _count: { select: { videoModels: true, videoTags: true } },
        videoModels: {
          include: {
            model: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 422 },
      );
    }
    console.error("Failed to create video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
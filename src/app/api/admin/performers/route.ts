import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManagePerformers } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const createPerformerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1).max(250).optional(),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  gender: z.string().max(10).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  countryCode: z.string().length(2).nullable().optional(),
  heightCm: z.number().int().positive().nullable().optional(),
  measurements: z.string().max(50).nullable().optional(),
  ethnicity: z.string().max(50).nullable().optional(),
  hairColor: z.string().max(30).nullable().optional(),
  eyeColor: z.string().max(30).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  isVerified: z.boolean().optional().default(false),
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
 * GET /api/admin/performers
 * List all performers with optional search.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canManagePerformers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [performers, total] = await Promise.all([
    prisma.model.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        _count: { select: { videoModels: true } },
      },
    }),
    prisma.model.count({ where }),
  ]);

  return NextResponse.json({
    performers: performers.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      gender: p.gender,
      ethnicity: p.ethnicity,
      isActive: p.isActive,
      isVerified: p.isVerified,
      videoCount: p._count.videoModels,
      createdAt: p.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/admin/performers
 * Create a new performer.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canManagePerformers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createPerformerSchema.parse(body);

    const slug = parsed.slug || slugify(parsed.name);

    // Check slug uniqueness
    const existing = await prisma.model.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A performer with this slug already exists." },
        { status: 409 },
      );
    }

    const performer = await prisma.model.create({
      data: {
        name: parsed.name,
        slug,
        bio: parsed.bio ?? null,
        avatarUrl: parsed.avatarUrl ?? null,
        bannerUrl: parsed.bannerUrl ?? null,
        gender: parsed.gender ?? null,
        birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
        countryCode: parsed.countryCode ?? null,
        heightCm: parsed.heightCm ?? null,
        measurements: parsed.measurements ?? null,
        ethnicity: parsed.ethnicity ?? null,
        hairColor: parsed.hairColor ?? null,
        eyeColor: parsed.eyeColor ?? null,
        isActive: parsed.isActive,
        isVerified: parsed.isVerified,
      },
    });

    return NextResponse.json({ performer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 422 },
      );
    }
    console.error("Failed to create performer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
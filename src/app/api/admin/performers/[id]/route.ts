import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManagePerformers } from "@/lib/auth-helpers";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const updatePerformerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
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
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

/**
 * GET /api/admin/performers/[id]
 * Get a single performer by ID.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManagePerformers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const performer = await prisma.model.findUnique({
    where: { id },
    include: {
      _count: { select: { videoModels: true } },
      aliases: { select: { alias: true } },
    },
  });

  if (!performer) {
    return NextResponse.json(
      { error: "Performer not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ performer });
}

/**
 * PUT /api/admin/performers/[id]
 * Update a performer.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManagePerformers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updatePerformerSchema.parse(body);

    // Check if performer exists
    const existing = await prisma.model.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Performer not found." },
        { status: 404 },
      );
    }

    // Check slug uniqueness if changing
    if (parsed.slug && parsed.slug !== existing.slug) {
      const slugExists = await prisma.model.findUnique({
        where: { slug: parsed.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A performer with this slug already exists." },
          { status: 409 },
        );
      }
    }

    const performer = await prisma.model.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.slug !== undefined && { slug: parsed.slug }),
        ...(parsed.bio !== undefined && { bio: parsed.bio }),
        ...(parsed.avatarUrl !== undefined && { avatarUrl: parsed.avatarUrl }),
        ...(parsed.bannerUrl !== undefined && { bannerUrl: parsed.bannerUrl }),
        ...(parsed.gender !== undefined && { gender: parsed.gender }),
        ...(parsed.birthDate !== undefined && {
          birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
        }),
        ...(parsed.countryCode !== undefined && {
          countryCode: parsed.countryCode,
        }),
        ...(parsed.heightCm !== undefined && { heightCm: parsed.heightCm }),
        ...(parsed.measurements !== undefined && {
          measurements: parsed.measurements,
        }),
        ...(parsed.ethnicity !== undefined && { ethnicity: parsed.ethnicity }),
        ...(parsed.hairColor !== undefined && { hairColor: parsed.hairColor }),
        ...(parsed.eyeColor !== undefined && { eyeColor: parsed.eyeColor }),
        ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
        ...(parsed.isVerified !== undefined && {
          isVerified: parsed.isVerified,
        }),
      },
    });

    return NextResponse.json({ performer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 422 },
      );
    }
    console.error("Failed to update performer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/performers/[id]
 * Delete a performer.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManagePerformers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.model.findUnique({
    where: { id },
    include: { _count: { select: { videoModels: true } } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Performer not found." },
      { status: 404 },
    );
  }

  if (existing._count.videoModels > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete performer with ${existing._count.videoModels} associated video(s). Remove associations first.`,
      },
      { status: 409 },
    );
  }

  await prisma.modelAlias.deleteMany({ where: { modelId: id } });
  await prisma.model.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
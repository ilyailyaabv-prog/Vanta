import { prisma } from "@/server/db/prisma";
import { generateGradient } from "@/lib/utils";
import type { CollectionData } from "@/types";

/**
 * Get published collections for public pages.
 */
export async function getPublishedCollections(): Promise<CollectionData[]> {
  const collections = await prisma.collection.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: {
      collectionVideos: {
        select: { video: { select: { slug: true } } },
      },
      collectionModels: {
        select: { model: { select: { slug: true } } },
      },
    },
  });

  return collections.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    gradient: generateGradient(c.id),
    performerSlugs: c.collectionModels.map((cm) => cm.model.slug),
    videoSlugs: c.collectionVideos.map((cv) => cv.video.slug),
    tags: [],
  }));
}

/**
 * Get a single published collection by slug.
 */
export async function getCollectionBySlug(slug: string): Promise<CollectionData | null> {
  const collection = await prisma.collection.findUnique({
    where: { slug, isPublished: true },
    include: {
      collectionVideos: {
        orderBy: { sortOrder: "asc" },
        select: { video: { select: { slug: true } } },
      },
      collectionModels: {
        orderBy: { sortOrder: "asc" },
        select: { model: { select: { slug: true } } },
      },
    },
  });

  if (!collection) return null;

  return {
    id: collection.id,
    title: collection.title,
    slug: collection.slug,
    description: collection.description,
    gradient: generateGradient(collection.id),
    performerSlugs: collection.collectionModels.map((cm) => cm.model.slug),
    videoSlugs: collection.collectionVideos.map((cv) => cv.video.slug),
    tags: [],
  };
}
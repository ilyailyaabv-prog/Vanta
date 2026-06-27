/* ─────────────────────────────────────────────
 * Vanta — Database Queries
 * All database access for public pages.
 * Each function returns the shared types from
 * @/types so pages are decoupled from Prisma.
 * ───────────────────────────────────────────── */

import { prisma } from "@/server/db/prisma";
import type {
  VideoData,
  PerformerData,
  PerformerSummary,
  CollectionData,
  TagData,
  CategoryData,
} from "@/types";
import {
  generateGradient,
  formatViews,
  formatDuration,
  formatRelativeDate,
  formatJoinDate,
} from "@/lib/utils";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Is a video "premium"? (accessLevel === premium) */
function isPremium(accessLevel: string): boolean {
  return accessLevel === "premium";
}

/** Get the category string from the first tag */
function getCategoryFromTags(tags: { tag: { name: string } }[]): string {
  return tags.length > 0 ? tags[0].tag.name : "Uncategorized";
}

/** Build a PerformerSummary from a Prisma model (used in video results) */
function toPerformerSummary(model: {
  id: string;
  name: string;
  slug: string;
  videoCount: number;
}): PerformerSummary {
  return {
    id: model.id,
    name: model.name,
    slug: model.slug,
    avatarGradient: generateGradient(model.id),
    videoCount: model.videoCount,
  };
}

/** Build a VideoData from Prisma video with relations */
function toVideoData(video: {
  id: string;
  title: string;
  slug: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  description: string | null;
  accessLevel: string;
  videoTags: { tag: { name: string; slug: string } }[];
  videoModels: { model: { id: string; name: string; slug: string; videoCount: number } }[];
}): VideoData {
  const pubDate = video.publishedAt ?? video.createdAt;
  return {
    id: video.id,
    title: video.title,
    slug: video.slug,
    duration: formatDuration(video.durationSeconds),
    durationSeconds: video.durationSeconds,
    views: video.viewCount,
    publishedAt: formatRelativeDate(pubDate),
    publishedAtDate: pubDate,
    thumbnailGradient: generateGradient(video.id),
    thumbnailUrl: video.thumbnailUrl,
    category: getCategoryFromTags(video.videoTags),
    isFeatured: video.isFeatured,
    isPremium: isPremium(video.accessLevel),
    description: video.description,
    performerSlugs: video.videoModels.map((vm) => vm.model.slug),
    performers: video.videoModels.map((vm) => toPerformerSummary(vm.model)),
    tags: video.videoTags.map((vt) => vt.tag.name),
  };
}

/** Build a PerformerData from Prisma model with relations */
function toPerformerData(performer: {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  videoCount: number;
  bio: string | null;
  createdAt: Date;
  videoModels: { video: { slug: string } }[];
  aliases: { alias: string }[];
  tags: string[];
}): PerformerData {
  return {
    id: performer.id,
    name: performer.name,
    slug: performer.slug,
    avatarGradient: generateGradient(performer.id),
    avatarUrl: performer.avatarUrl,
    videoCount: performer.videoCount,
    bio: performer.bio,
    tags: performer.tags.length > 0 ? performer.tags : [],
    joinedAt: formatJoinDate(performer.createdAt),
    relatedSlugs: [],
  };
}

// ─────────────────────────────────────────────
// Homepage Queries
// ─────────────────────────────────────────────

/**
 * Get featured/spotlight performer (random from top 4 by video count)
 */
export async function getSpotlightPerformer(): Promise<PerformerData | null> {
  const performers = await prisma.model.findMany({
    where: { isActive: true },
    orderBy: { videoCount: "desc" },
    take: 4,
    include: {
      videoModels: { include: { video: { select: { slug: true } } } },
      aliases: { select: { alias: true } },
    },
  });

  if (performers.length === 0) return null;

  const random = performers[Math.floor(Math.random() * performers.length)];
  return toPerformerData({
    ...random,
    tags: random.aliases.map((a) => a.alias),
  });
}

/**
 * Get homepage curated collections
 */
export async function getHomeCollections(): Promise<CollectionData[]> {
  // The schema has no dedicated "collection" model.
  // We build collections dynamically from tag groups.
  // Tag groups with videos under their tags will be our "collections".
  const tagGroups = await prisma.tagGroup.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
    include: {
      tags: {
        where: { isActive: true },
        include: {
          videoTags: {
            include: {
              video: {
                select: { slug: true, title: true },
              },
            },
            take: 8,
          },
        },
      },
    },
  });

  return tagGroups.map((group) => {
    const allTags = group.tags;
    const allVideos = allTags.flatMap((t) => t.videoTags.map((vt) => vt.video));
    const uniqueVideoSlugs = [...new Set(allVideos.map((v) => v.slug))];

    return {
      id: group.id,
      title: group.name,
      slug: group.slug,
      description: group.description ?? `Explore ${group.name}`,
      gradient: generateGradient(group.id),
      performerSlugs: [], // populated on demand
      videoSlugs: uniqueVideoSlugs,
      tags: allTags.map((t) => t.name),
    };
  });
}

/**
 * Get featured performers (top 4 by video count)
 */
export async function getFeaturedPerformers(): Promise<PerformerData[]> {
  const performers = await prisma.model.findMany({
    where: { isActive: true },
    orderBy: { videoCount: "desc" },
    take: 4,
    include: {
      videoModels: { include: { video: { select: { slug: true } } } },
      aliases: { select: { alias: true } },
    },
  });

  return performers.map((p) =>
    toPerformerData({ ...p, tags: p.aliases.map((a) => a.alias) }),
  );
}

/**
 * Get staff pick videos (featured or highest rated, limited to 4)
 */
export async function getStaffPicks(): Promise<VideoData[]> {
  const videos = await prisma.video.findMany({
    where: {
      status: "published",
      accessLevel: { in: ["public", "premium"] },
      isFeatured: true,
    },
    orderBy: [{ publishedAt: "desc" }, { avgRating: "desc" }],
    take: 4,
    include: {
      videoTags: { include: { tag: { select: { name: true, slug: true } } } },
      videoModels: {
        include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
      },
    },
  });

  return videos.map(toVideoData);
}

/**
 * Get all tags for the tag cloud (with video & performer counts)
 */
export async function getAllTags(): Promise<TagData[]> {
  const tags = await prisma.tag.findMany({
    where: { isActive: true },
    orderBy: { videoCount: "desc" },
    include: {
      videoTags: { select: { videoId: true } },
    },
  });

  return tags.map((tag) => ({
    name: tag.name,
    slug: tag.slug,
    videoCount: tag.videoCount,
    performerCount: 0, // Not easily queryable from junction, will be 0 for now
  }));
}

/**
 * Get all categories (nav items)
 */
export function getCategories(): CategoryData[] {
  return [
    { id: "cat-all", label: "All", slug: "all", isActive: true },
    { id: "cat-latest", label: "Latest", slug: "latest" },
    { id: "cat-popular", label: "Popular", slug: "popular" },
    { id: "cat-trending", label: "Trending", slug: "trending" },
    { id: "cat-categories", label: "Categories", slug: "categories" },
    { id: "cat-premium", label: "Premium", slug: "premium" },
    { id: "cat-hd", label: "HD", slug: "hd" },
    { id: "cat-4k", label: "4K", slug: "4k" },
    { id: "cat-longform", label: "Long Form", slug: "longform" },
    { id: "cat-shorts", label: "Shorts", slug: "shorts" },
    { id: "cat-live", label: "Live", slug: "live" },
    { id: "cat-staff-picks", label: "Staff Picks", slug: "staff-picks" },
  ];
}

/**
 * Get trending videos (sorted by view count, limited)
 */
export async function getTrendingVideos(limit = 8): Promise<VideoData[]> {
  const videos = await prisma.video.findMany({
    where: { status: "published", accessLevel: { in: ["public", "premium"] } },
    orderBy: { viewCount: "desc" },
    take: limit,
    include: {
      videoTags: { include: { tag: { select: { name: true, slug: true } } } },
      videoModels: {
        include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
      },
    },
  });

  return videos.map(toVideoData);
}

/**
 * Get latest videos (sorted by publishedAt)
 */
export async function getLatestVideos(limit = 8): Promise<VideoData[]> {
  const videos = await prisma.video.findMany({
    where: { status: "published", accessLevel: { in: ["public", "premium"] } },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      videoTags: { include: { tag: { select: { name: true, slug: true } } } },
      videoModels: {
        include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
      },
    },
  });

  return videos.map(toVideoData);
}

// ─────────────────────────────────────────────
// Performer Queries
// ─────────────────────────────────────────────

/**
 * Get all active performers
 */
export async function getAllPerformers(): Promise<PerformerData[]> {
  const performers = await prisma.model.findMany({
    where: { isActive: true },
    orderBy: { videoCount: "desc" },
    include: {
      videoModels: { include: { video: { select: { slug: true } } } },
      aliases: { select: { alias: true } },
    },
  });

  return performers.map((p) =>
    toPerformerData({ ...p, tags: p.aliases.map((a) => a.alias) }),
  );
}

/**
 * Get a single performer by slug
 */
export async function getPerformerBySlug(slug: string): Promise<PerformerData | null> {
  const performer = await prisma.model.findUnique({
    where: { slug },
    include: {
      videoModels: {
        include: { video: { select: { slug: true } } },
      },
      aliases: { select: { alias: true } },
    },
  });

  if (!performer) return null;

  return toPerformerData({ ...performer, tags: performer.aliases.map((a) => a.alias) });
}

/**
 * Get videos for a specific performer
 */
export async function getVideosForPerformer(performerSlug: string): Promise<VideoData[]> {
  const performer = await prisma.model.findUnique({
    where: { slug: performerSlug },
    select: { id: true },
  });

  if (!performer) return [];

  const videoModels = await prisma.videoModel.findMany({
    where: { modelId: performer.id },
    include: {
      video: {
        include: {
          videoTags: { include: { tag: { select: { name: true, slug: true } } } },
          videoModels: {
            include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return videoModels
    .map((vm) => toVideoData(vm.video))
    .filter((v) => true); // all published from the join
}

/**
 * Get related performers (same tag groups, limited)
 */
export async function getRelatedPerformers(performerId: string): Promise<PerformerData[]> {
  // Find performers that share tags with this performer
  // We use the aliases as a proxy for "related tags"
  const performer = await prisma.model.findUnique({
    where: { id: performerId },
    include: { aliases: { select: { alias: true } } },
  });

  if (!performer || performer.aliases.length === 0) return [];

  const aliasNames = performer.aliases.map((a) => a.alias.toLowerCase());

  // Find other performers that share at least one alias/tag
  const related = await prisma.model.findMany({
    where: {
      isActive: true,
      id: { not: performerId },
      aliases: {
        some: {
          alias: { in: aliasNames },
        },
      },
    },
    take: 6,
    orderBy: { videoCount: "desc" },
    include: {
      videoModels: { include: { video: { select: { slug: true } } } },
      aliases: { select: { alias: true } },
    },
  });

  return related.map((p) =>
    toPerformerData({ ...p, tags: p.aliases.map((a) => a.alias) }),
  );
}

// ─────────────────────────────────────────────
// Video Queries
// ─────────────────────────────────────────────

/**
 * Get a single video by slug
 */
export async function getVideoBySlug(slug: string): Promise<VideoData | null> {
  const video = await prisma.video.findUnique({
    where: { slug },
    include: {
      videoTags: { include: { tag: { select: { name: true, slug: true } } } },
      videoModels: {
        include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
      },
    },
  });

  if (!video) return null;
  return toVideoData(video);
}

/**
 * Get videos by the same performers as a given video (excluding the video itself)
 */
export async function getVideosByPerformerForVideo(
  videoSlug: string,
  limit = 8,
): Promise<VideoData[]> {
  const video = await prisma.video.findUnique({
    where: { slug: videoSlug },
    include: {
      videoModels: { select: { modelId: true } },
    },
  });

  if (!video || video.videoModels.length === 0) return [];

  const performerIds = video.videoModels.map((vm) => vm.modelId);

  const otherVideos = await prisma.videoModel.findMany({
    where: {
      modelId: { in: performerIds },
      video: { slug: { not: videoSlug } },
    },
    include: {
      video: {
        include: {
          videoTags: { include: { tag: { select: { name: true, slug: true } } } },
          videoModels: {
            include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
          },
        },
      },
    },
    take: limit,
    orderBy: { video: { publishedAt: "desc" } },
  });

  // Deduplicate by video id
  const seen = new Set<string>();
  return otherVideos
    .map((vm) => toVideoData(vm.video))
    .filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
}

/**
 * Get recommended videos, excluding a specific slug
 */
export async function getRecommendedVideos(
  excludeSlug: string,
  limit = 8,
): Promise<VideoData[]> {
  const videos = await prisma.video.findMany({
    where: {
      status: "published",
      accessLevel: { in: ["public", "premium"] },
      slug: { not: excludeSlug },
    },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: {
      videoTags: { include: { tag: { select: { name: true, slug: true } } } },
      videoModels: {
        include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
      },
    },
  });

  return videos.map(toVideoData);
}

/**
 * Get all published videos
 */
export async function getAllVideos(): Promise<VideoData[]> {
  const videos = await prisma.video.findMany({
    where: { status: "published", accessLevel: { in: ["public", "premium"] } },
    orderBy: { publishedAt: "desc" },
    include: {
      videoTags: { include: { tag: { select: { name: true, slug: true } } } },
      videoModels: {
        include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
      },
    },
  });

  return videos.map(toVideoData);
}

// ─────────────────────────────────────────────
// Tag Queries
// ─────────────────────────────────────────────

/**
 * Get videos for a specific tag
 */
export async function getVideosForTag(tagName: string): Promise<VideoData[]> {
  const tag = await prisma.tag.findFirst({
    where: { name: { equals: tagName, mode: "insensitive" }, isActive: true },
    select: { id: true, name: true },
  });

  if (!tag) return [];

  const videoTags = await prisma.videoTag.findMany({
    where: { tagId: tag.id },
    include: {
      video: {
        include: {
          videoTags: { include: { tag: { select: { name: true, slug: true } } } },
          videoModels: {
            include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
          },
        },
      },
    },
    take: 50,
  });

  return videoTags.map((vt) => toVideoData(vt.video));
}

/**
 * Get performers for a specific tag (via aliases)
 */
export async function getPerformersForTag(tagName: string): Promise<PerformerData[]> {
  const performers = await prisma.model.findMany({
    where: {
      isActive: true,
      aliases: {
        some: {
          alias: { equals: tagName, mode: "insensitive" },
        },
      },
    },
    orderBy: { videoCount: "desc" },
    include: {
      videoModels: { include: { video: { select: { slug: true } } } },
      aliases: { select: { alias: true } },
    },
  });

  return performers.map((p) =>
    toPerformerData({ ...p, tags: p.aliases.map((a) => a.alias) }),
  );
}

// ─────────────────────────────────────────────
// Media Asset Queries
// ─────────────────────────────────────────────

/**
 * Get all media assets for a video, ordered by creation date descending.
 */
export async function getVideoAssets(videoId: string) {
  return prisma.mediaAsset.findMany({
    where: { videoId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      assetType: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      storageKey: true,
      storageProvider: true,
      width: true,
      height: true,
      duration: true,
      createdAt: true,
    },
  });
}

/**
 * Get the primary VIDEO_SOURCE media asset for a video.
 * Returns the most recent VIDEO_SOURCE asset (the "primary" source).
 */
export async function getPrimaryVideoSource(videoId: string) {
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      videoId,
      assetType: "VIDEO_SOURCE",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      storageKey: true,
      storageProvider: true,
      width: true,
      height: true,
      duration: true,
      createdAt: true,
    },
  });
  return asset;
}

// ─────────────────────────────────────────────
// Search Queries
// ─────────────────────────────────────────────

/**
 * Full-text search across videos, performers, and tags
 */
export async function searchVideos(options: {
  query: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<{ videos: VideoData[]; total: number }> {
  const { query, tag, limit = 8, offset = 0 } = options;

  const where: any = {
    status: "published",
    accessLevel: { in: ["public", "premium"] },
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      {
        videoTags: {
          some: {
            tag: { name: { contains: query, mode: "insensitive" }, isActive: true },
          },
        },
      },
      {
        videoModels: {
          some: {
            model: { name: { contains: query, mode: "insensitive" }, isActive: true },
          },
        },
      },
    ];
  }

  if (tag) {
    const tagFilter = {
      videoTags: {
        some: {
          tag: { name: { equals: tag, mode: "insensitive" }, isActive: true },
        },
      },
    };

    if (where.OR) {
      where.AND = [tagFilter];
    } else {
      where.videoTags = tagFilter.videoTags;
    }
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      skip: offset,
      take: limit,
      include: {
        videoTags: { include: { tag: { select: { name: true, slug: true } } } },
        videoModels: {
          include: { model: { select: { id: true, name: true, slug: true, videoCount: true } } },
        },
      },
    }),
    prisma.video.count({ where }),
  ]);

  return { videos: videos.map(toVideoData), total };
}

/**
 * Search performers by name or tag
 */
export async function searchPerformers(query: string): Promise<PerformerData[]> {
  const performers = await prisma.model.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
        {
          aliases: {
            some: {
              alias: { contains: query, mode: "insensitive" },
            },
          },
        },
      ],
    },
    orderBy: { videoCount: "desc" },
    take: 10,
    include: {
      videoModels: { include: { video: { select: { slug: true } } } },
      aliases: { select: { alias: true } },
    },
  });

  return performers.map((p) =>
    toPerformerData({ ...p, tags: p.aliases.map((a) => a.alias) }),
  );
}

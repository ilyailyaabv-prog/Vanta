/* ─────────────────────────────────────────────
 * Vanta — Placeholder Data for Public Pages
 * No database calls. No business logic.
 * Performer-centered premium video library.
 * ───────────────────────────────────────────── */

export interface PlaceholderVideo {
  id: string;
  title: string;
  slug: string;
  duration: string;
  views: number;
  publishedAt: string;
  thumbnailGradient: string;
  category: string;
  isFeatured?: boolean;
  isViewed?: boolean;
  isPremium?: boolean;
  description?: string;
  performerSlugs: string[];
  collectionSlugs: string[];
  tags: string[];
}

export interface PlaceholderCategory {
  id: string;
  label: string;
  slug: string;
  isActive?: boolean;
}

export interface PlaceholderFeatured {
  id: string;
  title: string;
  description: string;
  thumbnailGradient: string;
  duration: string;
  category: string;
}

export interface PlaceholderPerformer {
  id: string;
  name: string;
  slug: string;
  avatarGradient: string;
  videoCount: number;
  bio: string;
  videoSlugs: string[];
  tags: string[];
  joinedAt: string;
  relatedSlugs: string[];
}

export interface PlaceholderCollection {
  id: string;
  title: string;
  slug: string;
  description: string;
  gradient: string;
  performerSlugs: string[];
  videoSlugs: string[];
  tags: string[];
}

/* ── Categories (legacy, used by CategoryNav) ── */

export const categories: PlaceholderCategory[] = [
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

/* ── Performers ── */

export const performers: PlaceholderPerformer[] = [
  {
    id: "perf-1",
    name: "Lena Noir",
    slug: "lena-noir",
    avatarGradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #4a2d6b 100%)",
    videoCount: 24,
    bio: "Award-winning cinematographer and visual storyteller. Lena blends neo-noir aesthetics with cutting-edge digital techniques to create immersive cinematic experiences.",
    videoSlugs: ["midnight-pulse-concert", "abstract-expressions", "jazz-in-the-dark"],
    tags: ["Cinematography", "Neo-Noir", "Visual Effects", "Music"],
    joinedAt: "January 2024",
    relatedSlugs: ["kai-marino", "sora-ishikawa"],
  },
  {
    id: "perf-2",
    name: "Kai Marino",
    slug: "kai-marino",
    avatarGradient: "linear-gradient(135deg, #0d1b2a 0%, #1b2d3d 50%, #2d4a5c 100%)",
    videoCount: 31,
    bio: "Documentary filmmaker and explorer. Kai travels the world capturing remote landscapes, indigenous cultures, and the raw beauty of the natural world.",
    videoSlugs: ["nordic-aerial-drone", "coastal-route-101", "urban-architecture-tokyo"],
    tags: ["Documentary", "Travel", "Aerial", "Nature"],
    joinedAt: "March 2023",
    relatedSlugs: ["lena-noir", "elara-voss"],
  },
  {
    id: "perf-3",
    name: "Sora Ishikawa",
    slug: "sora-ishikawa",
    avatarGradient: "linear-gradient(135deg, #1a1a2e 0%, #2d3561 50%, #4a5d8a 100%)",
    videoCount: 18,
    bio: "Tokyo-based digital artist and VJ. Sora creates stunning real-time visual performances that blend traditional Japanese aesthetics with modern generative art.",
    videoSlugs: ["urban-architecture-tokyo", "electronic-producer-interview"],
    tags: ["Digital Art", "Generative", "Performance", "Tokyo"],
    joinedAt: "June 2024",
    relatedSlugs: ["lena-noir", "david-chen"],
  },
  {
    id: "perf-4",
    name: "Elara Voss",
    slug: "elara-voss",
    avatarGradient: "linear-gradient(135deg, #1c1c1c 0%, #2c2c2c 50%, #3a3a3a 100%)",
    videoCount: 15,
    bio: "Minimalist photographer and filmmaker. Elara's work explores the beauty of negative space, natural light, and the quiet moments that often go unnoticed.",
    videoSlugs: ["minimalist-photography", "the-art-of-silence"],
    tags: ["Photography", "Minimalism", "Tutorial", "Lighting"],
    joinedAt: "April 2024",
    relatedSlugs: ["kai-marino", "lena-noir"],
  },
  {
    id: "perf-5",
    name: "David Chen",
    slug: "david-chen",
    avatarGradient: "linear-gradient(135deg, #0a1628 0%, #1a2d4a 50%, #2d4a6b 100%)",
    videoCount: 42,
    bio: "Music producer and sound designer. David's workshops demystify electronic music production, from synthesizer programming to mixing and mastering.",
    videoSlugs: ["synth-workshop-pad", "electronic-producer-interview", "midnight-pulse-concert"],
    tags: ["Music", "Tutorial", "Synthesizer", "Production"],
    joinedAt: "September 2023",
    relatedSlugs: ["sora-ishikawa", "lena-noir"],
  },
  {
    id: "perf-6",
    name: "Marcus Webb",
    slug: "marcus-webb",
    avatarGradient: "linear-gradient(135deg, #1c0a00 0%, #3d1f00 50%, #5c3a00 100%)",
    videoCount: 9,
    bio: "Horror and sci-fi director. Marcus creates atmospheric short films that explore the boundaries between reality and the unknown, with a focus on practical effects.",
    videoSlugs: ["last-light-episode-1"],
    tags: ["Horror", "Sci-Fi", "Short Film", "Practical Effects"],
    joinedAt: "November 2024",
    relatedSlugs: ["lena-noir", "kai-marino"],
  },
  {
    id: "perf-7",
    name: "Yuki Tanaka",
    slug: "yuki-tanaka",
    avatarGradient: "linear-gradient(135deg, #0d1b1b 0%, #1a2d2d 50%, #2d4a4a 100%)",
    videoCount: 27,
    bio: "Master watchmaker and craftsman. Yuki's detailed documentaries showcase the precision artistry behind traditional mechanical watchmaking and fine craftsmanship.",
    videoSlugs: ["watchmakers-craft", "coastal-route-101"],
    tags: ["Craftsmanship", "Documentary", "Detail", "Tradition"],
    joinedAt: "February 2024",
    relatedSlugs: ["elara-voss", "kai-marino"],
  },
  {
    id: "perf-8",
    name: "Zara Okafor",
    slug: "zara-okafo",
    avatarGradient: "linear-gradient(135deg, #1a0a00 0%, #3d1a00 50%, #5c2a00 100%)",
    videoCount: 13,
    bio: "Abstract expressionist and mixed-media artist. Zara's art films capture the creative process in real-time, from blank canvas to finished masterpiece.",
    videoSlugs: ["abstract-expressions", "the-art-of-silence"],
    tags: ["Art", "Abstract", "Painting", "Creative Process"],
    joinedAt: "August 2024",
    relatedSlugs: ["lena-noir", "elara-voss"],
  },
];

/* ── Collections ── */

export const collections: PlaceholderCollection[] = [
  {
    id: "col-1",
    title: "Neon Noir",
    slug: "neon-noir",
    description: "Dark, atmospheric cinema bathed in neon light. A curated selection of Lena Noir's most striking visual work.",
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #16213e 70%, #0f3460 100%)",
    performerSlugs: ["lena-noir"],
    videoSlugs: ["midnight-pulse-concert", "jazz-in-the-dark", "abstract-expressions"],
    tags: ["Neo-Noir", "Cinematography", "Music"],
  },
  {
    id: "col-2",
    title: "Coastal Journeys",
    slug: "coastal-journeys",
    description: "From the Pacific Coast Highway to the fjords of Scandinavia. Kai Marino's documentary work across the world's most beautiful coastlines.",
    gradient: "linear-gradient(135deg, #0d1b2a 0%, #1b2d3d 30%, #2d4a5c 70%, #4a6b7d 100%)",
    performerSlugs: ["kai-marino", "yuki-tanaka"],
    videoSlugs: ["nordic-aerial-drone", "coastal-route-101"],
    tags: ["Travel", "Documentary", "Aerial", "Nature"],
  },
  {
    id: "col-3",
    title: "Sonic Explorations",
    slug: "sonic-explorations",
    description: "Music, sound design, and the art of audio. Featuring David Chen's workshops, interviews, and live sessions.",
    gradient: "linear-gradient(135deg, #0a1628 0%, #1a2d4a 30%, #2d4a6b 70%, #4a6b8b 100%)",
    performerSlugs: ["david-chen", "sora-ishikawa"],
    videoSlugs: ["synth-workshop-pad", "electronic-producer-interview", "midnight-pulse-concert"],
    tags: ["Music", "Tutorial", "Production", "Sound Design"],
  },
  {
    id: "col-4",
    title: "Quiet Places",
    slug: "quiet-places",
    description: "Minimalist films about stillness, silence, and the beauty of empty spaces. A collaboration between Elara Voss and Zara Okafor.",
    gradient: "linear-gradient(135deg, #1c1c1c 0%, #2c2c2c 30%, #3a3a3a 70%, #5a5a5a 100%)",
    performerSlugs: ["elara-voss", "zara-okafo"],
    videoSlugs: ["minimalist-photography", "the-art-of-silence", "abstract-expressions"],
    tags: ["Minimalism", "Photography", "Art", "Meditation"],
  },
  {
    id: "col-5",
    title: "Craft & Precision",
    slug: "craft-and-precision",
    description: "Meticulous craftsmanship documented in stunning detail. From watchmaking to photography, see mastery in every frame.",
    gradient: "linear-gradient(135deg, #1c1510 0%, #2d2018 30%, #4a3528 70%, #6b4d3a 100%)",
    performerSlugs: ["yuki-tanaka", "elara-voss"],
    videoSlugs: ["watchmakers-craft", "minimalist-photography"],
    tags: ["Craftsmanship", "Documentary", "Detail", "Tradition"],
  },
];

/* ── Featured Content (Legacy — will be replaced by spotlight) ── */

export const featuredContent: PlaceholderFeatured[] = [
  {
    id: "feat-1",
    title: "Neon Horizons",
    description: "An immersive journey through the neon-lit streets of a futuristic metropolis.",
    thumbnailGradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #16213e 70%, #0f3460 100%)",
    duration: "1:24:15",
    category: "Featured",
  },
];

/* ── Videos ── */

export const trendingVideos: PlaceholderVideo[] = [
  {
    id: "v-01",
    title: "Midnight Pulse — Full Concert Experience",
    slug: "midnight-pulse-concert",
    duration: "1:42:18",
    views: 284_103,
    publishedAt: "2 days ago",
    thumbnailGradient: "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 30%, #16213e 60%, #0f3460 100%)",
    category: "Music",
    isPremium: true,
    description: "Experience the full Midnight Pulse concert, recorded live at the Neon Cathedral. Shot in 4K HDR with 12-channel spatial audio.",
    performerSlugs: ["lena-noir", "david-chen"],
    collectionSlugs: ["neon-noir", "sonic-explorations"],
    tags: ["Music", "Concert", "Live Performance", "4K"],
  },
  {
    id: "v-02",
    title: "Urban Architecture: Tokyo's Hidden Gems",
    slug: "urban-architecture-tokyo",
    duration: "18:22",
    views: 147_892,
    publishedAt: "5 days ago",
    thumbnailGradient: "linear-gradient(135deg, #1a1a2e 0%, #2d3561 40%, #4a5d8a 70%, #6b8bb8 100%)",
    category: "Documentary",
    isPremium: true,
    description: "Tokyo's remarkable hidden architectural treasures, from brutalist concrete to intimate machiya townhouses.",
    performerSlugs: ["sora-ishikawa", "kai-marino"],
    collectionSlugs: ["coastal-journeys"],
    tags: ["Architecture", "Tokyo", "Documentary", "Design"],
  },
  {
    id: "v-03",
    title: "The Last Light — Episode 1",
    slug: "last-light-episode-1",
    duration: "44:12",
    views: 92_451,
    publishedAt: "1 week ago",
    thumbnailGradient: "linear-gradient(135deg, #1c0a00 0%, #3d1f00 30%, #5c3a00 60%, #8b6d00 100%)",
    category: "Series",
    description: "In a world where the sun is dying, a lone signal operator discovers a transmission from beyond the dead zone.",
    performerSlugs: ["marcus-webb"],
    collectionSlugs: [],
    tags: ["Series", "Sci-Fi", "Post-Apocalyptic", "Drama"],
  },
  {
    id: "v-04",
    title: "Synthesizer Workshop: Building a Pad Sound",
    slug: "synth-workshop-pad",
    duration: "31:05",
    views: 76_234,
    publishedAt: "3 days ago",
    thumbnailGradient: "linear-gradient(135deg, #0a1628 0%, #1a2d4a 30%, #2d4a6b 60%, #4a6b8b 100%)",
    category: "Tutorial",
    description: "Learn lush, evolving pad sounds from scratch — subtractive synthesis, wavetable modulation, and advanced layering.",
    performerSlugs: ["david-chen"],
    collectionSlugs: ["sonic-explorations"],
    tags: ["Tutorial", "Synthesizer", "Music Production", "Sound Design"],
  },
  {
    id: "v-05",
    title: "Nordic Landscapes: Aerial Drone Film",
    slug: "nordic-aerial-drone",
    duration: "12:47",
    views: 312_567,
    publishedAt: "6 days ago",
    thumbnailGradient: "linear-gradient(135deg, #0d1b2a 0%, #1b2d3d 30%, #2d4a5c 60%, #4a6b7d 100%)",
    category: "Travel",
    isPremium: true,
    description: "Soar over breathtaking fjords, glaciers, and northern lights. Captured entirely with FPV drones in 8K resolution.",
    performerSlugs: ["kai-marino"],
    collectionSlugs: ["coastal-journeys"],
    tags: ["Travel", "Aerial", "Nature", "8K", "Drone"],
  },
  {
    id: "v-06",
    title: "Jazz in the Dark — Live Session",
    slug: "jazz-in-the-dark",
    duration: "55:30",
    views: 45_789,
    publishedAt: "4 days ago",
    thumbnailGradient: "linear-gradient(135deg, #1a0a0a 0%, #2d1515 30%, #4a2525 60%, #6b3535 100%)",
    category: "Music",
    description: "An intimate live jazz session in a dimly lit underground club. A quartet of world-class musicians improvising through the night.",
    performerSlugs: ["lena-noir"],
    collectionSlugs: ["neon-noir"],
    tags: ["Music", "Jazz", "Live Session", "Intimate"],
  },
  {
    id: "v-07",
    title: "Minimalist Photography Masterclass",
    slug: "minimalist-photography",
    duration: "23:18",
    views: 68_912,
    publishedAt: "1 week ago",
    thumbnailGradient: "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 30%, #404040 60%, #5a5a5a 100%)",
    category: "Tutorial",
    description: "Composition, lighting, and post-processing workflows for stunning minimalist photography.",
    performerSlugs: ["elara-voss"],
    collectionSlugs: ["quiet-places", "craft-and-precision"],
    tags: ["Tutorial", "Photography", "Minimalism", "Composition"],
  },
  {
    id: "v-08",
    title: "Coastal Route 101: Road Trip Documentary",
    slug: "coastal-route-101",
    duration: "1:12:44",
    views: 156_321,
    publishedAt: "2 weeks ago",
    thumbnailGradient: "linear-gradient(135deg, #0d1b1b 0%, #1a2d2d 30%, #2d4a4a 60%, #4a6b6b 100%)",
    category: "Travel",
    description: "Drive the legendary Pacific Coast Highway from San Francisco to Seattle. Iconic coastline, redwoods, and coastal communities.",
    performerSlugs: ["kai-marino", "yuki-tanaka"],
    collectionSlugs: ["coastal-journeys"],
    tags: ["Travel", "Road Trip", "Documentary", "Coastal"],
  },
];

export const newReleases: PlaceholderVideo[] = [
  {
    id: "v-09",
    title: "Abstract Expressions — Art Film",
    slug: "abstract-expressions",
    duration: "16:42",
    views: 12_345,
    publishedAt: "12 hours ago",
    thumbnailGradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #4a2d6b 60%, #6b4a8b 100%)",
    category: "Art",
    isPremium: true,
    description: "Zara Okafor's creative process as she transforms a blank canvas into a vibrant abstract expressionist work.",
    performerSlugs: ["zara-okafo", "lena-noir"],
    collectionSlugs: ["neon-noir", "quiet-places"],
    tags: ["Art", "Abstract", "Creative Process", "Painting"],
  },
  {
    id: "v-10",
    title: "Deep Space: A Cosmic Meditation",
    slug: "deep-space-meditation",
    duration: "1:08:22",
    views: 8_912,
    publishedAt: "1 day ago",
    thumbnailGradient: "linear-gradient(135deg, #00000d 0%, #0a0a1a 30%, #1a1a2d 60%, #2d2d4a 100%)",
    category: "Meditation",
    description: "A guided meditation experience set against the backdrop of deep space visuals.",
    performerSlugs: [],
    collectionSlugs: ["quiet-places"],
    tags: ["Meditation", "Relaxation", "Space", "Wellness"],
  },
  {
    id: "v-11",
    title: "The Watchmaker's Craft",
    slug: "watchmakers-craft",
    duration: "9:15",
    views: 23_456,
    publishedAt: "2 days ago",
    thumbnailGradient: "linear-gradient(135deg, #1c1510 0%, #2d2018 30%, #4a3528 60%, #6b4d3a 100%)",
    category: "Documentary",
    description: "The meticulous art of mechanical watchmaking — from gear assembly to final regulation.",
    performerSlugs: ["yuki-tanaka"],
    collectionSlugs: ["craft-and-precision"],
    tags: ["Documentary", "Craftsmanship", "Watches", "Precision"],
  },
  {
    id: "v-12",
    title: "Electronic Music Producer Interview",
    slug: "electronic-producer-interview",
    duration: "38:50",
    views: 5_678,
    publishedAt: "3 days ago",
    thumbnailGradient: "linear-gradient(135deg, #0d0d1a 0%, #1a2d2d 30%, #2d4a3d 60%, #4a6b5c 100%)",
    category: "Interview",
    description: "In-depth conversation with David Chen about his creative process, gear setup, and the future of electronic music.",
    performerSlugs: ["david-chen", "sora-ishikawa"],
    collectionSlugs: ["sonic-explorations"],
    tags: ["Interview", "Music", "Production", "Studio"],
  },
];

export const allVideos: PlaceholderVideo[] = [...trendingVideos, ...newReleases];

/* ── Helpers ── */

export function getVideoBySlug(slug: string): PlaceholderVideo | undefined {
  return allVideos.find((v) => v.slug === slug);
}

export function getPerformerBySlug(slug: string): PlaceholderPerformer | undefined {
  return performers.find((p) => p.slug === slug);
}

export function getCollectionBySlug(slug: string): PlaceholderCollection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getRelatedPerformers(performer: PlaceholderPerformer): PlaceholderPerformer[] {
  return performer.relatedSlugs
    .map((slug) => getPerformerBySlug(slug))
    .filter((p): p is PlaceholderPerformer => p !== undefined);
}

export function getVideosForPerformer(slug: string): PlaceholderVideo[] {
  return allVideos.filter((v) => v.performerSlugs?.includes(slug));
}

export function getVideosForCollection(slug: string): PlaceholderVideo[] {
  return allVideos.filter((v) => v.collectionSlugs?.includes(slug));
}

export function getVideosForTag(tag: string): PlaceholderVideo[] {
  return allVideos.filter((v) => v.tags?.includes(tag));
}

export function getPerformersForTag(tag: string): PlaceholderPerformer[] {
  return performers.filter((p) => p.tags.includes(tag));
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  allVideos.forEach((v) => v.tags.forEach((t) => tagSet.add(t)));
  performers.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function getTagVideoCount(tag: string): number {
  return getVideosForTag(tag).length;
}

export function getRecommendedVideos(excludeSlug: string, count = 8): PlaceholderVideo[] {
  return allVideos.filter((v) => v.slug !== excludeSlug).slice(0, count);
}

export function getVideosByPerformerForVideo(videoSlug: string): PlaceholderVideo[] {
  const video = getVideoBySlug(videoSlug);
  if (!video?.performerSlugs?.length) return [];
  // Get videos from the first performer (primary), excluding current video
  return allVideos.filter(
    (v) => v.slug !== videoSlug && video.performerSlugs!.some((ps) => v.performerSlugs?.includes(ps)),
  );
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
}

/** Get staff pick videos (simulated via premium + specific performers) */
export function getStaffPicks(): PlaceholderVideo[] {
  return allVideos.filter((v) => v.isPremium).slice(0, 4);
}

/** Get a random performer for the spotlight hero */
export function getSpotlightPerformer(): PlaceholderPerformer {
  return performers[Math.floor(Math.random() * performers.length)];
}
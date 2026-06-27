/* ─────────────────────────────────────────────
 * Vanta — Development Seed Data
 * Populates the database with demo records for
 * development and testing.
 * Usage: npm run db:seed
 * ───────────────────────────────────────────── */

import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Vanta development database...");

  // Clean existing data
  await prisma.moderatorAction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.watchHistory.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.advertisementStats.deleteMany();
  await prisma.advertisement.deleteMany();
  await prisma.videoView.deleteMany();
  await prisma.searchQuery.deleteMany();
  await prisma.videoTag.deleteMany();
  await prisma.videoModel.deleteMany();
  await prisma.video.deleteMany();
  await prisma.modelAlias.deleteMany();
  await prisma.model.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.tagGroup.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("  ✓ Cleared existing data");

  // ── Users ──
  const adminPassword = hashSync("admin123", 12);
  const userPassword = hashSync("user123", 12);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@vanta.dev",
      passwordHash: adminPassword,
      role: "admin",
      isActive: true,
      profile: {
        create: {
          username: "admin",
          displayName: "Admin",
          isPublic: true,
        },
      },
    },
  });

  const superAdminUser = await prisma.user.create({
    data: {
      email: "superadmin@vanta.dev",
      passwordHash: adminPassword,
      role: "superadmin",
      isActive: true,
      profile: {
        create: {
          username: "superadmin",
          displayName: "Super Admin",
          isPublic: true,
        },
      },
    },
  });

  const uploaderUser = await prisma.user.create({
    data: {
      email: "uploader@vanta.dev",
      passwordHash: userPassword,
      role: "user",
      isActive: true,
      profile: {
        create: {
          username: "uploader",
          displayName: "Content Uploader",
          isPublic: true,
        },
      },
    },
  });

  console.log("  ✓ Created users");

  // ── Tag Groups ──
  const tagGroups = await Promise.all([
    prisma.tagGroup.create({
      data: {
        name: "Neon Noir",
        slug: "neon-noir",
        description: "Dark, atmospheric cinema bathed in neon light",
        sortOrder: 1,
        tags: {
          create: [
            { name: "Cinematography", slug: "cinematography", isActive: true },
            { name: "Neo-Noir", slug: "neo-noir", isActive: true },
            { name: "Visual Effects", slug: "visual-effects", isActive: true },
          ],
        },
      },
    }),
    prisma.tagGroup.create({
      data: {
        name: "Coastal Journeys",
        slug: "coastal-journeys",
        description: "Documentary work across the world's most beautiful coastlines",
        sortOrder: 2,
        tags: {
          create: [
            { name: "Documentary", slug: "documentary", isActive: true },
            { name: "Travel", slug: "travel", isActive: true },
            { name: "Aerial", slug: "aerial", isActive: true },
            { name: "Nature", slug: "nature", isActive: true },
          ],
        },
      },
    }),
    prisma.tagGroup.create({
      data: {
        name: "Sonic Explorations",
        slug: "sonic-explorations",
        description: "Music, sound design, and the art of audio",
        sortOrder: 3,
        tags: {
          create: [
            { name: "Music", slug: "music", isActive: true },
            { name: "Tutorial", slug: "tutorial", isActive: true },
            { name: "Production", slug: "production", isActive: true },
            { name: "Sound Design", slug: "sound-design", isActive: true },
          ],
        },
      },
    }),
    prisma.tagGroup.create({
      data: {
        name: "Quiet Places",
        slug: "quiet-places",
        description: "Minimalist films about stillness, silence, and empty spaces",
        sortOrder: 4,
        tags: {
          create: [
            { name: "Minimalism", slug: "minimalism", isActive: true },
            { name: "Photography", slug: "photography", isActive: true },
            { name: "Art", slug: "art", isActive: true },
          ],
        },
      },
    }),
    prisma.tagGroup.create({
      data: {
        name: "Craft & Precision",
        slug: "craft-and-precision",
        description: "Meticulous craftsmanship documented in stunning detail",
        sortOrder: 5,
        tags: {
          create: [
            { name: "Craftsmanship", slug: "craftsmanship", isActive: true },
            { name: "Detail", slug: "detail", isActive: true },
            { name: "Tradition", slug: "tradition", isActive: true },
          ],
        },
      },
    }),
    prisma.tagGroup.create({
      data: {
        name: "Series & Stories",
        slug: "series-and-stories",
        description: "Original series and narrative storytelling",
        sortOrder: 6,
        tags: {
          create: [
            { name: "Series", slug: "series", isActive: true },
            { name: "Sci-Fi", slug: "sci-fi", isActive: true },
            { name: "Drama", slug: "drama", isActive: true },
            { name: "Interview", slug: "interview", isActive: true },
          ],
        },
      },
    }),
  ]);

  // Collect all tags for reference
  const allTags = await prisma.tag.findMany();
  const tagMap = new Map(allTags.map((t) => [t.name, t]));

  console.log("  ✓ Created tag groups and tags");

  // ── Models (Performers) ──
  const performerData = [
    {
      name: "Lena Noir",
      slug: "lena-noir",
      bio: "Award-winning cinematographer and visual storyteller. Lena blends neo-noir aesthetics with cutting-edge digital techniques to create immersive cinematic experiences.",
      gender: "female",
      ethnicity: "Caucasian",
      hairColor: "Black",
      eyeColor: "Blue",
      isVerified: true,
      aliases: ["Cinematography", "Neo-Noir", "Visual Effects"],
    },
    {
      name: "Kai Marino",
      slug: "kai-marino",
      bio: "Documentary filmmaker and explorer. Kai travels the world capturing remote landscapes, indigenous cultures, and the raw beauty of the natural world.",
      gender: "male",
      ethnicity: "Hispanic",
      hairColor: "Brown",
      eyeColor: "Brown",
      isVerified: true,
      aliases: ["Documentary", "Travel", "Aerial", "Nature"],
    },
    {
      name: "Sora Ishikawa",
      slug: "sora-ishikawa",
      bio: "Tokyo-based digital artist and VJ. Sora creates stunning real-time visual performances that blend traditional Japanese aesthetics with modern generative art.",
      gender: "female",
      ethnicity: "Asian",
      hairColor: "Black",
      eyeColor: "Brown",
      isVerified: true,
      aliases: ["Art", "Minimalism", "Photography"],
    },
    {
      name: "Elara Voss",
      slug: "elara-voss",
      bio: "Minimalist photographer and filmmaker. Elara's work explores the beauty of negative space, natural light, and the quiet moments that often go unnoticed.",
      gender: "female",
      ethnicity: "Caucasian",
      hairColor: "Blonde",
      eyeColor: "Gray",
      isVerified: true,
      aliases: ["Photography", "Minimalism", "Detail"],
    },
    {
      name: "David Chen",
      slug: "david-chen",
      bio: "Music producer and sound designer. David's workshops demystify electronic music production, from synthesizer programming to mixing and mastering.",
      gender: "male",
      ethnicity: "Asian",
      hairColor: "Black",
      eyeColor: "Brown",
      isVerified: true,
      aliases: ["Music", "Tutorial", "Production", "Sound Design"],
    },
    {
      name: "Marcus Webb",
      slug: "marcus-webb",
      bio: "Horror and sci-fi director. Marcus creates atmospheric short films that explore the boundaries between reality and the unknown, with a focus on practical effects.",
      gender: "male",
      ethnicity: "African American",
      hairColor: "Black",
      eyeColor: "Brown",
      isVerified: false,
      aliases: ["Series", "Sci-Fi", "Drama"],
    },
    {
      name: "Yuki Tanaka",
      slug: "yuki-tanaka",
      bio: "Master watchmaker and craftsman. Yuki's detailed documentaries showcase the precision artistry behind traditional mechanical watchmaking and fine craftsmanship.",
      gender: "male",
      ethnicity: "Asian",
      hairColor: "Gray",
      eyeColor: "Brown",
      isVerified: true,
      aliases: ["Craftsmanship", "Documentary", "Detail", "Tradition"],
    },
    {
      name: "Zara Okafor",
      slug: "zara-okafo",
      bio: "Abstract expressionist and mixed-media artist. Zara's art films capture the creative process in real-time, from blank canvas to finished masterpiece.",
      gender: "female",
      ethnicity: "African",
      hairColor: "Black",
      eyeColor: "Brown",
      isVerified: false,
      aliases: ["Art", "Abstract", "Minimalism"],
    },
  ];

  const performers = await Promise.all(
    performerData.map((p) =>
      prisma.model.create({
        data: {
          name: p.name,
          slug: p.slug,
          bio: p.bio,
          gender: p.gender,
          ethnicity: p.ethnicity,
          hairColor: p.hairColor,
          eyeColor: p.eyeColor,
          isVerified: p.isVerified,
          videoCount: 0,
          aliases: {
            create: p.aliases.map((alias, idx) => ({
              alias,
              isPrimary: idx === 0,
            })),
          },
        },
      }),
    ),
  );

  const performerMap = new Map(performers.map((p) => [p.slug, p]));

  console.log("  ✓ Created performers");

  // ── Videos ──
  const videoData = [
    {
      title: "Midnight Pulse — Full Concert Experience",
      slug: "midnight-pulse-concert",
      description: "Experience the full Midnight Pulse concert, recorded live at the Neon Cathedral. Shot in 4K HDR with 12-channel spatial audio.",
      durationSeconds: 6138,
      viewCount: 284103,
      isFeatured: true,
      accessLevel: "premium" as const,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tags: ["Music", "Neo-Noir", "Cinematography"],
      performers: ["lena-noir", "david-chen"],
    },
    {
      title: "Urban Architecture: Tokyo's Hidden Gems",
      slug: "urban-architecture-tokyo",
      description: "Tokyo's remarkable hidden architectural treasures, from brutalist concrete to intimate machiya townhouses.",
      durationSeconds: 1102,
      viewCount: 147892,
      isFeatured: true,
      accessLevel: "premium" as const,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      tags: ["Documentary", "Travel", "Photography"],
      performers: ["sora-ishikawa", "kai-marino"],
    },
    {
      title: "The Last Light — Episode 1",
      slug: "last-light-episode-1",
      description: "In a world where the sun is dying, a lone signal operator discovers a transmission from beyond the dead zone.",
      durationSeconds: 2652,
      viewCount: 92451,
      isFeatured: false,
      accessLevel: "public" as const,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      tags: ["Series", "Sci-Fi", "Drama"],
      performers: ["marcus-webb"],
    },
    {
      title: "Synthesizer Workshop: Building a Pad Sound",
      slug: "synth-workshop-pad",
      description: "Learn lush, evolving pad sounds from scratch — subtractive synthesis, wavetable modulation, and advanced layering.",
      durationSeconds: 1865,
      viewCount: 76234,
      isFeatured: true,
      accessLevel: "public" as const,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tags: ["Tutorial", "Music", "Production", "Sound Design"],
      performers: ["david-chen"],
    },
    {
      title: "Nordic Landscapes: Aerial Drone Film",
      slug: "nordic-aerial-drone",
      description: "Soar over breathtaking fjords, glaciers, and northern lights. Captured entirely with FPV drones in 8K resolution.",
      durationSeconds: 767,
      viewCount: 312567,
      isFeatured: true,
      accessLevel: "premium" as const,
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      tags: ["Travel", "Aerial", "Nature", "Documentary"],
      performers: ["kai-marino"],
    },
    {
      title: "Jazz in the Dark — Live Session",
      slug: "jazz-in-the-dark",
      description: "An intimate live jazz session in a dimly lit underground club. A quartet of world-class musicians improvising through the night.",
      durationSeconds: 3330,
      viewCount: 45789,
      isFeatured: false,
      accessLevel: "public" as const,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      tags: ["Music", "Neo-Noir", "Cinematography"],
      performers: ["lena-noir"],
    },
    {
      title: "Minimalist Photography Masterclass",
      slug: "minimalist-photography",
      description: "Composition, lighting, and post-processing workflows for stunning minimalist photography.",
      durationSeconds: 1398,
      viewCount: 68912,
      isFeatured: false,
      accessLevel: "public" as const,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      tags: ["Tutorial", "Photography", "Minimalism", "Detail"],
      performers: ["elara-voss"],
    },
    {
      title: "Coastal Route 101: Road Trip Documentary",
      slug: "coastal-route-101",
      description: "Drive the legendary Pacific Coast Highway from San Francisco to Seattle. Iconic coastline, redwoods, and coastal communities.",
      durationSeconds: 4364,
      viewCount: 156321,
      isFeatured: false,
      accessLevel: "public" as const,
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      tags: ["Travel", "Documentary", "Nature"],
      performers: ["kai-marino", "yuki-tanaka"],
    },
    {
      title: "Abstract Expressions — Art Film",
      slug: "abstract-expressions",
      description: "Zara Okafor's creative process as she transforms a blank canvas into a vibrant abstract expressionist work.",
      durationSeconds: 1002,
      viewCount: 12345,
      isFeatured: true,
      accessLevel: "premium" as const,
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      tags: ["Art", "Minimalism", "Photography"],
      performers: ["zara-okafo", "lena-noir"],
    },
    {
      title: "The Watchmaker's Craft",
      slug: "watchmakers-craft",
      description: "The meticulous art of mechanical watchmaking — from gear assembly to final regulation.",
      durationSeconds: 555,
      viewCount: 23456,
      isFeatured: false,
      accessLevel: "public" as const,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tags: ["Craftsmanship", "Documentary", "Detail", "Tradition"],
      performers: ["yuki-tanaka"],
    },
    {
      title: "Electronic Music Producer Interview",
      slug: "electronic-producer-interview",
      description: "In-depth conversation with David Chen about his creative process, gear setup, and the future of electronic music.",
      durationSeconds: 2330,
      viewCount: 5678,
      isFeatured: false,
      accessLevel: "public" as const,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tags: ["Interview", "Music", "Production", "Sound Design"],
      performers: ["david-chen", "sora-ishikawa"],
    },
    {
      title: "The Art of Silence",
      slug: "the-art-of-silence",
      description: "A meditative exploration of silence in the modern world. Elara Voss captures quiet moments across bustling cities.",
      durationSeconds: 1845,
      viewCount: 8912,
      isFeatured: true,
      accessLevel: "premium" as const,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      tags: ["Minimalism", "Art", "Photography"],
      performers: ["elara-voss", "zara-okafo"],
    },
  ];

  for (const vd of videoData) {
    const video = await prisma.video.create({
      data: {
        title: vd.title,
        slug: vd.slug,
        description: vd.description,
        durationSeconds: vd.durationSeconds,
        viewCount: vd.viewCount,
        isFeatured: vd.isFeatured,
        accessLevel: vd.accessLevel,
        status: "published",
        storageKey: `videos/${vd.slug}.mp4`,
        fileSizeBytes: BigInt(vd.durationSeconds * 500_000), // rough estimate
        mimeType: "video/mp4",
        width: 1920,
        height: 1080,
        publishedAt: vd.publishedAt,
        uploadedByUserId: uploaderUser.id,
      },
    });

    // Attach tags
    for (const tagName of vd.tags) {
      const tag = tagMap.get(tagName);
      if (tag) {
        await prisma.videoTag.create({
          data: { videoId: video.id, tagId: tag.id },
        });
        await prisma.tag.update({
          where: { id: tag.id },
          data: { videoCount: { increment: 1 } },
        });
      }
    }

    // Attach performers
    for (const [idx, perfSlug] of vd.performers.entries()) {
      const perf = performerMap.get(perfSlug);
      if (perf) {
        await prisma.videoModel.create({
          data: {
            videoId: video.id,
            modelId: perf.id,
            role: "primary",
            sortOrder: idx,
          },
        });
        await prisma.model.update({
          where: { id: perf.id },
          data: { videoCount: { increment: 1 } },
        });
      }
    }
  }

  console.log("  ✓ Created videos with tags and performer associations");
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
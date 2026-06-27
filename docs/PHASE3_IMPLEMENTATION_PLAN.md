# Phase 3 — Production Foundations: Implementation Roadmap

**Date:** 2026-06-19  
**Project:** Vanta — Premium Video Content Platform  
**Status:** Planning — Ready for Development  
**Duration Estimate:** 6–8 weeks (parallel tracks)

---

## Table of Contents

1. [Overview & Guiding Principles](#1-overview--guiding-principles)
2. [Track A: Authentication & Authorization](#2-track-a-authentication--authorization)
3. [Track B: Admin Panel — Real Data & CRUD](#3-track-b-admin-panel--real-data--crud)
4. [Track C: Video Infrastructure — R2, HLS, Thumbnails](#4-track-c-video-infrastructure--r2-hls-thumbnails)
5. [Track D: Search Architecture — PostgreSQL Full-Text Search](#5-track-d-search-architecture--postgresql-full-text-search)
6. [Track E: Deployment Architecture — GitHub, Vercel, PostgreSQL](#6-track-e-deployment-architecture--github-vercel-postgresql)
7. [Implementation Order & Dependencies](#7-implementation-order--dependencies)
8. [Risk Register & Mitigations](#8-risk-register--mitigations)
9. [Success Criteria](#9-success-criteria)
10. [Files to Create / Modify — Summary](#10-files-to-create--modify--summary)

---

## 1. Overview & Guiding Principles

### Objective
Transform the existing UI scaffold into a production-ready application with real authentication, database-backed admin tools, cloud video infrastructure, full-text search, and a deployable architecture.

### Constraints (from requirements)
- **No new public-facing pages** — only admin internals
- **No UI redesign** — work within existing component library
- **No new collections, tags, filters, or visual features** — only infrastructure and data plumbing

### Execution Model
Five parallel tracks, each with its own delivery timeline. Tracks A and D are prerequisites for Track B. Track C is independent but requires Auth for admin upload workflows. Track E runs alongside all tracks.

| Track | Description | Dependencies | Estimate |
|-------|-------------|-------------|----------|
| A | Authentication & Authorization | None | 2 weeks |
| B | Admin Panel — Real Data & CRUD | Tracks A, D | 3 weeks |
| C | Video Infrastructure — R2, HLS, Thumbnails | Track A (admin upload) | 3 weeks |
| D | Search Architecture — PostgreSQL Full-Text Search | None | 1 week |
| E | Deployment Architecture | All tracks | 1 week |

---

## 2. Track A: Authentication & Authorization

### 2.1 Current State
- `next-auth` v5.0.0-beta.25 installed in `package.json`
- `AUTH_SECRET` and `AUTH_URL` defined in `src/env.ts` validation schema
- `User` model in Prisma includes `role` (enum: `user`, `moderator`, `admin`, `superadmin`), `passwordHash`, `isActive`, `isBanned`
- No auth route handler exists
- No login page exists
- No session protection on admin routes
- No password hashing/verification utilities

### 2.2 Implementation Steps

#### Step A-1: Install Additional Dependencies
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

**Rationale:** `next-auth` v5 (Auth.js) supports credentials provider. We use `bcryptjs` for password hashing (pure JS, no native compilation needed for Vercel deployment).

#### Step A-2: Create Auth Configuration
**File to create:** `src/auth.ts`

```
src/auth.ts                    # Auth.js v5 configuration (core)
```

**Responsibilities:**
1. Export `NextAuth` handlers, `signIn`, `signOut`, `auth` middleware helpers
2. Configure **Credentials provider** with email + password
3. Look up user by email, verify password with `bcrypt.compare`
4. Return JWT containing: `id`, `email`, `role`, `isActive`, `isBanned`
5. Configure JWT callbacks:
   - `jwt()` — enrich token with `id`, `role`, `isActive`, `isBanned`
   - `session()` — pass token fields to session object
6. Configure pages:
   - `signIn: "/admin/login"`
   - `error: "/admin/login"`

**Auth.js v5 pattern:**
```typescript
// Conceptual structure — not executable code
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        // 1. Find user by email with profile
        // 2. Compare password hash
        // 3. Return user object or null
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => { ... },
    session: async ({ session, token }) => { ... },
  },
  pages: {
    signIn: "/admin/login",
  },
});
```

#### Step A-3: Create Auth Route Handler
**File to create:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
// Re-export NextAuth handlers for GET and POST
export const { GET, POST } = handlers;
```

**Note:** App Router requires this catch-all route to intercept auth requests.

#### Step A-4: Create Server-side Session Helper
**File to modify:** `src/server/auth.ts` (or extend `src/auth.ts`)

Add helper functions:
1. `requireAuth()` — checks session exists, throws redirect if not
2. `requireRole(...roles: UserRole[])` — checks session role, throws 401 if unauthorized
3. `getCurrentUser()` — returns session user or null

#### Step A-5: Create Admin Login Page
**File to create:** `src/app/admin/login/page.tsx`

**UI expectations:**
- Email + password form (existing `Input` and `Button` components)
- Error state for invalid credentials
- Loading state during submission
- Redirect to `/admin` on success
- Banned/disabled user error messages
- Minimal, dark-themed, consistent with existing admin layout

**Client component** with:
```typescript
import { signIn } from "next-auth/react";

const result = await signIn("credentials", {
  email,
  password,
  redirect: false,
});
```

#### Step A-6: Implement Middleware for Route Protection
**File to create:** `src/middleware.ts`

```typescript
// Next.js middleware to protect admin routes
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/admin/:path*"], // Protect all admin routes
};
```

**Behavior:**
- `/admin/login` — excluded from protection (allow unauthenticated access)
- `/admin/*` — all other admin routes redirect to `/admin/login` if no session
- `role` check NOT done in middleware (too early in request lifecycle) — done in page/layout components

#### Step A-7: Protect Admin Layout with Role Check
**File to modify:** `src/app/admin/layout.tsx`

Add server-side session check:
1. Call `auth()` in the layout (server component)
2. If no session, redirect to `/admin/login`
3. If session exists but role insufficient, redirect to `/admin/login?error=unauthorized`
4. Pass session data to sidebar for user display

**Note:** The current admin layout is `"use client"`. Strategy: split into a server wrapper layout that checks auth, and a client inner layout for interactivity.

#### Step A-8: Add User Role Management Utilities
**File to create:** `src/lib/auth-helpers.ts`

Pure utility functions:
- `canManageUsers(role: UserRole): boolean`
- `canManageVideos(role: UserRole): boolean`
- `canManageTags(role: UserRole): boolean`
- `canAccessAdmin(role: UserRole): boolean`
- `isModeratorOrAbove(role: UserRole): boolean`

**Permission matrix:**

| Action | user | moderator | admin | superadmin |
|--------|------|-----------|-------|------------|
| View admin dashboard | ❌ | ✅ | ✅ | ✅ |
| Manage videos (edit/delete) | ❌ | ✅ | ✅ | ✅ |
| Manage tags | ❌ | ❌ | ✅ | ✅ |
| Manage performers | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| Manage admins | ❌ | ❌ | ❌ | ✅ |

#### Step A-9: Password Management for Seed & Admin Creation
**File to modify:** `prisma/seed.ts`

Add password hashing to seed admin user (`bcrypt.hashSync("admin123", 12)`).

### 2.3 Files to Create / Modify (Track A)

| File | Action | Purpose |
|------|--------|---------|
| `src/auth.ts` | **Create** | Auth.js v5 configuration |
| `src/app/api/auth/[...nextauth]/route.ts` | **Create** | Auth API route handler |
| `src/app/admin/login/page.tsx` | **Create** | Admin login page |
| `src/middleware.ts` | **Create** | Route protection middleware |
| `src/lib/auth-helpers.ts` | **Create** | Role permission utilities |
| `src/app/admin/layout.tsx` | **Modify** | Add server-side auth check |
| `prisma/seed.ts` | **Modify** | Hash admin password in seed |
| `src/server/auth.ts` | **Create** | Server-side session helpers |

---

## 3. Track B: Admin Panel — Real Data & CRUD

### 3.1 Current State
- Admin layout with sidebar, top nav, mobile drawer — **UI only**
- Dashboard shows **hardcoded** stats: "12,843" users, "3,421" videos, "1.2M" views, "$48,290" revenue
- `StatsCard` component accepts static props — no queries
- `ChartPlaceholder` renders empty placeholder boxes
- `RecentActivity` uses a hardcoded array of 8 items
- No CRUD pages for performers, videos, or tags

### 3.2 Implementation Steps

#### Step B-1: Create Admin Dashboard Queries
**File to create:** `src/server/queries/admin.ts`

Server-only query functions:

```typescript
export async function getAdminStats(): Promise<{
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalPerformers: number;
  totalTags: number;
  videosPublishedToday: number;
  usersRegisteredToday: number;
}> {
  // Prisma aggregate queries — no hardcoded values
  const [userCount, videoCount, viewAgg, performerCount, tagCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.video.count({ where: { status: "published" } }),
      prisma.video.aggregate({ _sum: { viewCount: true } }),
      prisma.model.count(),
      prisma.tag.count(),
    ]);
  // ...return real data
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  // Query recent actions from moderator_action, video creation events
  return prisma.moderatorAction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { moderator: { include: { profile: true } } },
  });
}

export async function getViewsChartData(days = 30): Promise<ChartDataPoint[]> {
  // Query video_view grouped by date for chart
}

export async function getTopVideos(limit = 5): Promise<TopVideoItem[]> {
  // Query videos ordered by view count
}

export async function getTopPerformers(limit = 5): Promise<TopPerformerItem[]> {
  // Query performers ordered by total views
}
```

#### Step B-2: Connect Dashboard to Real Queries
**File to modify:** `src/app/admin/page.tsx`

Convert from client component with hardcoded data to **server component** that:
1. Calls `getAdminStats()`, `getRecentActivity()`, `getViewsChartData()`, `getTopVideos()`, `getTopPerformers()`
2. Passes real data to `StatsCard`, `RecentActivity`, chart components
3. Falls back gracefully if data is empty (show "0" rather than hardcoded numbers)

**Change layout signature:**
```typescript
// Before: "use client" + hardcoded values
// After: async server component with real Prisma queries
export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  // ...
}
```

#### Step B-3: Update StatsCard to Handle Loading & Empty States
**File to modify:** `src/components/admin/StatsCard.tsx`

- Accept optional `loading` prop for skeleton state
- Accept optional `trend` prop (up/down percentage vs previous period)
- Accept optional `icon` prop for contextual icons
- No design changes — just data-aware variants

#### Step B-4: Create Performer Management Page
**File to create:** `src/app/admin/performers/page.tsx`

**Features (server component + client interactivity):**
1. **Table view** — all performers with name, slug, video count, status, verified badge
2. **Search/filter** — search by name, filter by active/inactive/verified
3. **Create performer** — modal or inline form
4. **Edit performer** — navigate to `src/app/admin/performers/[id]/page.tsx`
5. **Toggle active status** — inline action
6. **Toggle verified status** — inline action
7. **Delete performer** — confirm dialog, cascade check (cannot delete if has videos)

**Route structure:**
```
src/app/admin/performers/
  page.tsx          # List + create
  [id]/
    page.tsx        # Edit form
```

**Form fields for edit/create:**
- name (required), slug (auto-generated from name, editable), bio, avatar URL, gender, birth date, country, height, measurements, ethnicity, hair color, eye color, isActive, isVerified

#### Step B-5: Create Video Management Page
**File to create:** `src/app/admin/videos/page.tsx`

**Features:**
1. **Table view** — title, status badge, view count, published date, uploader
2. **Status filter** — draft, processing, published, archived, rejected
3. **Search** — by title
4. **Bulk actions** — publish, archive, delete selected
5. **Edit** → navigate to `src/app/admin/videos/[id]/page.tsx`
6. **Quick status toggle** — inline dropdown

**Route structure:**
```
src/app/admin/videos/
  page.tsx          # List + bulk actions
  [id]/
    page.tsx        # Detail view + edit
```

**Video edit form fields:**
- title, slug, description, status (select), accessLevel (select), isFeatured, isHardcore
- Tag associations (multi-select)
- Performer associations (multi-select)
- Thumbnail URL (display only until R2 upload is built)
- Duration seconds, file size (read-only, set during upload)

#### Step B-6: Create Tag Management Page
**File to create:** `src/app/admin/tags/page.tsx`

**Features:**
1. **Table view** — name, slug, group, video count, active status
2. **Group filter** — filter by tag group
3. **Create tag** — inline form
4. **Edit tag** — inline editing
5. **Toggle active** — inline toggle
6. **Delete tag** — confirm dialog, cascade check

**Route structure:**
```
src/app/admin/tags/
  page.tsx          # List + CRUD (simple enough for single page)
```

**Tag form fields:**
- name (required), slug (auto-generated), tag group (select from existing), description, isActive

#### Step B-7: Create Admin API Routes
**Files to create:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/performers` | GET | List performers with pagination |
| `/api/admin/performers` | POST | Create performer |
| `/api/admin/performers/[id]` | PUT | Update performer |
| `/api/admin/performers/[id]` | DELETE | Delete performer |
| `/api/admin/videos` | GET | List videos with pagination + filters |
| `/api/admin/videos` | POST | Create video |
| `/api/admin/videos/[id]` | PUT | Update video |
| `/api/admin/videos/[id]` | DELETE | Delete video |
| `/api/admin/tags` | GET | List tags |
| `/api/admin/tags` | POST | Create tag |
| `/api/admin/tags/[id]` | PUT | Update tag |
| `/api/admin/tags/[id]` | DELETE | Delete tag |
| `/api/admin/stats` | GET | Dashboard statistics |

**All routes must:**
1. Use `auth()` to verify session
2. Use `requireRole("admin", "superadmin")` for tag/performer management
3. Accept `"moderator"` for video management (read + status changes)
4. Return proper error responses (401, 403, 404, 422)
5. Validate input with Zod schemas
6. Log moderator actions to `moderator_action` table

#### Step B-8: Add Admin Form Components
**Files to create:**

| Component | Purpose |
|-----------|---------|
| `src/components/admin/DataTable.tsx` | Reusable sortable, paginated table with loading state |
| `src/components/admin/ConfirmDialog.tsx` | Reusable delete/action confirmation modal |
| `src/components/admin/StatusBadge.tsx` | Dynamic status badge (published=green, draft=gray, etc.) |
| `src/components/admin/EmptyState.tsx` | Empty state with icon + message + action button |

#### Step B-9: Replace ChartPlaceholder with Real Charts
**File to modify:** `src/components/admin/ChartPlaceholder.tsx`

Replace with simple SVG/CSS charts:
1. **Views over time** — line chart (30-day view aggregation)
2. **Video uploads by day** — bar chart
3. **User registrations by day** — bar chart

**No chart library dependency** — use inline SVG or canvas with ~30 lines of rendering logic. Keep it minimal for MVP.

### 3.3 Files to Create / Modify (Track B)

| File | Action |
|------|--------|
| `src/server/queries/admin.ts` | **Create** |
| `src/app/admin/page.tsx` | **Modify** — connect to real queries |
| `src/components/admin/StatsCard.tsx` | **Modify** — loading/trend props |
| `src/components/admin/ChartPlaceholder.tsx` | **Modify** — real charts |
| `src/components/admin/RecentActivity.tsx` | **Modify** — accept dynamic data |
| `src/app/admin/performers/page.tsx` | **Create** |
| `src/app/admin/performers/[id]/page.tsx` | **Create** |
| `src/app/admin/videos/page.tsx` | **Create** |
| `src/app/admin/videos/[id]/page.tsx` | **Create** |
| `src/app/admin/tags/page.tsx` | **Create** |
| `src/app/api/admin/stats/route.ts` | **Create** |
| `src/app/api/admin/performers/route.ts` | **Create** |
| `src/app/api/admin/performers/[id]/route.ts` | **Create** |
| `src/app/api/admin/videos/route.ts` | **Create** |
| `src/app/api/admin/videos/[id]/route.ts` | **Create** |
| `src/app/api/admin/tags/route.ts` | **Create** |
| `src/app/api/admin/tags/[id]/route.ts` | **Create** |
| `src/components/admin/DataTable.tsx` | **Create** |
| `src/components/admin/ConfirmDialog.tsx` | **Create** |
| `src/components/admin/StatusBadge.tsx` | **Create** |
| `src/components/admin/EmptyState.tsx` | **Create** |

---

## 4. Track C: Video Infrastructure — R2, HLS, Thumbnails

### 4.1 Current State
- `Video` model has fields for `storageKey`, `hlsPlaylistUrl`, `thumbnailUrl`, `posterUrl`, `thumbnailBlurHash`, `fileSizeBytes`, `originalFilename`, `mimeType`, `width`, `height`, `fps`, `bitrateKbps`
- R2 environment variables defined in `src/env.ts` and `.env.example`:
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- No R2 client code exists
- No upload pipeline
- No video player (gradient placeholder with play button instead)
- No thumbnail generation
- No preview clip generation
- No HLS streaming architecture
- No `media_assets` model in Prisma schema

### 4.2 Prisma Schema — Add `media_assets` Model

The current schema has no `media_assets` table. We need to add it for tracking all media files (thumbnails, previews, HLS segments) associated with a video.

**Add to `prisma/schema.prisma`:**

```prisma
// ─────────────────────────────────────────────
// MediaAsset — Tracks all media files per video
// ─────────────────────────────────────────────

enum AssetType {
  original
  thumbnail
  poster
  preview_clip
  hls_playlist
  hls_segment
  subtitle
}

enum AssetStatus {
  pending
  processing
  ready
  failed
}

model MediaAsset {
  id              String      @id @default(uuid()) @db.Uuid
  videoId         String      @map("video_id") @db.Uuid
  assetType       AssetType   @map("asset_type")
  status          AssetStatus @default(pending)
  fileKey         String      @map("file_key") @db.VarChar(500)    // R2 object key
  fileSizeBytes   BigInt?     @map("file_size_bytes")
  mimeType        String?     @map("mime_type") @db.VarChar(50)
  width           Int?
  height          Int?
  durationSeconds Decimal?    @map("duration_seconds") @db.Decimal(10, 2)
  bitrateKbps     Int?        @map("bitrate_kbps")
  label           String?     @db.VarChar(100)                     // e.g. "720p", "thumbnail-small"
  metadata        Json?       @db.JsonB
  errorMessage    String?     @map("error_message") @db.Text
  processedAt     DateTime?   @map("processed_at") @db.Timestamptz()
  createdAt       DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime    @updatedAt @map("updated_at") @db.Timestamptz()

  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@index([videoId, assetType], map: "idx_media_asset_video_type")
  @@index([status], map: "idx_media_asset_status")
  @@index([fileKey], map: "idx_media_asset_file_key")
  @@map("media_asset")
}
```

### 4.3 Implementation Steps

#### Step C-1: Run Prisma Migration for `media_asset`
```bash
npx prisma migrate dev --name add_media_asset
```

#### Step C-2: Create R2 Client Library
**File to create:** `src/server/storage/r2.ts`

**Dependencies:** `@aws-sdk/client-s3` (R2 is S3-compatible)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Responsibilities:**
1. Create S3 client configured for R2 endpoint
2. Export functions:
   - `uploadFile(buffer, key, contentType)` → upload to R2
   - `getSignedUrl(key, expiresInSeconds)` → temporary access URL
   - `deleteFile(key)` → delete from R2
   - `listFiles(prefix)` → list objects by prefix
   - `getPublicUrl(key)` → construct public R2.dev URL
3. Validate R2 env vars before creating client
4. Set appropriate cache headers for different asset types

**R2 client configuration pattern:**
```typescript
import { S3Client } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  },
});
```

#### Step C-3: Add R2 Environment Variables to `src/env.ts`
**File to modify:** `src/env.ts`

Add `R2_PUBLIC_URL` to the validation schema (already in `.env.example` but missing from env.ts). Make all R2 vars required when `NODE_ENV=production`.

#### Step C-4: Create Video Upload API Route
**File to create:** `src/app/api/admin/videos/upload/route.ts`

**POST endpoint:**
1. Accept `multipart/form-data` with video file + metadata (title, description, performers, tags)
2. Authenticate with `auth()` — require admin or moderator
3. Validate file type (video/mp4, video/webm, etc.) and size (max 2GB)
4. Upload original file to R2 at key: `videos/{videoId}/original.mp4`
5. Create `Video` record with `status: "processing"`, `storageKey`
6. Create initial `MediaAsset` record with `assetType: "original"`, `status: "ready"`
7. **Kick off async processing** (see Step C-5)
8. Return video ID and status

**Key naming convention in R2:**
```
videos/{videoId}/
  original.mp4
  hls/
    playlist.m3u8
    720p.m3u8
    480p.m3u8
    360p.m3u8
  thumbnails/
    small.webp
    medium.webp
    large.webp
    blurhash.txt
  preview/
    preview.mp4
```

#### Step C-5: Create Video Processing Pipeline (Mock/Stub for MVP)
**File to create:** `src/server/video/processor.ts`

For MVP, the processing pipeline will be a **stub** that simulates the real workflow:

```typescript
export async function processVideo(videoId: string): Promise<void> {
  // 1. Update video status to "processing"
  // 2. Simulate thumbnail generation:
  //    - Copy a placeholder thumbnail to R2
  //    - Create MediaAsset records for thumbnails
  // 3. Simulate HLS playlist creation:
  //    - Create MediaAsset for hls_playlist
  // 4. Update video with hlsPlaylistUrl, thumbnailUrl
  // 5. Update video status to "published"
  // 6. Log processing completion
}
```

**Future (Phase 4+):** Replace stub with real FFmpeg-based transcoding:
- Background worker (BullMQ with Redis)
- Actual HLS segmenting with multiple bitrates (720p, 480p, 360p)
- Real thumbnail extraction at keyframes
- Preview clip generation (15s at mid-point)

#### Step C-6: Create Video Player Component
**File to create:** `src/components/video/VideoPlayer.tsx`

**Features:**
1. Use `<video>` element with HLS.js for HLS playback
2. Fallback to native `<video>` for direct MP4 URLs
3. Poster image from `thumbnailUrl`
4. Play/pause, seek, volume controls
5. Fullscreen support
6. Keyboard shortcuts
7. Loading state while HLS initializes
8. Error state if stream fails to load

**HLS.js integration:**
```typescript
"use client";
import Hls from "hls.js";
// On mount: if Hls.isSupported(), attach to video element
// On unmount: destroy Hls instance
```

#### Step C-7: Update Video Detail Page to Use Real Player
**File to modify:** `src/app/(public)/videos/[slug]/page.tsx`

Replace gradient placeholder with `<VideoPlayer>` component:
- Pass `hlsPlaylistUrl` if available
- Fallback to direct MP4 from R2 signed URL
- Show thumbnail as poster while player loads

#### Step C-8: Create Thumbnail Management for Admin
**File to create:** `src/app/api/admin/videos/[id]/thumbnail/route.ts`

**POST:** Upload custom thumbnail image to R2, update video record
**DELETE:** Remove thumbnail, reset to auto-generated

#### Step C-9: Add Admin Video Upload UI
**File to modify:** `src/app/admin/videos/[id]/page.tsx`

Add upload section:
1. File input for video file (drag-and-drop zone)
2. File size/type validation client-side
3. Upload progress bar
4. Processing status indicator
5. Thumbnail upload field
6. Preview of uploaded thumbnail

### 4.4 Files to Create / Modify (Track C)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | **Modify** — add `MediaAsset` model |
| `src/server/storage/r2.ts` | **Create** |
| `src/app/api/admin/videos/upload/route.ts` | **Create** |
| `src/server/video/processor.ts` | **Create** |
| `src/server/video/hls.ts` | **Create** — HLS utilities |
| `src/server/video/thumbnails.ts` | **Create** — thumbnail URL builders |
| `src/components/video/VideoPlayer.tsx` | **Create** |
| `src/components/video/UploadZone.tsx` | **Create** — drag-and-drop upload UI |
| `src/app/(public)/videos/[slug]/page.tsx` | **Modify** — use real player |
| `src/app/api/admin/videos/[id]/thumbnail/route.ts` | **Create** |
| `src/app/admin/videos/[id]/page.tsx` | **Modify** — add upload UI |
| `src/env.ts` | **Modify** — add `R2_PUBLIC_URL` |

---

## 5. Track D: Search Architecture — PostgreSQL Full-Text Search

### 5.1 Current State
- Prisma schema has `pg_trgm` extension enabled
- `searchVideos()` and `searchPerformers()` exist in `src/server/queries/index.ts`
- Both use **LIKE/contains** (not full-text search):
  ```typescript
  { title: { contains: query, mode: "insensitive" } }
  ```
- Search page (`src/app/(public)/search/page.tsx`) uses **client-side filtering** — fetches all videos, filters in browser
- No full-text search indexes on PostgreSQL
- No search ranking/weighting
- No search analytics utilization

### 5.2 Implementation Steps

#### Step D-1: Add Full-Text Search Columns & Indexes
**File to modify:** `prisma/schema.prisma`

**Add to `Video` model:**
```prisma
// Full-text search vector (auto-maintained by PostgreSQL trigger)
searchVector  Unsupported("tsvector")? @map("search_vector")
```

**Add to `Model` model:**
```prisma
searchVector  Unsupported("tsvector")? @map("search_vector")
```

**Custom SQL migration** (Prisma doesn't natively support tsvector):
Create migration file manually:
```
prisma/migrations/xxxx_add_fts/
  migration.sql
```

```sql
-- Add tsvector columns
ALTER TABLE video ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE model ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN indexes
CREATE INDEX IF NOT EXISTS idx_video_search_vector ON video USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_model_search_vector ON model USING GIN(search_vector);

-- Create trigger functions to auto-update search vectors
CREATE OR REPLACE FUNCTION video_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION model_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on INSERT and UPDATE
CREATE TRIGGER trg_video_search_vector
  BEFORE INSERT OR UPDATE OF title, description
  ON video FOR EACH ROW
  EXECUTE FUNCTION video_search_vector_update();

CREATE TRIGGER trg_model_search_vector
  BEFORE INSERT OR UPDATE OF name, bio
  ON model FOR EACH ROW
  EXECUTE FUNCTION model_search_vector_update();

-- Backfill existing data
UPDATE video SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B');

UPDATE model SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(bio, '')), 'B');

-- Also add pg_trgm indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_video_title_trgm ON video USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_model_name_trgm ON model USING GIN(name gin_trgm_ops);
```

**Note:** Since Prisma doesn't support `tsvector` natively, we use `Unsupported("tsvector")` to prevent schema validation errors, and manage the actual column/index via raw SQL migrations.

#### Step D-2: Create Full-Text Search Queries
**File to create:** `src/server/queries/search.ts`

New search functions using PostgreSQL full-text search:

```typescript
export async function searchVideosFullText(options: {
  query: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<{ videos: VideoData[]; total: number }> {
  // Use raw SQL with ts_query for full-text search
  // Use websearch_to_tsquery for better user query parsing
  const sql = `
    SELECT id, title, slug, description, duration_seconds, view_count,
           published_at, thumbnail_url, access_level, is_featured,
           ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS rank
    FROM video
    WHERE status = 'published'
      AND access_level IN ('public', 'premium')
      AND search_vector @@ websearch_to_tsquery('english', $1)
    ORDER BY rank DESC, view_count DESC
    LIMIT $2 OFFSET $3
  `;
  // Execute with prisma.$queryRawUnsafe
  // Map results back to VideoData
}

export async function searchPerformersFullText(query: string): Promise<PerformerData[]> {
  // Similar full-text search on model.search_vector
}
```

**Keep existing `searchVideos()` and `searchPerformers()` as fallback** for when search vector isn't available (e.g., development without migration).

#### Step D-3: Update Search Page to Use Server-Side Search
**File to modify:** `src/app/(public)/search/page.tsx`

1. Convert page to accept search params from URL: `?q=query&tag=tag&page=1`
2. Call `searchVideosFullText()` on the server
3. Implement pagination via URL params (not client-side slicing)
4. Remove client-side filtering logic
5. Keep URL-based state for shareability and SEO

**Search flow:**
```
User types → URL updates (?q=...) → Page re-renders server-side → Results from PostgreSQL FTS
```

#### Step D-4: Add Search Suggestions API (Optional MVP)
**File to create:** `src/app/api/search/suggestions/route.ts`

**GET endpoint:** Accept `?q=partial_query`, return top 5 matching titles/names using pg_trgm similarity:
```sql
SELECT title, slug
FROM video
WHERE status = 'published'
  AND title % $1  -- Trigram similarity
ORDER BY similarity(title, $1) DESC
LIMIT 5
```

### 5.3 Search Ranking Strategy

| Factor | Weight | Implementation |
|--------|--------|----------------|
| Title match | A (highest) | `setweight(to_tsvector(title), 'A')` |
| Description match | B | `setweight(to_tsvector(description), 'B')` |
| View count | Boost | `ORDER BY rank DESC, view_count DESC` |
| Published date | Boost fresh content | Incorporate into ranking in future phase |
| Tag match | Via JOIN | Extend search_vector to include tag names (future) |
| Performer name match | Via JOIN | Extend search_vector to include performer names (future) |

### 5.4 Files to Create / Modify (Track D)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | **Modify** — add `searchVector` fields |
| `prisma/migrations/xxxx_add_fts/migration.sql` | **Create** — FTS migration SQL |
| `src/server/queries/search.ts` | **Create** |
| `src/app/(public)/search/page.tsx` | **Modify** — use server-side FTS |
| `src/app/api/search/suggestions/route.ts` | **Create** (optional MVP) |

---

## 6. Track E: Deployment Architecture — GitHub, Vercel, PostgreSQL

### 6.1 Current State
- No GitHub repository configured
- No Vercel project
- No production PostgreSQL host
- `.env.example` exists but no `.env.production` template
- No CI/CD pipeline
- No `vercel.json` configuration

### 6.2 Implementation Steps

#### Step E-1: GitHub Repository Setup
1. Create GitHub repository (`vanta-platform` or keep as `vanta`)
2. Initialize git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Phase 1-2: Public UI + Database schema with Prisma"
   git branch -M main
   git remote add origin git@github.com:organization/vanta.git
   git push -u origin main
   ```
3. Configure branch protection:
   - `main` branch: require PR reviews, require status checks
   - No direct pushes to `main`
4. Create issue templates for: bug report, feature request, RFC
5. Create PR template with checklist

**Repo structure check:**
- `.gitignore` already exists (verify it covers: `.env.local`, `.env.production`, `node_modules`, `.next`, `prisma/generated`)

#### Step E-2: Configure Vercel Project
1. Import GitHub repository to Vercel
2. Configure framework preset: **Next.js**
3. Set build command: `npx prisma generate && next build`
4. Set output directory: `.next`
5. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL` — production PostgreSQL URL
   - `AUTH_SECRET` — random 64-char string
   - `AUTH_URL` — Vercel deployment URL (use `https://${VERCEL_URL}`)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
   - `NEXT_PUBLIC_APP_URL` — Vercel deployment URL
   - `NEXT_PUBLIC_APP_NAME` — "Vanta"
   - `NEXT_PUBLIC_DEFAULT_THEME` — "dark"

**Create file:** `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_APP_NAME": "Vanta",
    "NEXT_PUBLIC_DEFAULT_THEME": "dark"
  }
}
```

**Important:** The build command must run `npx prisma generate` before `next build` so that the Prisma client types are available during compilation.

#### Step E-3: Configure PostgreSQL Hosting for MVP

**Option A: Neon (Recommended for MVP)**
- Serverless PostgreSQL with free tier
- Connection pooling via `?pgbouncer=true`
- Instant provisioning, no server management
- Good for Vercel deployments (low latency from Vercel regions)

**Option B: Railway**
- Managed PostgreSQL
- Simple setup, free tier available
- Built-in connection pooling

**Option C: Supabase**
- PostgreSQL + auth + storage bundled
- Slightly more complex but provides migration path for auth

**Decision: Neon** for MVP due to:
- Best serverless PostgreSQL performance for Vercel
- Connection pooling built-in (no PgBouncer setup)
- Free tier sufficient for MVP
- `prisma migrate` works directly

**Configuration:**
```env
# Neon connection string (with pooling)
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/vanta?sslmode=require&pgbouncer=true"
```

#### Step E-4: Create `.env.production` Template
**File to create:** `.env.production.example`

Template with all production-required variables (no secrets, just keys):
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/vanta_prod?sslmode=require"

# NextAuth
AUTH_SECRET="set-this-in-vercel-dashboard"
AUTH_URL="https://your-app.vercel.app"

# Cloudflare R2
R2_ACCOUNT_ID="set-this-in-vercel-dashboard"
R2_ACCESS_KEY_ID="set-this-in-vercel-dashboard"
R2_SECRET_ACCESS_KEY="set-this-in-vercel-dashboard"
R2_BUCKET_NAME="vanta-prod"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# Application
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_NAME="Vanta"
NEXT_PUBLIC_DEFAULT_THEME="dark"
```

#### Step E-5: Create Database Migration & Seed Strategy for Production

1. **Migration workflow:**
   ```bash
   # Local development
   npx prisma migrate dev --name add_feature_x
   
   # After PR merge, run in CI/CD
   npx prisma migrate deploy --preview-feature
   ```

2. **Seed script for production:**
   - Create `prisma/seed.prod.ts` — minimal seed (only admin user + essential tag groups)
   - Run separately via manual trigger or migration hook

3. **CI/CD migration step** — add to Vercel build or GitHub Actions:
   ```yaml
   # .github/workflows/migrate.yml
   name: Database Migrate
   on:
     push:
       branches: [main]
   jobs:
     migrate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npx prisma migrate deploy
           env:
             DATABASE_URL: ${{ secrets.DATABASE_URL }}
   ```

#### Step E-6: Add Prisma Post-Deployment Migration to Vercel Build

**File to modify:** `package.json`

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**Note:** Use `prisma migrate deploy` (not `dev`) — it only applies pending migrations safely, never resets data.

#### Step E-7: Configure Production Readiness

**File to create:** `next.config.ts` — review and update

Ensure the following are configured:
```typescript
// next.config.ts
const nextConfig = {
  // ... existing config
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",  // Allow R2 images
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",  // Public R2 bucket
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2gb", // For video uploads via server actions
    },
  },
};
```

#### Step E-8: Create Deployment Documentation

**File to create:** `docs/DEPLOYMENT.md`

Sections:
1. Prerequisites (accounts needed: GitHub, Vercel, Neon, Cloudflare)
2. Step-by-step deployment guide
3. Environment variables reference
4. Database migration workflow
5. Monitoring & alerting setup
6. Rollback procedure
7. Backup & restore

### 6.3 Files to Create / Modify (Track E)

| File | Action |
|------|--------|
| `vercel.json` | **Create** |
| `.env.production.example` | **Create** |
| `.github/workflows/migrate.yml` | **Create** |
| `.github/workflows/ci.yml` | **Create** — lint + type-check on PR |
| `package.json` | **Modify** — add `vercel-build` script |
| `next.config.ts` | **Modify** — image domains, upload limits |
| `docs/DEPLOYMENT.md` | **Create** |

---

## 7. Implementation Order & Dependencies

### Dependency Graph

```
Track A (Auth) ──────────────────┐
                                  ├── Track B (Admin CRUD)
Track D (Search FTS) ────────────┘
                                       
Track C (Video Infrastructure) ── Independent, but admin upload needs Auth
                                       
Track E (Deployment) ──────────── Runs in parallel, finalize last
```

### Recommended Sprint Plan

#### Sprint 1 (Week 1-2): Foundation
| Day | Focus | Deliverables |
|-----|-------|-------------|
| 1-2 | Track A: Auth config | `src/auth.ts`, route handler, middleware |
| 3-4 | Track A: Login page | Admin login UI with error/loading states |
| 5 | Track D: FTS migration | SQL migration, search_vector columns |
| 6-7 | Track D: FTS queries | `src/server/queries/search.ts` |
| 8-10 | Track E: GitHub + Vercel | Repo setup, Vercel project, Neon DB |

**Gate:** Auth working, search connected to server-side, project deployable

#### Sprint 2 (Week 3-4): Admin Core
| Day | Focus | Deliverables |
|-----|-------|-------------|
| 1-3 | Track B: Dashboard | Real stats queries, chart components |
| 4-6 | Track B: Performer CRUD | List, create, edit, delete with API routes |
| 7-10 | Track B: Tag CRUD | List, create, edit, delete with API routes |

**Gate:** Admin dashboard shows real data, performer & tag management working

#### Sprint 3 (Week 5-6): Admin Video + R2
| Day | Focus | Deliverables |
|-----|-------|-------------|
| 1-2 | Track B: Video management | List, status filters, edit form |
| 3-4 | Track C: R2 client | S3 client, upload/download, signed URLs |
| 5-6 | Track C: Upload API | Upload route, MediaAsset creation |
| 7-8 | Track C: Video player | HLS.js component, poster/thumbnail |
| 9-10 | Track C: Processing stub | Simulated thumbnail + HLS pipeline |

**Gate:** Video upload works, player renders HLS content

#### Sprint 4 (Week 7-8): Polish & Deploy
| Day | Focus | Deliverables |
|-----|-------|-------------|
| 1-2 | Track B: Admin UI polish | DataTable, ConfirmDialog, StatusBadge, EmptyState |
| 3-4 | Track C: Thumbnail management | Upload/replace thumbnails in admin |
| 5-6 | Track E: CI/CD + docs | GitHub Actions, deployment guide |
| 7-8 | Integration testing | Full flow: upload → process → search → watch |
| 9-10 | Bug fixes, edge cases | Error boundaries, loading states, empty states |

**Gate:** Production-ready deployment

---

## 8. Risk Register & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Auth.js v5 API instability** (beta) | Medium | High | Pin version, monitor Auth.js changelog, test credentials flow thoroughly |
| 2 | **R2 signed URL expiration** for video streaming | Medium | Medium | Use long-lived URLs for HLS segments (7-day), short-lived for uploads (1-hour) |
| 3 | **Large video uploads timing out** on Vercel (10s limit) | High | High | Use direct-to-R2 upload (presigned URLs) instead of proxying through Vercel |
| 4 | **PostgreSQL connection pooling** with Neon + Prisma | Medium | Medium | Use `?pgbouncer=true` in connection string, configure connection limit in Prisma |
| 5 | **FTS migration complexity** (tsvector + triggers) | Low | Medium | Test migration SQL on staging DB first; have rollback script ready |
| 6 | **HLS playback compatibility** across browsers | Low | Medium | Use HLS.js with fallback to native `<video>`, test on Chrome/Firefox/Safari |
| 7 | **Admin permissions too coarse** | Low | Medium | Implement role checking at both middleware and API levels; verify every protected route |
| 8 | **Seed data lost on production migrate** | Low | High | Separate seed scripts (dev vs prod); never run dev seed on production |

---

## 9. Success Criteria

### Track A — Authentication
- [ ] Admin login page renders at `/admin/login` with email/password form
- [ ] Valid credentials create a session and redirect to `/admin`
- [ ] Invalid credentials show error message
- [ ] Banned/disabled users are rejected at login
- [ ] Middleware redirects unauthenticated users from `/admin/*` to `/admin/login`
- [ ] Admin layout checks role and shows appropriate navigation
- [ ] Session persists across page reloads (JWT cookie)
- [ ] Logout clears session

### Track B — Admin Panel
- [ ] Dashboard shows real database counts (not hardcoded)
- [ ] Performer list/tables are populated from database
- [ ] Can create, edit, and delete performers
- [ ] Can create, edit, and delete tags
- [ ] Can change video status (publish, archive, reject)
- [ ] Can associate/dissociate tags and performers with videos
- [ ] All admin API routes return proper auth errors (401/403)
- [ ] Empty states show helpful messages (not broken UI)

### Track C — Video Infrastructure
- [ ] R2 client successfully connects and lists buckets
- [ ] Upload API accepts video files and stores in R2
- [ ] `MediaAsset` records are created for uploaded files
- [ ] Video player component renders and plays HLS streams
- [ ] Video detail page shows real player (not gradient placeholder)
- [ ] Thumbnails display in video cards and detail pages
- [ ] Processing pipeline stub creates MediaAsset records

### Track D — Search
- [ ] Full-text search returns relevant video results ranked by title > description > view count
- [ ] Search page uses server-side `searchVideosFullText()` (not client-side filtering)
- [ ] Pagination works correctly with search results
- [ ] Search handles special characters and empty queries gracefully
- [ ] Trigram indexes provide fuzzy matching for near-miss queries

### Track E — Deployment
- [ ] GitHub repository configured with branch protection
- [ ] Vercel project deploys successfully from `main` branch
- [ ] PostgreSQL (Neon) is connected and migrations run on deploy
- [ ] Environment variables are configured in Vercel dashboard (not committed)
- [ ] CI workflow runs lint + type-check on PRs
- [ ] CD workflow runs database migrations on merge to main
- [ ] Application loads and functions in production environment
- [ ] Deployment documentation covers setup, migration, and rollback

---

## 10. Files to Create / Modify — Complete Summary

### New Files to Create

```
src/auth.ts
src/server/auth.ts
src/lib/auth-helpers.ts
src/server/queries/admin.ts
src/server/queries/search.ts
src/server/storage/r2.ts
src/server/video/processor.ts
src/server/video/hls.ts
src/server/video/thumbnails.ts
src/components/video/VideoPlayer.tsx
src/components/video/UploadZone.tsx
src/components/admin/DataTable.tsx
src/components/admin/ConfirmDialog.tsx
src/components/admin/StatusBadge.tsx
src/components/admin/EmptyState.tsx
src/middleware.ts
vercel.json
.env.production.example
docs/DEPLOYMENT.md
prisma/migrations/xxxx_add_fts/migration.sql
.github/workflows/migrate.yml
.github/workflows/ci.yml
```

### Routes (App Router) to Create

```
src/app/api/auth/[...nextauth]/route.ts
src/app/api/admin/stats/route.ts
src/app/api/admin/performers/route.ts
src/app/api/admin/performers/[id]/route.ts
src/app/api/admin/videos/route.ts
src/app/api/admin/videos/[id]/route.ts
src/app/api/admin/videos/[id]/thumbnail/route.ts
src/app/api/admin/videos/upload/route.ts
src/app/api/admin/tags/route.ts
src/app/api/admin/tags/[id]/route.ts
src/app/api/search/suggestions/route.ts
```

### Admin Pages to Create

```
src/app/admin/login/page.tsx
src/app/admin/performers/page.tsx
src/app/admin/performers/[id]/page.tsx
src/app/admin/videos/page.tsx
src/app/admin/videos/[id]/page.tsx
src/app/admin/tags/page.tsx
```

### Existing Files to Modify

```
src/app/admin/layout.tsx          → Add auth check
src/app/admin/page.tsx            → Real DB queries
src/app/(public)/search/page.tsx  → Server-side FTS
src/app/(public)/videos/[slug]/page.tsx → Real video player
src/components/admin/StatsCard.tsx → Loading/trend props
src/components/admin/ChartPlaceholder.tsx → Real charts
src/components/admin/RecentActivity.tsx → Dynamic data
prisma/schema.prisma              → MediaAsset model + searchVector fields
prisma/seed.ts                    → Hashed passwords
src/env.ts                        → R2_PUBLIC_URL, require in prod
next.config.ts                    → Image domains, upload limits
package.json                      → vercel-build script
```

---

**End of Phase 3 Implementation Roadmap**
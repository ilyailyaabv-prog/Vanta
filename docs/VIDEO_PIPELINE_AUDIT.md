# Video Pipeline Audit — Phase 3.5

> Generated: 2026-06-22
> Scope: Complete video upload vertical (MP4, no HLS/FFmpeg/transcoding)

## What Is Fully Working

### 1. Video Source Upload (Admin API)

- **`POST /api/admin/media/upload-video`** — accepts MP4 file upload
  - Multi-part form data with `file` + `videoId`
  - Validates MIME type (`video/mp4` only)
  - Validates file size against `MAX_VIDEO_UPLOAD_SIZE` env (default 500 MB)
  - Uploads original file to Cloudflare R2 under `videos/{videoId}/source_{uuid}.mp4`
  - Creates `MediaAsset` record with `assetType = VIDEO_SOURCE`
  - Links asset to the `Video` via `videoId` foreign key
  - Returns `{ url, mediaAsset }` with the public R2 URL

### 2. Video Management UI (Admin)

- **`VideoUploader` component** (`src/components/admin/VideoUploader.tsx`)
  - Upload button with file picker (`.mp4` only)
  - Real-time upload progress bar (via XMLHttpRequest)
  - Inline HTML5 `<video>` preview with playback controls
  - Displays current file name
  - "Replace Video" button triggers re-upload
  - "Delete" button removes the media asset via `DELETE /api/admin/media/[id]`
  - Proper error handling for invalid types, size limits, network failures

- **Integrated into `EditVideoPage`** (`src/app/admin/videos/[id]/page.tsx`)
  - Video uploader appears before the thumbnail uploader
  - Loads existing video source on page mount via `GET /api/admin/videos/[id]/media`
  - State management for `videoUrl` and `videoFileName`

### 3. Public Video Playback

- **`/videos/[slug]` page** (`src/app/(public)/videos/[slug]/page.tsx`)
  - Loads the primary `VIDEO_SOURCE` media asset via `getPrimaryVideoSource(video.id)`
  - Resolves public URL via `storage.getPublicUrl(storageKey)`
  - Renders native HTML5 `<video>` element with controls
  - Uses video thumbnail as `poster` if available
  - Falls back to gradient placeholder when no video source is uploaded
  - No placeholder player, no fake playback logic

### 4. Database Queries

- **`getVideoAssets(videoId)`** (`src/server/queries/index.ts`)
  - Returns all `MediaAsset` records for a video, ordered by `createdAt desc`
  - Includes id, assetType, fileName, mimeType, fileSize, storageKey, storageProvider, width, height, duration

- **`getPrimaryVideoSource(videoId)`**
  - Returns the most recent `VIDEO_SOURCE` media asset for a video
  - Uses `findFirst` with `assetType: "VIDEO_SOURCE"`, ordered by `createdAt desc`

### 5. Media API Updates

- **`GET /api/admin/videos/[id]/media`** now returns `publicUrl` for each asset
  - Derives public URL from storage key via `storage.getPublicUrl()`

### 6. Validation

| Aspect                | Status |
|-----------------------|--------|
| Allowed formats       | MP4 only (`video/mp4`) |
| Max upload size       | Configurable via `MAX_VIDEO_UPLOAD_SIZE` env var (default 500 MB) |
| Auth required         | Admin with `canManageVideos` role |
| Error responses       | 403 (unauthorized), 404 (not found), 422 (validation), 500 (server error) |

## What Remains Stubbed / Placeholder

| Item | Status | Notes |
|------|--------|-------|
| Duration metadata | Not captured | Upload does not read video duration; stored as `null` in MediaAsset |
| Resolution metadata | Not captured | Width/height not extracted from uploaded file |
| Thumbnail generation | Not implemented | Relies on manual upload via ThumbnailUploader |
| Video status transition | Manual | Status must be manually set to `published` after upload |
| File size display | Client-side only | Server returns size but not formatted for display |

## What Still Requires FFmpeg / HLS Later

These features are **not implemented** and will require FFmpeg processing + HLS packaging:

| Feature | Why FFmpeg Needed | Priority |
|---------|-------------------|----------|
| **HLS transcoding** | Convert MP4 to HLS (m3u8 + .ts segments) for adaptive bitrate streaming | High |
| **Transcoded resolution variants** | Generate 360p, 480p, 720p, 1080p renditions | Medium |
| **Thumbnail auto-generation** | Extract frames from video at timestamps | Medium |
| **Duration extraction** | Read `ffprobe` output to populate `durationSeconds` + MediaAsset.duration | Low |
| **Resolution detection** | Read `ffprobe` output for width/height | Low |
| **Poster frame extraction** | Extract single frame to use as video poster | Low |
| **Video processing status** | Update Video.status = `processing` → `published` after FFmpeg completes | Medium |
| **Audio track detection** | Use ffprobe to set `hasAudio` flag | Low |

## Pipeline Data Flow

```
Admin uploads MP4
       │
       ▼
POST /api/admin/media/upload-video
       │
       ├── Validates type (.mp4) & size (env config)
       ├── Uploads to R2: videos/{videoId}/source_{uuid}.mp4
       ├── Creates MediaAsset (assetType=VIDEO_SOURCE)
       └── Returns public URL
              │
              ▼
       VideoUploader component shows preview
              │
              ▼
       Public /videos/[slug] page
              │
              ├── getPrimaryVideoSource(videoId) queries DB
              ├── storage.getPublicUrl(storageKey) resolves R2 URL
              └── Renders <video src={url} controls />
```

## File Inventory

| File | Purpose |
|------|---------|
| `src/app/api/admin/media/upload-video/route.ts` | Video upload API endpoint |
| `src/components/admin/VideoUploader.tsx` | Admin upload UI with progress |
| `src/app/(public)/videos/[slug]/page.tsx` | Public video player page |
| `src/server/queries/index.ts` | `getVideoAssets`, `getPrimaryVideoSource` queries |
| `src/app/api/admin/videos/[id]/media/route.ts` | Media listing with public URLs |
| `src/env.ts` | `MAX_VIDEO_UPLOAD_SIZE` env var |
| `src/app/admin/videos/[id]/page.tsx` | Admin edit page with video uploader integrated |

## Build Status

- TypeScript: Passes
- Prisma client: Generated with `mediaAsset` model
- Storage adapter: R2 with S3-compatible API
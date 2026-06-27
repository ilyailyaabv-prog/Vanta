# Vanta — PostgreSQL Database Design Document

**Version:** 1.0.0  
**Date:** 2026-06-16  
**Status:** Approved for Implementation  

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Naming Conventions](#2-naming-conventions)
3. [Entity Relationship Overview](#3-entity-relationship-overview)
4. [Table Definitions](#4-table-definitions)
   - [4.1 User](#41-user)
   - [4.2 UserProfile](#42-userprofile)
   - [4.3 Video](#43-video)
   - [4.4 Model](#44-model)
   - [4.5 ModelAlias](#45-modelalias)
   - [4.6 TagGroup](#46-taggroup)
   - [4.7 Tag](#47-tag)
   - [4.8 VideoTag](#48-videotag)
   - [4.9 VideoModel](#49-videomodel)
   - [4.10 Advertisement](#410-advertisement)
   - [4.11 AdvertisementStats](#411-advertisementstats)
   - [4.12 VideoView](#412-videoview)
   - [4.13 SearchQuery](#413-searchquery)
   - [4.14 Report](#414-report)
   - [4.15 ModeratorAction](#415-moderatoraction)
   - [4.16 Favorite](#416-favorite)
   - [4.17 WatchHistory](#417-watchhistory)
5. [Index Strategy](#5-index-strategy)
6. [Partitioning Strategy](#6-partitioning-strategy)
7. [Query Patterns & Optimization](#7-query-patterns--optimization)
8. [Scalability Considerations](#8-scalability-considerations)

---

## 1. Design Principles

### Normalization
- All tables are in **3NF (Third Normal Form)**.
- No transitive dependencies — every non-key column depends solely on the primary key.
- Repeating groups are extracted into junction tables.

### Data Integrity
- **Primary Keys**: UUID v4 for all entities (distributed-friendly, no sequential guessing).
- **Foreign Keys**: Every FK has an associated index. ON DELETE behavior is explicitly defined per relationship.
- **Constraints**: NOT NULL, CHECK, and UNIQUE constraints enforced at the database level.
- **Timestamps**: Every table includes `created_at` and `updated_at` for audit trail.

### Avoidance of Duplicate Data
- Tags are normalized into a single `Tag` table, reused across videos via the `VideoTag` junction table.
- Model aliases are stored in a separate `ModelAlias` table rather than denormalized into the `Model` table.
- User identity lives in `User`; optional extended profile data lives in `UserProfile` (vertical partitioning).

### Scalability
- UUID primary keys prevent hotspots common with auto-increment IDs.
- Composite indexes are carefully ordered to support the most frequent query patterns.
- High-volume tables (`VideoView`, `SearchQuery`, `WatchHistory`) are candidates for **time-based partitioning**.
- Junction tables use composite primary keys for efficient lookups without extra indexes.

---

## 2. Naming Conventions

| Convention | Rule | Example |
|---|---|---|
| **Table names** | snake_case, plural | `video_tags` |
| **Column names** | snake_case, singular | `is_published` |
| **Primary keys** | `id` (UUID) | `id UUID PRIMARY KEY` |
| **Foreign keys** | `{referenced_table}_id` | `video_id` |
| **Junction tables** | alphabetical concatenation | `video_tag`, `video_model` |
| **Unique constraints** | `uq_{table}_{columns}` | `uq_user_email` |
| **Indexes** | `idx_{table}_{columns}` | `idx_video_published_at` |
| **Check constraints** | `ck_{table}_{description}` | `ck_video_duration_positive` |

---

## 3. Entity Relationship Overview

```
User ──1:1── UserProfile
User ──1:N── VideoView
User ──1:N── SearchQuery
User ──1:N── Report (as reporter)
User ──1:N── Favorite
User ──1:N── WatchHistory

Video ──N:M── Tag (via VideoTag)
Video ──N:M── Model (via VideoModel)
Video ──1:N── VideoView
Video ──1:N── Report
Video ──1:N── Favorite
Video ──1:N── WatchHistory
Video ──1:N── Advertisement

Model ──1:N── ModelAlias
Model ──N:M── Video (via VideoModel)

TagGroup ──1:N── Tag
Tag ──N:M── Video (via VideoTag)

Advertisement ──1:1── AdvertisementStats

Report ──N:1── ModeratorAction (handled by moderator)
User ──1:N── ModeratorAction (as moderator)
```

---

## 4. Table Definitions

### 4.1 User

Core authentication and identity record. Separated from `UserProfile` to keep auth-critical columns separate from optional profile data.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Login email |
| `email_verified_at` | `TIMESTAMPTZ` | `NULL` | When email was confirmed |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hash (cost 12) |
| `role` | `VARCHAR(20)` | `NOT NULL DEFAULT 'user'` | `user`, `moderator`, `admin`, `superadmin` |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Soft disable account |
| `is_banned` | `BOOLEAN` | `NOT NULL DEFAULT false` | Ban status |
| `banned_at` | `TIMESTAMPTZ` | `NULL` | When ban was applied |
| `ban_reason` | `TEXT` | `NULL` | Reason for ban |
| `last_login_at` | `TIMESTAMPTZ` | `NULL` | Last successful login |
| `locale` | `VARCHAR(10)` | `NOT NULL DEFAULT 'en'` | Preferred language |
| `theme_preference` | `VARCHAR(10)` | `NOT NULL DEFAULT 'dark'` | `dark` or `light` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_user_email` | `email` | UNIQUE B-tree | Login lookup |
| `idx_user_role` | `role` | B-tree | Role-based queries |
| `idx_user_is_active` | `is_active` | Partial B-tree WHERE `is_active = true` | Active user queries |

**Relations:**
- `User` 1:1 → `UserProfile` (user_id FK)
- `User` 1:N → `VideoView` (user_id FK)
- `User` 1:N → `SearchQuery` (user_id FK)
- `User` 1:N → `Report` (reporter_id FK)
- `User` 1:N → `Favorite` (user_id FK)
- `User` 1:N → `WatchHistory` (user_id FK)
- `User` 1:N → `ModeratorAction` (moderator_id FK)

---

### 4.2 UserProfile

Optional extended profile data, vertically partitioned from `User` to keep the User table lean.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `user_id` | `UUID` | `FK → User(id) ON DELETE CASCADE, UNIQUE` | Owning user |
| `username` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Public display handle |
| `display_name` | `VARCHAR(100)` | `NULL` | Full display name |
| `bio` | `TEXT` | `NULL` | User biography |
| `avatar_url` | `VARCHAR(500)` | `NULL` | Profile picture URL |
| `banner_url` | `VARCHAR(500)` | `NULL` | Profile banner URL |
| `birth_date` | `DATE` | `NULL` | Date of birth (age verification) |
| `country_code` | `CHAR(2)` | `NULL` | ISO 3166-1 alpha-2 |
| `website_url` | `VARCHAR(500)` | `NULL` | Personal website |
| `social_links` | `JSONB` | `NULL` | Social media links (key-value) |
| `is_public` | `BOOLEAN` | `NOT NULL DEFAULT true` | Profile visibility |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_user_profile_user_id` | `user_id` | UNIQUE B-tree | 1:1 lookup |
| `idx_user_profile_username` | `username` | UNIQUE B-tree | Username-based queries |

**Relations:**
- `UserProfile` N:1 → `User`

---

### 4.3 Video

Core content entity. Stores all metadata about a video.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Video title |
| `slug` | `VARCHAR(300)` | `UNIQUE, NOT NULL` | URL-friendly identifier |
| `description` | `TEXT` | `NULL` | Video description |
| `duration_seconds` | `INTEGER` | `NOT NULL, CHECK (duration_seconds > 0)` | Duration in seconds |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'processing'` | `draft`, `processing`, `published`, `archived`, `rejected` |
| `access_level` | `VARCHAR(20)` | `NOT NULL DEFAULT 'public'` | `public`, `unlisted`, `private`, `premium` |
| `storage_key` | `VARCHAR(500)` | `NOT NULL` | R2 object key for source file |
| `hls_playlist_url` | `VARCHAR(500)` | `NULL` | HLS manifest URL |
| `thumbnail_url` | `VARCHAR(500)` | `NULL` | Thumbnail image URL |
| `thumbnail_blur_hash` | `VARCHAR(50)` | `NULL` | Placeholder blur hash |
| `poster_url` | `VARCHAR(500)` | `NULL` | Poster frame URL |
| `file_size_bytes` | `BIGINT` | `NOT NULL` | Source file size |
| `original_filename` | `VARCHAR(500)` | `NULL` | Uploaded filename |
| `mime_type` | `VARCHAR(50)` | `NOT NULL DEFAULT 'video/mp4'` | Original MIME type |
| `width` | `INTEGER` | `NULL` | Video width in pixels |
| `height` | `INTEGER` | `NULL` | Video height in pixels |
| `fps` | `NUMERIC(5,2)` | `NULL` | Frames per second |
| `bitrate_kbps` | `INTEGER` | `NULL` | Video bitrate |
| `has_audio` | `BOOLEAN` | `NOT NULL DEFAULT true` | Whether audio track exists |
| `is_hardcore` | `BOOLEAN` | `NOT NULL DEFAULT false` | Content rating flag |
| `is_featured` | `BOOLEAN` | `NOT NULL DEFAULT false` | Featured/promoted |
| `view_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized view counter |
| `like_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized like counter |
| `dislike_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized dislike counter |
| `favorite_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized favorite counter |
| `comment_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized comment counter |
| `avg_rating` | `NUMERIC(3,2)` | `NOT NULL DEFAULT 0` | Denormalized average rating |
| `rating_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized rating count |
| `uploaded_by_user_id` | `UUID` | `FK → User(id) ON DELETE SET NULL` | Uploader (nullable for system uploads) |
| `published_at` | `TIMESTAMPTZ` | `NULL` | When published |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_video_slug` | `slug` | UNIQUE B-tree | URL lookup |
| `idx_video_status_published_at` | `status, published_at DESC` | B-tree | Published video feed |
| `idx_video_access_level` | `access_level` | B-tree | Access filtering |
| `idx_video_published_at` | `published_at DESC` | B-tree | Chronological listing |
| `idx_video_view_count` | `view_count DESC` | B-tree | Trending/popular |
| `idx_video_avg_rating` | `avg_rating DESC` | B-tree | Top-rated |
| `idx_video_featured` | `is_featured` | Partial B-tree WHERE `is_featured = true` | Featured queries |
| `idx_video_uploader` | `uploaded_by_user_id` | B-tree | User's uploaded videos |
| `idx_video_title_trgm` | `title` | GIN trigram | Fuzzy title search |

**Relations:**
- `Video` N:M → `Tag` (via `VideoTag`)
- `Video` N:M → `Model` (via `VideoModel`)
- `Video` 1:N → `VideoView`
- `Video` 1:N → `Report`
- `Video` 1:N → `Favorite`
- `Video` 1:N → `WatchHistory`
- `Video` 1:N → `Advertisement`

---

### 4.4 Model

Represents a talent/model profile. Independent from `User` — a model may or may not have a platform account.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `name` | `VARCHAR(200)` | `NOT NULL` | Primary/stage name |
| `slug` | `VARCHAR(250)` | `UNIQUE, NOT NULL` | URL-friendly identifier |
| `bio` | `TEXT` | `NULL` | Biography/description |
| `avatar_url` | `VARCHAR(500)` | `NULL` | Photo URL |
| `banner_url` | `VARCHAR(500)` | `NULL` | Banner image URL |
| `gender` | `VARCHAR(10)` | `NULL` | Gender identity |
| `birth_date` | `DATE` | `NULL` | Date of birth |
| `country_code` | `CHAR(2)` | `NULL` | ISO country code |
| `height_cm` | `INTEGER` | `NULL` | Height in cm |
| `measurements` | `VARCHAR(50)` | `NULL` | Body measurements |
| `ethnicity` | `VARCHAR(50)` | `NULL` | Ethnicity |
| `hair_color` | `VARCHAR(30)` | `NULL` | Hair color |
| `eye_color` | `VARCHAR(30)` | `NULL` | Eye color |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Whether actively producing |
| `is_verified` | `BOOLEAN` | `NOT NULL DEFAULT false` | Verified status |
| `featured_until` | `TIMESTAMPTZ` | `NULL` | Featured expiry |
| `video_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized count |
| `total_views` | `BIGINT` | `NOT NULL DEFAULT 0` | Denormalized view sum |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_model_slug` | `slug` | UNIQUE B-tree | URL lookup |
| `idx_model_name_trgm` | `name` | GIN trigram | Fuzzy name search |
| `idx_model_is_active_verified` | `is_active, is_verified` | B-tree | Active & verified filter |
| `idx_model_total_views` | `total_views DESC` | B-tree | Popular models |
| `idx_model_featured_until` | `featured_until` | Partial B-tree WHERE `featured_until IS NOT NULL` | Featured models |

**Relations:**
- `Model` 1:N → `ModelAlias`
- `Model` N:M → `Video` (via `VideoModel`)

---

### 4.5 ModelAlias

Alternative names/stage names for a model. Supports search discovery under multiple names.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `model_id` | `UUID` | `FK → Model(id) ON DELETE CASCADE, NOT NULL` | Parent model |
| `alias` | `VARCHAR(200)` | `NOT NULL` | Alternative name |
| `is_primary` | `BOOLEAN` | `NOT NULL DEFAULT false` | Whether this is the primary alias |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_model_alias_model_id` | `model_id` | B-tree | Fetch all aliases for a model |
| `idx_model_alias_alias_trgm` | `alias` | GIN trigram | Search by alias |

**Relations:**
- `ModelAlias` N:1 → `Model`

---

### 4.6 TagGroup

Categorizes tags into logical groups for UI filtering.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `name` | `VARCHAR(100)` | `UNIQUE, NOT NULL` | Group name (e.g., "Category", "Category", "Tags") |
| `slug` | `VARCHAR(120)` | `UNIQUE, NOT NULL` | URL-friendly identifier |
| `description` | `TEXT` | `NULL` | Group description |
| `sort_order` | `INTEGER` | `NOT NULL DEFAULT 0` | Display ordering |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Visibility toggle |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_tag_group_slug` | `slug` | UNIQUE B-tree | URL lookup |
| `idx_tag_group_sort_order` | `sort_order` | B-tree | Ordered listing |

**Relations:**
- `TagGroup` 1:N → `Tag`

---

### 4.7 Tag

Individual tag for categorizing and filtering content.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `tag_group_id` | `UUID` | `FK → TagGroup(id) ON DELETE RESTRICT, NOT NULL` | Parent group |
| `name` | `VARCHAR(100)` | `NOT NULL` | Tag label |
| `slug` | `VARCHAR(120)` | `UNIQUE, NOT NULL` | URL-friendly identifier |
| `description` | `TEXT` | `NULL` | Tag description |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Visibility toggle |
| `video_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Denormalized count |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_tag_slug` | `slug` | UNIQUE B-tree | URL lookup |
| `idx_tag_tag_group_id` | `tag_group_id` | B-tree | Tags by group |
| `idx_tag_name_trgm` | `name` | GIN trigram | Tag autocomplete |

**Constraints:**
- `uq_tag_group_name`: `UNIQUE (tag_group_id, name)` — no duplicate tag names within a group.

**Relations:**
- `Tag` N:1 → `TagGroup`
- `Tag` N:M → `Video` (via `VideoTag`)

---

### 4.8 VideoTag

Junction table linking videos to tags (many-to-many).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `video_id` | `UUID` | `FK → Video(id) ON DELETE CASCADE` | Video reference |
| `tag_id` | `UUID` | `FK → Tag(id) ON DELETE RESTRICT` | Tag reference |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | When association was made |

**Primary Key:** `(video_id, tag_id)`

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_video_tag_video_id` | `video_id` | B-tree | All tags for a video |
| `idx_video_tag_tag_id` | `tag_id` | B-tree | All videos for a tag |

**Relations:**
- `VideoTag` N:1 → `Video`
- `VideoTag` N:1 → `Tag`

---

### 4.9 VideoModel

Junction table linking videos to models (many-to-many).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `video_id` | `UUID` | `FK → Video(id) ON DELETE CASCADE` | Video reference |
| `model_id` | `UUID` | `FK → Model(id) ON DELETE RESTRICT` | Model reference |
| `role` | `VARCHAR(50)` | `NULL` | Role in video (e.g., "performer", "director") |
| `sort_order` | `INTEGER` | `NOT NULL DEFAULT 0` | Display ordering |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | When association was made |

**Primary Key:** `(video_id, model_id)`

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_video_model_video_id` | `video_id` | B-tree | All models for a video |
| `idx_video_model_model_id` | `model_id` | B-tree | All videos for a model |

**Relations:**
- `VideoModel` N:1 → `Video`
- `VideoModel` N:1 → `Model`

---

### 4.10 Advertisement

An ad placement associated with a specific video.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `video_id` | `UUID` | `FK → Video(id) ON DELETE CASCADE, NOT NULL` | Associated video |
| `title` | `VARCHAR(255)` | `NOT NULL` | Ad campaign title |
| `ad_type` | `VARCHAR(20)` | `NOT NULL` | `pre_roll`, `mid_roll`, `post_roll`, `banner`, `overlay` |
| `target_url` | `VARCHAR(500)` | `NOT NULL` | Click-through URL |
| `media_url` | `VARCHAR(500)` | `NULL` | Video/image URL for ad |
| `duration_seconds` | `INTEGER` | `NULL` | Duration (for video ads) |
| `start_time_seconds` | `INTEGER` | `NULL` | Mid-roll start time |
| `max_impressions` | `INTEGER` | `NULL` | Cap on impressions |
| `max_clicks` | `INTEGER` | `NULL` | Cap on clicks |
| `budget_cents` | `INTEGER` | `NULL` | Campaign budget in cents |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'active'` | `active`, `paused`, `completed`, `cancelled` |
| `starts_at` | `TIMESTAMPTZ` | `NULL` | Campaign start |
| `ends_at` | `TIMESTAMPTZ` | `NULL` | Campaign end |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_ad_video_id` | `video_id` | B-tree | Ads for a specific video |
| `idx_ad_status_starts_at` | `status, starts_at` | B-tree | Active campaigns by start date |
| `idx_ad_type` | `ad_type` | B-tree | Filter by ad type |

**Relations:**
- `Advertisement` N:1 → `Video`
- `Advertisement` 1:1 → `AdvertisementStats`

---

### 4.11 AdvertisementStats

Performance statistics for advertisements. 1:1 relationship with `Advertisement`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `advertisement_id` | `UUID` | `FK → Advertisement(id) ON DELETE CASCADE, UNIQUE` | Associated ad |
| `impression_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Total impressions |
| `click_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Total clicks |
| `ctr` | `NUMERIC(8,6)` | `NOT NULL DEFAULT 0` | Click-through rate (computed) |
| `spent_cents` | `INTEGER` | `NOT NULL DEFAULT 0` | Amount spent in cents |
| `last_impression_at` | `TIMESTAMPTZ` | `NULL` | Last impression timestamp |
| `last_click_at` | `TIMESTAMPTZ` | `NULL` | Last click timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_ad_stats_ad_id` | `advertisement_id` | UNIQUE B-tree | 1:1 lookup |

**Relations:**
- `AdvertisementStats` 1:1 → `Advertisement`

---

### 4.12 VideoView

Tracks individual video views. High-volume table — candidate for time-based partitioning.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | Sequential ID (partition-friendly) |
| `video_id` | `UUID` | `FK → Video(id) ON DELETE CASCADE, NOT NULL` | Video viewed |
| `user_id` | `UUID` | `FK → User(id) ON DELETE SET NULL, NULL` | Viewer (null if anonymous) |
| `ip_address` | `INET` | `NULL` | Viewer IP |
| `user_agent` | `TEXT` | `NULL` | Browser/device info |
| `watch_duration_seconds` | `INTEGER` | `NOT NULL DEFAULT 0` | Seconds watched |
| `completed` | `BOOLEAN` | `NOT NULL DEFAULT false` | Whether video was watched to end |
| `referrer` | `VARCHAR(500)` | `NULL` | HTTP referrer |
| `session_id` | `VARCHAR(100)` | `NULL` | Session identifier |
| `viewed_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | View timestamp |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_video_view_video_id` | `video_id` | B-tree | View count aggregation |
| `idx_video_view_user_id` | `user_id` | B-tree | User's view history |
| `idx_video_view_viewed_at` | `viewed_at` | B-tree | Time-based queries |
| `idx_video_view_video_viewed_at` | `video_id, viewed_at` | Composite B-tree | Views over time per video |
| `idx_video_view_session` | `session_id` | B-tree | Session deduplication |

**Relations:**
- `VideoView` N:1 → `Video`
- `VideoView` N:1 → `User`

---

### 4.13 SearchQuery

Logs user search queries for analytics and improvement.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | Sequential ID |
| `user_id` | `UUID` | `FK → User(id) ON DELETE SET NULL, NULL` | Searching user (null if anonymous) |
| `query_text` | `TEXT` | `NOT NULL` | The search string |
| `filters_json` | `JSONB` | `NULL` | Applied filters (tags, duration, etc.) |
| `result_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Number of results returned |
| `clicked_video_id` | `UUID` | `NULL` | Video clicked from results |
| `click_position` | `INTEGER` | `NULL` | Position of clicked result |
| `session_id` | `VARCHAR(100)` | `NULL` | Session identifier |
| `searched_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Search timestamp |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_search_query_user_id` | `user_id` | B-tree | User search history |
| `idx_search_query_searched_at` | `searched_at` | B-tree | Time-based analytics |
| `idx_search_query_text_trgm` | `query_text` | GIN trigram | Popular search terms |
| `idx_search_query_session` | `session_id` | B-tree | Session deduplication |

**Relations:**
- `SearchQuery` N:1 → `User`

---

### 4.14 Report

User-submitted reports for content moderation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `reporter_id` | `UUID` | `FK → User(id) ON DELETE SET NULL, NOT NULL` | User who reported |
| `video_id` | `UUID` | `FK → Video(id) ON DELETE CASCADE, NOT NULL` | Video being reported |
| `reason` | `VARCHAR(50)` | `NOT NULL` | Report reason (e.g., `copyright`, `explicit`, `spam`, `harassment`, `other`) |
| `description` | `TEXT` | `NULL` | Detailed explanation |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | `pending`, `reviewed`, `dismissed`, `actioned` |
| `moderator_notes` | `TEXT` | `NULL` | Internal moderator notes |
| `resolved_at` | `TIMESTAMPTZ` | `NULL` | When resolved |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record update |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_report_status` | `status` | B-tree | Pending report queue |
| `idx_report_reporter_id` | `reporter_id` | B-tree | User's reports |
| `idx_report_video_id` | `video_id` | B-tree | Reports for a video |
| `idx_report_status_created` | `status, created_at` | Composite B-tree | FIFO moderation queue |

**Relations:**
- `Report` N:1 → `User` (reporter)
- `Report` N:1 → `Video`
- `Report` 1:1? → `ModeratorAction` (optional, via `report_id` FK in ModeratorAction)

---

### 4.15 ModeratorAction

Logs every moderation action taken by an admin/moderator for audit trail.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Primary identifier |
| `moderator_id` | `UUID` | `FK → User(id) ON DELETE SET NULL, NOT NULL` | Moderator who acted |
| `report_id` | `UUID` | `FK → Report(id) ON DELETE SET NULL, NULL` | Associated report (if any) |
| `video_id` | `UUID` | `FK → Video(id) ON DELETE SET NULL, NULL` | Video affected (if any) |
| `user_id` | `UUID` | `FK → User(id) ON DELETE SET NULL, NULL` | User affected (if any) |
| `action_type` | `VARCHAR(30)` | `NOT NULL` | `approve`, `reject`, `delete`, `warn`, `suspend`, `ban`, `unban`, `feature`, `unfeature` |
| `reason` | `TEXT` | `NULL` | Reason for action |
| `details_json` | `JSONB` | `NULL` | Additional context/metadata |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Record creation |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_mod_action_moderator_id` | `moderator_id` | B-tree | Actions by moderator |
| `idx_mod_action_report_id` | `report_id` | B-tree | Actions for a report |
| `idx_mod_action_video_id` | `video_id` | B-tree | Actions on a video |
| `idx_mod_action_user_id` | `user_id` | B-tree | Actions on a user |
| `idx_mod_action_created_at` | `created_at` | B-tree | Chronological audit trail |

**Relations:**
- `ModeratorAction` N:1 → `User` (moderator)
- `ModeratorAction` N:1 → `Report` (nullable)
- `ModeratorAction` N:1 → `Video` (nullable)
- `ModeratorAction` N:1 → `User` (affected user, nullable)

---

### 4.16 Favorite

User's bookmarked/favorited videos.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `UUID` | `FK → User(id) ON DELETE CASCADE` | User who favorited |
| `video_id` | `UUID` | `FK → Video(id) ON DELETE CASCADE` | Favorited video |
| `note` | `VARCHAR(255)` | `NULL` | Optional personal note |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | When favorited |

**Primary Key:** `(user_id, video_id)`

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_favorite_user_id` | `user_id` | B-tree | User's favorites |
| `idx_favorite_video_id` | `video_id` | B-tree | All users who favorited a video |
| `idx_favorite_user_created` | `user_id, created_at DESC` | Composite B-tree | User's favorites sorted newest |

**Relations:**
- `Favorite` N:1 → `User`
- `Favorite` N:1 → `Video`

---

### 4.17 WatchHistory

Tracks each user's watch history with progress. One row per user-video interaction.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | Sequential ID |
| `user_id` | `UUID` | `FK → User(id) ON DELETE CASCADE, NOT NULL` | User |
| `video_id` | `UUID` | `FK → Video(id) ON DELETE CASCADE, NOT NULL` | Video watched |
| `progress_seconds` | `INTEGER` | `NOT NULL DEFAULT 0` | Resume position |
| `completed` | `BOOLEAN` | `NOT NULL DEFAULT false` | Whether fully watched |
| `watch_count` | `INTEGER` | `NOT NULL DEFAULT 1` | Times watched |
| `last_watched_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Most recent watch |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | First watch |

**Indexes:**
| Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_watch_history_user_id` | `user_id` | B-tree | User's watch history |
| `idx_watch_history_video_id` | `video_id` | B-tree | Who watched a video |
| `idx_watch_history_user_video` | `user_id, video_id` | UNIQUE B-tree | Unique user-video interaction |
| `idx_watch_history_user_last_watched` | `user_id, last_watched_at DESC` | Composite B-tree | Resume watching (most recent) |
| `idx_watch_history_user_progress` | `user_id, progress_seconds` | Composite B-tree | Users with unfinished videos |

**Relations:**
- `WatchHistory` N:1 → `User`
- `WatchHistory` N:1 → `Video`

---

## 5. Index Strategy

### 5.1 Index Type Usage

| Index Type | When to Use | Examples |
|---|---|---|
| **B-tree** | Default. Equality and range queries, sorting. | Primary keys, FKs, `published_at`, `view_count` |
| **UNIQUE B-tree** | Enforcing uniqueness. | `email`, `slug`, `username` |
| **Composite B-tree** | Multi-column query patterns with leftmost prefix. | `(status, published_at)`, `(user_id, last_watched_at)` |
| **Partial B-tree** | Filtering on a subset of rows. | `WHERE is_active = true`, `WHERE is_featured = true` |
| **GIN** | Full-text search, array/JSON queries. | Full-text search on `title` |
| **GIN Trigram** | Fuzzy text matching (`ILIKE`, `%` patterns). | `title`, `name`, `alias` |

### 5.2 Coverage Analysis

| Query Pattern | Index | Type |
|---|---|---|
| Fetch user by email | `idx_user_email` | UNIQUE B-tree |
| Fetch published videos (paginated) | `idx_video_status_published_at` | Composite B-tree |
| Fetch trending videos | `idx_video_view_count` | B-tree |
| Fetch models for a video | `idx_video_model_video_id` | B-tree |
| Fetch videos for a model | `idx_video_model_model_id` | B-tree |
| Tags for a video | `idx_video_tag_video_id` | B-tree |
| Videos for a tag | `idx_video_tag_tag_id` | B-tree |
| User's favorites (sorted) | `idx_favorite_user_created` | Composite B-tree |
| Unfinished videos by user | `idx_watch_history_user_progress` | Composite B-tree |
| Moderation pending queue | `idx_report_status_created` | Composite B-tree |
| Active ad campaigns | `idx_ad_status_starts_at` | Composite B-tree |
| Fuzzy search on title | `idx_video_title_trgm` | GIN Trigram |
| Autocomplete on tags | `idx_tag_name_trgm` | GIN Trigram |
| Search by model alias | `idx_model_alias_alias_trgm` | GIN Trigram |

---

## 6. Partitioning Strategy

### 6.1 Tables to Partition

These high-volume tables should be **partitioned by time** to maintain query performance and enable efficient archival:

| Table | Partition Key | Partition Type | Interval | Retention |
|---|---|---|---|---|
| `VideoView` | `viewed_at` | RANGE | Monthly | 24 months active, archive older |
| `SearchQuery` | `searched_at` | RANGE | Monthly | 12 months active, archive older |
| `WatchHistory` | `last_watched_at` | RANGE | Monthly | 24 months active, archive older |

### 6.2 Partitioning Example (VideoView)

```sql
CREATE TABLE video_view (
  id BIGSERIAL,
  video_id UUID NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  watch_duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  referrer VARCHAR(500),
  session_id VARCHAR(100),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, viewed_at)
) PARTITION BY RANGE (viewed_at);

-- Monthly partitions
CREATE TABLE video_view_2026_01 PARTITION OF video_view
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE video_view_2026_02 PARTITION OF video_view
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... maintained via cron or pg_partman
```

---

## 7. Query Patterns & Optimization

### 7.1 Common Query Patterns

**A. Video Feed (paginated)**
```sql
-- Browse published videos, newest first
SELECT v.*
FROM video v
WHERE v.status = 'published'
  AND v.access_level = 'public'
ORDER BY v.published_at DESC
LIMIT 20 OFFSET 0;
-- Index: idx_video_status_published_at covers this fully
```

**B. Video with Tags and Models**
```sql
-- Single video detail with associated tags and models
SELECT v.*,
  json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) as tags,
  json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name)) as models
FROM video v
LEFT JOIN video_tag vt ON vt.video_id = v.id
LEFT JOIN tag t ON t.id = vt.tag_id
LEFT JOIN video_model vm ON vm.video_id = v.id
LEFT JOIN model m ON m.id = vm.model_id
WHERE v.id = $1
GROUP BY v.id;
```

**C. User's Watch History with Resume**
```sql
-- User's watch history, most recent first
SELECT v.*, wh.progress_seconds, wh.completed
FROM watch_history wh
JOIN video v ON v.id = wh.video_id
WHERE wh.user_id = $1
ORDER BY wh.last_watched_at DESC
LIMIT 20;
-- Index: idx_watch_history_user_last_watched
```

**D. Trending Videos**
```sql
-- Most viewed published videos
SELECT v.*
FROM video v
WHERE v.status = 'published'
  AND v.access_level = 'public'
ORDER BY v.view_count DESC
LIMIT 20;
-- Index: idx_video_view_count DESC
```

**E. Fuzzy Search**
```sql
-- Title-based search with trigram similarity
SELECT v.*, similarity(v.title, $1) AS sim
FROM video v
WHERE v.status = 'published'
  AND v.title % $1
ORDER BY sim DESC
LIMIT 20;
-- Index: idx_video_title_trgm (GIN trigram)
```

### 7.2 Denormalization Justifications

The following denormalized counters are maintained to avoid expensive COUNT queries on high-traffic read paths:

| Table | Column | Source Table | Update Strategy |
|---|---|---|---|
| `Video` | `view_count` | `VideoView` | Increment on view + periodic recount job |
| `Video` | `like_count` | `Like` (future) | Trigger/increment on action |
| `Video` | `favorite_count` | `Favorite` | Trigger/increment on action |
| `Video` | `avg_rating` | `Review` (future) | Recalculate on new rating |
| `Model` | `video_count` | `VideoModel` | Trigger on junction insert/delete |
| `Model` | `total_views` | `VideoView` (via VideoModel) | Periodic batch job |
| `Tag` | `video_count` | `VideoTag` | Trigger on junction insert/delete |

### 7.3 Materialized Views (Future)

For dashboard/reporting queries, consider materialized views refreshed periodically:

- `mv_daily_video_stats`: Daily aggregation of `VideoView` (views, unique viewers, watch time)
- `mv_daily_user_stats`: Daily active users, registrations
- `mv_model_performance`: Model-level aggregated metrics

---

## 8. Scalability Considerations

### 8.1 100,000+ Videos Scale

| Factor | Strategy |
|---|---|
| **Primary Keys** | UUID v4 — no contention, distributed-friendly |
| **High-volume tables** | Time-based partitioning for `VideoView`, `SearchQuery`, `WatchHistory` |
| **Junction tables** | Composite PKs avoid extra indexes, enable fast lookups |
| **Denormalized counts** | Avoid expensive `COUNT(*)` on large tables |
| **Trigram indexes** | GIN indexes on text columns for efficient fuzzy search |
| **Partial indexes** | Only index relevant rows (e.g., active users, published videos) |
| **Read replicas** | Analytics/search queries redirected to replicas |
| **Connection pooling** | PgBouncer for efficient connection management |
| **Caching layer** | Redis for hot query results (top videos, model pages) |

### 8.2 Growth Projections

| Metric | Current Target | 2-Year Projection |
|---|---|---|
| Videos | 100,000 | 500,000 |
| Users | 50,000 MAU | 200,000 MAU |
| Video Views / day | 500,000 | 2,500,000 |
| Search Queries / day | 100,000 | 500,000 |
| Database Size | ~50 GB | ~250 GB |

### 8.3 Recommended PostgreSQL Configuration

```ini
# postgresql.conf tuning for this schema
max_connections = 200
shared_buffers = '4GB'          # 25% of RAM
effective_cache_size = '12GB'   # 75% of RAM
work_mem = '64MB'               # Per-operation sort memory
maintenance_work_mem = '1GB'    # For VACUUM, CREATE INDEX
random_page_cost = 1.1          # SSD-optimized
effective_io_concurrency = 200  # SSD-optimized
wal_buffers = '64MB'
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
shared_preload_libraries = 'pg_stat_statements, pg_trgm'
```

### 8.4 Table Maintenance

| Operation | Frequency | Tables |
|---|---|---|
| `ANALYZE` | Hourly | All tables (auto-vacuum tuned) |
| `VACUUM` | Continuous (auto-vacuum) | All tables |
| Re-index | Weekly (low-traffic period) | High-write tables |
| Partition cleanup | Monthly | `VideoView`, `SearchQuery`, `WatchHistory` |
| Update denormalized counts | Daily (off-peak) | `Video`, `Model`, `Tag` |

---

## Appendix A: Full SQL Schema (Reference)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Trigram similarity

-- (Full CREATE TABLE statements as defined above in Section 4)
```

---

## Appendix B: Migration Strategy

Initial schema deployment should follow this order to respect foreign key dependencies:

1. `User` (no FKs)
2. `UserProfile` (FK → User)
3. `TagGroup` (no FKs)
4. `Tag` (FK → TagGroup)
5. `Model` (no FKs)
6. `ModelAlias` (FK → Model)
7. `Video` (FK → User)
8. `VideoTag` (FK → Video, Tag)
9. `VideoModel` (FK → Video, Model)
10. `Advertisement` (FK → Video)
11. `AdvertisementStats` (FK → Advertisement)
12. `VideoView` (FK → Video, User)
13. `SearchQuery` (FK → User)
14. `Report` (FK → User, Video)
15. `ModeratorAction` (FK → User, Report, Video, User)
16. `Favorite` (FK → User, Video)
17. `WatchHistory` (FK → User, Video)

---

**End of Database Design Document**
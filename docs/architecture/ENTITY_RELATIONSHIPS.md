# Vanta - Entity Relationships & Data Flow

**Version:** 1.0.0  
**Date:** 2026-06-16  
**Database:** PostgreSQL

---

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Core Entity Relationships](#core-entity-relationships)
3. [Relationship Cardinality](#relationship-cardinality)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Query Patterns](#query-patterns)
6. [Consistency Rules](#consistency-rules)

---

## Entity Relationship Diagram

### Full ERD (Text Representation)

```
┌──────────────────────────────────────────────────────────────────────┐
│                     CORE ENTITIES                                    │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────────┐
│     User        │         │ UserPreferences  │
├─────────────────┤    1:1  ├──────────────────┤
│ PK: id          │────────►│ FK: userId       │
│ email (UNIQUE)  │         │ theme            │
│ username (UQ)   │         │ language         │
│ password        │         │ notifications    │
│ role            │         │ privacy          │
│ status          │         └──────────────────┘
│ avatar          │
│ bio             │         ┌──────────────────┐
│ subscTierId(FK) │────────►│ SubscriptionTier │
│ isPremium       │    N:1  │ PK: id           │
└────────┬────────┘         │ name             │
         │                  │ monthlyPrice     │
         │                  │ yearlyPrice      │
         │                  │ features         │
         │ 1:N              └──────────────────┘
         │
         ├─────────┬──────────┬──────────┬─────────────┬────────────┐
         │         │          │          │             │            │
    ┌────▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌──────▼──┐  ┌─────▼────┐
    │Session│  │Comment   │Review  │ Content  │WatchHistory  │Favorite│
    └───────┘  │(creator) │(creator │ (creator)    │            │
         │     └────┬─────┘ └─────┬─┘  └──────┬─┘    │            │
         │          │             │           │      │            │
         │          └─────────────┼───────────┴──────┴────────────┴─┘
         │                        │ 1:N
         │                    ┌───▼─────────────────────┐
         │                    │      Content            │
         │                    ├─────────────────────────┤
         │                    │ PK: id                  │
         │                    │ title                   │
         │                    │ description             │
         │                    │ videoUrl (R2)           │
         │                    │ thumbnailUrl (R2)       │
         │                    │ duration                │
         │                    │ status                  │
         │                    │ accessLevel             │
         │                    │ isPremium               │
         │                    │ views                   │
         │                    │ createdAt               │
         │                    │ publishedAt             │
         │                    │ creatorId (FK→User)    │
         │                    │ categoryId (FK)        │
         │                    └───┬─────────────────────┘
         │                        │ N:M
         │                        │
         │          ┌─────────────┴──────────────────┐
         │          │                                 │
         │      ┌───▼──────┐                      ┌───▼────┐
         │      │  Model   │ (N:M junction)      │  Tag   │
         │      ├──────────┤                      ├────────┤
         │      │ PK: id   │◄─────────────────►  │ PK: id │
         │      │ name     │   ContentModel      │ name   │
         │      │ bio      │   ContentTag        │ slug   │
         │      │ avatar   │                      │ category
         │      │ verified │                      └────────┘
         │      └──────────┘
         │
         │      ┌────────────────────┐
         │      │UserSubscription    │
         │      ├────────────────────┤
         │      │ PK: id             │
         │      │ FK: userId (UQ)    │◄─────────────┐
         │      │ status             │              │
         │      │ startedAt          │              │ 1:1
         │      │ renewsAt           │              │
         │      │ stripeCustomerId   │              │
         │      └────────────────────┘              │
         │                                           │
         └───────────────────────────────────────────┘
         1:1

┌──────────────────────────────────────────────────────────────────────┐
│                    ANALYTICS ENTITIES                                │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐      ┌──────────────────────┐
│  UserAnalytics      │      │ ContentAnalytics     │
├─────────────────────┤ 1:1  ├──────────────────────┤
│ PK: id              │──────│ PK: id               │
│ FK: userId (UQ)     │      │ FK: contentId (UQ)   │
│ totalWatchTime      │      │ totalViews           │
│ totalVideosWatched  │      │ uniqueViewers        │
│ avgWatchDuration    │      │ avgWatchDuration     │
│ totalComments       │      │ avgWatchPercentage   │
│ favoriteCategory    │      │ likes/dislikes       │
│ favoriteModels[]    │      │ comments             │
└─────────────────────┘      │ engagementRate       │
                              │ topCountries         │
                              │ topDevices           │
                              │ peakWatchHour        │
                              └──────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│  ModelAnalytics      │      │ UserEvent            │
├──────────────────────┤ 1:1  ├──────────────────────┤
│ PK: id               │──────│ PK: id               │
│ FK: modelId (UQ)     │      │ FK: userId           │
│ totalImpressions     │      │ eventType            │
│ totalViews           │      │ eventData            │
│ avgLikesPerVideo     │      │ FK: contentId?       │
│ avgCommentsPerVideo  │      │ deviceType           │
└──────────────────────┘      │ country              │
                              │ timestamp            │
                              └──────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    ADMIN & MODERATION                                │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┐                ┌──────────────┐
│    Report    │                │  AuditLog    │
├──────────────┤ N:1            ├──────────────┤
│ PK: id       │                │ PK: id       │
│ FK: reporterId              │ actorId      │
│ FK: contentId               │ action       │
│ reason       │                │ resource     │
│ status       │                │ resourceId   │
│ moderatedAt  │                │ changesBefore
│ moderatedBy  │                │ changesAfter │
└──────────────┘                └──────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    ADVERTISING                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│  AdCampaign      │ 1:N      │  AdPlacement     │
├──────────────────┤─────────►├──────────────────┤
│ PK: id           │          │ PK: id           │
│ name             │          │ FK: contentId    │
│ budget           │          │ FK: campaignId   │
│ spent            │          │ placementType    │
│ targetAudience   │          │ position         │
│ isActive         │          │ impressions      │
│ impressions      │          │ clicks           │
│ clicks           │          │ revenue          │
│ conversions      │          └──────────────────┘
└──────────────────┘

┌──────────────────────┐
│  AdPerformance       │
├──────────────────────┤
│ PK: id               │
│ FK: campaignId       │
│ impressions          │
│ clicks               │
│ conversions          │
│ revenue              │
│ ctr / cpc            │
│ date (aggregation)   │
└──────────────────────┘
```

---

## Core Entity Relationships

### 1. User & Content Relationship

```
User (Creator) 1:N Content

Path: User.id → Content.creatorId

Example:
- User "alice" creates 50 videos
- Query: SELECT * FROM Content WHERE creatorId = 'user-1'
- Update: User deletes account → Content status = ARCHIVED or creator reassigned
```

### 2. Content & Model Relationship (N:M)

```
Content N:M Model (via junction table ContentModel)

Path: Content.id ←→ Model.id (through ContentModel join table)

Example:
- Video "Pool Party" features models ["Sarah", "Jessica"]
- Query: 
  SELECT m.* FROM Model m
  JOIN ContentModel cm ON m.id = cm.modelId
  WHERE cm.contentId = 'video-1'
```

### 3. Content & Tag Relationship (N:M)

```
Content N:M Tag (via junction table ContentTag)

Path: Content.id ←→ Tag.id

Example:
- Video tagged with ["bikini", "poolside", "summer"]
- Query:
  SELECT t.* FROM Tag t
  JOIN ContentTag ct ON t.id = ct.tagId
  WHERE ct.contentId = 'video-1'
```

### 4. User & Subscription Relationship

```
User 1:1 UserSubscription
UserSubscription N:1 SubscriptionTier

Path: User.id → UserSubscription.userId → SubscriptionTier.id

Example:
- User subscribed to "Premium" tier
- Query:
  SELECT st.* FROM SubscriptionTier st
  JOIN UserSubscription us ON st.id = us.tierId
  WHERE us.userId = 'user-1'
```

### 5. User Watch History Relationship

```
User 1:N WatchHistory N:1 Content

Path: User.id → WatchHistory.userId, Content.id ← WatchHistory.contentId

Example:
- User "alice" watched 150 videos
- Query:
  SELECT c.*, wh.watchedDuration, wh.watchedAt
  FROM WatchHistory wh
  JOIN Content c ON wh.contentId = c.id
  WHERE wh.userId = 'user-1'
  ORDER BY wh.watchedAt DESC
```

### 6. Content Comments/Reviews Relationship

```
User 1:N Comment 1:N Content
User 1:N Review 1:N Content

Path: Content.id ← Comment.contentId → User.id (creator)
      Content.id ← Review.contentId → User.id (creator)

Example:
- Query comments on video:
  SELECT c.*, u.username FROM Comment c
  JOIN User u ON c.userId = u.id
  WHERE c.contentId = 'video-1'
  ORDER BY c.createdAt DESC
```

### 7. Content & Analytics Relationship

```
Content 1:1 ContentAnalytics
User 1:1 UserAnalytics
Model 1:1 ModelAnalytics

Path: Content.id → ContentAnalytics.contentId

Example:
- Get video stats:
  SELECT ca.* FROM ContentAnalytics ca
  WHERE ca.contentId = 'video-1'
```

### 8. Admin Audit & Report Relationships

```
User 1:N Report N:1 Content
User 1:N AuditLog (via actorId)

Path: User.id → Report.reporterId → Content.id
      AuditLog.actorId → User.id

Example:
- Get reports for a video:
  SELECT r.*, u.username FROM Report r
  JOIN User u ON r.reporterId = u.id
  WHERE r.contentId = 'video-1'
```

---

## Relationship Cardinality

| Relationship | Cardinality | Notes |
|---|---|---|
| User ↔ Content | 1:N | User creates multiple videos |
| Content ↔ Model | N:M | Video features multiple models |
| Content ↔ Tag | N:M | Video tagged with multiple tags |
| User ↔ UserSubscription | 1:1 | Each user has one active subscription |
| UserSubscription ↔ SubscriptionTier | N:1 | Multiple users can share a tier |
| User ↔ WatchHistory | 1:N | User watches multiple videos |
| User ↔ UserPreferences | 1:1 | One preference set per user |
| User ↔ Comment | 1:N | User creates multiple comments |
| Content ↔ Comment | 1:N | Video receives multiple comments |
| User ↔ Review | 1:N | User creates multiple reviews |
| Content ↔ Review | 1:N | Video receives multiple reviews |
| User ↔ Favorite | N:M | User favorites multiple videos |
| User ↔ Session | 1:N | User can have multiple sessions |
| User ↔ ApiKey | 1:N | User can have multiple API keys |
| Content ↔ ContentAnalytics | 1:1 | Each video has one analytics record |
| User ↔ UserAnalytics | 1:1 | Each user has one analytics record |
| Model ↔ ModelAnalytics | 1:1 | Each model has one analytics record |
| Content ↔ Report | 1:N | Video can be reported multiple times |
| AdCampaign ↔ AdPlacement | 1:N | Campaign has multiple placements |

---

## Data Flow Diagrams

### 1. Video Upload & Publication Flow

```
┌─────────────┐
│ User Upload │
└──────┬──────┘
       │ Create Content (status=PROCESSING)
       ▼
┌──────────────────────┐
│ Content created      │
│ - videoUrl: pending  │
│ - status: PROCESSING │
└──────┬───────────────┘
       │ Upload to R2 (async job)
       ▼
┌──────────────────────────┐
│ VideoTranscodingJob      │
│ - Download from R2       │
│ - Transcode to variants  │
│ - Upload transcoded      │
└──────┬───────────────────┘
       │ Mark complete
       ▼
┌──────────────────────┐
│ Update Content       │
│ - videoUrl: R2 URL   │
│ - status: PUBLISHED  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Content available    │
│ for streaming        │
└──────────────────────┘
```

### 2. Video Watching & Analytics Flow

```
┌──────────────┐
│ User Request │
│ Play Video   │
└──────┬───────┘
       │
       ▼
┌───────────────────┐
│ Authenticate      │
│ Check access      │
│ Check premium     │
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│ Stream Video      │
│ from CDN          │
└──────┬────────────┘
       │ (every 10 seconds)
       ▼
┌──────────────────────┐
│ Track Watch Event    │
│ - Send to tracking   │
│ - Store in UserEvent │
└──────┬───────────────┘
       │ (aggregated)
       ▼
┌──────────────────────┐
│ Update Analytics     │
│ - totalViews++       │
│ - totalWatchTime+    │
│ - avgWatchDuration   │
└──────────────────────┘
```

### 3. Subscription & Billing Flow

```
┌────────────────────┐
│ User clicks        │
│ Subscribe Button   │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Redirect to Stripe │
│ Checkout Page      │
└──────┬─────────────┘
       │ (user completes)
       ▼
┌────────────────────┐
│ Stripe webhook:    │
│ checkout.session   │
│ .completed         │
└──────┬─────────────┘
       │
       ▼
┌────────────────────────────┐
│ Create/Update:             │
│ - UserSubscription         │
│ - stripeCustomerId         │
│ - stripeSubscriptionId     │
│ - status: ACTIVE           │
│ - isPremium: true          │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────┐
│ Create Invoice     │
│ Store billing info │
└──────┬─────────────┘
       │
       ▼
┌────────────────────────┐
│ User gains access to  │
│ Premium Content       │
└────────────────────────┘
```

### 4. Search & Discovery Flow

```
┌────────────────┐
│ User searches  │
│ "bikini beach" │
└──────┬─────────┘
       │
       ▼
┌─────────────────────────┐
│ Check Redis cache       │
│ Query key: search:...   │
└──────┬────────┬─────────┘
       │        │ (miss)
  (hit)│        ▼
       │   ┌────────────────────┐
       │   │ Full-text search   │
       │   │ Content + Model    │
       │   │ Filter by status   │
       │   │ Sort by relevance  │
       │   └──────┬─────────────┘
       │          │
       │          ▼
       │   ┌────────────────────┐
       │   │ Cache result (1hr) │
       │   │ in Redis           │
       │   └──────┬─────────────┘
       │          │
       └──────────┤
                  ▼
         ┌──────────────────┐
         │ Track SearchEvent│
         │ Increment count  │
         │ for tag          │
         └──────┬───────────┘
                │
                ▼
         ┌──────────────────┐
         │ Return results   │
         │ with pagination  │
         └──────────────────┘
```

### 5. Content Moderation Flow

```
┌────────────────────┐
│ Report submitted   │
│ reason: violation  │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Create Report      │
│ status: PENDING    │
└──────┬─────────────┘
       │ (notification)
       ▼
┌────────────────────┐
│ Notify Moderators  │
│ Dashboard update   │
└──────┬─────────────┘
       │
       ▼
┌────────────────────────────┐
│ Moderator reviews          │
│ Content + Comments         │
│ Makes decision             │
└──────┬─────────────────────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
   APPROVED      REJECTED      ACTION_TAKEN
       │             │              │
       ▼             ▼              ▼
   ┌────┐     ┌──────────┐    ┌──────────┐
   │Keep│     │Delete    │    │Suspend   │
   │Live│     │Content   │    │Account   │
   └────┘     │Flag User │    │Notify    │
              └──────────┘    │Support   │
                              └──────────┘
```

---

## Query Patterns

### 1. Get User's Watch History with Content Details

```sql
SELECT 
  c.id, c.title, c.duration,
  wh.watchedDuration, wh.watchedPercentage,
  wh.watchedAt
FROM WatchHistory wh
JOIN Content c ON wh.contentId = c.id
WHERE wh.userId = $1
ORDER BY wh.watchedAt DESC
LIMIT 20 OFFSET $2;
```

**Prisma:**
```typescript
const watchHistory = await prisma.watchHistory.findMany({
  where: { userId },
  include: {
    content: {
      select: {
        id: true,
        title: true,
        duration: true,
        thumbnailUrl: true,
      },
    },
  },
  orderBy: { watchedAt: 'desc' },
  take: 20,
  skip: offset,
});
```

### 2. Get Video with Models and Tags

```sql
SELECT 
  c.id, c.title, c.description,
  json_agg(DISTINCT m.*) as models,
  json_agg(DISTINCT t.*) as tags,
  ca.totalViews, ca.engagementRate
FROM Content c
LEFT JOIN ContentModel cm ON c.id = cm.contentId
LEFT JOIN Model m ON cm.modelId = m.id
LEFT JOIN ContentTag ct ON c.id = ct.contentId
LEFT JOIN Tag t ON ct.tagId = t.id
LEFT JOIN ContentAnalytics ca ON c.id = ca.contentId
WHERE c.id = $1;
```

**Prisma:**
```typescript
const content = await prisma.content.findUnique({
  where: { id: videoId },
  include: {
    models: true,
    tags: true,
    analytics: true,
    creator: {
      select: { id: true, username: true, avatar: true },
    },
  },
});
```

### 3. Search Videos by Filter

```sql
SELECT DISTINCT
  c.id, c.title, c.thumbnailUrl, c.views,
  count(*) OVER() as total_count
FROM Content c
LEFT JOIN ContentTag ct ON c.id = ct.contentId
LEFT JOIN Tag t ON ct.tagId = t.id
LEFT JOIN ContentModel cm ON c.id = cm.contentId
WHERE 
  c.status = 'PUBLISHED'
  AND c.accessLevel != 'PRIVATE'
  AND (t.slug = ANY($1) OR $1 = '{}')
  AND (cm.modelId = ANY($2) OR $2 = '{}')
  AND (c.duration BETWEEN $3 AND $4)
ORDER BY c.views DESC
LIMIT 20 OFFSET $5;
```

### 4. Get User Analytics Dashboard

```sql
SELECT 
  ua.totalWatchTime, ua.totalVideosWatched, ua.avgWatchDuration,
  ua.totalComments, ua.totalFavorites,
  ca.totalViews, ca.engagementRate
FROM UserAnalytics ua
LEFT JOIN ContentAnalytics ca ON ca.contentId IN (
  SELECT id FROM Content WHERE creatorId = $1
)
WHERE ua.userId = $1;
```

### 5. Get Premium Content Recommendations

```sql
SELECT c.*, ca.engagementRate
FROM Content c
JOIN ContentAnalytics ca ON c.id = ca.contentId
WHERE 
  c.isPremium = true
  AND c.status = 'PUBLISHED'
  AND ca.engagementRate > (
    SELECT AVG(engagementRate)
    FROM ContentAnalytics
    WHERE contentId IN (
      SELECT id FROM Content WHERE isPremium = true
    )
  )
ORDER BY ca.engagementRate DESC
LIMIT 10;
```

---

## Consistency Rules

### 1. Data Integrity

| Rule | Implementation | Enforcement |
|------|---|---|
| User must exist for Content | Foreign Key FK_Content_User | Database constraint |
| Content must exist for WatchHistory | Foreign Key FK_WatchHistory_Content | Database constraint |
| Delete user cascade to sessions | Cascade delete | Database trigger |
| Delete content soft delete | Update status field | Application logic |
| Premium content requires active subscription | Check at query time | Application middleware |

### 2. Referential Integrity

```sql
-- User deletion cascades
ALTER TABLE Session ADD CONSTRAINT fk_session_user
  FOREIGN KEY (userId) REFERENCES User(id)
  ON DELETE CASCADE;

-- Content creator reference
ALTER TABLE Content ADD CONSTRAINT fk_content_creator
  FOREIGN KEY (creatorId) REFERENCES User(id)
  ON DELETE RESTRICT;

-- Analytics reference
ALTER TABLE ContentAnalytics ADD CONSTRAINT fk_analytics_content
  FOREIGN KEY (contentId) REFERENCES Content(id)
  ON DELETE CASCADE;
```

### 3. Soft Deletes

```typescript
// Instead of DELETE, update status
// User soft delete
await prisma.user.update({
  where: { id: userId },
  data: { status: 'DELETED' },
});

// Query excludes soft deleted
const users = await prisma.user.findMany({
  where: { status: { not: 'DELETED' } },
});
```

### 4. Denormalization & Caching

```typescript
// Denormalize hot fields (e.g., view count)
await prisma.content.update({
  where: { id: contentId },
  data: { views: { increment: 1 } }, // Atomic increment
});

// Cache frequently accessed data
await redis.setex(
  `content:${contentId}:details`,
  3600, // 1 hour TTL
  JSON.stringify(contentData)
);
```

### 5. Audit Trail

```typescript
// Log all important changes
await prisma.auditLog.create({
  data: {
    actorId: userId,
    action: 'UPDATE',
    resource: 'Content',
    resourceId: contentId,
    changesBefore: oldData,
    changesAfter: newData,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
});
```

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-16 | Initial entity relationships documentation |


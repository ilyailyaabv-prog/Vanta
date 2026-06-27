# Vanta - Database Schema & Data Model

**Version:** 1.0.0  
**Date:** 2026-06-16  
**Database:** PostgreSQL 15+  
**ORM:** Prisma

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Data Models](#data-models)
3. [Indexes & Performance](#indexes--performance)
4. [Constraints & Validations](#constraints--validations)
5. [Migrations Strategy](#migrations-strategy)

---

## Schema Overview

The Vanta database is organized into logical domains:

- **Authentication**: Users, sessions, API keys
- **Content**: Videos, models, tags, categories
- **Subscription**: Subscription tiers, user subscriptions, billing
- **Analytics**: User events, content metrics, ad performance
- **Admin**: Moderation, audit logs, reports
- **Advertising**: Ad campaigns, placements, performance

---

## Data Models

### 1. User Management

#### `User`
Core user account information.

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique @db.VarChar(255)
  emailVerified         DateTime?
  username              String    @unique @db.VarChar(100)
  password              String?   // Null for OAuth users
  firstName             String?   @db.VarChar(100)
  lastName              String?   @db.VarChar(100)
  avatar                String?   // URL to Cloudflare R2
  bio                   String?   @db.Text
  
  // Account Status
  status                UserStatus @default(ACTIVE)
  role                  UserRole   @default(USER)
  
  // Subscription & Premium
  subscriptionTierId    String?
  subscriptionTier      SubscriptionTier? @relation(fields: [subscriptionTierId], references: [id])
  subscription          UserSubscription?
  isPremium             Boolean   @default(false)
  premiumExpiresAt      DateTime?
  
  // Profile Metadata
  preferences           UserPreferences?
  
  // Privacy & Settings
  isPublic              Boolean   @default(true)
  twoFactorEnabled      Boolean   @default(false)
  twoFactorSecret       String?
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  lastLoginAt           DateTime?
  
  // Relations
  sessions              Session[]
  apiKeys               ApiKey[]
  watchHistory          WatchHistory[]
  favorites             Favorite[]
  comments              Comment[]
  reviews               Review[]
  userAnalytics         UserAnalytics?
  adPreferences         AdPreference?
  contentCreated        Content[] @relation("ContentCreator")
  reports               Report[] @relation("ReportCreator")
  
  @@index([email])
  @@index([username])
  @@index([status])
  @@index([role])
  @@index([createdAt])
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  BANNED
  DELETED
}

enum UserRole {
  USER
  CREATOR
  MODERATOR
  ADMIN
  SUPER_ADMIN
}
```

#### `UserPreferences`
User-specific settings and preferences.

```prisma
model UserPreferences {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Display Preferences
  theme                 Theme     @default(DARK)
  language              String    @default("en") @db.Char(2)
  subtitles             Boolean   @default(true)
  autoSubtitles         SubtitleLanguage @default(ENGLISH)
  
  // Playback
  defaultQuality        Quality   @default(AUTO)
  autoPlay              Boolean   @default(true)
  rememberPosition      Boolean   @default(true)
  
  // Notifications
  emailNotifications    Boolean   @default(true)
  pushNotifications     Boolean   @default(true)
  marketingEmails       Boolean   @default(false)
  
  // Privacy
  profileVisibility     ProfileVisibility @default(PUBLIC)
  showActivity          Boolean   @default(true)
  allowComments         Boolean   @default(true)
  
  updatedAt             DateTime  @updatedAt
}

enum Theme {
  LIGHT
  DARK
  AUTO
}

enum Quality {
  AUTO
  P480
  P720
  P1080
  P2160
}

enum SubtitleLanguage {
  ENGLISH
  SPANISH
  FRENCH
  GERMAN
  PORTUGUESE
  ITALIAN
  RUSSIAN
  CHINESE
  JAPANESE
  KOREAN
}

enum ProfileVisibility {
  PUBLIC
  PRIVATE
  FRIENDS_ONLY
}
```

#### `Session`
User session management.

```prisma
model Session {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  token                 String    @unique
  refreshToken          String?   @unique
  
  ipAddress             String?
  userAgent             String?
  
  expiresAt             DateTime
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([userId])
  @@index([expiresAt])
}
```

#### `ApiKey`
API key management for integrations.

```prisma
model ApiKey {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name                  String    @db.VarChar(255)
  key                   String    @unique // hashed key
  displayKey            String?   // last 4 chars for display
  
  scopes                String[]  @default([])
  lastUsedAt            DateTime?
  rateLimit             Int?      // requests per minute
  
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  expiresAt             DateTime?
  
  @@index([userId])
  @@index([isActive])
}
```

---

### 2. Content Management

#### `Content` (Videos)
Main video content entity.

```prisma
model Content {
  id                    String    @id @default(cuid())
  
  // Basic Info
  title                 String    @db.VarChar(255)
  slug                  String    @unique @db.VarChar(255)
  description           String?   @db.Text
  
  // Creator & Attribution
  creatorId             String
  creator               User      @relation("ContentCreator", fields: [creatorId], references: [id])
  
  // Media Files
  videoUrl              String    // R2 URL to HLS master.m3u8
  thumbnailUrl          String?   // R2 URL to thumbnail
  previewUrl            String?   // R2 URL to preview image
  duration              Int       // Duration in seconds
  
  // Content Metadata
  models                Model[]
  tags                  Tag[]
  category              ContentCategory?
  categoryId            String?
  
  // Content Info
  description           String?   @db.Text
  views                 Int       @default(0)
  likes                 Int       @default(0)
  dislikes              Int       @default(0)
  
  // Availability & Access
  status                ContentStatus @default(DRAFT)
  accessLevel           AccessLevel @default(PUBLIC)
  isExplicit            Boolean   @default(false)
  isFeatured            Boolean   @default(false)
  isSponsored           Boolean   @default(false)
  
  // Premium Content
  isPremium             Boolean   @default(false)
  premiumTierId         String?   @relation(name: "PremiumContent")
  
  // Metadata
  language              String    @default("en") @db.Char(2)
  subtitles             String[]  @default([]) // Language codes available
  
  // Publishing
  publishedAt           DateTime?
  scheduledAt           DateTime?
  archivedAt            DateTime?
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  watchHistory          WatchHistory[]
  favorites             Favorite[]
  comments              Comment[]
  reviews               Review[]
  analytics             ContentAnalytics?
  adPlacements          AdPlacement[]
  reports               Report[] @relation("ReportTarget")
  
  @@index([creatorId])
  @@index([status])
  @@index([accessLevel])
  @@index([isPremium])
  @@index([publishedAt])
  @@index([views])
  @@fulltext([title, description])
}

enum ContentStatus {
  DRAFT
  PROCESSING
  PUBLISHED
  ARCHIVED
  REJECTED
  FLAGGED
}

enum AccessLevel {
  PUBLIC
  UNLISTED
  PRIVATE
  PREMIUM
}
```

#### `Model`
Model/talent profiles.

```prisma
model Model {
  id                    String    @id @default(cuid())
  
  // Basic Info
  name                  String    @db.VarChar(255)
  slug                  String    @unique @db.VarChar(255)
  bio                   String?   @db.Text
  
  // Profile
  avatar                String?   // R2 URL
  banner                String?   // R2 URL
  
  // Model Info
  age                   Int?
  height              String?     // cm
  measurements          String?   // Chest-Waist-Hips format
  specialty             String?   @db.VarChar(255)
  
  // Contact & Links
  socialLinks           Json?     // { instagram: "", twitter: "" }
  contactEmail          String?   @db.VarChar(255)
  
  // Content Association
  contents              Content[]
  
  // Stats
  followers             Int       @default(0)
  contentCount          Int       @default(0)
  
  // Verification
  isVerified            Boolean   @default(false)
  verifiedAt            DateTime?
  
  // Status
  status                ModelStatus @default(ACTIVE)
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  tags                  Tag[]
  analytics             ModelAnalytics?
  
  @@index([name])
  @@index([slug])
  @@index([isVerified])
  @@index([status])
  @@fulltext([name, bio])
}

enum ModelStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}
```

#### `Tag`
Content tagging system.

```prisma
model Tag {
  id                    String    @id @default(cuid())
  
  // Tag Info
  name                  String    @unique @db.VarChar(100)
  slug                  String    @unique @db.VarChar(100)
  
  // Categorization
  category              String?   @db.VarChar(100)
  
  // Statistics
  contentCount          Int       @default(0)
  searchCount           Int       @default(0)
  
  // Relations
  contents              Content[]
  models                Model[]
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([name])
  @@index([category])
}
```

#### `ContentCategory`
Content categorization.

```prisma
model ContentCategory {
  id                    String    @id @default(cuid())
  
  name                  String    @unique @db.VarChar(100)
  slug                  String    @unique @db.VarChar(100)
  description           String?   @db.Text
  icon                  String?   // Emoji or icon code
  
  // Hierarchy
  parentId              String?
  parent                ContentCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children              ContentCategory[] @relation("CategoryHierarchy")
  
  // Content
  contents              Content[]
  
  // Meta
  order                 Int       @default(0)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([slug])
  @@index([parentId])
}
```

---

### 3. User Engagement

#### `WatchHistory`
Track user's watched videos.

```prisma
model WatchHistory {
  id                    String    @id @default(cuid())
  
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  contentId             String
  content               Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  // Playback Info
  watchedDuration       Int       // Seconds watched
  totalDuration         Int       // Total video duration
  playbackQuality       Quality
  watchedPercentage     Int       // 0-100
  
  // Device Info
  deviceType            DeviceType
  platform              String    @db.VarChar(50)
  
  // Timing
  startedAt             DateTime  @default(now())
  completedAt           DateTime?
  updatedAt             DateTime  @updatedAt
  
  @@unique([userId, contentId, startedAt])
  @@index([userId])
  @@index([contentId])
  @@index([startedAt])
}

enum DeviceType {
  DESKTOP
  TABLET
  MOBILE
  SMART_TV
  OTHER
}
```

#### `Favorite`
User's favorite contents.

```prisma
model Favorite {
  id                    String    @id @default(cuid())
  
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  contentId             String
  content               Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime  @default(now())
  
  @@unique([userId, contentId])
  @@index([userId])
}
```

#### `Comment`
User comments on content.

```prisma
model Comment {
  id                    String    @id @default(cuid())
  
  // Relations
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  contentId             String
  content               Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  // Parent (for replies)
  parentId              String?
  parent                Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies               Comment[] @relation("CommentReplies")
  
  // Content
  text                  String    @db.Text
  
  // Status
  status                CommentStatus @default(PENDING)
  
  // Stats
  likes                 Int       @default(0)
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([contentId])
  @@index([userId])
  @@index([status])
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  SPAM
}
```

#### `Review`
User ratings and reviews.

```prisma
model Review {
  id                    String    @id @default(cuid())
  
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  contentId             String
  content               Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  rating                Int       // 1-5 stars
  title                 String    @db.VarChar(255)
  text                  String?   @db.Text
  
  helpful               Int       @default(0)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@unique([userId, contentId])
  @@index([contentId])
  @@index([rating])
}
```

---

### 4. Subscription & Billing

#### `SubscriptionTier`
Subscription tier definitions.

```prisma
model SubscriptionTier {
  id                    String    @id @default(cuid())
  
  // Tier Info
  name                  String    @unique @db.VarChar(100)
  slug                  String    @unique @db.VarChar(100)
  description           String?   @db.Text
  icon                  String?
  
  // Pricing
  monthlyPrice          Int       // In cents (USD)
  yearlyPrice           Int?
  
  // Features
  features              String[]  @default([]) // Feature list
  limits                Json?     // { videoStorage: 1000, maxUploads: 50 }
  
  // Status
  isActive              Boolean   @default(true)
  order                 Int       @default(0)
  
  // Relations
  users                 User[]
  premiumContents       Content[] @relation(name: "PremiumContent")
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([isActive])
}
```

#### `UserSubscription`
User's active subscription.

```prisma
model UserSubscription {
  id                    String    @id @default(cuid())
  
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tierLevel             String    @default("free")
  
  // Billing
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?   @unique
  
  // Status
  status                SubscriptionStatus @default(ACTIVE)
  
  // Dates
  startedAt             DateTime
  renewsAt              DateTime
  cancelledAt           DateTime?
  endedAt               DateTime?
  
  // Auto Renewal
  autoRenew             Boolean   @default(true)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([status])
  @@index([renewsAt])
}

enum SubscriptionStatus {
  ACTIVE
  TRIAL
  PAST_DUE
  CANCELLED
  EXPIRED
  SUSPENDED
}
```

#### `Invoice`
Billing invoices.

```prisma
model Invoice {
  id                    String    @id @default(cuid())
  
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Invoice Info
  invoiceNumber         String    @unique @db.VarChar(50)
  stripeInvoiceId       String?   @unique
  
  // Amounts
  amount                Int       // Total in cents
  tax                   Int       @default(0)
  discount              Int       @default(0)
  
  // Status
  status                InvoiceStatus @default(PENDING)
  
  // Dates
  issuedAt              DateTime
  dueAt                 DateTime
  paidAt                DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
}

enum InvoiceStatus {
  PENDING
  PAID
  FAILED
  CANCELLED
}
```

---

### 5. Analytics

#### `UserAnalytics`
Aggregated user behavior analytics.

```prisma
model UserAnalytics {
  id                    String    @id @default(cuid())
  
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Engagement Metrics
  totalWatchTime        Int       @default(0) // seconds
  totalVideosWatched    Int       @default(0)
  averageWatchDuration  Int       @default(0) // seconds
  
  // Interaction Metrics
  totalComments         Int       @default(0)
  totalReviews          Int       @default(0)
  totalFavorites        Int       @default(0)
  
  // Retention
  lastActiveAt          DateTime?
  streakDays            Int       @default(0)
  
  // Preferences
  favoriteCategory      String?
  favoriteModels        String[]
  
  updatedAt             DateTime  @updatedAt
}
```

#### `ContentAnalytics`
Video performance metrics.

```prisma
model ContentAnalytics {
  id                    String    @id @default(cuid())
  
  contentId             String    @unique
  content               Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  // Views & Engagement
  totalViews            Int       @default(0)
  uniqueViewers         Int       @default(0)
  totalWatchTime        Int       @default(0) // seconds
  averageWatchDuration  Int       @default(0) // seconds
  averageWatchPercentage Int      @default(0) // 0-100
  
  // Interactions
  likes                 Int       @default(0)
  dislikes              Int       @default(0)
  comments              Int       @default(0)
  shares                Int       @default(0)
  
  // Performance Metrics
  ctr                   Float     @default(0) // Click-through rate
  engagementRate        Float     @default(0)
  
  // Demographics
  topCountries          Json?     // { US: 45000, CA: 12000 }
  topDevices            Json?     // { MOBILE: 60000, DESKTOP: 25000 }
  
  // Time-based metrics
  peakWatchHour         Int?      // 0-23
  peakWatchDay          String?   // MONDAY, TUESDAY, etc.
  
  updatedAt             DateTime  @updatedAt
}
```

#### `ModelAnalytics`
Model performance metrics.

```prisma
model ModelAnalytics {
  id                    String    @id @default(cuid())
  
  modelId               String    @unique
  model                 Model     @relation(fields: [modelId], references: [id], onDelete: Cascade)
  
  // Popularity
  totalImpressions      Int       @default(0)
  totalViews            Int       @default(0)
  followers             Int       @default(0)
  
  // Content
  contentCount          Int       @default(0)
  avgContentViews       Int       @default(0)
  
  // Engagement
  avgLikesPerVideo      Float     @default(0)
  avgCommentsPerVideo   Float     @default(0)
  
  updatedAt             DateTime  @updatedAt
}
```

#### `UserEvent`
Granular user behavior events (for time-series analysis).

```prisma
model UserEvent {
  id                    String    @id @default(cuid())
  
  userId                String
  
  // Event Details
  eventType             EventType
  eventData             Json?
  
  // Content Reference
  contentId             String?
  
  // Context
  deviceType            DeviceType
  country               String?   @db.Char(2)
  
  // Timestamp (for time-series)
  timestamp             DateTime  @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@index([contentId])
}

enum EventType {
  VIDEO_WATCHED
  VIDEO_LIKED
  VIDEO_DISLIKED
  VIDEO_SHARED
  COMMENT_POSTED
  COMMENT_LIKED
  FAVORITE_ADDED
  PROFILE_VIEWED
  MODEL_FOLLOWED
  SUBSCRIBE_CLICKED
  AD_IMPRESSION
  AD_CLICKED
}
```

---

### 6. Admin & Moderation

#### `Report`
Content reports and moderation.

```prisma
model Report {
  id                    String    @id @default(cuid())
  
  reporterId            String
  reporter              User      @relation("ReportCreator", fields: [reporterId], references: [id])
  
  contentId             String
  content               Content   @relation("ReportTarget", fields: [contentId], references: [id], onDelete: Cascade)
  
  // Report Details
  reason                ReportReason
  description           String?   @db.Text
  
  // Status
  status                ReportStatus @default(PENDING)
  moderatorNotes        String?   @db.Text
  
  // Resolution
  moderatedBy           String?
  moderatedAt           DateTime?
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([contentId])
  @@index([status])
}

enum ReportReason {
  INAPPROPRIATE_CONTENT
  COPYRIGHT_VIOLATION
  SPAM
  HARASSMENT
  MISINFORMATION
  OTHER
}

enum ReportStatus {
  PENDING
  IN_REVIEW
  RESOLVED
  DISMISSED
  ACTION_TAKEN
}
```

#### `AuditLog`
System audit trail.

```prisma
model AuditLog {
  id                    String    @id @default(cuid())
  
  actorId               String?   // User who performed action
  
  // Action Details
  action                AuditAction
  resource              String    // Type of resource (user, content, etc.)
  resourceId            String    // ID of affected resource
  
  // Changes
  changesBefore         Json?
  changesAfter          Json?
  
  // Context
  ipAddress             String?
  userAgent             String?
  
  createdAt             DateTime  @default(now())
  
  @@index([action])
  @@index([resourceId])
  @@index([createdAt])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  PUBLISH
  APPROVE
  REJECT
  SUSPEND
  RESTORE
  LOGIN
  LOGIN_FAILED
  EXPORT_DATA
}
```

---

### 7. Advertising

#### `AdCampaign`
Advertising campaigns.

```prisma
model AdCampaign {
  id                    String    @id @default(cuid())
  
  // Campaign Info
  name                  String    @db.VarChar(255)
  description           String?   @db.Text
  
  // Budget & Performance
  budget                Int       // Total budget in cents
  spent                 Int       @default(0)
  
  // Targeting
  targetAudience        Json?     // { regions: ["US", "CA"], age: { min: 18, max: 65 } }
  targetCategory        String[]
  
  // Schedule
  startDate             DateTime
  endDate               DateTime
  isActive              Boolean   @default(true)
  
  // Performance
  impressions           Int       @default(0)
  clicks                Int       @default(0)
  conversions           Int       @default(0)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([isActive])
}
```

#### `AdPlacement`
Ad placements within content.

```prisma
model AdPlacement {
  id                    String    @id @default(cuid())
  
  contentId             String
  content               Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  // Placement Info
  placementType         AdPlacementType
  position              Int       // Percentage through video (0-100) or position
  
  // Ad Info
  adUrl                 String    @db.VarChar(500)
  displayUrl            String?
  
  // Performance
  impressions           Int       @default(0)
  clicks                Int       @default(0)
  revenue               Int       @default(0) // cents
  
  // Status
  isActive              Boolean   @default(true)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([contentId])
  @@index([placementType])
}

enum AdPlacementType {
  PRE_ROLL
  MID_ROLL
  POST_ROLL
  BANNER
  SIDEBAR
}
```

#### `AdPerformance`
Aggregated ad performance metrics.

```prisma
model AdPerformance {
  id                    String    @id @default(cuid())
  
  campaignId            String
  campaign              AdCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  // Metrics
  impressions           Int
  clicks                Int
  conversions           Int
  revenue               Int
  
  // Rates
  ctr                   Float     // Click-through rate
  cpc                   Float     // Cost per click
  
  // Timestamp (for daily/hourly aggregation)
  date                  DateTime
  
  @@index([campaignId])
  @@index([date])
}
```

---

## Indexes & Performance

### Critical Indexes

```prisma
// User lookups
User: [email, username, createdAt, status]

// Content discovery
Content: [status, publishedAt, views, category, isPremium]

// Search
Content, Model: [fulltext index on title, description, bio]

// Watch history (time-series)
WatchHistory: [userId, startedAt] (composite)

// Analytics queries
UserAnalytics: [userId]
ContentAnalytics: [contentId]
UserEvent: [userId, timestamp, eventType]

// Admin operations
AuditLog: [action, resourceId, createdAt]
Report: [contentId, status]
```

### Query Optimization Strategies

1. **N+1 Prevention**: Use Prisma's `include()` and `select()`
2. **Pagination**: Cursor-based pagination for large result sets
3. **Partitioning**: Partition UserEvent and AuditLog by date
4. **Materialized Views**: For complex analytics queries
5. **Connection Pooling**: PgBouncer for efficient connections

---

## Constraints & Validations

### Data Integrity

- **Referential Integrity**: Foreign key constraints with CASCADE on delete where appropriate
- **Unique Constraints**: Email, username, API key, slug fields
- **Check Constraints**: Rating (1-5), watch percentage (0-100)
- **Not Null**: Required fields enforced at database level

### Application Validation

- **Email**: Valid email format, verified ownership
- **Password**: Minimum 8 characters, bcrypt hashed
- **Enum Values**: Valid status, role, event type values
- **Relationships**: Verified ownership before update/delete

---

## Migrations Strategy

### Version Control
```
prisma/migrations/
├── 001_init_users/
├── 002_init_content/
├── 003_init_subscriptions/
├── 004_add_analytics/
└── 005_add_advertising/
```

### Migration Process

1. **Development**: Create migration with `prisma migrate dev --name migration_name`
2. **Staging**: Apply migration to staging database
3. **Testing**: Run integration tests against new schema
4. **Production**: Blue-green deployment with database migration
5. **Rollback**: Keep previous migration version available for immediate rollback

### Zero-Downtime Migration Steps

1. Add new column/table with default values
2. Deploy code that handles both old and new data
3. Backfill data in batches
4. Remove old column in separate deployment
5. Update code to use new structure

---

## Schema Diagram

```
┌─────────────────┐          ┌──────────────┐
│ User            │◄────────►│ UserPrefs    │
│ - id            │          └──────────────┘
│ - email         │
│ - role          │          ┌──────────────┐
│ - subscTierId   │◄────────►│ Session      │
└────────┬────────┘          └──────────────┘
         │
         │ creator_id        ┌──────────────┐
         └────────────────►  │ Content      │
                             │ - title      │
                             │ - videoUrl   │
                             │ - status     │
                             └──────┬───────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
    ┌────▼────┐  ┌──────────┐  ┌───▼──────┐  ┌────────────────┐
    │ Model    │  │ Tag      │  │ Category │  │ AdPlacement    │
    │ - name   │  │ - name   │  │ - name   │  │ - placementType│
    │ - bio    │  └──────────┘  └──────────┘  └────────────────┘
    └────┬─────┘
         │
    ┌────▼──────────────────┐
    │ WatchHistory          │
    │ - userId              │
    │ - contentId           │
    │ - watchedDuration     │
    └───────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│ SubscriptionTier │◄────────►│ UserSubscription │
│ - name           │          │ - userId         │
│ - price          │          │ - status         │
│ - features       │          └──────────────────┘
└──────────────────┘

┌──────────────────┐
│ Analytics        │
├──────────────────┤
│ UserAnalytics    │
│ ContentAnalytics │
│ ModelAnalytics   │
│ UserEvent        │
└──────────────────┘

┌──────────────────┐
│ Admin            │
├──────────────────┤
│ Report           │
│ AuditLog         │
└──────────────────┘
```

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-16 | Initial database schema design |


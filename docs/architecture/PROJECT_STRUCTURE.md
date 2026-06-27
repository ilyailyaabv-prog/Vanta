# Vanta - Project Structure & Folder Architecture

**Version:** 1.0.0  
**Date:** 2026-06-16  
**Framework:** Next.js 15  
**Package Manager:** npm / pnpm

---

## Table of Contents

1. [Root Directory Structure](#root-directory-structure)
2. [Frontend Structure](#frontend-structure)
3. [Backend Structure](#backend-structure)
4. [Database & Configuration](#database--configuration)
5. [Naming Conventions](#naming-conventions)
6. [Module Organization](#module-organization)

---

## Root Directory Structure

```
vanta/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # CI/CD pipeline
│   │   ├── deploy-staging.yml     # Staging deployment
│   │   └── deploy-production.yml  # Production deployment
│   └── CODEOWNERS
│
├── .vscode/
│   ├── settings.json              # Workspace settings
│   ├── launch.json                # Debug configuration
│   └── extensions.json            # Recommended extensions
│
├── app/                           # Next.js app directory (React Server Components)
│   ├── layout.tsx                 # Root layout with theme provider
│   ├── page.tsx                   # Home page
│   ├── not-found.tsx              # 404 page
│   ├── error.tsx                  # Error boundary
│   ├── loading.tsx                # Loading skeleton
│   │
│   ├── (auth)/                    # Auth routes (layout group)
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── register/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify-email/
│   │
│   ├── (public)/                  # Public pages (layout group)
│   │   ├── page.tsx               # Home
│   │   ├── layout.tsx
│   │   ├── explore/
│   │   │   ├── page.tsx           # Explore/discovery page
│   │   │   ├── layout.tsx
│   │   │   └── [[...filters]]/    # Dynamic filtering
│   │   ├── videos/
│   │   │   ├── page.tsx
│   │   │   ├── [videoId]/
│   │   │   │   ├── page.tsx       # Video player page
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── models/
│   │   │   ├── page.tsx           # Models directory
│   │   │   ├── [modelId]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── search/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   │
│   ├── (protected)/               # Protected routes (requires auth)
│   │   ├── layout.tsx             # Auth check, redirect logic
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── library/           # Watchlist, favorites
│   │   │   ├── history/           # Watch history
│   │   │   ├── subscriptions/     # Subscription management
│   │   │   └── settings/
│   │   ├── profile/
│   │   │   ├── page.tsx           # User profile
│   │   │   ├── [username]/        # Public profile view
│   │   │   └── edit/              # Edit profile
│   │   ├── watch/
│   │   │   └── [videoId]/
│   │   │       └── page.tsx       # Watch page (authenticated)
│   │   └── upload/                # Content upload
│   │       ├── page.tsx
│   │       └── [uploadId]/
│   │
│   ├── (admin)/                   # Admin panel (role-protected)
│   │   ├── layout.tsx             # Admin layout
│   │   ├── page.tsx               # Admin dashboard
│   │   ├── content/
│   │   │   ├── page.tsx           # Content management
│   │   │   ├── [contentId]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/
│   │   │   └── bulk/              # Bulk operations
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   ├── [userId]/
│   │   │   └── roles/
│   │   ├── models/
│   │   │   ├── page.tsx
│   │   │   └── [modelId]/
│   │   ├── moderation/
│   │   │   ├── reports/
│   │   │   ├── flags/
│   │   │   └── queue/
│   │   ├── analytics/
│   │   │   ├── overview/
│   │   │   ├── users/
│   │   │   ├── content/
│   │   │   └── revenue/
│   │   ├── ads/
│   │   │   ├── campaigns/
│   │   │   ├── placements/
│   │   │   └── performance/
│   │   ├── settings/
│   │   │   ├── general/
│   │   │   ├── integrations/
│   │   │   └── email/
│   │   └── audit-log/
│   │
│   └── api/                       # API routes
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts       # POST /api/auth/login
│       │   ├── register/
│       │   │   └── route.ts
│       │   ├── refresh/
│       │   │   └── route.ts
│       │   ├── logout/
│       │   │   └── route.ts
│       │   └── session/
│       │       └── route.ts
│       ├── v1/                    # API v1
│       │   ├── videos/
│       │   │   ├── route.ts       # GET, POST /api/v1/videos
│       │   │   └── [videoId]/
│       │   │       └── route.ts   # GET, PUT, DELETE
│       │   ├── models/
│       │   │   ├── route.ts
│       │   │   └── [modelId]/
│       │   │       └── route.ts
│       │   ├── users/
│       │   │   ├── me/
│       │   │   │   └── route.ts
│       │   │   └── [userId]/
│       │   │       └── route.ts
│       │   ├── search/
│       │   │   ├── route.ts
│       │   │   └── suggestions/
│       │   │       └── route.ts
│       │   ├── subscriptions/
│       │   │   ├── route.ts
│       │   │   ├── [subId]/
│       │   │   │   └── route.ts
│       │   │   └── checkout/
│       │   │       └── route.ts
│       │   ├── analytics/
│       │   │   ├── events/
│       │   │   │   └── route.ts
│       │   │   ├── dashboard/
│       │   │   │   └── route.ts
│       │   │   └── [contentId]/
│       │   │       └── route.ts
│       │   ├── admin/
│       │   │   ├── content/
│       │   │   ├── users/
│       │   │   ├── reports/
│       │   │   └── audit-log/
│       │   └── health/
│       │       └── route.ts
│       │
│       └── webhooks/              # External service webhooks
│           ├── stripe/
│           │   └── route.ts
│           ├── cloudflare/
│           │   └── route.ts
│           └── video-processing/
│               └── route.ts
│
├── src/
│   ├── components/                # Reusable UI components
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── PublicLayout.tsx
│   │   ├── video/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoGrid.tsx
│   │   │   └── VideoThumbnail.tsx
│   │   ├── model/
│   │   │   ├── ModelCard.tsx
│   │   │   ├── ModelGrid.tsx
│   │   │   └── ModelProfile.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PasswordResetForm.tsx
│   │   ├── subscription/
│   │   │   ├── PricingTable.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   └── CheckoutForm.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ContentModeration.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── FilterPanel.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Tabs.tsx
│   │       ├── Dropdown.tsx
│   │       └── ... (shadcn/ui components)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts             # Auth context hook
│   │   ├── useTheme.ts            # Theme management
│   │   ├── useVideo.ts            # Video data fetching
│   │   ├── useSearch.ts           # Search functionality
│   │   ├── usePagination.ts       # Pagination logic
│   │   ├── useLocalStorage.ts     # Persistent state
│   │   └── useInfiniteScroll.ts   # Infinite scroll
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # Fetch client with interceptors
│   │   │   ├── endpoints.ts       # API endpoint constants
│   │   │   └── serializers.ts     # Request/response transformation
│   │   ├── auth/
│   │   │   ├── tokens.ts          # Token management
│   │   │   └── permissions.ts     # Permission checking
│   │   ├── video/
│   │   │   ├── streaming.ts       # HLS streaming logic
│   │   │   ├── quality.ts         # Quality selection logic
│   │   │   └── player-config.ts   # Player configuration
│   │   ├── search/
│   │   │   ├── query-builder.ts
│   │   │   ├── filters.ts
│   │   │   └── ranking.ts
│   │   ├── analytics/
│   │   │   ├── events.ts          # Event tracking
│   │   │   ├── tracker.ts
│   │   │   └── logger.ts
│   │   ├── storage/
│   │   │   ├── r2-client.ts       # Cloudflare R2 wrapper
│   │   │   ├── upload.ts
│   │   │   └── cdn.ts             # CDN URL generation
│   │   ├── validation/
│   │   │   ├── schemas.ts         # Zod validation schemas
│   │   │   ├── email.ts
│   │   │   └── file.ts
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   ├── number.ts
│   │   │   ├── string.ts
│   │   │   ├── formatting.ts
│   │   │   └── helpers.ts
│   │   └── constants/
│   │       ├── api.ts
│   │       ├── storage.ts
│   │       ├── video-qualities.ts
│   │       └── limits.ts
│   │
│   ├── server/
│   │   ├── services/              # Business logic services
│   │   │   ├── auth-service.ts
│   │   │   ├── user-service.ts
│   │   │   ├── content-service.ts
│   │   │   ├── video-service.ts
│   │   │   ├── model-service.ts
│   │   │   ├── search-service.ts
│   │   │   ├── subscription-service.ts
│   │   │   ├── analytics-service.ts
│   │   │   ├── ad-service.ts
│   │   │   ├── storage-service.ts
│   │   │   ├── email-service.ts
│   │   │   └── admin-service.ts
│   │   ├── middleware/            # API middleware
│   │   │   ├── auth.ts            # Auth check
│   │   │   ├── rate-limit.ts      # Rate limiting
│   │   │   ├── validation.ts      # Input validation
│   │   │   ├── error-handler.ts   # Error handling
│   │   │   ├── cors.ts
│   │   │   └── logging.ts
│   │   ├── handlers/              # API route handlers
│   │   │   ├── auth-handler.ts
│   │   │   ├── video-handler.ts
│   │   │   ├── user-handler.ts
│   │   │   ├── search-handler.ts
│   │   │   ├── admin-handler.ts
│   │   │   └── webhook-handler.ts
│   │   ├── jobs/                  # Background jobs
│   │   │   ├── video-transcoding.ts
│   │   │   ├── email-sending.ts
│   │   │   ├── cleanup.ts
│   │   │   ├── analytics-aggregation.ts
│   │   │   └── report-generation.ts
│   │   ├── db/
│   │   │   ├── prisma.ts          # Prisma client instance
│   │   │   └── queries/
│   │   │       ├── user-queries.ts
│   │   │       ├── content-queries.ts
│   │   │       └── analytics-queries.ts
│   │   ├── redis/
│   │   │   └── client.ts          # Redis client instance
│   │   ├── auth/
│   │   │   ├── nextauth.config.ts # NextAuth configuration
│   │   │   └── jwt.ts
│   │   └── config/
│   │       ├── env.ts             # Environment variables
│   │       ├── feature-flags.ts
│   │       └── app-config.ts
│   │
│   ├── types/
│   │   ├── index.ts               # Main type exports
│   │   ├── api.ts                 # API response types
│   │   ├── auth.ts
│   │   ├── content.ts
│   │   ├── user.ts
│   │   ├── subscription.ts
│   │   ├── analytics.ts
│   │   ├── video.ts
│   │   ├── model.ts
│   │   └── db.ts                  # Prisma generated types
│   │
│   ├── styles/
│   │   ├── globals.css            # Global styles
│   │   ├── variables.css           # CSS custom properties (theme)
│   │   ├── tailwind.css            # Tailwind directives
│   │   └── animations.css          # Custom animations
│   │
│   └── config/
│       ├── site-config.ts         # Site metadata
│       ├── theme-config.ts        # Theme configuration
│       └── feature-flags.ts       # Feature flags
│
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   ├── seed.ts                    # Database seeding
│   └── migrations/                # Database migrations
│       ├── migration_lock.toml
│       └── [timestamp]_init/
│           └── migration.sql
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   └── og-image.png           # Open graph image
│   ├── icons/
│   │   ├── favicon.ico
│   │   ├── apple-touch-icon.png
│   │   └── android-chrome-*.png
│   ├── fonts/
│   │   └── ... (custom fonts)
│   └── videos/
│       └── demo.mp4               # Demo video
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validation/
│   ├── integration/
│   │   ├── api/
│   │   └── database/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── video-player.spec.ts
│   │   └── subscription.spec.ts
│   └── setup.ts                   # Test configuration
│
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md        # This file
│   │   ├── DATABASE_SCHEMA.md
│   │   ├── PROJECT_STRUCTURE.md
│   │   ├── ENTITY_RELATIONSHIPS.md
│   │   └── API.md
│   ├── guides/
│   │   ├── SETUP.md
│   │   ├── CONTRIBUTING.md
│   │   ├── DEPLOYMENT.md
│   │   └── TROUBLESHOOTING.md
│   └── roadmap/
│       └── DEVELOPMENT_ROADMAP.md
│
├── .env.example                   # Environment variables template
├── .env.local                     # Local environment (gitignored)
├── .env.production                # Production env
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json                  # TypeScript configuration
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── jest.config.js                 # Jest test configuration
├── package.json
├── pnpm-lock.yaml / package-lock.json
├── README.md
└── LICENSE
```

---

## Frontend Structure

### Pages Organization

**Route Groups** (parentheses indicate layout groups):

- `(auth)` - Authentication pages (no header/sidebar)
- `(public)` - Public pages with standard layout
- `(protected)` - User dashboard and account pages (auth required)
- `(admin)` - Admin panel (role required)

### Component Hierarchy

```
App Root
├── Theme Provider
├── Auth Provider
├── Layout (Header, Sidebar, Footer)
├── Page Component
│   ├── Hero/Banner
│   ├── Content Grid
│   ├── Filters/Sidebar
│   └── Pagination
└── Modal / Toast Container
```

### Component Naming

- Functional components use PascalCase: `VideoCard.tsx`
- Hooks use camelCase: `useVideo.ts`
- Styles co-located or in `styles/` folder
- Tests in `__tests__/` folder at same level

---

## Backend Structure

### Services Layer

Each service handles business logic for a domain:

```typescript
// Example structure
export class VideoService {
  async getVideoById(videoId: string): Promise<Video> { }
  async listVideos(filters: VideoFilters): Promise<Video[]> { }
  async createVideo(data: CreateVideoDTO): Promise<Video> { }
  async updateVideo(id: string, data: UpdateVideoDTO): Promise<Video> { }
  async deleteVideo(id: string): Promise<void> { }
  async incrementViews(videoId: string): Promise<void> { }
}
```

### API Routes

Routes delegate to services and handle HTTP concerns:

```typescript
// /app/api/v1/videos/route.ts
export async function GET(req: Request) {
  // Validate
  // Call service
  // Return response
}
```

### Database Access

- Use Prisma ORM exclusively
- Services call database through Prisma client
- Query optimization at service level
- Connection pooling handled by Prisma

### Middleware Stack

```
Request → CORS → Auth Check → Rate Limit → Validation → 
  Handler → Service → Database → Response → Error Handler
```

---

## Database & Configuration

### Prisma Setup

```
prisma/
├── schema.prisma       # Single source of truth for data model
├── seed.ts             # Initial data
└── migrations/         # Version controlled migrations
```

### Environment Variables

Development and production configs are separate:

```env
# .env.local (development)
DATABASE_URL="postgresql://user:pass@localhost:5432/vanta_dev"
NEXTAUTH_SECRET="dev-secret"

# .env.production (production)
DATABASE_URL="postgresql://prod-user:pass@prod-db:5432/vanta"
NEXTAUTH_SECRET="secure-random-secret"
```

### Feature Flags

```typescript
// src/server/config/feature-flags.ts
export const FEATURES = {
  LIVE_STREAMING: process.env.FEATURE_LIVE_STREAMING === 'true',
  ANALYTICS_V2: process.env.FEATURE_ANALYTICS_V2 === 'true',
  AD_SYSTEM: process.env.FEATURE_AD_SYSTEM === 'true',
};
```

---

## Naming Conventions

### Files & Folders

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `VideoCard.tsx` |
| Hooks | camelCase, `use` prefix | `useVideo.ts` |
| Services | PascalCase, `Service` suffix | `VideoService.ts` |
| Utils | camelCase | `formatting.ts` |
| Types | PascalCase | `VideoType.ts` or inline |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE.ts` |
| API routes | kebab-case folders | `/api/v1/videos` |

### Code

| Item | Convention | Example |
|------|-----------|---------|
| Types | PascalCase | `interface User { }` |
| Variables | camelCase | `const videoData = {}` |
| Constants | UPPER_SNAKE_CASE | `const MAX_SIZE = 1000` |
| Functions | camelCase | `function fetchVideo() { }` |
| React Props | camelCase | `<Video onPlay={() => {}} />` |
| CSS Classes | kebab-case | `video-player__control` |

### API Endpoints

Pattern: `/api/v{version}/{resource}/{action?}`

```
/api/v1/videos                 # List videos
/api/v1/videos/:id             # Get video
/api/v1/videos/:id/stats       # Specific resource action
/api/v1/videos/:id/comments    # Nested resource
```

---

## Module Organization

### Shared Modules

These modules are imported across the application:

```typescript
// lib/
export * from './api'
export * from './auth'
export * from './video'
export * from './utils'

// types/
export type * from './api'
export type * from './user'
export type * from './content'
```

### Dependency Injection

Services are instantiated in route handlers:

```typescript
// app/api/v1/videos/route.ts
const videoService = new VideoService()
const response = await videoService.getVideoById(videoId)
```

Or use a factory pattern for complex dependencies:

```typescript
// server/factories/service-factory.ts
export function createVideoService(): VideoService {
  const db = prisma
  const storage = new R2StorageService()
  return new VideoService(db, storage)
}
```

---

## File Size Guidelines

| Item | Target | Warning |
|------|--------|---------|
| Single component | < 300 lines | Split into smaller components |
| Single service | < 500 lines | Split into multiple services |
| Single page | < 200 lines | Use more components |
| API route | < 100 lines | Delegate to handler/service |

---

## Directory Growth Path

### Phase 1 (Initial)
- Basic structure with core folders
- Limited feature set
- Minimal database models

### Phase 2 (Scale)
- Feature-specific sub-folders
- Modularized services
- Advanced caching strategies
- Comprehensive test coverage

### Phase 3 (Enterprise)
- Monorepo structure (if needed)
- Separate admin application
- Microservices consideration
- GraphQL layer

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-16 | Initial project structure design |


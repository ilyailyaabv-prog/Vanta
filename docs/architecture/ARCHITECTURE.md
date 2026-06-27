# Vanta - System Architecture Documentation

**Version:** 1.0.0  
**Date:** 2026-06-16  
**Status:** Architecture Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Architectural Principles](#architectural-principles)
4. [System Overview](#system-overview)
5. [Core Components](#core-components)
6. [API Architecture](#api-architecture)
7. [Authentication & Authorization](#authentication--authorization)
8. [Content Delivery](#content-delivery)
9. [Scalability Considerations](#scalability-considerations)
10. [Performance Optimization](#performance-optimization)
11. [Security Architecture](#security-architecture)
12. [Monitoring & Analytics](#monitoring--analytics)

---

## Executive Summary

Vanta is a next-generation video content platform with an integrated model discovery system, premium content management, and advanced analytics. The platform combines a modern web stack with scalable cloud infrastructure to deliver a mobile-first experience with full dark theme support.

**Key Features:**
- **Video Library Management**: Organize and distribute video content across multiple categories
- **Model Discovery**: Browse, filter, and discover models with tagging and search capabilities
- **Premium Subscription System**: Tiered content access and exclusive features
- **Admin Dashboard**: Complete content and system management interface
- **Analytics Engine**: Real-time user behavior and content performance tracking
- **Advertising System**: In-video and placement-based advertising infrastructure
- **User Accounts**: Comprehensive user management with roles and permissions

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark theme configuration
- **UI Components**: shadcn/ui (headless component library)
- **State Management**: React Context API + Custom Hooks
- **HTTP Client**: Fetch API / TanStack Query for server state
- **Form Handling**: React Hook Form + Zod validation
- **Video Player**: Custom wrapper around HLS.js / Plyr.js

### Backend
- **Runtime**: Node.js (via Next.js API Routes)
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: NextAuth.js with JWT
- **Job Queue**: Bull / BullMQ for async tasks
- **Caching**: Redis for session and query caching
- **Rate Limiting**: Custom middleware with Redis

### Infrastructure
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **CDN**: Cloudflare CDN for static assets and video distribution
- **Hosting**: Vercel or self-hosted Node.js (PM2/Docker)
- **Database Hosting**: AWS RDS / Supabase / Railway
- **Task Queue**: Bull on Redis or AWS SQS

### Development Tools
- **Package Manager**: npm / pnpm
- **Version Control**: Git
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Environment Management**: .env.local / .env.production

---

## Architectural Principles

### 1. **Scalability First**
- Stateless API design for horizontal scaling
- Database query optimization and indexing strategy
- Caching layers at multiple levels (browser, CDN, Redis, database)
- Async processing for heavy operations (video transcoding, report generation)

### 2. **Mobile-First Design**
- Responsive UI components using Tailwind CSS
- Touch-friendly interface elements
- Optimized image and video delivery for mobile networks
- Progressive enhancement strategy

### 3. **Dark Theme Native**
- CSS custom properties for theming
- Tailwind dark mode configuration
- Automatic theme detection and persistence
- Dark-optimized color palette throughout

### 4. **API-First Architecture**
- REST endpoints with consistent response format
- Versioned API (`/api/v1`, `/api/v2`)
- Request/response compression
- Comprehensive error handling with meaningful codes

### 5. **Separation of Concerns**
- Clear boundaries between frontend and backend
- Database schema independent from ORM models
- Business logic decoupled from HTTP handlers
- Admin panel as separate Next.js application or route group

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Web (Next.js)  │  Mobile Web  │  Admin Dashboard  │  Analytics  │
└────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN / Edge                         │
│  (Static Assets, Rate Limiting, DDoS Protection)                │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                             │
├─────────────────────────────────────────────────────────────────┤
│  Auth    │ Content  │ Search  │  Users  │  Admin  │  Analytics  │
└────────┬───────────┬─────────┬────────┬─────────┬──────────────┘
         │           │         │        │         │
         ▼           ▼         ▼        ▼         ▼
┌──────────────────────────────────────────────────────────────────┐
│           Service Layer (Business Logic)                         │
├──────────────────────────────────────────────────────────────────┤
│  UserService  │  ContentService  │  SearchService  │  AdminService│
└──────────────────────────────────────────────────────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Data Access Layer                               │
├──────────────────────────────────────────────────────────────────┤
│  Prisma ORM  │  Database Queries  │  Redis Cache  │  R2 Access  │
└────────┬─────────────┬──────────────┬─────────────┬──────────────┘
         │             │              │             │
         ▼             ▼              ▼             ▼
     PostgreSQL    PostgreSQL       Redis       Cloudflare R2
     (Primary)     (Primary)        (Cache)     (Media Storage)
```

---

## Core Components

### 1. **Authentication & Authorization Module**
- NextAuth.js with JWT tokens
- OAuth providers (Google, GitHub, social login)
- Email/password authentication with verification
- Role-based access control (RBAC)
- Session management and refresh token rotation
- API key management for integrations

### 2. **Content Management System**
- Video metadata management
- Model profiles and information
- Tag taxonomy and categorization
- Content versioning and history
- Bulk operations and batch processing
- Content moderation workflow

### 3. **Premium Subscription System**
- Subscription tier management (Free, Pro, Premium)
- Billing integration (Stripe / Paddle)
- Usage tracking and quota management
- Feature flags based on subscription level
- Payment history and invoicing
- Cancellation and retention flows

### 4. **Video Delivery System**
- HLS streaming protocol support
- Adaptive bitrate streaming
- Progressive download support
- Video thumbnail generation
- Closed caption support
- DRM/watermarking capability

### 5. **Search & Discovery Engine**
- Full-text search across models and videos
- Filtering by multiple criteria (tags, models, duration, etc.)
- Faceted search interface
- Trending and recommended content algorithm
- Search analytics and trending topics
- Autocomplete suggestions

### 6. **Analytics & Reporting**
- User behavior tracking (page views, clicks, watch time)
- Content performance metrics
- Revenue analytics
- User cohort analysis
- Real-time dashboards
- Export reports in multiple formats

### 7. **Advertising System**
- Ad placement management
- Banner and video ad support
- Advertiser dashboard
- Ad performance tracking
- Audience targeting options
- Revenue optimization

### 8. **Admin Dashboard**
- Content management interface
- User management and moderation
- Analytics dashboards
- System configuration
- Report generation
- Audit logging

---

## API Architecture

### API Structure
```
/api/v1/
├── /auth/
│   ├── POST /auth/login
│   ├── POST /auth/register
│   ├── POST /auth/refresh
│   ├── POST /auth/logout
│   └── GET  /auth/session
├── /videos/
│   ├── GET  /videos (with pagination, filtering)
│   ├── GET  /videos/:id
│   ├── POST /videos (admin only)
│   ├── PUT  /videos/:id (admin only)
│   └── DELETE /videos/:id (admin only)
├── /models/
│   ├── GET  /models
│   ├── GET  /models/:id
│   ├── POST /models (admin only)
│   └── PUT  /models/:id (admin only)
├── /tags/
│   ├── GET  /tags
│   ├── GET  /tags/:id
│   └── POST /tags (admin only)
├── /users/
│   ├── GET  /users/me
│   ├── PUT  /users/me
│   ├── POST /users/me/avatar
│   └── GET  /users/:id (public profile)
├── /subscriptions/
│   ├── GET  /subscriptions
│   ├── POST /subscriptions/create
│   ├── POST /subscriptions/cancel
│   └── GET  /subscriptions/checkout-session
├── /search/
│   ├── GET  /search/query
│   ├── GET  /search/suggestions
│   └── GET  /search/trending
├── /analytics/
│   ├── GET  /analytics/dashboard (admin only)
│   ├── GET  /analytics/content/:id
│   └── POST /analytics/events (client-side tracking)
├── /ads/
│   ├── GET  /ads/config
│   ├── GET  /ads/placements
│   └── POST /ads/track
├── /admin/
│   ├── GET  /admin/users (admin only)
│   ├── GET  /admin/content (admin only)
│   ├── PUT  /admin/content/:id/status (admin only)
│   ├── GET  /admin/reports (admin only)
│   └── POST /admin/audit-log (admin only)
└── /health/
    └── GET  /health (status check)
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-06-16T10:00:00Z",
    "version": "1.0.0"
  },
  "errors": null
}
```

---

## Authentication & Authorization

### Authentication Flow
1. **Registration**: Email verification → Create user account → Redirect to login
2. **Login**: Email/password verification → Generate JWT → Set secure httpOnly cookie
3. **Refresh**: Use refresh token → Issue new access token
4. **Logout**: Clear tokens → Invalidate session in Redis

### Authorization Levels
- **Public**: Unauthenticated users (read-only access to free content)
- **User**: Authenticated users with basic subscription
- **Premium**: Upgraded subscription tier users
- **Moderator**: Content review and moderation permissions
- **Admin**: Full system access and management

### Token Strategy
- **Access Token**: Short-lived (15 minutes), stored in memory/httpOnly cookie
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie, rotated on use
- **API Keys**: For third-party integrations, with scope restrictions

---

## Content Delivery

### Video Storage & CDN Strategy
1. **Upload**: User uploads video → Temporary S3 storage
2. **Processing**: Video transcoding → Multiple quality levels (480p, 720p, 1080p, 4K)
3. **Storage**: Transcoded videos → Cloudflare R2 (primary), R2 with regional buckets for redundancy
4. **Distribution**: R2 + Cloudflare CDN → Edge caching at geographic regions
5. **Streaming**: Client requests → Nearest CDN edge → Adaptive bitrate selection

### Media File Organization in R2
```
vanta-media/
├── videos/
│   ├── {videoId}/
│   │   ├── original.mp4
│   │   ├── 480p.mp4
│   │   ├── 720p.mp4
│   │   ├── 1080p.mp4
│   │   ├── 4k.mp4
│   │   ├── hls/
│   │   │   └── playlist.m3u8
│   │   └── thumbnails/
│   │       ├── cover.webp
│   │       ├── preview-1.webp
│   │       └── preview-2.webp
├── avatars/
│   └── {userId}/{fileName}
└── exports/
    └── {userId}/{exportId}.csv
```

### Streaming Protocol
- **Primary**: HLS (HTTP Live Streaming) with adaptive bitrate
- **Fallback**: Progressive MP4 download
- **Manifest Structure**: Master.m3u8 → variant playlists → TS segments (10s duration)

---

## Scalability Considerations

### Database Scaling
- **Read Replicas**: PostgreSQL replicas for read-heavy operations (content browsing, analytics queries)
- **Connection Pooling**: PgBouncer for efficient connection management
- **Partitioning**: Time-based partitioning for analytics events table
- **Indexing Strategy**: B-tree indexes on frequently filtered columns (user_id, status, created_at)
- **Query Optimization**: N+1 query prevention, query result caching

### Horizontal Scaling
- **Stateless API**: Sessions stored in Redis, not in memory
- **Load Balancing**: Round-robin or least-connections across API instances
- **Deployment**: Docker containers on Kubernetes or managed services (Vercel, Railway)
- **Auto-scaling**: Scale based on CPU/memory utilization or request rate

### Caching Strategy
- **Browser Cache**: Long TTL for static assets (30 days)
- **CDN Cache**: Medium TTL for content metadata (1 hour)
- **Redis Cache**: Frequently accessed queries (trending videos, user data)
- **Database Query Cache**: Results cache at ORM level
- **Cache Invalidation**: Event-driven via API calls or time-based TTL

### Queue & Async Processing
- **Heavy Operations**: Video transcoding, report generation, email sending
- **Job Queue**: Bull/BullMQ on Redis with priority levels
- **Retry Logic**: Exponential backoff (3-5 retries) with dead-letter queue
- **Monitoring**: Job status tracking and failure alerts

---

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Route-based chunks with dynamic imports
- **Image Optimization**: Next.js Image component with WebP format
- **Bundle Size**: Tree-shaking, minification, lazy loading of components
- **Core Web Vitals**: LCP optimization, CLS prevention, FID optimization
- **Prefetching**: Predictive prefetch for next likely user actions

### Backend Optimization
- **API Response Compression**: gzip/brotli compression at 500 bytes+
- **Query Optimization**: Select specific fields, join optimization
- **Pagination**: Cursor-based pagination for large datasets
- **ETag Support**: Conditional requests to reduce payload
- **GraphQL Option**: Optional GraphQL layer for flexibility (future consideration)

### Video Optimization
- **Thumbnail Generation**: WebP format, multiple sizes for responsive design
- **Adaptive Streaming**: Auto-adjust quality based on network speed
- **Preloading**: Video preview generation for smooth UX
- **Segment Caching**: CDN-level caching of video segments

---

## Security Architecture

### Data Protection
- **Encryption in Transit**: TLS 1.3 for all connections
- **Encryption at Rest**: Database encryption (AWS RDS encryption key), R2 encryption
- **Password Security**: Bcrypt hashing with salt (cost factor 12)
- **API Keys**: Secure storage in environment variables, rotation policy

### Access Control
- **CORS**: Whitelist origin domains
- **CSRF Protection**: SameSite cookies, CSRF token validation
- **Rate Limiting**: Per-IP and per-user limits
- **API Authentication**: Bearer token validation on protected routes
- **Admin Access**: IP whitelisting, additional 2FA requirement

### Content Security
- **Content Moderation**: Pre-upload scanning, manual review workflow
- **DRM Support**: Ready for digital rights management integration
- **Watermarking**: Optional customer watermarking for premium content
- **Copyright Protection**: Takedown notice workflow, DMCA compliance

### Audit & Compliance
- **Audit Logging**: All admin actions logged with timestamps
- **Data Privacy**: GDPR compliance (data export, deletion), CCPA compliance
- **Compliance Reporting**: Generate compliance reports for stakeholders
- **Security Scanning**: Regular vulnerability assessments

---

## Monitoring & Analytics

### Application Monitoring
- **Error Tracking**: Sentry for frontend/backend error monitoring
- **Performance Monitoring**: Vercel Analytics, custom metrics
- **Uptime Monitoring**: Uptime robot or similar for health checks
- **Logging**: Structured logging (JSON format) with ELK stack or Datadog
- **Alerts**: PagerDuty/Slack notifications for critical issues

### User Analytics
- **Event Tracking**: Custom events for user actions (watch, like, subscribe)
- **Funnel Analysis**: Registration → Subscription → Active user funnels
- **Cohort Analysis**: User behavior by signup date, region, device
- **Attribution**: Track which content/ads drive conversions
- **Dashboard**: Real-time analytics with custom report builder

### Business Metrics
- **Revenue Tracking**: Subscription revenue, ad revenue, churn rate
- **Content Performance**: Most watched videos, trending models, content ROI
- **User Engagement**: DAU, MAU, session duration, retention
- **Advertising Performance**: Ad impressions, clicks, CTR, revenue per 1000 impressions

---

## Environment Configuration

### Development Environment
```
DATABASE_URL=postgresql://user:pass@localhost:5432/vanta_dev
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000
R2_BUCKET_NAME=vanta-dev
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
```

### Production Environment
```
DATABASE_URL=postgresql://prod-user:secure-pass@prod-db.aws.com:5432/vanta
REDIS_URL=redis://prod-redis:6379
NEXTAUTH_SECRET=secure-production-secret
NEXTAUTH_URL=https://vanta.com
R2_BUCKET_NAME=vanta-prod
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
SENTRY_DSN=https://xxx@sentry.io/project-id
```

---

## Deployment Architecture

### Staging Environment
- Separate PostgreSQL database (replica of production structure)
- Dedicated R2 bucket with staging data
- Full-featured testing environment
- Deploy on every main branch commit

### Production Environment
- Database failover strategy (multi-AZ deployment)
- R2 with redundancy and backup policy
- CDN with edge locations globally
- Blue-green or canary deployment strategy
- Regular backups (daily incremental, weekly full)
- Point-in-time recovery capability

---

## Future Considerations

### Phase 2 Features
- GraphQL API layer
- WebRTC for live streaming
- Machine learning for content recommendations
- Mobile app (React Native)
- Multi-language support
- DRM integration
- Advanced payment models (BNPL, subscriptions)

### Phase 3 Enhancement
- Microservices architecture transition
- Event-driven architecture with Kafka
- Advanced search with Elasticsearch
- AI-powered content tagging
- Personalization engine
- Federated learning for privacy

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-16 | Initial architecture design |


# ListSnapper - QR Code Management SaaS

## Overview

ListSnapper is a comprehensive QR code management SaaS application that enables users to create dynamic QR codes, track analytics, manage subscriptions, and order physical products (stickers and yard signs). The platform features a modern, mint-green themed interface with support for both English and French languages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS with custom theming for styling
- shadcn/ui component library built on Radix UI primitives
- Tooltip components for enhanced UX

**Design System:**
- Primary color: Mint green (#22c55e / hsl(142, 71%, 45%))
- Dark mode support via theme provider
- CSS variables for theming consistency
- Inter font family as primary typeface
- Glassmorphism effects for modern UI elements
- Interactive tooltips with copy-to-clipboard functionality

**State Management:**
- React Query for API data fetching and caching
- Context API for authentication state (AuthProvider)
- Context API for theme management (ThemeProvider)
- Local storage for auth tokens and user preferences

**Internationalization:**
- i18next for multi-language support (English and French)
- Translation files located in `client/public/locales/`
- Language persistence in localStorage

**Key Pages:**
- Landing page with hero section and feature showcase
- Authentication (Login/Register) with modal error dialogs
- Dashboard for QR code management
- QR code creation and detail views with color customization
- Analytics dashboard with charts and metrics
- Orders management
- Settings/Profile management
- Professional admin dashboard with comprehensive analytics and filters
- Pricing page with subscription tiers
- Checkout flow with Stripe integration

### Backend Architecture

**Technology Stack:**
- Express.js with TypeScript
- PostgreSQL database via Neon serverless
- Drizzle ORM for database operations
- JWT for authentication
- bcryptjs for password hashing

**API Structure:**
- RESTful API endpoints prefixed with `/api`
- JWT middleware for protected routes
- Admin authentication middleware for privileged operations
- Stripe webhook handling for payment events
- Custom logging middleware for request tracking

**Authentication Flow:**
- JWT token-based authentication
- Dual auth support: Bearer tokens in Authorization header OR HttpOnly cookies
- Token stored in localStorage on client (for backward compatibility)
- Secure HttpOnly cookies for OAuth and enhanced security
- Authorization header for API requests
- Session validation on protected routes
- Modal dialogs for authentication errors (replacing toast notifications)

**Core Services:**
- User management and authentication
- QR code CRUD operations
- Scan tracking and analytics aggregation
- Membership tier management
- Order processing and status tracking
- Stripe subscription and payment handling

### Data Storage

**Database: PostgreSQL (Neon Serverless)**

**Schema Design:**

*Users Table:*
- UUID primary keys
- Email/password authentication
- Profile information (firstName, lastName, company)
- Admin flag for privileged access
- Stripe customer and subscription IDs
- Saved shipping addresses

*Membership System:*
- Three-tier structure: FREE, STANDARD, PRO
- Tier definitions with feature flags and limits
- User membership tracking with expiration dates
- Stripe price IDs for subscription management

*QR Codes:*
- User-owned QR codes with short codes for redirection
- Destination URLs (dynamic linking with edit capability)
- URL change history tracking (qr_code_url_history table)
- Customizable QR code and background colors (customColor, customBgColor fields)
- Visual color picker and hex input for color editing
- Live preview of color changes before saving
- Copy-to-clipboard for short codes and full URLs with tooltips
- Active/inactive status
- Scan count tracking

*Scan Analytics:*
- Individual scan records with timestamps
- Device, browser, OS information via UA-Parser
- IP addresses and geolocation data
- Referrer tracking

*Orders:*
- Product orders (stickers, yard signs)
- Shipping restrictions: Stickers available for USA/Canada/UK, Yard signs USA-only
- Status tracking (pending, processing, shipped, delivered, cancelled)
- Shipping address information with country selection
- Order status history for audit trail
- Stripe payment integration
- Country normalization for legacy address data

**ORM Choice: Drizzle**
- Type-safe database queries
- Schema-first approach with TypeScript
- Migration support via drizzle-kit
- Neon serverless WebSocket connection pooling

### Authentication & Authorization

**JWT Authentication:**
- Secret key from environment variables
- Token expiration and refresh not explicitly implemented
- Bearer token in Authorization header

**OAuth Authentication:**
- Google OAuth 2.0 integration via passport-google-oauth20
- Facebook OAuth integration via passport-facebook
- OAuth buttons on login and register pages with social media branding
- Callback routes generate JWT tokens matching existing auth system
- OAuth users created with random passwords (social login only)
- Requires environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
- Callback URLs: /api/auth/google/callback and /api/auth/facebook/callback
- After OAuth success, users redirected directly to /dashboard
- Authentication via secure HttpOnly cookies (sameSite: 'lax', secure in production)
- Dual auth support: Bearer tokens in Authorization header OR HttpOnly cookies
- Logout endpoint clears both localStorage tokens and HttpOnly cookies

**User Roles:**
- Standard users with tiered memberships
- Admin users with elevated privileges (dev@a.com with password "password" for testing)
- Middleware guards for admin-only routes

**Password Security:**
- bcryptjs for hashing with salt rounds
- Minimum 6 characters password requirement
- No password reset flow currently implemented

### External Dependencies

**Stripe Integration:**
- Subscription management for membership tiers
- One-time payments for physical product orders
- Webhook handling for payment events
- Stripe Elements for checkout UI
- Client-side: `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Server-side: Stripe SDK with API version 2025-09-30.clover

**QR Code Generation:**
- `qrcode` library for generating QR code images
- Data URLs for browser rendering
- Downloadable QR codes

**Analytics & Tracking:**
- `ua-parser-js` for device/browser/OS detection
- Custom analytics aggregation in backend
- Time-range filtering for analytics queries

**UI Component Libraries:**
- Radix UI primitives (30+ components)
- shadcn/ui component system
- Lucide React for icons
- Class Variance Authority for component variants

**Database:**
- Neon serverless PostgreSQL
- WebSocket connections via `ws` library
- Connection pooling for performance

**Development Tools:**
- Replit-specific plugins for development environment
- Vite plugins for hot module replacement and error overlay
- TypeScript for type safety across the stack

**Build & Deployment:**
- Vite for frontend bundling
- esbuild for backend bundling
- Production build outputs to `dist/` directory
- Environment variables for configuration (DATABASE_URL, Stripe keys, JWT secret)

## Recent Changes

### October 3, 2025
- **Enhanced Admin Dashboard**: Redesigned with professional layout including primary/secondary metrics, top performers section, recent activity, and advanced search/filtering capabilities
- **QR Code Color Customization**: Added visual color picker with hex input for customizing QR code colors and background
- **Improved UX Elements**: 
  - Added tooltips with copy-to-clipboard for QR short codes and full URLs
  - Replaced toast notifications with professional modal dialogs for authentication errors
  - Enhanced error messages with user-friendly language
- **OAuth Security**: Migrated from URL query parameters to HttpOnly cookies for OAuth tokens
- **Dual Authentication**: Maintained backward compatibility with localStorage tokens while supporting secure cookie-based auth
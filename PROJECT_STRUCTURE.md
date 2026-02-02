# QR-Genie Project Structure & Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Key Files & Directories](#key-files--directories)
5. [Database Schema](#database-schema)
6. [Major Features](#major-features)
7. [Important Considerations](#important-considerations)
8. [Environment Variables](#environment-variables)
9. [API Routes](#api-routes)
10. [Development Workflow](#development-workflow)

---

## Project Overview

**QR-Genie** is a SaaS platform for creating, managing, and tracking dynamic QR codes. It provides a comprehensive solution for businesses and individuals to generate QR codes with advanced customization options, analytics, folder organization, and billing/subscription management.

### Core Capabilities
- Dynamic QR code generation with multiple types (Website, WiFi, Instagram, WhatsApp, vCard, PDF, etc.)
- Advanced QR code design customization (frames, colors, patterns, logos)
- Real-time analytics and scan tracking
- Folder-based organization
- 7-day free trial system
- Subscription-based billing (Free, Pro Monthly, Pro Annual)
- User authentication and authorization
- Responsive design with Tailwind CSS

---

## Tech Stack

### Frontend
- **Next.js 16.1.1** - React framework with SSR/SSG
- **React 18.2.0** - UI library
- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **react-icons** - Icon library
- **qrcode.react** - QR code generation library
- **qr-code-styling** - Advanced QR code styling
- **recharts** - Analytics charts

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma 5.7.0** - ORM for database management
- **PostgreSQL** - Production database (SQLite for development)
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **nanoid** - Unique ID generation

### Additional Libraries
- **qrcode** - Server-side QR code generation
- **canvas** - Image manipulation for QR downloads
- **resend** - Email service
- **cookie** - Cookie parsing

---

## Project Structure

```
qr_genie_tailwind/
├── components/              # React components
│   ├── qrFields/           # Form field components
│   ├── DashboardLayout.js  # Main dashboard wrapper
│   ├── DesignedQRCode.js   # QR code renderer with design
│   ├── FolderHeader.js     # Folder management UI
│   ├── QrDownloadModal.js  # Download modal
│   ├── QrOverviewModal.js  # QR details modal
│   ├── TrialBanner.js      # Trial status banner
│   └── UpgradeRequiredModal.js # Upgrade prompt modal
│
├── hooks/                  # Custom React hooks
│   └── useCapabilities.js  # User capabilities hook
│
├── lib/                    # Utility libraries
│   ├── billing/           # Billing & subscription logic
│   │   ├── plans.js       # Plan configurations
│   │   └── capabilities.js # Access control logic
│   ├── auth.js            # Authentication utilities
│   ├── email.js           # Email sending utilities
│   ├── prisma.js          # Prisma client instance
│   ├── qrDownload.js      # QR download utilities
│   ├── qrSchemas.js       # QR type schemas
│   ├── languages.js       # Language support
│   └── translations.js    # Translation utilities
│
├── pages/                  # Next.js pages & API routes
│   ├── api/               # API endpoints
│   │   ├── admin/         # Admin APIs
│   │   ├── analytics/     # Analytics APIs
│   │   ├── auth/          # Authentication APIs
│   │   ├── folders/       # Folder management APIs
│   │   ├── qr-image/      # QR image generation
│   │   └── vcard/         # vCard generation
│   ├── auth/              # Auth pages (login, register, etc.)
│   ├── dashboard/         # Dashboard pages
│   ├── admin/             # Admin dashboard
│   ├── r/                 # QR redirect handler
│   ├── pdf/               # PDF QR handler
│   ├── _app.js            # Next.js app wrapper
│   └── index.js           # Landing page
│
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma      # Database schema definition
│   └── migrations/        # Database migration files
│
├── styles/                 # Global styles
│   └── globals.css        # Global CSS
│
├── .env.example            # Environment variables template
├── .env.production        # Production environment variables
├── .gitignore             # Git ignore rules
├── ecosystem.config.js    # PM2 configuration
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies & scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # Basic project README
```

---

## Key Files & Directories

### Components (`/components`)

#### `DashboardLayout.js`
- **Purpose**: Main layout wrapper for all dashboard pages
- **Features**: Navigation, footer, responsive design
- **Key Props**: `title`, `description`, `children`
- **Important**: Handles authentication checks, provides consistent UI structure

#### `DesignedQRCode.js`
- **Purpose**: Renders QR codes with full design customization
- **Features**: Frame, pattern, corner, logo, colors, gradients
- **Key Functions**: `createQRConfig()` - Creates QR configuration object
- **Important**: Central component for all QR previews and downloads

#### `DynamicForm.js` (`/components/qrFields/`)
- **Purpose**: Dynamically renders forms based on QR type schema
- **Features**: Field validation, collapsible sections, folder selection
- **Key Props**: `schema`, `formData`, `updateFormData`, `type`, `folders`
- **Important**: Handles form state management for all QR types

#### `FieldComponents.js` (`/components/qrFields/`)
- **Purpose**: Reusable form field components
- **Components**: `InputField`, `TextareaField`, `SelectField`, `ToggleField`, `FolderField`
- **Important**: `FolderField` uses React Portals for dropdown positioning

#### `TrialBanner.js`
- **Purpose**: Displays trial days remaining and upgrade CTA
- **Features**: Responsive banner, dismissible, shows trial countdown
- **Important**: Only shows when user is in active trial

#### `UpgradeRequiredModal.js`
- **Purpose**: Modal shown when accessing paid features without access
- **Features**: Feature list, upgrade CTA, plan comparison
- **Important**: Standardized upgrade prompt across the app

### Hooks (`/hooks`)

#### `useCapabilities.js`
- **Purpose**: Client-side hook to get user capabilities
- **Returns**: `{ capabilities, loading, error, refetch }`
- **Features**: Fetches user data, computes trial status, determines access rights
- **Important**: Used throughout the app for feature gating

### Libraries (`/lib`)

#### `billing/plans.js`
- **Purpose**: Single source of truth for plans and pricing
- **Exports**: `PLANS`, `PLAN_IDS`, `TRIAL_DAYS`, helper functions
- **Important**: All plan-related logic references this file

#### `billing/capabilities.js`
- **Purpose**: Server-side capability computation
- **Key Functions**: 
  - `getUserCapabilities(user)` - Computes user access rights
  - `validateTrialStatus(user, prisma)` - Validates and updates trial status
  - `canUserPerformAction(user, action)` - Checks specific action permissions
- **Important**: Used in all API routes for access control

#### `auth.js`
- **Purpose**: Authentication utilities
- **Key Functions**:
  - `getUserFromRequest(req)` - Gets user from JWT token
  - `setLoginSession(res, user)` - Sets authentication cookie
  - `clearLoginSession(res)` - Clears authentication cookie
- **Important**: Validates trial status on every user fetch

#### `qrDownload.js`
- **Purpose**: Centralized QR code download utility
- **Key Function**: `downloadDesignedQR(qrValue, designData, format, size)`
- **Features**: PNG, JPG, SVG, PDF formats with size options
- **Important**: Ensures consistent QR downloads across the app

#### `qrSchemas.js`
- **Purpose**: Defines JSON schemas for each QR type
- **Features**: Field definitions, validation rules, field types
- **Important**: Used by `DynamicForm` to render type-specific forms

### Pages (`/pages`)

#### `index.js` (Landing Page)
- **Purpose**: Public marketing/landing page
- **Features**: Hero section, features, pricing, CTA
- **Important**: Entry point for new users

#### `dashboard/index.js`
- **Purpose**: Main dashboard - QR codes list
- **Features**: 
  - QR code cards with actions
  - Folder filtering and management
  - Bulk operations (select, delete)
  - Search and pagination
  - Trial banner
  - Upgrade modals
- **Important**: Central hub for QR code management

#### `dashboard/create-qr.js`
- **Purpose**: QR code creation flow
- **Features**: 
  - 3-step wizard (Type → Form → Design)
  - Real-time preview
  - Design customization
  - Download functionality
- **Important**: Most complex page, handles all QR types

#### `dashboard/analytics.js`
- **Purpose**: Analytics dashboard
- **Features**: 
  - Scan charts (daily, weekly, monthly)
  - Location data
  - Device breakdown
  - QR-specific analytics
- **Important**: Requires Pro plan access

#### `dashboard/billing.js`
- **Purpose**: Plans & pricing page
- **Features**: 
  - Plan comparison
  - Current plan display
  - Upgrade CTA
  - FAQ section
- **Important**: Uses shared plans config

#### `r/[slug].js`
- **Purpose**: QR code redirect handler
- **Features**: 
  - Resolves slug to destination URL
  - Tracks scan events
  - Handles password protection
  - Redirects to target URL
- **Important**: Core functionality - all QR codes redirect through this

### API Routes (`/pages/api`)

#### Authentication (`/api/auth/`)
- **`register.js`**: User registration with 7-day trial initialization
- **`login.js`**: User authentication
- **`logout.js`**: Session termination
- **`me.js`**: Get current user info
- **`forgot-password.js`**: Password reset request
- **`reset-password.js`**: Password reset completion

#### QR Code Management (`/api/`)
- **`create-dynamic.js`**: Creates new QR code with design data
  - **Important**: Enforces QR code limits based on plan
- **`my-qr-codes.js`**: Lists user's QR codes
- **`delete-qr.js`**: Deletes QR code(s)
- **`duplicate-qr.js`**: Duplicates existing QR code

#### Folders (`/api/folders/`)
- **`index.js`**: List/create folders
  - **Important**: Enforces folder creation access
- **`[id].js`**: Rename/delete folder
  - **Important**: Enforces folder management access

#### Analytics (`/api/analytics/`)
- **`overview.js`**: Get analytics data
  - **Important**: Requires Pro plan access

#### QR Generation (`/api/qr-image/[slug].js`)
- **Purpose**: Generates QR code image
- **Features**: Returns PNG/SVG of QR code

---

## Database Schema

### Models

#### `User`
```prisma
- id: String (CUID)
- email: String (unique)
- password: String (hashed)
- name: String?
- role: String (default: "user")
- plan: String (default: "free") // Legacy field
- planId: String? (default: "free") // "free", "pro_monthly", "pro_annual"
- trialStartedAt: DateTime?
- trialEndsAt: DateTime?
- isTrialActive: Boolean (default: false)
- subscriptionStatus: String (default: "none") // "none", "trialing", "active", "canceled", "past_due"
- resetToken: String?
- resetTokenExpires: DateTime?
- createdAt: DateTime
- qrCodes: QRCode[] (relation)
- folders: Folder[] (relation)
```

#### `QRCode`
```prisma
- id: String (CUID)
- slug: String (unique, nanoid)
- type: String (default: "website")
- targetUrl: String
- name: String?
- qrColor: String (default: "#000000")
- bgColor: String (default: "#ffffff")
- meta: String? (JSON stringified design data)
- createdAt: DateTime
- scanCount: Int (default: 0)
- userId: String? (relation to User)
- folderId: String? (relation to Folder)
- scanEvents: ScanEvent[] (relation)
```

#### `ScanEvent`
```prisma
- id: String (CUID)
- createdAt: DateTime
- userAgent: String?
- ip: String?
- os: String?
- country: String?
- region: String?
- city: String?
- qrCodeId: String (relation to QRCode)
```

#### `Folder`
```prisma
- id: String (CUID)
- name: String
- userId: String (relation to User)
- createdAt: DateTime
- qrCodes: QRCode[] (relation)
```

---

## Major Features

### 1. QR Code Types
- **Website**: Standard URL redirect
- **WiFi**: WiFi network credentials
- **Instagram**: Instagram profile link
- **WhatsApp**: WhatsApp deep link
- **vCard**: Contact card (vCard format)
- **PDF**: PDF document link
- **Social Media**: Facebook, Twitter, LinkedIn, etc.
- **Business**: Business card information
- **Menu**: Restaurant menu link
- **Apps**: App store links
- **Coupon**: Coupon/discount codes

### 2. QR Code Design System
- **Frames**: Customizable borders and backgrounds
- **Patterns**: Dot, square, rounded patterns
- **Corners**: Square, rounded, extra-rounded
- **Colors**: Custom QR and background colors
- **Logo**: Upload and position logos
- **Text**: "Scan me" text customization
- **Gradients**: Background gradients
- **Shadows**: Card shadows and effects

### 3. Billing & Subscription System
- **7-Day Free Trial**: Automatic on registration
- **Plans**: Free (10 QR codes), Pro Monthly (₹1,799), Pro Annual (₹699)
- **Capability-Based Access**: Server-side and client-side enforcement
- **Trial Validation**: Automatic expiration detection
- **Upgrade Prompts**: Modal-based upgrade flow

### 4. Folder Organization
- **Create Folders**: Organize QR codes
- **Rename/Delete**: Folder management
- **Filter by Folder**: Dashboard filtering
- **Move QR Codes**: Between folders
- **Pro Feature**: Requires paid plan

### 5. Analytics & Tracking
- **Scan Events**: Track every QR scan
- **Location Data**: Country, region, city
- **Device Info**: OS, user agent
- **Time Series**: Daily/weekly/monthly charts
- **Pro Feature**: Requires paid plan

### 6. Responsive Design
- **Mobile-First**: Tailwind CSS responsive classes
- **Breakpoints**: sm, md, lg, xl
- **Hamburger Menu**: Mobile navigation
- **Card Layout**: Responsive QR cards
- **Touch-Friendly**: Mobile-optimized interactions

---

## Important Considerations

### 1. Authentication & Security
- **JWT Tokens**: Stored in HTTP-only cookies
- **Password Hashing**: bcryptjs with salt rounds
- **Session Management**: 7-day token expiration
- **CSRF Protection**: SameSite cookie attribute
- **Input Validation**: Server-side validation required

### 2. Trial & Subscription Logic
- **Trial Initialization**: Happens on registration in `register.js`
- **Trial Validation**: Runs on every `getUserFromRequest()` call
- **Capability Checks**: Always check server-side, never trust client
- **Error Codes**: Use `UPGRADE_REQUIRED` for consistent error handling
- **Plan Limits**: Enforced in API routes, not just UI

### 3. QR Code Generation
- **Slug Generation**: Uses nanoid for unique slugs
- **Design Data**: Stored as JSON in `meta` field
- **Download Consistency**: All downloads use `lib/qrDownload.js`
- **Preview Matching**: UI preview matches downloaded QR exactly
- **Format Support**: PNG, JPG, SVG, PDF

### 4. Database Considerations
- **Prisma Client**: Singleton pattern in `lib/prisma.js`
- **Migrations**: Run `prisma migrate dev` for schema changes
- **Relations**: User → QRCode → ScanEvent, User → Folder → QRCode
- **Cascading**: QRCode deletion cascades to ScanEvents
- **Indexes**: Email (unique), slug (unique)

### 5. File Organization
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for shared logic
- **Lib**: Utility functions and helpers
- **Pages**: Next.js pages and API routes
- **Schemas**: Data structure definitions

### 6. Environment Variables
- **Required**: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`
- **Optional**: `RESEND_API_KEY` (for emails), `NEXT_PUBLIC_BASE_URL`
- **Security**: Never commit `.env` files
- **Templates**: Use `.env.example` for reference

### 7. Performance Considerations
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Dynamic imports for heavy components
- **Database Queries**: Use Prisma `select` to limit fields
- **Caching**: Consider API route caching strategies
- **Bundle Size**: Monitor with `npm run build`

### 8. Error Handling
- **API Routes**: Always return JSON, never HTML errors
- **Error Codes**: Use standardized codes (`UPGRADE_REQUIRED`, etc.)
- **User Messages**: Friendly, non-technical error messages
- **Logging**: Console.error for debugging (remove in production)

### 9. Responsive Design
- **Tailwind Classes**: Use responsive prefixes (sm:, md:, lg:)
- **Mobile-First**: Design for mobile, enhance for desktop
- **Touch Targets**: Minimum 44x44px for buttons
- **Text Sizing**: Responsive text sizes (text-sm sm:text-base)

### 10. Code Quality
- **Consistency**: Follow existing patterns
- **Reusability**: Extract common logic to lib/hooks
- **Comments**: Document complex logic
- **Naming**: Use descriptive variable/function names
- **Formatting**: Use consistent code style

---

## Environment Variables

### Required Variables
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Optional Variables
```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
RESEND_API_KEY=your-resend-api-key
NODE_ENV=production
```

---

## API Routes Summary

### Public Routes
- `GET /` - Landing page
- `GET /r/[slug]` - QR redirect (public access)

### Protected Routes (Require Auth)
- `GET /dashboard/*` - Dashboard pages
- `POST /api/create-dynamic` - Create QR code
- `GET /api/my-qr-codes` - List QR codes
- `DELETE /api/delete-qr` - Delete QR code
- `GET /api/analytics/overview` - Analytics (Pro only)
- `POST /api/folders` - Create folder (Pro only)
- `PUT /api/folders/[id]` - Rename folder (Pro only)
- `DELETE /api/folders/[id]` - Delete folder (Pro only)

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

---

## Development Workflow

### Initial Setup
1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Run `npm install`
4. Run `npx prisma migrate dev`
5. Run `npm run dev`

### Making Changes
1. **Database Changes**: Update `schema.prisma`, run `prisma migrate dev`
2. **New Features**: Create components in `/components`, pages in `/pages`
3. **API Changes**: Update routes in `/pages/api`
4. **Styling**: Use Tailwind classes, update `tailwind.config.js` if needed

### Testing
- **Local**: `npm run dev` - http://localhost:3000
- **Build**: `npm run build` - Check for errors
- **Database**: `npx prisma studio` - Visual database editor

### Deployment
1. Set production environment variables
2. Run `npm run build`
3. Run `npm run migrate` (production migrations)
4. Start with `npm start` or PM2

---

## Key Takeaways

1. **Centralized Logic**: Billing, capabilities, and QR download logic are centralized
2. **Server-Side Security**: All access control happens server-side
3. **Consistent UI**: Shared components ensure consistent design
4. **Responsive First**: Mobile-first approach with Tailwind
5. **Type Safety**: Prisma provides type-safe database access
6. **Scalable Structure**: Clear separation of concerns

---

## Support & Maintenance

### Common Tasks
- **Add New QR Type**: Update `lib/qrSchemas.js` and `DynamicForm.js`
- **Change Plan Pricing**: Update `lib/billing/plans.js`
- **Modify Trial Length**: Change `TRIAL_DAYS` in `lib/billing/plans.js`
- **Add New Feature**: Check capabilities system first, then implement

### Debugging Tips
- Check browser console for client errors
- Check server logs for API errors
- Use Prisma Studio to inspect database
- Verify environment variables are set
- Check JWT token expiration

---

**Last Updated**: 29 January 2026
**Version**: 1.0.0

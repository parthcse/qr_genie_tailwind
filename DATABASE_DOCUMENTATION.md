# Database Documentation

## Table of Contents
1. [Database Overview](#database-overview)
2. [Database Configuration](#database-configuration)
3. [Database Connection](#database-connection)
4. [Database Schema](#database-schema)
5. [Table Details](#table-details)
6. [Relationships](#relationships)
7. [Indexes and Constraints](#indexes-and-constraints)
8. [Migration History](#migration-history)
9. [Common Database Operations](#common-database-operations)
10. [Best Practices](#best-practices)

---

## Database Overview

This application uses **PostgreSQL** as the database system, managed through **Prisma ORM**. The database stores user accounts, QR codes, scan analytics, and folder organization data.

### Key Features
- User authentication and authorization
- QR code generation and management
- Scan event tracking and analytics
- Folder organization for QR codes
- Subscription plan management

---

## Database Configuration

### Database Provider
- **Type**: PostgreSQL
- **ORM**: Prisma Client
- **Schema Location**: `prisma/schema.prisma`

### Environment Variables

The database connection is configured via the `DATABASE_URL` environment variable:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

**Example (Production)**:
```env
DATABASE_URL="postgresql://qr_genie:QrGenie123!@localhost:5432/qr_genie?schema=public"
```

**Example (Development)**:
```env
DATABASE_URL="file:./dev.db"  # SQLite for local development
```

---

## Database Connection

### Connection Setup

The database connection is managed through `lib/prisma.js`:

**Production Mode**:
- Logs only errors
- Minimal error formatting
- Creates new PrismaClient instance

**Development Mode**:
- Logs queries, info, warnings, and errors
- Pretty error formatting
- Uses singleton pattern (reuses global instance)

### Connection Initialization

The Prisma client automatically tests the connection on initialization:
- ✅ Success: Logs "Prisma connected to database successfully"
- ❌ Failure: Logs error details and troubleshooting steps

### Usage in Code

```javascript
import prisma from "../../lib/prisma";

// Example query
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});
```

---

## Database Schema

### Schema File Location
`prisma/schema.prisma`

### Generator Configuration
```prisma
generator client {
  provider = "prisma-client-js"
}
```

### Datasource Configuration
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Table Details

### 1. User Table

**Purpose**: Stores user account information, authentication data, and subscription details.

**Table Name**: `User`

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | String | Primary Key, @id | cuid() | Unique identifier for the user |
| `email` | String | Unique, Required | - | User's email address (used for login) |
| `password` | String | Required | - | Hashed password (bcrypt) |
| `name` | String | Optional | null | User's display name |
| `role` | String | Required | "user" | User role (e.g., "user", "admin") |
| `plan` | String | Required | "free" | Subscription plan ("free" or "pro") |
| `trialEndsAt` | DateTime | Optional | null | End date of trial period |
| `resetToken` | String | Optional | null | Password reset token |
| `resetTokenExpires` | DateTime | Optional | null | Password reset token expiration |
| `createdAt` | DateTime | Required | now() | Account creation timestamp |

**Relationships**:
- One-to-Many with `QRCode` (via `qrCodes`)
- One-to-Many with `Folder` (via `folders`)

**Indexes**:
- Unique index on `email`

**Common Operations**:
- User registration
- User authentication
- Password reset
- Plan management
- Trial period tracking

---

### 2. QRCode Table

**Purpose**: Stores QR code data including type, target URL, design settings, and metadata.

**Table Name**: `QRCode`

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | String | Primary Key, @id | cuid() | Unique identifier for the QR code |
| `slug` | String | Unique, Required | - | URL-friendly identifier (6-character nanoid) |
| `type` | String | Required | "website" | QR code type: "website", "pdf", "vcard", "wifi", "instagram", "whatsapp" |
| `targetUrl` | String | Required | - | Destination URL or data string |
| `name` | String | Optional | null | User-defined name for the QR code |
| `qrColor` | String | Required | "#000000" | QR code foreground color (hex) |
| `bgColor` | String | Required | "#ffffff" | QR code background color (hex) |
| `meta` | String | Optional | null | JSON string containing additional data (design config, form data, etc.) |
| `createdAt` | DateTime | Required | now() | QR code creation timestamp |
| `scanCount` | Integer | Required | 0 | Aggregate count of scans |
| `userId` | String | Optional, Foreign Key | null | Owner user ID (nullable for public codes) |
| `folderId` | String | Optional, Foreign Key | null | Folder ID for organization |

**Relationships**:
- Many-to-One with `User` (via `userId`)
- Many-to-One with `Folder` (via `folderId`)
- One-to-Many with `ScanEvent` (via `scanEvents`)

**Indexes**:
- Unique index on `slug`

**Foreign Keys**:
- `userId` → `User.id` (ON DELETE SET NULL, ON UPDATE CASCADE)
- `folderId` → `Folder.id` (ON DELETE SET NULL, ON UPDATE CASCADE)

**Meta Field Structure**:
The `meta` field stores JSON data that varies by QR code type:

**Website Type**:
```json
{
  "designConfig": { /* design settings */ }
}
```

**PDF Type**:
```json
{
  "title": "Document Title",
  "description": "Description",
  "company": "Company Name",
  "website": "https://example.com",
  "buttonText": "Download",
  "thumbnail": "image-url",
  "primaryColor": "#color",
  "secondaryColor": "#color",
  "directShow": boolean,
  "designConfig": { /* design settings */ }
}
```

**vCard Type**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "organization": "Company",
  "title": "Position",
  "email": "email@example.com",
  "phone": "+1234567890",
  "website": "https://example.com",
  "address": "Address",
  "designConfig": { /* design settings */ }
}
```

**WiFi Type**:
```json
{
  "ssid": "Network Name",
  "security": "WPA/WPA2/WEP/nopass",
  "password": "password",
  "hidden": boolean,
  "designConfig": { /* design settings */ }
}
```

**Instagram Type**:
```json
{
  "username": "@username",
  "designConfig": { /* design settings */ }
}
```

**WhatsApp Type**:
```json
{
  "phone": "+1234567890",
  "message": "Pre-filled message",
  "designConfig": { /* design settings */ }
}
```

**Common Operations**:
- Create QR code
- Update QR code (name, colors, folder)
- Delete QR code
- Duplicate QR code
- List user's QR codes
- Track scans

---

### 3. ScanEvent Table

**Purpose**: Tracks individual scan events for analytics and reporting.

**Table Name**: `ScanEvent`

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | String | Primary Key, @id | cuid() | Unique identifier for the scan event |
| `createdAt` | DateTime | Required | now() | Scan timestamp |
| `userAgent` | String | Optional | null | Browser/device user agent string |
| `ip` | String | Optional | null | IP address of the scanner |
| `os` | String | Optional | null | Detected operating system (iOS, Android, Windows, macOS, Linux, Other) |
| `country` | String | Optional | null | Country code from IP geolocation |
| `region` | String | Optional | null | Region/state from IP geolocation |
| `city` | String | Optional | null | City from IP geolocation |
| `qrCodeId` | String | Required, Foreign Key | - | Associated QR code ID |

**Relationships**:
- Many-to-One with `QRCode` (via `qrCodeId`)

**Foreign Keys**:
- `qrCodeId` → `QRCode.id` (ON DELETE RESTRICT, ON UPDATE CASCADE)

**OS Detection**:
The `os` field is automatically populated based on user agent:
- iOS (iPhone, iPad, iPod)
- Android
- Windows
- macOS
- Linux
- Other (fallback)

**Common Operations**:
- Create scan event (on QR code access)
- Query scan events for analytics
- Aggregate scan statistics
- Filter by date range, QR code, location

---

### 4. Folder Table

**Purpose**: Organizes QR codes into folders for better management.

**Table Name**: `Folder`

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | String | Primary Key, @id | cuid() | Unique identifier for the folder |
| `name` | String | Required | - | Folder name |
| `userId` | String | Required, Foreign Key | - | Owner user ID |
| `createdAt` | DateTime | Required | now() | Folder creation timestamp |

**Relationships**:
- Many-to-One with `User` (via `userId`)
- One-to-Many with `QRCode` (via `qrCodes`)

**Foreign Keys**:
- `userId` → `User.id` (ON DELETE RESTRICT, ON UPDATE CASCADE)

**Access Control**:
- Folders are Pro plan feature
- Users can only access their own folders
- Deleting a folder sets `folderId` to null for contained QR codes (cascade)

**Common Operations**:
- Create folder
- Rename folder
- Delete folder
- List folders with QR code counts
- Move QR codes to folder

---

## Relationships

### Entity Relationship Diagram

```
User (1) ────────< (Many) QRCode
  │                      │
  │                      │
  │                      │
  │                      └───< (Many) ScanEvent
  │
  └───< (Many) Folder
            │
            │
            └───< (Many) QRCode
```

### Relationship Details

1. **User ↔ QRCode** (One-to-Many)
   - A user can have many QR codes
   - A QR code belongs to one user (nullable)
   - Foreign Key: `QRCode.userId` → `User.id`
   - Delete Behavior: SET NULL (QR codes can exist without user)

2. **User ↔ Folder** (One-to-Many)
   - A user can have many folders
   - A folder belongs to one user
   - Foreign Key: `Folder.userId` → `User.id`
   - Delete Behavior: RESTRICT (cannot delete user with folders)

3. **QRCode ↔ Folder** (Many-to-One)
   - A QR code can belong to one folder
   - A folder can contain many QR codes
   - Foreign Key: `QRCode.folderId` → `Folder.id`
   - Delete Behavior: SET NULL (QR codes remain when folder deleted)

4. **QRCode ↔ ScanEvent** (One-to-Many)
   - A QR code can have many scan events
   - A scan event belongs to one QR code
   - Foreign Key: `ScanEvent.qrCodeId` → `QRCode.id`
   - Delete Behavior: RESTRICT (cannot delete QR code with scan events)

---

## Indexes and Constraints

### Primary Keys
- `User.id` - Primary Key
- `QRCode.id` - Primary Key
- `ScanEvent.id` - Primary Key
- `Folder.id` - Primary Key

### Unique Constraints
- `User.email` - Unique index (ensures one account per email)
- `QRCode.slug` - Unique index (ensures unique URL slugs)

### Foreign Key Constraints

| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| `QRCode.userId` | `User.id` | SET NULL | CASCADE |
| `QRCode.folderId` | `Folder.id` | SET NULL | CASCADE |
| `ScanEvent.qrCodeId` | `QRCode.id` | RESTRICT | CASCADE |
| `Folder.userId` | `User.id` | RESTRICT | CASCADE |

### Default Values
- `User.role`: "user"
- `User.plan`: "free"
- `QRCode.type`: "website"
- `QRCode.qrColor`: "#000000"
- `QRCode.bgColor`: "#ffffff"
- `QRCode.scanCount`: 0
- All `createdAt` fields: `now()`

---

## Migration History

### Migration Timeline

1. **20251128055441_init** (Initial Schema)
   - Created `User` table
   - Created `QRCode` table
   - Basic user authentication structure

2. **20251128072024_add_plan_trial_folder**
   - Added `plan` and `trialEndsAt` to `User`
   - Created `Folder` table
   - Added `folderId` to `QRCode`

3. **20251128083103_add_qr_design_fields**
   - Added `name`, `qrColor`, `bgColor` to `QRCode`
   - Enhanced QR code customization

4. **20251128105533_add_scan_events**
   - Created `ScanEvent` table
   - Added `type` and `meta` to `QRCode`
   - Added location fields (`country`, `region`, `city`) to `ScanEvent`

5. **20260116094913_init** (PostgreSQL Migration)
   - Complete schema migration to PostgreSQL
   - All tables recreated with PostgreSQL syntax
   - All relationships and constraints established

### Running Migrations

**Development**:
```bash
npx prisma migrate dev
```

**Production**:
```bash
npx prisma migrate deploy
```

**Reset Database** (⚠️ Destructive):
```bash
npx prisma migrate reset
```

**Generate Prisma Client**:
```bash
npx prisma generate
```

---

## Common Database Operations

### User Operations

**Create User**:
```javascript
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    password: hashedPassword,
    name: "John Doe",
    plan: "free",
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
});
```

**Find User by Email**:
```javascript
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});
```

**Update User Plan**:
```javascript
await prisma.user.update({
  where: { id: userId },
  data: { plan: "pro" }
});
```

**Set Password Reset Token**:
```javascript
await prisma.user.update({
  where: { email: userEmail },
  data: {
    resetToken: token,
    resetTokenExpires: new Date(Date.now() + 3600000) // 1 hour
  }
});
```

---

### QR Code Operations

**Create QR Code**:
```javascript
const qrCode = await prisma.qRCode.create({
  data: {
    slug: nanoid(6),
    type: "website",
    targetUrl: "https://example.com",
    name: "My QR Code",
    qrColor: "#000000",
    bgColor: "#ffffff",
    userId: user.id,
    folderId: folderId || null,
    meta: JSON.stringify({ designConfig: {...} })
  }
});
```

**List User's QR Codes**:
```javascript
const codes = await prisma.qRCode.findMany({
  where: { userId: user.id },
  include: {
    folder: {
      select: { id: true, name: true }
    }
  },
  orderBy: { createdAt: "desc" }
});
```

**Find QR Code by Slug**:
```javascript
const qr = await prisma.qRCode.findUnique({
  where: { slug: "abc123" },
  include: { user: true }
});
```

**Update QR Code**:
```javascript
await prisma.qRCode.update({
  where: { id: qrCodeId },
  data: {
    name: "New Name",
    qrColor: "#FF0000",
    bgColor: "#FFFFFF",
    folderId: newFolderId
  }
});
```

**Delete QR Code**:
```javascript
await prisma.qRCode.delete({
  where: { id: qrCodeId }
});
```

**Increment Scan Count**:
```javascript
await prisma.qRCode.update({
  where: { slug },
  data: { scanCount: { increment: 1 } }
});
```

---

### Scan Event Operations

**Create Scan Event**:
```javascript
await prisma.scanEvent.create({
  data: {
    qrCodeId: qr.id,
    userAgent: req.headers["user-agent"] || null,
    ip: ipAddress,
    os: detectedOS
  }
});
```

**Get Analytics Data**:
```javascript
const events = await prisma.scanEvent.findMany({
  where: {
    createdAt: { gte: sinceDate },
    qrCode: { userId: user.id }
  },
  include: { qrCode: true },
  orderBy: { createdAt: "asc" }
});
```

**Filter by QR Code**:
```javascript
const events = await prisma.scanEvent.findMany({
  where: {
    qrCodeId: qrCodeId,
    createdAt: { gte: startDate, lte: endDate }
  }
});
```

---

### Folder Operations

**Create Folder**:
```javascript
const folder = await prisma.folder.create({
  data: {
    name: "My Folder",
    userId: user.id
  }
});
```

**List Folders with QR Code Counts**:
```javascript
const folders = await prisma.folder.findMany({
  where: { userId: user.id },
  include: {
    _count: {
      select: { qrCodes: true }
    }
  },
  orderBy: { createdAt: "asc" }
});
```

**Rename Folder**:
```javascript
await prisma.folder.update({
  where: { id: folderId },
  data: { name: "New Folder Name" }
});
```

**Delete Folder**:
```javascript
await prisma.folder.delete({
  where: { id: folderId }
});
// Note: QR codes in this folder will have folderId set to null
```

**Move QR Code to Folder**:
```javascript
await prisma.qRCode.update({
  where: { id: qrCodeId },
  data: { folderId: folderId }
});
```

---

## Best Practices

### 1. Connection Management
- ✅ Always use the singleton Prisma client from `lib/prisma.js`
- ✅ Never create multiple PrismaClient instances
- ✅ Let Prisma handle connection pooling automatically

### 2. Error Handling
- ✅ Always wrap database operations in try-catch blocks
- ✅ Handle Prisma-specific errors (P2002 for unique constraint violations)
- ✅ Log errors appropriately for debugging

### 3. Query Optimization
- ✅ Use `select` to fetch only needed fields
- ✅ Use `include` for related data when needed
- ✅ Avoid N+1 queries by using `include` or `select`
- ✅ Use pagination for large result sets

### 4. Data Validation
- ✅ Validate input data before database operations
- ✅ Use Prisma's type safety features
- ✅ Sanitize user inputs to prevent injection attacks

### 5. Transactions
- ✅ Use transactions for multi-step operations
- ✅ Example: Creating QR code and scan event together

```javascript
await prisma.$transaction([
  prisma.qRCode.create({ data: {...} }),
  prisma.scanEvent.create({ data: {...} })
]);
```

### 6. Security
- ✅ Never expose sensitive data (passwords, tokens) in responses
- ✅ Always validate user authentication before database operations
- ✅ Use parameterized queries (Prisma handles this automatically)
- ✅ Implement proper access control (users can only access their own data)

### 7. Migration Best Practices
- ✅ Always test migrations in development first
- ✅ Review migration SQL before applying to production
- ✅ Backup database before running migrations in production
- ✅ Use descriptive migration names

### 8. Performance
- ✅ Index frequently queried fields (email, slug already indexed)
- ✅ Use `findUnique` instead of `findFirst` when possible
- ✅ Consider adding indexes for date range queries if needed
- ✅ Monitor query performance in development logs

### 9. Data Integrity
- ✅ Use foreign key constraints (already implemented)
- ✅ Set appropriate default values
- ✅ Handle nullable fields properly
- ✅ Use enums for fixed value sets when possible

### 10. Development Tools
- ✅ Use Prisma Studio for visual database browsing: `npx prisma studio`
- ✅ Use Prisma Migrate for schema changes
- ✅ Generate Prisma Client after schema changes: `npx prisma generate`

---

## Troubleshooting

### Connection Issues

**Error: Cannot reach database server (P1001)**
- Check if database server is running
- Verify `DATABASE_URL` is correct
- Check network connectivity
- Verify database credentials

**Error: Authentication failed**
- Verify username and password in `DATABASE_URL`
- Check database user permissions

### Migration Issues

**Error: Migration failed**
- Check migration SQL for syntax errors
- Ensure database is accessible
- Review previous migrations for conflicts

**Error: Schema drift detected**
- Run `npx prisma migrate dev` to sync schema
- Or manually update database to match schema

### Query Issues

**Error: Unique constraint violation (P2002)**
- Check for duplicate values (email, slug)
- Handle gracefully in application code

**Error: Foreign key constraint violation**
- Ensure referenced records exist
- Check delete cascade behavior

---

## Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Schema File**: `prisma/schema.prisma`
- **Prisma Client**: Generated in `node_modules/.prisma/client`
- **Migrations**: `prisma/migrations/`

---

## Notes

- All timestamps are stored in UTC
- IDs use CUID format for better distribution
- The `meta` field stores JSON strings - parse before use
- Scan events are created on every QR code access
- QR code scan count is incremented separately from scan events
- Folders are a Pro plan feature (enforced in application logic)
- Password reset tokens expire after 1 hour (enforced in application logic)

---

**Last Updated**: January 30, 2026
**Database Version**: PostgreSQL (as per latest migration)
**Prisma Version**: Check `package.json` for current version

# Production Authentication Fix Guide

## 🔍 Issues Found and Fixed

### 1. **CRITICAL: Prisma Schema Provider**
   - **Problem**: Schema was set to `sqlite` instead of `postgresql`
   - **Fixed**: Changed `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`

### 2. **Prisma Client Singleton Pattern**
   - **Problem**: Not using Vercel-safe singleton pattern for serverless functions
   - **Fixed**: Updated `lib/prisma.js` to use the recommended Next.js/Prisma pattern that prevents connection exhaustion

### 3. **Missing Error Handling**
   - **Problem**: Login and Register API routes had no try-catch blocks
   - **Fixed**: Added comprehensive error handling for:
     - Database connection errors (P1000, P1001)
     - Prisma constraint violations (P2002)
     - Missing environment variables
     - Generic database errors

### 4. **Input Validation**
   - **Problem**: No email normalization or validation
   - **Fixed**: Added email normalization (lowercase, trim) and validation in both routes

### 5. **JWT Secret Validation**
   - **Problem**: No check if JWT_SECRET exists before using it
   - **Fixed**: Added validation in `lib/auth.js` and API routes

### 6. **Build Script**
   - **Problem**: Migrations not deployed during build
   - **Fixed**: Updated `package.json` build script to run `prisma migrate deploy`

---

## 📋 Files Changed

1. ✅ `prisma/schema.prisma` - Changed provider to postgresql
2. ✅ `lib/prisma.js` - Updated to Vercel-safe singleton pattern
3. ✅ `pages/api/auth/login.js` - Added error handling and validation
4. ✅ `pages/api/auth/register.js` - Added error handling and validation
5. ✅ `lib/auth.js` - Added JWT_SECRET validation
6. ✅ `package.json` - Updated build script

---

## 🚀 Step-by-Step Deployment Instructions

### Step 1: Update Your Local Environment

1. **Update your local `.env` file** with your Supabase PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15"
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
   NEXTAUTH_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

   **Important**: 
   - Replace `[YOUR-PASSWORD]` with your Supabase database password
   - Replace `[PROJECT-REF]` with your Supabase project reference
   - The `?pgbouncer=true&connect_timeout=15` parameters are recommended for Supabase

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Create and apply migrations**:
   ```bash
   # This will create a new migration for PostgreSQL
   npx prisma migrate dev --name migrate_to_postgresql
   
   # Or if you prefer to push directly (for development only):
   npx prisma db push
   ```

   **Note**: Since you're switching from SQLite to PostgreSQL, you may need to:
   - Delete old SQLite migrations if they exist
   - Create fresh migrations for PostgreSQL
   - Or use `prisma db push` to sync schema directly

4. **Verify your database**:
   ```bash
   npx prisma studio
   ```
   This will open Prisma Studio where you can verify tables are created correctly.

### Step 2: Test Locally

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test registration**:
   - Go to `/auth/register`
   - Create a test account
   - Verify it works

3. **Test login**:
   - Log out
   - Go to `/auth/login`
   - Log in with your test account
   - Verify it works

### Step 3: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**:
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Add the following environment variables**:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15` | Production, Preview, Development |
   | `JWT_SECRET` | A secure random string (min 32 chars). Generate with: `openssl rand -base64 32` | Production, Preview, Development |
   | `NEXTAUTH_URL` | Your production URL: `https://your-app.vercel.app` | Production |
   | `NODE_ENV` | `production` | Production |

   **CRITICAL NOTES**:
   - ⚠️ **DO NOT** wrap values in quotes in Vercel dashboard
   - ⚠️ **DO NOT** include spaces before or after the value
   - ⚠️ Replace `[PASSWORD]` with your actual Supabase password
   - ⚠️ Replace `[PROJECT-REF]` with your Supabase project reference
   - ⚠️ Use the **exact same** `JWT_SECRET` for all environments (Production, Preview, Development)

3. **Get your Supabase connection string**:
   - Go to Supabase Dashboard → Your Project → Settings → Database
   - Copy the "Connection string" under "Connection pooling"
   - Use the "Transaction" mode connection string
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

   **OR** use the direct connection (for Vercel):
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Step 4: Deploy to Vercel

1. **Commit and push your changes**:
   ```bash
   git add .
   git commit -m "Fix: Update Prisma to PostgreSQL and add error handling"
   git push
   ```

2. **Vercel will automatically deploy**:
   - The build script will run `prisma generate` and `prisma migrate deploy`
   - This ensures migrations are applied to your Supabase database

3. **Monitor the build logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check the build logs for any errors

### Step 5: Verify Production Deployment

1. **Check build logs** for:
   - ✅ `Prisma schema loaded from prisma/schema.prisma`
   - ✅ `Generated Prisma Client`
   - ✅ `Applying migration`
   - ✅ `Build completed`

2. **Test production authentication**:
   - Go to `https://your-app.vercel.app/auth/register`
   - Try registering a new account
   - Check Vercel function logs if it fails

3. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on `/api/auth/login` or `/api/auth/register`
   - Check for any errors

### Step 6: Troubleshooting

#### If registration/login still fails:

1. **Check Vercel Environment Variables**:
   - Verify `DATABASE_URL` is set correctly (no quotes, no spaces)
   - Verify `JWT_SECRET` is set (min 32 characters)
   - Verify `NEXTAUTH_URL` matches your production URL

2. **Check Supabase Connection**:
   - Verify your Supabase database is accessible
   - Check if connection pooling is enabled
   - Verify your IP is not blocked (Vercel IPs should be allowed)

3. **Check Prisma Migrations**:
   - Verify migrations ran successfully in build logs
   - Run `npx prisma migrate status` locally to check migration state
   - If needed, manually run: `npx prisma migrate deploy`

4. **Check Function Logs**:
   - Look for specific error codes:
     - `P1000`: Authentication failed
     - `P1001`: Can't reach database server
     - `P2002`: Unique constraint violation (user already exists)

5. **Test Database Connection**:
   ```bash
   # Locally, test connection
   npx prisma db pull
   ```

---

## 🔧 Database Migration Notes

Since you're migrating from SQLite to PostgreSQL:

1. **Your existing SQLite data will NOT be migrated automatically**
2. **You'll need to start fresh** with PostgreSQL, OR
3. **Manually migrate data** if needed (export from SQLite, import to PostgreSQL)

**Recommended approach**:
- Use `prisma db push` for initial setup (syncs schema without migrations)
- Then create proper migrations going forward
- Or use `prisma migrate dev` to create a fresh migration

---

## 📝 Environment Variables Template

Create a `.env.local` file locally (this file is gitignored):

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15"

# JWT Secret - Generate with: openssl rand -base64 32
JWT_SECRET="your-generated-secret-key-minimum-32-characters-long"

# Next.js URL
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

---

## ✅ Verification Checklist

Before deploying, ensure:

- [ ] Prisma schema provider is `postgresql`
- [ ] `DATABASE_URL` is set correctly in Vercel (no quotes)
- [ ] `JWT_SECRET` is set in Vercel (min 32 chars, no quotes)
- [ ] `NEXTAUTH_URL` is set to production URL in Vercel
- [ ] Local migrations applied successfully (`npx prisma migrate dev`)
- [ ] Local registration/login works
- [ ] Build completes without errors
- [ ] Production registration/login works

---

## 🆘 Common Errors and Solutions

### Error: "P1001: Can't reach database server"
**Solution**: Check DATABASE_URL format and Supabase connection settings

### Error: "JWT_SECRET is not configured"
**Solution**: Add JWT_SECRET to Vercel environment variables

### Error: "Invalid credentials" (but user exists)
**Solution**: Check if password hashing is working, verify bcrypt comparison

### Error: "User already exists" (but user doesn't exist)
**Solution**: Check email normalization (should be lowercase)

### Error: "Database connection error"
**Solution**: Verify Supabase allows connections from Vercel IPs, check connection pooling settings

---

## 📞 Next Steps

1. Follow Step 1-6 above
2. Test thoroughly in production
3. Monitor Vercel function logs for any issues
4. If issues persist, check the specific error code and refer to troubleshooting section

Good luck! 🚀

# Pre-Deployment Checklist

## ✅ Code Review Status

### Database & Migrations
- [x] **Schema updated**: `status`, `linkType`, `pausedMessage` fields added to QRCode
- [x] **ScanEvent fields**: `ipHash`, `deviceType`, `browser`, `referer`, `country`, `region`, `city` added
- [x] **Migration exists**: `prisma/migrations/20260205000000_add_status_linktype_scan_fields/migration.sql`
- [ ] **Migration tested**: Run `npx prisma migrate dev` in dev environment
- [ ] **Migration ready for production**: Run `npx prisma migrate deploy` (or `npm run migrate`) on production

### API Endpoints
- [x] **Pause endpoint**: `/api/qrs/[id]/pause` ✅
- [x] **Resume endpoint**: `/api/qrs/[id]/resume` ✅
- [x] **Update QR endpoint**: `/api/qrs/[id]` (PUT) supports `targetUrl` and `pausedMessage` ✅
- [x] **Analytics endpoint**: `/api/qrs/[id]/analytics` ✅
- [x] **Redirect handler**: `/r/[slug]` handles all states (not_found, paused, rate_limited, wifi) ✅

### Utility Files
- [x] **redirectValidation.js**: URL validation ✅
- [x] **scanUtils.js**: IP hashing, device/browser detection ✅
- [x] **geoIp.js**: GeoIP lookup ✅
- [x] **rateLimit.js**: Rate limiting ✅

### Frontend Components
- [x] **Create QR page**: Static vs Dynamic selection ✅
- [x] **Dashboard**: Shows linkType, pause/resume buttons ✅
- [x] **QR Detail page**: Shows short link, analytics, edit URL ✅
- [x] **Download Modal**: Uses short link for Dynamic QRs ✅
- [x] **Overview Modal**: Shows short link for Dynamic QRs ✅

### Critical Fixes
- [x] **Dynamic QR encoding**: Now always uses short link (`/r/slug`) instead of direct URL ✅
- [x] **Dev environment**: Short links use `window.location.origin` (localhost) ✅
- [x] **Production ready**: Uses `NEXT_PUBLIC_BASE_URL` or `NEXT_PUBLIC_APP_URL` ✅

---

## ⚠️ Pre-Deployment Steps

### 1. Environment Variables
Ensure these are set in production:
```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_BASE_URL="https://qr-genie.co"  # or NEXT_PUBLIC_APP_URL
JWT_SECRET="..."
```

### 2. Database Migration
**CRITICAL**: Run migration before deploying:
```bash
# In production:
npm run migrate
# OR
npx prisma migrate deploy
```

This will:
- Add `status`, `linkType`, `pausedMessage` columns
- Add `ipHash`, `deviceType`, `browser`, etc. to ScanEvent
- Backfill existing QRs with `status = ACTIVE` (if `isActive = true`)

### 3. Test Checklist (Local First)
- [ ] Create a new **Dynamic** QR code → Verify QR image encodes `http://localhost:3000/r/<slug>`
- [ ] Create a new **Static** QR code → Verify QR image encodes final destination URL
- [ ] Open short link (`/r/<slug>`) → Should redirect to destination
- [ ] Check analytics → Should show scan count increasing
- [ ] Pause a Dynamic QR → Short link should show "paused" page
- [ ] Resume a Dynamic QR → Short link should redirect again
- [ ] Update destination URL → Should work for Dynamic QRs only
- [ ] Delete a QR → Should show "not found" when accessing short link

### 4. Production Deployment Steps
1. **Backup database** (if possible)
2. **Run migration**: `npm run migrate` or `npx prisma migrate deploy`
3. **Deploy code** (git push, FTP upload, etc.)
4. **Restart application** (PM2, systemd, etc.)
5. **Verify**: Test a short link in production

### 5. Post-Deployment Verification
- [ ] Create a test Dynamic QR in production
- [ ] Verify QR encodes `https://qr-genie.co/r/<slug>` (not direct URL)
- [ ] Scan/open short link → Should redirect and log scan
- [ ] Check analytics dashboard → Should show scan data
- [ ] Test pause/resume functionality
- [ ] Verify existing QRs still work (backward compatibility)

---

## 🔍 Known Issues / Considerations

### Backward Compatibility
- ✅ **Existing QRs**: Will default to `status = ACTIVE` and `linkType = DYNAMIC` after migration
- ✅ **Legacy `isActive`**: Still supported, synced with `status` field
- ⚠️ **Old QR images**: QRs created before this update may still encode direct URLs (if they were "website" type). Users need to re-download for new behavior.

### Performance
- GeoIP lookup uses `geoip-lite` (local database, fast)
- IP hashing uses crypto (fast, no external calls)
- Rate limiting uses in-memory cache (consider Redis for multi-instance)

### Security
- ✅ IP addresses are hashed (not stored in plain text)
- ✅ Rate limiting prevents abuse
- ✅ URL validation prevents malicious redirects
- ✅ Authentication required for all admin endpoints

---

## 📝 Deployment Notes

### Breaking Changes
**None** - This is backward compatible. Existing QRs will continue to work.

### New Features
1. **Static vs Dynamic QR codes**: Users can choose tracking vs no tracking
2. **Pause/Resume**: Dynamic QRs can be paused without deleting
3. **Enhanced Analytics**: Device type, browser, geo-location tracking
4. **Per-QR Analytics**: Individual QR code analytics page

### Migration Impact
- **Low risk**: Migration adds columns with defaults, backfills data
- **Downtime**: None required (migration is non-blocking)
- **Rollback**: If needed, can revert migration (but data may be lost)

---

## ✅ Ready to Deploy?

If all checkboxes above are verified, you're ready to push to main!

**Recommended deployment order:**
1. Merge to main branch
2. Run database migration on production
3. Deploy code
4. Restart application
5. Verify functionality

---

**Last Updated**: Based on current codebase review
**Status**: ✅ Code appears production-ready (pending migration execution)

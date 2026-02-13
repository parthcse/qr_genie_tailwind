# Analytics & Location Tracking Fixes - Applied

## ✅ Fixes Implemented

### 1. **Improved IP Extraction** (`pages/r/[slug].js`)

**Before:**
- Only checked `x-forwarded-for` and `x-real-ip`
- Could miss IPs behind certain proxies/CDNs

**After:**
- Checks multiple headers in priority order:
  1. `cf-connecting-ip` (Cloudflare)
  2. `x-forwarded-for` (standard proxy)
  3. `x-real-ip` (Nginx)
  4. `true-client-ip` (other proxies)
  5. `cf-connecting-ipv6` (Cloudflare IPv6)
  6. `req.socket.remoteAddress` (direct connection fallback)

**Result:** Better IP extraction behind Nginx, Cloudflare, and other proxies.

---

### 2. **Device Fingerprinting** (`lib/scanUtils.js`)

**New Function:** `getDeviceFingerprint(ipHash, userAgent)`

**How it works:**
- Combines IP hash + User Agent hash
- Creates unique identifier: `{ipHash}:{uaHash}`
- Distinguishes multiple devices behind same NAT/proxy

**Example:**
- Device 1: `abc123hash:def456hash`
- Device 2: `abc123hash:ghi789hash` (same IP, different browser/device)

**Result:** More accurate unique device tracking.

---

### 3. **Fixed Unique Scan Calculation** (Both Analytics Endpoints)

**Before:**
- `overview.js`: Used `ipHash || ip` (inconsistent, privacy issue)
- `qrs/[id]/analytics.js`: Only used `ipHash` (excluded events without IP)

**After:**
- Both endpoints use **device fingerprint** (IP hash + User Agent hash)
- Consistent calculation across all analytics
- Falls back to IP hash only if no user agent

**Result:** Accurate, consistent unique scan counts.

---

### 4. **Improved Geo Location** (`lib/geoIp.js`)

**Added:**
- Skips private/localhost IPs (no geo lookup needed)
- Better error handling and logging
- Development-mode warnings for missing geo data

**Result:** Cleaner logs, better debugging.

---

### 5. **Debug Logging** (`pages/r/[slug].js`)

**Added (development only):**
- Warns when IP extraction fails
- Warns when geo lookup returns no data
- Logs all IP headers for debugging

**Result:** Easier troubleshooting in development.

---

## 📊 How Unique Scans Work Now

### Calculation Logic:
```javascript
// For each scan event:
const fingerprint = getDeviceFingerprint(ipHash, userAgent);
// Creates: "abc123hash:def456hash"

// Count unique fingerprints
const uniqueScans = new Set(fingerprints).size;
```

### Example:
- **Same device, same network:** `abc123hash:def456hash` → 1 unique scan
- **Different device, same network:** `abc123hash:ghi789hash` → 2 unique scans
- **Same device, different network:** `xyz789hash:def456hash` → 2 unique scans

---

## 🌍 How Location Works Now

### Top Countries & Cities:
- Uses `country` and `city` fields from `ScanEvent`
- Counts occurrences per country/city
- Shows "Unknown" if geo data is missing

### Geo Data Source:
- Uses `geoip-lite` (free, local database)
- Returns `{ country, region, city }` or `null`
- Skips private/localhost IPs

### Limitations:
- `geoip-lite` may not have city data for all IPs
- Database may be outdated
- Consider upgrading to paid service (MaxMind GeoIP2) for better accuracy

---

## 🧪 Testing

### Test Unique Scans:
1. Scan QR from same device → Should count as 1 unique scan
2. Scan QR from different device/browser → Should count as 2 unique scans
3. Scan QR from same device, different network → Should count as 2 unique scans

### Test Location:
1. Check analytics dashboard → Should show country/city
2. If "Unknown" → Check server logs for IP extraction issues
3. Development mode → Check console for geo lookup warnings

---

## 🔍 Debugging

### If IP is null:
- Check Nginx config: Ensure `X-Forwarded-For` and `X-Real-IP` headers are forwarded
- Check server logs (development mode) for IP extraction warnings
- Verify proxy/CDN is forwarding IP headers correctly

### If location is "Unknown":
- Check if IP is private/localhost (expected)
- Check if `geoip-lite` database has data for that IP
- Consider updating `geoip-lite` package: `npm update geoip-lite`

### If unique scans seem wrong:
- Check if user agent is being captured (should be in `ScanEvent.userAgent`)
- Verify device fingerprint calculation in analytics endpoints
- Check server logs for any errors

---

## 📝 Next Steps (Optional Improvements)

1. **Upgrade Geo Location Service:**
   - Consider MaxMind GeoIP2 (more accurate, paid)
   - Or ipapi.co / ip-api.com (API-based, free tier available)

2. **Add Device Fingerprint to Database:**
   - Store fingerprint in `ScanEvent` table (requires migration)
   - Faster analytics queries (no on-the-fly calculation)

3. **Add More Location Data:**
   - Timezone
   - ISP
   - ASN (Autonomous System Number)

---

## ✅ Status

All fixes applied and tested. Analytics should now:
- ✅ Extract IPs correctly behind Nginx/proxies
- ✅ Track unique devices accurately (IP + User Agent)
- ✅ Show consistent unique scan counts
- ✅ Display location data when available
- ✅ Provide debug logs in development mode

---

**Last Updated:** February 5, 2026

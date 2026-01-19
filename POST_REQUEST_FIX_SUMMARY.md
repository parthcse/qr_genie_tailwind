# 🔧 POST Request "Method Not Allowed" Fix

## ❌ Problem

Production API endpoint `https://qr-genie.co/api/auth/login` returns:
```json
{ "error": "Method not allowed" }
```

Even though the code correctly checks for POST method.

---

## 🔍 Root Causes Identified

1. **NGINX Proxy Issues** (Most Likely)
   - POST requests converted to GET during HTTP→HTTPS redirect
   - Request body not forwarded correctly
   - Missing `proxy_request_buffering off`

2. **Body Parsing Issues**
   - Request body not parsed correctly
   - Body size limits
   - Content-Type header issues

3. **Request Method Detection**
   - Method not preserved through proxy
   - Headers not forwarded correctly

---

## ✅ Fixes Applied

### 1. **API Route - Enhanced Method Detection**

**File:** `pages/api/auth/login.js`

**Changes:**
- Added explicit body parsing configuration
- Added request method logging for debugging
- Enhanced error messages showing received vs expected method
- Added body existence check

**Key Addition:**
```javascript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

### 2. **API Route - Better Error Messages**

Now returns:
```json
{
  "error": "Method not allowed",
  "received": "GET",
  "expected": "POST"
}
```

This helps identify if the method is being changed.

### 3. **Next.js Config - Body Parser Settings**

**File:** `next.config.js`

**Added:**
```javascript
api: {
  bodyParser: {
    sizeLimit: '1mb',
  },
  responseLimit: false,
},
```

### 4. **NGINX Configuration**

**File:** `NGINX_CONFIG_FIX.md` (created)

**Critical Settings:**
- `proxy_request_buffering off;` - Prevents body buffering
- `proxy_buffering off;` - Prevents response buffering
- `client_max_body_size 10M;` - Increases body size limit
- Proper header forwarding

---

## 📋 Files Modified

1. ✅ `pages/api/auth/login.js` - Enhanced method detection and body parsing
2. ✅ `pages/api/auth/register.js` - Same enhancements
3. ✅ `next.config.js` - Added API body parser configuration
4. ✅ `NGINX_CONFIG_FIX.md` - Complete NGINX configuration guide

---

## 🚀 Deployment Steps

### Step 1: Update Code
- [x] Code changes applied
- [ ] Build locally: `npm run build`
- [ ] Upload via FileZilla

### Step 2: Fix NGINX (If Using NGINX)

1. **Edit NGINX config:**
   ```bash
   sudo nano /etc/nginx/sites-available/qr-genie
   ```

2. **Add critical settings** (see `NGINX_CONFIG_FIX.md`):
   ```nginx
   location /api {
       proxy_pass http://localhost:3000;
       proxy_request_buffering off;  # CRITICAL
       proxy_buffering off;
       # ... other settings
   }
   ```

3. **Test and reload:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Step 3: Restart Application

```bash
pm2 restart qr-genie
pm2 logs qr-genie
```

### Step 4: Test

```bash
curl -X POST https://qr-genie.co/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v
```

---

## 🐛 Debugging

### Check Request Method in Logs

The API now logs the received method in development mode. Check PM2 logs:

```bash
pm2 logs qr-genie | grep "Login API"
```

### Check NGINX Logs

```bash
sudo tail -f /var/log/nginx/access.log | grep POST
sudo tail -f /var/log/nginx/error.log
```

### Test Direct Connection

Bypass NGINX:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

If this works but HTTPS doesn't → NGINX issue
If this doesn't work → Next.js/application issue

---

## ✅ Verification Checklist

- [ ] Code changes uploaded to server
- [ ] NGINX config updated (if using NGINX)
- [ ] NGINX reloaded: `sudo systemctl reload nginx`
- [ ] Application restarted: `pm2 restart qr-genie`
- [ ] Test POST request works
- [ ] Check logs show correct method
- [ ] Registration works
- [ ] Login works

---

## 📝 Expected Behavior

### Before Fix:
```bash
POST /api/auth/login → 405 Method Not Allowed
```

### After Fix:
```bash
POST /api/auth/login → 200 OK (or 400/401 with proper error)
```

---

## 🔒 Security Note

The enhanced error messages showing `received` and `expected` methods are helpful for debugging but should be removed or simplified in production for security. Consider:

```javascript
// Production: Simple error
return res.status(405).json({ error: "Method not allowed" });

// Development: Detailed error
if (process.env.NODE_ENV === 'development') {
  return res.status(405).json({ 
    error: "Method not allowed",
    received: req.method,
    expected: "POST"
  });
}
```

---

## 📞 Support

If POST requests still fail:

1. **Check PM2 logs:** `pm2 logs qr-genie`
2. **Check NGINX logs:** `sudo tail -f /var/log/nginx/error.log`
3. **Verify NGINX config:** `sudo nginx -t`
4. **Test direct connection:** `curl -X POST http://localhost:3000/api/auth/login ...`
5. **Check request headers:** Look for `Content-Type: application/json`

---

**Status:** ✅ **FIXES APPLIED - READY FOR TESTING**

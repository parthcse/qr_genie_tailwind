# 🚀 Final Deployment Steps - POST Request Fix

## ✅ Code Changes Complete

All fixes have been applied to resolve the "Method not allowed" error.

---

## 📤 STEP 1: Build Locally

```bash
# 1. Clean previous build
rm -rf .next

# 2. Install dependencies (if needed)
npm install

# 3. Generate Prisma client
npm run prisma:generate

# 4. Build production bundle
npm run build
```

**Verify:** `.next` folder exists and contains build files.

---

## 📤 STEP 2: Upload via FileZilla

Upload these files/folders:
- ✅ `pages/api/auth/login.js` (updated)
- ✅ `pages/api/auth/register.js` (updated)
- ✅ `next.config.js` (updated)
- ✅ `.next/` folder (rebuild)
- ✅ All other project files

**DO NOT upload:**
- ❌ `node_modules/`

---

## 🖥️ STEP 3: Server Setup (SSH)

### 3.1 Install Dependencies

```bash
cd /path/to/your/project
npm install --production
```

### 3.2 Generate Prisma Client

```bash
npm run prisma:generate
```

### 3.3 Run Migrations

```bash
npm run migrate
```

---

## 🔧 STEP 4: Fix NGINX Configuration

**CRITICAL:** This is likely the main issue!

### 4.1 Edit NGINX Config

```bash
sudo nano /etc/nginx/sites-available/qr-genie
```

### 4.2 Add/Update API Location Block

```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # CRITICAL: Disable request buffering for POST
    proxy_request_buffering off;
    proxy_buffering off;
    
    # Increase body size
    client_max_body_size 10M;
    
    # Essential headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Method $request_method;
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
}
```

### 4.3 Test and Reload NGINX

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

**If test fails:** Check syntax errors and fix them.

---

## 🚀 STEP 5: Restart Application

```bash
# Restart PM2
pm2 restart qr-genie

# Check status
pm2 list
pm2 logs qr-genie --lines 50
```

---

## ✅ STEP 6: Test POST Requests

### 6.1 Test Login API

```bash
curl -X POST https://qr-genie.co/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v
```

**Expected:**
- Status 200 (success) OR
- Status 400/401 (validation/auth error) with JSON error
- **NOT** Status 405 "Method not allowed"

### 6.2 Test Registration API

```bash
curl -X POST https://qr-genie.co/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"test123","name":"Test User"}' \
  -v
```

### 6.3 Test in Browser

1. Go to: `https://qr-genie.co/auth/login`
2. Enter credentials
3. Submit form
4. **Check Network tab:**
   - Request method should be POST
   - Status should be 200, 400, or 401 (not 405)
   - Response should be JSON

---

## 🐛 STEP 7: Debugging (If Still Failing)

### 7.1 Check PM2 Logs

```bash
pm2 logs qr-genie | grep -i "login\|method\|post"
```

Look for:
- "Login API - Method: POST" (should show POST)
- Any error messages

### 7.2 Check NGINX Logs

```bash
# Access log
sudo tail -f /var/log/nginx/access.log | grep POST

# Error log
sudo tail -f /var/log/nginx/error.log
```

### 7.3 Test Direct Connection (Bypass NGINX)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**If this works but HTTPS doesn't:** NGINX is the issue
**If this doesn't work:** Application/Next.js issue

### 7.4 Check Request Headers

In browser DevTools → Network tab:
- Click on the login request
- Check "Request Headers"
- Verify `Content-Type: application/json`
- Verify `Method: POST`

---

## ✅ Verification Checklist

- [ ] Code uploaded to server
- [ ] `npm install --production` completed
- [ ] `npm run prisma:generate` completed
- [ ] NGINX config updated with `proxy_request_buffering off`
- [ ] NGINX config tested: `sudo nginx -t`
- [ ] NGINX reloaded: `sudo systemctl reload nginx`
- [ ] Application restarted: `pm2 restart qr-genie`
- [ ] POST request test successful
- [ ] Login works in browser
- [ ] Registration works in browser
- [ ] No "Method not allowed" errors

---

## 📝 Quick Reference Commands

```bash
# NGINX
sudo nano /etc/nginx/sites-available/qr-genie
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# PM2
pm2 restart qr-genie
pm2 logs qr-genie
pm2 list

# Application
cd /path/to/project
npm run prisma:generate
npm run migrate

# Testing
curl -X POST https://qr-genie.co/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🎯 Expected Results

### Before Fix:
```json
POST /api/auth/login → 405
{ "error": "Method not allowed" }
```

### After Fix:
```json
POST /api/auth/login → 200
{ "id": "...", "email": "...", "message": "Login successful" }
```

OR

```json
POST /api/auth/login → 401
{ "error": "Invalid credentials" }
```

---

## ⚠️ Common Issues

### Issue 1: Still Getting 405

**Solution:**
1. Check NGINX config has `proxy_request_buffering off`
2. Check PM2 logs show POST method
3. Verify NGINX reloaded: `sudo systemctl reload nginx`
4. Verify app restarted: `pm2 restart qr-genie`

### Issue 2: Request Body Empty

**Solution:**
1. Check NGINX has `client_max_body_size 10M`
2. Check `Content-Type: application/json` header
3. Verify body is sent in request

### Issue 3: NGINX Config Test Fails

**Solution:**
1. Check syntax: `sudo nginx -t`
2. Look for line numbers in error
3. Fix syntax errors
4. Test again

---

## 📞 Support

If issues persist:

1. **Share PM2 logs:** `pm2 logs qr-genie --lines 100`
2. **Share NGINX error log:** `sudo tail -100 /var/log/nginx/error.log`
3. **Share curl test result:** Include full output with `-v` flag
4. **Check:** Is Next.js running on port 3000? `netstat -tulpn | grep 3000`

---

**Status:** ✅ **READY FOR DEPLOYMENT**

Follow these steps in order, and POST requests should work correctly.

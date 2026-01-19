# NGINX Configuration Fix for POST Requests

If your production server uses NGINX as a reverse proxy, ensure it's configured correctly to pass POST requests.

## Common Issues

### 1. POST Requests Converted to GET
If NGINX redirects HTTP to HTTPS incorrectly, POST requests can be converted to GET.

### 2. Missing Request Body
NGINX might not be forwarding the request body correctly.

### 3. Content-Length Issues
NGINX might be stripping or modifying headers.

---

## ✅ Correct NGINX Configuration

Add this to your NGINX config file (usually `/etc/nginx/sites-available/your-site`):

```nginx
server {
    listen 80;
    server_name qr-genie.co www.qr-genie.co;

    # Redirect HTTP to HTTPS (but preserve POST method)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name qr-genie.co www.qr-genie.co;

    # SSL configuration (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/qr-genie.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qr-genie.co/privkey.pem;

    # Increase body size limit for API requests
    client_max_body_size 10M;
    client_body_buffer_size 128k;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API routes - CRITICAL for POST requests
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Preserve original request method
        proxy_method POST;
        
        # Forward original request method
        proxy_set_header X-Forwarded-Method $request_method;
        
        # Essential headers for POST requests
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Preserve request body
        proxy_request_buffering off;
        proxy_buffering off;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Don't buffer responses
        proxy_buffering off;
    }

    # All other routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Key Settings Explained

### `proxy_request_buffering off;`
- **Critical for POST requests**
- Prevents NGINX from buffering the request body
- Ensures the body is forwarded immediately to Next.js

### `proxy_buffering off;`
- Prevents NGINX from buffering responses
- Ensures real-time response streaming

### `client_max_body_size 10M;`
- Sets maximum request body size
- Adjust based on your needs (default is 1M)

### `X-Forwarded-Method` header
- Preserves the original HTTP method
- Helps debug if method is being changed

---

## 🧪 Testing NGINX Configuration

1. **Test configuration syntax:**
   ```bash
   sudo nginx -t
   ```

2. **Reload NGINX:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Test POST request:**
   ```bash
   curl -X POST https://qr-genie.co/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}' \
     -v
   ```

4. **Check NGINX logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

---

## 🐛 Debugging Steps

### 1. Check if POST is reaching Next.js

Add this to your API route temporarily:
```javascript
console.log('Request Method:', req.method);
console.log('Request Headers:', req.headers);
console.log('Request Body:', req.body);
```

### 2. Check NGINX Access Logs
```bash
sudo tail -f /var/log/nginx/access.log | grep POST
```

Look for:
- Is the request method POST?
- What's the status code?
- Is the Content-Length correct?

### 3. Check NGINX Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

Look for:
- Any proxy errors
- Connection refused errors
- Timeout errors

### 4. Test Direct Connection
Bypass NGINX and test Next.js directly:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

If this works but HTTPS doesn't, the issue is in NGINX config.

---

## ⚠️ Common Mistakes

### ❌ Wrong: Redirecting POST to HTTPS
```nginx
# This converts POST to GET!
return 301 https://$server_name$request_uri;
```

### ✅ Correct: Separate HTTP/HTTPS blocks
```nginx
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl;
    # Handle requests here
}
```

### ❌ Wrong: Missing proxy_request_buffering
```nginx
location /api {
    proxy_pass http://localhost:3000;
    # Missing: proxy_request_buffering off;
}
```

### ✅ Correct: Disable buffering
```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_request_buffering off;
    proxy_buffering off;
}
```

---

## 🔄 After Making Changes

1. **Test configuration:**
   ```bash
   sudo nginx -t
   ```

2. **Reload NGINX:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Test the API:**
   ```bash
   curl -X POST https://qr-genie.co/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

4. **Check PM2 logs:**
   ```bash
   pm2 logs qr-genie
   ```

---

## 📝 Quick Reference

**File Location:** `/etc/nginx/sites-available/qr-genie`

**Test Config:** `sudo nginx -t`

**Reload:** `sudo systemctl reload nginx`

**Logs:** `/var/log/nginx/access.log` and `/var/log/nginx/error.log`

---

**If POST requests still fail after fixing NGINX, check:**
1. Next.js server is running on port 3000
2. PM2 logs show the request is received
3. Request body is being parsed correctly
4. No firewall blocking port 3000

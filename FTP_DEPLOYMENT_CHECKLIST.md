# 🚀 FTP Deployment Checklist - Production Ready

Use this checklist step-by-step to deploy your fixed application via FileZilla.

---

## 📋 PRE-DEPLOYMENT (Local Machine)

### Step 1: Verify Environment Variables
- [ ] Create `.env` file with production values:
  ```bash
  DATABASE_URL="file:/absolute/path/to/production.db"
  JWT_SECRET="your-generated-secret-here"
  NEXT_PUBLIC_APP_URL="https://yourdomain.com"
  NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
  NODE_ENV="production"
  RESEND_API_KEY="your-key" (optional)
  RESEND_FROM_EMAIL="noreply@yourdomain.com" (optional)
  ```

- [ ] Generate JWT_SECRET:
  ```bash
  openssl rand -base64 32
  ```

### Step 2: Clean Previous Build
- [ ] Delete `.next` folder (if exists):
  ```bash
  rm -rf .next
  ```
  Or on Windows:
  ```cmd
  rmdir /s /q .next
  ```

### Step 3: Install Dependencies
- [ ] Run:
  ```bash
  npm install
  ```

### Step 4: Generate Prisma Client
- [ ] Run:
  ```bash
  npm run prisma:generate
  ```

### Step 5: Build Production Bundle
- [ ] Run:
  ```bash
  npm run build
  ```

- [ ] **VERIFY BUILD SUCCESS:**
  - [ ] No errors in console
  - [ ] `.next` folder was created
  - [ ] Check for any warnings (should be minimal)

### Step 6: Test Build Locally (Optional)
- [ ] Run:
  ```bash
  npm start
  ```
- [ ] Test registration/login on `http://localhost:3000`
- [ ] Verify no JSON parsing errors
- [ ] Stop server: `Ctrl+C`

---

## 📤 FILE UPLOAD (FileZilla)

### Step 7: Connect to Server
- [ ] Open FileZilla
- [ ] Connect to your server (SFTP)
- [ ] Navigate to your project directory on server

### Step 8: Upload Files

#### ✅ Upload These Files/Folders:
- [ ] `package.json`
- [ ] `package-lock.json`
- [ ] `next.config.js`
- [ ] `tailwind.config.js`
- [ ] `postcss.config.js`
- [ ] `.env` (your production environment file)
- [ ] `pages/` (entire folder)
- [ ] `components/` (entire folder)
- [ ] `lib/` (entire folder)
- [ ] `styles/` (entire folder)
- [ ] `prisma/` (entire folder - schema + migrations)
- [ ] `.next/` (entire folder - **CRITICAL - the built app**)

#### ❌ DO NOT Upload:
- [ ] `node_modules/` (will install on server)
- [ ] `.git/` folder
- [ ] `.vscode/` folder
- [ ] `*.log` files
- [ ] `prisma/dev.db` (development database)

### Step 9: Verify Upload
- [ ] Check that `.next/` folder exists on server
- [ ] Check that `.env` file exists on server
- [ ] Check that `prisma/schema.prisma` exists on server

---

## 🖥️ SERVER SETUP (SSH)

### Step 10: SSH into Server
- [ ] Connect via SSH to your server
- [ ] Navigate to project directory:
  ```bash
  cd /path/to/your/project
  ```

### Step 11: Verify Node.js
- [ ] Check Node.js version:
  ```bash
  node --version
  ```
  Should be 18.x or higher

- [ ] Check npm version:
  ```bash
  npm --version
  ```

### Step 12: Install Dependencies
- [ ] Run:
  ```bash
  npm install --production
  ```

- [ ] **VERIFY:** `node_modules/` folder was created

### Step 13: Setup Database
- [ ] Generate Prisma client:
  ```bash
  npm run prisma:generate
  ```

- [ ] Run migrations:
  ```bash
  npm run migrate
  ```
  Or:
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **VERIFY:** Database file exists at path in `.env`

### Step 14: Set Permissions
- [ ] Set file permissions:
  ```bash
  # Set ownership (replace 'www-data' with your web server user)
  sudo chown -R www-data:www-data /path/to/your/project
  
  # Set directory permissions
  find /path/to/your/project -type d -exec chmod 755 {} \;
  
  # Set file permissions
  find /path/to/your/project -type f -exec chmod 644 {} \;
  
  # Secure .env file
  chmod 600 /path/to/your/project/.env
  ```

### Step 15: Verify Environment Variables
- [ ] Check `.env` file exists:
  ```bash
  ls -la .env
  ```

- [ ] Verify critical variables are set:
  ```bash
  grep -E "JWT_SECRET|DATABASE_URL|NEXT_PUBLIC_APP_URL" .env
  ```

---

## 🚀 START APPLICATION

### Step 16: Start with PM2 (Recommended)
- [ ] Install PM2 (if not installed):
  ```bash
  sudo npm install -g pm2
  ```

- [ ] Start application:
  ```bash
  pm2 start npm --name "qr-genie" -- start
  ```

- [ ] Save PM2 config:
  ```bash
  pm2 save
  ```

- [ ] Setup auto-start:
  ```bash
  pm2 startup
  # Follow the instructions provided
  ```

- [ ] **VERIFY:** Check status:
  ```bash
  pm2 list
  pm2 logs qr-genie
  ```

### Step 17: Configure Nginx (If Not Done)
- [ ] Create Nginx config:
  ```bash
  sudo nano /etc/nginx/sites-available/qr-genie
  ```

- [ ] Add configuration:
  ```nginx
  server {
      listen 80;
      server_name yourdomain.com www.yourdomain.com;

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

- [ ] Enable site:
  ```bash
  sudo ln -s /etc/nginx/sites-available/qr-genie /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  ```

---

## ✅ POST-DEPLOYMENT TESTING

### Step 18: Test Application
- [ ] **Homepage:** Visit `https://yourdomain.com`
  - [ ] Page loads correctly
  - [ ] No console errors

- [ ] **Registration:**
  - [ ] Go to `/auth/register`
  - [ ] Fill form and submit
  - [ ] **VERIFY:** No "Unexpected token" errors
  - [ ] **VERIFY:** Successfully creates account
  - [ ] **VERIFY:** Redirects to dashboard

- [ ] **Login:**
  - [ ] Go to `/auth/login`
  - [ ] Login with test account
  - [ ] **VERIFY:** No JSON parsing errors
  - [ ] **VERIFY:** Successfully logs in
  - [ ] **VERIFY:** Redirects to dashboard

- [ ] **API Routes (Check Network Tab):**
  - [ ] All API responses have `Content-Type: application/json`
  - [ ] No HTML error pages returned
  - [ ] Error responses are valid JSON

- [ ] **Error Handling:**
  - [ ] Try registering with existing email
  - [ ] **VERIFY:** Shows user-friendly error message
  - [ ] **VERIFY:** No console errors

### Step 19: Monitor Logs
- [ ] Check PM2 logs:
  ```bash
  pm2 logs qr-genie --lines 50
  ```

- [ ] Check for errors:
  ```bash
  pm2 logs qr-genie | grep -i error
  ```

- [ ] **VERIFY:** No critical errors in logs

---

## 🔧 TROUBLESHOOTING

### If Registration/Login Still Fails:

1. **Check PM2 Logs:**
   ```bash
   pm2 logs qr-genie
   ```

2. **Check Environment Variables:**
   ```bash
   cat .env
   ```

3. **Verify Database:**
   ```bash
   npm run prisma:generate
   npm run migrate
   ```

4. **Check Node.js Version:**
   ```bash
   node --version
   ```

5. **Restart Application:**
   ```bash
   pm2 restart qr-genie
   ```

6. **Check Nginx Logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Common Issues:

| Issue | Solution |
|-------|----------|
| "Unexpected token" error | Check API logs, verify Content-Type headers |
| 500 Internal Server Error | Check PM2 logs, verify database connection |
| Database errors | Run `npm run prisma:generate && npm run migrate` |
| Port already in use | Kill process: `sudo lsof -i :3000` |
| Permission denied | Fix permissions: `sudo chown -R www-data:www-data .` |

---

## ✅ FINAL VERIFICATION

- [ ] Application is running: `pm2 list`
- [ ] No errors in logs: `pm2 logs qr-genie`
- [ ] Registration works without JSON errors
- [ ] Login works without JSON errors
- [ ] API routes return JSON (check Network tab)
- [ ] Error messages are user-friendly
- [ ] SSL/HTTPS is configured (if applicable)

---

## 📝 QUICK REFERENCE COMMANDS

```bash
# Start application
pm2 start npm --name "qr-genie" -- start

# Restart application
pm2 restart qr-genie

# Stop application
pm2 stop qr-genie

# View logs
pm2 logs qr-genie

# View status
pm2 list

# Database operations
npm run prisma:generate
npm run migrate

# Check environment
cat .env
```

---

**🎉 Deployment Complete!**

Your application is now production-ready with all JSON parsing errors fixed.

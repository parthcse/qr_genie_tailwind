# Production Deployment Guide

This guide will help you deploy your QR-Genie Next.js application to a production server using FileZilla (SFTP).

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```bash
# Database Configuration
# Use absolute path for production SQLite database
DATABASE_URL="file:/absolute/path/to/your/production/database.db"

# JWT Secret (REQUIRED - Generate a strong random string)
# Generate with: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Application URLs (REQUIRED)
# Replace with your actual production domain (with https://)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"

# Email Configuration (Optional but recommended)
# Get API key from https://resend.com
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="QR-Genie <noreply@yourdomain.com>"

# Node Environment
NODE_ENV="production"
```

**Important Notes:**
- `JWT_SECRET`: Must be a strong, random string. Never use the example value.
- `DATABASE_URL`: Use an absolute path (e.g., `/var/www/qr-genie/prisma/production.db`)
- `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_URL`: Must match your actual domain with `https://`
- Never commit `.env` file to version control

### 2. Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `JWT_SECRET` value.

## 🚀 Deployment Steps

### Step 1: Local Build Preparation

On your local machine:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Build the production bundle
npm run build
```

**Verify the build:**
- Check that `.next` folder was created
- Ensure no build errors occurred
- Test locally with `npm start` (optional)

### Step 2: Prepare Files for Upload

**Files/Folders to UPLOAD via FileZilla:**
- ✅ `package.json` and `package-lock.json`
- ✅ `next.config.js`
- ✅ `tailwind.config.js`
- ✅ `postcss.config.js`
- ✅ `pages/` (entire folder)
- ✅ `components/` (entire folder)
- ✅ `lib/` (entire folder)
- ✅ `styles/` (entire folder)
- ✅ `prisma/` (entire folder, including migrations)
- ✅ `.next/` (entire folder - the built application)
- ✅ `.env` (your production environment file)
- ✅ `README.md` and other documentation files

**Files/Folders to EXCLUDE (DO NOT upload):**
- ❌ `node_modules/` (will be installed on server)
- ❌ `.git/` (if present)
- ❌ `.vscode/` (if present)
- ❌ `*.log` files
- ❌ `.env.local`, `.env.development.local` (use only `.env` on server)
- ❌ `prisma/dev.db` (development database)

### Step 3: Upload to Server via FileZilla

1. **Connect to your server via SFTP:**
   - Host: Your server IP or domain
   - Username: Your SFTP username
   - Password: Your SFTP password
   - Port: 22 (default for SFTP)

2. **Navigate to your web root directory** (e.g., `/var/www/html/` or `/home/username/public_html/`)

3. **Create a project folder** (e.g., `qr-genie`)

4. **Upload all files** (except excluded ones) maintaining the folder structure

5. **Set proper permissions:**
   ```bash
   # On server via SSH, navigate to your project directory
   cd /path/to/your/project
   
   # Set ownership (replace 'www-data' with your web server user)
   sudo chown -R www-data:www-data .
   
   # Set directory permissions
   find . -type d -exec chmod 755 {} \;
   
   # Set file permissions
   find . -type f -exec chmod 644 {} \;
   
   # Make .env readable only by owner
   chmod 600 .env
   ```

### Step 4: Server Setup

**SSH into your server** and navigate to your project directory:

```bash
cd /path/to/your/project
```

#### Install Node.js and npm (if not already installed)

```bash
# For Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install Dependencies

```bash
npm install --production
```

#### Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (this will create the database if it doesn't exist)
npm run migrate

# If migrations fail, you can use:
npx prisma migrate deploy
```

**Important:** Ensure the database path in `.env` is absolute and the directory exists with write permissions:

```bash
# Create database directory if needed
mkdir -p /var/www/qr-genie/prisma
chmod 755 /var/www/qr-genie/prisma

# The database file will be created automatically by Prisma
```

### Step 5: Start the Application

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start npm --name "qr-genie" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command
```

**PM2 Useful Commands:**
```bash
pm2 list              # View running processes
pm2 logs qr-genie      # View logs
pm2 restart qr-genie   # Restart application
pm2 stop qr-genie      # Stop application
pm2 delete qr-genie    # Remove from PM2
```

#### Option B: Using systemd (Alternative)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/qr-genie.service
```

Add the following content:

```ini
[Unit]
Description=QR-Genie Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/project
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable qr-genie
sudo systemctl start qr-genie
sudo systemctl status qr-genie
```

### Step 6: Configure Nginx Reverse Proxy

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/qr-genie
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # For initial setup, use this:
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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/qr-genie /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 7: Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure Nginx and set up auto-renewal
```

After SSL setup, update your Nginx config to remove the HTTP redirect comment.

### Step 8: Verify Deployment

1. **Check application is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs qr-genie
   ```

3. **Visit your domain** in a browser and verify:
   - Homepage loads correctly
   - Registration/Login works
   - QR code creation works
   - QR code redirects work

## 🔧 Troubleshooting

### Application won't start

1. **Check logs:**
   ```bash
   pm2 logs qr-genie
   # or
   sudo journalctl -u qr-genie -f
   ```

2. **Verify environment variables:**
   ```bash
   cat .env
   ```

3. **Check database path:**
   - Ensure `DATABASE_URL` uses absolute path
   - Ensure directory exists and is writable
   - Check file permissions: `ls -la prisma/`

4. **Verify Node.js version:**
   ```bash
   node --version  # Should be 18.x or higher
   ```

### Database errors

```bash
# Regenerate Prisma client
npm run prisma:generate

# Run migrations
npm run migrate

# If database doesn't exist, create it manually:
touch /path/to/database.db
chmod 644 /path/to/database.db
```

### Port already in use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process or change port in package.json
```

### Permission errors

```bash
# Fix ownership
sudo chown -R www-data:www-data /path/to/project

# Fix permissions
find /path/to/project -type d -exec chmod 755 {} \;
find /path/to/project -type f -exec chmod 644 {} \;
chmod 600 /path/to/project/.env
```

## 📝 Post-Deployment Maintenance

### Updating the Application

1. **On local machine:**
   ```bash
   git pull  # or download latest files
   npm install
   npm run build
   ```

2. **Upload new files** via FileZilla (excluding `node_modules`)

3. **On server:**
   ```bash
   cd /path/to/project
   npm install --production
   npm run prisma:generate
   npm run migrate  # if schema changed
   pm2 restart qr-genie
   ```

### Database Backups

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DB_PATH="/path/to/project/prisma/production.db"
DATE=$(date +%Y%m%d_%H%M%S)

cp "$DB_PATH" "$BACKUP_DIR/backup_$DATE.db"
```

### Monitoring

- **PM2 Monitoring:**
  ```bash
  pm2 monit
  ```

- **Application Logs:**
  ```bash
  pm2 logs qr-genie --lines 100
  ```

- **Nginx Logs:**
  ```bash
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```

## 🔒 Security Checklist

- [ ] Strong `JWT_SECRET` set (32+ characters, random)
- [ ] `.env` file has 600 permissions
- [ ] HTTPS/SSL configured
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Database file has proper permissions
- [ ] No sensitive data in code or logs
- [ ] Regular backups configured
- [ ] PM2 or systemd auto-restart enabled
- [ ] Nginx security headers configured

## 📞 Support

If you encounter issues:

1. Check application logs: `pm2 logs qr-genie`
2. Check Nginx logs: `/var/log/nginx/error.log`
3. Verify all environment variables are set correctly
4. Ensure database path is correct and writable
5. Check Node.js version compatibility

---

**Last Updated:** January 2025
**Version:** 1.0.0

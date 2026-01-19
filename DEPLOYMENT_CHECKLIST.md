# 🚀 Production Deployment Checklist

Use this checklist to ensure your deployment is complete and secure.

## ✅ Pre-Deployment (Local Machine)

- [ ] **Environment Variables Prepared**
  - [ ] Generated strong JWT_SECRET using `openssl rand -base64 32`
  - [ ] Created `.env` file with all required variables
  - [ ] Verified `NEXT_PUBLIC_APP_URL` matches your production domain
  - [ ] Verified `DATABASE_URL` uses absolute path format

- [ ] **Code Review**
  - [ ] No hardcoded localhost URLs (✅ Fixed automatically)
  - [ ] No console.log statements in production code (acceptable for error logging)
  - [ ] All API routes use environment variables
  - [ ] Authentication logic is secure

- [ ] **Build Process**
  - [ ] Run `npm install` successfully
  - [ ] Run `npm run build` successfully (no errors)
  - [ ] Verify `.next` folder was created
  - [ ] Test locally with `npm start` (optional)

## ✅ File Upload (FileZilla)

- [ ] **Files to Upload:**
  - [ ] `package.json` and `package-lock.json`
  - [ ] `next.config.js`
  - [ ] `tailwind.config.js`
  - [ ] `postcss.config.js`
  - [ ] `pages/` folder (all files)
  - [ ] `components/` folder (all files)
  - [ ] `lib/` folder (all files)
  - [ ] `styles/` folder (all files)
  - [ ] `prisma/` folder (schema + migrations)
  - [ ] `.next/` folder (built application)
  - [ ] `.env` file (production environment variables)
  - [ ] Documentation files (optional)

- [ ] **Files to EXCLUDE:**
  - [ ] `node_modules/` (will install on server)
  - [ ] `.git/` folder
  - [ ] `.vscode/` folder
  - [ ] `*.log` files
  - [ ] `prisma/dev.db` (development database)

## ✅ Server Setup (SSH)

- [ ] **Prerequisites**
  - [ ] Node.js 18+ installed (`node --version`)
  - [ ] npm installed (`npm --version`)
  - [ ] PM2 installed (optional but recommended)

- [ ] **Project Setup**
  - [ ] Navigated to project directory
  - [ ] Installed dependencies: `npm install --production`
  - [ ] Generated Prisma client: `npm run prisma:generate`
  - [ ] Ran database migrations: `npm run migrate`

- [ ] **Database Configuration**
  - [ ] Database directory exists and is writable
  - [ ] Database file path in `.env` is absolute
  - [ ] Database permissions set correctly

- [ ] **Environment Variables**
  - [ ] `.env` file exists on server
  - [ ] All required variables are set
  - [ ] `.env` file has 600 permissions (`chmod 600 .env`)

## ✅ Application Startup

- [ ] **PM2 Setup (Recommended)**
  - [ ] Started app: `pm2 start npm --name "qr-genie" -- start`
  - [ ] Saved PM2 config: `pm2 save`
  - [ ] Enabled startup: `pm2 startup` (follow instructions)
  - [ ] Verified app is running: `pm2 list`
  - [ ] Checked logs: `pm2 logs qr-genie`

- [ ] **OR Systemd Setup (Alternative)**
  - [ ] Created service file: `/etc/systemd/system/qr-genie.service`
  - [ ] Enabled service: `sudo systemctl enable qr-genie`
  - [ ] Started service: `sudo systemctl start qr-genie`
  - [ ] Verified status: `sudo systemctl status qr-genie`

## ✅ Nginx Configuration

- [ ] **Reverse Proxy Setup**
  - [ ] Created config: `/etc/nginx/sites-available/qr-genie`
  - [ ] Enabled site: `sudo ln -s /etc/nginx/sites-available/qr-genie /etc/nginx/sites-enabled/`
  - [ ] Tested config: `sudo nginx -t`
  - [ ] Reloaded Nginx: `sudo systemctl reload nginx`

- [ ] **SSL/HTTPS (Recommended)**
  - [ ] Installed Certbot: `sudo apt-get install certbot python3-certbot-nginx`
  - [ ] Obtained certificate: `sudo certbot --nginx -d yourdomain.com`
  - [ ] Verified auto-renewal is configured
  - [ ] Updated Nginx config to redirect HTTP to HTTPS

## ✅ Security Hardening

- [ ] **File Permissions**
  - [ ] Set ownership: `sudo chown -R www-data:www-data /path/to/project`
  - [ ] Set directory permissions: `find . -type d -exec chmod 755 {} \;`
  - [ ] Set file permissions: `find . -type f -exec chmod 644 {} \;`
  - [ ] Secure `.env`: `chmod 600 .env`

- [ ] **Firewall**
  - [ ] Only ports 80, 443, and 22 are open
  - [ ] Port 3000 is NOT publicly accessible (only via Nginx)

- [ ] **Environment Security**
  - [ ] JWT_SECRET is strong and unique
  - [ ] No sensitive data in code
  - [ ] `.env` is not in version control

## ✅ Testing & Verification

- [ ] **Application Tests**
  - [ ] Homepage loads: `https://yourdomain.com`
  - [ ] Registration works: Create test account
  - [ ] Login works: Sign in with test account
  - [ ] QR code creation works: Create a test QR code
  - [ ] QR code redirect works: Scan/test the QR code
  - [ ] Analytics page loads: Check dashboard analytics
  - [ ] Password reset works (if email configured)

- [ ] **Performance Tests**
  - [ ] Page load times are acceptable
  - [ ] No console errors in browser
  - [ ] API endpoints respond correctly
  - [ ] Database queries are fast

- [ ] **Monitoring**
  - [ ] PM2 monitoring: `pm2 monit`
  - [ ] Application logs: `pm2 logs qr-genie`
  - [ ] Nginx logs: `sudo tail -f /var/log/nginx/error.log`
  - [ ] System resources: `htop` or `top`

## ✅ Post-Deployment

- [ ] **Backup Strategy**
  - [ ] Database backup script created
  - [ ] Automated backups configured (cron job)
  - [ ] Backup location is secure

- [ ] **Documentation**
  - [ ] Server access credentials documented (secure location)
  - [ ] Domain/DNS information documented
  - [ ] Environment variables documented (secure location)

- [ ] **Monitoring Setup**
  - [ ] Log rotation configured
  - [ ] Error alerting setup (optional)
  - [ ] Uptime monitoring (optional)

## 🔧 Quick Commands Reference

```bash
# Application Management
pm2 start npm --name "qr-genie" -- start
pm2 restart qr-genie
pm2 stop qr-genie
pm2 logs qr-genie
pm2 monit

# Database Management
npm run prisma:generate
npm run migrate
npx prisma studio  # Database GUI (development only)

# Nginx Management
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# System Management
sudo systemctl status qr-genie
sudo journalctl -u qr-genie -f
```

## 🆘 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| App won't start | Check `pm2 logs qr-genie` or `journalctl -u qr-genie` |
| Database errors | Run `npm run prisma:generate && npm run migrate` |
| 502 Bad Gateway | Check if app is running: `pm2 list` or `systemctl status qr-genie` |
| Port in use | Change port or kill process: `sudo lsof -i :3000` |
| Permission errors | Fix ownership: `sudo chown -R www-data:www-data .` |
| Environment variables not working | Verify `.env` exists and has correct format |

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Domain:** _______________
**Server IP:** _______________

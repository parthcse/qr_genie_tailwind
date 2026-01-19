# 🔧 Deployment Troubleshooting Guide

## ❌ Error: `dial tcp ***:22: i/o timeout`

This error means **GitHub Actions cannot connect to your server on port 22 (SSH)**. This is a **server-side network/firewall issue**, NOT a workflow file problem.

---

## ✅ Step-by-Step Fix

### 1. **Check AWS Lightsail Firewall Rules** (MOST COMMON FIX)

1. Go to **AWS Lightsail Console**
2. Click on your instance
3. Go to **Networking** tab
4. Click **Firewall** section
5. **Add Rule:**
   - **Application**: Custom
   - **Protocol**: TCP
   - **Port**: 22
   - **Source**: `0.0.0.0/0` (allows from anywhere) OR restrict to GitHub IPs
   - Click **Create**

**⚠️ Important**: Port 22 MUST be open for SSH connections from GitHub Actions.

---

### 2. **Check Server Firewall (UFW)**

SSH into your server and run:

```bash
# Check UFW status
sudo ufw status

# If UFW is active, allow SSH
sudo ufw allow 22/tcp
sudo ufw reload

# Verify
sudo ufw status
```

---

### 3. **Check Server Firewall (iptables)**

```bash
# Check iptables rules
sudo iptables -L -n

# Allow SSH if blocked
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables-save
```

---

### 4. **Verify SSH Service is Running**

```bash
# Check SSH service status
sudo systemctl status ssh
# or
sudo systemctl status sshd

# If not running, start it
sudo systemctl start ssh
sudo systemctl enable ssh
```

---

### 5. **Test SSH Connection Locally**

From your local machine, test if you can SSH:

```bash
ssh -i your-key.pem username@your-server-ip
```

- ✅ **If this works**: Server is fine, but GitHub Actions IPs are blocked
- ❌ **If this fails**: Server SSH is not configured correctly

---

### 6. **Verify GitHub Secrets**

In your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify these secrets exist and are correct:
   - `LIGHTSAIL_HOST` - Should be your server's **public IP** or domain
   - `LIGHTSAIL_USER` - SSH username (usually `ubuntu`, `ec2-user`, or `admin`)
   - `LIGHTSAIL_SSH_KEY` - Your **private SSH key** (starts with `-----BEGIN OPENSSH PRIVATE KEY-----` or `-----BEGIN RSA PRIVATE KEY-----`)
   - `REMOTE_PATH` - Path on server (e.g., `/var/www/qr-genie`)

---

### 7. **Check Server IP Address**

Your server's IP might have changed:

1. Check **AWS Lightsail Console** → Your instance → **Networking**
2. Verify the **Public IP** matches your `LIGHTSAIL_HOST` secret

---

### 8. **Test Port 22 Accessibility**

From your local machine:

```bash
# Test if port 22 is open
telnet your-server-ip 22
# or
nc -zv your-server-ip 22
```

- ✅ **Connection successful**: Port is open
- ❌ **Connection refused/timeout**: Port is blocked

---

## 🔍 Quick Diagnostic Checklist

- [ ] AWS Lightsail firewall allows port 22 from `0.0.0.0/0`
- [ ] Server firewall (UFW/iptables) allows port 22
- [ ] SSH service is running on server
- [ ] Can SSH from local machine successfully
- [ ] GitHub secrets are correct (host, user, key, path)
- [ ] Server IP hasn't changed
- [ ] Server instance is running (not stopped)

---

## 🚀 After Fixing

Once you've fixed the firewall/network issue:

1. **Re-run the GitHub Actions workflow**
2. The connection test step will verify SSH works
3. Deployment should proceed normally

---

## 📝 Common Mistakes

1. ❌ **Only allowing your local IP** - GitHub Actions uses different IPs
2. ❌ **Wrong SSH key format** - Must be private key, not public key
3. ❌ **Wrong host format** - Use IP address, not `http://` URL
4. ❌ **Server stopped** - Check instance status in Lightsail
5. ❌ **Wrong username** - Common: `ubuntu`, `ec2-user`, `admin`, `root`

---

## 💡 Still Not Working?

If you've tried everything above:

1. **Temporarily allow all IPs** on port 22 for testing
2. **Check AWS Lightsail instance logs** for any errors
3. **Try SSH from a different network** to rule out local firewall
4. **Contact AWS Support** if instance networking seems broken

---

## ✅ Success Indicators

When fixed, you should see:
- ✅ "SSH connection successful" in GitHub Actions logs
- ✅ Files uploading without timeout
- ✅ Deployment commands executing

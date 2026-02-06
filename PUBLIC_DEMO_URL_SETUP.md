# 🌐 PUBLIC DEMO URL SETUP
## Share Your Demo with USDA Officials

---

## ✅ EASIEST METHOD: Using Ngrok (5 minutes)

Ngrok creates a temporary public URL that tunnels to your localhost.

### Step 1: Make Sure Servers Are Running

```powershell
# Terminal 1: Backend (if not already running)
cd backend
node src/server.js

# Terminal 2: Frontend (if not already running)
cd frontend
npm run dev
```

### Step 2: Create Public URL for Frontend

Open a **NEW terminal** (Terminal 3):

```powershell
# Expose frontend on public URL
ngrok http 5173
```

**You'll see output like:**
```
Forwarding   https://abc123xyz.ngrok-free.app -> http://localhost:5173
```

### Step 3: Create Public URL for Backend

Open a **NEW terminal** (Terminal 4):

```powershell
# Expose backend on public URL
ngrok http 5000
```

**You'll see output like:**
```
Forwarding   https://def456uvw.ngrok-free.app -> http://localhost:5000
```

### Step 4: Update Frontend to Use Public Backend URL

Edit `frontend/.env`:

```
VITE_API_URL=https://def456uvw.ngrok-free.app
```

(Replace with YOUR actual ngrok URL for backend)

Then restart frontend:
```powershell
# In frontend terminal
Ctrl+C (to stop)
npm run dev (to restart)
```

### Step 5: Share the Link

**Give USDA officials this link:**
```
https://abc123xyz.ngrok-free.app
```

They can now access the demo from their computers!

---

## ⚠️ IMPORTANT NOTES:

### Free Ngrok Limitations:
- URL changes every time you restart ngrok
- Shows ngrok branding page first (they must click "Visit Site")
- Limited to 40 requests per minute
- Tunnel expires after 2 hours (must restart)

### For Presentation:
1. Start ngrok 1 hour before presentation
2. Share URL in email: "Demo available at: https://abc123xyz.ngrok-free.app"
3. Keep terminals open during presentation
4. If URL expires, restart ngrok and send new URL

---

## 📋 COMPLETE SETUP SCRIPT

Copy/paste this entire script:

```powershell
# ============================================
# USDA TRAVEL SYSTEM - PUBLIC DEMO SETUP
# ============================================

Write-Host "🚀 Starting public demo setup...`n" -ForegroundColor Green

# Step 1: Check if servers are running
Write-Host "📊 Step 1: Checking servers..." -ForegroundColor Cyan
$backendRunning = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if (!$backendRunning) {
    Write-Host "❌ Backend not running. Start it first!" -ForegroundColor Red
    Write-Host "   Run: cd backend; node src/server.js" -ForegroundColor Yellow
    exit
}
if (!$frontendRunning) {
    Write-Host "❌ Frontend not running. Start it first!" -ForegroundColor Red
    Write-Host "   Run: cd frontend; npm run dev" -ForegroundColor Yellow
    exit
}

Write-Host "✅ Both servers running!`n" -ForegroundColor Green

# Step 2: Instructions for ngrok
Write-Host "📡 Step 2: Creating public URLs with ngrok..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Open TWO new terminals and run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 3 (Frontend Tunnel):" -ForegroundColor Magenta
Write-Host "  ngrok http 5173" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 4 (Backend Tunnel):" -ForegroundColor Magenta
Write-Host "  ngrok http 5000" -ForegroundColor White
Write-Host ""
Write-Host "After running ngrok commands:" -ForegroundColor Yellow
Write-Host "1. Copy the 'Forwarding' HTTPS URL from Terminal 4 (backend)" -ForegroundColor White
Write-Host "2. Update frontend/.env with: VITE_API_URL=<backend-ngrok-url>" -ForegroundColor White
Write-Host "3. Restart frontend server" -ForegroundColor White
Write-Host "4. Share the Terminal 3 URL (frontend) with USDA officials!" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup complete! Your demo is now publicly accessible!" -ForegroundColor Green
```

Save as: `setup-public-demo.ps1`

Run with:
```powershell
.\setup-public-demo.ps1
```

---

## 🎯 ALTERNATIVE: Share Screen Instead

If ngrok is too complex, you can:

1. **Screen Share via Zoom/Teams**
   - Start Zoom meeting
   - Share your screen
   - Share meeting link with USDA officials
   - They watch your demo live

2. **Record Video**
   - Use OBS Studio or Windows Game Bar (Win+G)
   - Record your demo walkthrough
   - Upload to YouTube (unlisted)
   - Share link

3. **Deploy to Cloud** (Takes longer, but permanent)
   - Vercel (frontend) - Free tier
   - Railway/Render (backend) - Free tier
   - See next section for details

---

## 🚀 OPTION 2: Deploy to Cloud (Permanent URL)

### Frontend: Deploy to Vercel (Free)

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel

# Follow prompts:
# - Login/Signup
# - Yes to deploy
# - Project name: usda-travel-system
# - Framework: Vite
# - Deploy!
```

Vercel gives you: `https://usda-travel-system.vercel.app`

### Backend: Deploy to Railway (Free)

1. Go to https://railway.app
2. Sign up (free account)
3. Click "New Project" → "Deploy from GitHub"
4. Connect your GitHub repo (or create one)
5. Select backend folder
6. Railway gives you: `https://usda-backend.railway.app`

Update frontend `.env`:
```
VITE_API_URL=https://usda-backend.railway.app
```

Redeploy frontend:
```powershell
cd frontend
vercel --prod
```

**Permanent URLs! No expiration!**

---

## 📧 EMAIL TEMPLATE FOR USDA OFFICIALS

```
Subject: USDA Travel Voucher System - Live Demo Access

Dear [Name],

I'm excited to share a live demo of the USDA Local Travel Voucher Management System that I'll be presenting tomorrow.

🌐 Demo URL: https://abc123xyz.ngrok-free.app

📋 Login Credentials:
• Inspector: inspector@usda.gov / Test123!
• Supervisor: supervisor@usda.gov / Test123!
• Fleet Manager: fleetmgr@usda.gov / Test123!

⏰ Demo will be available from [Time] to [Time]

Feel free to explore the system before our meeting. You can:
✅ Log in as an inspector and add a trip
✅ Generate a voucher
✅ Switch to supervisor view to see the approval workflow
✅ Check the analytics dashboard as fleet manager

Note: You may see an ngrok warning page - just click "Visit Site" to continue.

Looking forward to our presentation tomorrow!

Best regards,
[Your Name]
```

---

## ⏰ TIMING RECOMMENDATIONS

### For Tomorrow's Presentation:

**Option 1: Start Ngrok 1 Hour Before**
- More time for officials to test
- Risk: Tunnel might expire (2 hour limit)
- Solution: Restart ngrok if needed

**Option 2: Start Ngrok 15 Minutes Before**
- Less risk of expiration
- Less time for officials to explore
- Just enough time for quick checks

**Recommended: Start 30 minutes before**
- Balance of testing time and reliability
- Send email with link at that time

---

## 🛡️ SECURITY NOTE

Ngrok tunnels are secure (HTTPS), but:
- Don't leave running 24/7
- Close tunnels after presentation
- Don't share URLs publicly (only with USDA)
- Demo database has no real data, but still be cautious

---

## 📱 MOBILE ACCESS

The ngrok URL works on mobile devices too!

Officials can scan a QR code to access on phones/tablets.

Generate QR code:
1. Go to https://www.qr-code-generator.com
2. Enter your ngrok URL
3. Download QR code
4. Add to presentation slide

---

## ✅ QUICK CHECKLIST

Before sending link to USDA:

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Ngrok tunnels active (both frontend & backend)
- [ ] Frontend .env updated with backend ngrok URL
- [ ] Frontend restarted after .env change
- [ ] Tested: Can you access via ngrok URL?
- [ ] Tested: Can you login with demo credentials?
- [ ] Tested: Can you add a trip and generate voucher?

If all checked, you're ready to share!

---

## 🆘 TROUBLESHOOTING

### "This site can't be reached"
- Check if ngrok is still running
- Check if servers are still running
- Restart ngrok if needed

### "502 Bad Gateway"
- Backend server stopped
- Restart backend: `cd backend; node src/server.js`

### Login not working
- Check if frontend .env has correct backend URL
- Restart frontend after changing .env

### Google Maps not showing
- Ngrok free tier might block external API calls
- Tell officials: "Maps work on localhost, ngrok has API limitations"

---

## 💡 PRO TIP

For best experience during presentation:

1. **Use localhost for your live demo** (on projector/screen share)
2. **Share ngrok URL for officials to test on their own** (optional, before/after presentation)

This way:
- Your demo is fast and reliable (localhost)
- Officials can explore independently (ngrok)
- Best of both worlds!

---

**You're all set to share your demo with the world! 🌐**

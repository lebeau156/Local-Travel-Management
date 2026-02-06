# 🚀 Railway.app Deployment Guide

## Prerequisites
1. GitHub account
2. Railway.app account (sign up at https://railway.app)
3. This project's code

---

## 📦 Step 1: Prepare for Deployment

### A. Initialize Git Repository (if not already done)
```powershell
# In project root
git init
git add .
git commit -m "Initial commit for deployment"
```

### B. Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "usda-travel-system")
3. Push your code:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/usda-travel-system.git
git branch -M main
git push -u origin main
```

---

## 🎯 Step 2: Deploy Backend to Railway

### A. Sign Up / Login to Railway
1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your repositories

### B. Create Backend Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway will detect it's a Node.js project

### C. Configure Backend Environment Variables
Click "Variables" tab and add:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
FRONTEND_URL=https://your-frontend-name.up.railway.app
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

**Important:** Generate a strong JWT_SECRET:
```powershell
# Generate random secret (run this locally)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### D. Configure Build & Start Commands
In Railway Settings:
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`

### E. Enable Public Access
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Note your backend URL (e.g., `https://usda-travel-backend.up.railway.app`)

---

## 🎨 Step 3: Deploy Frontend to Railway

### A. Create Frontend Project
1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"  
3. Choose the SAME repository
4. Name it something like "usda-travel-frontend"

### B. Configure Frontend Environment Variables
Click "Variables" tab and add:

```
VITE_API_URL=https://your-backend-name.up.railway.app/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

**Note:** Replace `your-backend-name` with the actual backend URL from Step 2E

### C. Configure Build Settings
In Railway Settings:
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npx serve -s dist -l $PORT`

### D. Install Serve (if not in package.json)
Add to frontend/package.json dependencies:
```json
"serve": "^14.2.1"
```

Or Railway will auto-detect and use Vite preview.

### E. Enable Public Access
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Your app will be available at `https://usda-travel-frontend.up.railway.app`

---

## 🔄 Step 4: Update CORS in Backend

Go back to Backend project in Railway:
1. Update `FRONTEND_URL` variable to match your actual frontend URL
2. Railway will auto-redeploy

---

## ✅ Step 5: Test Deployment

1. Visit your frontend URL: `https://your-frontend.up.railway.app`
2. Try to login with test credentials:
   - **Admin**: admin@usda.gov / Admin123!
   - **Inspector**: inspector@usda.gov / Test123!
3. Test key features:
   - Login/logout
   - View trips
   - Send messages
   - Check if data persists

---

## 📊 Monitoring & Logs

### View Logs
In Railway dashboard:
1. Click on your project
2. Click "Deployments" tab
3. Click on latest deployment
4. View real-time logs

### Check Status
- Both services should show "Active" status
- Check memory and CPU usage
- Set up alerts for failures

---

## 🔒 Security Notes

1. **JWT Secret**: Use a strong, random secret (32+ characters)
2. **Database**: SQLite works for small teams. For production, consider PostgreSQL
3. **HTTPS**: Railway provides automatic SSL certificates
4. **Environment Variables**: Never commit .env files to Git

---

## 💰 Pricing Estimate

Railway.app free tier includes:
- $5 credit per month
- Enough for small deployments (~500 hours)

Paid plans:
- Hobby: $5/month + usage ($0.000231/GB-hour)
- Pro: $20/month + usage
- Estimated cost for this app: **$10-20/month**

---

## 🆘 Troubleshooting

### Backend Not Starting
- Check logs for errors
- Verify environment variables are set
- Ensure PORT is not hardcoded

### Frontend Can't Connect to Backend
- Check VITE_API_URL is correct
- Check CORS settings in backend
- Verify both services are running

### Database Issues
- SQLite may not persist between deploys
- Add a volume in Railway for persistent storage
- Or migrate to PostgreSQL addon

### Build Failures
- Check Node.js version compatibility
- Run `npm install` locally first
- Check for missing dependencies

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

```powershell
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Railway will automatically:
# 1. Detect the push
# 2. Build both frontend and backend
# 3. Deploy updates
# 4. Health check
```

---

## 📱 Custom Domain (Optional)

To use `travel.usda.gov`:

1. In Railway project settings → Networking
2. Add custom domain
3. Update DNS records in your domain provider:
   - Type: CNAME
   - Name: travel (or subdomain)
   - Value: your-app.up.railway.app

---

## 🎉 You're Done!

Your USDA Travel Voucher System is now live and accessible from anywhere!

**Frontend URL**: https://your-frontend.up.railway.app  
**Backend API**: https://your-backend.up.railway.app

Share the frontend URL with your team to start using the system!

---

## 📝 Alternative: Deploy with Railway CLI

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

---

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Node.js Deployment: https://docs.railway.app/guides/nodejs
- Support: https://railway.app/help

---

**Need Help?** Contact Railway support or check the documentation.

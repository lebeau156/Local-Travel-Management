# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment Preparation (DONE)

- [x] Updated backend CORS for production
- [x] Updated frontend API to use environment variables
- [x] Created .gitignore file
- [x] Updated package.json files with proper scripts
- [x] Created deployment documentation

## 📋 Next Steps (DO THESE NOW)

### 1. Initialize Git & Push to GitHub (5 minutes)

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Railway deployment"

# Create GitHub repository at: https://github.com/new
# Name it: usda-travel-system
# Then link and push:

git remote add origin https://github.com/YOUR_USERNAME/usda-travel-system.git
git branch -M main
git push -u origin main
```

### 2. Sign Up for Railway.app (2 minutes)

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway

### 3. Deploy Backend (10 minutes)

1. Click "New Project" → "Deploy from GitHub repo"
2. Select your repository
3. Name: "usda-travel-backend"
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=[generate using command below]
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
6. Generate Domain (copy the URL)

**Generate JWT Secret:**
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 4. Deploy Frontend (10 minutes)

1. Click "New Project" → "Deploy from GitHub repo"
2. Select SAME repository
3. Name: "usda-travel-frontend"
4. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add Environment Variables:
   ```
   VITE_API_URL=https://[backend-url-from-step-3]/api
   ```
6. Generate Domain

### 5. Update Backend FRONTEND_URL (2 minutes)

Go back to backend project:
1. Update `FRONTEND_URL` variable with actual frontend URL
2. Railway will auto-redeploy

### 6. Test! (5 minutes)

Visit your frontend URL and test:
- [ ] Login works
- [ ] Dashboard loads
- [ ] Can view trips
- [ ] Can send messages
- [ ] Data persists after refresh

---

## 🎯 Alternative: Deploy RIGHT NOW (ONE COMMAND)

If you have Railway CLI installed:

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Deploy frontend
cd ../frontend
railway init  
railway up
```

---

## 💰 Cost Estimate

- **Free Tier**: $5 credit/month (enough for testing)
- **Production**: ~$10-20/month for both services

---

## 🆘 Need Help?

If you encounter issues:
1. Check DEPLOYMENT_GUIDE_RAILWAY.md for detailed instructions
2. View Railway logs for errors
3. Verify environment variables are set correctly

---

## 📱 After Deployment

Share these URLs with your team:
- **Application**: https://your-frontend.up.railway.app
- **API Docs**: https://your-backend.up.railway.app/health

Default login:
- Admin: admin@usda.gov / Admin123!
- Inspector: inspector@usda.gov / Test123!

---

**Ready to deploy? Let's do it! 🎉**

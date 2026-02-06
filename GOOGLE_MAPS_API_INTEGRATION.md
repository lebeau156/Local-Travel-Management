# Google Maps API Integration - Complete Guide

## ✅ What Was Implemented

The Google Maps Distance Matrix API integration is now fully implemented with:

1. **Backend Integration** (`backend/src/utils/mileageCalculator.js`)
   - Uses Google Maps Distance Matrix API for accurate driving distances
   - Automatic fallback to mock mileage if API is not configured
   - Error handling and retry logic

2. **Settings UI** (`frontend/src/pages/Settings.tsx`)
   - Configure API key directly from the web interface
   - Test API connection with one click
   - View current API status (Active/Mock)
   - Access restricted to Admin and Fleet Manager roles

3. **API Endpoints** (`backend/src/routes/settings.js`)
   - `GET /api/settings` - Get current settings status
   - `POST /api/settings/google-maps-key` - Save API key to .env
   - `POST /api/settings/test-google-maps` - Test API connection

4. **Setup Script** (`setup-google-maps.ps1`)
   - Interactive PowerShell script to configure .env file
   - Option to use mock mileage or enter API key

---

## 🚀 Quick Start (3 Options)

### **Option 1: Use Mock Mileage (No Setup Required)**

The system works perfectly without any configuration! It will use random mileage (10-60 miles) for testing.

**When to use:**
- Development and testing
- Demo purposes
- When exact mileage doesn't matter

**No action needed** - just start using the application!

---

### **Option 2: Configure via Web UI (Recommended)**

1. Login as Admin or Fleet Manager
2. Click **⚙️ Settings** in the sidebar
3. Scroll to "Google Maps API Integration"
4. Paste your API key and click **Save**
5. Click **🧪 Test API Connection**
6. **Restart the backend server**

**Pros:**
- Easy visual interface
- Test before saving
- No command line needed

---

### **Option 3: Configure via PowerShell Script**

1. Open PowerShell in the project root
2. Run: `.\setup-google-maps.ps1`
3. Choose option 1 (have API key) or 2 (use mock)
4. If option 1: paste your API key
5. Restart the backend server

**Pros:**
- Fast setup
- Interactive prompts
- Creates .env automatically

---

## 📖 Getting Your Google Maps API Key

### Step-by-Step Guide

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a Project**
   - Click "Select a project" → "NEW PROJECT"
   - Name: "USDA Travel Tracker"
   - Click "CREATE"

3. **Enable Distance Matrix API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search: "Distance Matrix API"
   - Click on it and click "ENABLE"

4. **Create API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "CREATE CREDENTIALS" → "API key"
   - Copy the key (looks like: `AIzaSyB1234567890abcdefghijklmnopqrstuv`)

5. **Secure Your Key (IMPORTANT!)**
   - Click "RESTRICT KEY" on the newly created key
   - **Application restrictions:**
     - Select "IP addresses"
     - Add your server's IP
     - For localhost: add `127.0.0.1` and `::1`
   - **API restrictions:**
     - Select "Restrict key"
     - Check only: "Distance Matrix API"
   - Click "SAVE"

6. **Set Up Billing (Required)**
   - Go to: https://console.cloud.google.com/billing
   - Click "LINK A BILLING ACCOUNT"
   - Enter credit card info
   - **Don't worry**: $200 FREE credit per month covers ~40,000 requests

---

## 💰 Cost Information

### Google Maps Pricing

| Service | Cost per Request | Free Tier |
|---------|-----------------|-----------|
| Distance Matrix API | $0.005 | First $200/month FREE |

### Real-World Usage

| Scenario | Monthly Trips | Cost | Status |
|----------|--------------|------|--------|
| Small office | 50 trips | $0.25 | ✅ FREE |
| Medium office | 200 trips | $1.00 | ✅ FREE |
| Large department | 1,000 trips | $5.00 | ✅ FREE |
| Enterprise (10 offices) | 5,000 trips | $25.00 | ✅ FREE |

**Bottom line:** Unless you're processing 40,000+ trips/month, it's **100% FREE**!

---

## 🧪 Testing the Integration

### Method 1: Via Settings Page

1. Go to Settings (⚙️ in sidebar)
2. Click "🧪 Test API Connection"
3. Should show: "✅ Google Maps API is working! Test route: Washington DC → Baltimore MD = 44.3 miles"

### Method 2: Create a Real Trip

1. Go to "My Trips" → "Add Trip"
2. Enter real addresses:
   - From: `1600 Pennsylvania Avenue NW, Washington, DC 20500`
   - To: `301 Park Ave, Baltimore, MD 21201`
3. Submit the trip
4. Check the calculated mileage (should be ~44 miles)

### Method 3: Check Backend Logs

When creating a trip, backend logs will show:
- ✅ **With API**: No warning message
- ⚠️ **Without API**: `⚠️ No Google Maps API key - using mock mileage calculation`

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Restrict API key to specific IPs
- ✅ Restrict to only Distance Matrix API
- ✅ Set up budget alerts in Google Cloud
- ✅ Use environment variables (`.env` file)
- ✅ Add `.env` to `.gitignore`
- ✅ Rotate keys periodically

### ❌ DON'T:
- ❌ Commit `.env` file to Git
- ❌ Share your API key publicly
- ❌ Use the key in frontend JavaScript
- ❌ Leave the key unrestricted
- ❌ Hardcode the key in source code

---

## 🛠️ Troubleshooting

### "⚠️ Using Mock Data" in Settings

**Problem:** API key is not configured or invalid

**Solutions:**
1. Check if `.env` file exists in `backend` folder
2. Verify the key name is exactly: `GOOGLE_MAPS_API_KEY=`
3. Ensure API key has no quotes: `GOOGLE_MAPS_API_KEY=AIza...` (not `"AIza..."`)
4. Restart the backend server after saving

---

### "REQUEST_DENIED" Error

**Problem:** Billing not enabled or API not enabled

**Solutions:**
1. Go to https://console.cloud.google.com/billing
2. Link a billing account (required even with free tier)
3. Verify Distance Matrix API is enabled
4. Check API key restrictions aren't blocking localhost

---

### "API key not valid"

**Problem:** Key copied incorrectly or restrictions too tight

**Solutions:**
1. Copy the key again from Google Cloud Console
2. Ensure no extra spaces before/after the key
3. Check IP restrictions allow your server
4. Verify API restrictions include Distance Matrix API

---

### Backend Still Shows Mock Mileage

**Problem:** Server hasn't reloaded environment variables

**Solutions:**
1. **Stop backend server** (Ctrl+C in terminal)
2. **Restart backend:** `cd backend; npm start`
3. Check server logs - should NOT show "No Google Maps API key" warning
4. Create a test trip to verify

---

## 📊 Monitoring Usage

### View API Usage

1. Go to: https://console.cloud.google.com/apis/api/distance-matrix-backend.googleapis.com/metrics
2. Select your project
3. View graphs showing:
   - Daily requests
   - Error rates
   - Latency

### Set Budget Alerts

1. Go to: https://console.cloud.google.com/billing/budgets
2. Click "CREATE BUDGET"
3. Set limit: `$50` (well above free tier)
4. Get email alerts if approaching limit

---

## 🔄 Fallback Behavior

The system is designed to **always work**, even if the API fails:

1. **No API key configured** → Uses mock mileage (10-60 miles)
2. **API request fails** → Falls back to mock mileage
3. **API quota exceeded** → Falls back to mock mileage
4. **Network error** → Falls back to mock mileage

**This means:** Your application never breaks, even if Google Maps is down!

---

## 📁 File Locations

```
backend/
├── .env                                  # Environment variables (YOU CREATE THIS)
├── env.example                           # Template file
├── src/
│   ├── utils/mileageCalculator.js       # API integration
│   ├── controllers/settingsController.js # Settings endpoints
│   └── routes/settings.js                # Settings routes

frontend/
└── src/
    └── pages/Settings.tsx                # Settings UI

setup-google-maps.ps1                     # PowerShell setup script
GOOGLE_MAPS_SETUP.md                     # This file
```

---

## 🎯 Current Status

After following this guide, you should have:

✅ Google Maps API key obtained (or chose mock mode)  
✅ API key configured in `.env` file  
✅ Settings page accessible at `/settings`  
✅ Backend server restarted  
✅ API status showing as "Active" (or "Mock" if no key)  
✅ Test connection working  
✅ New trips calculating accurate mileage  

---

## 💡 Tips & Recommendations

1. **For Production:**
   - Set up IP restrictions immediately
   - Enable only required APIs
   - Set budget alerts
   - Monitor usage regularly

2. **For Development:**
   - Mock mode is perfectly fine
   - Save API quota for production
   - Test with mock first, then switch to real API

3. **For Teams:**
   - Each environment should have its own API key
   - Development, staging, production = 3 separate keys
   - Document who has access to Google Cloud Console

---

## 🆘 Need Help?

**Google Cloud Support:**
- Documentation: https://developers.google.com/maps/documentation/distance-matrix
- Support: https://console.cloud.google.com/support

**Application Support:**
- Check backend logs for detailed error messages
- Use Settings page to test API connection
- Verify .env file format matches env.example

---

## ✨ Next Steps

After setting up Google Maps API:

1. Test with a few real trips
2. Monitor usage in Google Cloud Console
3. Set budget alerts (recommended: $50)
4. Document API key location for your team
5. Consider creating backup API key for redundancy

---

*Last updated: January 15, 2026*

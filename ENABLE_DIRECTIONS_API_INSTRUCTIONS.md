# Enable Google Directions API - Step by Step

## Problem
Getting error: `REQUEST_DENIED` when trying to calculate distance between plants.

Error message:
```
Directions Service: You're calling a legacy API, which is not enabled for your project.
MapsRequestError: DIRECTIONS_ROUTE: REQUEST_DENIED
```

## Root Cause
The Google Directions API is not enabled for your Google Cloud project. The current API key only has Maps JavaScript API enabled, but distance measurement requires the Directions API as well.

## Solution

### Option 1: Enable Directions API (Recommended)

#### Step 1: Access Google Cloud Console
1. Go to: **https://console.cloud.google.com/apis/library**
2. Sign in with your Google account (the one that created the API key)
3. Select your project from the dropdown at the top

#### Step 2: Search and Enable Directions API
1. In the API Library search box, type: **"Directions API"**
2. Click on **"Directions API"** from the results
3. Click the **"Enable"** button
4. Wait 10-30 seconds for activation

#### Step 3: Verify API Key Restrictions
1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Find your API key: `AIzaSyC3_l50rfef-IX8-1cDeLi4zzM0As32TcU`
3. Click on the key name to edit it
4. Scroll to **"API restrictions"** section
5. Choose one:
   - **Option A (Easiest)**: Select "Don't restrict key"
   - **Option B (Secure)**: Select "Restrict key" and check:
     - ✅ Maps JavaScript API
     - ✅ Directions API (newly added)
     - ✅ Geocoding API
6. Click **"Save"**

#### Step 4: Wait for Propagation
- Changes take 1-5 minutes to propagate globally
- Refresh the browser and try the distance feature again

---

### Option 2: Create New Unrestricted API Key (Quick Test)

If you need immediate testing and don't have permission to modify the existing key:

#### Step 1: Create New Key
1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Click **"Create Credentials"** → **"API key"**
3. Copy the new key (e.g., `AIza...newkey`)
4. Click **"Restrict Key"** (optional but recommended)
5. Under "API restrictions", select **"Don't restrict key"** for now
6. Click **"Save"**

#### Step 2: Update Environment Files
Replace the API key in both files:

**Backend: `backend/src/.env`**
```env
GOOGLE_MAPS_API_KEY=YOUR_NEW_KEY_HERE
```

**Frontend: `frontend/.env`**
```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_KEY_HERE
```

#### Step 3: Restart Servers
```powershell
# Stop both servers (Ctrl+C)
# Then restart:
cd backend ; node src/server.js
cd frontend ; npm run dev
```

---

## Required APIs for Full Functionality

Your Google Cloud project needs these APIs enabled:

| API Name | Purpose | Status |
|----------|---------|--------|
| Maps JavaScript API | Display the map | ✅ Enabled |
| Directions API | Calculate routes/distances | ❌ **Need to enable** |
| Geocoding API | Convert addresses to coordinates | ✅ Enabled |
| Places API (New) | Autocomplete (if using) | Optional |

---

## Cost Information

### Free Tier (Monthly)
- **Directions API**: 2,500 free requests/month
- **Maps JavaScript API**: Unlimited (map loads)
- **Geocoding API**: 2,500 free addresses/month

### Typical Usage for This System
- **Directions API**: ~10-50 requests/day (when users measure distances)
- **Annual cost**: $0 (well within free tier)

### Billing Requirement
- Google Cloud requires a billing account to be set up
- You won't be charged if you stay under free tier limits
- Set up billing alerts at $10 to be notified if approaching limits

---

## Troubleshooting

### Error Still Occurs After Enabling API

**Problem**: Still getting REQUEST_DENIED after enabling Directions API

**Solutions**:
1. **Wait**: API changes can take up to 5 minutes to propagate
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Check billing**: Ensure billing is enabled in Google Cloud
4. **Verify project**: Make sure you enabled API in the correct project
5. **Check quotas**: Go to https://console.cloud.google.com/apis/api/directions-backend.googleapis.com/quotas

### Error: "This API key is not authorized to use this service or API"

**Problem**: API key restrictions are blocking the Directions API

**Solution**:
1. Go to API key settings
2. Under "API restrictions", temporarily select "Don't restrict key"
3. Save and test
4. If it works, you know it's a restriction issue
5. Re-enable restrictions but include Directions API in the list

### Error: "You must enable Billing on the Google Cloud Project"

**Problem**: Billing is not set up (required even for free tier)

**Solution**:
1. Go to: https://console.cloud.google.com/billing
2. Click "Link a billing account"
3. Add a payment method
4. Set spending alerts to avoid unexpected charges

---

## Testing After Fix

Once you've enabled the Directions API:

1. **Refresh browser** (hard refresh: Ctrl+Shift+R)
2. Navigate to **Circuit Plants Map**
3. Click **"Measure Distance"** button
4. Click first plant (start point)
5. Click second plant (end point)
6. **Expected result**: Blue route line appears with distance/time
7. **Check console**: No more REQUEST_DENIED errors

### Success Indicators
- ✅ Blue route line visible on map
- ✅ Distance shows (e.g., "3.8 mi")
- ✅ Drive time shows (e.g., "9 mins")
- ✅ Console shows: "DirectionsService.route() succeeded"

---

## Quick Reference Links

- **Enable Directions API**: https://console.cloud.google.com/apis/library/directions-backend.googleapis.com
- **API Credentials**: https://console.cloud.google.com/apis/credentials
- **API Dashboard**: https://console.cloud.google.com/apis/dashboard
- **Billing**: https://console.cloud.google.com/billing
- **Documentation**: https://developers.google.com/maps/documentation/directions

---

## Contact Support

If you continue having issues after following these steps:
1. Check your Google Cloud project has billing enabled
2. Verify you're editing the correct API key
3. Try creating a completely new unrestricted key for testing
4. Check the browser console for specific error messages
5. Ensure you're logged into the correct Google account

The distance measurement feature will work once the Directions API is properly enabled and the API key has the correct permissions.

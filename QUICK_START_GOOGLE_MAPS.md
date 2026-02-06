# Google Maps Autocomplete - Testing Guide

## ✅ Setup Complete

Your Google Maps API key has been successfully configured!

### Configuration Summary:
- **API Key**: `AIzaSyC3_I50rfef-IX8-1cDeLi4zzM0As32TcU`
- **Backend .env file**: Created at `backend/src/.env`  
- **Backend server**: Updated to load .env explicitly
- **Controller**: Updated with no-cache headers to prevent stale responses

### Backend Status:
✅ Server running on http://localhost:5000  
✅ Google Maps API Key loaded: `AIzaSyC3_I50rfef-IX8...`

---

## 🧪 How to Test Autocomplete

### Step 1: Clear Browser Cache
**IMPORTANT**: Your browser may have cached the old (empty) API key response.

**Firefox**:
1. Press `Ctrl + Shift + Del`
2. Select "Cached Web Content"
3. Click "Clear Now"

**OR** use Private/Incognito window:
- `Ctrl + Shift + P` (Firefox)
- `Ctrl + Shift + N` (Chrome)

### Step 2: Open Application
1. Go to **http://localhost:5173**
2. Login with any user (e.g., `inspector@usda.gov` / `Test123!`)

### Step 3: Test Autocomplete
1. Navigate to **"Trip Templates"** or **"Add Trip"**
2. Click on **"From Address"** or **"To Address"** input field
3. Start typing an address, for example:
   - `1600 Pennsylvania`
   - `Central Park`
   - `Times Square`

### Expected Result:
✅ A dropdown should appear below the input field with Google Maps address suggestions
✅ You should be able to click a suggestion to auto-fill the complete address
✅ A small 🗺️ icon appears in the input field indicating Google Maps is active

### If Autocomplete Still Doesn't Work:

#### Check 1: Browser Console (F12)
Look for:
- ❌ Red errors about Google Maps
- ✅ Green message: "Google Maps API loaded - autocomplete enabled"
- ✅ Message: "Google Places Autocomplete initialized"

#### Check 2: Network Tab (F12 → Network)
1. Filter by "google-maps-api-key"
2. Click the request
3. Check Response tab - should show:
   ```json
   {
     "success": true,
     "apiKey": "AIzaSyC3_I50rfef-IX8...",
     "hasKey": true
   }
   ```

#### Check 3: Google Cloud Console
Your API key needs these APIs enabled:
1. Go to https://console.cloud.google.com/apis/dashboard
2. Verify these are enabled:
   - ✅ Maps JavaScript API
   - ✅ Places API

#### Check 4: API Key Restrictions
If you set restrictions on your API key:
1. Go to https://console.cloud.google.com/apis/credentials
2. Click your API key
3. Under "Application restrictions":
   - Should be "None" OR
   - HTTP referrers should include `http://localhost:5173/*`
4. Under "API restrictions":
   - Should include "Maps JavaScript API" and "Places API"

---

## 🐛 Troubleshooting

### Error: "This page can't load Google Maps correctly"
**Cause**: API key not being loaded  
**Fix**: Clear browser cache and refresh

### Error: "You must use an API key to authenticate"
**Cause**: API key is empty  
**Fix**: 
1. Check `backend/src/.env` file exists
2. Restart backend server
3. Clear browser cache

### Autocomplete dropdown doesn't appear
**Possible causes**:
1. Browser cache - clear it
2. API not enabled in Google Cloud Console
3. API key restrictions blocking localhost

---

## 📝 Quick Reference

**Backend .env file location**: `backend/src/.env`
**API Key**: `AIzaSyC3_I50rfef-IX8-1cDeLi4zzM0As32TcU`

**To restart backend**:
```powershell
cd backend/src
node server.js
```

**Check if API key is loaded**:
Look for this message in server output:
```
🗺️  Google Maps API Key: Loaded (AIzaSyC3_I50rfef-IX8...)
```

**Test endpoint** (in browser console):
```javascript
fetch('/api/settings/google-maps-api-key', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(console.log)
```

Should return:
```json
{
  "success": true,
  "apiKey": "AIzaSyC3_I50rfef-IX8-1cDeLi4zzM0As32TcU",
  "hasKey": true
}
```

---

## ✨ Success Criteria

When everything works correctly:

1. ✅ No Google Maps errors in browser console
2. ✅ Address inputs show 🗺️ icon when focused
3. ✅ Typing an address shows dropdown with suggestions
4. ✅ Clicking a suggestion fills the complete address
5. ✅ Works on ALL pages with address inputs (Trip Templates, Add Trip, Profile Setup)

The autocomplete should work the same way for ALL users (Inspector, SCSI, FLS, Admin).

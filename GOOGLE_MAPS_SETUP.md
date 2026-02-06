# Google Maps Autocomplete Setup Guide

## Problem
The address autocomplete is not working because Google Maps API key is not configured.

Error message: "This page can't load Google Maps correctly"

## Solution

### Step 1: Get Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**:
   - Click "Select a project" → "New Project"
   - Give it a name (e.g., "USDA Travel Mileage")
   - Click "Create"

3. **Enable Required APIs**:
   - Go to "APIs & Services" → "Library"
   - Search for "Maps JavaScript API" → Click → Enable
   - Search for "Places API" → Click → Enable
   - Search for "Directions API" → Click → Enable (optional, for route calculations)

4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key (starts with "AIza...")

5. **Secure the API Key** (Important):
   - Click "Edit API key"
   - Under "API restrictions", select "Restrict key"
   - Choose: Maps JavaScript API, Places API, Directions API
   - Under "Application restrictions", choose:
     - "HTTP referrers (web sites)"
     - Add: `http://localhost:*` (for development)
     - Add your production domain when deploying
   - Click "Save"

### Step 2: Add API Key to Backend

#### Option A: Using PowerShell (Windows)
```powershell
# Navigate to backend/src directory
cd backend\src

# Create .env file with API key
@"
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
PORT=5000
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding utf8
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

#### Option B: Manual Creation
1. Open backend/src directory
2. Create a file named `.env`
3. Add this content:
   ```
   GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   PORT=5000
   NODE_ENV=development
   ```
4. Replace `YOUR_API_KEY_HERE` with your actual API key
5. Save the file

### Step 3: Restart Backend Server

1. **Stop the backend server** (if running)
   - Find the terminal running backend
   - Press `Ctrl+C`

2. **Restart backend**:
   ```powershell
   cd backend/src
   node server.js
   ```

3. **Check logs** - You should see:
   ```
   ✅ Server running on http://localhost:5000
   ```

### Step 4: Test Autocomplete

1. **Refresh your browser** (http://localhost:5173)
2. **Go to**: Trip Templates or Add Trip page
3. **Type an address** in "From Address" or "To Address" field
4. **Should see**: Google address suggestions dropdown

## Troubleshooting

### Error: "This page can't load Google Maps correctly"
**Cause**: No API key configured or invalid key  
**Fix**: Follow steps 1-3 above

### Error: "You must use an API key to authenticate"
**Cause**: API key not properly set in .env file  
**Fix**: Check .env file has `GOOGLE_MAPS_API_KEY=` with your key

### Error: "This API project is not authorized to use this API"
**Cause**: Required APIs not enabled  
**Fix**: Enable Maps JavaScript API and Places API in Google Cloud Console

### Error: "API keys with referer restrictions cannot be used"
**Cause**: API key restrictions too strict  
**Fix**: Add `http://localhost:*` to HTTP referrers in API key settings

### Autocomplete still not showing
**Cause**: Browser cache or frontend not reloaded  
**Fix**: 
1. Hard refresh browser (Ctrl+F5)
2. Check browser console for errors
3. Verify API key is correct in backend logs

## Testing Without API Key

The system can work without an API key for testing, but with limitations:
- Limited number of requests per day
- Google warning messages
- May stop working unexpectedly

**Not recommended for production!**

## Cost Information

Google Maps Platform pricing:
- **Free tier**: $200 credit per month
- **Places API Autocomplete**: $2.83 per 1000 requests
- **Maps JavaScript API**: $7.00 per 1000 loads
- **Directions API**: $5.00 per 1000 requests

For typical usage (small team), you'll likely stay within the free tier.

## Security Best Practices

1. ✅ **Restrict API Key**: Always use application and API restrictions
2. ✅ **Use Environment Variables**: Never commit API keys to git
3. ✅ **Monitor Usage**: Set up billing alerts in Google Cloud Console
4. ✅ **Rotate Keys**: If key is exposed, regenerate immediately

## Alternative: Without Google Maps

If you don't want to use Google Maps, you can:
1. Disable autocomplete (manual address entry only)
2. Use a different service (OpenStreetMap, Mapbox, etc.)
3. Pre-populate common addresses in templates

## Files Involved

- `backend/src/.env` - Stores API key (create this file)
- `backend/src/controllers/settingsController.js` - Reads API key
- `frontend/src/utils/googleMapsLoader.ts` - Loads Google Maps script
- `frontend/src/components/AddressAutocomplete.tsx` - Uses autocomplete

## Summary

**Quick Steps**:
1. Get API key from Google Cloud Console
2. Create `backend/src/.env` file
3. Add: `GOOGLE_MAPS_API_KEY=YOUR_KEY`
4. Restart backend server
5. Refresh browser and test

**Need Help?**
- Google Maps Platform docs: https://developers.google.com/maps/documentation
- Google Cloud Console: https://console.cloud.google.com/

Good luck! 🗺️

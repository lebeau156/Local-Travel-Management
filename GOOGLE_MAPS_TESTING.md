# Google Maps API Integration - Testing Guide

## ✅ Implementation Complete!

The Google Maps Distance Matrix API integration is fully implemented and ready to use.

---

## 🎯 What Was Added

### 1. Settings Page (`/settings`)
- **Location:** Click **⚙️ Settings** in sidebar (Admin/Fleet Manager only)
- **Features:**
  - Configure Google Maps API key via web UI
  - Test API connection with one click
  - View current status (Active/Mock)
  - System information display
  - Setup instructions and cost info

### 2. Backend API Endpoints
- `GET /api/settings` - Get current settings
- `POST /api/settings/google-maps-key` - Save API key to .env
- `POST /api/settings/test-google-maps` - Test API connection

### 3. PowerShell Setup Script
- **File:** `setup-google-maps.ps1`
- **Usage:** Interactive CLI setup
- **Features:** Create .env file with or without API key

### 4. Documentation
- ✅ `GOOGLE_MAPS_API_INTEGRATION.md` - Complete guide (70+ sections)
- ✅ `QUICK_START_GOOGLE_MAPS.md` - 2-minute quick start
- ✅ `GOOGLE_MAPS_SETUP.md` - Original detailed setup guide

---

## 🧪 How to Test

### Test 1: Access Settings Page

1. **Login as Admin**
   - Email: `admin@usda.gov`
   - Password: `Admin123!`

2. **Navigate to Settings**
   - Look for **⚙️ Settings** in left sidebar
   - Should be between "Backup" and "Profile"
   - Click on it

3. **Verify Page Loads**
   - Should see "System Settings" heading
   - Should see "🗺️ Google Maps API Integration" section
   - Should see current status badge (probably "⚠ Using Mock Data")

**Expected Result:** Settings page displays correctly with all sections visible.

---

### Test 2: View Current Status (Without API Key)

1. **Check Current Status Section**
   - Should show: 🎲 **Mock Mode:** Using random mileage (10-60 miles)
   - Status badge should be yellow: "⚠ Using Mock Data"

2. **Check Setup Instructions**
   - Blue box with 5 steps to get API key
   - Cost information: $200/month free
   - Link to Google Cloud Console

**Expected Result:** System correctly identifies it's in mock mode.

---

### Test 3: Test Mock Mileage (No API Required)

1. **Go to My Trips → Add Trip**
2. **Create a test trip:**
   ```
   From Address: Washington DC
   To Address: Baltimore MD
   Site Name: Test Site
   Purpose: Testing
   Date: Today
   ```
3. **Submit the trip**
4. **Check the mileage**
   - Should be a random number between 10-60 miles
   - Will be different each time you create a trip

5. **Create the same trip again**
   - From: Washington DC
   - To: Baltimore MD
   - Mileage will be different (proves it's random/mock)

**Expected Result:** Trips work perfectly with random mock mileage.

---

### Test 4: PowerShell Setup Script (Optional)

1. **Open PowerShell** in project root

2. **Run the script:**
   ```powershell
   .\setup-google-maps.ps1
   ```

3. **Choose option 2** (No API key, use mock)
   - Script should create `backend/.env` file
   - Should show success message
   - Should see instructions to restart server

4. **Verify .env file created:**
   ```powershell
   Test-Path backend/.env
   # Should return: True
   ```

5. **Check .env contents:**
   ```powershell
   Get-Content backend/.env
   # Should show: GOOGLE_MAPS_API_KEY=
   #              PORT=5000
   #              JWT_SECRET=...
   ```

**Expected Result:** `.env` file created successfully with empty API key.

---

### Test 5: Configure API Key via UI (If You Have One)

**⚠️ Skip this if you don't have a Google Maps API key**

1. **Get API key** from Google Cloud Console (see `GOOGLE_MAPS_SETUP.md`)

2. **Go to Settings page**

3. **Enter API key:**
   - Paste key in the input field
   - Click the eye icon to toggle visibility
   - Click **Save**

4. **Should see success message:**
   - "Google Maps API key saved successfully! Please restart the backend server..."

5. **Test the API:**
   - Click **🧪 Test API Connection** button
   - Should show loading state
   - Should show success: "✅ Google Maps API is working! Test route: Washington DC → Baltimore MD = XX miles"

6. **Restart backend server:**
   ```powershell
   # Stop current backend (Ctrl+C)
   cd backend
   npm start
   ```

7. **Refresh Settings page**
   - Status should now show: ✅ **API Active**
   - Badge should be green: "✓ Active"

8. **Create a real trip:**
   - From: Washington DC
   - To: Baltimore MD
   - Mileage should be ~44 miles (accurate!)
   - Create same trip again - same mileage (proves it's real)

**Expected Result:** API key configured, tested, and working correctly.

---

### Test 6: Access Control

1. **Logout from Admin account**

2. **Login as Inspector:**
   - Email: `inspector@usda.gov`
   - Password: `Test123!`

3. **Check sidebar navigation:**
   - Should **NOT** see "⚙️ Settings" link
   - Should only see: Dashboard, My Trips, Vouchers, Activity Log, Profile

4. **Try to access directly:**
   - Navigate to: `http://localhost:5173/settings`
   - Should show: "Access Denied. Only administrators can access settings."

**Expected Result:** Inspectors and Supervisors cannot access Settings page.

---

### Test 7: Settings in Different Roles

| Role | Has Settings Link? | Can Access Page? |
|------|-------------------|------------------|
| Admin | ✅ Yes | ✅ Yes |
| Fleet Manager | ✅ Yes | ✅ Yes |
| Supervisor | ❌ No | ❌ No (Access Denied) |
| Inspector | ❌ No | ❌ No (Access Denied) |

**Expected Result:** Only Admin and Fleet Manager can access Settings.

---

## 📊 System Status Summary

### Current Configuration:
- **Backend:** Running on http://localhost:5000
- **Frontend:** Running on http://localhost:5173
- **Database:** SQLite at `backend/database.sqlite`
- **Google Maps API:** Not configured (using mock mode)
- **Settings Page:** Available at `/settings`

### API Status:
- 🎲 **Mock Mode Active**
- Random mileage: 10-60 miles
- No API key required
- System fully functional

### To Enable Real Mileage:
1. Get Google Maps API key (free tier: $200/month)
2. Go to Settings page
3. Enter API key and save
4. Restart backend server
5. Test connection
6. Create trips with accurate mileage!

---

## 🎯 What to Test Now

**Minimum Tests (5 minutes):**
1. ✅ Access Settings page as Admin
2. ✅ Verify mock mode status showing
3. ✅ Create a test trip (should use random mileage)
4. ✅ Verify Settings not accessible to Inspector

**Full Tests (15 minutes):**
1. ✅ Run PowerShell setup script
2. ✅ Check .env file created
3. ✅ Test all Settings page features
4. ✅ Verify access control for all roles
5. ✅ Create multiple trips and compare mileage

**With API Key (30 minutes):**
1. ✅ Get Google Maps API key
2. ✅ Configure via Settings UI
3. ✅ Test API connection
4. ✅ Restart server
5. ✅ Create real trips with accurate mileage
6. ✅ Compare mock vs real mileage

---

## 📚 Documentation Available

| File | Purpose | Size |
|------|---------|------|
| `GOOGLE_MAPS_API_INTEGRATION.md` | Complete guide with troubleshooting | 200+ lines |
| `QUICK_START_GOOGLE_MAPS.md` | 2-minute quick start guide | 50 lines |
| `GOOGLE_MAPS_SETUP.md` | Original detailed setup | 140 lines |
| `setup-google-maps.ps1` | PowerShell setup script | Interactive CLI |

---

## 🆘 Common Issues

### Settings Link Not Visible
- **Cause:** Not logged in as Admin or Fleet Manager
- **Fix:** Login with `admin@usda.gov` / `Admin123!`

### "Access Denied" on Settings Page
- **Cause:** Wrong user role
- **Fix:** Must be Admin or Fleet Manager

### Still Shows Mock After Saving API Key
- **Cause:** Backend server not restarted
- **Fix:** Restart backend: `cd backend; npm start`

### Test Connection Fails
- **Cause:** Invalid API key or billing not enabled
- **Fix:** Check key in Google Cloud Console, enable billing

---

## ✅ Success Criteria

After testing, you should be able to:

1. ✅ Access Settings page as Admin/Fleet Manager
2. ✅ See current API status (Mock/Active)
3. ✅ Create trips with mock mileage (random 10-60 miles)
4. ✅ (Optional) Configure real API key via UI
5. ✅ (Optional) Test API connection
6. ✅ (Optional) Create trips with accurate mileage
7. ✅ Verify access control works (Inspectors blocked)

---

## 🎉 Next Steps

Once Google Maps integration is working:

1. **Try the Backup System** (already complete)
   - Create backups
   - Download/restore functionality
   - Test cleanup features

2. **Explore Other Features**
   - Audit logging (track all activity)
   - Excel/CSV exports
   - PDF voucher generation
   - Role-specific dashboards

3. **Plan Next Enhancements**
   - Email notifications
   - Advanced reporting
   - User management
   - Dark mode

---

**Current Status:** Google Maps API integration is COMPLETE and ready to test!

**Test it now by accessing:** http://localhost:5173/settings

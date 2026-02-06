# Bulk Trip Import - Troubleshooting Guide

## Issue Observed
- "Failed to download template" error on Bulk Trip Import page
- Error appears when clicking "Download CSV Template" button

## Root Cause Analysis

### Possible Causes:
1. **Backend server not running** - Most likely
2. **Authentication issue** - Token expired or missing
3. **CORS configuration** - Less likely (other pages work)
4. **Route mismatch** - Already verified, routes are correct

## Frontend Updates Made

### Fixed Schema Mismatch
Updated `BulkTripImport.tsx` to match backend schema:

**Backend Fields:**
- `date`, `from_address`, `to_address`, `site_name`, `purpose`, `expenses`, `expense_notes`

**Previous Frontend (Incorrect):**
- `from_location`, `to_location`, `miles`, `notes`

**Changes:**
1. ✅ Updated CSV format requirements text
2. ✅ Updated preview table columns (from_address, to_address, site_name, purpose, expenses)
3. ✅ Fixed import result handling (rowCount, imported, failed vs successCount, errorCount)
4. ✅ Fixed preview data source (preview vs imported)
5. ✅ Improved error handling for blob responses

## Verification Steps

### 1. Check Backend Server
```powershell
# Navigate to backend directory
cd backend

# Start server
node src/server.js
```

**Expected Output:**
```
✅ Database tables created successfully
✅ Voucher routes registered
✅ Server running on http://localhost:5000
```

### 2. Test CSV Template Endpoint Directly
```powershell
# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/csv/template" `
  -Headers @{ "Authorization" = "Bearer YOUR_TOKEN" } `
  -OutFile "template.csv"
```

**Expected:** File downloads successfully

### 3. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Click "Download CSV Template"
4. Look for errors:
   - Network errors (ERR_CONNECTION_REFUSED = server not running)
   - 401/403 (authentication issue)
   - CORS errors (policy issue)

### 4. Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Click "Download CSV Template"
4. Find the `/api/csv/template` request
5. Check:
   - Status code (200 = success, 401 = auth, 404 = not found, 500 = server error)
   - Response headers
   - Request headers (Authorization header present?)

## Quick Fix Checklist

### Backend
- [ ] Server is running on port 5000
- [ ] Route registered: `app.use('/api/csv', require('./routes/csvImport'))`
- [ ] Controller exports `downloadTemplate` function
- [ ] Authentication middleware allows template download

### Frontend
- [ ] User is logged in (check localStorage for 'token')
- [ ] API baseURL is correct: `http://localhost:5000/api`
- [ ] Authorization header is being sent
- [ ] Error handling captures blob errors

## Expected CSV Template Format

```csv
date,from_address,to_address,site_name,purpose,expenses,expense_notes
2026-01-15,"123 Main St, City, State","456 Oak Ave, City, State","Plant ABC","Routine inspection",25.50,"Parking fee"
2026-01-16,"456 Oak Ave, City, State","789 Pine Rd, City, State","Plant XYZ","Follow-up visit",0,""
```

## Testing the Full Import Flow

### Step 1: Download Template
1. Login as admin: `admin@usda.gov` / `Admin123!`
2. Navigate to Bulk Trip Import
3. Click "Download CSV Template"
4. Verify file downloads

### Step 2: Fill Template
1. Open `trip_import_template.csv`
2. Add your trip data following the format
3. Required: date, from_address, to_address
4. Optional: site_name, purpose, expenses, expense_notes
5. Date format: YYYY-MM-DD

### Step 3: Validate (Dry Run)
1. Drag and drop CSV or click to browse
2. Keep "Dry Run" checked
3. Click "Validate CSV"
4. Review validation results
5. Fix any errors

### Step 4: Import
1. Uncheck "Dry Run"
2. Click "Import Trips"
3. Verify success message
4. Check "My Trips" page for imported trips

## Code Changes Summary

### BulkTripImport.tsx
**Lines Changed:** ~50 lines

**Key Updates:**
1. CSV format requirements text (lines 348-355)
2. Preview table headers and data mapping (lines 322-341)
3. Import result handling (lines 125-136, 280-289)
4. Error handling for blob responses (lines 96-111)

**Before:**
```tsx
<li>Required columns: date, from_location, to_location, purpose</li>
```

**After:**
```tsx
<li>Required columns: date, from_address, to_address</li>
<li>Optional columns: site_name, purpose, expenses, expense_notes</li>
```

## Related Files

- **Backend Controller:** `backend/src/controllers/csvImportController.js`
- **Backend Route:** `backend/src/routes/csvImport.js`
- **Frontend Page:** `frontend/src/pages/BulkTripImport.tsx`
- **API Config:** `frontend/src/api/axios.ts`

## Next Steps

1. **Start backend server** if not running
2. **Refresh browser** and try downloading template again
3. **Check browser console** for detailed error messages
4. **Test with sample CSV** file
5. **Verify trips are created** in database

## Common Solutions

### Server Not Running
```powershell
cd backend
node src/server.js
```

### Authentication Expired
1. Logout from UI
2. Login again
3. Try download again

### CORS Issue (Unlikely)
Check `backend/src/server.js` has CORS enabled:
```javascript
app.use(cors());
```

## Status
✅ Frontend schema updated to match backend  
✅ Error handling improved  
✅ Preview table fixed  
⏳ Awaiting backend server test  

**Ready for testing once backend is confirmed running.**

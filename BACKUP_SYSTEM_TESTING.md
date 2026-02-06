# Database Backup System - Testing Guide

## ✅ Implementation Complete

The database backup system has been successfully integrated into your USDA Travel Mileage Tracker application.

### What Was Added:

1. **Backend Components:**
   - `backend/src/utils/backupManager.js` - Core backup utility (7 functions)
   - `backend/src/controllers/backupController.js` - API endpoints (8 handlers)
   - `backend/src/routes/backup.js` - Route definitions
   - `backend/backups/` - Backup storage directory

2. **Frontend Components:**
   - `frontend/src/pages/BackupManagement.tsx` - Complete UI for backup management
   - Added route in `App.tsx`: `/backup`
   - Added navigation link in `Layout.tsx` (Fleet Manager role only)

3. **Access Control:**
   - Only **Admin** and **Fleet Manager** roles can access backup features
   - Navigation item shows only for authorized users

---

## 🧪 How to Test

### 1. Access the Backup Page

1. Open browser: **http://localhost:5173**
2. Login with Fleet Manager account:
   - Email: `fleetmgr@usda.gov`
   - Password: `Test123!`
3. Click "**💾 Backup**" in the sidebar navigation
4. You should see the Backup Management page

### 2. Test Backup Creation

1. Click "**📦 Create Backup**" button
2. Wait for success message
3. A new backup should appear in the backups list
4. The statistics cards should update (total backups, total size)

**Expected Result:**
- Backup file created with timestamp in name (e.g., `database_backup_2026-01-15T21-17-19-366Z.sqlite`)
- Success message displayed
- Backup appears in the list with:
  - Filename
  - Size (in KB)
  - Creation date/time
  - Action buttons (Download, Restore, Delete)

### 3. Test Backup Download

1. Click the "**⬇️ Download**" button on any backup
2. Browser should download the `.sqlite` file
3. Check your Downloads folder for the file

**Expected Result:**
- File downloads successfully
- File size matches what's shown in the UI
- File is a valid SQLite database (can be opened with SQLite tools)

### 4. Test Backup Statistics

Check the statistics cards at the top:

- **Total Backups**: Should match the number of items in the list
- **Total Size**: Sum of all backup file sizes
- **Newest Backup**: Date/time of most recent backup
- **Oldest Backup**: Date/time of earliest backup

### 5. Test Cleanup Old Backups

1. Create multiple backups (click "Create Backup" 3-4 times)
2. Click "**🧹 Cleanup Old Backups (keep 5)**" button
3. Confirm the action
4. If you have more than 5 backups, older ones will be deleted

**Expected Result:**
- Only the 5 most recent backups remain
- Success message shows how many were deleted
- List updates automatically

### 6. Test Restore Functionality

**⚠️ CAUTION: This will replace your current database!**

1. Create a fresh backup first (safety backup)
2. Make a small change in the database (e.g., add a test trip)
3. Click "**♻️ Restore**" button on an older backup
4. Read the warning message carefully
5. Confirm the restoration
6. Application will restart

**Expected Result:**
- Warning dialog appears with clear explanation
- After confirmation:
  - System creates a safety backup automatically (named `pre_restore_safety_TIMESTAMP.sqlite`)
  - Database is restored to the selected backup state
  - Success message appears
  - Page reloads after 3 seconds

### 7. Test JSON Export

1. Click "**📤 Export as JSON**" button
2. Wait for the export to complete
3. JSON file should download

**Expected Result:**
- JSON file downloads (e.g., `database_export_2026-01-15.json`)
- File contains all database tables in JSON format:
  - users
  - profiles
  - trips
  - vouchers
  - audit_log
- File is human-readable but **NOT** restorable (for analysis only)

### 8. Test Access Control

**Test as Inspector:**
1. Logout
2. Login as inspector:
   - Email: `inspector@usda.gov`
   - Password: `Test123!`
3. Check the sidebar navigation

**Expected Result:**
- "Backup" link should **NOT** appear in navigation
- If you manually navigate to `/backup`, you should see "Access Denied" message

---

## 📋 Feature Summary

### 7 Backup Operations:

1. **Create Backup** - Creates timestamped SQLite file copy
2. **List Backups** - Shows all available backups with metadata
3. **Download Backup** - Downloads backup file to your computer
4. **Restore Backup** - Restores database from backup (with safety backup)
5. **Delete Backup** - Deletes individual backup files
6. **Cleanup Old Backups** - Keeps N most recent, deletes rest
7. **Export as JSON** - Exports entire database as JSON (for analysis)

### Safety Features:

- **Automatic Safety Backup**: Before every restore, system creates `pre_restore_safety_TIMESTAMP.sqlite`
- **Confirmation Dialogs**: All destructive operations require confirmation
- **Access Control**: Only admins and fleet managers can access
- **Error Handling**: Clear error messages for all failure scenarios
- **Audit Logging**: All backup operations are logged to audit trail

### Storage:

- **Location**: `backend/backups/` directory
- **Naming**: `database_backup_YYYY-MM-DDTHH-MM-SS-MMMZ.sqlite`
- **Safety Backups**: `pre_restore_safety_TIMESTAMP.sqlite`
- **JSON Exports**: `database_export_YYYY-MM-DD.json`

---

## 🔧 Troubleshooting

### Backup Button Does Nothing
- Check browser console for errors
- Verify backend server is running on port 5000
- Check network tab to see API request/response

### "Access Denied" Error
- Ensure you're logged in as Admin or Fleet Manager
- Check your user role in the top right corner of the page

### Download Fails
- Check if backup file still exists in `backend/backups/` directory
- Verify file permissions on the backups directory

### Restore Doesn't Work
- Ensure the backup file is valid (not corrupted)
- Check that backend server has write permissions to database file
- Check server logs for error messages

---

## 📊 Current Status

### Backend API: ✅ **Working**
Tested with automated script:
- ✅ Create backup
- ✅ List backups
- ✅ Download backup
- ✅ Get statistics
- ✅ Cleanup old backups

### Frontend UI: ✅ **Ready**
- ✅ Component created
- ✅ Route registered
- ✅ Navigation link added (fleet_manager only)
- ✅ Access control implemented

### Servers Running:
- ✅ Backend: http://localhost:5000
- ✅ Frontend: http://localhost:5173

---

## 🎯 What to Test

Please test the backup system and report:

1. Does the Backup page load correctly?
2. Can you create backups successfully?
3. Do the statistics update correctly?
4. Does download work?
5. Does restore work (test carefully!)?
6. Is the UI clear and easy to use?
7. Any bugs or issues you encounter?

---

## 📝 Next Steps

After testing, we can:

1. Add backup scheduling (automatic daily/weekly backups)
2. Add email notifications for backup operations
3. Add remote backup storage (AWS S3, Google Drive, etc.)
4. Add backup encryption for sensitive data
5. Add backup verification (test restore before confirming)
6. Document backup procedures in README.md

Let me know when you're ready to test!

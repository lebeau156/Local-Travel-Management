# SCSI Supervisor Dashboard - Testing Guide

## Overview
The SCSI Supervisor Dashboard has been successfully implemented with enhanced permissions compared to FLS supervisors.

## ✅ Completed Implementation

### Backend Changes

**File: `backend/src/routes/supervisors.js`**
- Added `GET /api/supervisors/all-inspectors` - Returns all inspectors in the system
- Added `POST /api/supervisors/request-assignment/:inspectorId` - Request assignment of CSI

**File: `backend/src/controllers/supervisorController.js`**
- `getAllInspectors()` - Returns all inspectors with:
  - Basic profile info (name, email, position, state, circuit)
  - Assigned supervisor details
  - Pending vouchers count
- `requestAssignment(inspectorId)` - Handles SCSI requesting assignment of unassigned CSI

### Frontend Changes

**File: `frontend/src/pages/ScsiSupervisorDashboard.tsx`** (NEW)
- Complete dashboard with 4 stat cards:
  1. **All Inspectors** - Total count of all inspectors
  2. **Assigned to Me** - CSIs assigned to this SCSI
  3. **Unassigned CSIs** - CSIs without a supervisor
  4. **Assigned to Others** - CSIs assigned to different supervisors

**File: `frontend/src/App.tsx`**
- Added route: `/supervisor/scsi-dashboard`
- Imported `ScsiSupervisorDashboard` component

**File: `frontend/src/components/Layout.tsx`**
- Added position detection for supervisors
- SCSI supervisors automatically route to SCSI dashboard
- FLS supervisors route to standard supervisor dashboard

**File: `frontend/src/types/index.ts`**
- Added `position`, `state`, `circuit`, `assigned_supervisor_id` fields to Profile interface

## 🎯 Key Features

### 1. Visual Categorization
- **Green rows**: Inspectors assigned to current SCSI
- **Orange rows**: Unassigned CSIs (can request assignment)
- **White/Gray rows**: Inspectors assigned to other supervisors

### 2. Filtering System
- Click stat cards to filter the inspector table
- Active filter highlighted with colored border and ring
- Search across name, email, position, state, circuit

### 3. Request Assignment
- "Request Assignment" button for unassigned CSIs
- Confirmation dialog before sending request
- Currently auto-assigns (production would need FLS approval workflow)

### 4. Professional Styling
- USDA government color scheme (white cards, colored borders)
- Consistent with Team Management and Supervisor Dashboard designs
- Lucide React icons for professional appearance

## 🧪 Testing Instructions

### Step 1: Create a SCSI User
You need a user with:
- Role: `supervisor`
- Position: `SCSI` (in profiles table)

**Create SCSI test account:**
```javascript
// Run this in backend context or create a test script
const { db } = require('./src/models/database');
const bcrypt = require('bcrypt');

// Create SCSI user
const hashedPassword = bcrypt.hashSync('Test123!', 10);
const result = db.prepare(`
  INSERT INTO users (email, password, role)
  VALUES (?, ?, ?)
`).run('scsi@usda.gov', hashedPassword, 'supervisor');

// Create profile with SCSI position
db.prepare(`
  INSERT INTO profiles (user_id, first_name, last_name, position)
  VALUES (?, ?, ?, ?)
`).run(result.lastInsertRowid, 'John', 'Smith', 'SCSI');

console.log('SCSI user created: scsi@usda.gov / Test123!');
```

### Step 2: Create Some CSI Inspectors
Create test CSI users to see in the dashboard:

```javascript
// Create CSI 1 (unassigned)
const csi1Result = db.prepare(`
  INSERT INTO users (email, password, role)
  VALUES (?, ?, ?)
`).run('csi1@usda.gov', hashedPassword, 'inspector');

db.prepare(`
  INSERT INTO profiles (user_id, first_name, last_name, position, state, circuit)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(csi1Result.lastInsertRowid, 'Jane', 'Doe', 'CSI', 'CA', 'Circuit 1');

// Create CSI 2 (unassigned)
const csi2Result = db.prepare(`
  INSERT INTO users (email, password, role)
  VALUES (?, ?, ?)
`).run('csi2@usda.gov', hashedPassword, 'inspector');

db.prepare(`
  INSERT INTO profiles (user_id, first_name, last_name, position, state, circuit)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(csi2Result.lastInsertRowid, 'Mike', 'Johnson', 'CSI', 'TX', 'Circuit 2');
```

### Step 3: Login as SCSI
1. Go to http://localhost:5174/login
2. Login with: `scsi@usda.gov` / `Test123!`
3. You should automatically be routed to the SCSI dashboard

### Step 4: Test Features

**Test 1: View All Inspectors**
- ✅ Click "All Inspectors" card
- ✅ Should see all CSIs in the system
- ✅ Table should scroll into view

**Test 2: Filter by Assignment Status**
- ✅ Click "Assigned to Me" - should show green highlighted rows
- ✅ Click "Unassigned CSIs" - should show orange highlighted rows
- ✅ Click "Assigned to Others" - should show white/gray rows

**Test 3: Search Functionality**
- ✅ Type a CSI name in search box
- ✅ Table should filter in real-time
- ✅ Search should work across name, email, position, state, circuit

**Test 4: Request Assignment**
- ✅ Find an unassigned CSI (orange row)
- ✅ Click "Request Assignment" button
- ✅ Confirm the dialog
- ✅ Should show success message
- ✅ CSI should now appear in "Assigned to Me" (green row)

**Test 5: View Pending Vouchers**
- ✅ Create a voucher for a CSI assigned to you
- ✅ Submit the voucher
- ✅ Dashboard should show pending count for that CSI

**Test 6: Navigation**
- ✅ Sidebar should show "Approvals" pointing to SCSI dashboard
- ✅ "Team Management" should still be accessible
- ✅ Clicking logo/home should return to SCSI dashboard

## 🔍 Differences: SCSI vs FLS Dashboard

| Feature | FLS Supervisor | SCSI Supervisor |
|---------|---------------|-----------------|
| **View Inspectors** | Only assigned Food Inspectors | ALL inspectors in system |
| **Filter Options** | Assigned to me only | All, Assigned, Unassigned, Others |
| **Assignment** | Cannot request assignments | Can request assignment of CSIs |
| **Color Coding** | N/A | Green/Orange/Gray by assignment |
| **Pending Vouchers** | Only for assigned inspectors | For assigned CSIs only |
| **Approval Authority** | Food Inspector vouchers | Assigned CSI vouchers |

## 📊 API Endpoints

### Get All Inspectors
```
GET /api/supervisors/all-inspectors
Authorization: Bearer <token>

Response:
[
  {
    id: 1,
    email: "csi1@usda.gov",
    role: "inspector",
    first_name: "Jane",
    last_name: "Doe",
    position: "CSI",
    state: "CA",
    circuit: "Circuit 1",
    assigned_supervisor_id: null,
    assigned_supervisor_name: null,
    pending_vouchers: 0
  },
  ...
]
```

### Request Assignment
```
POST /api/supervisors/request-assignment/:inspectorId
Authorization: Bearer <token>

Response:
{
  message: "Jane Doe has been assigned to you successfully!"
}
```

## 🎨 Design Notes

**Color Scheme (USDA Professional)**:
- Blue (#005ea2): Headers, primary actions
- Green (#00a91c): Assigned/approved items
- Orange (#ff7f00): Unassigned/pending items
- Gray (#666): Neutral/inactive items
- White backgrounds with 2px colored borders

**Icons Used** (Lucide React):
- Users: All inspectors
- CheckCircle: Assigned to me
- Clock: Unassigned
- AlertCircle: Assigned to others
- UserPlus: Request assignment action

## ✅ Verification Checklist

- [x] Backend routes added and exported
- [x] Controllers implemented with SQL queries
- [x] Frontend component created (397 lines)
- [x] App.tsx routing configured
- [x] Layout.tsx position-based routing
- [x] TypeScript types updated
- [x] Professional USDA styling applied
- [x] Color coding implemented
- [x] Search and filtering working
- [x] Request assignment flow implemented
- [x] Both servers running successfully

## 🚀 Servers Running

- **Backend**: http://localhost:5000 ✅
- **Frontend**: http://localhost:5174 ✅

## 📝 Next Steps (Production Ready)

For production deployment, consider:

1. **Approval Workflow**: Currently request assignment auto-approves. Should create:
   - Notifications table
   - Assignment requests pending FLS approval
   - Email notifications to FLS

2. **Permissions Check**: Add middleware to verify SCSI position before allowing access

3. **Audit Logging**: Log assignment requests and approvals

4. **Bulk Actions**: Allow SCSI to request multiple assignments at once

5. **Assignment History**: Show history of assignment changes

---

**Status**: ✅ **READY FOR TESTING**

Both servers are running and all code changes are complete. You can now test the SCSI Supervisor Dashboard by creating a test SCSI user and logging in!

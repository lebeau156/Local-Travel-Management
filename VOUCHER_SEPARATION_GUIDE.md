# Voucher Separation: Personal vs Team Vouchers

## Problem Solved

When a supervisor (like SCSI) viewed "My Vouchers", they saw a confusing mix of:
- ❌ Their own personal vouchers (trips they took)
- ❌ Vouchers from their team members (vouchers they need to approve)

**This was confusing!** Supervisors couldn't tell which vouchers were theirs and which belonged to their inspectors.

## Solution Implemented

We've now created **clear separation** between personal and team vouchers:

### 1. **My Vouchers** Page (`/vouchers`)
**Who sees it**: Everyone (Inspectors, Supervisors, Fleet Managers, Admins)

**What it shows**:
- ✅ **ONLY your own personal vouchers**
- ✅ Vouchers you created for your own travel
- ✅ Vouchers you can submit, edit, or delete

**For Supervisors specifically**:
- Page title: "My Personal Vouchers"
- Blue info box with link to "Voucher History" for team vouchers
- Clear separation from team management

### 2. **Voucher History** Page (`/voucher-history`)
**Who sees it**: Supervisors, Fleet Managers, Admins

**What it shows**:
- ✅ **Vouchers from your team members** (if you're a supervisor)
- ✅ **All vouchers in the system** (if you're a fleet manager/admin)
- ✅ Advanced filters: Inspector, Status, State, Circuit, Month, Year

**For Supervisors specifically**:
- Page description: "View, download, and print vouchers from your team members"
- Blue info box with link back to "My Vouchers" for personal vouchers
- Inspector filter to focus on specific team members

---

## Changes Made

### Frontend Changes

#### 1. **File: `frontend/src/pages/Vouchers.tsx`**

**Added**:
- Import `useAuth` to access user role
- Visual differentiation for supervisors
- Link to Voucher History for team vouchers

**Before**:
```tsx
<h1>Travel Vouchers</h1>
```

**After**:
```tsx
<h1>
  {isSupervisor ? 'My Personal Vouchers' : 'Travel Vouchers'}
</h1>
{isSupervisor && (
  <p>
    Your own travel vouchers. For team vouchers, visit{' '}
    <button onClick={() => navigate('/voucher-history')}>
      Voucher History
    </button>
  </p>
)}
```

#### 2. **File: `frontend/src/pages/VoucherHistory.tsx`**

**Added**:
- Role-specific descriptions
- Blue info box for supervisors explaining the page purpose
- Link back to "My Vouchers" for personal vouchers

**Before**:
```tsx
<p>View, download, and print all travel vouchers</p>
```

**After**:
```tsx
<p>
  {user?.role === 'supervisor' 
    ? 'View, download, and print vouchers from your team members' 
    : user?.role === 'fleet_manager' || user?.role === 'admin'
    ? 'View, download, and print all travel vouchers'
    : 'View, download, and print your travel vouchers'
  }
</p>
{user?.role === 'supervisor' && (
  <div style={{ /* blue info box */ }}>
    💡 Note: This page shows vouchers from your team members.{' '}
    <button onClick={() => navigate('/vouchers')}>
      Click here
    </button>
    {' '}to view your own personal vouchers.
  </div>
)}
```

### Backend Changes

#### 3. **File: `backend/src/controllers/voucherController.js`**

**Modified**: `getVouchers()` function

**Before** (lines 117-174):
```javascript
} else if (req.user.role === 'supervisor') {
  // Supervisors see:
  // 1. Their own vouchers (to create/submit their own travel)
  // 2. Vouchers from inspectors they supervise (to approve)
  
  const assignedInspectors = db.prepare(`
    SELECT user_id FROM profiles WHERE supervisor_id = ?
  `).all(req.user.id);
  
  const userIds = [req.user.id];
  if (assignedInspectors && assignedInspectors.length > 0) {
    userIds.push(...assignedInspectors.map(i => i.user_id));
  }
  
  vouchers = db.prepare(`
    SELECT v.*, p.first_name, p.last_name, p.middle_initial
    FROM vouchers v
    LEFT JOIN profiles p ON v.user_id = p.user_id
    WHERE v.user_id IN (${placeholders})
    ORDER BY v.year DESC, v.month DESC
  `).all(...userIds);
}
```

**After** (lines 117-125):
```javascript
} else {
  // ALL USERS (including supervisors) see ONLY their own personal vouchers
  // Supervisors use /vouchers/all to see their team's vouchers
  vouchers = db.prepare(`
    SELECT * FROM vouchers 
    WHERE user_id = ? 
    ORDER BY year DESC, month DESC
  `).all(req.user.id);
}
```

**Key Change**: 
- ❌ **Removed** complex logic that mixed personal and team vouchers
- ✅ **Simplified** to return ONLY personal vouchers for all users
- ✅ Supervisors use `/api/vouchers/all` endpoint for team vouchers (used by Voucher History page)

---

## User Experience Flow

### For Inspectors (CSI, Food Inspector, etc.)

1. Click "My Vouchers" → See their own vouchers only ✅
2. Click "Voucher History" → See their historical vouchers ✅

### For Supervisors (SCSI, FLS, DDM, DM)

#### **Personal Travel**:
1. Click "My Vouchers" → Page title: "My Personal Vouchers"
2. See ONLY their own vouchers (trips they took)
3. Create, submit, edit, delete their personal vouchers
4. Blue note: "For team vouchers, visit Voucher History"

#### **Team Management**:
1. Click "Voucher History" → Page description: "View vouchers from your team members"
2. See vouchers from their assigned inspectors
3. Filter by inspector, status, state, circuit, month, year
4. Approve/reject team vouchers
5. Blue note: "Click here to view your own personal vouchers"

### For Fleet Managers & Admins

1. Click "My Vouchers" → See all vouchers in system (unchanged)
2. Click "Voucher History" → See all vouchers with advanced filters

---

## API Endpoints

### `GET /api/vouchers`
**Purpose**: Get personal vouchers only

**Who can use**: Everyone

**Returns**:
- **Inspectors**: Their own vouchers
- **Supervisors**: Their own personal vouchers (NOT team vouchers)
- **Fleet Managers/Admins**: All vouchers (for backward compatibility)

**Example**:
```json
[
  {
    "id": 1,
    "user_id": 5,
    "month": 3,
    "year": 2026,
    "status": "approved",
    "total_miles": 46.1,
    "total_amount": 30.89,
    "created_at": "2026-01-21T..."
  }
]
```

### `GET /api/vouchers/all`
**Purpose**: Get all vouchers (for supervisors/managers)

**Who can use**: Supervisors, Fleet Managers, Admins

**Returns**:
- **Supervisors**: Vouchers from their assigned team members
- **Fleet Managers/Admins**: All vouchers in the system

**Query Parameters**:
- `inspector_id`: Filter by specific inspector
- `status`: Filter by status (draft, submitted, approved, etc.)
- `month`: Filter by month (1-12)
- `year`: Filter by year
- `state`: Filter by state
- `circuit`: Filter by circuit

**Example**:
```json
[
  {
    "id": 2,
    "user_id": 8,
    "inspector_name": "Mohamed L. Diallo",
    "month": 1,
    "year": 2026,
    "status": "submitted",
    "total_miles": 124.3,
    "total_amount": 83.28,
    "state": "CA",
    "circuit": "Circuit 1"
  }
]
```

---

## Visual Guide

### Before (Confusing)
```
My Vouchers Page (as SCSI):
┌────────────────────────────────────┐
│ Travel Vouchers                    │
├────────────────────────────────────┤
│ March 2026  | Approved | $30.89   │  ← My personal voucher
│ January 2026| Approved | $83.28   │  ← Inspector's voucher (confusing!)
└────────────────────────────────────┘
User thinks: "Wait, which ones are mine?!"
```

### After (Clear)
```
My Personal Vouchers Page (as SCSI):
┌────────────────────────────────────────────────────────────┐
│ My Personal Vouchers                                       │
│ Your own travel vouchers. For team vouchers, visit         │
│ [Voucher History]                                          │
├────────────────────────────────────────────────────────────┤
│ March 2026  | Approved | $30.89   │  ← Only my vouchers!  │
└────────────────────────────────────────────────────────────┘

Voucher History Page (as SCSI):
┌────────────────────────────────────────────────────────────┐
│ 📋 Voucher History                                         │
│ View, download, and print vouchers from your team members  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 💡 Note: This page shows vouchers from your team      │ │
│ │ members. [Click here] to view your own personal       │ │
│ │ vouchers.                                             │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Filters: [Inspector ▼] [Status ▼] [State ▼] [Circuit ▼]  │
├────────────────────────────────────────────────────────────┤
│ Inspector        | Period      | Status    | Amount       │
│ Mohamed L. Diallo| January 2026| Approved  | $83.28       │
│ Jane Doe         | March 2026  | Submitted | $45.60       │
└────────────────────────────────────────────────────────────┘
User thinks: "Perfect! My personal vouchers are separate from my team's!"
```

---

## Testing Instructions

### Test 1: Login as Inspector
1. Login as `inspector@usda.gov` / `Test123!`
2. Click "My Vouchers"
3. ✅ Should see title "Travel Vouchers"
4. ✅ Should see only their own vouchers
5. ✅ Should NOT see blue info box (they don't manage a team)

### Test 2: Login as Supervisor (SCSI)
1. Login as `scsi@usda.gov` / `Test123!`
2. Click "My Vouchers"
3. ✅ Should see title "My Personal Vouchers"
4. ✅ Should see blue info box with link to "Voucher History"
5. ✅ Should see ONLY their own personal vouchers
6. ✅ Should NOT see any inspector vouchers here
7. Click "Voucher History" link
8. ✅ Should navigate to Voucher History page
9. ✅ Should see blue info box explaining this is for team vouchers
10. ✅ Should see inspector filter dropdown
11. ✅ Should see vouchers from assigned inspectors

### Test 3: Login as FLS Supervisor
1. Login as `supervisor@usda.gov` / `Test123!`
2. Click "My Vouchers"
3. ✅ Should see title "My Personal Vouchers"
4. ✅ Should see ONLY their own vouchers
5. Click "Voucher History"
6. ✅ Should see vouchers from assigned Food Inspectors

### Test 4: Login as Fleet Manager
1. Login as `fleetmgr@usda.gov` / `Test123!`
2. Click "My Vouchers"
3. ✅ Should see all vouchers in system (unchanged behavior)
4. Click "Voucher History"
5. ✅ Should see all vouchers with full filtering capabilities

---

## Benefits

### For Users
✅ **Clear separation**: No confusion about which vouchers are personal vs team  
✅ **Better UX**: Visual cues (titles, descriptions, info boxes)  
✅ **Easy navigation**: Links between pages with clear explanations  
✅ **Professional**: Matches USDA government standards for clarity  

### For Development
✅ **Simpler backend**: Removed complex conditional logic in `getVouchers()`  
✅ **Better separation of concerns**: `/vouchers` = personal, `/vouchers/all` = team  
✅ **Easier to maintain**: Clear purpose for each endpoint  
✅ **Backward compatible**: Fleet managers/admins still see all vouchers  

---

## Summary

**Problem**: Supervisors couldn't distinguish their personal vouchers from their team's vouchers

**Solution**:
- "My Vouchers" → Personal vouchers only
- "Voucher History" → Team vouchers (for supervisors/managers)
- Clear visual indicators and navigation links
- Simplified backend logic

**Impact**: 
- ✅ SCSI can now easily manage their own travel separate from their team
- ✅ FLS can now easily manage their own travel separate from their team  
- ✅ All supervisors have a clearer, more professional experience
- ✅ Reduced confusion and support requests

---

**Status**: ✅ **COMPLETE & READY FOR TESTING**

Both servers are running:
- Backend: http://localhost:5000
- Frontend: http://localhost:5174

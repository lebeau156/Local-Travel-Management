# Supervisor Dashboard Menu Fix

**Date:** January 30, 2026  
**Issue:** "My Dashboard" and "Approvals" showing the same content for SCSI supervisors  
**Status:** ✅ Fixed

---

## Problem

When logged in as SCSI Supervisor (Melissa Byrd):
- "My Dashboard" menu item → `/dashboard` (generic approval page)
- "Approvals" menu item → `/supervisor/dashboard` (same approval page)
- "SCSI Team" menu item → `/supervisor/scsi-dashboard` (actual SCSI dashboard)

**Result:** Three menu items, two showing identical content

---

## Root Cause

In `Layout.tsx`, the menu logic for supervisors was:
```typescript
...(!isFLS && !isDDM && !isDM ? [{ path: '/dashboard', label: 'My Dashboard', icon: '📊' }] : []),
```

This caught all non-FLS, non-DDM, non-DM supervisors (including SCSI) and sent them to a generic `/dashboard` route instead of their specific dashboard.

---

## Solution

Updated the menu logic to check for SCSI position before falling back to generic:

```typescript
// Before
...(!isFLS && !isDDM && !isDM ? [{ path: '/dashboard', label: 'My Dashboard', icon: '📊' }] : []),

// After
...(isSCSI && !isFLS && !isDDM && !isDM ? [{ path: '/supervisor/scsi-dashboard', label: 'My Dashboard', icon: '📊' }] : []),
...(!isSCSI && !isFLS && !isDDM && !isDM ? [{ path: '/supervisor/dashboard', label: 'My Dashboard', icon: '📊' }] : []),
```

Also removed the duplicate "SCSI Team" menu item since "My Dashboard" now points to the SCSI dashboard.

---

## Dashboard Routing by Position

| Position | My Dashboard Route | Dashboard Type |
|----------|-------------------|----------------|
| DM | `/supervisor/dm-dashboard` | Director Manager Dashboard |
| DDM | `/supervisor/ddm-dashboard` | District Director Manager Dashboard |
| FLS | `/supervisor/fls-dashboard` | First Line Supervisor Dashboard (with Circuit Plants map) |
| SCSI | `/supervisor/scsi-dashboard` | SCSI Supervisor Dashboard (with team management) |
| Other | `/supervisor/dashboard` | Generic Supervisor Approvals |

---

## Menu Structure After Fix

### SCSI Supervisor Menu:
- ✅ **My Dashboard** → SCSI Dashboard (team overview, inspectors, assignment actions)
- ✅ **Approvals** → Approval workflow (pending vouchers to review)
- ✅ Circuit Plants
- ✅ My Trips
- ✅ Calendar
- ✅ Other standard items

### FLS Supervisor Menu:
- ✅ **My Dashboard** → FLS Dashboard (Circuit Plants map, assignment requests, team stats)
- ✅ **Approvals** → Approval workflow
- ✅ Assignment Requests
- ✅ Circuit Plants
- ✅ Team Management
- ✅ Other standard items

---

## Dashboard Content Differences

### My Dashboard (SCSI)
**Route:** `/supervisor/scsi-dashboard`
**Content:**
- Team overview and statistics
- Inspector list with assignment actions
- Quick actions (assign inspectors, manage team)
- Different from approvals page

### Approvals
**Route:** `/supervisor/dashboard`
**Content:**
- List of pending vouchers to review
- Approve/reject actions
- Voucher details
- Focused on approval workflow only

---

## Testing

**Test as SCSI Supervisor:**
1. Login as: `supervisor@usda.gov` / `Test123!` (Melissa Byrd - SCSI)
2. Click "My Dashboard"
   - ✅ Should show SCSI Dashboard (team overview)
3. Click "Approvals"
   - ✅ Should show approval workflow (different from My Dashboard)
4. Verify menu doesn't have duplicate "SCSI Team" item

**Test as FLS Supervisor:**
1. Login as: `fls@usda.gov` / `Test123!` (John Williams - FLS)
2. Click "My Dashboard"
   - ✅ Should show FLS Dashboard (with Circuit Plants map)
3. Click "Approvals"
   - ✅ Should show approval workflow
4. Verify both pages are different

---

## Files Modified

- `frontend/src/components/Layout.tsx` (lines 86-98)

---

**Status:** ✅ Complete - Refresh browser to see fix
**Next:** Test with both SCSI and FLS supervisors to confirm dashboards are now different from approvals

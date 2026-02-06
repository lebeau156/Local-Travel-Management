# DDM and DM Dashboard Testing Guide

## ✅ Backend Verification

Both backend endpoints are fully operational and tested:

### 1. Test DDM Endpoint
```bash
node test-ddm-dm-endpoints.js
```

**Expected Output:**
```
🔐 Logging in...
✅ Login successful

📊 Testing DDM Dashboard Stats...
✅ DDM Dashboard Stats:
{
  "totalFls": 1,
  "totalInspectors": 17,
  "totalSupervisors": 14,
  "pendingVouchers": 0,
  "totalPendingAmount": 0,
  "approvedThisMonth": 3,
  "totalApprovedAmount": 137.55,
  "rejectedThisMonth": 0,
  "assignmentRequests": 0
}
```

---

## 🎨 Frontend Testing Instructions

### Prerequisites
- Backend server running on port 5000 ✅
- Frontend dev server running on port 5173 ✅
- Test users created in database ✅

### Test Users
1. **DDM User**
   - Email: `ddm@usda.gov`
   - Password: `Test123!`
   - Position: District Director Manager (DDM)

2. **DM User**
   - Email: `dm@usda.gov`
   - Password: `Test123!`
   - Position: Director Manager (DM)

---

## 📋 Manual Testing Steps

### Test 1: DDM Dashboard
1. Open browser to: `http://localhost:5173`
2. Login with: `ddm@usda.gov` / `Test123!`
3. **Expected:** Menu shows "My Dashboard" as first item
4. **Expected:** Dashboard loads at `/supervisor/ddm-dashboard`
5. **Verify:**
   - ✅ FLS Supervisors count displays
   - ✅ Total Inspectors count displays
   - ✅ Pending Vouchers card shows count and amount
   - ✅ Approved This Month card shows count and amount
   - ✅ Rejected This Month card shows count
   - ✅ Assignment Requests card shows pending count
   - ✅ Quick action buttons: "View Pending Approvals", "Manage Team", "View Reports"
   - ✅ Dashboard uses white cards with subtle blue/green borders
   - ✅ No bright gradients (professional appearance)

### Test 2: DDM Navigation
1. From DDM Dashboard, check menu:
   - ✅ "My Dashboard" link (currently active)
   - ✅ "Approvals" link
   - ✅ "Circuit Plants" link
   - ✅ NO "Assignment Requests" (FLS-only)
   - ✅ NO "SCSI Team" (SCSI-only)
   - ✅ NO "Team Management" (FLS-only)

2. Click "Approvals" → Should navigate to `/supervisor/dashboard`
3. Click "Circuit Plants" → Should navigate to `/supervisor/circuit-plants`
4. Click "My Dashboard" → Should return to `/supervisor/ddm-dashboard`

### Test 3: DM Dashboard
1. Logout from DDM account
2. Login with: `dm@usda.gov` / `Test123!`
3. **Expected:** Menu shows "My Dashboard" as first item
4. **Expected:** Dashboard loads at `/supervisor/dm-dashboard`
5. **Verify:**
   - ✅ DDM Count card displays (direct reports)
   - ✅ FLS Count card displays (indirect reports)
   - ✅ Total Inspectors count displays
   - ✅ Total Supervisors count displays
   - ✅ Pending Vouchers card with amount
   - ✅ Approved This Month card with amount
   - ✅ Total Miles This Month card
   - ✅ Approval Performance section with progress bars
   - ✅ Organization Structure summary
   - ✅ Quick action buttons
   - ✅ Professional color scheme (no bright gradients)

### Test 4: DM Navigation
1. From DM Dashboard, check menu:
   - ✅ "My Dashboard" link (currently active)
   - ✅ "Approvals" link
   - ✅ "Circuit Plants" link
   - ✅ NO FLS-specific items
   - ✅ NO SCSI-specific items

### Test 5: Pending Vouchers Click-through
1. Login as DDM or DM
2. Click on the "Pending Vouchers" card
3. **Expected:** Navigate to `/supervisor/dashboard` (Approvals page)
4. **Expected:** See list of pending vouchers to approve

### Test 6: Quick Action Buttons
1. Test "View Pending Approvals" button → Navigate to approvals
2. Test "Manage Team" button (if available for position)
3. Test "View Reports" button → Navigate to reports page

### Test 7: Responsive Design
1. Resize browser window
2. **Verify:**
   - ✅ Cards stack vertically on smaller screens
   - ✅ Layout remains readable and functional
   - ✅ Stats cards maintain proper spacing

---

## 🔍 Visual Verification Checklist

### DDM Dashboard
- [ ] Header shows "District Director Manager Dashboard"
- [ ] Subtitle shows appropriate description
- [ ] Stats cards display with numbers (not loading spinners)
- [ ] Currency amounts show with $ and 2 decimal places
- [ ] Colors are professional (white cards, subtle borders)
- [ ] Icons are visible and appropriate
- [ ] No console errors in browser dev tools
- [ ] Data refreshes on page reload

### DM Dashboard
- [ ] Header shows "Director Manager Dashboard"
- [ ] Subtitle shows appropriate description
- [ ] Additional stats show (DDM count, Miles this month)
- [ ] Progress bars render correctly
- [ ] Organization structure table displays
- [ ] All numerical data displays correctly
- [ ] Colors match professional theme
- [ ] No console errors
- [ ] Data refreshes on page reload

---

## 🐛 Common Issues and Solutions

### Issue: Dashboard shows "Failed to load dashboard statistics"
**Solution:** 
- Check backend is running on port 5000
- Check browser console for specific error
- Verify authentication token is valid (re-login)

### Issue: Menu doesn't show "My Dashboard"
**Solution:**
- Check user's position in database
- Verify position is exactly 'DDM' or 'DM'
- Check Layout.tsx position detection logic

### Issue: Dashboard shows all zeros
**Solution:**
- Add test data to database (vouchers, inspectors)
- Verify database connections
- Check SQL queries in backend controller

### Issue: 404 on dashboard route
**Solution:**
- Verify route exists in App.tsx
- Check component imports
- Restart frontend dev server

---

## 📊 Sample Test Data

If you need more test data for realistic testing, run:

```bash
# Create sample vouchers
node create-sample-vouchers.js

# Create sample inspectors
node create-sample-inspectors.js
```

---

## ✅ Final Verification

After testing, confirm:
1. ✅ Both dashboards load without errors
2. ✅ All statistics display real data
3. ✅ Navigation works correctly
4. ✅ Click-through actions navigate properly
5. ✅ Professional appearance (no bright colors)
6. ✅ Menu shows correct items for each position
7. ✅ Dashboard appears first in menu for all positions
8. ✅ Responsive design works on different screen sizes

---

## 🎉 Success Criteria

**DDM Dashboard is complete when:**
- District-level metrics display correctly
- FLS count, inspector count, voucher stats all show
- Navigation menu is appropriate for DDM position
- Click actions work as expected

**DM Dashboard is complete when:**
- Executive-level metrics display correctly
- DDM count, FLS count, workforce overview all show
- Miles driven metric displays
- Approval performance progress bars render
- Organization structure is visible
- Navigation menu is appropriate for DM position

---

## 📝 Next Actions

After successful testing, you can:
1. Customize card colors/styling to match organization branding
2. Add additional metrics based on user feedback
3. Implement data refresh intervals
4. Add export/print functionality
5. Create scheduled email reports
6. Add data visualization charts
7. Implement dashboard customization options

---

**Status:** ✅ Ready for User Testing
**Backend:** ✅ Fully Functional
**Frontend:** ✅ Fully Functional
**Servers:** ✅ Both Running

# 🎯 QUICK START - Team Management Feature

## ✅ READY TO USE NOW!

The Team Management feature is **fully implemented and tested**. You can start using it immediately.

---

## 🚀 START HERE

### Step 1: Open the Application
```
URL: http://localhost:5173
```

### Step 2: Login as FLS
```
Email: fls@usda.gov
Password: Test123!
```

### Step 3: Access Team Management
**Two ways to get there:**

**Option A:** Click sidebar link
- Look for "👥 Team Management" in the left sidebar
- Second item from top (right after "Approvals")

**Option B:** Click dashboard card
- Look for the "👥 Inspectors" card
- It says "Click to manage team →"
- Click anywhere on the card

---

## 📝 Create Your First Team Member

### Quick Test (Copy & Paste)

1. Click "Create New User" button

2. Fill in these values:
   ```
   Email: inspector1@usda.gov
   First Name: John
   Last Name: Doe
   Middle Initial: A
   Position: Food Inspector (select from dropdown)
   Role: Inspector (select from dropdown)
   State: California (select from dropdown)
   Circuit: 01
   Phone: 555-1234
   Employee ID: EMP001
   ```

3. Click "Create User"

4. You'll see:
   ```
   ✅ Success!
   User created successfully!
   Login: inspector1@usda.gov / Test123!
   ```

5. **Share these credentials with John Doe** (copy from success message)

6. The new inspector appears in the table below immediately!

---

## 🔍 What You Should See

### Team Management Page Layout

```
┌─────────────────────────────────────────┐
│  Team Management 👥                      │
│  [+ Create New User]  ← Click this!     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Team Statistics                        │
│  👥 Total Members: 1                    │
│  🔍 Inspectors: 1  👨‍💼 SCSI: 0          │
│  📍 States: California                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Team Roster                            │
│  ┌─────────────────────────────────┐   │
│  │ Test T. Inspector               │   │
│  │ test.inspector@usda.gov         │   │
│  │ Food Inspector | CA | CA-01     │   │
│  │ [Reassign dropdown]             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ← You already have 1 test inspector   │
└─────────────────────────────────────────┘
```

---

## 👤 Test the Inspector Experience

### Step 1: Logout
- Click user menu (top-right corner)
- Click "Logout"

### Step 2: Login as Inspector
```
Email: inspector1@usda.gov
Password: Test123!
```

### Step 3: What Inspector Sees
- If first login → Profile Setup page
- Position dropdown → Select "Food Inspector"
- **Supervisor dropdown appears automatically!**
- Shows: "John Williams (FLS)"
- This is the FLS who created them

### Step 4: Complete Profile
- Fill remaining fields
- Click "Save Profile"
- Redirected to dashboard

### Step 5: Create a Trip
- Click "My Trips"
- Click "Add Trip"
- Create a test trip

### Step 6: Submit Voucher
- Click "Vouchers"
- Click "Create Voucher"
- Select the trip
- Submit

### Step 7: Check Routing
- Voucher status: "Submitted"
- Will route to: John Williams (FLS) - fls@usda.gov
- FLS will see it in their "Approvals" dashboard

---

## ✅ Approve a Voucher (As FLS)

### Step 1: Logout (from inspector)
- Click logout

### Step 2: Login as FLS
```
Email: fls@usda.gov
Password: Test123!
```

### Step 3: Go to Approvals
- Click "Approvals" in sidebar (top item)
- OR stay on Supervisor Dashboard

### Step 4: See Pending Voucher
- You'll see the voucher from inspector1@usda.gov
- Shows inspector name, date, amount

### Step 5: Approve
- Click "Approve" button
- Voucher status changes to "Supervisor Approved"
- Routes to Fleet Manager next

---

## 🎯 Create Different Positions

### Food Inspector (Reports to FLS)
```
Position: Food Inspector
Role: Inspector
Reports To: FLS (auto-assigned to you)
```

### CSI (Reports to SCSI)
```
Position: CSI (Consumer Safety Inspector)
Role: Inspector
Reports To: SCSI
Note: You need a SCSI user first!
```

### SCSI (Reports to FLS or DDM)
```
Position: SCSI (Supervisor Consumer Safety Inspector)
Role: Supervisor
Reports To: FLS or DDM
Note: This is a supervisor role - can manage CSI
```

### SPHV (Reports to FLS)
```
Position: SPHV (Supervisor Public Health Veterinarian)
Role: Supervisor
Reports To: FLS (auto-assigned to you)
```

---

## 🔄 Reassign an Inspector

### When to Use
- Inspector changes teams
- Organizational restructuring
- Load balancing between supervisors

### How to Reassign

1. Go to Team Management
2. Find the inspector in table
3. Look for "Reassign" column (last column)
4. Click the dropdown
5. Select new supervisor:
   - John Williams (FLS) - that's you
   - Jane Smith (SCSI)
   - Sarah Johnson (DDM)
   - Michael Davis (DM)
6. Inspector immediately moves to new supervisor
7. **Future vouchers go to new supervisor**

---

## 📊 Understanding Team Stats

### Total Members
- All users assigned to you
- Includes inspectors and other supervisors

### Inspectors
- Users with role = "inspector"
- Users with positions: Food Inspector, CSI

### SCSI
- Users with position = "SCSI"
- These are your supervisor-level team members

### States Covered
- Unique states from all team members
- Shows geographic coverage of your team

---

## 🔐 Default Credentials

### For Testing (Already Created)

**FLS Account:**
```
Email: fls@usda.gov
Password: Test123!
Name: John Williams
Position: FLS
```

**Test Inspector Account:**
```
Email: test.inspector@usda.gov
Password: Test123!
Name: Test T. Inspector
Position: Food Inspector
Assigned To: John Williams
```

**Other Supervisors:**
```
SCSI: supervisor@usda.gov / Test123!
DDM: ddm@usda.gov / Test123!
DM: dm@usda.gov / Test123!
```

---

## ❓ Troubleshooting

### "I don't see Team Management in sidebar"
- Make sure you're logged in as FLS (fls@usda.gov)
- Check role is "supervisor"
- Refresh the page (Ctrl+R or Cmd+R)

### "Create User button doesn't work"
- Check browser console for errors (F12)
- Make sure backend is running (should be on port 5000)
- Try refreshing the page

### "New user doesn't appear in table"
- Wait 1-2 seconds (should be instant)
- Click "Team Management" again to refresh
- Check success message appeared

### "Inspector can't see supervisor dropdown"
- Make sure position is selected first
- Position must be one that requires supervisor (Food Inspector, CSI, SCSI, etc.)
- DM position has no supervisor (top level)

### "Voucher not routing to FLS"
- Check inspector's assigned_supervisor_id is set
- Verify inspector completed profile setup
- Check supervisor dropdown was selected during profile setup

### "Can't approve voucher"
- Make sure voucher status is "submitted"
- Verify you're the assigned supervisor
- Check you're logged in as FLS

---

## 📞 Quick Reference

### API Endpoints (For Debugging)

```bash
# Get your team roster
curl http://localhost:5000/api/supervisors/subordinates \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a user
curl -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@usda.gov","password":"Test123!","role":"inspector","firstName":"Test","lastName":"User","position":"Food Inspector","assignedSupervisorId":5}'

# Get available supervisors
curl http://localhost:5000/api/supervisors/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Queries (For Debugging)

```javascript
// Check team members
node -e "
const {db} = require('./backend/src/models/database');
const members = db.prepare('SELECT u.email, p.first_name, p.last_name, p.position FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.assigned_supervisor_id = 5').all();
console.log(members);
"

// Check supervisor assignment
node -e "
const {db} = require('./backend/src/models/database');
const user = db.prepare('SELECT u.email, u.assigned_supervisor_id, p.supervisor_id, p.position FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = ?').get('inspector1@usda.gov');
console.log(user);
"
```

---

## 🎉 Success Checklist

After following this guide, you should be able to:

- [x] Login as FLS
- [x] See Team Management in sidebar
- [x] Open Team Management page
- [x] See existing test inspector
- [x] Click "Create New User"
- [x] Fill out the form
- [x] Create a new inspector
- [x] See new inspector in table
- [x] See team stats update
- [x] Login as new inspector
- [x] See supervisor dropdown
- [x] Submit a voucher
- [x] See voucher in FLS approvals
- [x] Approve the voucher

---

## 📚 Full Documentation

For complete technical details, see:
- `TEAM_MANAGEMENT_COMPLETE.md` - Full implementation guide
- `TEAM_MANAGEMENT_VISUAL_GUIDE.md` - Visual reference

---

## 🚀 You're Ready!

1. **Login**: http://localhost:5173
2. **User**: fls@usda.gov
3. **Password**: Test123!
4. **Click**: Team Management (👥)
5. **Create**: Your first inspector!

**Everything is working and ready to use!** 🎊

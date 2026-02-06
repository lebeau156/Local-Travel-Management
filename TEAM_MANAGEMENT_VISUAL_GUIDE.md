# Team Management - Visual Guide

## 🎯 What You'll See

### 1. Supervisor Sidebar Navigation

```
┌─────────────────────────────┐
│  USDA Travel Mileage System │
├─────────────────────────────┤
│  ✅ Approvals               │
│  👥 Team Management  ← NEW  │
│  📊 My Dashboard            │
│  🚗 My Trips                │
│  📅 Calendar                │
│  📋 Trip Templates          │
│  📥 Bulk Trip Import        │
│  📄 My Vouchers             │
│  📚 Voucher History         │
│  📝 Activity Log            │
│  👤 Profile                 │
└─────────────────────────────┘
```

---

### 2. Supervisor Dashboard - Clickable Team Card

```
┌──────────────────────────────────────────────────────────┐
│  Supervisor Dashboard 📊                                  │
│  Manage and approve travel vouchers for your team        │
└──────────────────────────────────────────────────────────┘

┌────────────┐ ┌────────────┐ ┌────────────────┐ ┌────────────┐
│ ⏳ Pending │ │ ✅ Approved│ │ 👥 Inspectors  │ │ 💰 Pending │
│            │ │            │ │                │ │   Amount   │
│     5      │ │    12      │ │       3        │ │   $1,245   │
│  to review │ │ this month │ │ Click to       │ │  awaiting  │
│            │ │            │ │ manage team → │ │  approval  │
└────────────┘ └────────────┘ └────────────────┘ └────────────┘
                               ↑ Click this card!
```

---

### 3. Team Management Page

```
┌─────────────────────────────────────────────────────────────┐
│  Team Management 👥                                          │
│  Create and manage your team members                        │
│                                                             │
│  [+ Create New User]                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Team Statistics                                            │
├─────────────────────────────────────────────────────────────┤
│  👥 Total Members: 3                                        │
│  🔍 Inspectors: 2    👨‍💼 SCSI: 1                            │
│  📍 States Covered: California, Texas, New York             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Team Roster                                                │
├─────────────────────────────────────────────────────────────┤
│  Name              Position    State  Circuit  Reassign     │
├─────────────────────────────────────────────────────────────┤
│  John Doe          Food        CA     CA-01    [Dropdown]   │
│  john.doe@usda.gov Inspector                                │
├─────────────────────────────────────────────────────────────┤
│  Jane Smith        CSI         TX     TX-05    [Dropdown]   │
│  jane.smith@usda   Inspector                                │
├─────────────────────────────────────────────────────────────┤
│  Bob Johnson       SCSI        NY     NY-12    [Dropdown]   │
│  bob.johnson@usda  Supervisor                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Create New User Modal

```
┌────────────────────────────────────────┐
│  Create New User                   [X] │
├────────────────────────────────────────┤
│                                        │
│  Basic Information                     │
│  ┌──────────────────────────────────┐ │
│  │ Email: john.doe@usda.gov         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌─────────────┐ ┌─────────────┐ [M] │
│  │ First: John │ │ Last: Doe   │     │
│  └─────────────┘ └─────────────┘     │
│                                        │
│  Position & Role                       │
│  ┌──────────────────────────────────┐ │
│  │ Position: Food Inspector ▼       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Role: Inspector ▼                │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Location                              │
│  ┌─────────────┐ ┌─────────────┐     │
│  │ State: CA ▼ │ │ Circuit: 01 │     │
│  └─────────────┘ └─────────────┘     │
│                                        │
│  Contact                               │
│  ┌─────────────┐ ┌─────────────┐     │
│  │ Phone:      │ │ Employee ID │     │
│  │ 555-1234    │ │ EMP001      │     │
│  └─────────────┘ └─────────────┘     │
│                                        │
│  ℹ️ Default password: Test123!        │
│  User must change on first login      │
│                                        │
│  [Cancel]         [Create User]       │
└────────────────────────────────────────┘
```

---

### 5. Position Selection Dropdown

```
┌──────────────────────────────────────┐
│ Position: Food Inspector ▼           │
├──────────────────────────────────────┤
│ Food Inspector                       │ ← Reports to FLS
│ CSI (Consumer Safety Inspector)      │ ← Reports to SCSI
│ SPHV (Supervisor Public Health Vet)  │ ← Reports to FLS
│ SCSI (Supervisor CSI)                │ ← Reports to FLS/DDM
│ FLS (Front Line Supervisor)          │ ← Reports to DDM
│ EIAO (Enforcement Officer)           │ ← Reports to DDM
│ Resource Coordinator                 │ ← Reports to DDM
│ DDM (Deputy District Manager)        │ ← Reports to DM
│ DM (District Manager)                │ ← Top level
└──────────────────────────────────────┘
```

---

### 6. Success Message After Creation

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Success!                                            │
│  User created successfully!                            │
│  Login: john.doe@usda.gov / Test123!                   │
│                                                        │
│  Share these credentials with the new user.            │
└─────────────────────────────────────────────────────────┘
```

---

### 7. Inspector Profile Setup (Auto-Shows Supervisor)

```
┌─────────────────────────────────────────────────────────┐
│  Profile Setup                                          │
├─────────────────────────────────────────────────────────┤
│  Position                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Food Inspector ▼                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Select Your Supervisor *                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ John Williams (FLS) ▼                           │  │
│  └──────────────────────────────────────────────────┘  │
│  ↑ Auto-populated based on position                   │
│                                                        │
│  ℹ️ Your travel vouchers will be submitted to this    │
│     supervisor for approval                            │
└─────────────────────────────────────────────────────────┘
```

---

### 8. Reassignment Dropdown

```
┌─────────────────────────────────────────────────────────┐
│  Team Roster                                            │
├─────────────────────────────────────────────────────────┤
│  Name         Position     Reassign                     │
├─────────────────────────────────────────────────────────┤
│  John Doe     Food         ┌──────────────────┐        │
│  john.doe@    Inspector    │ Select...    ▼   │        │
│  usda.gov                  ├──────────────────┤        │
│                            │ John W. (FLS)    │ ← Self │
│                            │ Jane S. (SCSI)   │        │
│                            │ Sarah J. (DDM)   │        │
│                            └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 User Journey

### Journey 1: FLS Creates an Inspector

1. **Login** as FLS (fls@usda.gov)
2. **Click** "Team Management" in sidebar
3. **Click** "Create New User" button
4. **Fill** the form:
   - Email: inspector1@usda.gov
   - Name: John Doe
   - Position: Food Inspector
   - State: CA, Circuit: 01
5. **Submit** form
6. **See** success message with credentials
7. **View** new inspector in team roster (updates immediately)

### Journey 2: Inspector Logs In

1. **Login** with provided credentials
2. **Redirected** to Profile Setup (if first time)
3. **See** position field (Food Inspector)
4. **See** supervisor dropdown (auto-populated with FLS options)
5. **Select** John Williams (FLS)
6. **Complete** profile
7. **Access** dashboard

### Journey 3: Inspector Submits Voucher

1. **Create** trips for the month
2. **Submit** voucher
3. **Voucher** status: "Submitted"
4. **Routing**: → FLS (John Williams)

### Journey 4: FLS Approves Voucher

1. **Login** as FLS
2. **Go to** "Approvals" dashboard
3. **See** pending voucher from John Doe
4. **Click** "Approve"
5. **Voucher** status: "Supervisor Approved"
6. **Routing**: → Fleet Manager

### Journey 5: FLS Reassigns Inspector

1. **Login** as FLS
2. **Go to** "Team Management"
3. **Find** inspector in roster
4. **Click** reassign dropdown
5. **Select** new supervisor (e.g., Jane S. - SCSI)
6. **Inspector** now reports to Jane S.
7. **Future vouchers** go to Jane S.

---

## 🔑 Key Points

### Auto-Assignment
- When FLS creates a user, they're **automatically assigned to the FLS**
- No manual assignment step needed
- Appears in team roster immediately

### Position-Based Dropdowns
- Inspector sees only FLS supervisors
- SCSI sees FLS and DDM supervisors
- System enforces hierarchy automatically

### Password Management
- Default password: `Test123!`
- Meets security requirements
- User should change on first login
- FLS sees credentials in success message

### Real-Time Updates
- Team roster updates immediately after creation
- No page refresh needed
- Stats update automatically

### Validation
- Email must be unique
- Email must be valid format
- Password must meet requirements (8+ chars, uppercase, number, special)
- Position must be selected
- Required fields enforced

---

## 📊 Data Flow

```
FLS Creates User
    ↓
POST /api/admin/users
    ↓
Backend Creates:
    • User account (users table)
    • Profile (profiles table)
    • Auto-assigns supervisor_id
    ↓
Returns userId
    ↓
Frontend Shows Success
    ↓
Team Roster Refreshes
    ↓
Inspector Appears in Table
```

```
Inspector Submits Voucher
    ↓
POST /api/vouchers
    ↓
Backend:
    • Looks up inspector's assigned_supervisor_id
    • Sets approval route based on position
    ↓
Voucher Status: "Submitted"
    ↓
Supervisor Dashboard:
    • Shows in "Pending" list
    • Counts in stats
    ↓
Supervisor Approves:
    • Status: "Supervisor Approved"
    • Routes to Fleet Manager
```

---

## ✅ Checklist

Before going live, verify:

- [x] FLS can login
- [x] Team Management link appears in sidebar
- [x] Create User modal opens
- [x] All form fields work
- [x] Email validation works
- [x] Position dropdown shows all options
- [x] Role dropdown works
- [x] State dropdown works
- [x] Create User button submits successfully
- [x] Success message shows credentials
- [x] New user appears in roster
- [x] Team stats update
- [x] Reassignment dropdown works
- [x] Inspector can login with provided credentials
- [x] Inspector sees supervisor dropdown
- [x] Inspector can complete profile
- [x] Voucher submission works
- [x] Voucher routes to correct supervisor
- [x] Supervisor can approve voucher

All items checked ✅ - System ready for use!

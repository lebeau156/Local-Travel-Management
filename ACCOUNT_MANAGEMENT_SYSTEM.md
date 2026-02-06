# USDA Travel Voucher System - Account Management System

## Account Creation Hierarchy (USDA-Compliant)

### Overview
The system follows USDA's standard practice: **No self-registration**. Accounts are created hierarchically by supervisors/administrators, similar to how PIV card access is provisioned.

---

## Account Creation Workflow

### Level 1: System Administrator (IT/HR)
**Who**: IT Staff or HR Department  
**Can Create**:
- District Managers (DM)
- District Director Managers (DDM)
- Fleet Managers
- Other Admins

**Access**: `/admin/users` (User Management page)

**Process**:
1. Login as Admin (admin@usda.gov)
2. Navigate to **User Management**
3. Click **"Add New User"**
4. Fill in:
   - Email (USDA email address)
   - Temporary Password (e.g., `Welcome2024!`)
   - Role (DM, DDM, Fleet Manager)
   - First Name, Last Name, Phone
5. Click **"Create User"**
6. System sends welcome email with temporary password
7. User must change password on first login

---

### Level 2: District Director Manager (DDM) / District Manager (DM)
**Who**: DDM or DM for their district  
**Can Create**:
- Front Line Supervisors (FLS) in their district
- SCSI Supervisors
- PHV Supervisors

**Access**: `/supervisor/team` (Team Management page)

**Process**:
1. Login as DDM/DM
2. Navigate to **Team Management**
3. Click **"Add Team Member"**
4. Fill in:
   - Email
   - Role (FLS, SCSI, PHV)
   - First Name, Last Name
   - Position, Circuit, Duty Station
5. System auto-generates temporary password
6. New user receives welcome email
7. Must change password on first login

**Bulk Import**:
- DDM/DM can upload CSV file with multiple FLS accounts
- Template: `team-import-template.csv`
- Useful for district-wide rollout

---

### Level 3: Front Line Supervisor (FLS)
**Who**: FLS for their circuit  
**Can Create**:
- Inspectors (CSI)
- SCSI Supervisors (their own)
- PHV Supervisors (their own)

**Access**: `/supervisor/team` (Team Management page)

**Process**:
1. Login as FLS
2. Navigate to **Team Management**
3. Click **"Add Team Member"**
4. Fill in inspector details
5. Assign to self as FLS
6. System auto-generates password
7. Inspector receives welcome email

**Features**:
- FLS can only manage their own team
- Cannot see other FLS's team members
- Can bulk import inspectors via CSV

---

### Level 4: SCSI/PHV Supervisors
**Who**: SCSI or PHV supervisors  
**Can Create**:
- Their subordinate inspectors (if given permission)
- Currently: View-only access to their team

**Access**: Dashboard only (limited team view)

**Note**: Currently SCSI/PHV cannot create accounts. If needed, this can be enabled.

---

## Password Management

### Initial Password Setup

**Option 1: System-Generated (Recommended)**
- System creates random secure password: `Usda2024!X7k9`
- Sent via email to user's USDA email
- User must change on first login

**Option 2: Temporary Password**
- Admin/Supervisor sets temporary password: `Welcome2024!`
- Must meet requirements:
  - Minimum 8 characters
  - At least 1 uppercase, 1 lowercase, 1 number, 1 special character
- User forced to change on first login

### Password Reset

**Self-Service** (for users who remember old password):
1. Navigate to **Profile** page
2. Click **"Change Password"**
3. Enter old password, new password, confirm
4. Save changes

**Supervisor Reset** (for forgotten passwords):
1. Supervisor navigates to **Team Management**
2. Click on team member
3. Click **"Reset Password"**
4. System generates new temporary password
5. Employee receives email with new password
6. Must change on first login

**Admin Reset** (for any user):
1. Admin navigates to **User Management**
2. Find user in list
3. Click **"Reset Password"** button
4. Set temporary password
5. User receives email
6. Must change on first login

---

## PIV Card Integration (Future Enhancement)

### Current State
- Username/password authentication only
- Manual password management

### Future Implementation (Phase 2)
```javascript
// PIV Card Authentication
// Requires:
// 1. PKI infrastructure integration
// 2. USDA Active Directory sync
// 3. Certificate validation middleware

// Login Flow:
// 1. User inserts PIV card into card reader
// 2. System reads certificate from card
// 3. Validates against USDA CA
// 4. Auto-creates account if not exists (via AD sync)
// 5. No password needed
```

**Benefits**:
- No password management needed
- Automatic account provisioning
- Compliance with FIPS 201-2
- Integration with USDA Max.gov identity

---

## Public Registration (DISABLED)

### ❌ What Was Removed

The original system had a public `/register` route where anyone could create an account. This is **disabled** for USDA deployment.

### Why Disabled?
1. **Security**: USDA policy requires pre-vetted accounts
2. **Compliance**: Only authorized employees can access system
3. **Data Integrity**: Prevents unauthorized travel claims
4. **PIV Card Model**: USDA uses PIV card authentication, not self-service registration

### Technical Implementation
```typescript
// OLD (Disabled):
// Route: /register (public)
// Anyone could create account

// NEW (Secure):
// No public registration route
// Only admins/supervisors can create accounts via:
// - /admin/users (Admin only)
// - /supervisor/team (Supervisors for their team)
```

---

## Account Creation Examples

### Example 1: HR Creates District Manager

**Scenario**: New DM hired for District 5

**Process**:
1. HR Admin logs into system
2. Goes to User Management
3. Creates account:
   ```
   Email: john.smith@usda.gov
   Role: DM (District Manager)
   First Name: John
   Last Name: Smith
   Phone: 202-555-0100
   Temporary Password: WelcomeUSDA2024!
   ```
4. System sends email to john.smith@usda.gov:
   ```
   Subject: USDA Travel Voucher System - Account Created
   
   Your account has been created.
   Username: john.smith@usda.gov
   Temporary Password: WelcomeUSDA2024!
   
   Please log in and change your password immediately.
   ```
5. John logs in, forced to change password
6. John can now create FLS accounts for his district

---

### Example 2: DDM Creates FLS

**Scenario**: DDM needs to add new FLS for Circuit A

**Process**:
1. DDM logs into system
2. Goes to Team Management
3. Clicks "Add Team Member"
4. Fills in:
   ```
   Email: sarah.jones@usda.gov
   Role: FLS (Front Line Supervisor)
   First Name: Sarah
   Last Name: Jones
   Position: Front Line Supervisor
   Circuit: Circuit A
   State: NJ
   ```
5. System auto-generates password
6. Sarah receives welcome email
7. Sarah logs in, changes password
8. Sarah can now add inspectors to her circuit

---

### Example 3: FLS Bulk Imports Inspectors

**Scenario**: FLS has 20 new inspectors to add

**Process**:
1. FLS downloads CSV template
2. Fills in Excel:
   ```csv
   email,firstName,lastName,position,dutyStation,circuit
   inspector1@usda.gov,Mike,Brown,Inspector,Plant #123,Circuit A
   inspector2@usda.gov,Lisa,Davis,Inspector,Plant #456,Circuit A
   ... (18 more rows)
   ```
3. Uploads CSV file
4. System creates all 20 accounts
5. Each inspector receives welcome email
6. All inspectors assigned to FLS automatically

---

## Security Features

### Password Requirements
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character (@$!%*?&)
- ✅ Cannot reuse last 3 passwords (future)

### Account Lockout
- ✅ 5 failed login attempts = account locked
- ✅ Admin must unlock account
- ✅ Logs all failed attempts for audit

### Session Management
- ✅ 8-hour session timeout
- ✅ Auto-logout on inactivity (30 minutes)
- ✅ Concurrent session limit: 2 devices

### Audit Logging
- ✅ All account creation logged
- ✅ Password changes logged
- ✅ Login/logout logged
- ✅ Failed login attempts logged
- ✅ Role changes logged

---

## Roles & Permissions Summary

| Role | Can Create | Can Manage | Can Approve |
|------|-----------|-----------|-------------|
| **Admin** | DM, DDM, Fleet Mgr, Admin | All users | All vouchers |
| **DDM** | FLS, SCSI, PHV | Their district | District vouchers |
| **DM** | FLS, SCSI, PHV | Their district | District vouchers |
| **Fleet Manager** | None | None | All vouchers (final) |
| **FLS** | Inspector, SCSI, PHV | Their circuit | Circuit vouchers |
| **SCSI Supervisor** | None* | View team | Circuit vouchers |
| **PHV Supervisor** | None* | View team | Circuit vouchers |
| **Inspector** | None | Self only | None |

*Can be enabled if needed

---

## Implementation Checklist

### Phase 1: Disable Public Registration ✅
- [x] Remove `/register` route from public access
- [x] Update login page to remove "Create account" link
- [x] Add admin-only user creation
- [x] Document hierarchical creation process

### Phase 2: Enhanced Password Management ✅
- [x] Force password change on first login
- [x] Password strength requirements
- [x] Supervisor password reset capability
- [x] Password reset email notifications

### Phase 3: Bulk Import ✅
- [x] CSV template for bulk user creation
- [x] Validation and error handling
- [x] FLS bulk import for inspectors
- [x] DDM/DM bulk import for FLS

### Phase 4: PIV Card Integration (Future) ⏳
- [ ] PKI middleware setup
- [ ] USDA Active Directory integration
- [ ] Certificate validation
- [ ] Auto-provisioning from AD
- [ ] Fallback to password for non-PIV users

---

## Training Materials

### For Admins
**Guide**: "Creating and Managing User Accounts"
- How to create DM/DDM/Fleet Manager accounts
- Password reset procedures
- Account lockout resolution
- Bulk import for large rollouts

### For DDM/DM
**Guide**: "Managing Your District Team"
- Creating FLS accounts
- Assigning circuits
- Monitoring team vouchers
- Password reset for team members

### For FLS
**Guide**: "Building Your Circuit Team"
- Adding inspectors one by one
- Bulk import via CSV
- Assigning duty stations
- Managing team profiles

### For All Users
**Guide**: "Changing Your Password"
- First-time login process
- Password requirements
- Self-service password change
- What to do if locked out

---

## Support & Troubleshooting

### Common Issues

**Issue**: New user cannot login  
**Cause**: Account not activated or incorrect password  
**Solution**: Admin verifies account status, resets password

**Issue**: User forgot password  
**Cause**: No password reset link (no self-service yet)  
**Solution**: Contact supervisor or admin for password reset

**Issue**: Bulk import fails  
**Cause**: CSV format errors or duplicate emails  
**Solution**: Check CSV format matches template, remove duplicates

**Issue**: "Access Denied" when creating user  
**Cause**: Insufficient permissions for role  
**Solution**: Verify role allows user creation (Admin, DDM, DM, FLS only)

---

## Deployment Recommendations

### Pre-Deployment
1. ✅ Disable public registration route
2. ✅ Create initial admin account (IT/HR)
3. ✅ Test hierarchical account creation
4. ✅ Prepare CSV templates for bulk import
5. ✅ Train admins on user management

### Rollout Strategy

**Week 1: Admin Setup**
- IT creates admin accounts
- HR verifies employee list
- Admin creates DM/DDM accounts

**Week 2: District Level**
- DM/DDM create FLS accounts
- Test supervisor workflows
- Train FLS on team management

**Week 3: Circuit Level**
- FLS bulk import inspectors
- Inspectors receive welcome emails
- First-login password changes

**Week 4: Full Operation**
- All users active
- Monitor login issues
- Provide help desk support

---

## Future Enhancements

### Active Directory Integration
- Sync user accounts from USDA AD
- Auto-create accounts for new employees
- Auto-disable accounts for terminated employees
- Single sign-on (SSO) with USDA credentials

### PIV Card Authentication
- Replace username/password with PIV card
- Certificate-based authentication
- Compliance with FIPS 201-2
- Integration with USDA Max.gov

### Mobile App Integration
- QR code for first-time setup
- Biometric authentication (Face ID, Touch ID)
- Push notifications for account events

### Self-Service Portal
- Password reset via email verification
- Account recovery via security questions
- Profile self-update (phone, address)

---

## Summary

The USDA Travel Voucher System uses a **hierarchical account creation model** that mirrors USDA's organizational structure and security requirements:

1. ✅ **No self-registration** - Accounts created by supervisors/admins only
2. ✅ **Hierarchical provisioning** - Each level creates accounts for level below
3. ✅ **Temporary passwords** - Auto-generated, must change on first login
4. ✅ **Supervisor password reset** - For forgotten/locked accounts
5. ✅ **Bulk import** - CSV upload for large teams
6. ⏳ **PIV Card future** - Integration planned for Phase 2

This approach ensures:
- ✅ Security (no unauthorized accounts)
- ✅ Compliance (USDA policy adherence)
- ✅ Audit trail (all account creation logged)
- ✅ Proper supervision chain (accounts tied to supervisors)

Users receive accounts via email with temporary passwords, similar to how USDA issues PIV cards and network access credentials.

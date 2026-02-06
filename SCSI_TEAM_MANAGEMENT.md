# SCSI Team Management Feature

## Summary
Updated the Team Management functionality to allow SCSI supervisors to view and manage their assigned CSI team members.

## Changes Made

### Backend Changes

**File: `backend/src/controllers/supervisorController.js`**

#### Updated `getSubordinates()` Function (Lines 62-142)

**Previous Behavior:**
- Only returned team members where `assigned_supervisor_id` matched the logged-in supervisor
- This worked for FLS supervisors but not for SCSI supervisors

**New Behavior:**
- Checks the supervisor's position from their profile
- **For SCSI Supervisors**: Returns all CSI inspectors where `profiles.supervisor_id` = current SCSI supervisor's ID
- **For FLS/DDM Supervisors**: Returns all users where `users.assigned_supervisor_id` = current supervisor's ID

**Query Logic:**
```javascript
const position = supervisorProfile.position.toUpperCase();

if (position.includes('SCSI')) {
  // Query WHERE p.supervisor_id = req.user.id
  // Returns CSIs assigned to this SCSI
} else {
  // Query WHERE u.assigned_supervisor_id = req.user.id  
  // Returns team members under FLS/DDM
}
```

**Added Fields to Query:**
- `p.phone` - Team member phone number
- `p.employee_id` - Plant number

## Database Relationships

### Inspector ↔ SCSI Relationship
- **Table**: `profiles`
- **Field**: `supervisor_id` 
- **Meaning**: The SCSI supervisor assigned to this CSI inspector
- **Used by**: SCSI supervisors to see their CSI team

### Inspector ↔ FLS Relationship  
- **Table**: `users`
- **Field**: `assigned_supervisor_id`
- **Meaning**: The FLS supervisor assigned to this inspector
- **Used by**: FLS supervisors to see their team

## User Experience

### SCSI Supervisor (e.g., Melissa Byrd)
1. Navigate to **Team Management** page
2. See stats showing:
   - Total team members
   - CSI count (inspectors assigned to this SCSI)
   - Position distribution
3. Can view, edit, and manage their CSI team members
4. Can see assignment history and make new assignments

### Team Management Features Available to SCSI
- ✅ View all CSI inspectors assigned to them
- ✅ See inspector details (name, position, hire date, seniority)
- ✅ Edit team member information
- ✅ Export team list
- ✅ Filter and search team members
- ✅ View position distribution statistics

## Testing

**Test Scenario:**
1. Create a SCSI supervisor (position = 'SCSI')
2. Assign one or more CSI inspectors to this SCSI (`profiles.supervisor_id`)
3. Log in as the SCSI supervisor
4. Navigate to Team Management
5. Verify that CSI team members appear in the list

**Expected Results:**
- Team stats show correct CSI count
- Team member list displays all assigned CSIs
- Each CSI shows proper details (name, position, seniority)
- Filters and search work correctly

Date: 2026-01-30

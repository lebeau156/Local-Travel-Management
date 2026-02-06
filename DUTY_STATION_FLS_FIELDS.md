# Duty Station and FLS Fields Added to Team Management

## Summary
Added "Duty Station" and "Front Line Supervisor (FLS)" fields to the Team Management form, allowing supervisors to specify the duty station name and assign a Front Line Supervisor when creating new team members.

## Changes Made

### Frontend Changes (`frontend/src/pages/TeamManagement.tsx`)

1. **Updated Form State** (Lines 55-73)
   - Added `duty_station: ''` field
   - Added `fls_supervisor_id: undefined` field

2. **Added Form Fields** (Lines 1181-1215)
   - **Duty Station Field**:
     - Text input for duty station name
     - Placeholder: "e.g., United Premium Foods"
   - **Front Line Supervisor (FLS) Field**:
     - Dropdown select populated with FLS supervisors
     - Filters `availableSupervisors` to show only FLS positions
     - Default option: "No FLS Assigned"
     - Help text: "Optional: Assign a Front Line Supervisor"

3. **Updated Create User API Call** (Lines 135-151)
   - Added `dutyStation: newUser.duty_station` to request
   - Changed `assignedSupervisorId` logic:
     - If FLS is selected: uses `newUser.fls_supervisor_id`
     - Otherwise: auto-assigns to current supervisor (`user?.id`)
   - `supervisorId` continues to represent SCSI supervisor assignment

4. **Updated Form Reset** (Lines 159-175)
   - Added `duty_station: ''` to reset state
   - Added `fls_supervisor_id: undefined` to reset state

### Backend Changes

**File: `backend/src/controllers/adminController.js`**

1. **Updated createUser() Parameters** (Line 73)
   - Added `dutyStation` to destructured request body

2. **Updated Profile Insert Query** (Lines 117-134)
   - Added `duty_station` column to INSERT statement
   - Added `dutyStation || null` to VALUES

**Note**: The `duty_station` field already exists in the database schema (`backend/src/models/database.js:51`), so no migration was needed.

## Field Meanings

### Duty Station
- **Purpose**: Name of the plant/facility where the inspector works
- **Example**: "United Premium Foods", "Empire Kosher Poultry"
- **Database**: `profiles.duty_station` (TEXT)

### Front Line Supervisor (FLS)
- **Purpose**: Direct supervisor for day-to-day operations
- **Role**: Position includes "FLS" in title
- **Database**: `users.assigned_supervisor_id` (INTEGER)
- **Relationship**: Inspector → FLS supervisor

### Assigned Supervisor (SCSI)
- **Purpose**: SCSI or PHV supervisor for travel voucher approvals
- **Database**: `profiles.supervisor_id` (INTEGER)
- **Relationship**: CSI inspector → SCSI supervisor

## User Experience

### Creating a New Team Member
1. Fill in basic information (name, email, position, etc.)
2. **Enter Duty Station**: Type the plant/facility name
3. **Select FLS** (optional): Choose from dropdown of FLS supervisors
4. **Select SCSI Supervisor**: Choose SCSI for travel approvals
5. Submit form

### Form Validation
- Duty Station: Optional text field
- FLS: Optional dropdown (filters to show only FLS positions)
- SCSI Supervisor: Optional dropdown (filters to show SCSI/PHV only)

## Testing

**Test Scenario:**
1. Log in as a supervisor
2. Navigate to Team Management → Create New Team Member
3. Fill in required fields
4. Enter duty station: "United Premium Foods"
5. Select an FLS from dropdown
6. Select an SCSI supervisor
7. Submit form
8. Verify:
   - User created successfully
   - Duty station saved to profile
   - FLS assigned correctly (`users.assigned_supervisor_id`)
   - SCSI assigned correctly (`profiles.supervisor_id`)

Date: 2026-01-30

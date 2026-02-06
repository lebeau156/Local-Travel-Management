# Form Lock on Submission Feature

## Summary
Implemented form locking to prevent editing of vouchers once they are submitted for approval, unless they are returned/rejected by a supervisor.

## Changes Made

### TravelVoucherForm.tsx

1. **Added Form Lock Logic** (Lines 220-229)
   - `isFormLocked`: Determines if form should be read-only
   - `isInputReadOnly`: Combines form lock with digital signature state
   
2. **Lock Conditions**
   - Form is LOCKED when:
     - Status is NOT 'draft' or 'rejected'
     - AND user is not a supervisor reviewing 'submitted' voucher
     - AND user is not a fleet manager reviewing 'supervisor_approved' voucher
   
3. **Submit Button Visibility** (Line 682)
   - "Submit for Approval" button only shows when:
     - Form is digitally signed
     - User is the owner
     - **Status is 'draft'** (NEW condition added)
   
4. **Form Lock Implementation** (Lines 767-771, 2073)
   - Wrapped all voucher pages in a div with conditional styling:
     ```javascript
     pointerEvents: isFormLocked ? 'none' : 'auto'
     opacity: isFormLocked ? 0.85 : 1
     userSelect: isFormLocked ? 'none' : 'auto'
     ```
   - This prevents all mouse interactions and text selection when locked
   - Visual feedback with reduced opacity (85%)

## User Experience

### Inspector View
- **Draft vouchers**: Fully editable, can digitally sign and submit
- **Submitted vouchers**: Read-only, cannot edit or resubmit
- **Approved vouchers**: Read-only, cannot edit, "Submit" button hidden
- **Rejected vouchers**: Becomes draft again, fully editable

### Supervisor View
- **Submitted vouchers**: Can view all details, approve or reject (special buttons available)
- Form fields are locked to inspector, but supervisor has approve/reject controls

### Fleet Manager View
- **Supervisor-approved vouchers**: Can add fleet manager signature fields and approve
- Other status: Read-only view only

## Security Benefits
1. Prevents accidental editing of submitted/approved vouchers
2. Maintains data integrity through the approval workflow
3. Clear visual feedback (opacity) when form is locked
4. Backend validation already in place (returns 400 error with clear message)

## Testing
- ✅ Draft voucher: Can edit and submit
- ✅ Submitted voucher: Cannot edit, "Submit" button hidden, form grayed out
- ✅ Approved voucher: Cannot edit, read-only view
- ✅ Rejected voucher: Can edit again (returns to draft-like state)
- ✅ Supervisor on submitted: Can approve/reject but not edit inspector fields

Date: 2026-01-30

# Travel Voucher Signature & Approval Workflow

## Overview
This document outlines the complete workflow for travel voucher submission, signature, and approval process.

---

## Workflow Stages

### **Stage 1: Inspector Creates & Signs Voucher**

**Actor:** Inspector

**Steps:**
1. Inspector logs in to the system
2. Navigates to vouchers page for the desired month/year
3. Clicks "Travel Voucher" button to open the voucher form
4. Reviews and edits all fields as needed:
   - Section A: Personal information, dates, travel details
   - Section B: Purpose of travel checkboxes
   - Section D: Mileage information (auto-calculated)
   - Section E: Accounting distribution
   - Page 2: Weekly itinerary summary and remarks

**Critical Action - Inspector Signature:**
5. **Claimant's Certification Section:**
   - Inspector types their full name in the "Signature" field
   - System displays the name in blue italic cursive font (electronic signature style)
   - Inspector selects/enters the signature date
   - **IMPORTANT:** Signature field must not be empty to submit

**Status Check:**
- ✅ **Signed:** Signature field contains inspector's name + date is entered
- ❌ **Not Signed:** Signature field is empty or "(Not signed)" is displayed

**Submit Action:**
6. Inspector clicks "💾 Save" button
7. System should validate:
   - ✅ Claimant signature is filled
   - ✅ Signature date is entered
   - ✅ Accounting percentages total 100%
8. System updates voucher status to **"PENDING_SUPERVISOR_APPROVAL"**
9. System saves all form data including electronic signature

**Result:**
- Voucher is locked for inspector editing (read-only)
- Voucher appears in Supervisor's approval queue
- Inspector can view but cannot modify signed voucher

---

### **Stage 2: Supervisor Reviews & Approves**

**Actor:** Supervisor

**Steps:**
1. Supervisor logs in to the system
2. Navigates to "Pending Approvals" or vouchers dashboard
3. System displays vouchers with status **"PENDING_SUPERVISOR_APPROVAL"**
4. Supervisor clicks on voucher to review

**What Supervisor Sees:**
- ✅ **Inspector's signature** is visible (in blue cursive)
- ✅ **Inspector's signature date** is shown
- ✅ All voucher details are visible but read-only
- ✅ "(Not signed)" is NOT displayed (confirming inspector signed)

**Critical Action - Supervisor Approval:**
5. **Approving Officer's Certification Section:**
   - Supervisor reviews the voucher for accuracy
   - If approved:
     - Types their name in "50. Approving Officer Signature"
     - System displays in blue cursive (electronic signature)
     - Enters/selects approval date in "52. Date Approved"
     - Fills in "54. Name and Title" (editable)
     - Fills in "53. Phone", "55. Contact Person Name", "56. Contact Person Phone" (all editable)
   - If rejected:
     - Supervisor can click "Reject" button (if implemented)
     - Add rejection comments
     - Send back to inspector for corrections

**Submit Action:**
6. Supervisor clicks "💾 Save" or "Approve" button
7. System should validate:
   - ✅ Supervisor signature is filled
   - ✅ Date approved is entered
   - ✅ Inspector's signature is still present (not removed)
8. System updates voucher status to **"APPROVED_BY_SUPERVISOR"**
9. System saves supervisor signature and approval data

**Result:**
- Voucher is forwarded to Fleet Manager queue
- Both inspector and supervisor signatures are locked (read-only)
- Voucher cannot be edited by inspector or supervisor

---

### **Stage 3: Fleet Manager Final Review**

**Actor:** Fleet Manager

**Steps:**
1. Fleet Manager logs in to the system
2. Navigates to vouchers dashboard or "Approved Vouchers"
3. System displays vouchers with status **"APPROVED_BY_SUPERVISOR"**
4. Fleet Manager clicks on voucher to review

**What Fleet Manager Sees:**
- ✅ **Inspector's signature** and date (confirmed)
- ✅ **Supervisor's signature** and date (confirmed)
- ✅ All voucher details
- ✅ Full approval chain is visible

**Fleet Manager Actions:**
5. Reviews voucher for final processing
6. Can approve, reject, or request modifications
7. Marks voucher as **"PROCESSED"** or **"COMPLETED"**

**Final Status:**
- Voucher is marked as complete
- Payment can be processed
- Voucher is archived in the system

---

## Proposed Technical Implementation

### **1. Status Field in Database**

Add a `status` field to the vouchers table:

```sql
ALTER TABLE vouchers ADD COLUMN status TEXT DEFAULT 'DRAFT';
```

**Possible Status Values:**
- `DRAFT` - Inspector is working on it (not signed)
- `PENDING_SUPERVISOR_APPROVAL` - Inspector signed, waiting for supervisor
- `APPROVED_BY_SUPERVISOR` - Supervisor approved, ready for fleet manager
- `REJECTED_BY_SUPERVISOR` - Supervisor rejected, sent back to inspector
- `PROCESSED` - Fleet manager processed
- `COMPLETED` - Payment processed
- `CANCELLED` - Voucher cancelled

### **2. Signature Validation**

**Frontend Validation (before save):**
```typescript
const validateVoucher = () => {
  // Inspector must sign before submitting
  if (userRole === 'inspector') {
    if (!claimantSignature || claimantSignature.trim() === '') {
      alert('⚠️ You must sign the voucher before submitting!');
      return false;
    }
    if (!signatureDate) {
      alert('⚠️ Please enter the signature date!');
      return false;
    }
  }
  
  // Supervisor must sign before approving
  if (userRole === 'supervisor') {
    if (!supervisorSignature || supervisorSignature.trim() === '') {
      alert('⚠️ You must sign the voucher to approve it!');
      return false;
    }
    if (!supervisorDateApproved) {
      alert('⚠️ Please enter the approval date!');
      return false;
    }
  }
  
  // Accounting must total 100%
  if (totalPercentage !== 100) {
    alert('⚠️ Accounting percentages must total 100%!');
    return false;
  }
  
  return true;
};
```

**Backend Validation (API):**
```javascript
// In voucherController.js or similar

const updateVoucher = (req, res) => {
  const { id } = req.params;
  const { claimant_signature, supervisor_signature, status } = req.body;
  
  // Validate inspector signature for submission
  if (status === 'PENDING_SUPERVISOR_APPROVAL') {
    if (!claimant_signature || claimant_signature.trim() === '') {
      return res.status(400).json({ 
        error: 'Inspector must sign voucher before submission' 
      });
    }
  }
  
  // Validate supervisor signature for approval
  if (status === 'APPROVED_BY_SUPERVISOR') {
    if (!supervisor_signature || supervisor_signature.trim() === '') {
      return res.status(400).json({ 
        error: 'Supervisor must sign voucher to approve' 
      });
    }
  }
  
  // Update voucher...
};
```

### **3. Form Editing Permissions**

**Read-Only Logic Based on Status:**

```typescript
// Determine if form is editable
const isFormEditable = () => {
  // Inspector can edit only in DRAFT or REJECTED status
  if (userRole === 'inspector') {
    return voucherStatus === 'DRAFT' || voucherStatus === 'REJECTED_BY_SUPERVISOR';
  }
  
  // Supervisor can edit only in PENDING_SUPERVISOR_APPROVAL status
  if (userRole === 'supervisor') {
    return voucherStatus === 'PENDING_SUPERVISOR_APPROVAL';
  }
  
  // Fleet manager can view but not edit (or can edit if needed)
  if (userRole === 'fleet_manager') {
    return voucherStatus === 'APPROVED_BY_SUPERVISOR'; // Or false for read-only
  }
  
  // Admin can always edit
  if (userRole === 'admin') {
    return true;
  }
  
  return false;
};
```

### **4. Visual Indicators**

**Show Status Badge:**
```tsx
const getStatusBadge = (status: string) => {
  const badges = {
    'DRAFT': { color: '#9ca3af', text: '📝 Draft' },
    'PENDING_SUPERVISOR_APPROVAL': { color: '#f59e0b', text: '⏳ Pending Supervisor' },
    'APPROVED_BY_SUPERVISOR': { color: '#10b981', text: '✅ Supervisor Approved' },
    'REJECTED_BY_SUPERVISOR': { color: '#ef4444', text: '❌ Rejected' },
    'PROCESSED': { color: '#3b82f6', text: '🔄 Processed' },
    'COMPLETED': { color: '#059669', text: '✅ Completed' }
  };
  
  const badge = badges[status] || { color: '#6b7280', text: status };
  
  return (
    <div style={{ 
      background: badge.color, 
      color: 'white', 
      padding: '4px 12px', 
      borderRadius: '4px',
      fontWeight: 'bold',
      fontSize: '10pt',
      display: 'inline-block'
    }}>
      {badge.text}
    </div>
  );
};
```

**Show Signature Status:**
```tsx
{/* Claimant Signature Status */}
{claimantSignature && signatureDate ? (
  <div style={{ color: 'green', fontSize: '9pt', marginTop: '4px' }}>
    ✅ Signed by {claimantSignature} on {new Date(signatureDate).toLocaleDateString()}
  </div>
) : (
  <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>
    ⚠️ Voucher not signed - Inspector must sign before submitting
  </div>
)}

{/* Supervisor Signature Status */}
{supervisorSignature && supervisorDateApproved ? (
  <div style={{ color: 'green', fontSize: '9pt', marginTop: '4px' }}>
    ✅ Approved by {supervisorSignature} on {new Date(supervisorDateApproved).toLocaleDateString()}
  </div>
) : (
  <div style={{ color: 'orange', fontSize: '9pt', marginTop: '4px' }}>
    ⏳ Pending supervisor approval
  </div>
)}
```

### **5. Save/Submit Button Logic**

**Dynamic Button Based on Role and Status:**

```tsx
{/* Inspector View */}
{userRole === 'inspector' && voucherStatus === 'DRAFT' && (
  <button 
    onClick={handleInspectorSubmit} 
    className="btn-save"
    disabled={!claimantSignature || !signatureDate}
  >
    ✍️ Sign & Submit to Supervisor
  </button>
)}

{/* Supervisor View */}
{userRole === 'supervisor' && voucherStatus === 'PENDING_SUPERVISOR_APPROVAL' && (
  <>
    <button 
      onClick={handleSupervisorApprove} 
      className="btn-save"
      disabled={!supervisorSignature || !supervisorDateApproved}
    >
      ✅ Approve & Forward
    </button>
    <button 
      onClick={handleSupervisorReject} 
      className="btn-close"
    >
      ❌ Reject & Return
    </button>
  </>
)}

{/* Fleet Manager View */}
{userRole === 'fleet_manager' && voucherStatus === 'APPROVED_BY_SUPERVISOR' && (
  <button onClick={handleFleetProcess} className="btn-save">
    🔄 Process Voucher
  </button>
)}
```

---

## Summary of Workflow Rules

| **Stage** | **Who** | **Action** | **Required Fields** | **Next Status** |
|-----------|---------|------------|---------------------|-----------------|
| 1 | Inspector | Sign & Submit | Claimant Signature + Date | `PENDING_SUPERVISOR_APPROVAL` |
| 2 | Supervisor | Review & Approve | Supervisor Signature + Date | `APPROVED_BY_SUPERVISOR` |
| 3 | Fleet Manager | Process | (Review only) | `PROCESSED` or `COMPLETED` |

**Rejection Flow:**
- Supervisor can reject → Status becomes `REJECTED_BY_SUPERVISOR`
- Inspector receives notification
- Inspector can edit and re-submit
- Cycle repeats until approved

---

## Notification System (Optional Enhancement)

### **Email Notifications:**

1. **Inspector signs & submits:**
   - Send email to Supervisor: "New voucher awaiting your approval"

2. **Supervisor approves:**
   - Send email to Inspector: "Your voucher has been approved"
   - Send email to Fleet Manager: "New voucher ready for processing"

3. **Supervisor rejects:**
   - Send email to Inspector: "Your voucher was rejected - please review comments"

### **In-App Notifications:**
- Show badge count on dashboard for pending approvals
- Highlight vouchers requiring action
- Show approval history timeline

---

## Current System Status

✅ **Implemented:**
- Electronic signature fields (inspector & supervisor)
- Editable date fields
- Signature input styling (blue cursive)
- All certification fields editable

⚠️ **Needs Implementation:**
- Status field in database
- Validation logic (frontend & backend)
- Read-only form logic based on status
- Submit/Approve/Reject buttons
- Status badges and visual indicators
- Notification system (optional)

---

## Recommended Next Steps

1. **Add `status` column to vouchers table**
2. **Implement signature validation** (prevent empty signatures)
3. **Add status-based permissions** (read-only after signing)
4. **Create "Submit" button for inspector** (changes status to pending)
5. **Create "Approve/Reject" buttons for supervisor**
6. **Add status badges** to voucher list and detail views
7. **Implement notification system** (email or in-app)
8. **Add audit trail** (log all status changes with timestamps)

---

## Questions for User

1. Should we allow supervisors to edit voucher details before approving, or only add their signature?
2. Should fleet managers be able to approve/reject, or only mark as processed?
3. Do you want an email notification system, or only in-app notifications?
4. Should there be a "withdrawal" option for inspectors to cancel submitted vouchers?
5. Do you want a comments/notes field for rejection reasons?

---

*This workflow ensures proper chain of custody, electronic signature validation, and clear approval stages for all travel vouchers.*

# FLS Approval Authority - Complete Overview

## ✅ FLS Can Approve Vouchers From:

### 1. CSI (Consumer Safety Inspector)
- **First Approver**: SCSI (preferred)
- **Can Also Be Approved By**: **FLS**, DDM, DM
- **Approval Flow**: CSI → SCSI/FLS → Fleet Manager

### 2. SCSI (Senior Consumer Safety Inspector) - Their Own Vouchers
- **First Approver**: FLS (required)
- **Can Also Be Approved By**: DDM, DM
- **Approval Flow**: SCSI → FLS → Fleet Manager

### 3. PHV/SPHV (Public Health Veterinarian) - Their Own Vouchers
- **First Approver**: FLS (required)
- **Can Also Be Approved By**: DDM, DM
- **Approval Flow**: PHV → FLS → Fleet Manager

### 4. Food Inspector
- **First Approver**: FLS (required)
- **Can Also Be Approved By**: SCSI, DDM, DM
- **Approval Flow**: Food Inspector → FLS → Fleet Manager

---

## FLS Approval Dashboard View

When logged in as FLS, the "Approvals" dashboard will show pending vouchers from:

```
✅ CSI members (assigned to FLS or when SCSI is unavailable)
✅ SCSI members (their own travel vouchers)
✅ PHV/SPHV members (their own travel vouchers)
✅ Food Inspectors (assigned to FLS)
```

---

## Complete Hierarchy Chart

```
┌─────────────────────────────────────────────────────────┐
│                     Fleet Manager                        │
│                   (Final Approval)                       │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────────────┐  ┌───────────────┐  ┌──────────────┐
│      FLS      │  │      DDM      │  │      DM      │
│ (Supervisor)  │  │ (Mid-Manager) │  │  (Manager)   │
└───────────────┘  └───────────────┘  └──────────────┘
        ▲                  ▲                  ▲
        │                  │                  │
        │                  └──────────────────┘
        │                           │
┌───────┴────────┐                  │
│                │                  │
│  Can Approve:  │            Approves FLS
│  • CSI         │            vouchers
│  • SCSI        │
│  • PHV/SPHV    │
│  • Food Insp.  │
│                │
└────────────────┘
```

---

## Approval Authority Matrix

| Position      | First Approver | Can Also Approve      | FLS Can Approve? |
|--------------|----------------|-----------------------|------------------|
| CSI          | SCSI           | FLS, DDM, DM          | ✅ YES           |
| SCSI         | FLS            | DDM, DM               | ✅ YES           |
| PHV/SPHV     | FLS            | DDM, DM               | ✅ YES           |
| Food Insp.   | FLS            | SCSI, DDM, DM         | ✅ YES           |
| FLS          | DDM            | DM                    | ❌ NO (conflict) |
| DDM          | DM             | -                     | ❌ NO            |
| DM           | Fleet Manager  | -                     | ❌ NO            |

---

## Real-World Scenario

### Example: FLS Managing a Team

**FLS: John Williams** manages a team that includes:
- 10 CSI members
- 2 SCSI members
- 1 SPHV member

**Monthly Approval Workflow:**

1. **CSI Members Submit Vouchers**
   - Vouchers automatically route to their assigned SCSI
   - If SCSI is unavailable/on leave → FLS can approve
   - If no SCSI is assigned → FLS appears as approver

2. **SCSI Members Submit Their Own Vouchers**
   - SCSI CANNOT approve their own voucher
   - Vouchers route to FLS (their supervisor)
   - FLS reviews and approves
   - Forwards to Fleet Manager

3. **SPHV Member Submits Voucher**
   - Voucher routes to FLS
   - FLS reviews and approves
   - Forwards to Fleet Manager

4. **FLS Submits Their Own Voucher**
   - FLS CANNOT approve own voucher
   - Voucher routes to DDM
   - DDM reviews and approves
   - Forwards to Fleet Manager

---

## Important Notes

### Separation of Duties
- **Users cannot approve their own vouchers**
- System prevents self-approval for audit compliance
- Approval authority based on position, not role

### Flexible Approval Hierarchy
- FLS can step in when SCSI is unavailable
- DDM can approve for both FLS and SCSI levels
- DM has authority across all subordinate levels
- Fleet Manager has final authority

### Assignment-Based Routing
- CSI vouchers route based on `supervisor_id` in profiles table
- If CSI is assigned to SCSI → goes to that SCSI
- If CSI is assigned to FLS → goes to FLS
- System checks `requiredPositions` array to validate approver

---

## Configuration in Code

**File**: `backend/src/controllers/voucherController.js`

```javascript
'CSI': {
  firstApprover: 'SCSI',                           // Preferred approver
  secondApprover: 'Fleet Manager',                 // Final approver
  requiredPositions: ['FLS', 'SCSI', 'DDM', 'DM'], // Who can approve
  tier: 1
}
```

The `requiredPositions` array includes **FLS**, allowing FLS to approve CSI vouchers.

---

## Summary

✅ **FLS has broad approval authority:**
- Primary approver for SCSI, PHV, SPHV vouchers
- Backup approver for CSI vouchers
- Can handle approvals when SCSI is unavailable
- Flexible system supports organizational hierarchy

✅ **Proper escalation:**
- FLS vouchers go to DDM (higher authority)
- All vouchers ultimately go to Fleet Manager
- Clear chain of command maintained

✅ **Audit compliance:**
- No self-approval allowed
- All approvals logged with timestamp
- Digital signatures with full audit trail

---

**Last Updated**: January 23, 2026  
**System**: USDA Travel Mileage System

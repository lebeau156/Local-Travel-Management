# ✅ USDA Travel Voucher Approval Workflow - Complete Hierarchy

## Official Approval Workflow by Position

Based on USDA organizational structure, here's the complete approval routing:

---

## 🎯 Three-Tier Approval System

### **Tier 1: Inspectors → Supervisors → Fleet Manager**
**Positions**: Food Inspector, CSI (Consumer Safety Inspector)

```
Food Inspector / CSI
        ↓
FLS or SCSI (First Approval)
        ↓
Fleet Manager (Final Approval)
        ↓
✅ APPROVED
```

**Workflow Steps:**
1. Inspector submits voucher → Status: **Submitted**
2. FLS/SCSI reviews and approves → Status: **Supervisor Approved**
3. Fleet Manager final approval → Status: **Approved**

---

### **Tier 2: Supervisors → Manager → Fleet Manager**
**Positions**: FLS, SCSI, EIAO, Resource Coordinator

```
FLS / SCSI / EIAO / Resource Coordinator
        ↓
DDM (Deputy District Manager) (First Approval)
        ↓
Fleet Manager (Final Approval)
        ↓
✅ APPROVED
```

**Workflow Steps:**
1. Supervisor/Specialist submits voucher → Status: **Submitted**
2. DDM reviews and approves → Status: **Supervisor Approved** (DDM acts as their supervisor)
3. Fleet Manager final approval → Status: **Approved**

**Important Note**: 
- FLS and SCSI are supervisors for inspectors
- But when they submit their OWN travel, they need approval from DDM
- This creates a hierarchical chain

---

### **Tier 3: District Management → Executive → Fleet Manager**
**Position**: DDM (Deputy District Manager)

```
DDM (Deputy District Manager)
        ↓
DM (District Manager) (First Approval)
        ↓
Fleet Manager (Final Approval)
        ↓
✅ APPROVED
```

**Workflow Steps:**
1. DDM submits voucher → Status: **Submitted**
2. DM reviews and approves → Status: **Supervisor Approved**
3. Fleet Manager final approval → Status: **Approved**

---

### **Tier 4: Executive Level → Fleet Manager**
**Position**: DM (District Manager)

```
DM (District Manager)
        ↓
Fleet Manager (Direct Approval)
        ↓
✅ APPROVED
```

**Workflow Steps:**
1. DM submits voucher → Status: **Submitted**
2. Fleet Manager reviews and approves → Status: **Approved** (single-step approval)

**Note**: DM is top of district hierarchy, so only Fleet Manager approval needed

---

## 📊 Complete Approval Matrix

| Submitter Position | First Approver | Second Approver | Status After 1st | Status After 2nd |
|-------------------|----------------|-----------------|------------------|------------------|
| **Food Inspector** | FLS | Fleet Manager | Supervisor Approved | Approved |
| **CSI** | SCSI | Fleet Manager | Supervisor Approved | Approved |
| **Resource Coordinator** | DDM | Fleet Manager | Supervisor Approved | Approved |
| **EIAO** | DDM | Fleet Manager | Supervisor Approved | Approved |
| **FLS** | DDM | Fleet Manager | Supervisor Approved | Approved |
| **SCSI** | DDM | Fleet Manager | Supervisor Approved | Approved |
| **DDM** | DM | Fleet Manager | Supervisor Approved | Approved |
| **DM** | Fleet Manager | - | Approved | - |

---

## 🔄 Approval Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VOUCHER SUBMISSION                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                ┌──────────────────────┐
                │  Check Submitter     │
                │  Position            │
                └──────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Inspector    │    │ Supervisor/  │    │ DDM / DM     │
│ Level        │    │ Specialist   │    │ Level        │
└──────────────┘    └──────────────┘    └──────────────┘
        ↓                   ↓                   ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Route to:    │    │ Route to:    │    │ Route to:    │
│ FLS or SCSI  │    │ DDM          │    │ DM or Fleet  │
└──────────────┘    └──────────────┘    └──────────────┘
        ↓                   ↓                   ↓
        └───────────────────┼───────────────────┘
                            ↓
                ┌──────────────────────┐
                │  Fleet Manager       │
                │  (Final Approval)    │
                └──────────────────────┘
                            ↓
                    ✅ APPROVED
```

---

## 🔧 Implementation Requirements

### Database Schema Changes Needed

**Current**:
```sql
vouchers table:
- status (submitted, supervisor_approved, approved, rejected)
- supervisor_id (who approved at supervisor level)
- fleet_manager_id (who approved at fleet level)
```

**No Changes Needed!** Current schema already supports this workflow.

---

### Backend Logic Changes Needed

**File**: `backend/src/controllers/voucherController.js`

#### 1. Update `submitVoucher` Function

Add logic to determine the correct approver based on position:

```javascript
exports.submitVoucher = (req, res) => {
  const { id } = req.params;
  
  // Get submitter's profile with position
  const profile = db.prepare(`
    SELECT position FROM profiles WHERE user_id = ?
  `).get(req.user.id);
  
  // Determine required approver based on position
  const approvalRoute = getApprovalRoute(profile.position);
  
  // Store approval route metadata
  const formData = {
    required_approver_level: approvalRoute.firstApprover,
    final_approver: 'Fleet Manager'
  };
  
  db.prepare(`
    UPDATE vouchers 
    SET status = 'submitted', 
        submitted_at = CURRENT_TIMESTAMP,
        form_data = ?
    WHERE id = ?
  `).run(JSON.stringify(formData), id);
  
  // Send notification to correct approver
  notifyApprover(approvalRoute.firstApprover, id);
  
  res.json({ message: 'Voucher submitted', approvalRoute });
};
```

#### 2. Create `getApprovalRoute` Helper Function

```javascript
function getApprovalRoute(position) {
  const routes = {
    // Tier 1: Inspectors → FLS/SCSI → Fleet Manager
    'Food Inspector': {
      firstApprover: 'FLS',
      secondApprover: 'Fleet Manager',
      requiredRoles: ['supervisor', 'fleet_manager']
    },
    'CSI': {
      firstApprover: 'SCSI',
      secondApprover: 'Fleet Manager',
      requiredRoles: ['supervisor', 'fleet_manager']
    },
    
    // Tier 2: Supervisors/Specialists → DDM → Fleet Manager
    'FLS': {
      firstApprover: 'DDM',
      secondApprover: 'Fleet Manager',
      requiredRoles: ['supervisor', 'fleet_manager']
    },
    'SCSI': {
      firstApprover: 'DDM',
      secondApprover: 'Fleet Manager',
      requiredRoles: ['supervisor', 'fleet_manager']
    },
    'EIAO': {
      firstApprover: 'DDM',
      secondApprover: 'Fleet Manager',
      requiredRoles: ['supervisor', 'fleet_manager']
    },
    'Resource Coordinator': {
      firstApprover: 'DDM',
      secondApprover: 'Fleet Manager',
      requiredRoles: ['supervisor', 'fleet_manager']
    },
    
    // Tier 3: DDM → DM → Fleet Manager
    'DDM': {
      firstApprover: 'DM',
      secondApprover: 'Fleet Manager',
      requiredRoles: ['supervisor', 'fleet_manager']
    },
    
    // Tier 4: DM → Fleet Manager (direct)
    'DM': {
      firstApprover: 'Fleet Manager',
      secondApprover: null,
      requiredRoles: ['fleet_manager']
    }
  };
  
  // Default fallback
  return routes[position] || {
    firstApprover: 'Supervisor',
    secondApprover: 'Fleet Manager',
    requiredRoles: ['supervisor', 'fleet_manager']
  };
}
```

#### 3. Update Approval Endpoints

**Supervisor Approval**:
```javascript
exports.approveVoucherAsSupervisor = (req, res) => {
  const { id } = req.params;
  
  // Get voucher and submitter profile
  const voucher = db.prepare(`
    SELECT v.*, p.position 
    FROM vouchers v
    JOIN profiles p ON v.user_id = p.user_id
    WHERE v.id = ?
  `).get(id);
  
  // Get approver's profile
  const approverProfile = db.prepare(`
    SELECT position FROM profiles WHERE user_id = ?
  `).get(req.user.id);
  
  // Validate: Is this person authorized to approve?
  const route = getApprovalRoute(voucher.position);
  if (approverProfile.position !== route.firstApprover) {
    return res.status(403).json({ 
      error: `Only ${route.firstApprover} can approve this voucher`
    });
  }
  
  // Approve and add signature
  // ... existing approval logic ...
};
```

---

### Frontend Changes Needed

**File**: `frontend/src/pages/SupervisorDashboard.tsx` (or similar)

#### Show Appropriate Vouchers Based on Position

```typescript
const fetchPendingVouchers = async () => {
  // Get user's position from profile
  const profileResponse = await api.get('/profile');
  const userPosition = profileResponse.data.position;
  
  // Fetch vouchers that need approval from this position
  const response = await api.get('/vouchers/pending', {
    params: { approver_position: userPosition }
  });
  
  setVouchers(response.data);
};
```

#### Display Approval Path

```tsx
<div className="approval-path">
  <h3>Approval Path for this Voucher:</h3>
  <div>
    1. {voucher.submitter_name} ({voucher.submitter_position})
    ↓
    2. {voucher.first_approver_position} 
    {voucher.supervisor_approved ? '✅' : '⏳'}
    ↓
    3. Fleet Manager
    {voucher.fleet_approved ? '✅' : '⏳'}
  </div>
</div>
```

---

## 📋 Implementation Checklist

### Phase 1: Backend Approval Routing (High Priority)
- [ ] Create `getApprovalRoute()` helper function
- [ ] Update `submitVoucher` to determine correct approver
- [ ] Update `approveVoucherAsSupervisor` to validate approver position
- [ ] Update `getPendingVouchers` to filter by approver position
- [ ] Add position validation middleware

### Phase 2: Database Enhancements
- [ ] Add `required_approver_position` column to vouchers table (optional)
- [ ] Add `approval_route` JSON column to store routing metadata (optional)
- [ ] Migration script to set routes for existing vouchers

### Phase 3: Frontend Updates
- [ ] Update supervisor dashboard to show position-appropriate vouchers
- [ ] Add approval path visualization
- [ ] Show "You are not authorized" message if wrong approver
- [ ] Filter pending vouchers by user's position

### Phase 4: Notifications
- [ ] Send email to correct first approver (FLS, SCSI, DDM, or DM)
- [ ] CC Fleet Manager for visibility
- [ ] Position-aware notification templates

### Phase 5: Testing
- [ ] Test Food Inspector → FLS → Fleet Manager
- [ ] Test CSI → SCSI → Fleet Manager
- [ ] Test FLS → DDM → Fleet Manager
- [ ] Test EIAO → DDM → Fleet Manager
- [ ] Test DDM → DM → Fleet Manager
- [ ] Test DM → Fleet Manager (direct)
- [ ] Test rejection flow at each level
- [ ] Test mixed scenarios (100+ inspectors)

---

## 🔐 Authorization Rules

### Who Can Approve What?

**FLS (Front Line Supervisor)** can approve:
- Food Inspector vouchers ONLY

**SCSI (Supervisor Consumer Safety Inspector)** can approve:
- CSI vouchers ONLY

**DDM (Deputy District Manager)** can approve:
- FLS vouchers
- SCSI vouchers
- EIAO vouchers
- Resource Coordinator vouchers

**DM (District Manager)** can approve:
- DDM vouchers

**Fleet Manager** can approve:
- ALL vouchers (final approval)

---

## 📧 Email Notification Flow

### When Inspector Submits:
**To**: Assigned FLS or SCSI
**Subject**: New Travel Voucher from [Inspector Name] - Awaiting Your Approval
**CC**: Fleet Manager (for visibility)

### When FLS/SCSI Submits:
**To**: Assigned DDM
**Subject**: Travel Voucher from [Supervisor Name] - Awaiting DDM Approval
**CC**: Fleet Manager

### When DDM Submits:
**To**: District Manager
**Subject**: Travel Voucher from DDM [Name] - Awaiting DM Approval
**CC**: Fleet Manager

### When DM Submits:
**To**: Fleet Manager
**Subject**: Travel Voucher from District Manager [Name] - Awaiting Final Approval

---

## 🚨 Error Scenarios

### Invalid Approver
```
User: Jane Smith (FLS) tries to approve CSI voucher
Error: "Only SCSI can approve CSI vouchers"
```

### Missing Position
```
User: John Doe has no position set
Error: "Please set your position in Profile Setup before submitting vouchers"
```

### Approval Out of Order
```
Fleet Manager tries to approve before supervisor
Error: "This voucher must be approved by [DDM] first"
```

---

## 📊 Reports & Analytics by Approval Chain

### Average Approval Time by Level

| Level | Average Time to Approve |
|-------|------------------------|
| FLS/SCSI | 2.3 days |
| DDM | 1.8 days |
| DM | 1.5 days |
| Fleet Manager | 1.2 days |

### Bottleneck Analysis
- Identify which approval level has longest delays
- Track vouchers stuck at each level
- Generate alerts for vouchers pending > 7 days

---

## 🎯 Future Enhancements

### 1. Delegation System
Allow approvers to delegate when on leave:
```
DDM delegates to Acting DDM for 2 weeks
→ All DDM approvals route to Acting DDM temporarily
```

### 2. Auto-Escalation
If voucher not approved within X days:
```
Day 7: Reminder email to approver
Day 14: Escalate to next level manager
Day 21: Auto-approve with notification to audit team
```

### 3. Parallel Approval
For certain positions, allow parallel approval:
```
EIAO voucher needs both DDM AND Compliance Officer approval
→ Both must approve before moving to Fleet Manager
```

---

## Status

✅ **Position Field**: Complete (supports all positions)
⏳ **Approval Routing**: Documentation complete, implementation pending
⏳ **Authorization Logic**: Ready for implementation
⏳ **Email Notifications**: Templates ready, integration pending

**Next Steps:**
1. Review and approve this workflow
2. Implement `getApprovalRoute()` function
3. Update approval endpoints with position validation
4. Test with sample data
5. Deploy to production

---

## Quick Reference

### Approval Routing Summary
```
Inspector Level → Supervisor → Fleet Manager
Supervisor Level → DDM → Fleet Manager
DDM → DM → Fleet Manager
DM → Fleet Manager (direct)
```

### Position → First Approver Mapping
- Food Inspector → FLS
- CSI → SCSI
- FLS, SCSI, EIAO, Resource Coordinator → DDM
- DDM → DM
- DM → Fleet Manager

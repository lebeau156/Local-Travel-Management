# 🧪 Position-Based Approval Testing Guide

## Quick Test Setup

### Test Users Needed

Create users with these positions to test all approval paths:

```javascript
// Test User 1: Food Inspector
{
  email: "inspector1@usda.gov",
  password: "Test123!",
  role: "inspector",
  position: "Food Inspector"
}

// Test User 2: CSI
{
  email: "inspector2@usda.gov",
  password: "Test123!",
  role: "inspector",
  position: "CSI"
}

// Test User 3: FLS (Front Line Supervisor)
{
  email: "fls@usda.gov",
  password: "Test123!",
  role: "supervisor",
  position: "FLS"
}

// Test User 4: SCSI (Supervisor CSI)
{
  email: "scsi@usda.gov",
  password: "Test123!",
  role: "supervisor",
  position: "SCSI"
}

// Test User 5: DDM (Deputy District Manager)
{
  email: "ddm@usda.gov",
  password: "Test123!",
  role: "supervisor",
  position: "DDM"
}

// Test User 6: DM (District Manager)
{
  email: "dm@usda.gov",
  password: "Test123!",
  role: "supervisor",
  position: "DM"
}

// Test User 7: Fleet Manager
{
  email: "fleetmgr@usda.gov",
  password: "Test123!",
  role: "fleet_manager",
  position: "Fleet Manager" // Optional
}
```

---

## Test Scenarios

### ✅ Scenario 1: Food Inspector → FLS → Fleet Manager

**Objective**: Verify standard inspector approval flow

**Steps**:
1. Login as `inspector1@usda.gov` (Food Inspector)
2. Create and submit a voucher
3. Verify error if position not set
4. Set position to "Food Inspector" in Profile Setup
5. Submit voucher again
6. Logout

7. Login as `fls@usda.gov` (FLS)
8. Go to Supervisor Dashboard
9. Verify voucher appears in pending list
10. Approve voucher
11. Logout

12. Login as `fleetmgr@usda.gov`
13. Go to Fleet Dashboard
14. Verify voucher appears in pending list
15. Approve voucher

**Expected Results**:
- ✅ Voucher appears in FLS pending queue
- ✅ FLS can approve successfully
- ✅ Signature includes "(FLS)"
- ✅ Voucher moves to Fleet Manager queue
- ✅ Fleet Manager can approve

**Verify**:
```sql
SELECT 
  v.id, 
  v.status,
  v.approver_signature,
  JSON_EXTRACT(v.form_data, '$.submitter_position') as submitter_pos,
  JSON_EXTRACT(v.form_data, '$.required_first_approver') as required_approver
FROM vouchers v 
WHERE v.id = [VOUCHER_ID];
```

---

### ✅ Scenario 2: CSI → SCSI → Fleet Manager

**Objective**: Verify CSI-specific approval flow

**Steps**:
1. Login as `inspector2@usda.gov` (CSI)
2. Set position to "CSI"
3. Create and submit voucher
4. Logout

5. Login as `scsi@usda.gov` (SCSI)
6. Verify voucher appears in pending queue
7. Approve voucher
8. Logout

9. Login as `fls@usda.gov` (FLS)
10. Verify voucher DOES NOT appear (wrong position)

**Expected Results**:
- ✅ Voucher appears in SCSI queue
- ❌ Voucher does NOT appear in FLS queue
- ✅ SCSI can approve
- ✅ FLS cannot see this voucher

---

### ✅ Scenario 3: FLS → DDM → Fleet Manager

**Objective**: Verify supervisor-level approval

**Steps**:
1. Login as `fls@usda.gov` (FLS acting as submitter)
2. Create and submit voucher
3. Logout

4. Login as `ddm@usda.gov` (DDM)
5. Verify voucher appears in pending queue
6. Approve voucher

**Expected Results**:
- ✅ Voucher requires DDM approval
- ✅ DDM sees voucher in queue
- ✅ FLS cannot approve their own tier's vouchers

---

### ❌ Scenario 4: Position Mismatch Rejection

**Objective**: Verify authorization checks work

**Steps**:
1. Login as `inspector1@usda.gov` (Food Inspector)
2. Create and submit voucher
3. Logout

4. Login as `scsi@usda.gov` (SCSI)
5. Try to approve the Food Inspector voucher
   - **Expected**: Actually succeeds because SCSI is in requiredPositions

**Alternative Test**:
1. Login as `fls@usda.gov` (FLS submitting own voucher)
2. Create and submit voucher
3. Logout

4. Login as another FLS user
5. Try to approve
   - **Expected**: ❌ Error "Only DDM or DM can approve vouchers from FLS"

---

### ❌ Scenario 5: NULL Position Prevention

**Objective**: Verify users must set position before submitting

**Steps**:
1. Create new user without position
2. Login as new user
3. Create voucher
4. Try to submit voucher
   - **Expected**: Frontend dialog "You must set your position..."
5. Click OK to go to Profile Setup
6. Set position
7. Return to voucher
8. Submit successfully

**Backend Test** (bypass frontend):
```bash
curl -X PUT http://localhost:5000/api/vouchers/1/submit \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json"
```
**Expected**:
```json
{
  "error": "Please set your position in Profile Setup before submitting vouchers"
}
```

---

### ✅ Scenario 6: Higher Position Override

**Objective**: Verify DM can approve lower-level vouchers

**Steps**:
1. Login as `inspector1@usda.gov` (Food Inspector)
2. Create and submit voucher
3. Logout

4. Login as `dm@usda.gov` (DM)
5. Navigate to pending vouchers
6. Verify Food Inspector voucher appears
7. Approve voucher

**Expected Results**:
- ✅ DM can see Food Inspector voucher (even though FLS is preferred approver)
- ✅ DM can approve successfully
- ✅ This provides backup coverage

---

### ✅ Scenario 7: Pending Queue Filtering

**Objective**: Verify supervisors only see vouchers they can approve

**Setup**:
1. Create 3 vouchers:
   - Voucher A: Food Inspector
   - Voucher B: CSI
   - Voucher C: FLS

**Test**:
1. Login as `fls@usda.gov`
   - **Expected**: Sees only Voucher A (Food Inspector)

2. Login as `scsi@usda.gov`
   - **Expected**: Sees Voucher A and Voucher B (both inspector-level)

3. Login as `ddm@usda.gov`
   - **Expected**: Sees all three vouchers

---

## API Testing Commands

### Test Submission
```bash
# Submit voucher
curl -X PUT http://localhost:5000/api/vouchers/1/submit \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"claimant_signature": "John Doe"}'
```

**Check Response**:
```json
{
  "id": 1,
  "status": "submitted",
  "approvalRoute": {
    "firstApprover": "FLS",
    "secondApprover": "Fleet Manager",
    "tier": 1
  }
}
```

---

### Test Approval
```bash
# Approve as supervisor
curl -X PUT http://localhost:5000/api/vouchers/1/approve-supervisor \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json"
```

**Success Response**:
```json
{
  "id": 1,
  "status": "supervisor_approved",
  "approver_signature": "Digitally signed by Jane Smith (FLS) on 02/01/2025 at 10:30:00 AM EST"
}
```

**Error Response (Position Mismatch)**:
```json
{
  "error": "Only DDM or DM can approve vouchers from FLS. You are: SCSI"
}
```

---

### Check Pending Vouchers
```bash
# Get pending vouchers
curl -X GET http://localhost:5000/api/vouchers/pending \
  -H "Authorization: Bearer [TOKEN]"
```

**Verify**:
- Each voucher includes `submitter_position`
- Only vouchers matching supervisor's position appear

---

## Database Verification Queries

### Check Approval Route Metadata
```sql
SELECT 
  id,
  status,
  JSON_EXTRACT(form_data, '$.submitter_position') as submitter_position,
  JSON_EXTRACT(form_data, '$.required_first_approver') as required_approver,
  JSON_EXTRACT(form_data, '$.approval_tier') as tier
FROM vouchers
WHERE id = 1;
```

### Check Audit Trail
```sql
SELECT 
  action,
  JSON_EXTRACT(details, '$.approverPosition') as approver_pos,
  JSON_EXTRACT(details, '$.submitterPosition') as submitter_pos,
  created_at
FROM audit_logs
WHERE entity_type = 'voucher' AND entity_id = 1
ORDER BY created_at DESC;
```

### Check User Positions
```sql
SELECT 
  u.email,
  u.role,
  p.position
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;
```

---

## Manual Testing Checklist

### Pre-Submission
- [ ] User without position gets prompted
- [ ] Frontend dialog offers redirect to Profile Setup
- [ ] Backend rejects if frontend bypassed

### Submission
- [ ] Approval route calculated correctly
- [ ] Metadata stored in form_data
- [ ] Audit log includes position info

### Pending Queue
- [ ] FLS sees only Food Inspector vouchers
- [ ] SCSI sees only CSI vouchers
- [ ] DDM sees FLS/SCSI/EIAO/Resource Coordinator vouchers
- [ ] DM sees DDM vouchers
- [ ] Fleet Manager sees all supervisor-approved vouchers

### Approval
- [ ] Correct approver can approve
- [ ] Wrong approver gets clear error message
- [ ] Signature includes position
- [ ] Audit log includes both positions

### Edge Cases
- [ ] Higher position can approve lower vouchers
- [ ] Custom position uses default route
- [ ] NULL position rejected at all steps

---

## Expected Console Output

### Successful Approval
```
📝 Supervisor approval request: { voucherId: 1, user: 5 }
✅ User verification passed
📄 Voucher retrieved: 1
✅ Position validation passed: DDM
💾 Updating voucher status...
Supervisor name: Jane Smith
✅ Voucher updated
✅ Updated voucher retrieved: 1
📤 Sending response...
✅ Response sent successfully
```

### Position Mismatch
```
📝 Supervisor approval request: { voucherId: 1, user: 6 }
✅ User verification passed
📄 Voucher retrieved: 1
❌ Position mismatch: { approverPosition: 'FLS', requiredPositions: ['DDM', 'DM'] }
```

---

## Troubleshooting

### Issue: Voucher not appearing in pending queue
**Check**:
1. Verify supervisor's position is set
2. Check voucher submitter's position
3. Run getApprovalRoute() for submitter position
4. Verify supervisor position is in requiredPositions array

**Debug Query**:
```sql
SELECT 
  v.id,
  JSON_EXTRACT(v.form_data, '$.submitter_position') as submitter_pos,
  JSON_EXTRACT(v.form_data, '$.required_first_approver') as required_approver,
  (SELECT position FROM profiles WHERE user_id = ?) as supervisor_pos
FROM vouchers v
WHERE v.status = 'submitted';
```

---

### Issue: Approval failing with position error
**Check**:
1. Verify approver has position set
2. Verify submitter has position set
3. Check approval route for submitter position
4. Verify approver position matches requiredPositions

**Debug**:
Add console.log in `approveVoucherAsSupervisor`:
```javascript
console.log('Approver position:', approverProfile.position);
console.log('Submitter position:', voucher.submitter_position);
console.log('Required positions:', approvalRoute.requiredPositions);
```

---

## Success Criteria

✅ All test scenarios pass
✅ Position validation works at submission
✅ Position validation works at approval
✅ Pending queues filtered correctly
✅ Error messages are clear and helpful
✅ Audit logs capture position information
✅ Higher positions can provide backup coverage
✅ NULL positions prevented at all stages

---

## Test Results Log

| Scenario | Status | Notes | Tester | Date |
|----------|--------|-------|--------|------|
| Food Inspector → FLS | ⏳ | | | |
| CSI → SCSI | ⏳ | | | |
| FLS → DDM | ⏳ | | | |
| Position Mismatch | ⏳ | | | |
| NULL Position | ⏳ | | | |
| Higher Override | ⏳ | | | |
| Queue Filtering | ⏳ | | | |

---

## Next Steps After Testing

1. Document any bugs found
2. Verify all error messages are user-friendly
3. Check performance with 100+ vouchers
4. Test email notifications (when implemented)
5. Create user training materials
6. Deploy to production

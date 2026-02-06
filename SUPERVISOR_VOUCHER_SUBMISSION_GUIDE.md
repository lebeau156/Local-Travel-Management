# Supervisor Travel Voucher Submission Guide

## Overview
Supervisors (FLS, SCSI, PHV) can now create, digitally sign, and submit their own travel vouchers for approval through the proper hierarchical chain.

---

## Approval Workflow

### For SCSI (Senior Consumer Safety Inspector)
1. **SCSI** creates trip and voucher
2. **SCSI** digitally signs the voucher
3. **SCSI** submits voucher → goes to **FLS** for approval
4. **FLS** reviews and approves → forwards to **Fleet Manager**
5. **Fleet Manager** provides final approval
6. Voucher is marked as **Approved** and ready for payment

### For PHV (Public Health Veterinarian) / SPHV (Supervisory PHV)
1. **PHV/SPHV** creates trip and voucher
2. **PHV/SPHV** digitally signs the voucher
3. **PHV/SPHV** submits voucher → goes to **FLS** for approval
4. **FLS** reviews and approves → forwards to **Fleet Manager**
5. **Fleet Manager** provides final approval
6. Voucher is marked as **Approved** and ready for payment

### For FLS (Front Line Supervisor)
1. **FLS** creates trip and voucher
2. **FLS** digitally signs the voucher
3. **FLS** submits voucher → goes to **DDM** for approval
4. **DDM** reviews and approves → forwards to **Fleet Manager**
5. **Fleet Manager** provides final approval
6. Voucher is marked as **Approved** and ready for payment

---

## Step-by-Step Instructions

### Step 1: Create Your Trip
1. Login to the system with your supervisor credentials
2. Navigate to **"My Trips"** from the sidebar menu (🚗)
3. Click **"+ New Trip"** button
4. Fill in trip details:
   - **Date**: Trip date
   - **From Address**: Starting location
   - **To Address**: Destination
   - **Site Name**: Plant/facility name (if applicable)
   - **Purpose**: Reason for travel
   - **Mileage**: Auto-calculated using Google Maps API
   - **Expenses**: Lodging, meals, per diem, other expenses
5. Click **"Save Trip"**

### Step 2: Create Monthly Voucher
1. Navigate to **"My Vouchers"** from the sidebar menu (📄)
2. Click **"+ Create New Voucher"** button
3. Select **Month** and **Year**
4. Click **"Create Voucher"**
5. System automatically includes all trips from that month

### Step 3: Complete Voucher Information (AD-616 Form)
1. Click on the voucher to open the **AD-616 Travel Voucher Form**
2. Complete **Section A - Employee Information**:
   - Box 1: Name (auto-filled from profile)
   - Box 2: SSN Last 4 Digits
   - Box 3: Position Title (auto-filled)
   - Box 4: Official Duty Station
   - Box 5-8: Pay Period information
   - Box 9: Home Address
   - Box 10: Employee ID (auto-filled)

3. Review **Section B - Travel Details** (auto-populated from trips)

4. Review **Section C - Expense Summary** (auto-calculated)

### Step 4: Digital Signature
1. Scroll to **Section A - Box 11: Claimant's Signature**
2. Click **"🔐 Sign Digitally"** button
3. Verify all required fields are complete
4. Read the certification statement:
   ```
   🔐 ELECTRONIC SIGNATURE CERTIFICATION
   
   By clicking OK, you electronically sign this travel voucher and certify that:
   
   ✓ This voucher is correct and accurate
   ✓ You understand this is a legally binding electronic signature
   ```
5. Click **"OK"** to digitally sign
6. You will see a green confirmation box:
   ```
   ✅ Digitally signed by [Your Name]
   Date: [Timestamp]
   ```

### Step 5: Submit for Approval
1. After digitally signing, click **"✅ Submit for Approval"** button
2. Confirm submission when prompted
3. Voucher status changes to **"Submitted"**
4. Your supervisor (FLS or DDM) will be notified

---

## Approval Process for Reviewing Supervisors

### For FLS Reviewing SCSI/PHV Vouchers
1. Navigate to **"Approvals"** dashboard
2. See pending vouchers from SCSI/PHV team members
3. Click on voucher to review:
   - Verify employee information
   - Review trip details and dates
   - Check expense calculations
   - Validate digital signature
4. Take action:
   - **Approve**: Click "✅ Approve & Forward to Fleet Manager"
   - **Reject**: Click "❌ Reject" and provide reason
5. After approval, voucher goes to Fleet Manager queue

### For DDM Reviewing FLS Vouchers
1. Navigate to **"Approvals"** dashboard
2. See pending vouchers from FLS supervisors
3. Review and approve same as above
4. Forward to Fleet Manager for final approval

### For Fleet Manager (Final Approval)
1. Navigate to **"Fleet Approvals"** dashboard
2. See all supervisor-approved vouchers
3. Review and provide final approval
4. Voucher status becomes **"Approved"** and ready for payment processing

---

## Important Notes

### Digital Signature Requirements
- ✅ **Legally Binding**: Digital signatures have the same legal weight as handwritten signatures
- ✅ **Timestamp**: Each signature includes date and time stamp (EST)
- ✅ **Audit Trail**: All signatures are logged in the Activity Log
- ⚠️ **Cannot Edit After Signing**: Once signed and submitted, voucher cannot be modified
- ⚠️ **Reject & Resubmit**: If rejected, you must fix issues and re-sign before resubmitting

### Position-Based Routing
The system automatically routes vouchers based on your position:
- System reads your **Position** field from your profile
- Voucher is sent to the correct approver based on organizational hierarchy
- **Important**: Ensure your position is correctly set in **Profile Setup**

### Voucher Status Flow
1. **Draft** - Voucher created, not yet signed
2. **Submitted** - Signed and submitted, awaiting supervisor approval
3. **Supervisor Approved** - Approved by FLS/DDM, awaiting Fleet Manager
4. **Approved** - Final approval by Fleet Manager, ready for payment
5. **Rejected** - Returned to employee with reason for corrections

---

## Troubleshooting

### Problem: Cannot Submit Voucher
**Solution**: Ensure you have:
1. Completed all required fields in Section A
2. Digitally signed the voucher (green signature box visible)
3. Set your Position in Profile Setup
4. At least one trip in the voucher month

### Problem: Voucher Not Showing in Supervisor's Queue
**Solution**: Check that:
1. Your supervisor is correctly assigned in Team Management
2. Your position is correctly set (SCSI/PHV/FLS)
3. Voucher status is "Submitted"
4. Supervisor has logged in and refreshed their dashboard

### Problem: Digital Signature Button Disabled
**Solution**: Complete all required fields:
- Box 2: SSN Last 4 Digits (must be exactly 4 digits)
- Box 4: Official Duty Station
- Box 9: Home Address
- All trip details must be valid

---

## Contact Support
For technical issues or questions about the voucher submission process, contact your system administrator or IT support team.

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**System**: USDA Travel Mileage System

# Audit Logging Feature - Explanation

## What is Audit Logging?

**Audit logging** is a security feature that automatically records every important action in the system. Think of it like a security camera for your data - it tracks:

- **WHO** performed the action (which user)
- **WHAT** they did (created/updated/deleted)
- **WHEN** it happened (timestamp)
- **WHERE** from (IP address)
- **DETAILS** about the change (what data was affected)

## Why is it Important?

### 1. **Security & Compliance**
Government organizations like USDA are required by law to maintain audit trails showing who accessed or modified data.

### 2. **Accountability**
If someone deletes an important trip or voucher, you can see:
- Who deleted it
- When they deleted it
- What the trip details were before deletion

### 3. **Troubleshooting**
If a voucher has wrong data, you can trace back to see:
- When it was created
- Who modified it
- What changes were made

### 4. **Fraud Detection**
Unusual patterns like:
- Multiple deletions in a short time
- Actions from suspicious IP addresses
- Changes made outside business hours

## What Do the Columns Mean?

### DATE/TIME
When the action occurred. Example: `1/15/2026, 8:32:42 PM`

### USER
Who performed the action. Shows the user's full name. Example: `Mohamed Diallo`

### ACTION
What type of action was performed:
- **Create Trip** (green badge) - New trip added
- **Update Trip** (blue badge) - Trip modified  
- **Delete Trip** (red badge) - Trip removed
- **Create Voucher** (green badge) - New voucher created
- **Submit Voucher** (purple badge) - Voucher submitted for approval
- **Approve/Reject Voucher** - Approval workflow actions

### ENTITY
What was affected. Example: `trip #19` means Trip with ID 19

### DETAILS
Shows the specific data:
- For trips: `from: Location A, to: Location B, miles: 27`
- For vouchers: `month: 2, year: 2025, tripCount: 10, totalAmount: 523.43`

### IP ADDRESS
The IP address of the user's computer when they performed the action.

**What is `::1`?**
- `::1` is the IPv6 version of "localhost" (127.0.0.1)
- It appears when testing on the same computer
- In production, you'll see real IP addresses like:
  - `192.168.1.100` (internal network)
  - `203.0.113.45` (external internet)

**Why track IP addresses?**
- Detect if someone accessed the system from an unusual location
- Identify if multiple users are sharing accounts
- Help investigate security incidents

## Examples of When Audit Logs Are Useful

### Example 1: Missing Trip
**Scenario**: An inspector says "I created a trip to Plant A yesterday but it's gone!"

**Solution**: Check audit logs:
1. Filter by user = that inspector
2. Filter by date = yesterday
3. Look for CREATE_TRIP or DELETE_TRIP actions
4. You'll see if they created it and if someone deleted it

### Example 2: Incorrect Voucher Amount
**Scenario**: A voucher shows $800 but inspector claims it should be $600

**Solution**: Check audit logs:
1. Filter by Entity Type = voucher
2. Find that voucher ID
3. See CREATE_VOUCHER details showing initial amount
4. See UPDATE_VOUCHER if someone modified it
5. Determine who made the change and when

### Example 3: Unauthorized Access
**Scenario**: Vouchers are being approved when supervisors are on vacation

**Solution**: Check audit logs:
1. Filter by Action = APPROVE_VOUCHER
2. Check dates during vacation period
3. Look at IP addresses - are they from office or remote?
4. Identify if credentials were compromised

## Current Implementation

Your system logs these actions:

### Trip Actions:
- CREATE_TRIP - When inspector adds a new trip
- UPDATE_TRIP - When inspector edits trip details
- DELETE_TRIP - When inspector removes a trip

### Voucher Actions:
- CREATE_VOUCHER - When voucher is generated from trips
- SUBMIT_VOUCHER - When inspector submits for approval
- APPROVE_VOUCHER_SUPERVISOR - When supervisor approves
- APPROVE_VOUCHER_FLEET - When fleet manager gives final approval
- REJECT_VOUCHER - When voucher is rejected
- REOPEN_VOUCHER - When voucher is reopened for edits
- DELETE_VOUCHER - When voucher is deleted

### Export Actions:
- EXPORT_TRIPS_EXCEL/CSV - When data is downloaded
- EXPORT_VOUCHER_EXCEL - When voucher is exported

## How to Use the Filters

### Filter by Action Type
Select specific action like "Create Trip" to see only trip creations.

### Filter by Entity Type
Select "trip" or "voucher" to see only that type of activity.

### Filter by Date Range
Set Start Date and End Date to see activity in a specific time period.

### Example Queries:
1. "Show me all vouchers created last month"
   - Entity Type: voucher
   - Action: Create Voucher
   - Start Date: 12/01/2025
   - End Date: 12/31/2025

2. "Show me who modified trips this week"
   - Entity Type: trip
   - Action: Update Trip
   - Start Date: (this week start)

3. "Show me all actions by inspector John Doe"
   - (Automatically filtered to your own actions as inspector)
   - Supervisors/admins can see all users

## Security Best Practices

1. **Review logs regularly** - Check for unusual patterns
2. **Don't share accounts** - Each user should have their own login
3. **Check IP addresses** - Verify logins from expected locations
4. **Investigate anomalies** - Multiple deletes, late-night changes, etc.
5. **Keep logs long-term** - Don't delete old audit logs (they're your evidence)

## Technical Notes

- Logs are stored in the `audit_log` database table
- Logs are created AFTER successful operations (not if operation fails)
- IP addresses are captured from HTTP request headers
- Details are stored as JSON for flexibility
- Logs are never modified or deleted (append-only)

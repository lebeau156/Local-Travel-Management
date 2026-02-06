# Employee ID Renamed to Plant Number

## Summary
Renamed "Employee ID" label to "Plant Number" throughout the system. The database field `employee_id` still stores the value, but the UI now displays it as "Plant Number" to better reflect that it represents the duty station plant number, not an employee identifier.

## Changes Made

### Frontend Files Updated:

1. **VoucherDetail.tsx**
   - Changed label from "Employee ID" to "Plant Number"
   - Changed to use `travel_auth_no` field instead of `employee_id` to show the plant number from profile

2. **TeamManagement.tsx**
   - Updated form label from "Employee ID" to "Plant Number"
   - Updated CSV template header from "Employee ID" to "Plant Number"
   - Updated tooltip text from "USDA employee ID" to "Plant identification number"

## Database Schema
- Database field remains `employee_id` (no schema changes required)
- UI displays this field as "Plant Number"
- The `travel_auth_no` field is used in voucher detail page to show the plant number

## User Impact
- All references to "Employee ID" in the user interface now show "Plant Number"
- No data migration required
- Existing data remains intact
- CSV import templates updated to reflect new terminology

## Testing
- Verify "Plant Number" label appears in:
  - Voucher detail page (Employee Information section)
  - Team Management add user form
  - CSV import template
  - Help tooltips

Date: 2026-01-30

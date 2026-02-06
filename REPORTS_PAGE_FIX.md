# Reports Page Auto-Logout Fix

## Problem
When fleet managers clicked on "Reports" in the navigation menu, they were automatically logged out.

## Root Cause
The `CustomReports.tsx` component was calling `/admin/users` endpoint on component mount to fetch the list of inspectors. Fleet managers don't have access to this admin-only endpoint, causing a 401/403 error which triggered an automatic logout.

```typescript
// OLD CODE - Line 43 in CustomReports.tsx
const response = await api.get('/admin/users');  // ❌ Admin-only endpoint
```

## Solution
Changed the endpoint to use `/analytics/filter-options` which is accessible to both admins and fleet managers.

### Changes Made

#### File: `frontend/src/pages/CustomReports.tsx`

1. **Updated User Interface** (lines 5-9):
```typescript
interface User {
  id: number;
  email: string;
  name?: string;  // Changed from first_name/last_name to name
}
```

2. **Fixed fetchInspectors function** (lines 41-50):
```typescript
const fetchInspectors = async () => {
  try {
    const response = await api.get('/analytics/filter-options');  // ✅ Accessible to fleet managers
    const inspectorsList = response.data.inspectors || [];
    setInspectors(inspectorsList);
  } catch (err) {
    console.error('Failed to fetch inspectors:', err);
  }
};
```

3. **Updated Inspector Display** (lines 218-223):
```typescript
{inspectors.map((inspector) => (
  <option key={inspector.id} value={inspector.id}>
    {inspector.name || inspector.email}  // ✅ Use name field from API
  </option>
))}
```

## Testing
✅ Fleet managers can now access the Reports page without being logged out
✅ Inspector dropdown is populated correctly with all inspectors
✅ Report generation still works as expected
✅ Excel export functionality remains intact

## Additional Notes
- The `/analytics/filter-options` endpoint returns inspectors with the format: `{ id, email, name }`
- This is the same endpoint used by the Analytics dashboard for advanced filtering
- No backend changes were required

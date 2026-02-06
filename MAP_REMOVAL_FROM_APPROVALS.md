# Circuit Plants Map Removal from Approvals Pages

## Change Summary
Removed the Circuit Plants Location Map from the approval-focused supervisor dashboards, keeping it only on the main dashboards and the Circuit Plants management page.

## Date
January 27, 2026

## Rationale
The user requested to keep the Circuit Plants map only on:
1. **My Dashboard** pages (FLS Dashboard specifically)
2. **Circuit Plants** management page

And remove it from:
1. **Approvals** page (SupervisorDashboard.tsx)
2. **SCSI Team** page (ScsiSupervisorDashboard.tsx)

These approval-focused pages are for managing team members and reviewing vouchers, so the map was taking up unnecessary space.

## Files Modified

### 1. `frontend/src/pages/SupervisorDashboard.tsx` (Approvals Page)

**Removed:**
- Import: `useRef` from React
- Import: `MapPin` icon from lucide-react
- Import: `loadGoogleMapsScript` utility
- Interface: `CircuitPlant`
- State: `plants` array
- Refs: `mapRef` and `googleMapRef`
- Function: `fetchPlants()`
- Function: `initializeMap()`
- useEffect: Map initialization effect with `[plants, loading]` dependencies
- JSX: Entire Circuit Plants Map section (lines 364-380)

**Result:**
- Cleaner imports and state management
- Removed ~100 lines of unused code
- Page focuses purely on voucher approvals and team management

### 2. `frontend/src/pages/ScsiSupervisorDashboard.tsx` (SCSI Team Page)

**Removed:**
- Import: `useRef` from React
- Import: `MapPin` icon from lucide-react
- Import: `loadGoogleMapsScript` utility
- Interface: `CircuitPlant`
- State: `plants` array
- Refs: `mapRef` and `googleMapRef`
- Function: `fetchPlants()`
- Function: `initializeMap()`
- useEffect: Map initialization effect with `[plants, loading]` dependencies
- JSX: Entire Circuit Plants Map section (lines 458-474)

**Result:**
- Removed ~100 lines of unused code
- Page focuses on inspector team management and assignment requests
- Cleaner layout without the map taking vertical space

### 3. `frontend/src/pages/FlsDashboard.tsx` (FLS Dashboard - KEPT MAP)

**No Changes**
- Map remains fully functional
- 600px height map with search box
- Interactive markers and plant details
- This is the main dashboard for FLS supervisors

### 4. `frontend/src/pages/CircuitPlants.tsx` (Circuit Plants Management - KEPT MAP)

**No Changes**
- Map remains fully functional
- Full CRUD operations for managing plants
- Address autocomplete with Google Places
- Interactive map with markers and info windows

## Current Map Locations

| Page | Route | Has Map? | Purpose |
|------|-------|----------|---------|
| FLS Dashboard | `/supervisor/fls-dashboard` | ✅ Yes | Main dashboard with circuit overview |
| PHV/Supervisor Dashboard (Approvals) | `/supervisor/dashboard` | ❌ No | Voucher approval workflow |
| SCSI Team Dashboard | `/supervisor/scsi-dashboard` | ❌ No | Inspector team management |
| Circuit Plants Management | `/supervisor/circuit-plants` | ✅ Yes | Full CRUD for circuit plants |

## Benefits

1. **Improved Focus**: Approval pages now focus on their primary purpose (reviewing vouchers)
2. **Reduced Clutter**: Removed large map component (400px height) from pages where it's not needed
3. **Better Performance**: Less JavaScript execution and fewer API calls on approval pages
4. **Code Cleanliness**: Removed ~200 lines of unused code across two files
5. **Clear Separation**: Map management is clearly separated from approval workflows

## User Experience

**Before:**
- Users saw the circuit plants map on every supervisor page, even when just reviewing vouchers
- Map took up significant vertical space, pushing approval content down
- Confusing UX: "Why do I see a map when I'm trying to approve vouchers?"

**After:**
- Approval pages are focused and streamlined
- Map is available where it makes sense (FLS Dashboard for overview, Circuit Plants for management)
- Clear mental model: "Dashboard = Overview, Approvals = Workflow, Circuit Plants = Management"

## Testing

After refreshing the browser, verify:

1. ✅ FLS Dashboard (`/supervisor/fls-dashboard`) - Map should be present
2. ❌ Approvals (`/supervisor/dashboard`) - Map should be gone
3. ❌ SCSI Team (`/supervisor/scsi-dashboard`) - Map should be gone
4. ✅ Circuit Plants (`/supervisor/circuit-plants`) - Map should be present

## No Breaking Changes

- All removed code was self-contained (map-related only)
- No impact on approval workflow logic
- No impact on team management features
- No API changes required

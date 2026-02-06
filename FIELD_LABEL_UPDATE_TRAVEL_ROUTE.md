# Field Label Update: Plant/Site Name → Travel Route

**Date:** January 30, 2026  
**Change:** Renamed "Plant/Site Name" field to "Travel Route"  
**Status:** ✅ Complete

---

## Changes Made

### 1. Add Trip Form Label
**File:** `frontend/src/pages/AddTrip.tsx`

**Before:**
```
Plant/Site Name
```

**After:**
```
Travel Route
```

### 2. Add Trip Form Placeholder
**File:** `frontend/src/pages/AddTrip.tsx`

**Before:**
```
e.g., ABC Processing Plant
```

**After:**
```
e.g., Route 66 - Springfield to Chicago
```

### 3. Trip List Search Placeholder
**File:** `frontend/src/pages/Trips.tsx`

**Before:**
```
Search by location, site name, or notes...
```

**After:**
```
Search by location, route, or notes...
```

---

## What This Field Represents

The field now more accurately reflects its purpose - to describe the travel route or destination name rather than specifically a plant or site location.

**Examples of what users can enter:**
- `Route 66 - Springfield to Chicago`
- `I-95 Corridor Inspection`
- `Northern District Route`
- `Plant ABC - Richmond Facility` (still valid!)
- `Downtown Office Visit`

---

## Database Field

**Note:** The database column name remains `site_name` for backward compatibility. Only the UI labels have changed.

---

## Files Modified

1. `frontend/src/pages/AddTrip.tsx` - Form label and placeholder
2. `frontend/src/pages/Trips.tsx` - Search placeholder text

---

## Testing

**Test:** 
1. Go to http://localhost:5173/trips/add
2. Verify the label shows "Travel Route" instead of "Plant/Site Name"
3. Verify the placeholder shows a route example
4. Create a trip and verify it saves correctly

**Expected Result:**
- ✅ Label displays "Travel Route"
- ✅ Placeholder suggests route format
- ✅ Field still saves to database correctly
- ✅ Existing trips with site_name still display properly

---

**Status:** ✅ Complete - Refresh browser to see changes

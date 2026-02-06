# Circuit Plants Map - Debug Notes
**Date**: January 30, 2026
**Status**: Database seeded with 12 plants, but frontend showing "0 plants"

## Current Situation

### ✅ What's Working
1. Backend server running on port 5000
2. Frontend server running on port 5176
3. Database table `circuit_plants` exists with correct schema
4. 12 sample plants inserted successfully:
   - Elizabeth: 2 plants
   - Linden: 2 plants
   - Woodbridge: 2 plants
   - Cranford: 1 plant
   - Edison: 1 plant
   - Union: 1 plant
   - Carteret: 1 plant
   - Sayreville: 1 plant
   - S. Plainfield: 1 plant
5. Google Maps loads correctly on the page

### ❌ What's NOT Working
1. Frontend shows "Showing all 0 plants across 0 cities"
2. No markers appearing on map
3. City filter shows "All Cities 0"

## Root Cause Analysis

The issue is that the frontend cannot fetch plants from `/api/circuit-plants` endpoint because:

1. **Authentication Required**: The API endpoint requires JWT token
2. **Frontend API Call**: The `CircuitPlantsMap.tsx` component is making the request but either:
   - Not including auth token in headers
   - Getting 401 Unauthorized response
   - Not handling the error properly

## Files to Check Tomorrow

### 1. CircuitPlantsMap.tsx
**Location**: `frontend/src/pages/CircuitPlantsMap.tsx`
**Check**: 
- Line ~50-80: `fetchPlants()` function
- Verify axios call includes authentication headers
- Check error handling in catch block
- Add console.log to see actual error

### 2. Backend Route Protection
**Location**: `backend/src/routes/circuitPlants.js`
**Check**:
- Line ~7: `router.use(authenticateToken)` - this requires auth for ALL routes
- Consider making GET routes public or ensuring frontend sends token

### 3. API Service Configuration
**Location**: `frontend/src/services/api.ts` or axios config
**Check**:
- Verify axios interceptor adds `Authorization: Bearer ${token}` header
- Check if token is being retrieved from localStorage

## Quick Fix Options

### Option 1: Make GET endpoints public (Quick)
Remove authentication requirement from GET routes:
```javascript
// backend/src/routes/circuitPlants.js
router.get('/', circuitPlantsController.getAllPlants); // Public
router.get('/cities', circuitPlantsController.getCities); // Public
router.use(authenticateToken); // Only protect below routes
router.post('/', circuitPlantsController.createPlant);
router.put('/:id', circuitPlantsController.updatePlant);
router.delete('/:id', circuitPlantsController.deletePlant);
```

### Option 2: Fix Frontend Auth Headers (Proper)
Ensure CircuitPlantsMap.tsx uses authenticated axios instance:
```typescript
// Use api service instead of direct axios
import api from '../services/api';

const fetchPlants = async () => {
  try {
    const response = await api.get('/circuit-plants'); // Uses auth token
    setPlants(response.data);
  } catch (error) {
    console.error('Failed to fetch plants:', error);
  }
};
```

## Testing Commands

```powershell
# Check database
node check-circuit-plants.js

# Test API with auth
# First get token by logging in, then:
$token = "your_jwt_token_here"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5000/api/circuit-plants" -Headers $headers

# Check backend logs
# Look at backend server output for error messages
```

## Database Verification

```javascript
// Run: node check-circuit-plants.js
// Expected output:
Table exists: Yes
Total plants: 12

Plants in database:
- M33789: United Premium Foods (Elizabeth)
- M18574: Elite Foods Inc (Elizabeth)
- M9841: Quality Meats Processing (Linden)
- G5672: Garden State Poultry (Linden)
- M7523: Premium Protein Corp (Cranford)
- M33790: Northeast Food Distributors (Woodbridge)
- P8854: Woodbridge Processing LLC (Woodbridge)
- M6421: Edison Meat Market (Edison)
- M9512: Union County Foods (Union)
- M8741: Carteret Processing Center (Carteret)
- M7896: Sayreville Meat Solutions (Sayreville)
- M5236: South Plainfield Foods (S. Plainfield)
```

## Next Steps for Tomorrow

1. **Open browser console** (F12) and check for errors when loading Circuit Plants Map
2. **Check Network tab** to see the API request/response:
   - Status code (should be 200, probably getting 401)
   - Request headers (should have Authorization)
   - Response body (error message will help)
3. **Apply fix** based on what we find:
   - If 401: Fix authentication headers in frontend
   - If 500: Check backend error logs
   - If CORS: Add CORS headers for GET requests
4. **Verify fix** by refreshing page and seeing 12 plants on map

## Expected Final Result

When working correctly:
- Map shows "Showing all 12 plants across 9 cities"
- 12 colored markers on map in NJ area
- City filter shows counts (Elizabeth: 2, Linden: 2, etc.)
- Clicking markers shows plant info
- "Add Plant" and bulk import work

## Support Files Created

- `check-circuit-plants.js` - Verify database contents
- `seed-circuit-plants.js` - Add sample plants (already run)
- `CIRCUIT_PLANTS_DEBUG_NOTES.md` - This file

---

**Resume Point**: Check browser console for errors and API network requests to determine authentication issue.

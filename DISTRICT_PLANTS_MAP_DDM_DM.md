# District Plants Map for DDM/DM - Implementation Complete

## Feature Overview
Added a nationwide plant visualization map specifically for **District Director Managers (DDM)** and **Director Managers (DM)** with advanced multi-level filtering and distance measurement capabilities.

## Implementation Date
January 31, 2026

## What's Different from FLS Map?

### For FLS/SCSI/PHV Supervisors:
- **Circuit Plants Map**: Shows plants in their local circuit only
- **Filter by**: City (within their circuit)
- **Scope**: Limited to assigned circuit area

### For DDM/DM:
- **District Plants Map**: Shows ALL plants across ALL states
- **Filter by**: State → Circuit → City (hierarchical)
- **Scope**: Nationwide view for district-level management

## Features

### 1. **Multi-Level Hierarchical Filters**

#### Level 1: State Filter
- View plants by state (NJ, NY, PA, CT, MA, etc.)
- Each state has a unique color on the map
- Shows plant count per state
- "All States" button to view everything

#### Level 2: Circuit Filter (Dynamic)
- Appears when a state is selected
- Shows only circuits within the selected state
- "All Circuits" option to view all in that state
- Plant count per circuit

#### Level 3: City Filter (Dynamic)
- Shows cities within selected state/circuit
- Scrollable list for many cities
- "All Cities" option
- Plant count per city

### 2. **State-Based Color Coding**

Plants are colored by state instead of city:
- **NJ (New Jersey)**: Red
- **NY (New York)**: Green
- **PA (Pennsylvania)**: Blue
- **CT (Connecticut)**: Magenta
- **MA (Massachusetts)**: Gold
- **MD (Maryland)**: Cyan
- **VA (Virginia)**: Orange
- **DE (Delaware)**: Purple
- **VT (Vermont)**: Hot Pink
- **NH (New Hampshire)**: Brown
- **RI (Rhode Island)**: Gray
- **ME (Maine)**: Teal
- And more...

### 3. **Distance Measurement Tool**
- Measure driving distance between any two plants
- Click first plant → click second plant
- Displays:
  - Driving distance (miles)
  - Estimated drive time (minutes)
  - Blue route line on map
- Works nationwide (not limited to one circuit)

### 4. **Plant Management**
- Add new plants anywhere in the country
- Edit existing plant details
- Assign inspectors to plants
- Geocode addresses automatically
- Bulk import via CSV

### 5. **Nationwide Legend**
- Shows all states with plant counts
- Color-coded by state
- Top 5 plants listed per state in print view
- Professional print layout

## Technical Implementation

### New Files Created

#### Frontend
- `frontend/src/pages/DistrictCircuitPlantsMap.tsx` (830 lines)
  - React component for DDM/DM map
  - Multi-level filtering logic
  - State-based markers and legend
  - Distance measurement integration

### Backend Updates

#### Modified Files
- `backend/src/controllers/circuitPlantsController.js`
  - Added `state` filter to `getAllPlants()`
  - New endpoint: `getStates()` - Returns all states with counts
  - New endpoint: `getCircuits()` - Returns circuits (optionally filtered by state)
  - Updated `getCities()` - Now accepts state/circuit filters

- `backend/src/routes/circuitPlants.js`
  - Added `GET /api/circuit-plants/states` route
  - Added `GET /api/circuit-plants/circuits?state=XX` route
  - Updated cities endpoint to support filtering

### Database Schema
No changes required - uses existing `circuit_plants` table with:
- `state` column (2-letter state code)
- `circuit` column (circuit identifier)
- `city` column (city name)

### Routing
- `frontend/src/App.tsx`
  - New route: `/supervisor/district-plants-map`
  
- `frontend/src/components/Layout.tsx`
  - Menu logic: DDM/DM see "District Plants Map"
  - Menu logic: Other supervisors see "Circuit Plants Map"

## API Endpoints

### New Endpoints

#### 1. Get All States
```
GET /api/circuit-plants/states
```
Response:
```json
[
  { "state": "NJ", "plant_count": 45 },
  { "state": "NY", "plant_count": 32 },
  { "state": "PA", "plant_count": 28 }
]
```

#### 2. Get Circuits (Optional State Filter)
```
GET /api/circuit-plants/circuits
GET /api/circuit-plants/circuits?state=NJ
```
Response:
```json
[
  { "circuit": "Circuit A", "plant_count": 15 },
  { "circuit": "Circuit B", "plant_count": 12 }
]
```

#### 3. Get Plants (Enhanced with State Filter)
```
GET /api/circuit-plants?state=NJ
GET /api/circuit-plants?state=NJ&circuit=Circuit A
GET /api/circuit-plants?state=NJ&circuit=Circuit A&city=Elizabeth
```

## User Experience

### For DDM Users

1. **Login** as DDM (position must be "DDM" or "District Director Manager")
2. Navigate to **District Plants Map** in the menu
3. See **all plants nationwide** on the map at startup
4. Use filters to narrow down:
   - Click a state → see only that state's plants
   - Select a circuit → see only plants in that circuit
   - Choose a city → see only plants in that city
5. **Measure distances** between any plants nationwide
6. **Add/edit plants** from any state
7. **Print** a directory organized by state

### For DM Users
Same experience as DDM - full nationwide access.

### For FLS/SCSI/PHV Users
- Continue using **Circuit Plants Map** (unchanged)
- See only plants in their assigned circuit/area
- City-based filtering (not state-level)

## Permissions & Access Control

### Who Has Access?
- ✅ **DDM (District Director Manager)**: Full nationwide view
- ✅ **DM (Director Manager)**: Full nationwide view
- ❌ **FLS (First Line Supervisor)**: Circuit-level only (different map)
- ❌ **SCSI Supervisor**: Circuit-level only (different map)
- ❌ **Inspector**: No plant management access

### Detection Logic
Menu system checks user's `position` field in profile:
```javascript
const isDDM = position === 'DDM' || position === 'District Director Manager';
const isDM = position === 'DM' || position === 'Director Manager';

if (isDDM || isDM) {
  // Show "District Plants Map" menu item
  menuItems.push({ 
    path: '/supervisor/district-plants-map', 
    label: 'District Plants Map', 
    icon: '🗺️' 
  });
} else {
  // Show "Circuit Plants Map" menu item (local circuit only)
  menuItems.push({ 
    path: '/supervisor/circuit-plants-map', 
    label: 'Circuit Plants Map', 
    icon: '🗺️' 
  });
}
```

## Usage Examples

### Example 1: View All NJ Plants
1. Login as DDM
2. Open **District Plants Map**
3. Click **"NJ"** in the State filter panel
4. Map shows only New Jersey plants (colored red)
5. Circuit filter updates to show NJ circuits

### Example 2: Measure Distance Between States
1. Click **"Measure Distance"** button
2. Click a plant in **New Jersey** (e.g., Elizabeth plant)
3. Click a plant in **New York** (e.g., Brooklyn plant)
4. See driving distance: **"18.5 mi"** and time: **"32 mins"**
5. Blue route line shows the path

### Example 3: Find Plants in Specific Circuit
1. Select **"NJ"** state
2. Select **"Circuit A"** circuit
3. Map shows only plants in NJ Circuit A
4. City filter shows cities in that circuit
5. Click a city to narrow further

### Example 4: Add Plant in New State
1. Click **"Add Plant"** button
2. Fill in form:
   - Est Number: M12345
   - Est Name: ABC Foods
   - Address: 123 Main St
   - City: Boston
   - **State: MA**
   - Zip: 02101
   - Circuit: Circuit X
3. Save
4. Plant appears on map (gold color for MA)

## Benefits for DDM/DM

1. **Strategic Planning**: See all plants across the district
2. **Resource Allocation**: Identify coverage gaps by state/circuit
3. **Route Optimization**: Calculate distances between any locations
4. **Inspector Assignment**: Visual tool for assigning inspectors
5. **Coverage Analysis**: Understand plant distribution by geography
6. **Budget Planning**: Distance data for travel cost estimates
7. **Reporting**: Print state-level directories for meetings

## Performance Considerations

### Map Loading
- **Initial load**: Shows all plants (can be 100+ markers)
- **Zoom level 7**: Good overview of multi-state area
- **Markers**: Smaller scale (8px) to reduce clutter
- **Labels**: Only appear at zoom 11+ to avoid overlap

### Filtering Performance
- **State filter**: Fast (indexed on state column)
- **Circuit filter**: Fast (indexed on circuit column)
- **City filter**: Fast (indexed on city column)
- **Combined filters**: Uses AND logic, efficient query

### Distance Calculation
- **Google Directions API**: 2,500 free requests/day
- **Typical usage**: 10-50 calculations per user per day
- **Response time**: 1-3 seconds per calculation
- **Caching**: Not implemented (future enhancement)

## Future Enhancements

1. **Region Grouping**: Northeast, Southeast, Midwest, etc.
2. **Inspector Coverage Heatmap**: Color intensity by coverage ratio
3. **Multi-Stop Routes**: Calculate distance for 3+ plants
4. **Export Routes**: Download route maps as PDF with directions
5. **Plant Statistics**: Charts showing plants per state/circuit
6. **Historical Data**: Track plant additions/closures over time
7. **Custom Territories**: Define custom regions beyond states
8. **Offline Mode**: Cache plant data for offline viewing

## Testing Checklist

- [x] DDM user sees "District Plants Map" in menu
- [x] DM user sees "District Plants Map" in menu
- [x] FLS user sees "Circuit Plants Map" in menu (not District)
- [x] State filter works - shows plants by state
- [x] Circuit filter dynamically updates based on selected state
- [x] City filter shows cities in selected state/circuit
- [x] "All States" button shows nationwide view
- [x] State colors display correctly
- [x] Distance measurement works cross-state
- [x] Add plant works for any state
- [x] Edit plant works
- [x] Legend displays all states
- [x] Print function generates state-based directory
- [x] Map loads at appropriate zoom level (7)
- [x] Labels appear at zoom 11+

## Known Limitations

1. **No Region View**: Can't group states into regions (NE, SE, etc.)
2. **No Comparison Mode**: Can't compare two circuits side-by-side
3. **No Statistics Dashboard**: No charts/graphs for plant distribution
4. **Print Limitation**: Map itself doesn't print (only legend/directory)
5. **No Bulk Distance**: Can only measure one route at a time

## Deployment Notes

- ✅ No database migrations required
- ✅ Backend changes are backward-compatible
- ✅ Frontend changes don't affect existing FLS map
- ✅ Google Maps API already configured (Directions API enabled)
- ✅ No new npm packages required
- ✅ No environment variable changes needed

## Support Documentation

### For End Users
- See "District Plants Map User Guide" (to be created)
- Training video: "Nationwide Plant Management for District Managers"

### For Administrators
- Ensure user profiles have correct `position` field:
  - "DDM" or "District Director Manager" → sees District map
  - "DM" or "Director Manager" → sees District map
  - "FLS" → sees Circuit map only
  
### For Developers
- State colors defined in: `DistrictCircuitPlantsMap.tsx:10-26`
- Filtering logic: `DistrictCircuitPlantsMap.tsx:130-180`
- Backend endpoints: `backend/src/controllers/circuitPlantsController.js`

## Troubleshooting

### Issue: DDM sees Circuit Map instead of District Map
**Cause**: User's position field is not set to "DDM" or "DM"  
**Solution**: Update profile position in database or via Profile Setup page

### Issue: State filter showing no plants
**Cause**: No plants in database for that state  
**Solution**: Import plants via bulk import or add manually

### Issue: Distance measurement not working
**Cause**: Google Directions API not enabled  
**Solution**: Follow instructions in `ENABLE_DIRECTIONS_API_INSTRUCTIONS.md`

### Issue: Map shows all circuits for all states
**Cause**: Circuit filter not filtering by state  
**Solution**: Backend correctly passes state parameter - check API call

## Summary

The District Plants Map feature provides DDM and DM users with powerful nationwide plant visualization and management tools. With hierarchical filtering (State → Circuit → City), distance measurement, and full CRUD operations, district managers can effectively oversee multi-state operations and make data-driven decisions about resource allocation and inspector assignments.

The feature seamlessly integrates with the existing Circuit Plants Map for FLS users, maintaining separate views based on role while sharing the same underlying data and infrastructure.

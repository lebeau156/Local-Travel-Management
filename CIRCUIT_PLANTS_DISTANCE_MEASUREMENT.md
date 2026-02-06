# Circuit Plants Map - Distance Measurement Feature

## Feature Summary
Added interactive distance measurement tool to the Circuit Plants Map, allowing FLS (Front Line Supervisors) and SCSI users to calculate driving distance and time between any two plants on the map.

## Implementation Date
January 31, 2026

## What Was Added

### 1. **New UI Button - "Measure Distance"**
- Location: Top right header, between existing action buttons
- Color: Indigo (changes to red when active)
- Icon: Ruler icon from lucide-react
- Toggle: Click to enter/exit distance measurement mode

### 2. **Distance Measurement Mode**
When activated:
- Displays instruction panel explaining how to use the feature
- User clicks first plant (start point) → shows green marker
- User clicks second plant (end point) → shows blue marker and calculates route
- Displays driving distance and estimated drive time
- Draws blue route line on the map between the two plants

### 3. **Interactive Info Panel**
Shows real-time status:
- **Instructions**: Step-by-step guide for users
- **Start Point**: Selected first plant (green highlight)
- **End Point**: Selected second plant (blue highlight)
- **Distance Result**: Driving distance in miles and estimated time
- **Clear Button**: Reset and measure again

### 4. **Visual Indicators**
- **Selected start plant**: Green marker (larger, 12px scale)
- **Selected end plant**: Blue marker (larger, 12px scale)
- **Route line**: Blue polyline showing driving path
- **Other plants**: Normal colored markers by city

## Technical Implementation

### Key Files Modified
- `frontend/src/pages/CircuitPlantsMap.tsx`

### New Dependencies Used
- Google Maps Directions Service API (for route calculation)
- Google Maps Directions Renderer (for drawing routes)
- lucide-react icons: `Ruler`, `X`

### State Management
```typescript
const [distanceMeasureMode, setDistanceMeasureMode] = useState(false);
const [startPlant, setStartPlant] = useState<CircuitPlant | null>(null);
const [endPlant, setEndPlant] = useState<CircuitPlant | null>(null);
const [distanceInfo, setDistanceInfo] = useState<{ distance: string; duration: string } | null>(null);
const [calculatingDistance, setCalculatingDistance] = useState(false);
const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
```

### Core Functions Added

1. **`calculateDistance(start: CircuitPlant, end: CircuitPlant)`**
   - Uses Google Maps Directions Service
   - Calculates driving route between two coordinates
   - Extracts distance (miles) and duration (minutes)
   - Renders route polyline on map

2. **`toggleDistanceMeasureMode()`**
   - Enters/exits distance measurement mode
   - Clears selections and routes when exiting
   - Closes info windows when entering

3. **`clearDistanceMeasurement()`**
   - Resets start/end plant selections
   - Clears route from map
   - Allows measuring again

4. **`handleMarkerClick(plant: CircuitPlant)` - Enhanced**
   - Original: Opens info window for plant details
   - Enhanced: In distance mode, handles plant selection logic
   - First click → set start plant
   - Second click → set end plant and calculate
   - Third click → reset and start over

5. **`getMarkerIcon(city: string, plant?: CircuitPlant)` - Enhanced**
   - Original: Returns colored marker based on city
   - Enhanced: Returns larger green/blue markers for selected plants in distance mode

## Usage Instructions for End Users

### How to Measure Distance Between Plants

1. **Enable Distance Mode**
   - Click the "Measure Distance" button (indigo, with ruler icon)
   - The button turns red and shows "Exit Distance Mode"
   - An instruction panel appears above the map

2. **Select Start Plant**
   - Click on any plant marker on the map
   - The plant turns into a larger **green marker**
   - Start point info appears in the panel

3. **Select End Plant**
   - Click on a different plant marker
   - The plant turns into a larger **blue marker**
   - A blue route line appears connecting the two plants

4. **View Results**
   - Distance panel shows:
     - **Driving Distance**: e.g., "5.2 mi"
     - **Drive Time**: e.g., "12 mins"
   - Route is visible on the map with directions

5. **Measure Again**
   - Click "Clear & Measure Again" button
   - OR click a new plant to restart
   - OR exit distance mode to return to normal map

6. **Exit Distance Mode**
   - Click "Exit Distance Mode" button (red)
   - OR click the X icon in the info panel
   - Returns to normal map view

## Use Cases

### 1. Route Planning
FLS can plan optimal inspection routes by measuring distances between multiple plants in their circuit.

### 2. Travel Time Estimation
Calculate realistic travel times for inspector schedules and daily route assignments.

### 3. Mileage Verification
Cross-check reported travel mileage against actual driving distances between plants.

### 4. Circuit Optimization
Identify opportunities to group nearby plants for efficiency.

## Google Maps API Requirements

### APIs Used
- **Maps JavaScript API**: For base map rendering
- **Directions API**: For route calculation and distance measurement

### API Key Configuration
- Backend: `GOOGLE_MAPS_API_KEY` in `backend/.env`
- Frontend: `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`
- Both should use the same Google Cloud API key

### API Quotas
- Directions API: 2,500 free requests per day
- Each distance calculation = 1 request
- Typical usage: 10-50 requests per day per active user

## Benefits

1. **Eliminates Manual Calculation**: No need for separate mapping tools
2. **Real-Time Data**: Uses current traffic patterns for time estimates
3. **Visual Feedback**: Clear route display helps understand the path
4. **Easy to Use**: Simple click interface, no training needed
5. **Integrated Workflow**: No need to leave the USDA system

## Future Enhancements (Not Implemented Yet)

1. **Multi-Stop Routes**: Calculate distance for 3+ plants in sequence
2. **Save Routes**: Store frequently used routes for quick access
3. **Export Routes**: Download route maps as PDF
4. **Alternative Routes**: Show multiple route options
5. **Toll Road Options**: Toggle whether to use toll roads
6. **Traffic Overlay**: Real-time traffic data on routes

## Testing Checklist

- [x] Distance mode activates/deactivates correctly
- [x] First plant selection shows green marker
- [x] Second plant selection shows blue marker
- [x] Route line appears between plants
- [x] Distance and duration display correctly
- [x] Clear button resets everything
- [x] Exit mode removes all distance UI
- [x] Works with city filters active
- [x] Works with zoom in/out
- [x] Print function excludes distance panel (no-print class)

## Known Limitations

1. **Print Compatibility**: Distance measurement panel hidden in print mode
2. **Two Plants Only**: Cannot measure multi-stop routes in current version
3. **Driving Only**: No walking, biking, or public transit options
4. **API Dependency**: Requires Google Maps API to be available and within quota

## Deployment Notes

- No database changes required
- No backend changes required
- Frontend-only feature
- Requires Google Maps API key with Directions API enabled
- No additional npm packages needed (uses existing @react-google-maps/api)

## Support & Documentation

For questions or issues:
- See Circuit Plants Map user guide
- Check Google Maps API dashboard for quota usage
- Verify API key has Directions API enabled
- Ensure API key restrictions allow both Maps JavaScript API and Directions API

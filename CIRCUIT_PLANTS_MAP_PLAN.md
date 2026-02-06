# Enhanced Circuit Plants Map Feature - Implementation Plan

## Overview
Create an enhanced Circuit Plants map for FLS supervisors with color-coded markers by city, filtering, inspector assignments, and print functionality.

## Requirements
Based on the Excel sheet provided:
- **Plants**: ~50+ plants across multiple cities (Elizabeth, Linden, Cranford, Woodbridge, Edison, Clark, Union, Middlesex, Carteret, Sayreville, Avenel, Piscataway, Branchburg, Keasbey, Warren, S. Plainfield)
- **Data Fields**: Tour of duty, Est #, Shift, Est. Name, Address, City, Zip
- **Features**:
  1. Color-code plants by city
  2. Filter plants by city
  3. Show assigned inspector for each plant
  4. Click on marker to see plant details
  5. Print map with legend
  6. Bulk import plants from CSV/Excel

## Database Schema

### Create `circuit_plants` table
```sql
CREATE TABLE circuit_plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  est_number TEXT NOT NULL UNIQUE,        -- e.g., "M/P33789", "G1610"
  est_name TEXT NOT NULL,                 -- Plant name
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'NJ',
  zip_code TEXT,
  latitude REAL,                          -- Geocoded coordinates
  longitude REAL,
  circuit TEXT,                           -- e.g., "8020-Elizabeth, NJ"
  shift INTEGER,                          -- 1 or 2
  tour_of_duty TEXT,                      -- e.g., "0700-1530"
  assigned_inspector_id INTEGER,          -- FK to users table
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_inspector_id) REFERENCES users(id)
);

CREATE INDEX idx_circuit_plants_city ON circuit_plants(city);
CREATE INDEX idx_circuit_plants_circuit ON circuit_plants(circuit);
CREATE INDEX idx_circuit_plants_inspector ON circuit_plants(assigned_inspector_id);
```

## Backend Implementation

### 1. API Endpoints (`backend/src/controllers/circuitPlantsController.js`)

```javascript
// GET /api/circuit-plants - Get all plants (with optional city filter)
exports.getAllPlants = (req, res) => {
  const { city, inspector_id, circuit } = req.query;
  // Return plants with assigned inspector info
};

// POST /api/circuit-plants - Create new plant
exports.createPlant = (req, res) => {
  // Geocode address to get lat/lng using Google Maps API
  // Insert into database
};

// PUT /api/circuit-plants/:id - Update plant
exports.updatePlant = (req, res) => {
  // Update plant details
  // Re-geocode if address changed
};

// DELETE /api/circuit-plants/:id - Delete plant
exports.deletePlant = (req, res) => {};

// POST /api/circuit-plants/bulk-import - Import plants from CSV
exports.bulkImport = (req, res) => {
  // Parse CSV
  // Geocode all addresses
  // Bulk insert
};

// GET /api/circuit-plants/cities - Get unique cities with plant count
exports.getCities = (req, res) => {
  // Return list of cities with plant counts for filter UI
};
```

### 2. Geocoding Service
```javascript
// backend/src/services/geocodingService.js
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function geocodeAddress(address, city, state, zip) {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.results[0]) {
    return {
      lat: data.results[0].geometry.location.lat,
      lng: data.results[0].geometry.location.lng
    };
  }
  return null;
}
```

## Frontend Implementation

### 1. Enhanced Circuit Plants Map Component
**File**: `frontend/src/pages/CircuitPlantsMap.tsx`

**Features**:
- Interactive Google Map with custom markers
- Color-coded markers by city (using distinct colors)
- Info window on marker click showing:
  - Plant name
  - Est #
  - Address
  - Tour of duty / Shift
  - Assigned inspector
- Filter panel for cities
- Legend showing city colors
- Print button
- Add/Edit plant modal

### 2. City Color Scheme
```typescript
const CITY_COLORS = {
  'Elizabeth': '#FF0000',      // Red
  'Linden': '#00FF00',         // Green
  'Cranford': '#0000FF',       // Blue
  'Woodbridge': '#FF00FF',     // Magenta
  'Edison': '#FFFF00',         // Yellow
  'Union': '#00FFFF',          // Cyan
  'Middlesex': '#FFA500',      // Orange
  'Clark': '#800080',          // Purple
  'Carteret': '#FFC0CB',       // Pink
  'Sayreville': '#A52A2A',     // Brown
  'Avenel': '#808080',         // Gray
  'Piscataway': '#008080',     // Teal
  'Branchburg': '#FFD700',     // Gold
  'Keasbey': '#4B0082',        // Indigo
  'Warren': '#00FF7F',         // Spring Green
  'S. Plainfield': '#DC143C'   // Crimson
};
```

### 3. UI Components

#### Filter Panel
```typescript
<div className="filter-panel">
  <h3>Filter by City</h3>
  <div className="city-filters">
    <button onClick={() => setSelectedCity(null)}>All Cities ({totalPlants})</button>
    {cities.map(city => (
      <button 
        key={city.name}
        style={{ borderLeft: `4px solid ${CITY_COLORS[city.name]}` }}
        onClick={() => setSelectedCity(city.name)}
      >
        {city.name} ({city.count})
      </button>
    ))}
  </div>
</div>
```

#### Map Legend
```typescript
<div className="map-legend">
  <h4>Legend</h4>
  {Object.entries(CITY_COLORS).map(([city, color]) => (
    <div key={city} className="legend-item">
      <span style={{ backgroundColor: color }} className="color-box"></span>
      <span>{city}</span>
    </div>
  ))}
</div>
```

#### Print Functionality
```typescript
const handlePrint = () => {
  // Generate printable map with legend
  window.print();
};

// Add CSS for print media
@media print {
  .no-print { display: none; }
  .map-container { height: 800px; }
  .legend { display: block !important; }
}
```

### 4. Bulk Import Interface
**File**: `frontend/src/pages/CircuitPlantsBulkImport.tsx`

- CSV upload with template download
- Preview imported data
- Map preview before saving
- Validation (check for duplicates, missing addresses)
- Progress bar for geocoding

**CSV Template**:
```
Est #,Est. Name,Address,City,Zip,Circuit,Shift,Tour of duty,Assigned Inspector Email
M/P33789,United Premium Foods,1 Amboy Ave,Woodbridge,7095,8020-Elizabeth NJ,1,0700-1530,inspector@usda.gov
```

## Implementation Steps

### Phase 1: Database & Backend (2-3 hours)
1. Create migration to add `circuit_plants` table
2. Create `circuitPlantsController.js` with CRUD endpoints
3. Implement geocoding service
4. Create bulk import endpoint
5. Add routes to Express app
6. Test APIs with Postman

### Phase 2: Frontend Map (3-4 hours)
1. Create `CircuitPlantsMap.tsx` component
2. Integrate Google Maps with custom markers
3. Implement city-based color coding
4. Add marker click info windows
5. Add city filter panel
6. Add map legend
7. Style and responsive design

### Phase 3: Bulk Import UI (2 hours)
1. Create bulk import page
2. CSV parser and validator
3. Preview interface
4. Import progress tracking

### Phase 4: Print & Polish (1 hour)
1. Add print styles
2. Optimize map for printing
3. Add export options (PDF, PNG)
4. Testing across browsers

## User Workflow

### For FLS Supervisor:
1. Navigate to **Circuit Plants** menu
2. See map with all plants color-coded by city
3. Use city filter to focus on specific cities
4. Click plant marker to see:
   - Plant details
   - Assigned inspector
   - Tour schedule
5. Click "Print Map" to get printable version with legend
6. Click "Manage Plants" to add/edit/delete plants
7. Click "Import Plants" to bulk upload from Excel

### For Admin:
1. Same as FLS +
2. Assign/reassign inspectors to plants
3. Bulk import all circuit plants from Excel
4. Export plant list

## Benefits

1. **Visual Management**: See all plants at a glance with city-based organization
2. **Quick Reference**: Easily identify which inspector is assigned to which plant
3. **Print Ready**: Generate printable maps for field use
4. **Scalable**: Handle 50+ plants easily, can scale to hundreds
5. **Data Accuracy**: Geocoding ensures accurate map placement
6. **Filtering**: Quick access to plants by city or inspector

## Next Steps

Would you like me to proceed with implementation? I can start with:
1. Database schema and migration
2. Backend API endpoints
3. Frontend map component

Or would you prefer to review and adjust the plan first?

Date: 2026-01-30

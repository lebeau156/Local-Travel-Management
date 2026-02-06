import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import api from '../api/axios';
import { MapPin, Filter, Printer, Download, Plus, Edit, Ruler, X } from 'lucide-react';
import PlantManagementDialog from '../components/PlantManagementDialog';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader';

// City color scheme - 16 distinct colors for NJ cities
const CITY_COLORS: Record<string, string> = {
  'Elizabeth': '#FF0000',      // Red
  'Linden': '#00CC00',         // Green
  'Cranford': '#0066FF',       // Blue
  'Woodbridge': '#FF00FF',     // Magenta
  'Edison': '#FFD700',         // Gold
  'Union': '#00CCCC',          // Cyan
  'Middlesex': '#FF8C00',      // Orange
  'Clark': '#9370DB',          // Purple
  'Carteret': '#FF69B4',       // Hot Pink
  'Sayreville': '#8B4513',     // Brown
  'Avenel': '#808080',         // Gray
  'Piscataway': '#20B2AA',     // Teal
  'Branchburg': '#FFD700',     // Gold
  'Keasbey': '#4B0082',        // Indigo
  'Warren': '#00FF7F',         // Spring Green
  'S. Plainfield': '#DC143C',  // Crimson
  'South Plainfield': '#DC143C' // Crimson (alternative spelling)
};

interface CircuitPlant {
  id: number;
  est_number: string;
  est_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  circuit: string;
  shift: number;
  tour_of_duty: string;
  assigned_inspector_id: number | null;
  inspector_name: string | null;
  inspector_email: string | null;
  notes: string | null;
  is_active: boolean;
}

interface CityStats {
  city: string;
  plant_count: number;
}

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  minHeight: '600px'
};

// Center on New Jersey
const center = {
  lat: 40.7178,
  lng: -74.1639
};

const CircuitPlantsMap: React.FC = () => {
  const [plants, setPlants] = useState<CircuitPlant[]>([]);
  const [cities, setCities] = useState<CityStats[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<CircuitPlant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showManagementDialog, setShowManagementDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<CircuitPlant | null>(null);
  const [mapZoom, setMapZoom] = useState(10);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Distance measurement states
  const [distanceMeasureMode, setDistanceMeasureMode] = useState(false);
  const [startPlant, setStartPlant] = useState<CircuitPlant | null>(null);
  const [endPlant, setEndPlant] = useState<CircuitPlant | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Use custom Google Maps loader
  const { isLoaded, error: loadError } = useGoogleMapsLoader(GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    fetchPlants();
    fetchCities();
  }, [selectedCity]);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const params = selectedCity ? { city: selectedCity, active: 'true' } : { active: 'true' };
      const response = await api.get('/circuit-plants', { params });
      setPlants(response.data);
    } catch (error) {
      console.error('Failed to fetch plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/circuit-plants/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const handleMarkerClick = (plant: CircuitPlant) => {
    // If in distance measure mode, handle plant selection for distance calculation
    if (distanceMeasureMode) {
      if (!startPlant) {
        // First plant selected
        setStartPlant(plant);
        setEndPlant(null);
        setDistanceInfo(null);
      } else if (!endPlant) {
        // Second plant selected - calculate distance
        setEndPlant(plant);
        calculateDistance(startPlant, plant);
      } else {
        // Reset and start over with new plant
        setStartPlant(plant);
        setEndPlant(null);
        setDistanceInfo(null);
        // Clear previous route
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections({ routes: [] } as any);
        }
      }
    } else {
      // Normal mode - show info window
      setSelectedPlant(plant);
    }
  };

  const calculateDistance = async (start: CircuitPlant, end: CircuitPlant) => {
    if (!mapInstance || !isLoaded || typeof google === 'undefined') {
      alert('Map is not ready. Please try again.');
      return;
    }

    setCalculatingDistance(true);
    
    try {
      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin: { lat: start.latitude, lng: start.longitude },
        destination: { lat: end.latitude, lng: end.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Create or update directions renderer
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
              map: mapInstance,
              suppressMarkers: true, // We'll use our own markers
              polylineOptions: {
                strokeColor: '#2563eb', // Blue color
                strokeWeight: 4,
                strokeOpacity: 0.8
              }
            });
          }
          
          directionsRendererRef.current.setDirections(result);
          
          // Extract distance and duration
          const route = result.routes[0];
          if (route && route.legs && route.legs[0]) {
            const leg = route.legs[0];
            setDistanceInfo({
              distance: leg.distance?.text || 'N/A',
              duration: leg.duration?.text || 'N/A'
            });
          }
        } else {
          console.error('Directions request failed:', status);
          alert(`Failed to calculate route: ${status}`);
        }
        setCalculatingDistance(false);
      });
    } catch (error) {
      console.error('Error calculating distance:', error);
      alert('Error calculating distance. Please try again.');
      setCalculatingDistance(false);
    }
  };

  const toggleDistanceMeasureMode = () => {
    const newMode = !distanceMeasureMode;
    setDistanceMeasureMode(newMode);
    
    if (!newMode) {
      // Exiting distance mode - clear everything
      setStartPlant(null);
      setEndPlant(null);
      setDistanceInfo(null);
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] } as any);
      }
    } else {
      // Entering distance mode - close any open info window
      setSelectedPlant(null);
    }
  };

  const clearDistanceMeasurement = () => {
    setStartPlant(null);
    setEndPlant(null);
    setDistanceInfo(null);
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
    }
  };

  const handleCityFilter = (city: string | null) => {
    setSelectedCity(city);
    setSelectedPlant(null);
  };

  const handlePrint = () => {
    // Ensure legend is visible
    if (!showLegend) {
      setShowLegend(true);
    }
    
    // Create print-friendly legend document
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow popups to print the map');
      return;
    }

    // Generate HTML for legend
    const legendHTML = cities
      .sort((a, b) => a.city.localeCompare(b.city))
      .map(cityData => {
        const cityPlants = plants.filter(p => p.city === cityData.city);
        const borderColor = CITY_COLORS[cityData.city] || '#666666';
        const bgColor = CITY_COLORS[cityData.city] || '#666666';
        
        return `
          <div style="border: 2px solid ${borderColor}; padding: 12px; border-radius: 6px; background: white; page-break-inside: avoid;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #ccc;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${bgColor};"></div>
              <div>
                <div style="font-weight: bold; font-size: 14px;">${cityData.city}</div>
                <div style="font-size: 11px; color: #666;">${cityData.plant_count} plant${cityData.plant_count !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style="margin-left: 24px;">
              ${cityPlants.map(plant => `
                <div style="font-size: 11px; margin-bottom: 4px; color: #333;">
                  • ${plant.est_name}
                  <br><span style="color: #666; font-size: 10px; margin-left: 10px;">Est #: ${plant.est_number}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })
      .join('');

    // Write simple, clean print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Circuit Plants Directory - USDA</title>
          <style>
            @page { size: landscape; margin: 1.5cm; }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            h1 {
              text-align: center;
              color: #1a472a;
              margin-bottom: 10px;
              font-size: 28px;
            }
            .subtitle {
              text-align: center;
              color: #666;
              margin-bottom: 30px;
              font-size: 16px;
            }
            .legend-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-top: 20px;
            }
            .print-date {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 30px;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <h1>Circuit Plants Directory - USDA</h1>
          <div class="subtitle">
            Food Safety and Inspection Service<br>
            Total: ${totalPlants} plants across ${cities.length} cities
          </div>
          
          <h2 style="font-size: 20px; margin-bottom: 15px; color: #333;">Plants by City</h2>
          <div class="legend-grid">
            ${legendHTML}
          </div>
          
          <div class="print-date">
            Printed on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait and print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const handleAddPlant = () => {
    setEditingPlant(null);
    setShowManagementDialog(true);
  };

  const handleEditPlant = (plant: CircuitPlant) => {
    setEditingPlant(plant);
    setShowManagementDialog(true);
    setSelectedPlant(null);
  };

  const handleSavePlant = () => {
    fetchPlants();
    fetchCities();
  };

  const getMarkerIcon = (city: string, plant?: CircuitPlant) => {
    const color = CITY_COLORS[city] || '#666666';
    // Only create icon if google maps is loaded
    if (!isLoaded || typeof google === 'undefined' || !google.maps) {
      return undefined;
    }

    // In distance measure mode, highlight selected plants
    if (distanceMeasureMode && plant) {
      if (startPlant && plant.id === startPlant.id) {
        // Start plant - green marker
        return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981', // Green
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 12 // Larger
        };
      }
      if (endPlant && plant.id === endPlant.id) {
        // End plant - blue marker
        return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6', // Blue
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 12 // Larger
        };
      }
    }

    // Default marker
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 10
    };
  };

  const totalPlants = cities.reduce((sum, city) => sum + city.plant_count, 0);

  return (
    <>
      {/* Print-only header */}
      <div className="print-only" style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#000' }}>
          Circuit Plants Map - USDA Travel Mileage System
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
          Total: {totalPlants} plants across {cities.length} cities
        </p>
      </div>

      <div className="p-6 print-content">
      {/* Header */}
      <div className="mb-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-8 h-8 text-blue-600" />
              Circuit Plants Map
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {selectedCity 
                ? `Showing ${plants.length} plants in ${selectedCity}`
                : `Showing all ${plants.length} plants across ${cities.length} cities`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={toggleDistanceMeasureMode}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                distanceMeasureMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Ruler className="w-4 h-4" />
              {distanceMeasureMode ? 'Exit Distance Mode' : 'Measure Distance'}
            </button>
            <button
              onClick={handleAddPlant}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Plant
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {showLegend ? 'Hide' : 'Show'} Legend
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Map
            </button>
          </div>
        </div>
      </div>

      {/* Distance Measurement Info Panel */}
      {distanceMeasureMode && (
        <div className="mb-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900 dark:to-blue-900 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg p-4 shadow-lg no-print">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                Distance Measurement Mode
              </h3>
            </div>
            <button
              onClick={toggleDistanceMeasureMode}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              title="Exit Distance Mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Instructions */}
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
              <p className="font-semibold mb-1">📍 How to use:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Click on the <strong>first plant</strong> (starting point)</li>
                <li>Click on the <strong>second plant</strong> (destination)</li>
                <li>View the driving distance and route on the map</li>
              </ol>
            </div>

            {/* Selected Plants */}
            <div className="grid grid-cols-2 gap-3">
              {/* Start Plant */}
              <div className={`p-3 rounded-lg border-2 ${
                startPlant 
                  ? 'bg-green-50 dark:bg-green-900 border-green-400 dark:border-green-600' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 border-dashed'
              }`}>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  START POINT
                </div>
                {startPlant ? (
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate" title={startPlant.est_name}>
                      {startPlant.est_name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {startPlant.city}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Click a plant marker
                  </div>
                )}
              </div>

              {/* End Plant */}
              <div className={`p-3 rounded-lg border-2 ${
                endPlant 
                  ? 'bg-blue-50 dark:bg-blue-900 border-blue-400 dark:border-blue-600' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 border-dashed'
              }`}>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  END POINT
                </div>
                {endPlant ? (
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate" title={endPlant.est_name}>
                      {endPlant.est_name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {endPlant.city}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {startPlant ? 'Click second plant' : 'Select start first'}
                  </div>
                )}
              </div>
            </div>

            {/* Distance Result */}
            {calculatingDistance && (
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-600 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  🔄 Calculating route...
                </div>
              </div>
            )}

            {distanceInfo && !calculatingDistance && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 border-2 border-green-400 dark:border-green-600 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      DRIVING DISTANCE
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {distanceInfo.distance}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      DRIVE TIME
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {distanceInfo.duration}
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearDistanceMeasurement}
                  className="mt-3 w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Clear & Measure Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* City Filters */}
        {showFilters && (
          <div className="w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 no-print" style={{ maxHeight: '700px', overflowY: 'auto' }}>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Filter by City
              </h3>
            </div>
            
            {/* All Cities Button */}
            <button
              onClick={() => handleCityFilter(null)}
              className={`w-full text-left px-4 py-3 rounded-xl mb-3 transition-all duration-200 transform hover:scale-105 ${
                selectedCity === null
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 shadow-md'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base">🌐 All Cities</span>
                <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-bold text-blue-600 dark:text-blue-400">
                  {totalPlants}
                </span>
              </div>
            </button>

            {/* City Filter Buttons */}
            <div className="space-y-2">
              {cities.map((cityData) => (
                <button
                  key={cityData.city}
                  onClick={() => handleCityFilter(cityData.city)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    selectedCity === cityData.city
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
                  }`}
                  style={{
                    borderLeft: `6px solid ${CITY_COLORS[cityData.city] || '#666666'}`
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {/* Color Indicator Dot */}
                      <div 
                        className="w-4 h-4 rounded-full shadow-inner"
                        style={{ backgroundColor: CITY_COLORS[cityData.city] || '#666666' }}
                      />
                      <span className="font-medium text-base">{cityData.city}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      selectedCity === cityData.city 
                        ? 'bg-white text-blue-600' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {cityData.plant_count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 print-map-container">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {loadError ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-red-600 dark:text-red-400">Error loading Google Maps</div>
              </div>
            ) : !isLoaded ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-600 dark:text-gray-400">Loading map...</div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                mapContainerClassName="google-map-print"
                center={center}
                zoom={10}
                options={{
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  disableDefaultUI: false
                }}
                onLoad={(map) => {
                  setMapInstance(map);
                  map.addListener('zoom_changed', () => {
                    const zoom = map.getZoom();
                    if (zoom) setMapZoom(zoom);
                  });
                }}
              >
                {/* Render markers */}
                {plants
                  .filter(plant => plant.latitude && plant.longitude)
                  .map((plant) => (
                    <Marker
                      key={plant.id}
                      position={{ lat: plant.latitude, lng: plant.longitude }}
                      onClick={() => handleMarkerClick(plant)}
                      icon={getMarkerIcon(plant.city, plant)}
                      title={plant.est_name}
                      label={mapZoom >= 12 ? {
                        text: plant.est_name,
                        color: '#000000',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        className: 'map-marker-label'
                      } : undefined}
                    />
                  ))}

                {/* Info Window */}
                {selectedPlant && selectedPlant.latitude && selectedPlant.longitude && (
                  <InfoWindow
                    position={{ lat: selectedPlant.latitude, lng: selectedPlant.longitude }}
                    onCloseClick={() => setSelectedPlant(null)}
                  >
                    <div className="p-2" style={{ maxWidth: '300px' }}>
                      <h3 className="font-bold text-lg mb-2" style={{ color: CITY_COLORS[selectedPlant.city] }}>
                        {selectedPlant.est_name}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Est #:</strong> {selectedPlant.est_number}</p>
                        <p><strong>Address:</strong> {selectedPlant.address}</p>
                        <p><strong>City:</strong> {selectedPlant.city}, {selectedPlant.state} {selectedPlant.zip_code}</p>
                        {selectedPlant.circuit && <p><strong>Circuit:</strong> {selectedPlant.circuit}</p>}
                        {selectedPlant.shift && <p><strong>Shift:</strong> {selectedPlant.shift}</p>}
                        {selectedPlant.tour_of_duty && <p><strong>Tour:</strong> {selectedPlant.tour_of_duty}</p>}
                        {selectedPlant.inspector_name && (
                          <p><strong>Inspector:</strong> {selectedPlant.inspector_name}</p>
                        )}
                        {selectedPlant.notes && (
                          <p className="text-gray-600 mt-2"><em>{selectedPlant.notes}</em></p>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditPlant(selectedPlant)}
                        className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Plant
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>

          {/* Legend with Plants Grouped by City */}
          {showLegend && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 map-legend print-legend">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 no-print" />
                Plants by City Legend
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cities
                  .sort((a, b) => a.city.localeCompare(b.city))
                  .map((cityData) => {
                    const cityPlants = plants.filter(p => p.city === cityData.city);
                    return (
                      <div 
                        key={cityData.city} 
                        className="border-2 rounded-lg p-3 hover:shadow-md transition-shadow legend-city-card"
                        style={{ 
                          borderColor: CITY_COLORS[cityData.city] || '#666666',
                          printColorAdjust: 'exact',
                          WebkitPrintColorAdjust: 'exact'
                        }}
                      >
                        {/* City Header */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm flex-shrink-0 legend-color-dot"
                            style={{ 
                              backgroundColor: CITY_COLORS[cityData.city] || '#666666',
                              printColorAdjust: 'exact',
                              WebkitPrintColorAdjust: 'exact'
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                              {cityData.city}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {cityData.plant_count} plant{cityData.plant_count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        
                        {/* Plants List */}
                        <div className="space-y-1">
                          {cityPlants.map((plant) => (
                            <div 
                              key={plant.id}
                              className="text-xs text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                              onClick={() => handleMarkerClick(plant)}
                              title={`${plant.est_number}: ${plant.est_name}\n${plant.address}`}
                            >
                              • {plant.est_name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Print Styles */}
      <style>{`
        /* Screen styles */
        .print-only {
          display: none !important;
        }
        
        /* Map marker label styling */
        .map-marker-label {
          background: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          border: 1px solid #333 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          white-space: nowrap !important;
          font-family: Arial, sans-serif !important;
        }
        
        /* Override Google Maps default label styles */
        div[style*="position: absolute"] > div[style*="font-size"] {
          background: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          border: 1px solid #333 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }
        
        @media print {
          /* Show print-only header */
          .print-only {
            display: block !important;
            page-break-after: avoid !important;
          }
          
          /* Hide screen-only elements */
          .no-print,
          button:not(.print-keep),
          aside,
          nav,
          header:not(.print-keep),
          .sidebar,
          [role="navigation"] {
            display: none !important;
          }
          
          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Page setup - landscape for map */
          @page {
            size: landscape;
            margin: 1.5cm;
          }
          
          /* Reset body and html */
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          
          /* Main print content */
          .print-content {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Map container */
          .print-map-container {
            display: block !important;
            width: 100% !important;
            height: 600px !important;
            page-break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
          
          .google-map-print,
          [class*="gm-style"] {
            width: 100% !important;
            height: 600px !important;
          }
          
          /* Legend */
          .print-legend,
          .map-legend {
            display: block !important;
            width: 100% !important;
            page-break-before: auto !important;
            page-break-inside: avoid !important;
            margin-top: 30px !important;
            padding: 20px !important;
            border: 2px solid #333 !important;
            background: white !important;
          }
          
          .print-legend h3,
          .map-legend h3 {
            font-size: 18px !important;
            font-weight: bold !important;
            margin-bottom: 15px !important;
            color: #000 !important;
            display: block !important;
          }
          
          /* Legend grid */
          .print-legend > div:last-child,
          .map-legend > div:last-child {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 15px !important;
          }
          
          /* City cards in legend */
          .legend-city-card {
            display: block !important;
            page-break-inside: avoid !important;
            border-width: 2px !important;
            border-style: solid !important;
            padding: 10px !important;
            background: white !important;
            border-radius: 4px !important;
          }
          
          /* City header in cards */
          .legend-city-card > div:first-child {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            margin-bottom: 8px !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid #ccc !important;
          }
          
          /* Color dots */
          .legend-color-dot {
            display: inline-block !important;
            width: 14px !important;
            height: 14px !important;
            border-radius: 50% !important;
            flex-shrink: 0 !important;
          }
          
          /* Text in legend */
          .legend-city-card *,
          .print-legend *,
          .map-legend * {
            color: #000 !important;
          }
          
          /* Plant names in legend */
          .legend-city-card > div:last-child > div {
            font-size: 11px !important;
            line-height: 1.4 !important;
            margin-bottom: 3px !important;
            color: #333 !important;
          }
        }
      `}</style>

      {/* Plant Management Dialog */}
      <PlantManagementDialog
        plant={editingPlant}
        isOpen={showManagementDialog}
        onClose={() => setShowManagementDialog(false)}
        onSave={handleSavePlant}
      />
    </div>
    </>
  );
};

export default CircuitPlantsMap;

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import api from '../api/axios';
import { MapPin, Filter, Printer, Download, Plus, Edit, Ruler, X, Globe } from 'lucide-react';
import PlantManagementDialog from '../components/PlantManagementDialog';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader';

// State colors - distinct colors for different states
const STATE_COLORS: Record<string, string> = {
  'NJ': '#FF0000',      // Red - New Jersey
  'NY': '#00CC00',      // Green - New York
  'PA': '#0066FF',      // Blue - Pennsylvania
  'CT': '#FF00FF',      // Magenta - Connecticut
  'MA': '#FFD700',      // Gold - Massachusetts
  'MD': '#00CCCC',      // Cyan - Maryland
  'VA': '#FF8C00',      // Orange - Virginia
  'DE': '#9370DB',      // Purple - Delaware
  'VT': '#FF69B4',      // Hot Pink - Vermont
  'NH': '#8B4513',      // Brown - New Hampshire
  'RI': '#808080',      // Gray - Rhode Island
  'ME': '#20B2AA',      // Teal - Maine
  'WV': '#FFD700',      // Gold - West Virginia
  'NC': '#4B0082',      // Indigo - North Carolina
  'SC': '#00FF7F',      // Spring Green - South Carolina
  'DEFAULT': '#666666'  // Gray for unlisted states
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

interface StateStats {
  state: string;
  plant_count: number;
}

interface CircuitStats {
  circuit: string;
  plant_count: number;
}

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  minHeight: '600px'
};

// Center on USA East Coast
const center = {
  lat: 40.7128,
  lng: -74.0060
};

const DistrictCircuitPlantsMap: React.FC = () => {
  const [plants, setPlants] = useState<CircuitPlant[]>([]);
  const [states, setStates] = useState<StateStats[]>([]);
  const [circuits, setCircuits] = useState<CircuitStats[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<CircuitPlant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showManagementDialog, setShowManagementDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<CircuitPlant | null>(null);
  const [mapZoom, setMapZoom] = useState(7);
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
    fetchStates();
    fetchCircuits();
  }, [selectedState, selectedCircuit, selectedCity]);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const params: any = { active: 'true' };
      if (selectedState) params.state = selectedState;
      if (selectedCircuit) params.circuit = selectedCircuit;
      if (selectedCity) params.city = selectedCity;
      
      const response = await api.get('/circuit-plants', { params });
      setPlants(response.data);
      
      // Extract unique cities from filtered plants
      const uniqueCities = [...new Set(response.data.map((p: CircuitPlant) => p.city))].sort();
      setCities(uniqueCities);
    } catch (error) {
      console.error('Failed to fetch plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await api.get('/circuit-plants/states');
      setStates(response.data);
    } catch (error) {
      console.error('Failed to fetch states:', error);
    }
  };

  const fetchCircuits = async () => {
    try {
      const params: any = {};
      if (selectedState) params.state = selectedState;
      const response = await api.get('/circuit-plants/circuits', { params });
      setCircuits(response.data);
    } catch (error) {
      console.error('Failed to fetch circuits:', error);
    }
  };

  const handleMarkerClick = (plant: CircuitPlant) => {
    // If in distance measure mode, handle plant selection for distance calculation
    if (distanceMeasureMode) {
      if (!startPlant) {
        setStartPlant(plant);
        setEndPlant(null);
        setDistanceInfo(null);
      } else if (!endPlant) {
        setEndPlant(plant);
        calculateDistance(startPlant, plant);
      } else {
        setStartPlant(plant);
        setEndPlant(null);
        setDistanceInfo(null);
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections({ routes: [] } as any);
        }
      }
    } else {
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
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
              map: mapInstance,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#2563eb',
                strokeWeight: 4,
                strokeOpacity: 0.8
              }
            });
          }
          
          directionsRendererRef.current.setDirections(result);
          
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
      setStartPlant(null);
      setEndPlant(null);
      setDistanceInfo(null);
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] } as any);
      }
    } else {
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

  const handleStateFilter = (state: string | null) => {
    setSelectedState(state);
    setSelectedCircuit(null);
    setSelectedCity(null);
    setSelectedPlant(null);
  };

  const handleCircuitFilter = (circuit: string | null) => {
    setSelectedCircuit(circuit);
    setSelectedCity(null);
    setSelectedPlant(null);
  };

  const handleCityFilter = (city: string | null) => {
    setSelectedCity(city);
    setSelectedPlant(null);
  };

  const handlePrint = () => {
    if (!showLegend) {
      setShowLegend(true);
    }
    
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow popups to print the map');
      return;
    }

    const legendHTML = states
      .sort((a, b) => a.state.localeCompare(b.state))
      .map(stateData => {
        const statePlants = plants.filter(p => p.state === stateData.state);
        const borderColor = STATE_COLORS[stateData.state] || STATE_COLORS.DEFAULT;
        
        return `
          <div style="border: 2px solid ${borderColor}; padding: 12px; border-radius: 6px; background: white; page-break-inside: avoid;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #ccc;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${borderColor};"></div>
              <div>
                <div style="font-weight: bold; font-size: 14px;">${stateData.state}</div>
                <div style="font-size: 11px; color: #666;">${stateData.plant_count} plant${stateData.plant_count !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style="margin-left: 24px;">
              ${statePlants.slice(0, 5).map(plant => `
                <div style="font-size: 11px; margin-bottom: 4px; color: #333;">
                  • ${plant.est_name} (${plant.city})
                </div>
              `).join('')}
              ${statePlants.length > 5 ? `<div style="font-size: 10px; color: #666; font-style: italic;">...and ${statePlants.length - 5} more</div>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>District Plants Map - USDA</title>
          <style>
            @page { size: landscape; margin: 1.5cm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
            h1 { text-align: center; color: #1a472a; margin-bottom: 10px; font-size: 28px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-size: 16px; }
            .legend-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px; }
            .print-date { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>District Plants Map - USDA FSIS</h1>
          <div class="subtitle">
            Food Safety and Inspection Service<br>
            Total: ${plants.length} plants across ${states.length} states
          </div>
          <h2 style="font-size: 20px; margin-bottom: 15px; color: #333;">Plants by State</h2>
          <div class="legend-grid">${legendHTML}</div>
          <div class="print-date">
            Printed on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
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
    fetchStates();
    fetchCircuits();
  };

  const getMarkerIcon = (state: string, plant?: CircuitPlant) => {
    const color = STATE_COLORS[state] || STATE_COLORS.DEFAULT;
    if (!isLoaded || typeof google === 'undefined' || !google.maps) {
      return undefined;
    }

    if (distanceMeasureMode && plant) {
      if (startPlant && plant.id === startPlant.id) {
        return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 12
        };
      }
      if (endPlant && plant.id === endPlant.id) {
        return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 12
        };
      }
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8
    };
  };

  const totalPlants = plants.length;

  return (
    <>
      <div className="p-6 print-content">
      {/* Header */}
      <div className="mb-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-8 h-8 text-blue-600" />
              District Plants Map
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {selectedState 
                ? `Showing ${plants.length} plants in ${selectedState}`
                : `Showing all ${plants.length} plants across ${states.length} states`}
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
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
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
              <p className="font-semibold mb-1">📍 How to use:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Click on the <strong>first plant</strong> (starting point)</li>
                <li>Click on the <strong>second plant</strong> (destination)</li>
                <li>View the driving distance and route on the map</li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border-2 ${
                startPlant 
                  ? 'bg-green-50 dark:bg-green-900 border-green-400 dark:border-green-600' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 border-dashed'
              }`}>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">START POINT</div>
                {startPlant ? (
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate" title={startPlant.est_name}>
                      {startPlant.est_name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{startPlant.city}, {startPlant.state}</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">Click a plant marker</div>
                )}
              </div>

              <div className={`p-3 rounded-lg border-2 ${
                endPlant 
                  ? 'bg-blue-50 dark:bg-blue-900 border-blue-400 dark:border-blue-600' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 border-dashed'
              }`}>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">END POINT</div>
                {endPlant ? (
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate" title={endPlant.est_name}>
                      {endPlant.est_name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{endPlant.city}, {endPlant.state}</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {startPlant ? 'Click second plant' : 'Select start first'}
                  </div>
                )}
              </div>
            </div>

            {calculatingDistance && (
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-600 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">🔄 Calculating route...</div>
              </div>
            )}

            {distanceInfo && !calculatingDistance && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 border-2 border-green-400 dark:border-green-600 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">DRIVING DISTANCE</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{distanceInfo.distance}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">DRIVE TIME</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{distanceInfo.duration}</div>
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

      {/* Map Container - Full Width */}
      <div className="mb-4">
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
              zoom={7}
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
              {plants
                .filter(plant => plant.latitude && plant.longitude)
                .map((plant) => (
                  <Marker
                    key={plant.id}
                    position={{ lat: plant.latitude, lng: plant.longitude }}
                    onClick={() => handleMarkerClick(plant)}
                    icon={getMarkerIcon(plant.state, plant)}
                    title={`${plant.est_name} - ${plant.city}, ${plant.state}`}
                    label={mapZoom >= 11 ? {
                      text: plant.est_name,
                      color: '#000000',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      className: 'map-marker-label'
                    } : undefined}
                  />
                ))}

              {selectedPlant && selectedPlant.latitude && selectedPlant.longitude && !distanceMeasureMode && (
                <InfoWindow
                  position={{ lat: selectedPlant.latitude, lng: selectedPlant.longitude }}
                  onCloseClick={() => setSelectedPlant(null)}
                >
                  <div className="p-2" style={{ maxWidth: '300px' }}>
                    <h3 className="font-bold text-lg mb-2" style={{ color: STATE_COLORS[selectedPlant.state] || STATE_COLORS.DEFAULT }}>
                      {selectedPlant.est_name}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Est #:</strong> {selectedPlant.est_number}</p>
                      <p><strong>Address:</strong> {selectedPlant.address}</p>
                      <p><strong>City:</strong> {selectedPlant.city}, {selectedPlant.state} {selectedPlant.zip_code}</p>
                      {selectedPlant.circuit && <p><strong>Circuit:</strong> {selectedPlant.circuit}</p>}
                      {selectedPlant.inspector_name && (
                        <p><strong>Inspector:</strong> {selectedPlant.inspector_name}</p>
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
      </div>

      {/* Horizontal Filters Below Map */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 no-print">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h3>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {plants.length} of {totalPlants} plants
            </div>
          </div>

          <div className="space-y-4">
            {/* State Filter Row */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📍 Filter by State:</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStateFilter(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedState === null
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🌐 All States ({totalPlants})
                </button>
                {states.map((stateData) => (
                  <button
                    key={stateData.state}
                    onClick={() => handleStateFilter(stateData.state)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedState === stateData.state
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                    style={{ 
                      borderLeftWidth: '4px',
                      borderLeftColor: STATE_COLORS[stateData.state] || STATE_COLORS.DEFAULT 
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATE_COLORS[stateData.state] || STATE_COLORS.DEFAULT }}
                    />
                    {stateData.state} ({stateData.plant_count})
                  </button>
                ))}
              </div>
            </div>

            {/* Circuit Filter Row (shown when state is selected) */}
            {selectedState && circuits.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🔄 Filter by Circuit:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCircuitFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      selectedCircuit === null
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Circuits
                  </button>
                  {circuits.map((circuitData) => (
                    <button
                      key={circuitData.circuit}
                      onClick={() => handleCircuitFilter(circuitData.circuit)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        selectedCircuit === circuitData.circuit
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {circuitData.circuit} ({circuitData.plant_count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* City Filter Row */}
            {cities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🏙️ Filter by City:</h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <button
                    onClick={() => handleCityFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      selectedCity === null
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Cities
                  </button>
                  {cities.map((city) => {
                    const cityCount = plants.filter(p => p.city === city).length;
                    return (
                      <button
                        key={city}
                        onClick={() => handleCityFilter(city)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          selectedCity === city
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {city} ({cityCount})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Plants by State
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {states.map((stateData) => (
              <div 
                key={stateData.state}
                className="flex items-center gap-2 p-2 border rounded"
                style={{ borderColor: STATE_COLORS[stateData.state] || STATE_COLORS.DEFAULT }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: STATE_COLORS[stateData.state] || STATE_COLORS.DEFAULT }}
                />
                <div>
                  <div className="font-bold text-sm">{stateData.state}</div>
                  <div className="text-xs text-gray-600">{stateData.plant_count} plants</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .map-marker-label {
          background: white !important;
          padding: 3px 6px !important;
          border-radius: 3px !important;
          border: 1px solid #333 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
          font-size: 10px !important;
        }
      `}</style>

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

export default DistrictCircuitPlantsMap;

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import api from '../api/axios';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';

interface Inspector {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface CircuitPlant {
  id: number;
  name: string;
  address: string;
  circuit: string;
  latitude: number | null;
  longitude: number | null;
  assigned_inspector_id: number | null;
  assigned_inspector_name?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const CircuitPlants: React.FC = () => {
  const [plants, setPlants] = useState<CircuitPlant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<CircuitPlant[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState<CircuitPlant | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    circuit: '',
    assigned_inspector_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchPlants();
    fetchInspectors();
  }, []);

  useEffect(() => {
    if (showAddModal && addressInputRef.current) {
      initializeAutocomplete();
    }
  }, [showAddModal]);

  useEffect(() => {
    if (plants.length > 0) {
      initializeMap();
    }
  }, [plants]);

  useEffect(() => {
    // Filter plants based on search query
    if (searchQuery.trim() === '') {
      setFilteredPlants(plants);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = plants.filter(plant => 
        plant.name.toLowerCase().includes(query) ||
        plant.circuit.toLowerCase().includes(query) ||
        plant.address.toLowerCase().includes(query)
      );
      setFilteredPlants(filtered);
    }
  }, [searchQuery, plants]);

  const fetchPlants = async () => {
    try {
      const response = await api.get('/circuit-plants');
      setPlants(response.data);
      setFilteredPlants(response.data);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load circuit plants');
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      await loadGoogleMapsScript();

      // Check if Google Maps is available
      if (!window.google || !window.google.maps) {
        console.log('Google Maps API not available, skipping map initialization');
        return;
      }

      if (!mapRef.current) return;

      // Default to Elizabeth, NJ coordinates
      const elizabethNJ = { lat: 40.6639916, lng: -74.2107006 };

      const map = new google.maps.Map(mapRef.current, {
        center: elizabethNJ,
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      googleMapRef.current = map;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();

      // Add markers for each plant with valid coordinates
      plants.forEach((plant) => {
        if (plant.latitude && plant.longitude) {
          const marker = new google.maps.Marker({
            position: { lat: plant.latitude, lng: plant.longitude },
            map: map,
            title: plant.name,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 250px;">
                <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${plant.name}</h3>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Circuit:</strong> ${plant.circuit}</p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Address:</strong> ${plant.address}</p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Inspector:</strong> ${plant.assigned_inspector_name || 'Unassigned'}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            // Close all other info windows
            markersRef.current.forEach((m, id) => {
              if (id !== plant.id) {
                const iw = (m as any).infoWindow;
                if (iw) iw.close();
              }
            });
            
            infoWindow.open(map, marker);
            setSelectedPlantId(plant.id);
            
            // Highlight in table
            const tableRow = document.getElementById(`plant-row-${plant.id}`);
            if (tableRow) {
              tableRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });

          (marker as any).infoWindow = infoWindow;
          markersRef.current.set(plant.id, marker);
        }
      });

    } catch (err) {
      console.error('Failed to initialize map:', err);
    }
  };

  const handlePlantRowClick = (plant: CircuitPlant) => {
    if (plant.latitude && plant.longitude && googleMapRef.current && window.google && window.google.maps) {
      const marker = markersRef.current.get(plant.id);
      if (marker) {
        googleMapRef.current.panTo({ lat: plant.latitude, lng: plant.longitude });
        googleMapRef.current.setZoom(15);
        google.maps.event.trigger(marker, 'click');
      }
    }
  };

  const handleSearchSelect = (plant: CircuitPlant) => {
    setSearchQuery(plant.name);
    handlePlantRowClick(plant);
  };

  const fetchInspectors = async () => {
    try {
      const response = await api.get('/supervisors/all-inspectors');
      setInspectors(response.data);
    } catch (err) {
      console.error('Failed to load inspectors');
    }
  };

  const initializeAutocomplete = async () => {
    try {
      await loadGoogleMapsScript();

      // Check if Google Maps is available
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log('Google Maps Places API not available, skipping autocomplete initialization');
        return;
      }
      
      if (!addressInputRef.current) return;

      // Create autocomplete instance
      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            address: place.formatted_address || ''
          }));
        }
      });
    } catch (err) {
      console.error('Failed to initialize autocomplete:', err);
    }
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address });
      
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return { lat: location.lat(), lng: location.lng() };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Geocode the address
      const coordinates = await geocodeAddress(formData.address);
      
      const dataToSend = {
        ...formData,
        assigned_inspector_id: formData.assigned_inspector_id ? parseInt(formData.assigned_inspector_id) : null,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null
      };

      if (editingPlant) {
        await api.put(`/circuit-plants/${editingPlant.id}`, dataToSend);
        setSuccess('Plant updated successfully');
      } else {
        await api.post('/circuit-plants', dataToSend);
        setSuccess('Plant added successfully');
      }

      setShowAddModal(false);
      setEditingPlant(null);
      setFormData({ name: '', address: '', circuit: '', assigned_inspector_id: '', notes: '' });
      fetchPlants();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save plant');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (plant: CircuitPlant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name,
      address: plant.address,
      circuit: plant.circuit,
      assigned_inspector_id: plant.assigned_inspector_id?.toString() || '',
      notes: plant.notes || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plant?')) return;

    try {
      await api.delete(`/circuit-plants/${id}`);
      setSuccess('Plant deleted successfully');
      fetchPlants();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to delete plant');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPlant(null);
    setFormData({ name: '', address: '', circuit: '', assigned_inspector_id: '', notes: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Circuit Plants</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage plant locations and assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Plant
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Search/Filter Box */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by plant name, circuit, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
          />
        </div>
        {searchQuery && filteredPlants.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {filteredPlants.slice(0, 5).map((plant) => (
              <button
                key={plant.id}
                onClick={() => handleSearchSelect(plant)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{plant.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{plant.circuit} • {plant.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map - First Priority */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600" />
            Circuit Plants Location Map
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {plants.length} plant{plants.length !== 1 ? 's' : ''} • Default: Elizabeth, NJ
          </span>
        </div>
        
        {plants.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No circuit plants added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Add Your First Plant
            </button>
          </div>
        ) : (
          <div 
            ref={mapRef} 
            className="w-full h-[600px] rounded-lg border-2 border-gray-300 dark:border-gray-600"
          />
        )}
      </div>

      {/* Plants Table - Below Map */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            All Circuit Plants ({filteredPlants.length})
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click on a row to view location on map
          </p>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plant Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Circuit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Assigned Inspector
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPlants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No plants match your search.' : 'No plants added yet. Click "Add Plant" to get started.'}
                </td>
              </tr>
            ) : (
              filteredPlants.map((plant) => (
                <tr 
                  key={plant.id} 
                  id={`plant-row-${plant.id}`}
                  onClick={() => handlePlantRowClick(plant)}
                  className={`hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    selectedPlantId === plant.id ? 'bg-blue-100 dark:bg-gray-600' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{plant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{plant.address}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{plant.circuit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {plant.assigned_inspector_name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(plant);
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(plant.id);
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., ABC Meat Processing Plant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="123 Main St, City, State, ZIP"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Full address will be used to show location on map
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Circuit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.circuit}
                    onChange={(e) => setFormData({ ...formData, circuit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 8020-Elizabeth, NJ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Inspector
                  </label>
                  <select
                    value={formData.assigned_inspector_id}
                    onChange={(e) => setFormData({ ...formData, assigned_inspector_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Unassigned</option>
                    {inspectors.map((inspector) => (
                      <option key={inspector.id} value={inspector.id}>
                        {inspector.first_name} {inspector.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Additional information about this plant..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  >
                    <X className="w-4 h-4 inline mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {editingPlant ? 'Update' : 'Add'} Plant
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircuitPlants;

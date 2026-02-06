import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MapPin,
  Search
} from 'lucide-react';
import api from '../api/axios';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';

interface FlsStats {
  totalInspectors: number;
  totalSupervisors: number;
  assignedInspectors: number;
  unassignedInspectors: number;
  pendingAssignmentRequests: number;
  pendingVouchers: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalPendingAmount: number;
  totalApprovedAmount: number;
}

interface CircuitPlant {
  id: number;
  name: string;
  address: string;
  circuit: string;
  latitude: number;
  longitude: number;
  assigned_inspector_name: string | null;
}

const FlsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FlsStats | null>(null);
  const [plants, setPlants] = useState<CircuitPlant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<CircuitPlant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());

  useEffect(() => {
    fetchFlsStats();
    fetchPlants();
  }, []);

  useEffect(() => {
    // Only initialize map after component has fully loaded and rendered
    if (!loading && mapRef.current) {
      console.log('🗺️ FLS Dashboard: Triggering map initialization (loading=false, mapRef exists)');
      initializeMap();
    }
  }, [plants, loading]);

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

  const fetchFlsStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supervisors/fls-dashboard-stats');
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching FLS stats:', err);
      setError('Failed to load dashboard statistics');
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await api.get('/circuit-plants');
      const validPlants = response.data.filter((p: CircuitPlant) => p.latitude && p.longitude);
      setPlants(validPlants);
      setFilteredPlants(validPlants);
    } catch (err) {
      console.error('Failed to load plants');
    }
  };

  const initializeMap = async () => {
    console.log('🗺️ FLS Dashboard: initializeMap called');
    console.log('   mapRef.current:', !!mapRef.current);
    console.log('   plants.length:', plants.length);
    
    try {
      console.log('   Loading Google Maps script...');
      await loadGoogleMapsScript();

      if (!mapRef.current) {
        console.log('   ❌ mapRef.current is null, exiting');
        return;
      }

      console.log('   ✅ Google Maps API available:', !!window.google?.maps);
      
      if (!window.google?.maps) {
        console.error('   ❌ Google Maps API not loaded after loadGoogleMapsScript!');
        return;
      }

      // Default to Elizabeth, NJ coordinates
      const elizabethNJ = { lat: 40.6639916, lng: -74.2107006 };

      console.log('   Creating map instance...');
      const map = new google.maps.Map(mapRef.current, {
        center: elizabethNJ,
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      googleMapRef.current = map;
      console.log('   ✅ Map instance created successfully');

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();

      // Add markers for each plant (only if plants exist)
      console.log('   Adding', plants.length, 'markers...');
      plants.forEach((plant) => {
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
        });

        (marker as any).infoWindow = infoWindow;
        markersRef.current.set(plant.id, marker);
      });
      
      console.log('   ✅ Map initialization complete');

    } catch (err) {
      console.error('   ❌ Failed to initialize map:', err);
    }
  };

  const handleSearchSelect = (plant: CircuitPlant) => {
    setSearchQuery(plant.name);
    if (plant.latitude && plant.longitude && googleMapRef.current) {
      const marker = markersRef.current.get(plant.id);
      if (marker) {
        googleMapRef.current.panTo({ lat: plant.latitude, lng: plant.longitude });
        googleMapRef.current.setZoom(15);
        google.maps.event.trigger(marker, 'click');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error || 'Failed to load statistics'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">FLS Dashboard</h1>
        <p className="text-blue-100">District-wide overview and team management</p>
      </div>

      {/* Search/Filter Box for Circuit Plants */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search circuit plants by name, circuit, or address..."
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

      {/* Circuit Plants Map - First Priority */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600" />
            Circuit Plants Location Map
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {plants.length} plant{plants.length !== 1 ? 's' : ''} • Default: Elizabeth, NJ
            </span>
            <button
              onClick={() => navigate('/supervisor/circuit-plants')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              Manage Plants →
            </button>
          </div>
        </div>
        
        <div 
          ref={mapRef} 
          className="w-full h-[600px] rounded-lg border-2 border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inspectors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Inspectors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalInspectors}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.assignedInspectors} assigned • {stats.unassignedInspectors} unassigned
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-80" />
          </div>
        </div>

        {/* Supervisors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Supervisors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalSupervisors}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active team leaders</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-500 opacity-80" />
          </div>
        </div>

        {/* Pending Assignments */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/supervisor/assignment-requests')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.pendingAssignmentRequests}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Click to review →</p>
            </div>
            <AlertCircle className="w-12 h-12 text-yellow-500 opacity-80" />
          </div>
        </div>

        {/* Pending Vouchers */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/supervisor/dashboard')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Vouchers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.pendingVouchers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ${stats.totalPendingAmount.toLocaleString()}
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-500 opacity-80" />
          </div>
        </div>
      </div>

      {/* Voucher Activity This Month */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approvedThisMonth}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total: ${stats.totalApprovedAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rejected This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejectedThisMonth}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review rate: {stats.approvedThisMonth + stats.rejectedThisMonth > 0 
              ? Math.round((stats.approvedThisMonth / (stats.approvedThisMonth + stats.rejectedThisMonth)) * 100)
              : 0}% approval
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Processed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.approvedThisMonth + stats.rejectedThisMonth}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monthly activity</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/supervisor/assignment-requests')}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
          >
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Assignment Requests</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Review pending requests</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/supervisor/dashboard')}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:shadow-md transition-all"
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Approve Vouchers</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Review travel vouchers</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/supervisor/team')}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all"
          >
            <Users className="w-8 h-8 text-purple-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Team Management</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your team</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/supervisor/circuit-plants')}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-500 dark:hover:border-red-500 hover:shadow-md transition-all"
          >
            <MapPin className="w-8 h-8 text-red-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Circuit Plants</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage plant locations</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlsDashboard;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FleetMap from '../components/FleetMap';

const mockFleetData = {
  totalVehicles: 156,
  activeVehicles: 142,
  byState: [
    { state: 'California', count: 45, abbr: 'CA', lat: 36.7783, lng: -119.4179, color: '#9333EA' },
    { state: 'Texas', count: 38, abbr: 'TX', lat: 31.9686, lng: -99.9018, color: '#EC4899' },
    { state: 'Florida', count: 28, abbr: 'FL', lat: 27.6648, lng: -81.5158, color: '#06B6D4' },
    { state: 'New York', count: 25, abbr: 'NY', lat: 43.2994, lng: -74.2179, color: '#F97316' },
    { state: 'Illinois', count: 20, abbr: 'IL', lat: 40.6331, lng: -89.3985, color: '#14B8A6' },
  ],
  vehicles: [
    { id: 'V001', make: 'Ford', model: 'F-150', year: 2022, licensePlate: 'CA-1234', 
      user: 'John Smith', position: 'Food Inspector', role: 'Inspector', 
      state: 'California', city: 'Los Angeles', circuit: 'District 1', status: 'Active', mileage: 45230 },
    { id: 'V002', make: 'Chevrolet', model: 'Silverado', year: 2021, licensePlate: 'TX-5678', 
      user: 'Sarah Johnson', position: 'CSI', role: 'Inspector', 
      state: 'Texas', city: 'Houston', circuit: 'District 2', status: 'Active', mileage: 38450 },
    { id: 'V003', make: 'Toyota', model: 'Tacoma', year: 2023, licensePlate: 'FL-9012', 
      user: 'Michael Brown', position: 'SCSI', role: 'Supervisor', 
      state: 'Florida', city: 'Miami', circuit: 'District 3', status: 'In Service', mileage: 12890 },
    { id: 'V004', make: 'RAM', model: '1500', year: 2022, licensePlate: 'NY-3456', 
      user: 'Emily Davis', position: 'FLS', role: 'Supervisor', 
      state: 'New York', city: 'Buffalo', circuit: 'District 4', status: 'Active', mileage: 52100 },
    { id: 'V005', make: 'GMC', model: 'Sierra', year: 2021, licensePlate: 'IL-7890', 
      user: 'David Wilson', position: 'DDM', role: 'Supervisor', 
      state: 'Illinois', city: 'Chicago', circuit: 'District 5', status: 'Active', mileage: 41200 },
  ]
};

const FleetManagerDashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const handleStateClick = (stateName: string) => {
    setFilterState(stateName);
    setSelectedState(stateName);
    // Scroll to table
    document.getElementById('fleet-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredVehicles = mockFleetData.vehicles.filter(vehicle => {
    const matchesSearch = vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === 'All' || vehicle.state === filterState;
    const matchesStatus = filterStatus === 'All' || vehicle.status === filterStatus;
    return matchesSearch && matchesState && matchesStatus;
  });

  const gradientColors = [
    'from-purple-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-orange-500 to-yellow-500',
    'from-teal-500 to-emerald-600'
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Hero Header */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 dark:border-blue-500 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🚗</span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Management Dashboard</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Comprehensive vehicle fleet analytics and monitoring across all states
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Vehicles */}
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Fleet Vehicles</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{mockFleetData.totalVehicles}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>📊</span> Across all states
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Active Vehicles</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{mockFleetData.activeVehicles}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>✅</span> Ready for service
          </div>
        </div>

        {/* States Covered */}
        <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">States Covered</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{mockFleetData.byState.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>🗺️</span> Geographic coverage
          </div>
        </div>
      </div>

      {/* Fleet Distribution by State */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <span className="text-2xl">🗺️</span> Fleet Distribution by State
        </h2>
        
        {/* Real Interactive Map with Leaflet */}
        <FleetMap 
          locations={mockFleetData.byState}
          onStateClick={handleStateClick}
        />

        {/* State Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {mockFleetData.byState.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => handleStateClick(item.state)}
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.state}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.count}</div>
                </div>
                <div className="text-3xl opacity-50">🚗</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Registry Table */}
      <div id="fleet-table" className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 scroll-mt-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <span className="text-2xl">📋</span> Complete Fleet Registry
          {selectedState && (
            <span className="text-sm font-normal text-blue-600 dark:text-blue-400 ml-2">
              (Filtered by: {selectedState})
            </span>
          )}
        </h2>

        {/* Filters */}
        <div className="flex gap-4 mb-5 flex-wrap items-center">
          <input
            type="text"
            placeholder="🔍 Search by license plate, user, or make..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[250px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-white dark:bg-gray-700 dark:text-white"
          />
          
          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setSelectedState(e.target.value === 'All' ? null : e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-white dark:bg-gray-700 dark:text-white font-medium"
          >
            <option value="All">📍 All States</option>
            {mockFleetData.byState.map(s => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-white dark:bg-gray-700 dark:text-white font-medium"
          >
            <option value="All">🔄 All Status</option>
            <option value="Active">✅ Active</option>
            <option value="In Service">🔧 In Service</option>
          </select>

          {(selectedState || searchTerm || filterStatus !== 'All') && (
            <button
              onClick={() => {
                setFilterState('All');
                setSelectedState(null);
                setSearchTerm('');
                setFilterStatus('All');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <span>🔄</span> Clear All Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 dark:bg-blue-700 text-white">
                <th className="px-4 py-3 text-left text-xs font-semibold">Vehicle ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Make/Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">License Plate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Assigned User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Position</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">State/City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Circuit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Mileage</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle, idx) => (
                <tr 
                  key={vehicle.id} 
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{vehicle.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{vehicle.make} {vehicle.model} ({vehicle.year})</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{vehicle.licensePlate}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{vehicle.user}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-xs font-semibold">
                      {vehicle.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{vehicle.state}, {vehicle.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{vehicle.circuit}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      vehicle.status === 'Active' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{vehicle.mileage.toLocaleString()} mi</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-5xl">🔍</span>
              </div>
              <div className="text-xl font-semibold text-gray-600 dark:text-gray-300">No vehicles found</div>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetManagerDashboardNew;



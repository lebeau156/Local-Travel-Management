import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  totalStats: {
    total_trips: number;
    active_inspectors: number;
    total_miles: number;
    total_expenses: number;
    avg_miles_per_trip: number;
    total_vouchers: number;
    total_reimbursements: number;
  };
  vouchersByStatus: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    trip_count: number;
    total_miles: number;
    total_expenses: number;
  }>;
  topInspectors: Array<{
    email: string;
    first_name: string;
    last_name: string;
    trip_count: number;
    total_miles: number;
    total_expenses: number;
  }>;
  approvalMetrics: {
    avg_supervisor_approval_hours: number;
    avg_fleet_approval_hours: number;
    avg_total_approval_hours: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filter states
  const [filters, setFilters] = useState({
    inspector: '',
    state: '',
    circuit: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleLicense: ''
  });
  
  // Filter options (will be populated from API)
  const [filterOptions, setFilterOptions] = useState({
    inspectors: [] as Array<{ id: number; name: string; email: string }>,
    states: [] as string[],
    circuits: [] as string[],
    vehicleMakes: [] as string[],
    vehicleModels: [] as string[]
  });

  // Access control
  if (user?.role !== 'admin' && user?.role !== 'fleet_manager') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Access Denied: Only administrators and fleet managers can view analytics.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchAnalytics();
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/analytics/filter-options');
      setFilterOptions(response.data);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      // Add advanced filters
      if (filters.inspector) params.append('inspectorId', filters.inspector);
      if (filters.state) params.append('state', filters.state);
      if (filters.circuit) params.append('circuit', filters.circuit);
      if (filters.vehicleMake) params.append('vehicleMake', filters.vehicleMake);
      if (filters.vehicleModel) params.append('vehicleModel', filters.vehicleModel);
      if (filters.vehicleLicense) params.append('vehicleLicense', filters.vehicleLicense);

      const response = await api.get(`/analytics/overview?${params.toString()}`);
      setAnalytics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    fetchAnalytics();
  };

  const handleResetDates = () => {
    setDateRange({ startDate: '', endDate: '' });
    setFilters({
      inspector: '',
      state: '',
      circuit: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleLicense: ''
    });
    setTimeout(() => fetchAnalytics(), 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-300">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const statusColors: Record<string, string> = {
    draft: '#94a3b8',
    submitted: '#3b82f6',
    supervisor_approved: '#22c55e',
    approved: '#10b981',
    rejected: '#ef4444'
  };

  return (
    <div className="dark:bg-gray-900 min-h-screen p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Comprehensive insights and performance metrics</p>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 shadow rounded-lg p-4 mb-6">
        {/* Basic Filters - Always Visible */}
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <span>{showAdvancedFilters ? '▼' : '▶'}</span>
            Advanced Filters
          </button>
          <button
            onClick={handleDateRangeChange}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filter
          </button>
          <button
            onClick={handleResetDates}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Reset
          </button>
        </div>

        {/* Advanced Filters - Collapsible */}
        {showAdvancedFilters && (
          <div className="border-t dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Advanced Search Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Inspector Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Inspector
                </label>
                <select
                  value={filters.inspector}
                  onChange={(e) => setFilters({ ...filters, inspector: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Inspectors</option>
                  {filterOptions.inspectors.map((inspector) => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.name} ({inspector.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <select
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All States</option>
                  {filterOptions.states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Circuit Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Circuit
                </label>
                <select
                  value={filters.circuit}
                  onChange={(e) => setFilters({ ...filters, circuit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Circuits</option>
                  {filterOptions.circuits.map((circuit) => (
                    <option key={circuit} value={circuit}>
                      {circuit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Make Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Make
                </label>
                <select
                  value={filters.vehicleMake}
                  onChange={(e) => setFilters({ ...filters, vehicleMake: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Makes</option>
                  {filterOptions.vehicleMakes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Model Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Model
                </label>
                <select
                  value={filters.vehicleModel}
                  onChange={(e) => setFilters({ ...filters, vehicleModel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Models</option>
                  {filterOptions.vehicleModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle License Plate Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  value={filters.vehicleLicense}
                  onChange={(e) => setFilters({ ...filters, vehicleLicense: e.target.value })}
                  placeholder="Enter license plate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Filters Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {Object.values(filters).filter(v => v !== '').length > 0 && (
                    <span className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700">
                      {Object.values(filters).filter(v => v !== '').length} filter(s) active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
          <div className="text-sm opacity-90 mb-1">Total Trips</div>
          <div className="text-3xl font-bold">{analytics.totalStats.total_trips.toLocaleString()}</div>
          <div className="text-xs opacity-80 mt-2">
            Avg {analytics.totalStats.avg_miles_per_trip.toFixed(1)} miles/trip
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
          <div className="text-sm opacity-90 mb-1">Total Mileage</div>
          <div className="text-3xl font-bold">{analytics.totalStats.total_miles.toLocaleString()}</div>
          <div className="text-xs opacity-80 mt-2">miles driven</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
          <div className="text-sm opacity-90 mb-1">Total Reimbursements</div>
          <div className="text-3xl font-bold">${analytics.totalStats.total_reimbursements.toLocaleString()}</div>
          <div className="text-xs opacity-80 mt-2">
            {analytics.totalStats.total_vouchers} vouchers
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
          <div className="text-sm opacity-90 mb-1">Active Inspectors</div>
          <div className="text-3xl font-bold">{analytics.totalStats.active_inspectors}</div>
          <div className="text-xs opacity-80 mt-2">
            ${(analytics.totalStats.total_expenses || 0).toLocaleString()} expenses
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Monthly Trends (Last 12 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_miles" stroke="#8884d8" name="Miles" strokeWidth={2} />
              <Line type="monotone" dataKey="trip_count" stroke="#82ca9d" name="Trips" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Voucher Status Distribution */}
        <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Voucher Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.vouchersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.status}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.vouchersByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.status] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Inspectors */}
        <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Top Inspectors by Mileage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topInspectors.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="email" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_miles" fill="#8884d8" name="Miles" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Metrics */}
        <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Average Approval Time</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">Supervisor Approval</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {(analytics.approvalMetrics.avg_supervisor_approval_hours || 0).toFixed(1)} hours
              </div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">Fleet Manager Approval</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {(analytics.approvalMetrics.avg_fleet_approval_hours || 0).toFixed(1)} hours
              </div>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Time (Submitted → Approved)</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {(analytics.approvalMetrics.avg_total_approval_hours || 0).toFixed(1)} hours
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ({((analytics.approvalMetrics.avg_total_approval_hours || 0) / 24).toFixed(1)} days)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Inspectors Table */}
      <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Inspector Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Inspector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trips</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Miles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Expenses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg Miles/Trip</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analytics.topInspectors.map((inspector, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {inspector.first_name} {inspector.last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{inspector.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {inspector.trip_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {inspector.total_miles.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    ${inspector.total_expenses.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {(inspector.total_miles / inspector.trip_count).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;



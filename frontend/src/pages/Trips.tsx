import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TripMapModal from '../components/TripMapModal';

interface Trip {
  id: number;
  date: string;
  from_address: string;
  to_address: string;
  site_name?: string;
  purpose?: string;
  miles_calculated: number;
  lodging_cost?: number;
  meals_cost?: number;
  per_diem_days?: number;
  other_expenses?: number;
  expense_notes?: string;
  avoid_tolls?: number;
}

interface TripTemplate {
  id: number;
  template_name: string;
  from_address: string;
  to_address: string;
  site_name?: string;
  purpose?: string;
  notes?: string;
}

const Trips: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Format date without timezone conversion
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
  };
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filter states
  const [minMiles, setMinMiles] = useState('');
  const [maxMiles, setMaxMiles] = useState('');
  const [minExpenses, setMinExpenses] = useState('');
  const [maxExpenses, setMaxExpenses] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Saved searches
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

  // Bulk selection states
  const [selectedTripIds, setSelectedTripIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTrips();
    fetchTemplates();
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await api.get('/search/saved');
      setSavedSearches(response.data);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trips');
      setTrips(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await api.delete(`/trips/${id}`);
      setTrips(trips.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete trip');
    }
  };

  // Filter trips based on search and filters
  const filteredTrips = trips.filter((trip) => {
    // Search query (searches in from, to, plant name, notes)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        trip.from_address.toLowerCase().includes(query) ||
        trip.to_address.toLowerCase().includes(query) ||
        (trip.site_name?.toLowerCase().includes(query) || false) ||
        (trip.expense_notes?.toLowerCase().includes(query) || false);
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (startDate) {
      const tripDate = new Date(trip.date);
      const filterStart = new Date(startDate);
      if (tripDate < filterStart) return false;
    }
    if (endDate) {
      const tripDate = new Date(trip.date);
      const filterEnd = new Date(endDate);
      if (tripDate > filterEnd) return false;
    }

    // Purpose filter
    if (purposeFilter && trip.purpose !== purposeFilter) {
      return false;
    }

    // Miles range filter
    if (minMiles && trip.miles_calculated < parseFloat(minMiles)) {
      return false;
    }
    if (maxMiles && trip.miles_calculated > parseFloat(maxMiles)) {
      return false;
    }

    // Expenses range filter
    const totalExpenses = (trip.lodging_cost || 0) + (trip.meals_cost || 0) + (trip.other_expenses || 0);
    if (minExpenses && totalExpenses < parseFloat(minExpenses)) {
      return false;
    }
    if (maxExpenses && totalExpenses > parseFloat(maxExpenses)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'miles_calculated') {
      comparison = a.miles_calculated - b.miles_calculated;
    } else if (sortBy === 'from_address') {
      comparison = a.from_address.localeCompare(b.from_address);
    } else if (sortBy === 'to_address') {
      comparison = a.to_address.localeCompare(b.to_address);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Get unique purposes for filter dropdown
  const uniquePurposes = Array.from(new Set(trips.map(t => t.purpose).filter(Boolean)));

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPurposeFilter('');
    setMinMiles('');
    setMaxMiles('');
    setMinExpenses('');
    setMaxExpenses('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const getCurrentFilters = () => ({
    query: searchQuery,
    dateFrom: startDate,
    dateTo: endDate,
    purpose: purposeFilter,
    minMiles,
    maxMiles,
    minExpenses,
    maxExpenses,
    sortBy,
    sortOrder
  });

  const applyFilters = (filters: any) => {
    setSearchQuery(filters.query || '');
    setStartDate(filters.dateFrom || '');
    setEndDate(filters.dateTo || '');
    setPurposeFilter(filters.purpose || '');
    setMinMiles(filters.minMiles || '');
    setMaxMiles(filters.maxMiles || '');
    setMinExpenses(filters.minExpenses || '');
    setMaxExpenses(filters.maxExpenses || '');
    setSortBy(filters.sortBy || 'date');
    setSortOrder(filters.sortOrder || 'desc');
  };

  const saveCurrentSearch = async () => {
    if (!newSearchName.trim()) {
      setError('Please enter a search name');
      return;
    }

    try {
      await api.post('/search/saved', {
        search_name: newSearchName,
        filters: getCurrentFilters()
      });
      setSuccess('Search saved successfully');
      setShowSaveSearch(false);
      setNewSearchName('');
      fetchSavedSearches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save search');
    }
  };

  const deleteSavedSearch = async (id: number) => {
    try {
      await api.delete(`/search/saved/${id}`);
      fetchSavedSearches();
      setSuccess('Search deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete search');
    }
  };

  // Bulk selection handlers
  const toggleTripSelection = (tripId: number) => {
    const newSelected = new Set(selectedTripIds);
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId);
    } else {
      newSelected.add(tripId);
    }
    setSelectedTripIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTripIds.size === filteredTrips.length && filteredTrips.length > 0) {
      setSelectedTripIds(new Set());
    } else {
      setSelectedTripIds(new Set(filteredTrips.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTripIds.size === 0) return;
    
    const count = selectedTripIds.size;
    if (!confirm(`Are you sure you want to delete ${count} trip${count > 1 ? 's' : ''}?`)) return;

    try {
      setIsDeleting(true);
      
      // Delete all selected trips
      await Promise.all(
        Array.from(selectedTripIds).map(id => api.delete(`/trips/${id}`))
      );
      
      // Update trips list
      setTrips(trips.filter(t => !selectedTripIds.has(t.id)));
      setSelectedTripIds(new Set());
      
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete some trips');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/export/trips/excel', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trips_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to export to Excel');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/export/trips/csv', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trips_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to export to CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Trips</h1>
        <div className="flex gap-2">
          {templates.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const template = templates.find(t => t.id === parseInt(e.target.value));
                  if (template) {
                    navigate('/trips/add', { state: { template } });
                  }
                }
              }}
              className="bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 dark:hover:bg-purple-600 cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>📋 Use Template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.template_name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleExportExcel}
            className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 dark:hover:bg-green-600 flex items-center gap-2"
            title="Export to Excel"
          >
            <span>📊</span>
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-gray-600 dark:bg-gray-500 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 dark:hover:bg-gray-600 flex items-center gap-2"
            title="Export to CSV"
          >
            <span>📄</span>
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => navigate('/trips/add')}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            ➕ Add Trip
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by location, route, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
          >
            <span>🔍</span>
            <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Advanced Filters'}</span>
            <span className="sm:hidden">{showFilters ? 'Hide' : 'Filters'}</span>
          </button>
          {(searchQuery || startDate || endDate || purposeFilter || minMiles || maxMiles || minExpenses || maxExpenses) && (
            <>
              <button
                onClick={() => setShowSaveSearch(true)}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                💾 Save Search
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Clear All
              </button>
            </>
          )}
        </div>

        {savedSearches.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Saved searches:</span>
            {savedSearches.map(search => (
              <div key={search.id} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                <button
                  onClick={() => applyFilters(search.filters)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {search.search_name}
                </button>
                <button
                  onClick={() => deleteSavedSearch(search.id)}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                >
                  <option value="">All Purposes</option>
                  {uniquePurposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Miles</label>
                  <input
                    type="number"
                    value={minMiles}
                    onChange={(e) => setMinMiles(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Miles</label>
                  <input
                    type="number"
                    value={maxMiles}
                    onChange={(e) => setMaxMiles(e.target.value)}
                    placeholder="999"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Expenses ($)</label>
                  <input
                    type="number"
                    value={minExpenses}
                    onChange={(e) => setMinExpenses(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Expenses ($)</label>
                  <input
                    type="number"
                    value={maxExpenses}
                    onChange={(e) => setMaxExpenses(e.target.value)}
                    placeholder="9999"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                >
                  <option value="date">Date</option>
                  <option value="miles_calculated">Miles</option>
                  <option value="from_address">From Address</option>
                  <option value="to_address">To Address</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {filteredTrips.length !== trips.length && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTrips.length} of {trips.length} trips
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedTripIds.size > 0 && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {selectedTripIds.size} trip{selectedTripIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedTripIds(new Set())}
              className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Delete Selected</span>
              </>
            )}
          </button>
        </div>
      )}

      {filteredTrips.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-12 text-center">
          {trips.length === 0 ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No trips recorded yet</p>
              <button
                onClick={() => navigate('/trips/add')}
                className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Add Your First Trip
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No trips match your filters</p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filteredTrips.map((trip) => {
              const totalExpenses = (trip.lodging_cost || 0) + (trip.meals_cost || 0) + (trip.other_expenses || 0);
              return (
                <div key={trip.id} className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(trip.date)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {trip.purpose || 'Inspection'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {trip.miles_calculated.toFixed(1)} mi
                      </div>
                      {totalExpenses > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          +${totalExpenses.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="mb-1">
                      <span className="font-medium">From:</span> {trip.from_address}
                    </div>
                    <div className="mb-1">
                      <span className="font-medium">To:</span> {trip.to_address}
                    </div>
                    {trip.site_name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {trip.site_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/trips/edit/${trip.id}`)}
                      className="flex-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="flex-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTripIds.size === filteredTrips.length && filteredTrips.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plant Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Miles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className={selectedTripIds.has(trip.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTripIds.has(trip.id)}
                      onChange={() => toggleTripSelection(trip.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(trip.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {trip.from_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {trip.to_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {trip.site_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {trip.purpose || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {trip.miles_calculated.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(() => {
                      const totalExpenses = (trip.lodging_cost || 0) + (trip.meals_cost || 0) + (trip.other_expenses || 0);
                      return totalExpenses > 0 ? `$${totalExpenses.toFixed(2)}` : '-';
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setShowMapModal(true);
                      }}
                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-4"
                      title="View route on map"
                    >
                      🗺️ Map
                    </button>
                    <button
                      onClick={() => navigate(`/trips/edit/${trip.id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {showSaveSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Save Current Search</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Give this search criteria a name so you can quickly apply it later.
            </p>
            <input
              type="text"
              value={newSearchName}
              onChange={(e) => setNewSearchName(e.target.value)}
              placeholder="e.g., High Mileage Trips, Last Month"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveSearch(false);
                  setNewSearchName('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentSearch}
                disabled={!newSearchName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Map Modal */}
      {showMapModal && selectedTrip && (
        <TripMapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectedTrip(null);
          }}
          fromAddress={selectedTrip.from_address}
          toAddress={selectedTrip.to_address}
          siteName={selectedTrip.site_name}
          miles={selectedTrip.miles_calculated}
          date={selectedTrip.date}
          avoidTolls={Boolean(selectedTrip.avoid_tolls)}
        />
      )}
    </div>
  );
};

export default Trips;




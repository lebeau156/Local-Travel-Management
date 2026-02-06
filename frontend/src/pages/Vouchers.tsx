import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Voucher {
  id: number;
  month: number;
  year: number;
  status: string;
  total_miles: number;
  total_amount: number;
  submitted_at?: string;
  created_at: string;
}

const Vouchers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // View toggle for supervisors
  const [activeView, setActiveView] = useState<'personal' | 'team'>('personal');

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      // Always fetch personal vouchers only
      const response = await api.get('/vouchers');
      setVouchers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async () => {
    try {
      setCreateLoading(true);
      setError('');
      const response = await api.post('/vouchers', {
        month: selectedMonth,
        year: selectedYear
      });
      setShowCreateModal(false);
      setVouchers([response.data, ...vouchers]);
      alert('Voucher created successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create voucher');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmitVoucher = async (id: number) => {
    if (!confirm('Are you sure you want to submit this voucher for approval?')) return;

    try {
      // First check if user has position set
      const profileResponse = await api.get('/profile');
      if (!profileResponse.data.position) {
        if (confirm('You must set your position in your profile before submitting vouchers. Go to Profile Setup now?')) {
          navigate('/profile/setup');
        }
        return;
      }

      const response = await api.put(`/vouchers/${id}/submit`);
      setVouchers(vouchers.map(v => v.id === id ? response.data : v));
      alert('Voucher submitted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit voucher');
    }
  };

  const handleDeleteVoucher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
      await api.delete(`/vouchers/${id}`);
      setVouchers(vouchers.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete voucher');
    }
  };

  // Filter vouchers based on criteria
  const filteredVouchers = vouchers.filter((voucher) => {
    // Status filter
    if (statusFilter && voucher.status !== statusFilter) {
      return false;
    }

    // Year filter
    if (yearFilter && voucher.year !== parseInt(yearFilter)) {
      return false;
    }

    // Amount range filter (handle null amounts)
    const amount = voucher.total_amount || 0;
    if (minAmount && amount < parseFloat(minAmount)) {
      return false;
    }
    if (maxAmount && amount > parseFloat(maxAmount)) {
      return false;
    }

    return true;
  });

  // Get unique years for filter dropdown
  const uniqueYears = Array.from(new Set(vouchers.map(v => v.year))).sort((a, b) => b - a);

  const clearFilters = () => {
    setStatusFilter('');
    setYearFilter('');
    setMinAmount('');
    setMaxAmount('');
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      supervisor_approved: 'bg-yellow-100 text-yellow-800',
      fleet_approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const labels: { [key: string]: string } = {
      draft: 'Draft',
      submitted: 'Submitted',
      supervisor_approved: 'Supervisor Approved',
      fleet_approved: 'Approved',
      rejected: 'Rejected'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is supervisor
  const isSupervisor = user?.role === 'supervisor';

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isSupervisor ? 'My Personal Vouchers' : 'Travel Vouchers'}
          </h1>
          {isSupervisor && (
            <p className="text-sm text-gray-600 mt-1">
              Your own travel vouchers. For team vouchers, visit{' '}
              <button
                onClick={() => navigate('/voucher-history')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Voucher History
              </button>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
        >
          ➕ Create Voucher
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <span>🔍</span>
            <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            <span className="sm:hidden">{showFilters ? 'Hide' : 'Filters'}</span>
          </button>
          {(statusFilter || yearFilter || minAmount || maxAmount) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear All
            </button>
          )}
          {filteredVouchers.length !== vouchers.length && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {filteredVouchers.length} of {vouchers.length} vouchers
            </div>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="supervisor_approved">Supervisor Approved</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Years</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.00"
              />
            </div>
          </div>
        )}
      </div>

      {filteredVouchers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-12 text-center">
          {vouchers.length === 0 ? (
            <>
              <p className="text-gray-500 text-lg mb-4">No vouchers created yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Create Your First Voucher
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-lg mb-4">No vouchers match your filters</p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
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
            {filteredVouchers.map((voucher) => (
              <div key={voucher.id} className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {monthNames[voucher.month - 1]} {voucher.year}
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(voucher.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${voucher.total_amount ? voucher.total_amount.toFixed(2) : '0.00'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {voucher.total_miles ? voucher.total_miles.toFixed(1) : '0.0'} miles
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Created: {new Date(voucher.created_at).toLocaleDateString()}
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/vouchers/${voucher.id}`)}
                    className="w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100"
                  >
                    View Details
                  </button>
                  <div className="flex gap-2">
                    {voucher.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSubmitVoucher(voucher.id)}
                          className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-100"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Miles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {monthNames[voucher.month - 1]} {voucher.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(voucher.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {voucher.total_miles ? voucher.total_miles.toFixed(1) : '0.0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${voucher.total_amount ? voucher.total_amount.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(voucher.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => navigate(`/vouchers/${voucher.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {voucher.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSubmitVoucher(voucher.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Create Voucher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Voucher</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVoucher}
                disabled={createLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {createLoading ? 'Creating...' : 'Create Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;



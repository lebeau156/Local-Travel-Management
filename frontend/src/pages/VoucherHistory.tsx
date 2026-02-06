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
  submitted_at: string;
  supervisor_approved_at?: string;
  fleet_approved_at?: string;
  user_id: number;
  inspector_name?: string;
  state?: string;
  circuit?: string;
}

interface Inspector {
  user_id: number;
  name: string;
  state?: string;
  circuit?: string;
  position?: string;
  email?: string;
  phone?: string;
  duty_station?: string;
  fls_name?: string;
  scsi_name?: string;
  fls_email?: string;
  scsi_email?: string;
}

const VoucherHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [inspectorFilter, setInspectorFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [circuitFilter, setCircuitFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [circuits, setCircuits] = useState<string[]>([]);
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);

  useEffect(() => {
    fetchVouchers();
    // Fetch inspectors list for supervisors and fleet managers
    if (user?.role === 'supervisor' || user?.role === 'fleet_manager' || user?.role === 'admin') {
      fetchInspectors();
    }
  }, []);

  const fetchInspectors = async () => {
    try {
      const response = await api.get('/vouchers/inspectors');
      setInspectors(response.data);
    } catch (error) {
      console.error('Error fetching inspectors:', error);
    }
  };

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      let endpoint = '/vouchers';
      const params = new URLSearchParams();
      
      // Fleet managers, admins, and supervisors use /vouchers/all with filters
      if (user?.role === 'fleet_manager' || user?.role === 'admin' || user?.role === 'supervisor') {
        endpoint = '/vouchers/all';
        
        // Add filters as query parameters
        if (inspectorFilter !== 'all') {
          params.append('inspector_id', inspectorFilter);
        }
        if (filter !== 'all') {
          params.append('status', filter);
        }
        if (monthFilter !== 'all') {
          params.append('month', monthFilter);
        }
        if (yearFilter) {
          params.append('year', yearFilter.toString());
        }
        if (stateFilter !== 'all') {
          params.append('state', stateFilter);
        }
        if (circuitFilter !== 'all') {
          params.append('circuit', circuitFilter);
        }
      }
      
      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const response = await api.get(url);
      setVouchers(response.data);
      
      // Extract unique states and circuits from vouchers
      const uniqueStates = [...new Set(response.data.map((v: Voucher) => v.state).filter(Boolean))].sort();
      const uniqueCircuits = [...new Set(response.data.map((v: Voucher) => v.circuit).filter(Boolean))].sort();
      setStates(uniqueStates as string[]);
      setCircuits(uniqueCircuits as string[]);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectorDetails = async (userId: number) => {
    try {
      const response = await api.get(`/users/${userId}/details`);
      setSelectedInspector(response.data);
      setShowInspectorModal(true);
    } catch (error) {
      console.error('Error fetching inspector details:', error);
      alert('Failed to load inspector details');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
      submitted: { bg: '#fef3c7', text: '#92400e', label: 'Pending Supervisor' },
      supervisor_approved: { bg: '#dbeafe', text: '#1e40af', label: 'Pending Fleet Manager' },
      approved: { bg: '#d1fae5', text: '#065f46', label: 'Approved' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' }
    };

    const style = styles[status] || styles.draft;
    return (
      <span style={{
        padding: '4px 12px',
        background: style.bg,
        color: style.text,
        borderRadius: '12px',
        fontSize: '9pt',
        fontWeight: 'bold'
      }}>
        {style.label}
      </span>
    );
  };

  const handleViewVoucher = (voucherId: number) => {
    navigate(`/vouchers/${voucherId}`);
  };

  const handleApplyFilters = () => {
    fetchVouchers();
  };

  // Client-side filtering is now handled by the backend
  const filteredVouchers = vouchers;

  const years = Array.from(new Set(vouchers.map(v => v.year))).sort((a, b) => b - a);
  // states and circuits are now populated from state variables, not computed here

  if (loading) {
    return (
      <div className="p-10 text-center dark:bg-gray-900 min-h-screen">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading vouchers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📋 Voucher History
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {user?.role === 'supervisor' 
            ? 'View, download, and print vouchers from your team members' 
            : user?.role === 'fleet_manager' || user?.role === 'admin'
            ? 'View, download, and print all travel vouchers'
            : 'View, download, and print your travel vouchers'
          }
        </p>
        {user?.role === 'supervisor' && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-700 rounded-lg text-sm text-blue-900 dark:text-blue-300">
            💡 <strong>Note:</strong> This page shows vouchers from your team members.{' '}
            <button
              onClick={() => navigate('/vouchers')}
              className="text-blue-600 dark:text-blue-400 underline bg-transparent border-none cursor-pointer font-bold hover:text-blue-800 dark:hover:text-blue-300"
            >
              Click here
            </button>
            {' '}to view your own personal vouchers.
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 flex-wrap">
        {/* Inspector Filter - Only for supervisors and fleet managers */}
        {(user?.role === 'supervisor' || user?.role === 'fleet_manager' || user?.role === 'admin') && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              Inspector
            </label>
            <select
              value={inspectorFilter}
              onChange={(e) => setInspectorFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
            >
              <option value="all">All Inspectors</option>
              {inspectors.map(inspector => (
                <option key={inspector.user_id} value={inspector.user_id}>
                  {inspector.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Pending Supervisor</option>
            <option value="supervisor_approved">Pending Fleet Manager</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* State Filter */}
        {(user?.role === 'supervisor' || user?.role === 'fleet_manager' || user?.role === 'admin') && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
            >
              <option value="all">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        )}

        {/* Circuit Filter */}
        {(user?.role === 'supervisor' || user?.role === 'fleet_manager' || user?.role === 'admin') && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              Circuit
            </label>
            <select
              value={circuitFilter}
              onChange={(e) => setCircuitFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
            >
              <option value="all">All Circuits</option>
              {circuits.map(circuit => (
                <option key={circuit} value={circuit}>{circuit}</option>
              ))}
            </select>
          </div>
        )}

        {/* Month Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            Month
          </label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
          >
            <option value="all">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            Year
          </label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
          >
            {years.length > 0 ? years.map(year => (
              <option key={year} value={year}>{year}</option>
            )) : (
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            )}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white border-none rounded-md font-bold cursor-pointer text-sm hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            🔍 Apply Filters
          </button>
        </div>
      </div>

      {/* Voucher List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            No vouchers found for the selected filters.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                <th className="p-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300">
                  Period
                </th>
                {(user?.role === 'fleet_manager' || user?.role === 'admin' || user?.role === 'supervisor') && (
                  <th className="p-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300">
                    Inspector
                  </th>
                )}
                <th className="p-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="p-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  Miles
                </th>
                <th className="p-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  Amount
                </th>
                <th className="p-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300">
                  Submitted
                </th>
                <th className="p-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVouchers.map((voucher, index) => (
                <tr
                  key={voucher.id}
                  className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}
                >
                  <td className="p-3 text-sm text-gray-900 dark:text-white">
                    {new Date(voucher.year, voucher.month - 1).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </td>
                  {(user?.role === 'fleet_manager' || user?.role === 'admin' || user?.role === 'supervisor') && (
                    <td className="p-3 text-sm">
                      <button
                        onClick={() => fetchInspectorDetails(voucher.user_id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium bg-transparent border-none cursor-pointer"
                        title="Click to view inspector details"
                      >
                        {voucher.inspector_name || `User ${voucher.user_id}`}
                      </button>
                    </td>
                  )}
                  <td className="p-3">
                    {getStatusBadge(voucher.status)}
                  </td>
                  <td className="p-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                    {voucher.total_miles.toFixed(1)}
                  </td>
                  <td className="p-3 text-right text-sm font-bold text-green-600 dark:text-green-400">
                    ${voucher.total_amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                    {voucher.submitted_at
                      ? new Date(voucher.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : '-'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleViewVoucher(voucher.id)}
                      className="px-4 py-1.5 bg-blue-600 dark:bg-blue-500 text-white border-none rounded cursor-pointer text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      📄 View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex gap-6 justify-around">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredVouchers.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Vouchers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {filteredVouchers.filter(v => v.status === 'approved').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Approved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${filteredVouchers.reduce((sum, v) => sum + v.total_amount, 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Amount</div>
        </div>
      </div>

      {/* Inspector Details Modal */}
      {showInspectorModal && selectedInspector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  👤 Inspector Details
                </h2>
                <p className="text-blue-100 text-sm mt-1">{selectedInspector.name}</p>
              </div>
              <button
                onClick={() => setShowInspectorModal(false)}
                className="text-white hover:text-gray-200 text-3xl font-bold bg-transparent border-none cursor-pointer"
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Personal Information Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  📋 Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Full Name</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedInspector.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Position</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedInspector.position || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                      <a href={`mailto:${selectedInspector.email}`} className="hover:underline">
                        {selectedInspector.email || 'N/A'}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {selectedInspector.phone ? (
                        <a href={`tel:${selectedInspector.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {selectedInspector.phone}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment Information Section */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  📍 Assignment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">State</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedInspector.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Circuit</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedInspector.circuit || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Duty Station</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedInspector.duty_station || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Supervisory Chain Section */}
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  👔 Supervisory Chain
                </h3>
                <div className="space-y-4">
                  {/* Front Line Supervisor */}
                  {selectedInspector.fls_name && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">FLS</span>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Front Line Supervisor (FLS)</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedInspector.fls_name}</p>
                        {selectedInspector.fls_email && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            <a href={`mailto:${selectedInspector.fls_email}`} className="hover:underline">
                              {selectedInspector.fls_email}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SCSI Supervisor */}
                  {selectedInspector.scsi_name && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400 text-xs font-bold">SCSI</span>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">SCSI Supervisor</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedInspector.scsi_name}</p>
                        {selectedInspector.scsi_email && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            <a href={`mailto:${selectedInspector.scsi_email}`} className="hover:underline">
                              {selectedInspector.scsi_email}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedInspector.fls_name && !selectedInspector.scsi_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No supervisory information available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 p-4 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setShowInspectorModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherHistory;



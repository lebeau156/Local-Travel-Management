import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface User {
  id: number;
  email: string;
  name?: string;
}

const CustomReports: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('trips');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    status: ''
  });
  const [inspectors, setInspectors] = useState<User[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Access control
  if (user?.role !== 'admin' && user?.role !== 'fleet_manager') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Access Denied: Only administrators and fleet managers can generate reports.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchInspectors();
  }, []);

  const fetchInspectors = async () => {
    try {
      const response = await api.get('/analytics/filter-options');
      // Extract inspectors from the filter options
      const inspectorsList = response.data.inspectors || [];
      setInspectors(inspectorsList);
    } catch (err) {
      console.error('Failed to fetch inspectors:', err);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      params.append('reportType', reportType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/analytics/custom-report?${params.toString()}`);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      params.append('reportType', reportType);
      params.append('format', 'excel');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/analytics/custom-report?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to export to Excel');
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (reportData.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <span className="text-5xl">📋</span>
            </div>
            <div className="text-xl font-semibold text-gray-600 dark:text-gray-300">No Data Available</div>
            <p className="text-gray-500 max-w-md">
              Configure your filters and click "Generate Report" to view results
            </p>
          </div>
        </div>
      );
    }

    const headers = Object.keys(reportData[0]);

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  {header.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((row, index) => (
              <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-150">
                {headers.map((header) => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof row[header] === 'number' && header.includes('amount')
                      ? `$${row[header].toFixed(2)}`
                      : row[header] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header - Simple Clean Design */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📊</span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Reports</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-base">Generate comprehensive reports with advanced filtering and export capabilities</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Filters Section with Enhanced Design */}
      <div className="bg-white shadow-lg rounded-2xl p-8 mb-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
            ⚙️
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Report Configuration
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Report Type */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📋</span>
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-gray-50"
            >
              <option value="trips">🚗 Trips Report</option>
              <option value="vouchers">📄 Vouchers Report</option>
              <option value="reimbursements">💰 Reimbursements Report</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📅</span>
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-gray-50"
            />
          </div>

          {/* End Date */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📅</span>
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-gray-50"
            />
          </div>

          {/* Inspector Filter */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">👤</span>
              Inspector (Optional)
            </label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-gray-50"
            >
              <option value="">All Inspectors</option>
              {inspectors.map((inspector) => (
                <option key={inspector.id} value={inspector.id}>
                  {inspector.name || inspector.email}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (for vouchers) */}
          {reportType === 'vouchers' && (
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">🏷️</span>
                Status (Optional)
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-gray-50"
              >
                <option value="">All Statuses</option>
                <option value="draft">📝 Draft</option>
                <option value="submitted">📤 Submitted</option>
                <option value="supervisor_approved">✅ Supervisor Approved</option>
                <option value="approved">✔️ Approved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons with Enhanced Design */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">🔍</span>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || reportData.length === 0}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">📥</span>
            Export to Excel
          </button>
          <button
            onClick={() => {
              setReportData([]);
              setFilters({ startDate: '', endDate: '', userId: '', status: '' });
            }}
            className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">🔄</span>
            Clear
          </button>
        </div>
      </div>

      {/* Report Results with Enhanced Design */}
      <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-xl">
              📈
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Report Results
            </h2>
          </div>
          {reportData.length > 0 && (
            <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg">
              <span className="text-green-800 font-semibold">
                {reportData.length} record{reportData.length !== 1 ? 's' : ''} found
              </span>
            </div>
          )}
        </div>
        {renderTable()}
      </div>

      {/* Report Summary with Enhanced Design */}
      {reportData.length > 0 && reportType === 'reimbursements' && (
        <div className="mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">📊</span>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Summary
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-2">
                <span className="text-xl">💵</span>
                Total Reimbursements
              </div>
              <div className="text-3xl font-bold text-green-900">
                ${reportData.reduce((sum, row) => sum + (row.total_amount || 0), 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-2">
                <span className="text-xl">🛣️</span>
                Total Miles
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {reportData.reduce((sum, row) => sum + (row.total_miles || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 mb-2">
                <span className="text-xl">📊</span>
                Average Per Voucher
              </div>
              <div className="text-3xl font-bold text-purple-900">
                ${(reportData.reduce((sum, row) => sum + (row.total_amount || 0), 0) / reportData.length).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomReports;



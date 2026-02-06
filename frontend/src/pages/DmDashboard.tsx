import React, { useEffect, useState } from 'react';
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
  Building,
  BarChart3
} from 'lucide-react';
import api from '../api/axios';

interface DmStats {
  totalDdm: number;
  totalFls: number;
  totalInspectors: number;
  totalSupervisors: number;
  pendingVouchers: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalPendingAmount: number;
  totalApprovedAmount: number;
  totalMilesThisMonth: number;
}

const DmDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DmStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDmStats();
  }, []);

  const fetchDmStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supervisors/dm-dashboard-stats');
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching DM stats:', err);
      setError('Failed to load dashboard statistics');
      setLoading(false);
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
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error || 'Failed to load dashboard'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Hero Header */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 dark:border-blue-500 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🏛️</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Director Manager Dashboard</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Executive oversight of regional operations, management hierarchy, and strategic metrics
            </p>
          </div>
        </div>
      </div>

      {/* Executive Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* District Directors */}
        <div className="bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">District Directors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDdm}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">DDM managers</p>
            </div>
            <span className="text-4xl text-indigo-600 dark:text-indigo-400">🎯</span>
          </div>
        </div>

        {/* First Line Supervisors */}
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">FLS Supervisors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalFls}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Front-line managers</p>
            </div>
            <span className="text-4xl text-blue-600 dark:text-blue-400">👔</span>
          </div>
        </div>

        {/* Total Workforce */}
        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Workforce</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalInspectors + stats.totalSupervisors}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Regional staff</p>
            </div>
            <span className="text-4xl text-green-600 dark:text-green-400">👥</span>
          </div>
        </div>

        {/* Pending Vouchers */}
        <div 
          className="bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/supervisor/dashboard')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingVouchers}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">Click to review →</p>
            </div>
            <span className="text-4xl text-orange-600 dark:text-orange-400">⏳</span>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Pending Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pending Amount</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting approval</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            ${stats.totalPendingAmount.toLocaleString()}
          </div>
        </div>

        {/* Approved This Month */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Approved Amount</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">This month</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">${stats.totalApprovedAmount.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {stats.approvedThisMonth} vouchers processed
          </p>
        </div>

        {/* Total Miles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Total Miles</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">This month</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalMilesThisMonth.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Approval Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Approval Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">{stats.approvedThisMonth}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full" 
                  style={{ width: `${stats.approvedThisMonth + stats.rejectedThisMonth > 0 ? (stats.approvedThisMonth / (stats.approvedThisMonth + stats.rejectedThisMonth)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">{stats.rejectedThisMonth}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-600 dark:bg-red-400 h-2 rounded-full" 
                  style={{ width: `${stats.approvedThisMonth + stats.rejectedThisMonth > 0 ? (stats.rejectedThisMonth / (stats.approvedThisMonth + stats.rejectedThisMonth)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Approval Rate</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.approvedThisMonth + stats.rejectedThisMonth > 0 
                    ? Math.round((stats.approvedThisMonth / (stats.approvedThisMonth + stats.rejectedThisMonth)) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Organization Structure
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">District Directors</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalDdm}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">👔</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">First Line Supervisors</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalFls}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Field Inspectors</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalInspectors}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Executive Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/supervisor/dashboard')}
            className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold text-gray-900 dark:text-white">Approve Vouchers</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Final approval authority</div>
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold text-gray-900 dark:text-white">Regional Analytics</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Strategic insights</div>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-2 border-green-200 dark:border-green-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-gray-900 dark:text-white">Executive Reports</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Custom reporting</div>
          </button>

          <button
            onClick={() => navigate('/supervisor/circuit-plants')}
            className="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">🏭</div>
            <div className="font-semibold text-gray-900 dark:text-white">Circuit Plants</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Regional facilities</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DmDashboard;

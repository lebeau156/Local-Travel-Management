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
  Building2
} from 'lucide-react';
import api from '../api/axios';

interface DdmStats {
  totalFls: number;
  totalInspectors: number;
  totalSupervisors: number;
  pendingVouchers: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalPendingAmount: number;
  totalApprovedAmount: number;
  assignmentRequests: number;
}

const DdmDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DdmStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDdmStats();
  }, []);

  const fetchDdmStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supervisors/ddm-dashboard-stats');
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching DDM stats:', err);
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
              <span className="text-4xl">🏢</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">District Director Dashboard</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Oversee district operations, supervisor teams, and approval workflows
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* FLS Supervisors */}
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">FLS Supervisors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalFls}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">First line managers</p>
            </div>
            <span className="text-4xl text-blue-600 dark:text-blue-400">👔</span>
          </div>
        </div>

        {/* Total Inspectors */}
        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Inspectors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalInspectors}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">District-wide</p>
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

        {/* Pending Amount */}
        <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalPendingAmount.toFixed(0)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">awaiting approval</p>
            </div>
            <span className="text-4xl text-purple-600 dark:text-purple-400">💰</span>
          </div>
        </div>
      </div>

      {/* Voucher Activity Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Approved This Month */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Approved This Month</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vouchers processed</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.approvedThisMonth}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">vouchers</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total approved: <span className="font-semibold text-green-600 dark:text-green-400">${stats.totalApprovedAmount.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Rejected This Month */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rejected This Month</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Returned for revision</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.rejectedThisMonth}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">vouchers</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Approval rate: <span className="font-semibold">{stats.approvedThisMonth + stats.rejectedThisMonth > 0 ? Math.round((stats.approvedThisMonth / (stats.approvedThisMonth + stats.rejectedThisMonth)) * 100) : 0}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/supervisor/dashboard')}
            className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold text-gray-900 dark:text-white">Approve Vouchers</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review pending requests</div>
          </button>

          <button
            onClick={() => navigate('/supervisor/circuit-plants')}
            className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-2 border-green-200 dark:border-green-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">🏭</div>
            <div className="font-semibold text-gray-900 dark:text-white">Circuit Plants</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage plant locations</div>
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold text-gray-900 dark:text-white">Analytics</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">View district metrics</div>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-gray-900 dark:text-white">Reports</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generate custom reports</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DdmDashboard;

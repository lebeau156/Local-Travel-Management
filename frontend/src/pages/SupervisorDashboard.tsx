import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';
import api from '../api/axios';

interface Supervisor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
}

const SupervisorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approvedThisMonth: 0,
    totalInspectors: 0,
    totalAmountPending: 0
  });
  const [pendingVouchers, setPendingVouchers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [flsSupervisor, setFlsSupervisor] = useState<Supervisor | null>(null);
  const [userPosition, setUserPosition] = useState<string>('');

  useEffect(() => {
    fetchData();
    fetchFlsSupervisor();
  }, []);

  const fetchFlsSupervisor = async () => {
    try {
      // Get current user's profile to find FLS supervisor
      const userRes = await api.get('/profile');
      
      // Store user's position
      if (userRes.data.position) {
        setUserPosition(userRes.data.position);
      }
      
      if (userRes.data.fls_supervisor_id) {
        // Get list of supervisors and find the FLS
        const supervisorsRes = await api.get('/supervisors/list');
        const fls = supervisorsRes.data.find(
          (s: Supervisor) => s.id === userRes.data.fls_supervisor_id
        );
        if (fls) {
          setFlsSupervisor(fls);
        }
      }
    } catch (err) {
      console.error('Failed to fetch FLS supervisor:', err);
    }
  };

  // Get supervisor label based on user's position
  const getSupervisorLabel = () => {
    const pos = userPosition.toUpperCase();
    if (pos.includes('SCSI') || pos.includes('PHV')) {
      return 'Your FLS Supervisor';
    } else if (pos.includes('FLS')) {
      return 'Your DDM Supervisor';
    } else if (pos.includes('DDM')) {
      return 'Your DM Supervisor';
    }
    return 'Your Supervisor';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vouchersResponse, auditResponse] = await Promise.all([
        api.get('/vouchers/pending?tab=my-team'),
        api.get('/audit?limit=10')
      ]);
      
      const vouchers = vouchersResponse.data;
      const auditLogs = auditResponse.data.logs;

      const pending = vouchers.filter((v: any) => v.status === 'submitted');
      const totalPending = pending.reduce((sum: number, v: any) => sum + v.total_amount, 0);

      const allVouchersRes = await api.get('/vouchers');
      const allVouchers = allVouchersRes.data;
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const approvedThisMonth = allVouchers.filter((v: any) => {
        if (v.status === 'supervisor_approved' || v.status === 'approved') {
          const approvedDate = new Date(v.supervisor_approved_at || v.created_at);
          return approvedDate.getMonth() === currentMonth && approvedDate.getFullYear() === currentYear;
        }
        return false;
      }).length;

      const inspectorIds = new Set(vouchers.map((v: any) => v.user_id));

      setStats({
        pendingApprovals: pending.length,
        approvedThisMonth,
        totalInspectors: inspectorIds.size,
        totalAmountPending: totalPending
      });

      setPendingVouchers(vouchers.slice(0, 10));
      setRecentActivity(auditLogs);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (voucherId: number) => {
    if (!confirm('Approve this voucher?')) return;
    
    try {
      await api.post(`/vouchers/${voucherId}/approve-supervisor`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve voucher');
    }
  };

  const handleReject = async (voucherId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await api.post(`/vouchers/${voucherId}/reject`, { reason });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject voucher');
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE_TRIP: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      UPDATE_TRIP: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      DELETE_TRIP: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      CREATE_VOUCHER: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      SUBMIT_VOUCHER: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      APPROVE_VOUCHER_SUPERVISOR: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    };
    return colors[action] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
              <span className="text-4xl">👨‍💼</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supervisor Dashboard</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Manage and approve travel vouchers for your team
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* FLS Supervisor Info Card */}
            {flsSupervisor && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 min-w-[250px]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">{getSupervisorLabel()}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {flsSupervisor.first_name} {flsSupervisor.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{flsSupervisor.position}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{flsSupervisor.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Approvals Badge */}
            {stats.pendingApprovals > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-600 rounded-lg px-6 py-3">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">Awaiting Approval</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-300">{stats.pendingApprovals}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">voucher{stats.pendingApprovals > 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingApprovals}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">to review</p>
            </div>
            <span className="text-4xl text-orange-600 dark:text-orange-400">⏳</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Approved</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approvedThisMonth}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">this month</p>
            </div>
            <span className="text-4xl text-green-600 dark:text-green-400">✅</span>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/supervisor/team')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalInspectors}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">Click to manage →</p>
            </div>
            <span className="text-4xl text-blue-600 dark:text-blue-400">👥</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalAmountPending.toFixed(0)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">awaiting approval</p>
            </div>
            <span className="text-4xl text-purple-600 dark:text-purple-400">💰</span>
          </div>
        </div>
      </div>

      {/* Pending Vouchers */}
      {pendingVouchers.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 border-l-4 border-purple-600 dark:border-purple-500 rounded-lg shadow-md dark:shadow-gray-900/50 mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vouchers Awaiting Approval</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Review and approve travel reimbursement requests</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {pendingVouchers.map((voucher) => (
              <div key={voucher.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-lg flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xl">
                      {(voucher.user_name || voucher.user_email)?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {voucher.user_name || voucher.user_email}
                      </h3>
                      <span className="text-sm px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                        {new Date(0, voucher.month - 1).toLocaleString('default', { month: 'long' })} {voucher.year}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Trips</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{voucher.trip_count || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-3">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">Miles</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{voucher.total_miles?.toFixed(0) || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 border-2 border-green-200 dark:border-green-700 rounded-lg p-3">
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">Amount</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-300">${voucher.total_amount?.toFixed(2) || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-3">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">Submitted</p>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-300">
                        {new Date(voucher.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap lg:flex-nowrap">
                    <button
                      onClick={() => navigate(`/vouchers/${voucher.id}`)}
                      className="px-6 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <span>📄</span> View
                    </button>
                    <button
                      onClick={() => handleApprove(voucher.id)}
                      className="px-6 py-2.5 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <span>✅</span> Approve
                    </button>
                    <button
                      onClick={() => handleReject(voucher.id)}
                      className="px-6 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <span>❌</span> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-12 text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-full flex items-center justify-center">
              <span className="text-6xl">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">All Caught Up!</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">No vouchers pending approval at this time.</p>
          </div>
        </div>
      )}

      {/* Recent Activity Log */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-indigo-600 dark:border-indigo-500 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Team Activity</h2>
          </div>
          <button
            onClick={() => navigate('/audit-logs')}
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm font-semibold transition-all"
          >
            View All →
          </button>
        </div>
        <div className="space-y-2">
          {recentActivity.slice(0, 8).map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
              <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${getActionBadge(log.action)}`}>
                {log.action.replace(/_/g, ' ')}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-gray-300">
                  <span className="font-bold">{log.first_name} {log.last_name}</span>
                  {' '}
                  <span className="text-gray-500 dark:text-gray-400">on {log.resource_type} #{log.resource_id}</span>
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;



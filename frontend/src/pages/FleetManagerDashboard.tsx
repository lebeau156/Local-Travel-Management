import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const FleetManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingFinalApproval: 0,
    approvedThisMonth: 0,
    totalPaidThisMonth: 0,
    totalInspectors: 0,
    totalMilesThisMonth: 0,
    averageVoucherAmount: 0
  });
  const [pendingVouchers, setPendingVouchers] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vouchersResponse, auditResponse] = await Promise.all([
        api.get('/vouchers/pending-fleet'),
        api.get('/audit/stats')
      ]);
      
      const vouchers = vouchersResponse.data;

      // Get all vouchers for stats
      const allVouchersRes = await api.get('/vouchers/all');
      const allVouchers = allVouchersRes.data;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Pending final approval
      const pending = allVouchers.filter((v: any) => v.status === 'supervisor_approved');

      // Approved this month
      const approvedThisMonth = allVouchers.filter((v: any) => {
        if (v.status === 'approved') {
          const approvedDate = new Date(v.fleet_approved_at || v.created_at);
          return approvedDate.getMonth() === currentMonth && approvedDate.getFullYear() === currentYear;
        }
        return false;
      });

      const totalPaid = approvedThisMonth.reduce((sum: number, v: any) => sum + v.total_amount, 0);
      const totalMiles = approvedThisMonth.reduce((sum: number, v: any) => sum + v.total_miles, 0);

      // Unique inspectors
      const inspectorIds = new Set(allVouchers.map((v: any) => v.user_id));

      // Average voucher amount
      const avgAmount = allVouchers.length > 0 
        ? allVouchers.reduce((sum: number, v: any) => sum + v.total_amount, 0) / allVouchers.length
        : 0;

      // 6-month trend
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthVouchers = allVouchers.filter((v: any) => {
          if (v.status === 'approved' && v.fleet_approved_at) {
            const approvedDate = new Date(v.fleet_approved_at);
            return approvedDate.getMonth() === month.getMonth() && 
                   approvedDate.getFullYear() === month.getFullYear();
          }
          return false;
        });
        const amount = monthVouchers.reduce((sum: number, v: any) => sum + v.total_amount, 0);
        monthlyData.push({
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          amount: amount,
          count: monthVouchers.length
        });
      }

      setStats({
        pendingFinalApproval: pending.length,
        approvedThisMonth: approvedThisMonth.length,
        totalPaidThisMonth: totalPaid,
        totalInspectors: inspectorIds.size,
        totalMilesThisMonth: totalMiles,
        averageVoucherAmount: avgAmount
      });

      setPendingVouchers(vouchers.slice(0, 10));
      setMonthlyTrend(monthlyData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (voucherId: number) => {
    if (!confirm('Give final approval to this voucher for payment processing?')) return;
    
    try {
      await api.post(`/vouchers/${voucherId}/approve-fleet`);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve voucher');
    }
  };

  const handleReject = async (voucherId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await api.post(`/vouchers/${voucherId}/reject`, { reason });
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject voucher');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Hero Header */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 dark:border-blue-500 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">✅</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Approvals</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Review and approve travel vouchers for payment processing</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg px-6 py-4 text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">{stats.pendingFinalApproval}</div>
            <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">Pending Approval</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Card 1: Approved This Month */}
        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">✔️</span>
            </div>
            <div className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
              This Month
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Vouchers Approved</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approvedThisMonth}</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400 font-semibold">${stats.totalPaidThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> paid
            </div>
          </div>
        </div>

        {/* Card 2: Total Miles */}
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">🛣️</span>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
              This Month
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Total Miles</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMilesThisMonth.toLocaleString()}</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Reimbursed miles
            </div>
          </div>
        </div>

        {/* Card 3: Active Inspectors */}
        <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
              Active
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Active Inspectors</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalInspectors}</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Avg. voucher: <span className="font-semibold text-purple-600 dark:text-purple-400">${stats.averageVoucherAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Vouchers Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-xl">⏳</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Pending Final Approval
            </h2>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {pendingVouchers.length} voucher{pendingVouchers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Vouchers List */}
        {pendingVouchers.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center">
                <span className="text-5xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">All Caught Up!</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                No vouchers pending your approval at this time. Great job keeping everything up to date!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingVouchers.map((voucher) => (
              <div 
                key={voucher.id} 
                className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Voucher Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {voucher.user_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {voucher.user_name || voucher.user_email}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                            {new Date(0, voucher.month - 1).toLocaleString('default', { month: 'long' })} {voucher.year}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            ✓ Supervisor Approved
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trips</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{voucher.trip_count || 0}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Miles</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{voucher.total_miles?.toFixed(0) || 0}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mileage</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">${((voucher.total_miles || 0) * 0.67).toFixed(2)}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          ${((voucher.total_lodging || 0) + (voucher.total_meals || 0) + (voucher.total_other || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-3 border-2 border-indigo-200 dark:border-indigo-700">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${voucher.total_amount?.toFixed(2) || 0}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        📤 Submitted: {new Date(voucher.submitted_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        ✅ Approved: {new Date(voucher.supervisor_approved_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex lg:flex-col gap-3">
                    <button
                      onClick={() => navigate(`/vouchers/${voucher.id}`)}
                      className="flex-1 lg:w-40 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>📄</span>
                      View Details
                    </button>
                    <button
                      onClick={() => handleApprove(voucher.id)}
                      className="flex-1 lg:w-40 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-600 dark:to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-700 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>✅</span>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(voucher.id)}
                      className="flex-1 lg:w-40 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-600 dark:to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 dark:hover:from-red-700 dark:hover:to-rose-700 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>❌</span>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Need More Details?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">View comprehensive analytics and generate custom reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/analytics')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-600 dark:to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span>📈</span>
              Analytics
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-600 dark:to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-700 dark:hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span>📊</span>
              Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetManagerDashboard;



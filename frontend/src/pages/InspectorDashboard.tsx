import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const InspectorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    thisMonthTrips: 0,
    thisMonthMiles: 0,
    thisMonthAmount: 0,
    pendingVouchers: 0,
    lastVoucherAmount: 0,
    todayTrips: 0
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Format date without timezone conversion
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsResponse, vouchersResponse] = await Promise.all([
        api.get('/trips'),
        api.get('/vouchers')
      ]);
      
      const trips = tripsResponse.data;
      const vouchers = vouchersResponse.data;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const today = now.toISOString().slice(0, 10);

      // This month's trips
      const monthTrips = trips.filter((trip: any) => {
        const tripDate = new Date(trip.date);
        return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
      });

      // Today's trips
      const todayTrips = trips.filter((trip: any) => trip.date === today);

      // Calculate totals
      const totalMiles = monthTrips.reduce((sum: number, trip: any) => sum + trip.miles_calculated, 0);
      const totalExpenses = monthTrips.reduce((sum: number, trip: any) => 
        sum + (trip.lodging_cost || 0) + (trip.meals_cost || 0) + (trip.other_expenses || 0), 0
      );
      const mileageAmount = totalMiles * 0.67;
      const totalAmount = mileageAmount + totalExpenses;

      // Pending vouchers
      const pending = vouchers.filter((v: any) => v.status === 'draft' || v.status === 'submitted').length;

      // Last voucher
      const lastVoucher = vouchers.find((v: any) => v.status === 'approved');

      // Last 6 months chart data
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthTrips = trips.filter((trip: any) => {
          const tripDate = new Date(trip.date);
          return tripDate.getMonth() === month.getMonth() && tripDate.getFullYear() === month.getFullYear();
        });
        const miles = monthTrips.reduce((sum: number, trip: any) => sum + trip.miles_calculated, 0);
        monthlyData.push({
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          miles: miles,
          amount: miles * 0.67
        });
      }

      setStats({
        thisMonthTrips: monthTrips.length,
        thisMonthMiles: totalMiles,
        thisMonthAmount: totalAmount,
        pendingVouchers: pending,
        lastVoucherAmount: lastVoucher?.total_amount || 0,
        todayTrips: todayTrips.length
      });

      setRecentTrips(trips.slice(0, 5));
      setChartData(monthlyData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
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
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 dark:border-blue-500 rounded-lg shadow dark:shadow-gray-900/50 p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, Inspector! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {stats.todayTrips > 0 && (
          <p className="mt-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 inline-block px-3 py-1 rounded">
            🚗 {stats.todayTrips} trip{stats.todayTrips > 1 ? 's' : ''} logged today
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow dark:shadow-gray-900/50 p-6 hover:shadow-md dark:hover:shadow-gray-900/70 transition">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-800 rounded-full p-3">
              <span className="text-3xl">🚗</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">This Month</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-white">{stats.thisMonthTrips}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">trips</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-lg shadow dark:shadow-gray-900/50 p-6 hover:shadow-md dark:hover:shadow-gray-900/70 transition">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-800 rounded-full p-3">
              <span className="text-3xl">📏</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Miles</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-white">{stats.thisMonthMiles.toFixed(0)}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">this month</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700 rounded-lg shadow dark:shadow-gray-900/50 p-6 hover:shadow-md dark:hover:shadow-gray-900/70 transition">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-800 rounded-full p-3">
              <span className="text-3xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Est. Amount</p>
              <p className="text-2xl font-bold text-green-900 dark:text-white">${stats.thisMonthAmount.toFixed(0)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">to claim</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border border-orange-200 dark:border-orange-700 rounded-lg shadow dark:shadow-gray-900/50 p-6 hover:shadow-md dark:hover:shadow-gray-900/70 transition">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-800 rounded-full p-3">
              <span className="text-3xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-white">{stats.pendingVouchers}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">vouchers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/trips/add')}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span className="text-xl">➕</span>
            <span>Add Trip</span>
          </button>
          <button
            onClick={() => navigate('/trips')}
            className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 px-4 py-3 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span className="text-xl">📋</span>
            <span>View Trips</span>
          </button>
          <button
            onClick={() => navigate('/vouchers')}
            className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-700 px-4 py-3 rounded-lg font-medium hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span className="text-xl">📄</span>
            <span>Vouchers</span>
          </button>
          <button
            onClick={() => navigate('/profile/setup')}
            className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-200 dark:border-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span className="text-xl">⚙️</span>
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* 6-Month Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6-Month Travel Trend</h2>
        <div className="h-48 flex items-end justify-between gap-2">
          {chartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full group">
                <div 
                  className="bg-blue-500 dark:bg-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 transition rounded-t cursor-pointer"
                  style={{ height: `${(data.miles / Math.max(...chartData.map(d => d.miles))) * 160}px` }}
                  title={`${data.miles.toFixed(0)} miles`}
                ></div>
                <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {data.miles.toFixed(0)} mi<br/>${data.amount.toFixed(0)}
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trips */}
      {recentTrips.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Trips</h2>
            <button
              onClick={() => navigate('/trips')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => navigate(`/trips/edit/${trip.id}`)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(trip.date)}
                      </span>
                      {trip.site_name && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                          {trip.site_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {trip.from_address} → {trip.to_address}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {trip.purpose || 'No purpose specified'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{trip.miles_calculated.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">miles</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorDashboard;



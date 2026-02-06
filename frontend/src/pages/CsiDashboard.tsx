import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  User, 
  MapPin, 
  Calendar, 
  Car, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  UserPlus,
  Route as RouteIcon
} from 'lucide-react';

interface Profile {
  first_name: string;
  last_name: string;
  position: string;
  state: string;
  circuit: string;
  supervisor_id: number | null;
}

interface Supervisor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
}

interface Trip {
  id: number;
  date: string;
  purpose: string;
  site_name: string | null;
  miles_calculated: number;
  status: string;
}

interface Voucher {
  id: number;
  month: number;
  year: number;
  status: string;
  total_amount: number;
}

interface Stats {
  totalTrips: number;
  totalMiles: number;
  pendingVouchers: number;
  approvedVouchers: number;
  thisMonthTrips: number;
  thisMonthMiles: number;
}

export default function CsiDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [flsSupervisor, setFlsSupervisor] = useState<Supervisor | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTrips: 0,
    totalMiles: 0,
    pendingVouchers: 0,
    approvedVouchers: 0,
    thisMonthTrips: 0,
    thisMonthMiles: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch profile
      console.log('Fetching profile...');
      const profileRes = await api.get('/profile');
      setProfile(profileRes.data);
      console.log('Profile loaded:', profileRes.data);

      // Fetch supervisor if assigned
      if (profileRes.data.supervisor_id) {
        try {
          console.log('Fetching SCSI supervisor...');
          const supervisorRes = await api.get(`/supervisors/available`);
          const assignedSupervisor = supervisorRes.data.find(
            (s: Supervisor) => s.id === profileRes.data.supervisor_id
          );
          if (assignedSupervisor) {
            setSupervisor(assignedSupervisor);
            console.log('SCSI supervisor loaded:', assignedSupervisor);
          }
        } catch (err) {
          console.error('Failed to fetch supervisor:', err);
        }
      }

      // Fetch FLS supervisor if assigned
      console.log('Fetching user data for FLS...');
      const userRes = await api.get('/auth/me');
      console.log('User data loaded, FLS ID:', userRes.data.fls_supervisor_id);
      
      if (userRes.data.fls_supervisor_id) {
        try {
          console.log('Fetching FLS supervisor...');
          const flsRes = await api.get(`/supervisors/available-fls`);
          const assignedFls = flsRes.data.find(
            (s: Supervisor) => s.id === userRes.data.fls_supervisor_id
          );
          if (assignedFls) {
            setFlsSupervisor(assignedFls);
            console.log('FLS supervisor loaded:', assignedFls);
          }
        } catch (err) {
          console.error('Failed to fetch FLS supervisor:', err);
        }
      }

      // Fetch recent trips
      console.log('Fetching trips...');
      const tripsRes = await api.get('/trips');
      const allTrips = tripsRes.data;
      setRecentTrips(allTrips.slice(0, 5));
      console.log('Trips loaded:', allTrips.length);

      // Fetch recent vouchers
      console.log('Fetching vouchers...');
      const vouchersRes = await api.get('/vouchers');
      const allVouchers = vouchersRes.data;
      setRecentVouchers(allVouchers.slice(0, 5));
      console.log('Vouchers loaded:', allVouchers.length);

      // Calculate stats
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const thisMonthTrips = allTrips.filter((t: Trip) => {
        const tripDate = new Date(t.date);
        return tripDate.getMonth() + 1 === currentMonth && tripDate.getFullYear() === currentYear;
      });

      const calculatedStats = {
        totalTrips: allTrips.length,
        totalMiles: allTrips.reduce((sum: number, t: Trip) => sum + (t.miles_calculated || 0), 0),
        pendingVouchers: allVouchers.filter((v: Voucher) => v.status === 'submitted').length,
        approvedVouchers: allVouchers.filter((v: Voucher) => v.status === 'approved').length,
        thisMonthTrips: thisMonthTrips.length,
        thisMonthMiles: thisMonthTrips.reduce((sum: number, t: Trip) => sum + (t.miles_calculated || 0), 0)
      };
      
      setStats(calculatedStats);
      console.log('Stats calculated:', calculatedStats);
      console.log('✅ Dashboard data loaded successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to load dashboard data: ${errorMsg}`);
      console.error('Dashboard error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSupervisor = async () => {
    try {
      // This would open a modal or navigate to a page to select and request a supervisor
      // For now, navigate to team management
      navigate('/supervisor/team');
    } catch (err: any) {
      setError('Failed to request supervisor assignment');
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
    <div className="p-6 bg-blue-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 dark:border-blue-500 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {profile?.first_name || 'Inspector'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {profile?.position || 'Consumer Safety Inspector'} - {profile?.office || `${profile?.state || 'N/A'} / ${profile?.circuit || 'N/A'}`}
            </p>
          </div>
          <User className="w-16 h-16 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Supervisors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* My SCSI Supervisor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              supervisor ? 'bg-green-100 dark:bg-green-900' : 'bg-orange-100 dark:bg-orange-900'
            }`}>
              <User className={`w-6 h-6 ${supervisor ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">My Supervisor (SCSI)</h3>
              {supervisor ? (
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                    {supervisor.first_name} {supervisor.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{supervisor.position || 'SCSI'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{supervisor.email}</p>
                </div>
              ) : (
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Not Assigned</p>
                  <button
                    onClick={handleRequestSupervisor}
                    className="mt-2 text-xs flex items-center gap-1 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    <UserPlus className="w-3 h-3" />
                    Request Assignment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Front Line Supervisor (FLS) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              flsSupervisor ? 'bg-blue-100 dark:bg-blue-900' : 'bg-orange-100 dark:bg-orange-900'
            }`}>
              <User className={`w-6 h-6 ${flsSupervisor ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">My Front Line Supervisor (FLS)</h3>
              {flsSupervisor ? (
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                    {flsSupervisor.first_name} {flsSupervisor.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{flsSupervisor.position || 'FLS'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{flsSupervisor.email}</p>
                </div>
              ) : (
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Not Assigned</p>
                  <button
                    onClick={() => navigate('/profile/setup')}
                    className="mt-2 text-xs flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <UserPlus className="w-3 h-3" />
                    Update in Profile Setup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Trips */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Trips</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalTrips}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stats.totalMiles.toFixed(1)} miles</p>
            </div>
            <Car className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">This Month</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.thisMonthTrips}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stats.thisMonthMiles.toFixed(1)} miles</p>
            </div>
            <Calendar className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Vouchers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Vouchers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.approvedVouchers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stats.pendingVouchers} pending</p>
            </div>
            <FileText className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/trips/add')}
            className="flex items-center gap-3 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all"
          >
            <RouteIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">Add Trip</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Record new trip</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/vouchers')}
            className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all"
          >
            <FileText className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Create Voucher</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Submit for approval</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/trips')}
            className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-all"
          >
            <Car className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">My Trips</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">View all trips</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-400 transition-all"
          >
            <Calendar className="w-6 h-6 text-orange-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Calendar</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">View schedule</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Trips</h2>
            <button
              onClick={() => navigate('/trips')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          {recentTrips.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No trips recorded yet</p>
              <button
                onClick={() => navigate('/trips/add')}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Add your first trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => navigate(`/trips/edit/${trip.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{trip.purpose}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          trip.status === 'approved' ? 'bg-green-100 text-green-800' :
                          trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                      {trip.site_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">📍 {trip.site_name}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(trip.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-blue-600">{trip.miles_calculated?.toFixed(1) || 0}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">miles</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Vouchers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Vouchers</h2>
            <button
              onClick={() => navigate('/vouchers')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          {recentVouchers.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No vouchers created yet</p>
              <button
                onClick={() => navigate('/vouchers')}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Create your first voucher
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(voucher.year, voucher.month - 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ${voucher.total_amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    voucher.status === 'approved' ? 'bg-green-100 text-green-800' :
                    voucher.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                    voucher.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {voucher.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEffect, ReactNode } from 'react';
import { loadGoogleMapsScript } from './utils/googleMapsLoader';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CsiDashboard from './pages/CsiDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import ScsiSupervisorDashboard from './pages/ScsiSupervisorDashboard';
import FlsDashboard from './pages/FlsDashboard';
import DdmDashboard from './pages/DdmDashboard';
import DmDashboard from './pages/DmDashboard';
import FlsAssignmentRequests from './pages/FlsAssignmentRequests';
import CircuitPlants from './pages/CircuitPlants';
import CircuitPlantsMap from './pages/CircuitPlantsMap';
import DistrictCircuitPlantsMap from './pages/DistrictCircuitPlantsMap';
import CircuitPlantsBulkImport from './pages/CircuitPlantsBulkImport';
import FleetManagerDashboard from './pages/FleetManagerDashboard';
import FleetManagerDashboardNew from './pages/FleetManagerDashboardNew';
import FleetManagerDashboardOption2 from './pages/FleetManagerDashboardOption2';
import FleetManagerDashboardOption3 from './pages/FleetManagerDashboardOption3';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import EmailSettings from './pages/EmailSettings';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CustomReports from './pages/CustomReports';
import ProfileSetup from './pages/ProfileSetup';
import Trips from './pages/Trips';
import AddTrip from './pages/AddTrip';
import Vouchers from './pages/Vouchers';
import VoucherDetail from './pages/VoucherDetail';
import VoucherHistory from './pages/VoucherHistory';
import Messages from './pages/Messages';
import AuditLogs from './pages/AuditLogs';
import BackupManagement from './pages/BackupManagement';
import Settings from './pages/Settings';
import MileageRatesManagement from './pages/MileageRatesManagement';
import SystemConfiguration from './pages/SystemConfiguration';
import BulkTripImport from './pages/BulkTripImport';
import TripTemplates from './pages/TripTemplates';
import CalendarView from './pages/CalendarView';
import TeamManagement from './pages/TeamManagement';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  // Load Google Maps API script on app startup
  useEffect(() => {
    console.log('🚀 App mounted - attempting to load Google Maps API');
    loadGoogleMapsScript().catch(err => {
      console.log('Google Maps API not available on app start:', err);
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* PUBLIC REGISTRATION DISABLED FOR USDA COMPLIANCE */}
            {/* Accounts created hierarchically by supervisors/admins only */}
            {/* <Route path="/register" element={<Register />} /> */}
            
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/inspector/dashboard" element={<CsiDashboard />} />
                      <Route path="/fleet/overview" element={<FleetManagerDashboardNew />} />
                      <Route path="/fleet/option2" element={<FleetManagerDashboardOption2 />} />
                      <Route path="/fleet/option3" element={<FleetManagerDashboardOption3 />} />
                      <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
                      <Route path="/supervisor/scsi-dashboard" element={<ScsiSupervisorDashboard />} />
                      <Route path="/supervisor/fls-dashboard" element={<FlsDashboard />} />
                      <Route path="/supervisor/ddm-dashboard" element={<DdmDashboard />} />
                      <Route path="/supervisor/dm-dashboard" element={<DmDashboard />} />
                      <Route path="/supervisor/assignment-requests" element={<FlsAssignmentRequests />} />
                      <Route path="/supervisor/circuit-plants" element={<CircuitPlants />} />
                      <Route path="/supervisor/circuit-plants-map" element={<CircuitPlantsMap />} />
                      <Route path="/supervisor/district-plants-map" element={<DistrictCircuitPlantsMap />} />
                      <Route path="/supervisor/circuit-plants-import" element={<CircuitPlantsBulkImport />} />
                      <Route path="/supervisor/team" element={<TeamManagement />} />
                      <Route path="/fleet/dashboard" element={<FleetManagerDashboard />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<UserManagement />} />
                      <Route path="/admin/email-settings" element={<EmailSettings />} />
                      <Route path="/admin/mileage-rates" element={<MileageRatesManagement />} />
                      <Route path="/admin/system-config" element={<SystemConfiguration />} />
                      <Route path="/admin/bulk-import" element={<BulkTripImport />} />
                      <Route path="/analytics" element={<AnalyticsDashboard />} />
                      <Route path="/reports" element={<CustomReports />} />
                      <Route path="/profile/setup" element={<ProfileSetup />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/trips" element={<Trips />} />
                      <Route path="/trips/add" element={<AddTrip />} />
                      <Route path="/trips/edit/:id" element={<AddTrip />} />
                      <Route path="/templates" element={<TripTemplates />} />
                      <Route path="/calendar" element={<CalendarView />} />
                      <Route path="/vouchers" element={<Vouchers />} />
                      <Route path="/vouchers/:id" element={<VoucherDetail />} />
                      <Route path="/voucher-history" element={<VoucherHistory />} />
                      <Route path="/audit-logs" element={<AuditLogs />} />
                      <Route path="/activity-log" element={<AuditLogs />} />
                      <Route path="/backup" element={<BackupManagement />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

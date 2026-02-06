import React from 'react';
import { useAuth } from '../context/AuthContext';
import InspectorDashboard from './InspectorDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import FleetManagerDashboard from './FleetManagerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Route to role-specific dashboard
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'supervisor') {
    return <SupervisorDashboard />;
  }

  if (user?.role === 'fleet_manager') {
    return <FleetManagerDashboard />;
  }

  // Default to inspector dashboard
  return <InspectorDashboard />;
};

export default Dashboard;



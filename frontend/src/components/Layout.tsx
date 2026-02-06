import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import api from '../api/axios';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

interface LayoutProps {
  children: React.ReactNode;
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
  position?: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { unreadCount } = useUnreadMessages();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profile');
      console.log('Profile loaded:', response.data);
      setUserProfile(response.data);
    } catch (err) {
      console.log('Profile not yet set up');
    }
  };

  const getGreeting = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      // Determine title based on first name (simple heuristic)
      const title = 'Mr.'; // Default to Mr., you can enhance this logic
      return `Welcome ${title} ${userProfile.first_name} ${userProfile.last_name}`;
    }
    return user?.email || 'Welcome';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getNavItems = () => {
    const role = user?.role;
    const position = userProfile?.position;
    
    if (role === 'admin') {
      return [
        { path: '/dashboard', label: 'Admin Dashboard', icon: '🛡️' },
        { path: '/messages', label: 'Messages', icon: '💬' },
        { path: '/admin/users', label: 'User Management', icon: '👥' },
        { path: '/admin/mileage-rates', label: 'Mileage Rates', icon: '💰' },
        { path: '/admin/bulk-import', label: 'Bulk Trip Import', icon: '📥' },
        { path: '/admin/system-config', label: 'System Config', icon: '🔧' },
        { path: '/analytics', label: 'Analytics', icon: '📈' },
        { path: '/reports', label: 'Custom Reports', icon: '📊' },
        { path: '/admin/email-settings', label: 'Email Settings', icon: '📧' },
        { path: '/audit-logs', label: 'Activity Log', icon: '📋' },
        { path: '/backup', label: 'Backup & Restore', icon: '💾' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
        { path: '/profile/setup', label: 'Profile', icon: '👤' },
      ];
    }
    
    if (role === 'supervisor') {
      // Check if this is a SCSI supervisor, FLS, DDM, or DM
      const isSCSI = position === 'SCSI';
      const isFLS = position === 'FLS' || position === 'First Line Supervisor';
      const isPHV = position === 'PHV' || position === 'SPHV';
      const isDDM = position === 'DDM' || position === 'District Director Manager';
      const isDM = position === 'DM' || position === 'Director Manager';
      console.log('Supervisor menu - Position:', position, 'isSCSI:', isSCSI, 'isFLS:', isFLS, 'isPHV:', isPHV, 'isDDM:', isDDM, 'isDM:', isDM);
      
      // Build menu based on position hierarchy
      const menuItems = [];
      
      // Add appropriate dashboard for each position type
      if (isDM) {
        menuItems.push({ path: '/supervisor/dm-dashboard', label: 'My Dashboard', icon: '📊' });
      } else if (isDDM) {
        menuItems.push({ path: '/supervisor/ddm-dashboard', label: 'My Dashboard', icon: '📊' });
      } else if (isFLS) {
        menuItems.push({ path: '/supervisor/fls-dashboard', label: 'My Dashboard', icon: '📊' });
      } else if (isSCSI) {
        menuItems.push({ path: '/supervisor/scsi-dashboard', label: 'My Dashboard', icon: '📊' });
      } else {
        // Default for other supervisors
        menuItems.push({ path: '/supervisor/dashboard', label: 'My Dashboard', icon: '📊' });
      }
      
      // Approvals - available to all supervisors
      menuItems.push({ path: '/supervisor/dashboard', label: 'Approvals', icon: '✅' });
      
      // Messages - available to all supervisors
      menuItems.push({ path: '/messages', label: 'Messages', icon: '💬' });
      
      // Assignment Requests - only for FLS
      if (isFLS) {
        menuItems.push({ path: '/supervisor/assignment-requests', label: 'Assignment Requests', icon: '📝' });
      }
      
      // Circuit Plants - only for FLS/SCSI (not DDM/DM)
      if (!isDDM && !isDM) {
        menuItems.push({ path: '/supervisor/circuit-plants', label: 'Circuit Plants', icon: '🏭' });
        menuItems.push({ path: '/supervisor/circuit-plants-map', label: 'Circuit Plants Map', icon: '🗺️' });
        menuItems.push({ path: '/supervisor/circuit-plants-import', label: 'Import Plants', icon: '📥' });
      }
      
      // District Plants Map - only for DDM/DM
      if (isDDM || isDM) {
        menuItems.push({ path: '/supervisor/district-plants-map', label: 'District Plants Map', icon: '🗺️' });
      }
      
      // Team Management - only for FLS
      if (isFLS) {
        menuItems.push({ path: '/supervisor/team', label: 'Team Management', icon: '👥' });
      }
      
      // Standard items for all supervisors
      menuItems.push({ path: '/trips', label: 'My Trips', icon: '🚗' });
      menuItems.push({ path: '/calendar', label: 'Calendar', icon: '📅' });
      menuItems.push({ path: '/templates', label: 'Trip Templates', icon: '📋' });
      menuItems.push({ path: '/admin/bulk-import', label: 'Bulk Trip Import', icon: '📥' });
      menuItems.push({ path: '/vouchers', label: 'My Vouchers', icon: '📄' });
      menuItems.push({ path: '/voucher-history', label: 'Voucher History', icon: '📚' });
      menuItems.push({ path: '/profile/setup', label: 'Profile', icon: '👤' });
      
      return menuItems;
    }
    
    if (role === 'fleet_manager') {
      return [
        { path: '/fleet/overview', label: 'Dashboard', icon: '📊' },
        { path: '/messages', label: 'Messages', icon: '💬' },
        { path: '/fleet/dashboard', label: 'Fleet Approvals', icon: '✅' },
        { path: '/voucher-history', label: 'All Vouchers', icon: '📚' },
        { path: '/analytics', label: 'Analytics', icon: '📈' },
        { path: '/reports', label: 'Reports', icon: '📋' },
        { path: '/profile/setup', label: 'Profile', icon: '👤' },
      ];
    }
    
    // Default menu for inspectors
    return [
      { path: '/inspector/dashboard', label: 'My Dashboard', icon: '🏠' },
      { path: '/messages', label: 'Messages', icon: '💬' },
      { path: '/dashboard', label: 'Overview', icon: '📊' },
      { path: '/trips', label: 'My Trips', icon: '🚗' },
      { path: '/calendar', label: 'Calendar', icon: '📅' },
      { path: '/templates', label: 'Trip Templates', icon: '📋' },
      { path: '/admin/bulk-import', label: 'Bulk Trip Import', icon: '📥' },
      { path: '/vouchers', label: 'Vouchers', icon: '📄' },
      { path: '/voucher-history', label: 'Voucher History', icon: '📚' },
      { path: '/profile/setup', label: 'Profile', icon: '👤' },
    ];
  };

  const navItems = useMemo(() => {
    // Don't build menu until we have complete user data
    if (!user || !user.role) {
      return [];
    }
    
    // For supervisors, wait for position data to load
    if (user.role === 'supervisor' && !userProfile?.position) {
      return [];
    }
    
    const items = getNavItems();
    
    console.log('📋 Generated menu items:', items.length);
    console.log('📋 My Dashboard count:', items.filter(i => i.label === 'My Dashboard').length);
    
    // Remove duplicate "My Dashboard" items (safety net)
    const seenPaths = new Set();
    const uniqueItems = items.filter(item => {
      if (item.label === 'My Dashboard') {
        if (seenPaths.has('My Dashboard')) {
          console.log('🗑️ Removing duplicate My Dashboard');
          return false; // Skip this duplicate
        }
        seenPaths.add('My Dashboard');
      }
      return true;
    });
    
    console.log('✅ Final unique items:', uniqueItems.length);
    console.log('✅ Final My Dashboard count:', uniqueItems.filter(i => i.label === 'My Dashboard').length);
    
    return uniqueItems;
  }, [user?.role, userProfile?.position]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* USDA Official Banner */}
      <div className="bg-[#3E2723]">
        <div className="bg-[#E8DCC8] px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* USDA Logo and Text */}
            <div className="flex items-center gap-4">
              {/* Official USDA Logo */}
              <img 
                src="/usda-logo.svg" 
                alt="USDA Logo" 
                className="h-16 w-auto"
              />
              {/* Department Text */}
              <div className="text-gray-800 border-l-2 border-gray-400 pl-4">
                <div className="text-xs font-normal text-gray-700">United States Department of Agriculture</div>
                <div className="text-lg font-bold text-gray-900 mt-0.5">Food Safety and Inspection Service</div>
              </div>
            </div>
            {/* Right Side Info */}
            <div className="hidden lg:block">
              <div className="text-right">
                <div className="text-xs text-gray-700 font-semibold">Travel Mileage</div>
                <div className="text-xs text-gray-700 font-semibold">Reimbursement System</div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-[#2C5234]"></div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="bg-[#4A6FA5] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            {/* Logo and Title */}
            <div className="flex items-center">
              <h1 className="text-sm sm:text-base font-semibold">
                Travel Mileage System
              </h1>
            </div>

            {/* Desktop: User info and logout */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-white" />
                )}
              </button>
              
              <div className="text-sm">
                <span className="text-white font-medium">{getGreeting()}</span>
                {user?.role && (
                  <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs uppercase">
                    {user.role.replace('_', ' ')}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded transition-colors text-sm"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-white/10 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#3B5A7F] border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* User info */}
              <div className="px-3 py-2 text-sm border-b border-white/10 mb-2">
                <div className="text-white font-medium">{getGreeting()}</div>
                {user?.role && (
                  <span className="inline-block mt-1 px-2 py-1 bg-white/20 rounded text-xs uppercase">
                    {user.role.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Nav items */}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </span>
                    {item.label === 'Messages' && unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              ))}

              {/* Logout button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-white/10 hover:text-white"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg dark:shadow-gray-900/50 min-h-screen border-r border-gray-300 dark:border-gray-700">
          <nav className="mt-4 px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 transition-all duration-200 ${
                  isActive(item.path) 
                    ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md transform scale-105 font-semibold' 
                    : 'hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-sm hover:translate-x-1'
                }`}
              >
                <span className={`text-xl mr-3 ${isActive(item.path) ? 'transform scale-110' : ''}`}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#FAFAFA] dark:bg-gray-900">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;



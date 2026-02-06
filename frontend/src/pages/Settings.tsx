import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [keyMasked, setKeyMasked] = useState(true);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'active' | 'mock'>('unknown');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setApiStatus(response.data.googleMapsApiStatus);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load settings');
      setLoading(false);
    }
  };

  const handleSaveGoogleMapsKey = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.post('/settings/google-maps-key', {
        apiKey: googleMapsKey
      });

      setSuccess('Google Maps API key saved successfully! Please restart the backend server for changes to take effect.');
      setGoogleMapsKey('');
      setKeyMasked(true);
      
      setTimeout(() => {
        fetchSettings();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGoogleMapsApi = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const response = await api.post('/settings/test-google-maps', {
        origin: 'Washington DC',
        destination: 'Baltimore MD'
      });

      if (response.data.success) {
        setSuccess(`✅ Google Maps API is working! Test route: Washington DC → Baltimore MD = ${response.data.miles} miles`);
        setApiStatus('active');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'API test failed');
      setApiStatus('mock');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'fleet_manager')) {
    return (
      <div className="dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">Access Denied. Only administrators can access settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Configure application settings and integrations</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

      {/* Google Maps API Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <span className="text-2xl mr-2">🗺️</span>
              Google Maps API Integration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enable accurate mileage calculation using real driving distances
            </p>
          </div>
          <div className="text-right">
            {apiStatus === 'active' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                ✓ Active
              </span>
            )}
            {apiStatus === 'mock' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                ⚠ Using Mock Data
              </span>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Status</h3>
          {apiStatus === 'mock' && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="mb-2">🎲 <strong>Mock Mode:</strong> Using random mileage (10-60 miles)</p>
              <p className="text-gray-600 dark:text-gray-400">Configure a Google Maps API key below to enable accurate mileage calculation.</p>
            </div>
          )}
          {apiStatus === 'active' && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="mb-2">✅ <strong>API Active:</strong> Using real driving distances from Google Maps</p>
              <p className="text-gray-600 dark:text-gray-400">All new trips will calculate accurate mileage automatically.</p>
            </div>
          )}
        </div>

        {/* API Key Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Google Maps API Key
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={keyMasked ? 'password' : 'text'}
                value={googleMapsKey}
                onChange={(e) => setGoogleMapsKey(e.target.value)}
                placeholder="AIzaSyB1234567890abcdefghijklmnopqrstuv"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setKeyMasked(!keyMasked)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                title={keyMasked ? 'Show API key' : 'Hide API key'}
              >
                {keyMasked ? '👁️' : '🙈'}
              </button>
            </div>
            <button
              onClick={handleSaveGoogleMapsKey}
              disabled={saving || !googleMapsKey}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Leave empty to continue using mock mileage calculation
          </p>
        </div>

        {/* Test Button */}
        <div className="mb-4">
          <button
            onClick={handleTestGoogleMapsApi}
            disabled={loading}
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition"
          >
            {loading ? 'Testing...' : '🧪 Test API Connection'}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Tests the API by calculating distance from Washington DC to Baltimore MD
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📖 How to Get an API Key</h3>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-400">Google Cloud Console</a></li>
            <li>Create a new project or select existing one</li>
            <li>Enable "Distance Matrix API"</li>
            <li>Create credentials → API Key</li>
            <li>Copy the API key and paste it above</li>
          </ol>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-3">
            💰 <strong>Cost:</strong> First $200/month is FREE (covers ~40,000 requests). Typical usage: ~$0.50/month
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            📄 For detailed instructions, see <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">GOOGLE_MAPS_SETUP.md</code>
          </p>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">ℹ️</span>
          System Information
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Backend Port</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-white">5000</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Database Type</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-white">SQLite</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Your Role</p>
            <p className="font-semibold capitalize text-gray-900 dark:text-white">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">User Email</p>
            <p className="font-mono text-gray-900 dark:text-white">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
          <li>After saving the API key, you must <strong>restart the backend server</strong> for changes to take effect</li>
          <li>Keep your API key secure - never share it publicly or commit it to version control</li>
          <li>Set up API key restrictions in Google Cloud Console to prevent unauthorized use</li>
          <li>Without an API key, the system works fine with random mock mileage for testing</li>
        </ul>
      </div>
      </div>
    </div>
  );
};

export default Settings;



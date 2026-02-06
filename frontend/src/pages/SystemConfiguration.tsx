import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface SystemConfig {
  id: number;
  config_key: string;
  config_value: string;
  config_type: string;
  description: string | null;
  category: string | null;
  updated_by: number | null;
  updated_at: string;
}

interface GroupedConfigs {
  [category: string]: SystemConfig[];
}

const SystemConfiguration: React.FC = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [grouped, setGrouped] = useState<GroupedConfigs>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedValues, setEditedValues] = useState<{ [key: string]: string }>({});
  const [activeCategory, setActiveCategory] = useState('general');

  // Access control
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Access Denied: Only administrators can manage system configuration.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/system-config');
      setConfigs(response.data.configs);
      setGrouped(response.data.grouped);
      
      // Initialize edited values
      const initialValues: { [key: string]: string } = {};
      response.data.configs.forEach((config: SystemConfig) => {
        initialValues[config.config_key] = config.config_value;
      });
      setEditedValues(initialValues);
      
      // Set first category as active
      const categories = Object.keys(response.data.grouped);
      if (categories.length > 0) {
        setActiveCategory(categories[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues({ ...editedValues, [key]: value });
  };

  const handleSave = async (key: string) => {
    try {
      setError('');
      setSuccess('');
      await api.put(`/system-config/${key}`, { value: editedValues[key] });
      setSuccess(`${key} updated successfully`);
      fetchConfigs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update configuration');
    }
  };

  const handleBulkSave = async () => {
    try {
      setError('');
      setSuccess('');
      
      const updates = configs
        .filter(config => editedValues[config.config_key] !== config.config_value)
        .map(config => ({
          key: config.config_key,
          value: editedValues[config.config_key]
        }));

      if (updates.length === 0) {
        setError('No changes to save');
        return;
      }

      await api.post('/system-config/bulk-update', { configs: updates });
      setSuccess(`${updates.length} configuration(s) updated successfully`);
      fetchConfigs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save configurations');
    }
  };

  const handleReset = async (key: string) => {
    if (!confirm(`Reset ${key} to default value?`)) return;

    try {
      setError('');
      setSuccess('');
      await api.post(`/system-config/${key}/reset`);
      setSuccess(`${key} reset to default`);
      fetchConfigs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset configuration');
    }
  };

  const renderInput = (config: SystemConfig) => {
    const value = editedValues[config.config_key] || '';

    switch (config.config_type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleValueChange(config.config_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(config.config_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(config.config_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-300">Loading configurations...</div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(grouped);

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">System Configuration</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage system-wide settings and preferences</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Bulk Save Button */}
      <div className="mb-6">
        <button
          onClick={handleBulkSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save All Changes
        </button>
      </div>

      {/* Category Tabs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeCategory === category
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Items */}
        <div className="p-6">
          <div className="space-y-6">
            {grouped[activeCategory]?.map((config) => (
              <div key={config.config_key} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {config.config_key.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <p className="text-xs text-gray-500">{config.description}</p>
                    <div className="mt-1 text-xs text-gray-400">
                      Type: {config.config_type}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        {renderInput(config)}
                      </div>
                      <button
                        onClick={() => handleSave(config.config_key)}
                        disabled={editedValues[config.config_key] === config.config_value}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => handleReset(config.config_key)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        title="Reset to default"
                      >
                        Reset
                      </button>
                    </div>
                    {editedValues[config.config_key] !== config.config_value && (
                      <div className="mt-1 text-xs text-orange-600">
                        • Unsaved changes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Configuration Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
          <li><strong>Fiscal Year:</strong> Set the starting month for fiscal year calculations (1-12)</li>
          <li><strong>Mileage Rate:</strong> Default rate used for calculations (can be overridden by rate management)</li>
          <li><strong>File Uploads:</strong> Maximum size and allowed file types for attachments</li>
          <li><strong>Auto-Approve:</strong> Set to 0 to disable automatic voucher approval</li>
          <li><strong>Email Notifications:</strong> Toggle system-wide email notifications on/off</li>
        </ul>
      </div>
    </div>
  );
};

export default SystemConfiguration;



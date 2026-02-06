import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface EmailSettings {
  configured: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  from: string;
  hasPassword: boolean;
}

const EmailSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EmailSettings>({
    configured: false,
    host: '',
    port: '587',
    secure: false,
    user: '',
    from: '',
    hasPassword: false
  });
  const [formData, setFormData] = useState({
    host: '',
    port: '587',
    secure: false,
    user: '',
    password: '',
    from: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Only admins can access email settings
  if (user?.role !== 'admin') {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          Access Denied: Only administrators can manage email settings.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/email-settings');
      setSettings(response.data);
      setFormData({
        host: response.data.host,
        port: response.data.port,
        secure: response.data.secure,
        user: response.data.user,
        password: '',
        from: response.data.from
      });
      setTestEmail(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.host || !formData.port || !formData.user) {
      setError('Host, port, and user are required');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/admin/email-settings', formData);
      setSuccess(response.data.message || 'Email settings saved successfully');
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter an email address to test');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setTesting(true);
      const response = await api.post('/admin/email-settings/test', { email: testEmail });
      setSuccess(response.data.message || `Test email sent to ${testEmail}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-6">
        <div className="flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-300">Loading email settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Email Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure SMTP settings for email notifications</p>
        </div>

        {/* Status Banner */}
        {settings.configured ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
            Email service is configured and active
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded mb-6">
            Email service is not configured. Configure SMTP settings below to enable email notifications.
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

      {/* Configuration Form */}
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">SMTP Configuration</h2>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Host *
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">SMTP server hostname</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Port *
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="587"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usually 587 for TLS or 465 for SSL</p>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.secure}
                onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use SSL/TLS (port 465)</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">Enable for port 465, disable for port 587</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SMTP Username *
            </label>
            <input
              type="text"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              placeholder="your-email@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your email address or SMTP username</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SMTP Password {!settings.hasPassword && '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={settings.hasPassword ? '(password is set, leave blank to keep)' : 'Enter your password'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required={!settings.hasPassword}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {settings.hasPassword 
                ? 'Leave blank to keep current password' 
                : 'Your email password or app-specific password'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Email Address
            </label>
            <input
              type="email"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              placeholder="noreply@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: defaults to SMTP username</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={fetchSettings}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Test Email Section */}
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Test Email</h2>
        
        {!settings.configured ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded">
            Configure and save SMTP settings above before sending test emails.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Send test email to:
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testing || !testEmail}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {testing ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will send a test email to verify your configuration is working.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Email Notification Info */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Email Notifications</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
          When properly configured, the system automatically sends email notifications for:
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc list-inside">
          <li><strong>Voucher Submitted:</strong> Notifies assigned supervisor</li>
          <li><strong>Supervisor Approved:</strong> Notifies fleet managers</li>
          <li><strong>Fully Approved:</strong> Notifies inspector and supervisor</li>
          <li><strong>Rejected:</strong> Notifies inspector with rejection reason</li>
        </ul>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-4">
          For Gmail: Use an app-specific password instead of your regular password. 
          <a 
            href="https://support.google.com/accounts/answer/185833" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline ml-1 hover:text-blue-600 dark:hover:text-blue-300"
          >
            Learn more
          </a>
        </p>
      </div>
      </div>
    </div>
  );
};

export default EmailSettings;



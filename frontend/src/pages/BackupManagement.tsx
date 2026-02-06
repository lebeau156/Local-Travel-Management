import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Backup {
  fileName: string;
  filePath: string;
  size: string;
  created: string;
  modified: string;
}

interface BackupStats {
  totalBackups: number;
  totalSizeKB: string;
  totalSizeMB: string;
  oldestBackup: string | null;
  newestBackup: string | null;
  backupDirectory: string;
}

const BackupManagement: React.FC = () => {
  const { user } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Only admins and fleet managers can access backup
  if (user?.role !== 'admin' && user?.role !== 'fleet_manager') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          ❌ Access Denied: Only administrators can manage backups.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/backup/list');
      setBackups(response.data.backups);
      setStats(response.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm('Create a new database backup?')) return;
    
    try {
      setCreating(true);
      setError('');
      setSuccess('');
      const response = await api.post('/backup/create');
      setSuccess(`Backup created successfully: ${response.data.backup.fileName}`);
      fetchBackups(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const response = await api.get(`/backup/download/${fileName}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to download backup');
    }
  };

  const handleRestore = async (fileName: string) => {
    if (!confirm(`⚠️ WARNING: This will restore the database from "${fileName}" and overwrite all current data.\n\nA safety backup will be created before restoring.\n\nAre you absolutely sure you want to continue?`)) {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      await api.post('/backup/restore', { fileName });
      setSuccess('Database restored successfully! Server will restart...');
      
      // Page will reload when server restarts
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to restore backup');
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Delete backup "${fileName}"?\n\nThis cannot be undone.`)) return;
    
    try {
      setError('');
      setSuccess('');
      await api.delete(`/backup/${fileName}`);
      setSuccess(`Backup deleted: ${fileName}`);
      fetchBackups(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete backup');
    }
  };

  const handleCleanup = async () => {
    const keepCount = prompt('How many recent backups to keep?', '10');
    if (!keepCount) return;
    
    try {
      setError('');
      setSuccess('');
      const response = await api.post('/backup/cleanup', { keepCount: parseInt(keepCount) });
      setSuccess(response.data.message);
      fetchBackups(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cleanup backups');
    }
  };

  const handleExportJSON = async () => {
    if (!confirm('Export entire database as JSON? This may take a while for large databases.')) return;
    
    try {
      setError('');
      setSuccess('');
      const response = await api.post('/backup/export-json');
      setSuccess(`JSON export created: ${response.data.export.fileName}`);
      
      // Download immediately
      const fileName = response.data.export.fileName;
      const downloadResponse = await api.get(`/backup/download-json/${fileName}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([downloadResponse.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to export JSON');
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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold">
          🗄️ Database Backup Management
        </h1>
        <p className="mt-2 opacity-90">
          Create, restore, and manage database backups
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          ✅ {success}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Backups</h3>
              <span className="text-2xl">💾</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalBackups}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Size</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalSizeMB} MB</p>
            <p className="text-xs text-gray-500 mt-1">{stats.totalSizeKB} KB</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Newest Backup</h3>
              <span className="text-2xl">🆕</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {stats.newestBackup ? new Date(stats.newestBackup).toLocaleString() : 'None'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Oldest Backup</h3>
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {stats.oldestBackup ? new Date(stats.oldestBackup).toLocaleString() : 'None'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Create Backup</span>
              </>
            )}
          </button>

          <button
            onClick={() => fetchBackups()}
            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>Refresh List</span>
          </button>

          <button
            onClick={handleCleanup}
            className="bg-orange-100 text-orange-700 px-4 py-3 rounded-lg font-medium hover:bg-orange-200 flex items-center justify-center gap-2"
          >
            <span>🧹</span>
            <span>Cleanup Old</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="bg-green-100 text-green-700 px-4 py-3 rounded-lg font-medium hover:bg-green-200 flex items-center justify-center gap-2"
          >
            <span>📄</span>
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Available Backups</h2>
          <p className="text-sm text-gray-500 mt-1">
            {backups.length} backup{backups.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {backups.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <span className="text-6xl block mb-4">📦</span>
            <p className="text-lg font-medium">No backups found</p>
            <p className="text-sm mt-2">Click "Create Backup" to create your first backup</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {backups.map((backup) => (
              <div key={backup.fileName} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 break-all">
                      {backup.fileName}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p className="font-medium text-gray-900">
                          {new Date(backup.created).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Modified</p>
                        <p className="font-medium text-gray-900">
                          {new Date(backup.modified).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Size</p>
                        <p className="font-medium text-gray-900">{backup.size} KB</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      onClick={() => handleDownload(backup.fileName)}
                      className="flex-1 lg:flex-initial px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm whitespace-nowrap"
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => handleRestore(backup.fileName)}
                      className="flex-1 lg:flex-initial px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm whitespace-nowrap"
                    >
                      🔄 Restore
                    </button>
                    <button
                      onClick={() => handleDelete(backup.fileName)}
                      className="flex-1 lg:flex-initial px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm whitespace-nowrap"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">⚠️ Important Notes</h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• Backups are stored in: <code className="bg-yellow-100 px-1 py-0.5 rounded">{stats?.backupDirectory}</code></li>
          <li>• Creating a backup does NOT interrupt system operation</li>
          <li>• Restoring a backup will restart the server and reload all data</li>
          <li>• A safety backup is created automatically before every restore</li>
          <li>• Download backups regularly to an external location for disaster recovery</li>
          <li>• JSON exports are useful for data analysis but cannot be restored directly</li>
          <li>• Use "Cleanup Old" to keep only recent backups and save disk space</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupManagement;



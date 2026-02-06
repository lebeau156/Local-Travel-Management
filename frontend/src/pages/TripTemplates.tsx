import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete';

interface TripTemplate {
  id: number;
  user_id: number;
  template_name: string;
  from_address: string;
  to_address: string;
  site_name: string | null;
  purpose: string | null;
  notes: string | null;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function TripTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TripTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    template_name: '',
    from_address: '',
    to_address: '',
    site_name: '',
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/templates');
      setTemplates(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({
      template_name: '',
      from_address: '',
      to_address: '',
      site_name: '',
      purpose: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (template: TripTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      from_address: template.from_address,
      to_address: template.to_address,
      site_name: template.site_name || '',
      purpose: template.purpose || '',
      notes: template.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, formData);
        setSuccess('Template updated successfully');
      } else {
        await api.post('/templates', formData);
        setSuccess('Template created successfully');
      }
      setShowModal(false);
      fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.delete(`/templates/${id}`);
      setSuccess('Template deleted successfully');
      fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await api.post(`/templates/${id}/favorite`);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle favorite');
    }
  };

  const handleUseTemplate = async (template: TripTemplate) => {
    try {
      await api.post(`/templates/${template.id}/usage`);
      navigate('/trips/add', { state: { template } });
    } catch (err: any) {
      console.error('Failed to increment usage:', err);
      navigate('/trips/add', { state: { template } });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trip Templates</h1>
        <button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          ➕ Create Template
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No Templates Yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create templates for routes you travel frequently to save time on trip entry.
          </p>
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    {template.template_name}
                  </h3>
                  <button
                    onClick={() => handleToggleFavorite(template.id)}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    {template.is_favorite ? '⭐' : '☆'}
                  </button>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">From:</span>
                    <div className="text-gray-600 dark:text-gray-300 ml-2">{template.from_address}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">To:</span>
                    <div className="text-gray-600 dark:text-gray-300 ml-2">{template.to_address}</div>
                  </div>
                  {template.site_name && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Route:</span>
                      <span className="text-gray-600 dark:text-gray-300 ml-2">{template.site_name}</span>
                    </div>
                  )}
                  {template.purpose && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Purpose:</span>
                      <div className="text-gray-600 dark:text-gray-300 ml-2">{template.purpose}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Used {template.usage_count} times</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6" key={editingTemplate?.id || 'new'}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Morning Inspection Route"
                  />
                </div>

                <GooglePlacesAutocomplete
                  key="from-address"
                  label="From Address"
                  value={formData.from_address}
                  onChange={(value) => setFormData(prev => ({ ...prev, from_address: value }))}
                  placeholder="Starting location"
                  required
                />

                <GooglePlacesAutocomplete
                  key="to-address"
                  label="To Address"
                  value={formData.to_address}
                  onChange={(value) => setFormData(prev => ({ ...prev, to_address: value }))}
                  placeholder="Destination"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Travel Route
                  </label>
                  <input
                    type="text"
                    value={formData.site_name}
                    onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional travel route name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purpose
                  </label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Inspection">Inspection</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Training">Training</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional notes about this route"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.template_name || !formData.from_address || !formData.to_address}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface MileageRate {
  id: number;
  rate: number;
  effective_from: string;
  effective_to: string | null;
  created_by: number;
  created_by_email?: string;
  created_at: string;
  notes: string | null;
}

const MileageRatesManagement: React.FC = () => {
  const { user } = useAuth();
  const [rates, setRates] = useState<MileageRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState<MileageRate | null>(null);
  const [formData, setFormData] = useState({
    rate: '',
    effective_from: '',
    effective_to: '',
    notes: ''
  });

  // Access control
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Access Denied: Only administrators can manage mileage rates.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/mileage-rates');
      setRates(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load mileage rates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRate(null);
    setFormData({ rate: '', effective_from: '', effective_to: '', notes: '' });
    setShowModal(true);
  };

  const handleEdit = (rate: MileageRate) => {
    setEditingRate(rate);
    setFormData({
      rate: rate.rate.toString(),
      effective_from: rate.effective_from,
      effective_to: rate.effective_to || '',
      notes: rate.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingRate) {
        await api.put(`/mileage-rates/${editingRate.id}`, {
          rate: parseFloat(formData.rate),
          effective_from: formData.effective_from,
          effective_to: formData.effective_to || null,
          notes: formData.notes
        });
        setSuccess('Mileage rate updated successfully');
      } else {
        await api.post('/mileage-rates', {
          rate: parseFloat(formData.rate),
          effectiveFrom: formData.effective_from,
          effectiveTo: formData.effective_to || null,
          notes: formData.notes
        });
        setSuccess('Mileage rate created successfully');
      }
      setShowModal(false);
      fetchRates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save mileage rate');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mileage rate?')) return;

    try {
      setError('');
      setSuccess('');
      await api.delete(`/mileage-rates/${id}`);
      setSuccess('Mileage rate deleted successfully');
      fetchRates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete mileage rate');
    }
  };

  const isCurrentRate = (rate: MileageRate) => {
    const today = new Date().toISOString().split('T')[0];
    return rate.effective_from <= today && (!rate.effective_to || rate.effective_to >= today);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-300">Loading mileage rates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Mileage Rate Management</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage historical and current mileage reimbursement rates</p>
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

      {/* Create Button */}
      <div className="mb-6">
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Add New Rate
        </button>
      </div>

      {/* Rates List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective From</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective To</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rates.map((rate) => (
                <tr key={rate.id} className={isCurrentRate(rate) ? 'bg-green-50' : ''}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${rate.rate.toFixed(2)}/mile
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(rate.effective_from).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.effective_to ? new Date(rate.effective_to).toLocaleDateString() : 'Ongoing'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                    {rate.notes || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {isCurrentRate(rate) ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Current
                      </span>
                    ) : new Date(rate.effective_from) > new Date() ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Future
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:text-white">
                        Historical
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(rate)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rate.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingRate ? 'Edit Mileage Rate' : 'Add New Mileage Rate'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate ($/mile) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank for ongoing rate</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingRate ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MileageRatesManagement;



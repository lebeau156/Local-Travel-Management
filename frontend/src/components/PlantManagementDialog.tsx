import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import api from '../api/axios';

interface CircuitPlant {
  id?: number;
  est_number: string;
  est_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  circuit: string;
  shift: number | null;
  tour_of_duty: string;
  assigned_inspector_id: number | null;
  notes: string;
}

interface PlantManagementDialogProps {
  plant: CircuitPlant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const PlantManagementDialog: React.FC<PlantManagementDialogProps> = ({
  plant,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<CircuitPlant>({
    est_number: '',
    est_name: '',
    address: '',
    city: '',
    state: 'NJ',
    zip_code: '',
    circuit: '',
    shift: null,
    tour_of_duty: '',
    assigned_inspector_id: null,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plant) {
      setFormData(plant);
    } else {
      // Reset form for new plant
      setFormData({
        est_number: '',
        est_name: '',
        address: '',
        city: '',
        state: 'NJ',
        zip_code: '',
        circuit: '',
        shift: null,
        tour_of_duty: '',
        assigned_inspector_id: null,
        notes: ''
      });
    }
    setError('');
  }, [plant, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'shift' ? (value ? parseInt(value) : null) : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validation
      if (!formData.est_number || !formData.est_name || !formData.address || !formData.city) {
        setError('Please fill in all required fields');
        return;
      }

      if (plant?.id) {
        // Update existing plant
        await api.put(`/circuit-plants/${plant.id}`, formData);
      } else {
        // Create new plant
        await api.post('/circuit-plants', formData);
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save plant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!plant?.id) return;
    
    if (!confirm(`Are you sure you want to delete ${plant.est_name}?`)) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/circuit-plants/${plant.id}`);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete plant');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {plant ? 'Edit Plant' : 'Add New Plant'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Est Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Est Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="est_number"
                value={formData.est_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., M/P33789"
              />
            </div>

            {/* Circuit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Circuit
              </label>
              <input
                type="text"
                name="circuit"
                value={formData.circuit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 8020-Elizabeth NJ"
              />
            </div>
          </div>

          {/* Plant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="est_name"
              value={formData.est_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., United Premium Foods"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1 Amboy Ave"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Woodbridge"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NJ"
              />
            </div>

            {/* Zip Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="07095"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Shift */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shift
              </label>
              <select
                name="shift"
                value={formData.shift || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select shift</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

            {/* Tour of Duty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tour of Duty
              </label>
              <input
                type="text"
                name="tour_of_duty"
                value={formData.tour_of_duty}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0700-1530"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {plant?.id && (
              <button
                onClick={handleDelete}
                disabled={deleting || saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : plant ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantManagementDialog;

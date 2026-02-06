import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api/axios';
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete';
import FileAttachments from '../components/FileAttachments';
import Comments from '../components/Comments';
import TripMapModal from '../components/TripMapModal';

const AddTrip: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    from_address: '',
    to_address: '',
    site_name: '',
    purpose: 'Inspection',
    lodging_cost: 0,
    meals_cost: 0,
    per_diem_days: 0,
    other_expenses: 0,
    expense_notes: '',
    avoid_tolls: false,
  });
  const [calculatedMiles, setCalculatedMiles] = useState<number | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchTrip();
    } else if (location.state?.template) {
      const template = location.state.template;
      setFormData(prev => ({
        ...prev,
        from_address: template.from_address,
        to_address: template.to_address,
        site_name: template.site_name || '',
        purpose: template.purpose || 'Inspection',
        expense_notes: template.notes || ''
      }));
      setSuccess('Template loaded! Fill in date and expenses.');
      setTimeout(() => setSuccess(''), 5000);
    } else if (location.state?.prefilledDate) {
      setFormData(prev => ({
        ...prev,
        date: location.state.prefilledDate
      }));
    }
  }, [id, isEditMode, location.state]);

  const fetchTrip = async () => {
    try {
      setFetchLoading(true);
      const response = await api.get(`/trips/${id}`);
      const trip = response.data;
      
      setFormData({
        date: new Date(trip.date).toISOString().slice(0, 10),
        from_address: trip.from_address,
        to_address: trip.to_address,
        site_name: trip.site_name || '',
        purpose: trip.purpose || 'Inspection',
        lodging_cost: trip.lodging_cost || 0,
        meals_cost: trip.meals_cost || 0,
        per_diem_days: trip.per_diem_days || 0,
        other_expenses: trip.other_expenses || 0,
        expense_notes: trip.expense_notes || '',
        avoid_tolls: Boolean(trip.avoid_tolls),
      });
      setCalculatedMiles(trip.miles_calculated);
      
      // Auto-calculate mileage if it's still the default 50 miles (from CSV import)
      if (trip.miles_calculated === 50 && trip.from_address && trip.to_address) {
        console.log('Auto-calculating mileage for imported trip...');
        setTimeout(() => autoCalculateMileage(trip.from_address, trip.to_address), 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load trip');
    } finally {
      setFetchLoading(false);
    }
  };

  const autoCalculateMileage = async (from: string, to: string) => {
    try {
      const response = await api.post('/trips/calculate-mileage', {
        from: from,
        to: to,
      });
      setCalculatedMiles(response.data.miles);
      setSuccess(`Mileage auto-calculated: ${response.data.miles.toFixed(1)} miles`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Auto-calculation failed:', err);
      // Don't show error to user - they can manually calculate if needed
    }
  };

  const handleCalculate = async () => {
    if (!formData.from_address || !formData.to_address) {
      setError('Please enter both From and To addresses');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/trips/calculate-mileage', {
        from: formData.from_address,
        to: formData.to_address,
        avoidTolls: formData.avoid_tolls,
      });
      setCalculatedMiles(response.data.miles);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate mileage');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (calculatedMiles === null) {
      setError('Please calculate mileage first');
      return;
    }

    try {
      setLoading(true);
      const tripData = {
        ...formData,
        miles_calculated: calculatedMiles
      };
      
      console.log('🚀 Submitting trip data:', tripData);
      console.log('💰 Expense values:', {
        lodging: tripData.lodging_cost,
        meals: tripData.meals_cost,
        per_diem: tripData.per_diem_days,
        other: tripData.other_expenses,
        notes: tripData.expense_notes
      });
      
      if (isEditMode) {
        await api.put(`/trips/${id}`, tripData);
      } else {
        await api.post('/trips', tripData);
      }
      
      navigate('/trips');
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'save'} trip`);
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        {isEditMode ? 'Edit Trip' : 'Add New Trip'}
      </h1>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {calculatedMiles !== null && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
          <strong>Calculated Mileage:</strong> {calculatedMiles.toFixed(1)} miles
          <br />
          <strong>Est. Reimbursement:</strong> ${(calculatedMiles * 0.67).toFixed(2)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
            required
          />
        </div>

        {/* From Address - with Google Places Autocomplete */}
        <GooglePlacesAutocomplete
          id="trip-from-address"
          label="From Address"
          value={formData.from_address}
          onChange={(value) => setFormData(prev => ({ ...prev, from_address: value }))}
          placeholder="e.g., 1600 Pennsylvania Avenue NW, Washington, DC"
          required
        />

        {/* To Address - with Google Places Autocomplete */}
        <GooglePlacesAutocomplete
          id="trip-to-address"
          label="To Address"
          value={formData.to_address}
          onChange={(value) => setFormData(prev => ({ ...prev, to_address: value }))}
          placeholder="e.g., ABC Processing Plant, Richmond, VA"
          required
        />

        {/* Toll Preference */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
          <input
            type="checkbox"
            id="avoid-tolls"
            checked={formData.avoid_tolls}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, avoid_tolls: e.target.checked }));
              // Clear calculated mileage when toll preference changes
              setCalculatedMiles(null);
            }}
            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="avoid-tolls" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
            <span className="font-semibold">Avoid toll roads (EZ-Pass)</span>
            <span className="block text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Select this if you didn't use toll roads. Route and mileage will be recalculated.
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Travel Route</label>
          <input
            type="text"
            value={formData.site_name}
            onChange={(e) => setFormData(prev => ({ ...prev, site_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
            placeholder="e.g., Route 66 - Springfield to Chicago"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Purpose</label>
          <select
            value={formData.purpose}
            onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
          >
            <option value="Inspection">Inspection</option>
            <option value="Meeting">Meeting</option>
            <option value="Training">Training</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Expense Section */}
        <div className="border-t dark:border-gray-700 pt-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Expenses (Optional)</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Lodging Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.lodging_cost}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData(prev => ({ ...prev, lodging_cost: isNaN(val) ? 0 : val }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Meals Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.meals_cost}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData(prev => ({ ...prev, meals_cost: isNaN(val) ? 0 : val }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Per Diem Days</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.per_diem_days}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData(prev => ({ ...prev, per_diem_days: isNaN(val) ? 0 : val }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">For overnight travel</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Other Expenses ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.other_expenses}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData(prev => ({ ...prev, other_expenses: isNaN(val) ? 0 : val }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Expense Notes</label>
            <textarea
              value={formData.expense_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, expense_notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
              rows={3}
              placeholder="Describe lodging, meals, or other expenses..."
            />
          </div>

          {(formData.lodging_cost > 0 || formData.meals_cost > 0 || formData.other_expenses > 0) && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
              <strong className="text-blue-900 dark:text-blue-200">Total Expenses: </strong>
              <span className="text-blue-700 dark:text-blue-300">
                ${(formData.lodging_cost + formData.meals_cost + formData.other_expenses).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* File Attachments Section */}
        {isEditMode && id && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/50 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receipts & Attachments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Upload receipts, parking tickets, toll receipts, or other supporting documents.
            </p>
            <FileAttachments 
              entityType="trip" 
              entityId={parseInt(id)} 
              canUpload={true}
              canDelete={true}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {isEditMode && formData.from_address && formData.to_address && (
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="flex-1 bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 dark:hover:bg-green-600"
            >
              🗺️ View Map
            </button>
          )}
          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading || !formData.from_address || !formData.to_address}
            className="flex-1 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 py-2 px-4 rounded-md font-medium hover:bg-blue-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Mileage'}
          </button>
          <button
            type="submit"
            disabled={loading || calculatedMiles === null}
            className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Trip' : 'Save Trip'}
          </button>
        </div>

        {!isEditMode && formData.from_address && formData.to_address && (
          <button
            type="button"
            onClick={() => setShowSaveTemplate(true)}
            className="w-full mt-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 py-2 px-4 rounded-md font-medium hover:bg-green-100 dark:hover:bg-green-900/50"
          >
            💾 Save as Template
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/trips')}
          className="w-full text-gray-600 hover:text-gray-800 text-sm mt-2"
        >
          Cancel
        </button>
      </form>

      {showSaveTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Save as Template</h2>
            <p className="text-sm text-gray-600 mb-4">
              Give this route a memorable name so you can reuse it later.
            </p>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Morning Inspection Route"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveTemplate(false);
                  setTemplateName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.post('/templates', {
                      template_name: templateName,
                      from_address: formData.from_address,
                      to_address: formData.to_address,
                      site_name: formData.site_name,
                      purpose: formData.purpose,
                      notes: formData.expense_notes
                    });
                    setSuccess('Template saved successfully!');
                    setShowSaveTemplate(false);
                    setTemplateName('');
                    setTimeout(() => setSuccess(''), 3000);
                  } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to save template');
                  }
                }}
                disabled={!templateName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section (only in edit mode) */}
      {isEditMode && id && (
        <div className="mt-6">
          <Comments entityType="trip" entityId={parseInt(id)} />
        </div>
      )}

      {/* Trip Map Modal */}
      {showMapModal && isEditMode && (
        <TripMapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          fromAddress={formData.from_address}
          toAddress={formData.to_address}
          siteName={formData.site_name}
          miles={calculatedMiles || 0}
          date={formData.date}
          avoidTolls={formData.avoid_tolls}
        />
      )}
    </div>
  );
};

export default AddTrip;



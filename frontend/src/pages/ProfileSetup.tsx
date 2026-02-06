import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete';

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableSupervisors, setAvailableSupervisors] = useState<any[]>([]);
  const [availableFlsSupervisors, setAvailableFlsSupervisors] = useState<any[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [selectedFlsSupervisor, setSelectedFlsSupervisor] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_initial: '',
    ssn_last_four: '',
    phone: '',
    home_address: '',
    city_of_residence: '',
    duty_station: '',
    travel_auth_no: '',
    agency: 'USDA',
    office: '',
    position: '',
    position_other: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_license: '',
    mileage_rate: '0.67',
    per_diem_rate: '0.00',
    account_number: '',
    accounting_code: '',
    cost_center: '',
    fund_code: '',
    organization_code: ''
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      const userResponse = await api.get('/auth/me');
      
      if (response.data) {
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          middle_initial: response.data.middle_initial || '',
          ssn_last_four: response.data.ssn_last_four || '',
          phone: response.data.phone || '',
          home_address: response.data.home_address || '',
          city_of_residence: response.data.city_of_residence || '',
          duty_station: response.data.duty_station || '',
          travel_auth_no: response.data.travel_auth_no || '',
          agency: response.data.agency || 'USDA',
          office: response.data.office || '',
          position: response.data.position || '',
          position_other: '',
          vehicle_make: response.data.vehicle_make || '',
          vehicle_model: response.data.vehicle_model || '',
          vehicle_year: response.data.vehicle_year || '',
          vehicle_license: response.data.vehicle_license || '',
          mileage_rate: response.data.mileage_rate?.toString() || '0.67',
          per_diem_rate: response.data.per_diem_rate?.toString() || '0.00',
          account_number: response.data.account_number || '',
          accounting_code: response.data.accounting_code || '',
          cost_center: response.data.cost_center || '',
          fund_code: response.data.fund_code || '',
          organization_code: response.data.organization_code || ''
        });

        // Set selected supervisor if exists
        if (userResponse.data.assigned_supervisor_id) {
          setSelectedSupervisor(userResponse.data.assigned_supervisor_id.toString());
        }
        
        // Set selected FLS supervisor if exists
        if (userResponse.data.fls_supervisor_id) {
          setSelectedFlsSupervisor(userResponse.data.fls_supervisor_id.toString());
        }
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to fetch profile:', err);
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchAvailableSupervisors = async () => {
    try {
      console.log('Fetching available supervisors...');
      const response = await api.get('/supervisors/available');
      console.log('Supervisors received:', response.data);
      setAvailableSupervisors(response.data);
    } catch (err: any) {
      console.error('Failed to fetch supervisors:', err);
    }
  };

  const fetchAvailableFlsSupervisors = async () => {
    try {
      console.log('Fetching available FLS supervisors...');
      const response = await api.get('/supervisors/available-fls');
      console.log('FLS supervisors received:', response.data);
      setAvailableFlsSupervisors(response.data);
    } catch (err: any) {
      console.error('Failed to fetch FLS supervisors:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Always fetch FLS supervisors for all CSI users
    fetchAvailableFlsSupervisors();
  }, []);

  // Fetch available supervisors when position changes
  useEffect(() => {
    console.log('Position changed to:', formData.position);
    if (formData.position && formData.position !== 'Other') {
      console.log('Calling fetchAvailableSupervisors...');
      fetchAvailableSupervisors();
    } else {
      console.log('Clearing supervisors list');
      setAvailableSupervisors([]);
    }
  }, [formData.position]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const payload = {
        ...formData,
        // If "Other" is selected, use position_other value as the position
        position: formData.position === 'Other' ? formData.position_other : formData.position,
        mileage_rate: parseFloat(formData.mileage_rate),
        per_diem_rate: parseFloat(formData.per_diem_rate)
      };
      // Remove position_other from payload as it's not a database field
      delete (payload as any).position_other;
      
      await api.put('/profile', payload);

      // Save assigned supervisor if selected
      if (selectedSupervisor) {
        await api.put('/supervisors/assign-me', {
          supervisor_id: parseInt(selectedSupervisor)
        });
      }

      // Save FLS supervisor if selected
      if (selectedFlsSupervisor) {
        await api.put('/supervisors/assign-fls', {
          fls_supervisor_id: parseInt(selectedFlsSupervisor)
        });
      }

      setSuccess('Profile saved successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile');
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
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Profile Setup</h1>
        
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Middle Initial
                </label>
                <input
                  type="text"
                  name="middle_initial"
                  value={formData.middle_initial}
                  onChange={handleChange}
                  maxLength={1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="(555) 555-5555"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SSN (Last 4 Digits)
              </label>
              <input
                type="text"
                name="ssn_last_four"
                value={formData.ssn_last_four}
                onChange={handleChange}
                maxLength={4}
                placeholder="1234"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Optional - Only last 4 digits for identification</p>
            </div>
          </div>

          <GooglePlacesAutocomplete
            label="Home Address"
            value={formData.home_address}
            onChange={(value) => setFormData(prev => ({ ...prev, home_address: value }))}
            placeholder="123 Main St, City, State ZIP"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City of Residence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city_of_residence"
              value={formData.city_of_residence}
              onChange={(e) => setFormData(prev => ({ ...prev, city_of_residence: e.target.value }))}
              placeholder="e.g., Bronx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">City where you reside (for travel voucher)</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Work Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GooglePlacesAutocomplete
                label="Duty Station"
                value={formData.duty_station}
                onChange={(value) => setFormData(prev => ({ ...prev, duty_station: value }))}
                placeholder="City, State"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plant Number
                </label>
                <input
                  type="text"
                  name="travel_auth_no"
                  value={formData.travel_auth_no}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agency
                </label>
                <input
                  type="text"
                  name="agency"
                  value={formData.agency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Office
                </label>
                <input
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                  placeholder="CSI, Inspection Services, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Position</option>
                  <option value="Food Inspector">Food Inspector</option>
                  <option value="CSI">CSI (Consumer Safety Inspector)</option>
                  <option value="SPHV">SPHV (Supervisor Public Health Veterinarian)</option>
                  <option value="FLS">FLS (Front Line Supervisor)</option>
                  <option value="SCSI">SCSI (Supervisor Consumer Safety Inspector)</option>
                  <option value="Resource Coordinator">Resource Coordinator</option>
                  <option value="EIAO">EIAO (Enforcement, Investigation and Analysis Officer)</option>
                  <option value="DDM">DDM (Deputy District Manager)</option>
                  <option value="DM">DM (District Manager)</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
              </div>
              {formData.position === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specify Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="position_other"
                    value={formData.position_other}
                    onChange={handleChange}
                    required
                    placeholder="Enter your position title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* SCSI Supervisor Selection - Only show for CSI position */}
              {availableSupervisors.length > 0 && !formData.position?.toUpperCase().includes('SCSI') && !formData.position?.toUpperCase().includes('PHV') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Your Supervisor (SCSI) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supervisor</option>
                    {availableSupervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.position})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your travel vouchers will be submitted to this supervisor for approval
                  </p>
                </div>
              )}

              {/* FLS/DDM/DM Supervisor Selection - Dynamic based on position */}
              {availableFlsSupervisors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {formData.position?.toUpperCase().includes('DDM') 
                      ? 'Select Your District Manager (DM)' 
                      : formData.position?.toUpperCase().includes('DM') && !formData.position?.toUpperCase().includes('DDM')
                      ? 'Select Your Supervisor'
                      : formData.position?.toUpperCase().includes('FLS')
                      ? 'Select Your Deputy District Manager (DDM)'
                      : 'Select Your Front Line Supervisor (FLS)'}
                    {(formData.position?.toUpperCase().includes('SCSI') || 
                      formData.position?.toUpperCase().includes('PHV') || 
                      formData.position?.toUpperCase().includes('FLS') ||
                      formData.position?.toUpperCase().includes('DM')) && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={selectedFlsSupervisor}
                    onChange={(e) => setSelectedFlsSupervisor(e.target.value)}
                    required={
                      formData.position?.toUpperCase().includes('SCSI') || 
                      formData.position?.toUpperCase().includes('PHV') ||
                      formData.position?.toUpperCase().includes('FLS') ||
                      formData.position?.toUpperCase().includes('DM')
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      {formData.position?.toUpperCase().includes('DDM') 
                        ? 'Select DM' 
                        : formData.position?.toUpperCase().includes('DM') && !formData.position?.toUpperCase().includes('DDM')
                        ? 'Select Supervisor'
                        : formData.position?.toUpperCase().includes('FLS')
                        ? 'Select DDM'
                        : 'Select FLS Supervisor'}
                    </option>
                    {availableFlsSupervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.position})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {formData.position?.toUpperCase().includes('DDM')
                      ? 'Your travel vouchers will be submitted to your District Manager (DM) for approval' 
                      : formData.position?.toUpperCase().includes('DM') && !formData.position?.toUpperCase().includes('DDM')
                      ? 'Your travel vouchers will be submitted to your Supervisor for approval'
                      : (formData.position?.toUpperCase().includes('SCSI') || 
                         formData.position?.toUpperCase().includes('PHV') ||
                         formData.position?.toUpperCase().includes('FLS'))
                      ? 'Your travel vouchers will be submitted to this supervisor for approval' 
                      : 'Your Circuit Front Line Supervisor'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Make
                </label>
                <input
                  type="text"
                  name="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={handleChange}
                  placeholder="Toyota, Ford, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleChange}
                  placeholder="Camry, F-150, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Year
                </label>
                <input
                  type="text"
                  name="vehicle_year"
                  value={formData.vehicle_year}
                  onChange={handleChange}
                  placeholder="2020"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  name="vehicle_license"
                  value={formData.vehicle_license}
                  onChange={handleChange}
                  placeholder="ABC1234"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reimbursement Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mileage Rate ($/mile) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="mileage_rate"
                  value={formData.mileage_rate}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Per Diem Rate ($/day)
                </label>
                <input
                  type="number"
                  name="per_diem_rate"
                  value={formData.per_diem_rate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">For overnight travel (if applicable)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="For reimbursement processing"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Accounting Classification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Accounting Code
                </label>
                <input
                  type="text"
                  name="accounting_code"
                  value={formData.accounting_code}
                  onChange={handleChange}
                  placeholder="e.g., 1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost Center
                </label>
                <input
                  type="text"
                  name="cost_center"
                  value={formData.cost_center}
                  onChange={handleChange}
                  placeholder="e.g., CC-1234"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fund Code
                </label>
                <input
                  type="text"
                  name="fund_code"
                  value={formData.fund_code}
                  onChange={handleChange}
                  placeholder="e.g., FUND-789"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Code
                </label>
                <input
                  type="text"
                  name="organization_code"
                  value={formData.organization_code}
                  onChange={handleChange}
                  placeholder="e.g., ORG-456"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">These fields are used for accounting and budget tracking purposes</p>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;



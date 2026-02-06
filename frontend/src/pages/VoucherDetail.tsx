import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FileAttachments from '../components/FileAttachments';
import Comments from '../components/Comments';
import TravelVoucherForm from '../components/TravelVoucherForm';

interface Trip {
  id: number;
  date: string;
  from_address: string;
  to_address: string;
  site_name?: string;
  purpose?: string;
  miles_calculated: number;
  lodging_cost?: number;
  meals_cost?: number;
  per_diem_days?: number;
  other_expenses?: number;
  expense_notes?: string;
  departure_time?: string;
  return_time?: string;
}

interface VoucherDetail {
  id: number;
  user_id: number;
  month: number;
  year: number;
  status: string;
  total_miles: number;
  total_amount: number;
  total_lodging?: number;
  total_meals?: number;
  total_other?: number;
  submitted_at?: string;
  supervisor_approved_at?: string;
  fleet_approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  trips: Trip[];
  profile: any;
}

const VoucherDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOfficialForm, setShowOfficialForm] = useState(false);

  // Format date without timezone conversion
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
  };

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  const fetchVoucher = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vouchers/${id}`);
      setVoucher(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this voucher for approval?')) return;

    try {
      const response = await api.put(`/vouchers/${id}/submit`);
      setVoucher({ ...voucher!, ...response.data });
      alert('Voucher submitted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit voucher');
    }
  };

  const handleReopen = async () => {
    if (!confirm('This will reset the voucher to draft status so you can edit and resubmit. Continue?')) return;

    try {
      const response = await api.put(`/vouchers/${id}/reopen`);
      setVoucher({ ...voucher!, ...response.data });
      alert('Voucher reopened for editing. You can now modify the trips and resubmit.');
      navigate('/vouchers');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reopen voucher');
    }
  };

  const handleDownloadPDF = () => {
    // Open the official Travel Voucher form and trigger print
    setShowOfficialForm(true);
    // Give the modal time to render, then trigger print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await api.get(`/export/vouchers/${id}/excel`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voucher_${monthNames[voucher!.month - 1]}_${voucher!.year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Excel download error:', err);
      alert(err.response?.data?.error || err.message || 'Failed to download Excel');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Voucher not found'}
        </div>
        <button
          onClick={() => navigate('/vouchers')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Vouchers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/vouchers')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Vouchers
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Travel Voucher - {monthNames[voucher.month - 1]} {voucher.year}
            </h1>
            <p className="text-gray-500 mt-2">
              Created on {new Date(voucher.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {voucher.status === 'rejected' && (
              <button
                onClick={handleReopen}
                className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700"
              >
                🔄 Reopen for Editing
              </button>
            )}
            <button
              onClick={handleDownloadExcel}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
              title="Export to Excel"
            >
              <span>📊</span>
              <span>Excel</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              title="Print/Save official Travel Voucher form"
            >
              📄 Print Voucher
            </button>
            <button
              onClick={() => setShowOfficialForm(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
              title="View/Print Travel Voucher Form"
            >
              <span>📋</span>
              <span>Travel Voucher</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-2xl font-bold text-gray-900 capitalize mt-1">
            {voucher.status.replace('_', ' ')}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Trips</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {voucher.trips.length}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Miles</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {voucher.total_miles ? voucher.total_miles.toFixed(1) : '0.0'}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${voucher.total_amount ? voucher.total_amount.toFixed(2) : '0.00'}
          </p>
          {(voucher.total_lodging || voucher.total_meals || voucher.total_other) && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-600 dark:text-gray-300">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Mileage:</span>
                  <span className="font-medium">${((voucher.total_miles || 0) * 0.67).toFixed(2)}</span>
                </div>
                {(voucher.total_lodging ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Lodging:</span>
                    <span className="font-medium">${(voucher.total_lodging ?? 0).toFixed(2)}</span>
                  </div>
                )}
                {(voucher.total_meals ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Meals:</span>
                    <span className="font-medium">${(voucher.total_meals ?? 0).toFixed(2)}</span>
                  </div>
                )}
                {(voucher.total_other ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Other:</span>
                    <span className="font-medium">${(voucher.total_other ?? 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Timeline */}
      {voucher.status !== 'draft' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Approval Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                voucher.submitted_at ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <span className="text-white text-sm">✓</span>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">Submitted</p>
                {voucher.submitted_at && (
                  <p className="text-sm text-gray-500">
                    {new Date(voucher.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                voucher.supervisor_approved_at ? 'bg-green-500' : 
                voucher.status === 'rejected' ? 'bg-red-500' :
                voucher.status === 'submitted' ? 'bg-yellow-400' : 'bg-gray-300'
              }`}>
                <span className="text-white text-sm">
                  {voucher.supervisor_approved_at ? '✓' : 
                   voucher.status === 'rejected' ? '✕' :
                   voucher.status === 'submitted' ? '...' : '○'}
                </span>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">Supervisor Review</p>
                {voucher.supervisor_approved_at && (
                  <p className="text-sm text-gray-500">
                    Approved on {new Date(voucher.supervisor_approved_at).toLocaleString()}
                  </p>
                )}
                {voucher.status === 'submitted' && !voucher.supervisor_approved_at && (
                  <p className="text-sm text-yellow-600">Pending supervisor approval</p>
                )}
                {voucher.status === 'rejected' && (
                  <p className="text-sm text-red-600">Rejected</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                voucher.fleet_approved_at ? 'bg-green-500' : 
                voucher.status === 'supervisor_approved' ? 'bg-yellow-400' : 'bg-gray-300'
              }`}>
                <span className="text-white text-sm">
                  {voucher.fleet_approved_at ? '✓' : 
                   voucher.status === 'supervisor_approved' ? '...' : '○'}
                </span>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">Fleet Manager Review</p>
                {voucher.fleet_approved_at && (
                  <p className="text-sm text-gray-500">
                    Approved on {new Date(voucher.fleet_approved_at).toLocaleString()}
                  </p>
                )}
                {voucher.status === 'supervisor_approved' && !voucher.fleet_approved_at && (
                  <p className="text-sm text-yellow-600">Pending fleet manager approval</p>
                )}
                {voucher.status === 'approved' && (
                  <p className="text-sm text-green-600 font-medium">✓ Fully Approved</p>
                )}
              </div>
            </div>
          </div>

          {voucher.rejection_reason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
              <p className="text-sm text-red-700 mt-1">{voucher.rejection_reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Employee Information */}
      {voucher.profile && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Employee Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900 font-medium">
                {voucher.profile.first_name} {voucher.profile.middle_initial} {voucher.profile.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plant Number</p>
              <p className="text-gray-900 font-medium">{voucher.profile.travel_auth_no || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duty Station</p>
              <p className="text-gray-900 font-medium">{voucher.profile.duty_station || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="text-gray-900 font-medium">
                {voucher.profile.vehicle_year} {voucher.profile.vehicle_make} {voucher.profile.vehicle_model} ({voucher.profile.vehicle_license})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trip Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Trip Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Travel Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {voucher.trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(trip.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trip.from_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trip.to_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trip.site_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trip.purpose || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {trip.miles_calculated.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${(trip.miles_calculated * (voucher.profile?.mileage_rate || 0.67)).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={5} className="px-6 py-4 text-sm text-gray-900 text-right">
                  TOTAL:
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  {voucher.total_miles ? voucher.total_miles.toFixed(1) : '0.0'}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 text-right">
                  ${voucher.total_amount ? voucher.total_amount.toFixed(2) : '0.00'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* File Attachments Section */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Supporting Documents</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload receipts, invoices, or other supporting documentation for this voucher.
        </p>
        <FileAttachments 
          entityType="voucher" 
          entityId={parseInt(id!)} 
          canUpload={voucher.status === 'draft' || voucher.status === 'rejected'}
          canDelete={voucher.status === 'draft' || voucher.status === 'rejected'}
        />
      </div>

      {/* Comments Section */}
      <div className="mt-6">
        <Comments entityType="voucher" entityId={parseInt(id!)} />
      </div>

      {/* Travel Voucher Form Modal */}
      {showOfficialForm && voucher && (
        <TravelVoucherForm
          voucherData={voucher}
          onClose={() => {
            setShowOfficialForm(false);
            fetchVoucher(); // Refresh voucher data after closing form
          }}
          isEditable={voucher.user_id === user?.id && (voucher.status === 'draft' || voucher.status === 'rejected')}
          userRole={(user?.role as 'inspector' | 'supervisor' | 'admin' | 'fleet_manager') || 'inspector'}
          isOwner={voucher.user_id === user?.id}
        />
      )}
    </div>
  );
};

export default VoucherDetail;



import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Users } from 'lucide-react';

interface AssignmentRequest {
  id: number;
  inspector_id: number;
  requesting_supervisor_id: number;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  processed_at: string | null;
  processed_by: number | null;
  notes: string | null;
  reason: string | null;
  cancel_reason: string | null;
  inspector_email: string;
  inspector_first_name: string;
  inspector_last_name: string;
  inspector_position: string;
  inspector_state: string;
  inspector_circuit: string;
  current_supervisor_id: number | null;
  current_supervisor_email: string | null;
  current_supervisor_first_name: string | null;
  current_supervisor_last_name: string | null;
  requesting_supervisor_email: string;
  requesting_supervisor_first_name: string;
  requesting_supervisor_last_name: string;
  requesting_supervisor_position: string;
  processed_by_email: string | null;
  processed_by_first_name: string | null;
  processed_by_last_name: string | null;
}

export default function FlsAssignmentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<AssignmentRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = filterStatus === 'pending' 
        ? '/supervisors/pending-assignment-requests'
        : '/supervisors/pending-assignment-requests?status=all';
      const response = await api.get(endpoint);
      setRequests(response.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load assignment requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (request: AssignmentRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionNotes('');
    setShowActionModal(true);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const endpoint = actionType === 'approve'
        ? `/supervisors/approve-assignment/${selectedRequest.id}`
        : `/supervisors/reject-assignment/${selectedRequest.id}`;
      
      const response = await api.post(endpoint, { notes: actionNotes });
      
      setSuccess(response.data.message);
      setShowActionModal(false);
      setSelectedRequest(null);
      setActionNotes('');
      setTimeout(() => setSuccess(''), 5000);
      
      // Refresh requests
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${actionType} request`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-10 h-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assignment Requests</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Review and approve inspector assignment requests from supervisors
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">{pendingCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Pending Requests</div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            filterStatus === 'pending'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
          }`}
        >
          <Clock className="w-5 h-5 inline mr-2" />
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
          }`}
        >
          <FileText className="w-5 h-5 inline mr-2" />
          All Requests ({requests.length})
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No {filterStatus === 'pending' ? 'pending' : ''} assignment requests</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {filterStatus === 'pending' 
                ? 'Assignment requests from supervisors will appear here'
                : 'No requests have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Requesting Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <tr key={request.id} className={request.status === 'pending' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.inspector_first_name} {request.inspector_last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{request.inspector_position || 'N/A'}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {request.inspector_state} / {request.inspector_circuit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.requesting_supervisor_first_name} {request.requesting_supervisor_last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{request.requesting_supervisor_position || 'Supervisor'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.current_supervisor_id ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.current_supervisor_first_name} {request.current_supervisor_last_name}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Reassignment Request</div>
                        </div>
                      ) : (
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                        {request.status === 'canceled' ? (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 italic">Canceled by supervisor</p>
                            <p className="text-sm">{request.cancel_reason || 'No reason provided'}</p>
                          </div>
                        ) : (
                          request.reason || <span className="text-gray-400 italic">No reason provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(request.requested_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                        request.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                        request.status === 'canceled' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenActionModal(request, 'approve')}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 flex items-center gap-1 font-semibold"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(request, 'reject')}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 flex items-center gap-1 font-semibold"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          {request.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900/50 max-w-lg w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Assignment Request
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Inspector:</strong> {selectedRequest.inspector_first_name} {selectedRequest.inspector_last_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Requesting Supervisor:</strong> {selectedRequest.requesting_supervisor_first_name} {selectedRequest.requesting_supervisor_last_name}
                </p>
                {selectedRequest.current_supervisor_id && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>Current Supervisor:</strong> {selectedRequest.current_supervisor_first_name} {selectedRequest.current_supervisor_last_name}
                  </p>
                )}
                {selectedRequest.reason && (
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Reason for Request:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{selectedRequest.reason}"
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any notes or reasons..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRequest}
                  disabled={processing}
                  className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



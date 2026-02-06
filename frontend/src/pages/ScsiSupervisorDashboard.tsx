import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, Search, UserPlus, CheckCircle, Clock, AlertCircle, History, Eye, User } from 'lucide-react';

interface Inspector {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
  state: string;
  circuit: string;
  assigned_supervisor_id: number | null;
  assigned_supervisor_name: string | null;
  pending_vouchers: number;
}

interface Supervisor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
}

interface AssignmentRequest {
  id: number;
  inspector_id: number;
  requesting_supervisor_id: number;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  processed_at: string | null;
  processed_by: number | null;
  notes: string | null;
  inspector_email: string;
  inspector_first_name: string;
  inspector_last_name: string;
  inspector_position: string;
  requesting_supervisor_email: string;
  requesting_supervisor_first_name: string;
  requesting_supervisor_last_name: string;
  processed_by_email: string | null;
  processed_by_first_name: string | null;
  processed_by_last_name: string | null;
}

export default function ScsiSupervisorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allInspectors, setAllInspectors] = useState<Inspector[]>([]);
  const [myInspectors, setMyInspectors] = useState<Inspector[]>([]);
  const [unassignedInspectors, setUnassignedInspectors] = useState<Inspector[]>([]);
  const [otherInspectors, setOtherInspectors] = useState<Inspector[]>([]);
  const [pendingInspectors, setPendingInspectors] = useState<Inspector[]>([]);
  const [assignmentRequests, setAssignmentRequests] = useState<AssignmentRequest[]>([]);
  const [flsSupervisor, setFlsSupervisor] = useState<Supervisor | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'assigned' | 'unassigned' | 'pending' | 'other'>('all');
  const [activeTab, setActiveTab] = useState<'inspectors' | 'requests'>('inspectors');
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  useEffect(() => {
    fetchInspectors();
    fetchAssignmentRequests();
    fetchFlsSupervisor();
  }, []);

  useEffect(() => {
    if (allInspectors.length > 0) {
      const pendingRequestIds = assignmentRequests
        .filter(req => req.status === 'pending')
        .map(req => req.inspector_id);
      
      const assigned = allInspectors.filter((i: Inspector) => i.assigned_supervisor_id === user?.id);
      const unassigned = allInspectors.filter((i: Inspector) => !i.assigned_supervisor_id);
      const pending = allInspectors.filter((i: Inspector) => pendingRequestIds.includes(i.id));
      const others = allInspectors.filter((i: Inspector) => 
        i.assigned_supervisor_id && 
        i.assigned_supervisor_id !== user?.id &&
        !pendingRequestIds.includes(i.id)
      );
      
      setMyInspectors(assigned);
      setUnassignedInspectors(unassigned);
      setPendingInspectors(pending);
      setOtherInspectors(others);
    }
  }, [assignmentRequests, allInspectors, user?.id]);

  const fetchFlsSupervisor = async () => {
    try {
      // Get current user's profile to find FLS supervisor
      const userRes = await api.get('/profile');
      if (userRes.data.fls_supervisor_id) {
        // Get list of supervisors and find the FLS
        const supervisorsRes = await api.get('/supervisors/list');
        const fls = supervisorsRes.data.find(
          (s: Supervisor) => s.id === userRes.data.fls_supervisor_id
        );
        if (fls) {
          setFlsSupervisor(fls);
        }
      }
    } catch (err) {
      console.error('Failed to fetch FLS supervisor:', err);
    }
  };

  const fetchInspectors = async () => {
    try {
      setLoading(true);
      // Get all inspectors (SCSI can see everyone)
      const response = await api.get('/supervisors/all-inspectors');
      const inspectors = response.data;
      
      setAllInspectors(inspectors);
      
      // Get pending request inspector IDs
      const pendingRequestIds = assignmentRequests
        .filter(req => req.status === 'pending')
        .map(req => req.inspector_id);
      
      // Categorize inspectors
      const assigned = inspectors.filter((i: Inspector) => i.assigned_supervisor_id === user?.id);
      const unassigned = inspectors.filter((i: Inspector) => !i.assigned_supervisor_id);
      const pending = inspectors.filter((i: Inspector) => pendingRequestIds.includes(i.id));
      const others = inspectors.filter((i: Inspector) => 
        i.assigned_supervisor_id && 
        i.assigned_supervisor_id !== user?.id &&
        !pendingRequestIds.includes(i.id) // Exclude pending from "others"
      );
      
      setMyInspectors(assigned);
      setUnassignedInspectors(unassigned);
      setPendingInspectors(pending);
      setOtherInspectors(others);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inspectors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentRequests = async () => {
    try {
      const response = await api.get('/supervisors/assignment-requests');
      setAssignmentRequests(response.data);
    } catch (err: any) {
      console.error('Failed to load assignment requests:', err);
    }
  };

  const handleRequestAssignment = async (inspectorId: number) => {
    // Check if there's already a pending request for this inspector
    const hasPendingRequest = assignmentRequests.some(
      req => req.inspector_id === inspectorId && req.status === 'pending'
    );
    
    if (hasPendingRequest) {
      setError('You already have a pending reassignment request for this inspector. Please wait for FLS approval.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    // Open modal to get reason
    const inspector = allInspectors.find(i => i.id === inspectorId);
    if (inspector) {
      setSelectedInspector(inspector);
      setShowRequestModal(true);
    }
  };

  const submitRequestAssignment = async () => {
    if (!selectedInspector) return;
    
    if (!requestReason.trim()) {
      setError('Please provide a reason for the reassignment request');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const response = await api.post(`/supervisors/request-assignment/${selectedInspector.id}`, {
        reason: requestReason
      });
      setSuccess(response.data.message || 'Assignment request sent to FLS for approval!');
      setTimeout(() => setSuccess(''), 5000);
      setShowRequestModal(false);
      setRequestReason('');
      setSelectedInspector(null);
      // Refresh requests history
      fetchAssignmentRequests();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send assignment request');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCancelRequest = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowCancelModal(true);
  };

  const submitCancelRequest = async () => {
    if (!selectedRequestId) return;
    
    if (!cancelReason.trim()) {
      setError('Please provide a reason for canceling the request');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const response = await api.post(`/supervisors/cancel-assignment-request/${selectedRequestId}`, {
        reason: cancelReason
      });
      setSuccess(response.data.message || 'Assignment request canceled successfully');
      setTimeout(() => setSuccess(''), 5000);
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedRequestId(null);
      // Refresh both lists
      fetchAssignmentRequests();
      fetchInspectors();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel assignment request');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewProfile = (inspector: Inspector) => {
    setSelectedInspector(inspector);
    setShowProfileModal(true);
  };

  // Check if there's a pending request for an inspector
  const hasPendingRequest = (inspectorId: number) => {
    return assignmentRequests.some(
      req => req.inspector_id === inspectorId && req.status === 'pending'
    );
  };

  const getFilteredInspectors = () => {
    let filtered = allInspectors;
    
    switch (filterView) {
      case 'assigned':
        filtered = myInspectors;
        break;
      case 'unassigned':
        filtered = unassignedInspectors;
        break;
      case 'pending':
        filtered = pendingInspectors;
        break;
      case 'other':
        filtered = otherInspectors;
        break;
      default:
        filtered = allInspectors;
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        `${i.first_name} ${i.last_name}`.toLowerCase().includes(term) ||
        i.email.toLowerCase().includes(term) ||
        i.position?.toLowerCase().includes(term) ||
        i.state?.toLowerCase().includes(term) ||
        i.circuit?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredInspectors = getFilteredInspectors();

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-purple-600 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-10 h-10 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SCSI Supervisor Dashboard</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Manage inspector assignments and approvals
            </p>
          </div>

          {/* FLS Supervisor Info Card */}
          {flsSupervisor && (
            <div className="ml-6 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 min-w-[250px]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Your FLS Supervisor</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {flsSupervisor.first_name} {flsSupervisor.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{flsSupervisor.position || 'FLS'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{flsSupervisor.email}</p>
                </div>
              </div>
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

      {/* Tab Switcher */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('inspectors')}
            className={`flex-1 px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'inspectors'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Inspector Management
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'requests'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">Assignment History</span>
            {assignmentRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md animate-pulse">
                {assignmentRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'inspectors' ? (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div 
          onClick={() => setFilterView('all')}
          className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-all cursor-pointer ${
            filterView === 'all' ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-blue-200 dark:border-blue-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">All Inspectors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{allInspectors.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div 
          onClick={() => setFilterView('assigned')}
          className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-all cursor-pointer ${
            filterView === 'assigned' ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-900' : 'border-green-200 dark:border-green-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Assigned to Me</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{myInspectors.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div 
          onClick={() => setFilterView('unassigned')}
          className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-all cursor-pointer ${
            filterView === 'unassigned' ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900' : 'border-orange-200 dark:border-orange-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Unassigned CSIs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{unassignedInspectors.length}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div 
          onClick={() => setFilterView('pending')}
          className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-all cursor-pointer ${
            filterView === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-900' : 'border-yellow-200 dark:border-yellow-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{pendingInspectors.length}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div 
          onClick={() => setFilterView('other')}
          className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5 hover:shadow-md transition-all cursor-pointer ${
            filterView === 'other' ? 'border-gray-500 ring-2 ring-gray-200 dark:ring-gray-700' : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Assigned to Others</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{otherInspectors.length}</p>
            </div>
            <Users className="w-10 h-10 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-gray-900/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Search Inspectors</h3>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, position, state, circuit..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
        {(searchTerm || filterView !== 'all') && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Showing:</span>
              {filterView !== 'all' && (
                <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-2 py-1 rounded font-medium">
                  {filterView === 'assigned' && 'Assigned to Me'}
                  {filterView === 'unassigned' && 'Unassigned'}
                  {filterView === 'pending' && 'Pending Approval'}
                  {filterView === 'other' && 'Assigned to Others'}
                </span>
              )}
              {searchTerm && (
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                  Search: "{searchTerm}"
                </span>
              )}
              <span className="text-gray-500 dark:text-gray-400">({filteredInspectors.length} results)</span>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterView('all');
              }}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Inspectors List */}
      <div className="bg-white dark:bg-gray-800 border-l-4 border-purple-600 rounded-lg shadow-md dark:shadow-gray-900/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {filterView === 'all' && 'All Inspectors'}
            {filterView === 'assigned' && 'My Assigned Inspectors'}
            {filterView === 'unassigned' && 'Unassigned CSIs'}
            {filterView === 'pending' && 'Inspectors - Pending Approval'}
            {filterView === 'other' && 'Inspectors Assigned to Other Supervisors'}
          </h2>
        </div>
        
        {filteredInspectors.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">No inspectors found</p>
            <p className="text-sm">Try adjusting your filters or search term</p>
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
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    State/Circuit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assignment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pending Vouchers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInspectors.map((inspector) => {
                  const isAssignedToMe = inspector.assigned_supervisor_id === user?.id;
                  const isUnassigned = !inspector.assigned_supervisor_id;
                  
                  return (
                    <tr 
                      key={inspector.id}
                      className={
                        isAssignedToMe 
                          ? 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20' 
                          : isUnassigned
                          ? 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                            isAssignedToMe ? 'bg-green-500' : isUnassigned ? 'bg-orange-500' : 'bg-gray-500'
                          }`}>
                            {inspector.first_name?.charAt(0)}{inspector.last_name?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleViewProfile(inspector)}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline text-left"
                            >
                              {inspector.first_name} {inspector.last_name}
                            </button>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{inspector.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                          {inspector.position || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {inspector.state || 'N/A'} / {inspector.circuit || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAssignedToMe ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                            ✓ Assigned to Me
                          </span>
                        ) : isUnassigned ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
                            ⏳ Unassigned
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            → {inspector.assigned_supervisor_name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAssignedToMe && inspector.pending_vouchers > 0 ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                            {inspector.pending_vouchers} pending
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {inspector.pending_vouchers || 0}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isAssignedToMe ? (
                          <button
                            onClick={() => navigate(`/voucher-history?inspector_id=${inspector.id}`)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-semibold"
                          >
                            View Vouchers
                          </button>
                        ) : hasPendingRequest(inspector.id) ? (
                          <button
                            onClick={() => {
                              const request = assignmentRequests.find(
                                req => req.inspector_id === inspector.id && req.status === 'pending'
                              );
                              if (request) handleCancelRequest(request.id);
                            }}
                            className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-semibold"
                          >
                            <Clock className="w-4 h-4" />
                            Cancel Request
                          </button>
                        ) : isUnassigned ? (
                          <button
                            onClick={() => handleRequestAssignment(inspector.id)}
                            className="flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 font-semibold"
                          >
                            <UserPlus className="w-4 h-4" />
                            Request Assignment
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestAssignment(inspector.id)}
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold"
                          >
                            <UserPlus className="w-4 h-4" />
                            Request Reassignment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      ) : (
        /* Assignment Requests History Tab */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            Assignment Request History
          </h2>
          
          {assignmentRequests.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No assignment requests yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Your assignment request history will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date Requested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Inspector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Processed By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {assignmentRequests.map((request) => {
                    const statusColor = 
                      request.status === 'approved' ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40' :
                      request.status === 'rejected' ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40' :
                      'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40';
                    
                    return (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {new Date(request.requested_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.inspector_first_name} {request.inspector_last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{request.inspector_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {request.inspector_position || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {request.processed_at ? (
                            new Date(request.processed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {request.processed_by_first_name && request.processed_by_last_name ? (
                            `${request.processed_by_first_name} ${request.processed_by_last_name}`
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Auto-approved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inspector Profile Modal */}
      {showProfileModal && selectedInspector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-white text-2xl ${
                    selectedInspector.assigned_supervisor_id === user?.id ? 'bg-green-500' :
                    !selectedInspector.assigned_supervisor_id ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    {selectedInspector.first_name?.charAt(0)}{selectedInspector.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedInspector.first_name} {selectedInspector.last_name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">{selectedInspector.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Position</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedInspector.position || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedInspector.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">State</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedInspector.state || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Circuit</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedInspector.circuit || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assignment Status</p>
                  <p className="font-semibold">
                    {selectedInspector.assigned_supervisor_id === user?.id ? (
                      <span className="text-green-700 dark:text-green-400">✓ Assigned to Me</span>
                    ) : selectedInspector.assigned_supervisor_id ? (
                      <span className="text-gray-700 dark:text-gray-300">Assigned to {selectedInspector.assigned_supervisor_name}</span>
                    ) : (
                      <span className="text-orange-700 dark:text-orange-400">⚠ Unassigned</span>
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending Vouchers</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedInspector.pending_vouchers || 0}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Close
                </button>
                {selectedInspector.assigned_supervisor_id === user?.id ? (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      navigate(`/voucher-history?inspector_id=${selectedInspector.id}`);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 font-medium"
                  >
                    View Vouchers
                  </button>
                ) : hasPendingRequest(selectedInspector.id) ? (
                  <button
                    onClick={() => {
                      const request = assignmentRequests.find(
                        req => req.inspector_id === selectedInspector.id && req.status === 'pending'
                      );
                      if (request) {
                        setShowProfileModal(false);
                        handleCancelRequest(request.id);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 font-medium flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Cancel Request
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      handleRequestAssignment(selectedInspector.id);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {selectedInspector.assigned_supervisor_id ? 'Request Reassignment' : 'Request Assignment'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Reassignment Modal */}
      {showRequestModal && selectedInspector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Request Inspector Reassignment
              </h3>
              
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Inspector:</strong> {selectedInspector.first_name} {selectedInspector.last_name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Current Assignment:</strong> {selectedInspector.assigned_supervisor_name || 'Unassigned'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Reassignment Request <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Please provide a reason for this reassignment request..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This reason will be sent to your FLS supervisor for review.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestReason('');
                    setSelectedInspector(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRequestAssignment}
                  disabled={!requestReason.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Confirm Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelModal && selectedRequestId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Cancel Reassignment Request
              </h3>
              
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure you want to cancel this reassignment request? This action cannot be undone.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for canceling this request..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be recorded in the assignment history.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setSelectedRequestId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={submitCancelRequest}
                  disabled={!cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



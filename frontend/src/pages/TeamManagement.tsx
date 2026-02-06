import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Star, Building, UserCog, UserCheck, BarChart3 } from 'lucide-react';

interface TeamMember {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  middle_initial: string;
  position: string;
  state: string;
  circuit: string;
  hire_date: string | null;
  years_of_service: number | null;
  months_of_service: number | null;
  name: string;
  assigned_supervisor_id: number | null;
  assigned_supervisor_name: string | null;
}

interface Supervisor {
  id: number;
  email: string;
  name: string;
  position: string;
}

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<Supervisor[]>([]);
  const [scsiSupervisors, setScsiSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'seniority'>('seniority');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'supervisor' | 'inspector'>('all');
  const [filterPosition, setFilterPosition] = useState<'all' | 'CSI' | 'SCSI' | 'PHV'>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all'); // For card click filtering

  // Ref for scrolling to team list
  const teamListRef = React.useRef<HTMLDivElement>(null);

  // Form state for creating new user
  const [newUser, setNewUser] = useState({
    email: '',
    password: 'Test123!', // Default password
    first_name: '',
    last_name: '',
    middle_initial: '',
    position: '',
    role: 'inspector',
    state: '',
    circuit: '',
    phone: '',
    employee_id: '',
    hire_date: '',
    duty_station: '',
    assigned_supervisor_id: undefined as number | undefined,
    fls_supervisor_id: undefined as number | undefined
  });

  useEffect(() => {
    fetchTeamMembers();
    fetchAvailableSupervisors();
    fetchScsiSupervisors();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supervisors/subordinates');
      setTeamMembers(response.data);
    } catch (err: any) {
      setError('Failed to load team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSupervisors = async () => {
    try {
      // Get all supervisors for assignment dropdown
      const response = await api.get('/admin/users?role=supervisor');
      setAvailableSupervisors(response.data);
    } catch (err: any) {
      console.error('Failed to fetch supervisors:', err);
    }
  };

  const fetchScsiSupervisors = async () => {
    try {
      // Get all users and filter for SCSI or PHV positions only
      const response = await api.get('/admin/users');
      const scsiPhvList = response.data.filter((u: any) => {
        const position = u.position?.toUpperCase() || '';
        return position.includes('SCSI') || position.includes('PHV');
      });
      setScsiSupervisors(scsiPhvList);
    } catch (err: any) {
      console.error('Failed to fetch SCSI supervisors:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('Creating user with data:', {
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      position: newUser.position,
      role: newUser.role,
      assignedSupervisorId: newUser.assigned_supervisor_id
    });

    try {
      // Create user account with profile in one call
      const userResponse = await api.post('/admin/users', {
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        middleInitial: newUser.middle_initial,
        position: newUser.position,
        state: newUser.state,
        circuit: newUser.circuit,
        phone: newUser.phone,
        employeeId: newUser.employee_id,
        hireDate: newUser.hire_date || null,
        dutyStation: newUser.duty_station,
        assignedSupervisorId: newUser.fls_supervisor_id || user?.id, // FLS or auto-assign to current supervisor
        supervisorId: newUser.assigned_supervisor_id // Assign to SCSI supervisor
      });

      console.log('User created successfully:', userResponse.data);
      setSuccess(`User created successfully! Login: ${newUser.email} / ${newUser.password}`);
      setShowCreateModal(false);
      fetchTeamMembers();
      
      // Reset form
      setNewUser({
        email: '',
        password: 'Test123!',
        first_name: '',
        last_name: '',
        middle_initial: '',
        position: '',
        role: 'inspector',
        state: '',
        circuit: '',
        phone: '',
        employee_id: '',
        hire_date: '',
        duty_station: '',
        assigned_supervisor_id: undefined,
        fls_supervisor_id: undefined
      });
    } catch (err: any) {
      console.error('Failed to create user:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || 'Failed to create user';
      setError(errorMessage);
    }
  };

  const handleReassign = async (userId: number, newSupervisorId: number) => {
    try {
      await api.post('/supervisors/assign', {
        user_id: userId,
        supervisor_id: newSupervisorId
      });
      setSuccess('Team member reassigned successfully');
      fetchTeamMembers();
    } catch (err: any) {
      setError('Failed to reassign team member');
    }
  };

  const handleAssignToSupervisor = async (userId: number, supervisorId: number | null) => {
    try {
      await api.patch(`/team/team-member/${userId}`, {
        assigned_supervisor_id: supervisorId
      });
      setSuccess('Supervisor assignment updated successfully');
      fetchTeamMembers();
    } catch (err: any) {
      setError('Failed to assign supervisor');
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      // Use PATCH method with alternative endpoint to avoid backend crash
      await api.patch(`/team/team-member/${editingMember.id}`, {
        email: editingMember.email,
        first_name: editingMember.first_name,
        last_name: editingMember.last_name,
        middle_initial: editingMember.middle_initial,
        position: editingMember.position,
        role: editingMember.role,
        state: editingMember.state,
        circuit: editingMember.circuit,
        hire_date: editingMember.hire_date,
        assigned_supervisor_id: editingMember.assigned_supervisor_id,
      });

      setSuccess('Team member updated successfully');
      setShowEditModal(false);
      setEditingMember(null);
      fetchTeamMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update team member');
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${memberId}`);
      setSuccess('Team member deleted successfully');
      setShowEditModal(false);
      setEditingMember(null);
      fetchTeamMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete team member');
    }
  };

  const handleCardClick = (filter: string) => {
    if (activeFilter === filter) {
      // If clicking the same card, clear filter
      setActiveFilter('all');
    } else {
      // Set new filter
      setActiveFilter(filter);
      // Clear other filters when clicking a card
      setFilterRole('all');
      setFilterPosition('all');
      setSearchTerm('');
    }
    
    // Scroll to team list with smooth animation
    setTimeout(() => {
      teamListRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const getSortedTeamMembers = () => {
    // First apply search and filters
    let filtered = [...teamMembers];
    
    // Apply active filter from card clicks
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'csi':
          filtered = filtered.filter(m => {
            const pos = m.position?.toUpperCase() || '';
            return pos.includes('CSI') && !pos.includes('SCSI');
          });
          break;
        case 'scsi':
          filtered = filtered.filter(m => m.position?.toUpperCase().includes('SCSI'));
          break;
        case 'phv':
          filtered = filtered.filter(m => m.position?.toUpperCase().includes('PHV'));
          break;
        case 'supervisor':
          filtered = filtered.filter(m => m.role === 'supervisor');
          break;
        case 'inspector':
          filtered = filtered.filter(m => m.role === 'inspector');
          break;
      }
    }
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term) ||
        (member.position || '').toLowerCase().includes(term) ||
        (member.state || '').toLowerCase().includes(term) ||
        (member.circuit || '').toLowerCase().includes(term) ||
        member.role.toLowerCase().includes(term)
      );
    }
    
    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.role === filterRole);
    }
    
    // Apply position filter
    if (filterPosition !== 'all') {
      filtered = filtered.filter(member => {
        const pos = member.position?.toUpperCase() || '';
        if (filterPosition === 'CSI') {
          return pos.includes('CSI') && !pos.includes('SCSI');
        }
        return pos.includes(filterPosition);
      });
    }
    
    // Then sort
    switch (sortBy) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'position':
        return filtered.sort((a, b) => (a.position || '').localeCompare(b.position || ''));
      case 'seniority':
        // Sort by hire_date ascending (oldest first = most senior)
        return filtered.sort((a, b) => {
          if (!a.hire_date) return 1;
          if (!b.hire_date) return -1;
          return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
        });
      default:
        return filtered;
    }
  };

  const formatSeniority = (member: TeamMember) => {
    if (!member.hire_date || member.years_of_service === null) {
      return 'Not set';
    }
    const years = member.years_of_service || 0;
    const months = member.months_of_service || 0;
    return `${years}y ${months}m`;
  };

  const exportTeamList = () => {
    const sorted = getSortedTeamMembers();
    const csv = [
      ['Name', 'Position', 'State/Circuit', 'Email', 'Hire Date', 'Seniority'].join(','),
      ...sorted.map(m => [
        m.name,
        m.position || '',
        `${m.state || ''} ${m.circuit || ''}`.trim(),
        m.email,
        m.hire_date || 'Not set',
        formatSeniority(m)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-roster-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    // Helper to quote CSV values that contain commas, quotes, or newlines
    const quoteCsvValue = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes(' ')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = [
      ['Num', 'Last Name', 'First Name', 'Middle Name', 'Position Title', 'EOD', 'Email', 'State', 'Circuit', 'Phone', 'Plant Number'],
      ['1', 'Doe', 'John', 'A', 'CSI', '1/15/2020', 'john.doe@usda.gov', 'New York', 'NY-01', '555-0100', 'EMP001'],
      ['2', 'Smith', 'Jane', '', 'Food Inspector', '3/20/2021', 'jane.smith@usda.gov', 'California', 'CA-01', '555-0101', 'EMP002'],
    ];

    const template = rows.map(row => row.map(quoteCsvValue).join(',')).join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      // Preview ALL rows (not just first 5)
      const preview = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        return {
          row: index + 2,
          lastName: values[1] || '',
          firstName: values[2] || '',
          middleName: values[3] || '',
          position: values[4] || 'CSI',
          eod: values[5] || '',
          email: values[6] || '',
          state: values[7] || '',
          circuit: values[8] || '',
          phone: values[9] || '',
          employeeId: values[10] || ''
        };
      });

      setImportPreview(preview);
    };

    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    console.log('🚀 handleBulkImport called!');
    console.log('importFile:', importFile);
    console.log('importPreview length:', importPreview.length);
    
    if (!importFile) {
      console.error('❌ No import file!');
      return;
    }

    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        console.log(`📄 Parsed ${lines.length - 1} lines from CSV`);

        const members = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          return {
            firstName: values[2] || '',
            lastName: values[1] || '',
            middleName: values[3] || '',
            position: values[4] || 'CSI',
            eod: values[5] || '',
            email: values[6] || '',
            state: values[7] || '',
            circuit: values[8] || '',
            phone: values[9] || '',
            employeeId: values[10] || ''
          };
        }).filter(m => m.email && m.firstName && m.lastName);

        console.log(`✅ Prepared ${members.length} members for import:`, members);

        if (members.length === 0) {
          setError('No valid members to import. Please check that all rows have email, first name, and last name.');
          return;
        }

        const response = await api.post('/admin/bulk-import-team', {
          members,
          supervisorId: user?.id
        });

        console.log('✅ Import response:', response.data);

        setImportResults(response.data.results);
        setSuccess(`Successfully imported ${response.data.results.success.length} out of ${response.data.results.total} members`);
        
        if (response.data.results.errors.length > 0) {
          console.error('Import errors:', response.data.results.errors);
        }

        fetchTeamMembers();
      } catch (err: any) {
        console.error('❌ Bulk import failed:', err);
        setError(err.response?.data?.error || 'Failed to import team members');
      }
    };

    reader.readAsText(importFile);
  };

  const getPositionOptions = () => {
    // Based on FLS role, they can create inspectors and SCSI
    if (user?.role === 'supervisor') {
      return [
        { value: 'Food Inspector', label: 'Food Inspector' },
        { value: 'CSI', label: 'CSI (Consumer Safety Inspector)' },
        { value: 'SPHV', label: 'SPHV (Supervisor Public Health Veterinarian)' },
        { value: 'SCSI', label: 'SCSI (Supervisor Consumer Safety Inspector)' }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user can directly assign subordinates (FLS and higher)
  const userPosition = (user as any)?.position || '';
  const canDirectlyAssign = ['FLS', 'First Line Supervisor', 'DDM', 'DM', 'District Manager'].includes(userPosition) || user?.role === 'admin';

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border-l-4 border-blue-600 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-10 h-10 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your team members and assignments
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={downloadTemplate}
                className="bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2 font-medium shadow-sm"
              >
                <span>📄</span> Download Template
              </button>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="bg-white dark:bg-gray-700 border-2 border-orange-400 dark:border-orange-500 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2 font-medium shadow-sm"
              >
                <span>📤</span> Bulk Import
              </button>
              <button
                onClick={exportTeamList}
                disabled={teamMembers.length === 0}
                className="bg-white dark:bg-gray-700 border-2 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:border-gray-300 dark:disabled:border-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-sm"
              >
                <span>📥</span> Export Team List
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-medium shadow-sm"
              >
                + Create New Team Member
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Team Stats with Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div 
              onClick={() => handleCardClick('all')}
              className={`bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border-2 rounded-lg shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                activeFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-blue-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Members</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamMembers.length}</p>
                </div>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            
            <div 
              onClick={() => handleCardClick('csi')}
              className={`bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border-2 rounded-lg shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                activeFilter === 'csi' ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-800' : 'border-green-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">CSI</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {teamMembers.filter(m => {
                      const pos = m.position?.toUpperCase() || '';
                      return pos.includes('CSI') && !pos.includes('SCSI');
                    }).length}
                  </p>
                </div>
                <Search className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('scsi')}
              className={`bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border-2 rounded-lg shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                activeFilter === 'scsi' ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800' : 'border-purple-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">SCSI</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {teamMembers.filter(m => m.position?.toUpperCase().includes('SCSI')).length}
                  </p>
                </div>
                <Star className="w-10 h-10 text-purple-600" />
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('phv')}
              className={`bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border-2 rounded-lg shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                activeFilter === 'phv' ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-800' : 'border-orange-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">PHV</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {teamMembers.filter(m => m.position?.toUpperCase().includes('PHV')).length}
                  </p>
                </div>
                <Building className="w-10 h-10 text-orange-600" />
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('supervisor')}
              className={`bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border-2 rounded-lg shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                activeFilter === 'supervisor' ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-indigo-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Supervisors</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {teamMembers.filter(m => m.role === 'supervisor').length}
                  </p>
                </div>
                <UserCog className="w-10 h-10 text-indigo-600" />
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('inspector')}
              className={`bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border-2 rounded-lg shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                activeFilter === 'inspector' ? 'border-teal-500 ring-2 ring-teal-200 dark:ring-teal-800' : 'border-teal-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Inspectors</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {teamMembers.filter(m => m.role === 'inspector').length}
                  </p>
                </div>
                <UserCheck className="w-10 h-10 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Position Distribution Pie Chart */}
          <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" /> Position Distribution
            </h3>
            <div className="flex flex-col items-center justify-center h-64">
              {(() => {
                const csi = teamMembers.filter(m => {
                  const pos = m.position?.toUpperCase() || '';
                  return pos.includes('CSI') && !pos.includes('SCSI');
                }).length;
                const scsi = teamMembers.filter(m => m.position?.toUpperCase().includes('SCSI')).length;
                const phv = teamMembers.filter(m => m.position?.toUpperCase().includes('PHV')).length;
                const total = csi + scsi + phv;
                
                if (total === 0) {
                  return <div className="text-gray-400 text-center">No data available</div>;
                }

                const csiPercent = (csi / total) * 100;
                const scsiPercent = (scsi / total) * 100;
                const phvPercent = (phv / total) * 100;

                return (
                  <>
                    <svg viewBox="0 0 200 200" className="w-40 h-40">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#10B981" strokeWidth="35" strokeDasharray={`${csiPercent * 5.026} 502.6`} transform="rotate(-90 100 100)" />
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#8B5CF6" strokeWidth="35" strokeDasharray={`${scsiPercent * 5.026} 502.6`} strokeDashoffset={`-${csiPercent * 5.026}`} transform="rotate(-90 100 100)" />
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#F97316" strokeWidth="35" strokeDasharray={`${phvPercent * 5.026} 502.6`} strokeDashoffset={`-${(csiPercent + scsiPercent) * 5.026}`} transform="rotate(-90 100 100)" />
                    </svg>
                    <div className="mt-3 space-y-2 w-full">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">CSI</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{csi} ({csiPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">SCSI</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{scsi} ({scsiPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">PHV</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{phv} ({phvPercent.toFixed(0)}%)</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 bg-white dark:bg-gray-800 dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" /> Search & Filter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, position, state, circuit..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="supervisor">Supervisor</option>
                <option value="inspector">Inspector</option>
              </select>
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Position</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Positions</option>
                <option value="CSI">CSI</option>
                <option value="SCSI">SCSI</option>
                <option value="PHV">PHV</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary and Clear Button */}
          {(searchTerm || filterRole !== 'all' || filterPosition !== 'all' || activeFilter !== 'all') && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Active filters:</span>
                {activeFilter !== 'all' && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded font-medium">
                    Card: {activeFilter.toUpperCase()}
                  </span>
                )}
                {searchTerm && <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Search: "{searchTerm}"</span>}
                {filterRole !== 'all' && <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">Role: {filterRole}</span>}
                {filterPosition !== 'all' && <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded">Position: {filterPosition}</span>}
                <span className="text-gray-500 dark:text-gray-400">({getSortedTeamMembers().length} results)</span>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                  setFilterPosition('all');
                  setActiveFilter('all');
                }}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Sorting Controls */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('seniority')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                sortBy === 'seniority'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Seniority (Oldest First)
            </button>
            <button
              onClick={() => setSortBy('position')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                sortBy === 'position'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Position
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Name (A-Z)
            </button>
          </div>
        </div>

        {/* Team Members Table */}
        <div ref={teamListRef} className="bg-white dark:bg-gray-800 dark:shadow-gray-900/50 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  State/Circuit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Seniority
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No team members yet. Click "Create New Team Member" to get started.
                  </td>
                </tr>
              ) : (
                getSortedTeamMembers().map((member) => (
                  <tr 
                    key={member.id}
                    onClick={() => handleEdit(member)}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                        {member.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.role === 'supervisor' 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {member.role === 'supervisor' ? 'Supervisor' : 'Inspector'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.state} / {member.circuit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={member.assigned_supervisor_id || ''}
                        onChange={(e) => handleAssignToSupervisor(member.id, e.target.value ? parseInt(e.target.value) : null)}
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm w-full"
                      >
                        <option value="">Unassigned</option>
                        {scsiSupervisors.map(supervisor => (
                          <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatSeniority(member)}
                      </div>
                      {member.hire_date && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Since: {new Date(member.hire_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Create New Team Member</h2>
              
              {/* Error message inside modal */}
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleCreateUser}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Middle Initial
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={newUser.middle_initial}
                      onChange={(e) => setNewUser({...newUser, middle_initial: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="user@usda.gov"
                    />
                  </div>

                  {/* Position and Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newUser.position}
                      onChange={(e) => setNewUser({...newUser, position: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    >
                      <option value="">Select Position</option>
                      {getPositionOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    >
                      <option value="inspector">Inspector</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.state}
                      onChange={(e) => setNewUser({...newUser, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="California, New York, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Circuit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.circuit}
                      onChange={(e) => setNewUser({...newUser, circuit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="Circuit 1, Circuit 2, etc."
                    />
                  </div>

                  {/* Contact Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plant Number
                    </label>
                    <input
                      type="text"
                      value={newUser.employee_id}
                      onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>

                  {/* Hire Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hire Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newUser.hire_date}
                      onChange={(e) => setNewUser({...newUser, hire_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Used to calculate seniority automatically
                    </p>
                  </div>

                  <div className="hidden">
                    {/* Spacer for grid alignment */}
                  </div>

                  {/* Duty Station */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duty Station
                    </label>
                    <input
                      type="text"
                      value={newUser.duty_station}
                      onChange={(e) => setNewUser({...newUser, duty_station: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="e.g., United Premium Foods"
                    />
                  </div>

                  {/* Front Line Supervisor (FLS) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Front Line Supervisor (FLS)
                    </label>
                    <select
                      value={newUser.fls_supervisor_id || ''}
                      onChange={(e) => setNewUser({...newUser, fls_supervisor_id: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    >
                      <option value="">No FLS Assigned</option>
                      {availableSupervisors.filter(s => s.position?.toUpperCase().includes('FLS')).map(supervisor => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name || `${supervisor.first_name} ${supervisor.last_name}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Optional: Assign a Front Line Supervisor
                    </p>
                  </div>

                  {/* Assigned Supervisor */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Supervisor
                    </label>
                    <select
                      value={newUser.assigned_supervisor_id || ''}
                      onChange={(e) => setNewUser({...newUser, assigned_supervisor_id: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    >
                      <option value="">Unassigned</option>
                      {scsiSupervisors.map(supervisor => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Assign this member to a SCSI supervisor for travel voucher approvals
                    </p>
                  </div>

                  {/* Password */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      User can change this password after first login
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Bulk Import Team Members</h2>
              
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-medium mb-2 dark:text-white">Step 1: Download Template</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download the CSV template and fill it with your team member data.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600"
                >
                  📄 Download CSV Template
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2 dark:text-white">Step 2: Fill the Template</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-sm">
                  <p className="font-medium mb-2 dark:text-gray-300">Required columns:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    <li><strong>Last Name</strong>: Employee's last name</li>
                    <li><strong>First Name</strong>: Employee's first name</li>
                    <li><strong>Middle Name</strong>: Middle name or initial (optional)</li>
                    <li><strong>Position Title</strong>: CSI, Food Inspector, SCSI, SPHV</li>
                    <li><strong>EOD</strong>: Entry on Duty date (hire date) - Format: M/D/YYYY</li>
                    <li><strong>Email</strong>: Must be unique</li>
                    <li><strong>State</strong>: Work state</li>
                    <li><strong>Circuit</strong>: Circuit identifier</li>
                    <li><strong>Phone</strong>: Contact number (optional)</li>
                    <li><strong>Plant Number</strong>: Plant identification number (optional)</li>
                  </ul>
                  <p className="mt-3 text-gray-600 dark:text-gray-300">
                    <strong>Note:</strong> All imported users will have default password: <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">Test123!</code>
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2 dark:text-white">Step 3: Upload File</h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                />
              </div>

              {importPreview.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2 dark:text-white">Preview ({importPreview.length} Members)</h3>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Position</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">EOD</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {importPreview.map((member, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 whitespace-nowrap dark:text-gray-300">
                              {member.firstName} {member.middleName} {member.lastName}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap dark:text-gray-300">{member.position}</td>
                            <td className="px-3 py-2 whitespace-nowrap dark:text-gray-300">{member.eod}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs dark:text-gray-300">{member.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResults && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2 dark:text-white">Import Results</h3>
                  <div className="space-y-2">
                    <p className="text-green-600 dark:text-green-400">✓ Successfully imported: {importResults.success.length}</p>
                    {importResults.errors.length > 0 && (
                      <div>
                        <p className="text-red-600 dark:text-red-400">✗ Failed: {importResults.errors.length}</p>
                        <div className="mt-2 max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm">
                          {importResults.errors.map((err: any, idx: number) => (
                            <div key={idx} className="mb-1 dark:text-red-400">
                              Row {err.row} ({err.email}): {err.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                    setImportResults(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!importFile || importPreview.length === 0}
                  className="px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Import {importPreview.length} Members
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Team Member Modal */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold dark:text-white">Edit Team Member</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setError('');
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateMember}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMember.first_name}
                      onChange={(e) => setEditingMember({...editingMember, first_name: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMember.last_name}
                      onChange={(e) => setEditingMember({...editingMember, last_name: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Middle Initial
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={editingMember.middle_initial}
                      onChange={(e) => setEditingMember({...editingMember, middle_initial: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({...editingMember, email: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMember.position}
                      onChange={(e) => setEditingMember({...editingMember, position: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      placeholder="CSI, SCSI, Food Inspector, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    >
                      <option value="inspector">Inspector</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editingMember.state || ''}
                      onChange={(e) => setEditingMember({...editingMember, state: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Circuit
                    </label>
                    <input
                      type="text"
                      value={editingMember.circuit || ''}
                      onChange={(e) => setEditingMember({...editingMember, circuit: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hire Date (EOD)
                    </label>
                    <input
                      type="date"
                      value={editingMember.hire_date || ''}
                      onChange={(e) => setEditingMember({...editingMember, hire_date: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                    />
                    {editingMember.hire_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Seniority will be calculated from this date
                      </p>
                    )}
                  </div>

                  {canDirectlyAssign && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assigned Supervisor
                      </label>
                      <select
                        value={editingMember.assigned_supervisor_id || ''}
                        onChange={(e) => setEditingMember({...editingMember, assigned_supervisor_id: e.target.value ? parseInt(e.target.value) : null})}
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      >
                        <option value="">Unassigned</option>
                        {scsiSupervisors.map(supervisor => (
                          <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Assign this member to a SCSI supervisor for travel voucher approvals
                      </p>
                    </div>
                  )}

                  {!canDirectlyAssign && editingMember.assigned_supervisor_id && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assigned Supervisor
                      </label>
                      <div className="w-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded-md px-3 py-2">
                        {editingMember.assigned_supervisor_name || 'Assigned'}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only FLS supervisors can change assignments. Use Request Reassignment to request changes.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(editingMember.id)}
                    className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                  >
                    🗑️ Delete Member
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingMember(null);
                        setError('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;



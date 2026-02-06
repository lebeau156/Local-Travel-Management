import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './TravelVoucherForm.css';

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

interface AccountingClassification {
  code: string;
  percentage: number;
}

interface VoucherData {
  id?: number;
  month: number;
  year: number;
  status?: string;
  form_data?: string;  // JSON string of saved form data
  trips: Trip[];
  profile: {
    name?: string;
    first_name?: string;
    last_name?: string;
    middle_initial?: string;
    ssn_encrypted?: string;
    duty_station?: string;
    home_address?: string;
    city_of_residence?: string;
    employee_id?: string;
    email?: string;
    social_security?: string;
    office_location?: string;
    agency_code?: string;
    accounting_classifications?: string[]; // List of available codes
  };
  total_miles: number;
  total_amount: number;
  accounting_distribution?: AccountingClassification[];
  remarks?: string;
  claimant_signature?: string;
  claimant_signature_date?: string;
  supervisor_signature?: string;
  approver_signature?: string;
  approver_signed_at?: string;
  supervisor_name?: string;
  supervisor_title?: string;
  supervisor_ssn?: string;
  supervisor_date_approved?: string;
  supervisor_approved_at?: string;
  supervisor_phone?: string;
  fleet_manager_id?: number;
  fleet_manager_signature?: string;
  fleet_manager_name?: string;
  fleet_manager_phone?: string;
  fleet_approved_at?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  agency_code?: string;
}

interface Props {
  voucherData: VoucherData;
  onClose: () => void;
  onSave?: (data: Partial<VoucherData>) => void;
  isEditable?: boolean;
  userRole?: 'inspector' | 'supervisor' | 'admin' | 'fleet_manager';
  isOwner?: boolean; // NEW: indicates if the current user owns this voucher
}

export default function TravelVoucherForm({ 
  voucherData, 
  onClose, 
  onSave,
  isEditable = false,
  userRole = 'inspector',
  isOwner = false
}: Props) {
  const navigate = useNavigate();
  
  // Load saved form data if it exists (for supervisor/fleet manager view)
  const savedFormData = voucherData.form_data ? JSON.parse(voucherData.form_data) : null;
  
  // Parse name from profile or saved form data
  const firstName = savedFormData?.name_first || voucherData.profile.first_name || '';
  const lastName = savedFormData?.name_last || voucherData.profile.last_name || '';
  const middleInitial = savedFormData?.name_middle || voucherData.profile.middle_initial || '';
  const fullName = `${firstName} ${middleInitial ? middleInitial + ' ' : ''}${lastName}`.trim() || voucherData.profile.name || '';

  // Extract last 4 digits of SSN
  const extractLast4SSN = (ssn: string) => {
    if (!ssn) return '';
    const cleanSSN = ssn.replace(/\D/g, ''); // Remove non-digits
    return cleanSSN.slice(-4); // Get last 4 digits
  };
  
  // Parse resident city from home_address (extract city from full address)
  const extractCityFromAddress = (address: string) => {
    if (!address) return '';
    // Address format: "123 Street, City, State Zip"
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim(); // Get the second-to-last part (City)
    }
    return address;
  };

  // State for Section A editable fields - load from saved form data if available, then from profile
  const [travelAuthNo, setTravelAuthNo] = useState(savedFormData?.travel_auth_no || 'N/A');
  const [ssnLast4, setSsnLast4] = useState(
    savedFormData?.ssn_last4 || 
    extractLast4SSN(voucherData.profile.ssn_encrypted || voucherData.profile.social_security || '')
  );
  const [nameFirst, setNameFirst] = useState(firstName);
  const [nameLast, setNameLast] = useState(lastName);
  const [nameMiddle, setNameMiddle] = useState(middleInitial);
  const [agencyCodeNum, setAgencyCodeNum] = useState(savedFormData?.agency_code_num || voucherData.profile.agency_code || '37');
  const [agencyOfficeNum, setAgencyOfficeNum] = useState(savedFormData?.agency_office_num || voucherData.profile.office_location || 'AG37586000');
  const [travelerOfficeNum, setTravelerOfficeNum] = useState(savedFormData?.traveler_office_num || voucherData.profile.employee_id || '');
  const [typeClaim, setTypeClaim] = useState(savedFormData?.type_claim || 'DM');
  const [reclaimAmount, setReclaimAmount] = useState('');
  const [leaveTaken, setLeaveTaken] = useState('N');
  const [trainingDocNo, setTrainingDocNo] = useState('');
  const [purposeOfTravelCode, setPurposeOfTravelCode] = useState(savedFormData?.purpose_of_travel_code || '1');
  const [officialDutyStation, setOfficialDutyStation] = useState(
    savedFormData?.official_duty_station || 
    voucherData.profile.duty_station || 
    voucherData.profile.office_location || 
    ''
  );
  const [residentCity, setResidentCity] = useState(
    savedFormData?.resident_city || 
    voucherData.profile.city_of_residence || 
    extractCityFromAddress(voucherData.profile.home_address || '') || 
    ''
  );
  const [postApprovalIndicator, setPostApprovalIndicator] = useState('N');
  const [totalNightsLodging, setTotalNightsLodging] = useState('0');
  const [nightsApproved, setNightsApproved] = useState('0');

  // State for editable dates (Box 7) - load from saved form data if available
  const firstDay = new Date(voucherData.year, voucherData.month - 1, 1);
  const lastDay = new Date(voucherData.year, voucherData.month, 0);
  
  const parseDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return null;
  };
  
  const fromDate = savedFormData?.from_date ? parseDate(savedFormData.from_date) : null;
  const thruDate = savedFormData?.thru_date ? parseDate(savedFormData.thru_date) : null;
  
  const [fromMonth, setFromMonth] = useState(fromDate?.month || String(voucherData.month));
  const [fromDay, setFromDay] = useState(fromDate?.day || String(firstDay.getDate()));
  const [fromYear, setFromYear] = useState(fromDate?.year || String(voucherData.year));
  const [thruMonth, setThruMonth] = useState(thruDate?.month || String(voucherData.month));
  const [thruDay, setThruDay] = useState(thruDate?.day || String(lastDay.getDate()));
  const [thruYear, setThruYear] = useState(thruDate?.year || String(voucherData.year));

  // State for checkboxes
  const [purposeOfTravel, setPurposeOfTravel] = useState(true); // Box 17
  const [conferenceRegistration, setConferenceRegistration] = useState(false); // Box 18
  const [authAccounting, setAuthAccounting] = useState(false); // Box 45
  const [distAccounting, setDistAccounting] = useState(true); // Box 46 - default selected

  // Purpose of Travel Codes dropdown options
  const purposeCodes = [
    { value: '1', label: '1 = Site visit' },
    { value: '2', label: '2 = Information meeting' },
    { value: '3', label: '3 = Training attendance' },
    { value: '4', label: '4 = Speech or presentation' },
    { value: '5', label: '5 = Conference attendance' },
    { value: '7', label: '7 = Entitlement/home leave' },
    { value: '8', label: '8 = Special mission travel' },
    { value: '9', label: '9 = Emergency travel' },
    { value: '10', label: '10 = Other travel' },
    { value: '11', label: '11 = Pre-employment travel' },
    { value: '13', label: '13 = Rest and Recuperation' },
    { value: '14', label: '14 = Education' },
    { value: '15', label: '15 = Informal training' }
  ];

  // State for accounting classifications with percentages
  const [accountingDist, setAccountingDist] = useState<AccountingClassification[]>(
    // Load from saved form data first, then voucher data, then default
    savedFormData?.accounting_distribution || 
    voucherData.accounting_distribution || 
    (voucherData.profile.accounting_classifications || ['5TC0285', '5TC0286', '5TC0987']).map(code => ({
      code,
      percentage: 0
    }))
  );

  // State for remarks
  const [remarks, setRemarks] = useState(voucherData.remarks || '');

  // State for claimant signature - build from name fields to ensure we have a value
  const initialSignature = voucherData.claimant_signature && voucherData.claimant_signature !== '(Not signed)' 
    ? voucherData.claimant_signature 
    : fullName || `${firstName} ${lastName}`.trim();
  
  const [claimantSignature, setClaimantSignature] = useState(initialSignature);
  const [signatureDate, setSignatureDate] = useState(voucherData.claimant_signature_date || '');
  // Check if voucher is digitally signed - either from saved form data OR from database signature
  const [isDigitallySigned, setIsDigitallySigned] = useState(
    !!savedFormData?.digital_signature_timestamp || !!voucherData.claimant_signature
  );
  const [digitalSignatureTimestamp, setDigitalSignatureTimestamp] = useState(savedFormData?.digital_signature_timestamp || '');

  // State for supervisor fields
  const [supervisorSignature, setSupervisorSignature] = useState(voucherData.approver_signature || voucherData.supervisor_signature || '');
  const [supervisorName, setSupervisorName] = useState(voucherData.supervisor_name || '');
  const [supervisorTitle, setSupervisorTitle] = useState(voucherData.supervisor_title || '');
  const [supervisorSSN, setSupervisorSSN] = useState(voucherData.supervisor_ssn || '');
  const [supervisorDateApproved, setSupervisorDateApproved] = useState(voucherData.supervisor_approved_at || voucherData.supervisor_date_approved || '');
  const [supervisorPhone, setSupervisorPhone] = useState(voucherData.supervisor_phone || '');
  const [contactPersonName, setContactPersonName] = useState(voucherData.contact_person_name || '');
  const [contactPersonPhone, setContactPersonPhone] = useState(voucherData.contact_person_phone || '');
  const [agencyCode, setAgencyCode] = useState(voucherData.agency_code || 'USDA');
  
  // State for fleet manager fields
  const [fleetManagerName, setFleetManagerName] = useState(voucherData.fleet_manager_name || '');
  const [fleetManagerPhone, setFleetManagerPhone] = useState(voucherData.fleet_manager_phone || '');
  const [fleetApprovedDate, setFleetApprovedDate] = useState(voucherData.fleet_approved_at?.split('T')[0] || '');
  
  // State for trip details visibility
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [tripSortView, setTripSortView] = useState<'all' | 'week' | 'day'>('all');
  const [showTripMap, setShowTripMap] = useState(false);
  const [selectedTripForMap, setSelectedTripForMap] = useState<Trip | null>(null);
  
  // Determine if form should be read-only based on status
  // Form is editable only if:
  // 1. Status is 'draft' OR 'rejected' (owner can edit)
  // 2. Status is 'submitted' and user is supervisor (can approve/reject)
  // 3. Status is 'supervisor_approved' and user is fleet_manager (can approve/reject)
  const isFormLocked = !['draft', 'rejected'].includes(voucherData.status) && 
                       !(userRole === 'supervisor' && voucherData.status === 'submitted') &&
                       !(userRole === 'fleet_manager' && voucherData.status === 'supervisor_approved');
  
  const isInputReadOnly = isFormLocked || isDigitallySigned;
  
  // Ref for trip details section to enable auto-scroll
  const tripDetailsRef = useRef<HTMLDivElement>(null);

  // Auto-fill supervisor/fleet manager information when form opens for approval
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      try {
        // Only fetch if user is supervisor/fleet_manager and form is not already approved
        if ((userRole === 'supervisor' || userRole === 'fleet_manager') && !isOwner) {
          const response = await api.get('/auth/me');
          const currentUser = response.data;
          
          // Format current date in ISO format
          const currentDate = new Date().toISOString().split('T')[0];
          
          // Auto-fill supervisor fields if user is supervisor and voucher is submitted
          if (userRole === 'supervisor' && voucherData.status === 'submitted') {
            if (!voucherData.supervisor_name) {
              const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
              setSupervisorName(fullName);
            }
            if (!voucherData.supervisor_phone) {
              setSupervisorPhone(currentUser.phone || '');
            }
            if (!voucherData.supervisor_approved_at) {
              setSupervisorDateApproved(currentDate);
            }
            if (!voucherData.supervisor_title) {
              setSupervisorTitle(currentUser.position || '');
            }
          }
          
          // Auto-fill fleet manager fields if user is fleet_manager and voucher is supervisor_approved
          if (userRole === 'fleet_manager' && voucherData.status === 'supervisor_approved') {
            if (!voucherData.fleet_manager_name) {
              const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
              setFleetManagerName(fullName);
            }
            if (!voucherData.fleet_manager_phone) {
              setFleetManagerPhone(currentUser.phone || '');
            }
            if (!voucherData.fleet_approved_at) {
              setFleetApprovedDate(currentDate);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user profile:', error);
      }
    };

    fetchCurrentUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, voucherData.status, isOwner]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Mileage calculation
  const mileageRate = 0.67;
  const mileageAmount = voucherData.total_miles * mileageRate;

  // Net to Traveler (Box 44)
  const netToTraveler = mileageAmount;

  // Handle trip details toggle with auto-scroll
  const handleToggleTripDetails = () => {
    setShowTripDetails(prev => {
      const newValue = !prev;
      // If showing trip details, scroll to it after state updates
      if (newValue) {
        setTimeout(() => {
          tripDetailsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
      return newValue;
    });
  };

  // Group trips by week
  const groupTripsByWeek = () => {
    const weeks: Array<{
      startDate: Date;
      endDate: Date;
      trips: Trip[];
      totalMiles: number;
      city: string;
      state: string;
    }> = [];

    const sortedTrips = [...voucherData.trips].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedTrips.length === 0) return weeks;

    let currentWeekStart = new Date(sortedTrips[0].date);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    const monthEnd = new Date(voucherData.year, voucherData.month, 0);
    
    while (currentWeekStart <= monthEnd) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekTrips = sortedTrips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate >= currentWeekStart && tripDate <= weekEnd;
      });

      if (weekTrips.length > 0) {
        const totalMiles = weekTrips.reduce((sum, trip) => sum + trip.miles_calculated, 0);
        
        // Helper function to extract city and state from address
        const parseAddress = (address: string) => {
          const parts = address?.split(',').map(p => p.trim()) || [];
          
          // Address formats we handle:
          // "City, State Zip" - 2 parts
          // "Street, City, State Zip" - 3 parts
          // "Street, City, State Zip, Country" - 4 parts
          
          if (parts.length >= 4) {
            // "42 Jackson Dr, Cranford, NJ 07016, USA"
            return {
              city: parts[parts.length - 3], // "Cranford"
              state: parts[parts.length - 2].split(' ')[0] // "NJ" from "NJ 07016"
            };
          } else if (parts.length === 3) {
            // "Street, City, State Zip"
            return {
              city: parts[1], // "City"
              state: parts[2].split(' ')[0] // "State" from "State Zip"
            };
          } else if (parts.length === 2) {
            // "City, State Zip"
            return {
              city: parts[0], // "City"
              state: parts[1].split(' ')[0] // "State" from "State Zip"
            };
          }
          
          return { city: '', state: '' };
        };
        
        const locations = weekTrips.map(trip => parseAddress(trip.to_address));
        
        const city = locations[0]?.city || '';
        const state = locations[0]?.state || '';

        weeks.push({
          startDate: new Date(currentWeekStart),
          endDate: new Date(weekEnd),
          trips: weekTrips,
          totalMiles,
          city,
          state
        });
      }

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
  };

  const weeklyData = groupTripsByWeek();

  // Update accounting percentage
  const updatePercentage = (code: string, value: string) => {
    const percentage = parseFloat(value) || 0;
    setAccountingDist(prev => 
      prev.map(item => 
        item.code === code ? { ...item, percentage } : item
      )
    );
  };

  // Calculate total percentage
  const totalPercentage = accountingDist.reduce((sum, item) => sum + item.percentage, 0);

  // Handle Digital Signature
  const handleDigitalSign = () => {
    // Build current full name from state (use form fields if edited, otherwise profile)
    const currentFullName = nameMiddle 
      ? `${nameFirst} ${nameMiddle} ${nameLast}`.trim()
      : `${nameFirst} ${nameLast}`.trim() || fullName;
    
    // Comprehensive validation for all required Section A fields
    const missingFields = [];
    
    // Skip Box 1 (Travel Authorization No.) - can be N/A
    if (!ssnLast4 || ssnLast4.length !== 4) missingFields.push('Box 2: SSN Last 4 Digits');
    if (!nameLast) missingFields.push('Box 3: Last Name');
    if (!nameFirst) missingFields.push('Box 3: First Name');
    // Middle Initial is optional - many people don't have one
    if (!agencyCodeNum) missingFields.push('Box 4: Agency Code');
    if (!agencyOfficeNum) missingFields.push('Box 5: Agency Originating Office Number');
    if (!travelerOfficeNum) missingFields.push('Box 6: Traveler Originating Office Number');
    if (!fromMonth || !fromDay || !fromYear) missingFields.push('Box 7: FROM Date');
    if (!thruMonth || !thruDay || !thruYear) missingFields.push('Box 7: THRU Date');
    if (!typeClaim) missingFields.push('Box 8: Type Claim');
    if (!purposeOfTravelCode) missingFields.push('Box 11: Purpose of Travel Code');
    if (!officialDutyStation) missingFields.push('Box 12: Official Duty Station');
    if (!residentCity) missingFields.push('Box 13: Resident City');
    
    if (missingFields.length > 0) {
      alert(
        '⚠️ Cannot sign voucher!\n\n' +
        'The following required fields in Section A must be filled:\n\n' +
        missingFields.map(field => `• ${field}`).join('\n') +
        '\n\nPlease complete all required fields before signing.'
      );
      return;
    }
    
    // Validation - must have a complete name
    if (!currentFullName) {
      alert('⚠️ Cannot sign voucher!\n\nPlease enter your complete name in Section A (boxes 3, 4, 5) before signing.');
      return;
    }
    
    // Validation - accounting percentages must total 100%
    if (totalPercentage !== 100) {
      alert('⚠️ Cannot sign voucher!\n\nAccounting percentages must total 100% before signing.');
      return;
    }

    // Confirmation dialog
    const confirmed = confirm(
      '🔐 ELECTRONIC SIGNATURE CERTIFICATION\n\n' +
      'By clicking OK, you electronically sign this travel voucher and certify that:\n\n' +
      '✓ This voucher is correct and accurate\n' +
      '✓ Payment has not been received\n' +
      '✓ All information provided is truthful\n' +
      '✓ You understand this is a legally binding electronic signature\n\n' +
      'Do you wish to proceed with digital signature?'
    );

    if (confirmed) {
      // Create timestamp with Eastern Time Zone
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        timeZone: 'America/New_York'
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
      });
      
      const timestamp = `${dateStr} at ${timeStr} EST`;
      const isoDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Set digital signature with current name from form
      setIsDigitallySigned(true);
      setDigitalSignatureTimestamp(timestamp);
      setSignatureDate(isoDate);
      setClaimantSignature(currentFullName);
      
      // Show success message
      alert(
        '✅ VOUCHER DIGITALLY SIGNED\n\n' +
        `Digitally signed by: ${currentFullName}\n` +
        `Date and Time: ${timestamp}\n\n` +
        'You can now submit this voucher for supervisor approval.'
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!confirm('Submit this travel voucher to your supervisor for approval?')) {
      return;
    }

    try {
      // First check if user has position set
      const profileResponse = await api.get('/profile');
      if (!profileResponse.data.position) {
        if (confirm('You must set your position in your profile before submitting vouchers. Go to Profile Setup now?')) {
          navigate('/profile/setup');
        }
        return;
      }

      // Submit the voucher to supervisor
      await api.put(`/vouchers/${voucherData.id}/submit`, {
        accounting_distribution: accountingDist,
        remarks,
        claimant_signature: claimantSignature,
        claimant_signature_date: signatureDate,
        agency_code: agencyCode,
        // Include all Section A data
        travel_auth_no: travelAuthNo,
        ssn_last4: ssnLast4,
        name_first: nameFirst,
        name_last: nameLast,
        name_middle: nameMiddle,
        agency_code_num: agencyCodeNum,
        agency_office_num: agencyOfficeNum,
        traveler_office_num: travelerOfficeNum,
        from_date: `${fromYear}-${fromMonth.padStart(2, '0')}-${fromDay.padStart(2, '0')}`,
        thru_date: `${thruYear}-${thruMonth.padStart(2, '0')}-${thruDay.padStart(2, '0')}`,
        type_claim: typeClaim,
        purpose_of_travel_code: purposeOfTravelCode,
        official_duty_station: officialDutyStation,
        resident_city: residentCity,
        digital_signature_timestamp: digitalSignatureTimestamp
      });

      alert(
        '✅ VOUCHER SUBMITTED!\n\n' +
        'Your travel voucher has been successfully submitted to your supervisor for review and approval.\n\n' +
        'You will be notified once it has been reviewed.'
      );

      // Call the optional onSave callback if provided
      if (onSave) {
        onSave({
          accounting_distribution: accountingDist,
          remarks,
          claimant_signature: claimantSignature,
          claimant_signature_date: signatureDate
        });
      }

      // Close the form
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to submit voucher. Please try again.';
      const isStatusError = errorMessage.includes('already been submitted') || 
                            errorMessage.includes('already been approved') || 
                            errorMessage.includes('was rejected');
      const title = isStatusError ? '❌ SUBMISSION DENIED' : '❌ SUBMISSION FAILED';
      
      alert(
        `${title}\n\n${errorMessage}`
      );
    }
  };

  const handleSupervisorApprove = async () => {
    // Confirmation dialog for supervisor
    const confirmed = confirm(
      '🔐 SUPERVISOR ELECTRONIC SIGNATURE\n\n' +
      'By clicking OK, you electronically sign and approve this travel voucher and certify that:\n\n' +
      '✓ You have reviewed all trip details and supporting documentation\n' +
      '✓ The expenses are reasonable and necessary\n' +
      '✓ The voucher is accurate and complies with agency policies\n' +
      '✓ You authorize payment of the claimed amount\n\n' +
      'Do you wish to approve and sign this voucher?'
    );

    if (!confirmed) return;

    try {
      console.log('Sending approval request for voucher:', voucherData.id);
      const response = await api.put(`/vouchers/${voucherData.id}/approve-supervisor`);
      console.log('Approval response:', response);

      alert(
        '✅ VOUCHER APPROVED!\n\n' +
        'You have successfully approved this travel voucher.\n\n' +
        'The voucher will now be forwarded to the Fleet Manager for final approval.'
      );

      onClose();
    } catch (err: any) {
      console.error('Approval error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to approve voucher. Please try again.';
      alert(
        '❌ APPROVAL FAILED\n\n' +
        errorMessage
      );
    }
  };

  const handleSupervisorReject = async () => {
    const reason = prompt(
      'Please enter the reason for rejecting this voucher:\n\n' +
      '(This will be sent to the inspector so they can make corrections and resubmit)'
    );

    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required.');
      return;
    }

    try {
      await api.put(`/vouchers/${voucherData.id}/reject`, {
        rejection_reason: reason
      });

      alert(
        '✅ VOUCHER REJECTED\n\n' +
        'The voucher has been rejected and returned to the inspector.\n\n' +
        'The inspector will be notified and can make corrections and resubmit.'
      );

      onClose();
    } catch (err: any) {
      alert(
        '❌ REJECTION FAILED\n\n' +
        (err.response?.data?.error || 'Failed to reject voucher. Please try again.')
      );
    }
  };

  const handleForwardToFleetManager = async () => {
    const confirmed = confirm(
      '📤 FORWARD TO FLEET MANAGER\n\n' +
      'This will notify the Fleet Manager that this voucher is ready for final approval.\n\n' +
      'Do you want to proceed?'
    );

    if (!confirmed) return;

    try {
      // Just show success message - the voucher is already in supervisor_approved status
      alert(
        '✅ VOUCHER FORWARDED!\n\n' +
        'The Fleet Manager has been notified and will review this voucher for final approval.'
      );
      onClose();
    } catch (err: any) {
      alert('❌ Failed to forward voucher. Please try again.');
    }
  };

  const handleFleetManagerApprove = async () => {
    // Validate fleet manager fields
    if (!fleetManagerName || !fleetManagerPhone || !fleetApprovedDate) {
      alert('⚠️ Please fill in all Fleet Manager fields (Date, Name, and Phone) before approving.');
      return;
    }

    const confirmed = confirm(
      '🔐 FLEET MANAGER FINAL APPROVAL\n\n' +
      'By clicking OK, you electronically sign and provide final approval for this travel voucher and certify that:\n\n' +
      '✓ All approvals are in order\n' +
      '✓ The voucher complies with all policies\n' +
      '✓ Payment is authorized\n\n' +
      'Do you wish to provide final approval?'
    );

    if (!confirmed) return;

    try {
      await api.put(`/vouchers/${voucherData.id}/approve-fleet`, {
        fleet_manager_name: fleetManagerName,
        fleet_manager_phone: fleetManagerPhone,
        fleet_approved_date: fleetApprovedDate
      });

      alert(
        '✅ FINAL APPROVAL COMPLETE!\n\n' +
        'You have successfully provided final approval.\n\n' +
        'The voucher is now fully approved and ready for payment processing.'
      );

      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to approve voucher.';
      alert(
        '❌ APPROVAL FAILED\n\n' +
        errorMessage
      );
    }
  };

  const handleFleetManagerReject = async () => {
    const reason = prompt(
      'Please enter the reason for rejecting this voucher:\n\n' +
      '(This will be sent back to the supervisor and inspector)'
    );

    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required.');
      return;
    }

    try {
      await api.put(`/vouchers/${voucherData.id}/reject`, {
        rejection_reason: reason
      });

      alert(
        '✅ VOUCHER REJECTED\n\n' +
        'The voucher has been rejected and returned.\n\n' +
        'The supervisor and inspector will be notified.'
      );

      onClose();
    } catch (err: any) {
      alert(
        '❌ REJECTION FAILED\n\n' +
        (err.response?.data?.error || 'Failed to reject voucher. Please try again.')
      );
    }
  };

  return (
    <div className="voucher-overlay">
      <div className="voucher-controls no-print">
        {/* Digital Sign Button - Only show if not signed yet and user is the owner */}
        {!isDigitallySigned && isOwner && (
          <button 
            onClick={handleDigitalSign} 
            className="btn-save"
            style={{ background: '#7c3aed', fontWeight: 'bold' }}
          >
            🔐 Digital Sign
          </button>
        )}
        
        {/* Submit for Approval - Only show after digital signature, user is the owner, and status is draft */}
        {isDigitallySigned && isOwner && voucherData.status === 'draft' && (
          <button 
            onClick={handleSave} 
            className="btn-save"
            style={{ background: '#16a34a', fontWeight: 'bold' }}
          >
            ✅ Submit for Approval
          </button>
        )}
        
        {/* Supervisor Buttons - Show for supervisor on submitted vouchers */}
        {userRole === 'supervisor' && voucherData.status === 'submitted' && (
          <>
            <button 
              onClick={handleToggleTripDetails} 
              className="btn-save"
              style={{ background: '#3b82f6', fontWeight: 'bold' }}
            >
              {showTripDetails ? '📋 Hide' : '🗺️ View'} Inspector Trip Details
            </button>
            <button 
              onClick={handleSupervisorApprove} 
              className="btn-save"
              style={{ background: '#16a34a', fontWeight: 'bold' }}
            >
              ✅ Approve & Sign
            </button>
            <button 
              onClick={handleSupervisorReject} 
              className="btn-save"
              style={{ background: '#dc2626', fontWeight: 'bold' }}
            >
              ❌ Reject
            </button>
          </>
        )}

        {/* Supervisor Forward Button - Show after supervisor has approved */}
        {userRole === 'supervisor' && voucherData.status === 'supervisor_approved' && (
          <button 
            onClick={handleForwardToFleetManager} 
            className="btn-save"
            style={{ background: '#8b5cf6', fontWeight: 'bold' }}
          >
            ➡️ Forward to Fleet Manager
          </button>
        )}

        {/* Fleet Manager Buttons - Show for fleet manager on supervisor_approved vouchers */}
        {userRole === 'fleet_manager' && voucherData.status === 'supervisor_approved' && (
          <>
            <button 
              onClick={handleToggleTripDetails} 
              className="btn-save"
              style={{ background: '#3b82f6', fontWeight: 'bold' }}
            >
              {showTripDetails ? '📋 Hide' : '🗺️ View'} Inspector Trip Details
            </button>
            <button 
              onClick={handleFleetManagerApprove} 
              className="btn-save"
              style={{ background: '#16a34a', fontWeight: 'bold' }}
            >
              ✅ Final Approve & Sign
            </button>
            <button 
              onClick={handleFleetManagerReject} 
              className="btn-save"
              style={{ background: '#dc2626', fontWeight: 'bold' }}
            >
              ❌ Reject
            </button>
          </>
        )}
        
        <button onClick={handlePrint} className="btn-print">
          🖨️ Print/Save as PDF
        </button>
        
        <button onClick={onClose} className="btn-close">
          ✕ Close
        </button>
      </div>

      {/* PAGE 1 - Simplified Travel Voucher */}
      <div style={{ 
        pointerEvents: isFormLocked ? 'none' : 'auto',
        opacity: isFormLocked ? 0.85 : 1,
        userSelect: isFormLocked ? 'none' : 'auto'
      }}>
      <div className="voucher-page page-1">
        <div className="form-title">TRAVEL VOUCHER</div>
        <div className="form-subtitle">Local Travel - Temporary Duty</div>

        {/* Section A - Identification (All Fields Editable) */}
        <div className="section section-a">
          <div className="section-header">SECTION A – IDENTIFICATION</div>
          
          <table className="section-table">
            <tbody>
              {/* Row 1 */}
              <tr>
                <td className="field-cell" style={{ width: '12%' }}>
                  <div className="field-label">1. TRAVEL AUTHORIZATION NO.</div>
                  <input
                    type="text"
                    value={travelAuthNo}
                    onChange={(e) => setTravelAuthNo(e.target.value)}
                    className="editable-input"
                    placeholder="N/A"
                  />
                </td>
                <td className="field-cell" style={{ width: '13%' }}>
                  <div className="field-label">2. SOCIAL SECURITY NO.</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '8pt', fontWeight: 'bold', color: '#666' }}>000-00-</span>
                    <input
                      type="text"
                      value={ssnLast4}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only digits
                        if (value.length <= 4) {
                          setSsnLast4(value);
                        }
                      }}
                      className="editable-input"
                      placeholder="XXXX"
                      maxLength={4}
                      style={{ flex: 1, minWidth: '45px' }}
                    />
                  </div>
                </td>
                <td className="field-cell" style={{ width: '18%' }}>
                  <div className="field-label">3. NAME (Last)</div>
                  <input
                    type="text"
                    value={nameLast}
                    onChange={(e) => setNameLast(e.target.value)}
                    className="editable-input"
                  />
                </td>
                <td className="field-cell" style={{ width: '18%' }}>
                  <div className="field-label">(First)</div>
                  <input
                    type="text"
                    value={nameFirst}
                    onChange={(e) => setNameFirst(e.target.value)}
                    className="editable-input"
                  />
                </td>
                <td className="field-cell" style={{ width: '8%' }}>
                  <div className="field-label">(Middle Initial)</div>
                  <input
                    type="text"
                    value={nameMiddle}
                    onChange={(e) => setNameMiddle(e.target.value.toUpperCase())}
                    className="editable-input"
                    maxLength={1}
                  />
                </td>
                <td className="field-cell" style={{ width: '10%' }}>
                  <div className="field-label">4. AGENCY CODE</div>
                  <input
                    type="text"
                    value={agencyCodeNum}
                    onChange={(e) => setAgencyCodeNum(e.target.value)}
                    className="editable-input"
                    placeholder="37"
                  />
                </td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td className="field-cell">
                  <div className="field-label">5. AGENCY ORIGINATING OFFICE NUMBER</div>
                  <input
                    type="text"
                    value={agencyOfficeNum}
                    onChange={(e) => setAgencyOfficeNum(e.target.value)}
                    className="editable-input"
                    placeholder="AG37586000"
                  />
                </td>
                <td className="field-cell">
                  <div className="field-label">6. TRAVELER ORIGINATING OFFICE NUMBER</div>
                  <input
                    type="text"
                    value={travelerOfficeNum}
                    onChange={(e) => setTravelerOfficeNum(e.target.value)}
                    className="editable-input"
                  />
                </td>
                <td className="field-cell" colSpan={2}>
                  <div className="field-label">7. DATES OF TRAVEL EXPENSES</div>
                  <div className="date-boxes-container">
                    <div className="date-section">
                      <span className="date-label-header">FROM</span>
                      <div className="date-boxes">
                        <div className="date-box">
                          <span className="date-box-label">Month</span>
                          <input
                            type="text"
                            value={fromMonth}
                            onChange={(e) => setFromMonth(e.target.value)}
                            className="date-box-input"
                            maxLength={2}
                          />
                        </div>
                        <span className="date-separator">/</span>
                        <div className="date-box">
                          <span className="date-box-label">Day</span>
                          <input
                            type="text"
                            value={fromDay}
                            onChange={(e) => setFromDay(e.target.value)}
                            className="date-box-input"
                            maxLength={2}
                          />
                        </div>
                        <span className="date-separator">/</span>
                        <div className="date-box">
                          <span className="date-box-label">Year</span>
                          <input
                            type="text"
                            value={fromYear}
                            onChange={(e) => setFromYear(e.target.value)}
                            className="date-box-input"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="date-section">
                      <span className="date-label-header">THRU</span>
                      <div className="date-boxes">
                        <div className="date-box">
                          <span className="date-box-label">Month</span>
                          <input
                            type="text"
                            value={thruMonth}
                            onChange={(e) => setThruMonth(e.target.value)}
                            className="date-box-input"
                            maxLength={2}
                          />
                        </div>
                        <span className="date-separator">/</span>
                        <div className="date-box">
                          <span className="date-box-label">Day</span>
                          <input
                            type="text"
                            value={thruDay}
                            onChange={(e) => setThruDay(e.target.value)}
                            className="date-box-input"
                            maxLength={2}
                          />
                        </div>
                        <span className="date-separator">/</span>
                        <div className="date-box">
                          <span className="date-box-label">Year</span>
                          <input
                            type="text"
                            value={thruYear}
                            onChange={(e) => setThruYear(e.target.value)}
                            className="date-box-input"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="field-cell" colSpan={2}>
                  <div className="field-label">8. TYPE CLAIM (Indicate one type only)</div>
                  <select
                    value={typeClaim}
                    onChange={(e) => setTypeClaim(e.target.value)}
                    className="editable-select"
                    style={{ fontSize: '8pt' }}
                  >
                    <option value="DM">DM = Domestic</option>
                    <option value="FC">FC = Foreign TDY</option>
                    <option value="OC">OC = Outside Cont. U.S.</option>
                    <option value="GR">GR = Escorted Group</option>
                  </select>
                </td>
              </tr>

              {/* Row 3 */}
              <tr>
                <td className="field-cell">
                  <div className="field-label">10. LEAVE TAKEN</div>
                  <select
                    value={leaveTaken}
                    onChange={(e) => setLeaveTaken(e.target.value)}
                    className="editable-select"
                  >
                    <option value="Y">Y = Yes</option>
                    <option value="N">N = No</option>
                  </select>
                </td>
                <td className="field-cell" colSpan={2}>
                  <div className="field-label">11. PURPOSE OF TRAVEL CODE</div>
                  <select
                    value={purposeOfTravelCode}
                    onChange={(e) => setPurposeOfTravelCode(e.target.value)}
                    className="editable-select"
                    style={{ fontSize: '8pt' }}
                  >
                    {purposeCodes.map(code => (
                      <option key={code.value} value={code.value}>{code.label}</option>
                    ))}
                  </select>
                </td>
                <td className="field-cell" colSpan={2}>
                  <div className="field-label">12. OFFICIAL DUTY STATION</div>
                  <input
                    type="text"
                    value={officialDutyStation}
                    onChange={(e) => setOfficialDutyStation(e.target.value)}
                    className="editable-input"
                  />
                </td>
                <td className="field-cell">
                  <div className="field-label">13. RESIDENT CITY</div>
                  <input
                    type="text"
                    value={residentCity}
                    onChange={(e) => setResidentCity(e.target.value)}
                    className="editable-input"
                  />
                </td>
              </tr>

              {/* Row 4 */}
              <tr>
                <td className="field-cell">
                  <div className="field-label">14. POST APPROVAL</div>
                  <select
                    value={postApprovalIndicator}
                    onChange={(e) => setPostApprovalIndicator(e.target.value)}
                    className="editable-select"
                  >
                    <option value="Y">Y = Yes</option>
                    <option value="N">N = No</option>
                  </select>
                </td>
                <td className="field-cell">
                  <div className="field-label">15. NIGHTS LODGING</div>
                  <input
                    type="number"
                    value={totalNightsLodging}
                    onChange={(e) => setTotalNightsLodging(e.target.value)}
                    className="editable-input"
                  />
                </td>
                <td className="field-cell" colSpan={4}>
                  <div className="field-label">16. NIGHTS IN APPROVED ACCOMMODATIONS</div>
                  <input
                    type="number"
                    value={nightsApproved}
                    onChange={(e) => setNightsApproved(e.target.value)}
                    className="editable-input"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section B - Purpose (Box 17 & 18 only) */}
        <div className="section section-b">
          <div className="section-header">SECTION B – PURPOSE OF TRAVEL</div>
          
          <div style={{ padding: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={purposeOfTravel}
                onChange={(e) => setPurposeOfTravel(e.target.checked)}
                style={{ marginRight: '8px', width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: 'bold' }}>17. Official Site Inspections</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={conferenceRegistration}
                onChange={(e) => setConferenceRegistration(e.target.checked)}
                style={{ marginRight: '8px', width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: 'bold' }}>18. Conference/Meeting</span>
            </label>
          </div>
        </div>

        {/* Section D - Mileage Claim */}
        <div className="section section-d">
          <div className="section-header">MILEAGE REIMBURSEMENT</div>
          
          <div className="claim-row">
            <span className="claim-label">31. MILEAGE</span>
            <div className="mileage-detail">
              <span>Rate: ${mileageRate.toFixed(2)}</span>
              <span>Miles: {voucherData.total_miles.toFixed(1)}</span>
            </div>
            <span className="claim-amount">${mileageAmount.toFixed(2)}</span>
          </div>

          <div className="claim-row total-row">
            <span className="claim-label">44. NET TO TRAVELER</span>
            <span className="claim-amount" style={{ fontSize: '12pt' }}>${netToTraveler.toFixed(2)}</span>
          </div>
        </div>

        {/* Section E - Accounting Classification */}
        <div className="section section-e">
          <div className="section-header">SECTION E – ACCOUNTING CLASSIFICATION</div>

          <div style={{ padding: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={authAccounting}
                onChange={(e) => setAuthAccounting(e.target.checked)}
                style={{ marginRight: '8px', width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: 'bold' }}>45. AUTHORIZATION ACCOUNTING</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={distAccounting}
                onChange={(e) => setDistAccounting(e.target.checked)}
                style={{ marginRight: '8px', width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: 'bold' }}>46. DISTRIBUTED ACCOUNTING</span>
            </label>

            {distAccounting && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10pt' }}>
                  Accounting Classification Distribution:
                </div>
                <table className="accounting-table">
                  <thead>
                    <tr>
                      <th>Accounting Code</th>
                      <th style={{ width: '150px' }}>Percentage (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountingDist.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.code}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.percentage}
                            onChange={(e) => updatePercentage(item.code, e.target.value)}
                            style={{ width: '100%', padding: '4px', textAlign: 'right' }}
                          />
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                      <td>TOTAL</td>
                      <td style={{ textAlign: 'right', color: totalPercentage === 100 ? 'green' : 'red' }}>
                        {totalPercentage.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
                {totalPercentage !== 100 && (
                  <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>
                    ⚠️ Total must equal 100%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRIP DETAILS SECTION - Only visible when supervisor clicks "View Inspector Trip Details" */}
      {showTripDetails && (
        <div 
          ref={tripDetailsRef}
          className="no-print" 
          style={{ 
            margin: '20px 0', 
            padding: '20px', 
            border: '3px solid #3b82f6', 
            borderRadius: '8px',
            background: '#f0f9ff'
          }}
        >
          <h2 style={{ 
            fontSize: '20pt', 
            fontWeight: 'bold', 
            color: '#1e40af',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🗺️ Inspector Trip Details - {monthNames[voucherData.month - 1]} {voucherData.year}
          </h2>

          {/* Trip Sorting Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => setTripSortView('all')}
              style={{
                padding: '10px 20px',
                background: tripSortView === 'all' ? '#3b82f6' : 'white',
                color: tripSortView === 'all' ? 'white' : '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📋 View All Trips
            </button>
            <button 
              onClick={() => setTripSortView('day')}
              style={{
                padding: '10px 20px',
                background: tripSortView === 'day' ? '#16a34a' : 'white',
                color: tripSortView === 'day' ? 'white' : '#16a34a',
                border: '2px solid #16a34a',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📅 Sort by Day
            </button>
            <button 
              onClick={() => setTripSortView('week')}
              style={{
                padding: '10px 20px',
                background: tripSortView === 'week' ? '#7c3aed' : 'white',
                color: tripSortView === 'week' ? 'white' : '#7c3aed',
                border: '2px solid #7c3aed',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📆 Sort by Week
            </button>
          </div>

          {/* Display trips based on sort view */}
          {(() => {
            if (tripSortView === 'week') {
              // Group by week
              const weekGroups = new Map<string, typeof voucherData.trips>();
              
              // Helper function to get week start date (Sunday)
              const getWeekStart = (date: Date) => {
                const d = new Date(date);
                const day = d.getDay();
                d.setDate(d.getDate() - day);
                d.setHours(0, 0, 0, 0);
                return d;
              };
              
              voucherData.trips.forEach(trip => {
                const tripDate = new Date(trip.date);
                const weekStart = getWeekStart(tripDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                // Use timestamp as key for proper sorting and grouping
                const weekKey = weekStart.getTime().toString();
                
                if (!weekGroups.has(weekKey)) {
                  weekGroups.set(weekKey, []);
                }
                weekGroups.get(weekKey)!.push(trip);
              });

              // Convert to sorted array
              const sortedWeeks = Array.from(weekGroups.entries()).sort((a, b) => {
                return parseInt(a[0]) - parseInt(b[0]);
              });

              return sortedWeeks.map(([weekKey, trips], weekIndex) => {
                const totalMiles = trips.reduce((sum, t) => sum + t.miles_calculated, 0);
                const totalAmount = trips.reduce((sum, t) => sum + (t.miles_calculated * 0.67), 0);
                
                // Get week dates for display
                const weekStart = new Date(parseInt(weekKey));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const weekLabel = `Week ${weekIndex + 1} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
                
                return (
                  <div key={weekKey} style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      background: '#7c3aed', 
                      color: 'white', 
                      padding: '12px', 
                      fontSize: '11pt', 
                      fontWeight: 'bold',
                      borderRadius: '6px 6px 0 0'
                    }}>
                      📆 {weekLabel} - {trips.length} trip{trips.length !== 1 ? 's' : ''} | {totalMiles.toFixed(1)} miles | ${totalAmount.toFixed(2)}
                    </h3>
                    {renderTripsTable(trips)}
                  </div>
                );
              });
            } else if (tripSortView === 'day') {
              // Group by day
              const dayGroups = new Map<string, typeof voucherData.trips>();
              voucherData.trips.forEach(trip => {
                const tripDate = new Date(trip.date);
                const dayLabel = tripDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                if (!dayGroups.has(dayLabel)) {
                  dayGroups.set(dayLabel, []);
                }
                dayGroups.get(dayLabel)!.push(trip);
              });

              return Array.from(dayGroups.entries()).map(([dayLabel, trips]) => {
                const totalMiles = trips.reduce((sum, t) => sum + t.miles_calculated, 0);
                const totalAmount = trips.reduce((sum, t) => sum + (t.miles_calculated * 0.67), 0);
                
                return (
                  <div key={dayLabel} style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      background: '#1e40af', 
                      color: 'white', 
                      padding: '12px', 
                      fontSize: '11pt', 
                      fontWeight: 'bold',
                      borderRadius: '6px 6px 0 0'
                    }}>
                      📆 {dayLabel} - {trips.length} trip{trips.length !== 1 ? 's' : ''} | {totalMiles.toFixed(1)} miles | ${totalAmount.toFixed(2)}
                    </h3>
                    {renderTripsTable(trips)}
                  </div>
                );
              });
            } else {
              // Show all trips
              return renderTripsTable(voucherData.trips);
            }
          })()}
        </div>
      )}

      {/* Trip Map Modal */}
      {showTripMap && selectedTripForMap && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e40af' }}>
              🗺️ View Trip Route on Interactive Map
            </h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>From:</strong> {selectedTripForMap.from_address}<br/>
              <strong>To:</strong> {selectedTripForMap.to_address}<br/>
              <strong>Date:</strong> {new Date(selectedTripForMap.date).toLocaleDateString()}<br/>
              <strong>Miles:</strong> {selectedTripForMap.miles_calculated.toFixed(1)}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTripMap(false);
                  setSelectedTripForMap(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const mapUrl = `/trip-map/${selectedTripForMap.id}`;
                  window.open(mapUrl, '_blank');
                  setShowTripMap(false);
                  setSelectedTripForMap(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🗺️ Open Map
              </button>
            </div>
            <div style={{ 
              fontSize: '9pt', 
              color: '#6b7280', 
              textAlign: 'center',
              marginTop: '8px'
            }}>
              Opens in a new tab with full interactive map and navigation
            </div>
          </div>
        </div>
      )}
      
      {/* PAGE 2 - Trip Itinerary and Certifications */}
      <div className="voucher-page page-2">
        {/* Trip Itinerary Summary - Review trips first */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid black', paddingBottom: '8px' }}>
            TRAVEL ITINERARY SUMMARY
          </div>

        {/* Header Info - Using state values from Section A */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '8px', border: '2px solid black' }}>
          <div style={{ flex: 1 }}>
            <div className="field-label">Social Security No.</div>
            <div className="field-value" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
              000-00-{ssnLast4 || 'XXXX'}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="field-label">First Name</div>
            <div className="field-value" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
              {nameFirst}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="field-label">Last Name</div>
            <div className="field-value" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
              {nameLast}
            </div>
          </div>
        </div>

        {/* Weekly Itinerary Table */}
        <table className="itinerary-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '150px' }}>WEEK</th>
              <th colSpan={4}>ITINERARY</th>
              <th rowSpan={2} style={{ width: '100px' }}>TOTAL MILES</th>
            </tr>
            <tr>
              <th>Dates</th>
              <th>City</th>
              <th>State</th>
              <th>No. Trips</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Use THE SAME grouping logic as trip details for consistency
              const weekGroups = new Map<string, typeof voucherData.trips>();
              
              // Helper function to get week start date (Sunday)
              const getWeekStart = (date: Date) => {
                const d = new Date(date);
                const day = d.getDay();
                d.setDate(d.getDate() - day);
                d.setHours(0, 0, 0, 0);
                return d;
              };
              
              // Helper to parse city and state from address
              const parseAddress = (address: string) => {
                const parts = address?.split(',').map(p => p.trim()) || [];
                
                if (parts.length >= 4) {
                  return {
                    city: parts[parts.length - 3],
                    state: parts[parts.length - 2].split(' ')[0]
                  };
                } else if (parts.length === 3) {
                  return {
                    city: parts[1],
                    state: parts[2].split(' ')[0]
                  };
                } else if (parts.length === 2) {
                  return {
                    city: parts[0],
                    state: parts[1].split(' ')[0]
                  };
                }
                
                return { city: '', state: '' };
              };
              
              voucherData.trips.forEach(trip => {
                const tripDate = new Date(trip.date);
                const weekStart = getWeekStart(tripDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                // Use format: "2/1 - 2/7" (short format for table)
                const startStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
                const endStr = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
                const weekKey = `${weekStart.getTime()}`; // Use timestamp as key for proper sorting
                const weekLabel = `${startStr} - ${endStr}`;
                
                if (!weekGroups.has(weekKey)) {
                  weekGroups.set(weekKey, []);
                }
                weekGroups.get(weekKey)!.push(trip);
              });
              
              // Convert to array and sort by week start date
              const sortedWeeks = Array.from(weekGroups.entries()).sort((a, b) => {
                return parseInt(a[0]) - parseInt(b[0]);
              });
              
              return sortedWeeks.map(([weekKey, trips], idx) => {
                const totalMiles = trips.reduce((sum, t) => sum + t.miles_calculated, 0);
                
                // Get dates for display
                const weekStart = new Date(parseInt(weekKey));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const startStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
                const endStr = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
                
                // Get city/state from first trip's destination
                const location = parseAddress(trips[0]?.to_address || '');
                
                return (
                  <tr key={weekKey}>
                    <td style={{ fontWeight: 'bold' }}>Week {idx + 1}</td>
                    <td>{startStr} - {endStr}</td>
                    <td>{location.city}</td>
                    <td>{location.state}</td>
                    <td style={{ textAlign: 'center' }}>{trips.length}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totalMiles.toFixed(1)}</td>
                  </tr>
                );
              });
            })()}
            <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL MILES:</td>
              <td style={{ textAlign: 'right', fontSize: '12pt' }}>{voucherData.total_miles.toFixed(1)}</td>
            </tr>
            <tr style={{ background: '#e0e0e0', fontWeight: 'bold' }}>
              <td colSpan={5} style={{ textAlign: 'right' }}>RATE PER MILE:</td>
              <td style={{ textAlign: 'right' }}>${mileageRate.toFixed(2)}</td>
            </tr>
            <tr style={{ background: '#d0d0d0', fontWeight: 'bold', fontSize: '11pt' }}>
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL MILEAGE REIMBURSEMENT:</td>
              <td style={{ textAlign: 'right', fontSize: '12pt' }}>${mileageAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Remarks Section - Always Editable */}
        <div style={{ marginTop: '24px', border: '1px solid black', padding: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>REMARKS</div>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter any additional notes or comments..."
            className="remarks-textarea"
          />
        </div>

        {/* Privacy Act Notice */}
        <div style={{ marginTop: '16px', padding: '8px', border: '1px solid black', background: '#f9f9f9' }}>
          <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '4px' }}>
            PRIVACY ACT NOTICE.
          </div>
          <div style={{ fontSize: '7pt', lineHeight: '1.3', textAlign: 'justify' }}>
            The following information is provided to comply with the Privacy Act of 1974 (P.L. 93-579). The information requested on this form is required under the provisions of 5 USC, Chapter 57 (as amended) and Executive Orders 11609 of July 23, 1971, and 11012 of March 27, 1962, for the purpose of recording travel expenses incurred by the employee and to claim other entitlements and allowances as prescribed in the Federal Travel Regulations (41 CFR 301-304). The information contained in this form will be used by Federal Agency officers and employees who have a need for such information in the performance of their duties. Information will be transferred to appropriate Federal, State, local or foreign agencies, when relevant to civil, criminal, or regulatory investigations or prosecutions or pursuant to a requirement by GSA or such other agency in connection with the hiring or firing, or security clearance, or such other investigations of the performance of official duty in Government service. Failure to provide the information required will result in delay or suspension of the employee's claim for reimbursement.
          </div>
        </div>
        </div>

        {/* Section F - Certifications - Approve after reviewing */}
        <div className="section section-f" style={{ marginTop: '32px', pageBreakBefore: 'auto' }}>
          <div className="section-header">CERTIFICATIONS</div>

          {/* Claimant Signature */}
          <div style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '9pt' }}>
              CLAIMANT'S CERTIFICATION: I certify that this voucher is correct and that payment has not been received.
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <div style={{ flex: '2' }}>
                <div className="field-label">Signature</div>
                {!isDigitallySigned && isEditable && isOwner ? (
                  <input
                    type="text"
                    value={claimantSignature}
                    onChange={(e) => setClaimantSignature(e.target.value)}
                    placeholder="Type your name to sign electronically"
                    className="signature-input"
                  />
                ) : (
                  <div className="signature-display">
                    {claimantSignature || '(Not signed)'}
                  </div>
                )}
                
                {/* Digital Signature Timestamp - USDA Format */}
                {isDigitallySigned && digitalSignatureTimestamp && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '9pt', 
                    color: '#047857',
                    fontWeight: 'normal',
                    padding: '8px',
                    background: '#d1fae5',
                    border: '1px solid #10b981',
                    borderRadius: '4px',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
                      ✅ <strong>Digitally signed by</strong>
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {claimantSignature}
                    </div>
                    <div style={{ fontSize: '8pt' }}>
                      <strong>Date:</strong> {digitalSignatureTimestamp}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex: '1' }}>
                <div className="field-label">Date</div>
                <input
                  type="date"
                  value={signatureDate}
                  onChange={(e) => setSignatureDate(e.target.value)}
                  className="editable-input"
                  style={{ fontSize: '9pt' }}
                  disabled={isDigitallySigned}
                />
              </div>
            </div>
          </div>

          {/* Supervisor Approval Section */}
          <div style={{ padding: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <div className="field-label">50. Supervisor Signature</div>
                {isEditable && userRole === 'supervisor' ? (
                  <input
                    type="text"
                    value={supervisorSignature}
                    onChange={(e) => setSupervisorSignature(e.target.value)}
                    placeholder="Type name to sign"
                    className="signature-input"
                  />
                ) : voucherData.status === 'supervisor_approved' || voucherData.status === 'approved' ? (
                  <div style={{ 
                    padding: '12px',
                    background: '#d1fae5',
                    border: '1px solid #10b981',
                    borderRadius: '4px',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ fontSize: '8pt', marginBottom: '2px', color: '#047857' }}>
                      ✅ <strong>Digitally signed by</strong>
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: '#047857' }}>
                      {supervisorSignature.includes('Digitally signed by') 
                        ? supervisorSignature.match(/by\s+([^on]+)/)?.[1]?.trim() || supervisorSignature
                        : supervisorSignature}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#047857' }}>
                      <strong>Date:</strong> {supervisorSignature.match(/on\s+(.+)/)?.[1] || supervisorDateApproved}
                    </div>
                  </div>
                ) : (
                  <div className="signature-display">{supervisorSignature || '(Pending approval)'}</div>
                )}
              </div>

              <div>
                <div className="field-label">52. Date Approved</div>
                <input
                  type="date"
                  value={supervisorDateApproved}
                  onChange={(e) => setSupervisorDateApproved(e.target.value)}
                  className="editable-input"
                  style={{ fontSize: '9pt' }}
                />
              </div>

              <div>
                <div className="field-label">54. Name and Title</div>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Last, First / Title"
                  className="editable-input"
                />
              </div>

              <div>
                <div className="field-label">53. Phone</div>
                <input
                  type="tel"
                  value={supervisorPhone}
                  onChange={(e) => setSupervisorPhone(e.target.value)}
                  className="editable-input"
                  placeholder="(XXX) XXX-XXXX"
                />
              </div>
            </div>
          </div>

          {/* Fleet Manager Approval Section - Fields 55-58 (Always visible) */}
          <div style={{ padding: '8px', marginTop: '16px', borderTop: '2px solid #cbd5e1' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '9pt' }}>
              APPROVING OFFICER'S FINAL APPROVAL
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <div className="field-label">55. Fleet Manager Signature</div>
                {voucherData.status === 'approved' || voucherData.status === 'fleet_approved' ? (
                  <div style={{ 
                    padding: '12px',
                    background: '#d1fae5',
                    border: '1px solid #10b981',
                    borderRadius: '4px',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ fontSize: '8pt', marginBottom: '2px', color: '#047857' }}>
                      ✅ <strong>Digitally signed by</strong>
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: '#047857' }}>
                      {voucherData.fleet_manager_signature || 'FLEET MANAGER'}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#047857' }}>
                      <strong>Date:</strong> {voucherData.fleet_approved_at || ''}
                    </div>
                  </div>
                ) : (
                  <div className="signature-display">(Pending final approval)</div>
                )}
              </div>

              <div>
                <div className="field-label">56. Date Approved</div>
                <input
                  type="date"
                  value={fleetApprovedDate}
                  onChange={(e) => setFleetApprovedDate(e.target.value)}
                  readOnly={voucherData.status === 'approved' || userRole !== 'fleet_manager'}
                  className="editable-input"
                  style={{ 
                    fontSize: '9pt', 
                    background: (voucherData.status === 'approved' || userRole !== 'fleet_manager') ? '#f3f4f6' : 'white' 
                  }}
                />
              </div>

              <div>
                <div className="field-label">57. Name and Title</div>
                <input
                  type="text"
                  value={fleetManagerName}
                  onChange={(e) => setFleetManagerName(e.target.value)}
                  readOnly={voucherData.status === 'approved' || userRole !== 'fleet_manager'}
                  placeholder="Last, First / Title"
                  className="editable-input"
                  style={{ 
                    background: (voucherData.status === 'approved' || userRole !== 'fleet_manager') ? '#f3f4f6' : 'white' 
                  }}
                />
              </div>

              <div>
                <div className="field-label">58. Phone</div>
                <input
                  type="tel"
                  value={fleetManagerPhone}
                  onChange={(e) => setFleetManagerPhone(e.target.value)}
                  readOnly={voucherData.status === 'approved' || userRole !== 'fleet_manager'}
                  className="editable-input"
                  placeholder="(XXX) XXX-XXXX"
                  style={{ 
                    background: (voucherData.status === 'approved' || userRole !== 'fleet_manager') ? '#f3f4f6' : 'white' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3 - Detailed Trip Information (Always printed) */}
      <div className="voucher-page page-3" style={{ pageBreakBefore: 'always' }}>
        <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid black', paddingBottom: '8px' }}>
          DETAILED TRIP INFORMATION
        </div>
        <div style={{ fontSize: '10pt', textAlign: 'center', marginBottom: '16px', color: '#666' }}>
          {monthNames[voucherData.month - 1]} {voucherData.year} - Inspector: {nameFirst} {nameLast}
        </div>

        {/* All Trips Table */}
        {renderTripsTable(voucherData.trips)}
      </div>

      {/* TRIP DETAILS SECTION - Only visible when supervisor clicks "View Inspector Trip Details" */}
      {showTripDetails && (
        <div 
          ref={tripDetailsRef}
          className="no-print" 
          style={{ 
            margin: '20px 0', 
            padding: '20px', 
            border: '3px solid #3b82f6', 
            borderRadius: '8px',
            background: '#f0f9ff'
          }}
        >
          <h2 style={{ 
            fontSize: '20pt', 
            fontWeight: 'bold', 
            color: '#1e40af',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🗺️ Inspector Trip Details - {monthNames[voucherData.month - 1]} {voucherData.year}
          </h2>

          {/* Trip Sorting Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => setTripSortView('all')}
              style={{
                padding: '10px 20px',
                background: tripSortView === 'all' ? '#3b82f6' : 'white',
                color: tripSortView === 'all' ? 'white' : '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📋 All Trips ({voucherData.trips.length})
            </button>
            <button 
              onClick={() => setTripSortView('week')}
              style={{
                padding: '10px 20px',
                background: tripSortView === 'week' ? '#3b82f6' : 'white',
                color: tripSortView === 'week' ? 'white' : '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📅 By Week
            </button>
            <button 
              onClick={() => setTripSortView('day')}
              style={{
                padding: '10px 20px',
                background: tripSortView === 'day' ? '#3b82f6' : 'white',
                color: tripSortView === 'day' ? 'white' : '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📆 By Day
            </button>
          </div>

          {/* Trip List with Grouping Logic */}
          {(() => {
            // Helper function to get week number
            const getWeekNumber = (date: Date) => {
              const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
              const dayNum = d.getUTCDay() || 7;
              d.setUTCDate(d.getUTCDate() + 4 - dayNum);
              const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
              return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            };

            // Group trips based on current view
            if (tripSortView === 'week') {
              // Group by week
              const weekGroups = new Map<string, Trip[]>();
              voucherData.trips.forEach(trip => {
                const tripDate = new Date(trip.date);
                const weekNum = getWeekNumber(tripDate);
                const weekKey = `Week ${weekNum} (${tripDate.getFullYear()})`;
                if (!weekGroups.has(weekKey)) {
                  weekGroups.set(weekKey, []);
                }
                weekGroups.get(weekKey)!.push(trip);
              });

              return Array.from(weekGroups.entries()).map(([weekLabel, trips]) => {
                const totalMiles = trips.reduce((sum, t) => sum + t.miles_calculated, 0);
                const totalAmount = trips.reduce((sum, t) => sum + (t.miles_calculated * 0.67), 0);
                
                return (
                  <div key={weekLabel} style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      background: '#1e40af', 
                      color: 'white', 
                      padding: '12px', 
                      fontSize: '11pt', 
                      fontWeight: 'bold',
                      borderRadius: '6px 6px 0 0'
                    }}>
                      📅 {weekLabel} - {trips.length} trip{trips.length !== 1 ? 's' : ''} | {totalMiles.toFixed(1)} miles | ${totalAmount.toFixed(2)}
                    </h3>
                    {renderTripsTable(trips)}
                  </div>
                );
              });
            } else if (tripSortView === 'day') {
              // Group by day
              const dayGroups = new Map<string, Trip[]>();
              voucherData.trips.forEach(trip => {
                const tripDate = new Date(trip.date);
                const dayKey = tripDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                if (!dayGroups.has(dayKey)) {
                  dayGroups.set(dayKey, []);
                }
                dayGroups.get(dayKey)!.push(trip);
              });

              return Array.from(dayGroups.entries()).map(([dayLabel, trips]) => {
                const totalMiles = trips.reduce((sum, t) => sum + t.miles_calculated, 0);
                const totalAmount = trips.reduce((sum, t) => sum + (t.miles_calculated * 0.67), 0);
                
                return (
                  <div key={dayLabel} style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      background: '#1e40af', 
                      color: 'white', 
                      padding: '12px', 
                      fontSize: '11pt', 
                      fontWeight: 'bold',
                      borderRadius: '6px 6px 0 0'
                    }}>
                      📆 {dayLabel} - {trips.length} trip{trips.length !== 1 ? 's' : ''} | {totalMiles.toFixed(1)} miles | ${totalAmount.toFixed(2)}
                    </h3>
                    {renderTripsTable(trips)}
                  </div>
                );
              });
            } else {
              // Show all trips
              return renderTripsTable(voucherData.trips);
            }
          })()}
        </div>
      )}

      {/* Trip Map Modal */}
      {showTripMap && selectedTripForMap && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e40af' }}>
                🗺️ Trip Map - {new Date(selectedTripForMap.date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => {
                  setShowTripMap(false);
                  setSelectedTripForMap(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '10pt'
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ 
              background: '#f8fafc', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>From:</strong> {selectedTripForMap.from_address}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>To:</strong> {selectedTripForMap.to_address}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Distance:</strong> {selectedTripForMap.miles_calculated.toFixed(1)} miles
              </div>
              <div>
                <strong>Amount:</strong> ${(selectedTripForMap.miles_calculated * 0.67).toFixed(2)}
              </div>
            </div>

            {/* Google Maps Route Link */}
            <div style={{ 
              width: '100%', 
              minHeight: '300px',
              border: '2px solid #cbd5e1',
              borderRadius: '8px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              gap: '24px'
            }}>
              <div style={{ 
                fontSize: '48px',
                marginBottom: '8px'
              }}>
                🗺️
              </div>
              
              <div style={{ 
                fontSize: '14pt', 
                fontWeight: 'bold', 
                color: 'white',
                textAlign: 'center',
                maxWidth: '600px'
              }}>
                View Driving Directions in Google Maps
              </div>
              
              <div style={{ 
                fontSize: '10pt', 
                color: '#e0e7ff',
                textAlign: 'center',
                maxWidth: '500px',
                lineHeight: '1.5'
              }}>
                Click the button below to open this route in Google Maps with turn-by-turn directions
              </div>
              
              <a 
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedTripForMap.from_address)}&destination=${encodeURIComponent(selectedTripForMap.to_address)}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '16px 32px',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12pt',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'inline-block'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                }}
              >
                🚗 Open Route in Google Maps
              </a>
              
              <div style={{ 
                fontSize: '8pt', 
                color: '#c7d2fe',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                Opens in a new tab with full interactive map and navigation
              </div>
            </div>
          </div>
        </div>
      )}
      </div> {/* Close form lock wrapper */}
    </div>
  );

  // Helper function to render trips table
  function renderTripsTable(trips: Trip[]) {
    if (trips.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: 'white' }}>
          No trips recorded for this period
        </div>
      );
    }

    const totalMiles = trips.reduce((sum, t) => sum + t.miles_calculated, 0);
    const totalAmount = trips.reduce((sum, t) => sum + (t.miles_calculated * 0.67), 0);

    return (
      <div style={{ 
        background: 'white', 
        border: '2px solid #cbd5e1',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1e40af', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '10pt' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '10pt' }}>From</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '10pt' }}>To</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '10pt' }}>Site/Purpose</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '10pt' }}>Miles</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '10pt' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '10pt' }}>Map</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, index) => (
              <tr key={trip.id} style={{ 
                borderBottom: '1px solid #e2e8f0',
                background: index % 2 === 0 ? '#f8fafc' : 'white'
              }}>
                <td style={{ padding: '12px', fontSize: '9pt' }}>
                  {new Date(trip.date).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', fontSize: '9pt' }}>
                  {trip.from_address.length > 40 
                    ? trip.from_address.substring(0, 40) + '...' 
                    : trip.from_address}
                </td>
                <td style={{ padding: '12px', fontSize: '9pt' }}>
                  {trip.to_address.length > 40 
                    ? trip.to_address.substring(0, 40) + '...' 
                    : trip.to_address}
                </td>
                <td style={{ padding: '12px', fontSize: '9pt' }}>
                  {trip.site_name || trip.purpose || '-'}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '9pt', fontWeight: 'bold' }}>
                  {trip.miles_calculated.toFixed(1)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '9pt', fontWeight: 'bold', color: '#16a34a' }}>
                  ${(trip.miles_calculated * 0.67).toFixed(2)}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setSelectedTripForMap(trip);
                      setShowTripMap(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '9pt'
                    }}
                  >
                    🗺️ View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#1e293b', color: 'white', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '12px', fontSize: '10pt' }}>
                TOTAL
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontSize: '10pt' }}>
                {totalMiles.toFixed(1)}
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontSize: '10pt' }}>
                ${totalAmount.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
}




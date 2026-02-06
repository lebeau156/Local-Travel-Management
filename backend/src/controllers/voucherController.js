const { db } = require('../models/database');
const { generateVoucherPDF } = require('../utils/pdfGenerator');
const { logActivity, getClientIp, ACTIONS } = require('../utils/auditLogger');
const emailService = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../debug.log');

function debugLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] CONTROLLER: ${message}\n`;
  console.log('CONTROLLER:', message);
  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (e) {
    console.error('Failed to write to log:', e.message);
  }
}

// Helper function to determine approval routing based on position
function getApprovalRoute(position) {
  const routes = {
    // Tier 1: Inspectors → FLS/SCSI → Fleet Manager
    'Food Inspector': {
      firstApprover: 'FLS',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['FLS', 'SCSI', 'DDM', 'DM'], // FLS preferred, but allow higher positions
      tier: 1
    },
    'CSI': {
      firstApprover: 'SCSI',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['FLS', 'SCSI', 'DDM', 'DM'], // SCSI preferred, but FLS/DDM/DM can also approve
      tier: 1
    },
    
    // Tier 2: Supervisors/Specialists
    // SCSI and SPHV report to FLS for their vouchers
    'SCSI': {
      firstApprover: 'FLS',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['FLS', 'DDM', 'DM'], // FLS preferred, but allow higher positions
      tier: 2
    },
    'SPHV': {
      firstApprover: 'FLS',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['FLS', 'DDM', 'DM'], // SPHV reports to FLS for their own vouchers
      tier: 2
    },
    // FLS reports to DDM
    'FLS': {
      firstApprover: 'DDM',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['DDM', 'DM'], // DDM preferred, but DM can also approve
      tier: 2
    },
    'EIAO': {
      firstApprover: 'DDM',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['DDM', 'DM'],
      tier: 2
    },
    'Resource Coordinator': {
      firstApprover: 'DDM',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['DDM', 'DM'],
      tier: 2
    },
    
    // Tier 3: DDM → DM → Fleet Manager
    'DDM': {
      firstApprover: 'DM',
      secondApprover: 'Fleet Manager',
      requiredPositions: ['DM'], // Only DM can approve DDM vouchers
      tier: 3
    },
    
    // Tier 4: DM → Fleet Manager (direct)
    'DM': {
      firstApprover: 'Fleet Manager',
      secondApprover: null,
      requiredPositions: [], // Goes directly to Fleet Manager
      tier: 4,
      skipSupervisorApproval: true
    }
  };
  
  // Default fallback for custom positions or "Other"
  return routes[position] || {
    firstApprover: 'Supervisor',
    secondApprover: 'Fleet Manager',
    requiredPositions: ['FLS', 'SCSI', 'DDM', 'DM'], // Allow any supervisor level
    tier: 1
  };
}

// Get all vouchers for the authenticated user
exports.getVouchers = (req, res) => {
  try {
    console.log('📄 getVouchers called - User ID:', req.user?.id, 'Role:', req.user?.role);
    let vouchers;
    
    if (req.user.role === 'fleet_manager' || req.user.role === 'admin') {
      // Fleet managers and admins see all vouchers
      vouchers = db.prepare(`
        SELECT v.*, 
               p.first_name, 
               p.last_name,
               p.middle_initial,
               (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as inspector_name,
               (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
        FROM vouchers v
        LEFT JOIN profiles p ON v.user_id = p.user_id
        ORDER BY v.year DESC, v.month DESC, v.created_at DESC
      `).all();
    } else {
      // ALL USERS (including supervisors) see ONLY their own personal vouchers
      // Supervisors use /vouchers/all to see their team's vouchers
      vouchers = db.prepare(`
        SELECT v.*, 
               (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
        FROM vouchers v
        WHERE v.user_id = ?
        ORDER BY v.year DESC, v.month DESC
      `).all(req.user.id);
    }

    console.log('📊 Vouchers found:', vouchers?.length || 0);
    res.json(vouchers);
  } catch (error) {
    console.error('❌ Error fetching vouchers:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch vouchers', details: error.message });
  }
};

// Get a single voucher with its trips
exports.getVoucher = (req, res) => {
  try {
    const { id } = req.params;
    console.log('📄 getVoucher called with ID:', id, '- User role:', req.user?.role);

    // Allow supervisors and fleet managers to view any voucher
    // Inspectors can only view their own vouchers
    let voucher;
    if (req.user.role === 'supervisor' || req.user.role === 'fleet_manager' || req.user.role === 'admin') {
      voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);
    } else {
      voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ? AND user_id = ?`).get(id, req.user.id);
    }

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    // Get trips associated with this voucher
    const trips = db.prepare(`
      SELECT t.* FROM trips t
      INNER JOIN voucher_trips vt ON t.id = vt.trip_id
      WHERE vt.voucher_id = ?
      ORDER BY t.date
    `).all(id);

    // Get the voucher owner's profile (not the logged-in user's profile)
    const profile = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(voucher.user_id);

    // Parse form_data to extract fleet manager signature info
    let formData = {};
    if (voucher.form_data) {
      try {
        formData = JSON.parse(voucher.form_data);
      } catch (e) {
        console.error('Error parsing form_data:', e);
      }
    }

    res.json({
      ...voucher,
      trips,
      profile,
      // Map database fields to frontend expected fields
      claimant_signature: voucher.employee_signature,
      claimant_signature_date: voucher.employee_signed_at,
      fleet_manager_signature: formData.fleet_manager_signature,
      fleet_manager_name: formData.fleet_manager_name,
      fleet_approved_at: formData.fleet_approved_at || voucher.fleet_approved_at
    });
  } catch (error) {
    console.error('Error fetching voucher:', error);
    res.status(500).json({ error: 'Failed to fetch voucher' });
  }
};

// Create a new voucher from monthly trips
exports.createVoucher = (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Check if voucher already exists for this month/year
    const existing = db.prepare(`
      SELECT id FROM vouchers 
      WHERE user_id = ? AND month = ? AND year = ?
    `).get(req.user.id, month, year);

    if (existing) {
      return res.status(400).json({ 
        error: 'A voucher already exists for this month and year',
        voucherId: existing.id
      });
    }

    // Get all trips for the specified month/year
    const trips = db.prepare(`
      SELECT * FROM trips 
      WHERE user_id = ? 
      AND strftime('%m', date) = ? 
      AND strftime('%Y', date) = ?
      ORDER BY date
    `).all(
      req.user.id,
      month.toString().padStart(2, '0'),
      year.toString()
    );

    if (trips.length === 0) {
      return res.status(400).json({ 
        error: 'No trips found for this month and year' 
      });
    }

    // Calculate totals
    const totalMiles = trips.reduce((sum, trip) => sum + trip.miles_calculated, 0);
    const totalLodging = trips.reduce((sum, trip) => sum + (trip.lodging_cost || 0), 0);
    const totalMeals = trips.reduce((sum, trip) => sum + (trip.meals_cost || 0), 0);
    const totalOther = trips.reduce((sum, trip) => sum + (trip.other_expenses || 0), 0);
    
    // Get mileage rate from profile or use default
    const profile = db.prepare('SELECT mileage_rate FROM profiles WHERE user_id = ?').get(req.user.id);
    const mileageRate = profile?.mileage_rate || 0.67;
    const mileageAmount = totalMiles * mileageRate;
    const totalAmount = mileageAmount + totalLodging + totalMeals + totalOther;

    // Create voucher
    const voucherResult = db.prepare(`
      INSERT INTO vouchers (
        user_id, month, year, status, total_miles, total_amount,
        total_lodging, total_meals, total_other
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)
    `).run(req.user.id, month, year, totalMiles, totalAmount, totalLodging, totalMeals, totalOther);

    const voucherId = voucherResult.lastInsertRowid;

    // Link trips to voucher
    const linkTrip = db.prepare(`
      INSERT INTO voucher_trips (voucher_id, trip_id) VALUES (?, ?)
    `);

    trips.forEach(trip => {
      linkTrip.run(voucherId, trip.id);
    });

    // Fetch the created voucher
    const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(voucherId);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.CREATE_VOUCHER,
      entityType: 'voucher',
      entityId: voucherId,
      details: { 
        month: month, 
        year: year, 
        tripCount: trips.length,
        totalMiles: totalMiles,
        totalAmount: totalAmount
      },
      ipAddress: getClientIp(req)
    });

    res.status(201).json({
      ...voucher,
      tripCount: trips.length
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({ error: 'Failed to create voucher' });
  }
};

// Submit voucher for approval
exports.submitVoucher = (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body; // All the form data from the travel voucher

    const voucher = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND user_id = ?
    `).get(id, req.user.id);

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (voucher.status !== 'draft') {
      let errorMessage = '';
      switch(voucher.status) {
        case 'submitted':
          errorMessage = 'This voucher has already been submitted and is awaiting approval. Vouchers can only be submitted once.';
          break;
        case 'approved':
          errorMessage = 'This voucher has already been approved. Approved vouchers cannot be resubmitted.';
          break;
        case 'rejected':
          errorMessage = 'This voucher was rejected. Please create a new voucher instead of resubmitting.';
          break;
        default:
          errorMessage = `This voucher is in '${voucher.status}' status and cannot be submitted. Only draft vouchers can be submitted.`;
      }
      return res.status(400).json({ 
        error: errorMessage
      });
    }

    // Get submitter's position from profile
    const profile = db.prepare(`
      SELECT position FROM profiles WHERE user_id = ?
    `).get(req.user.id);

    // Validate that position is set
    if (!profile || !profile.position) {
      return res.status(400).json({ 
        error: 'Please set your position in Profile Setup before submitting vouchers' 
      });
    }

    // Determine approval route based on position
    const approvalRoute = getApprovalRoute(profile.position);
    
    // Add approval route metadata to form data
    const enrichedFormData = {
      ...formData,
      submitter_position: profile.position,
      required_first_approver: approvalRoute.firstApprover,
      required_second_approver: approvalRoute.secondApprover,
      approval_tier: approvalRoute.tier
    };

    // Update voucher status and save form data
    db.prepare(`
      UPDATE vouchers 
      SET status = 'submitted', 
          submitted_at = CURRENT_TIMESTAMP,
          form_data = ?,
          employee_signature = ?,
          employee_signed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(enrichedFormData),
      formData.claimant_signature || null,
      id
    );

    const updated = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.SUBMIT_VOUCHER,
      entityType: 'voucher',
      entityId: id,
      details: { 
        status: 'submitted',
        totalAmount: updated.total_amount,
        position: profile.position,
        approvalRoute: approvalRoute.firstApprover
      },
      ipAddress: getClientIp(req)
    });

    // Send email notification to assigned supervisor
    const inspector = db.prepare('SELECT assigned_supervisor_id FROM users WHERE id = ?').get(req.user.id);
    if (inspector?.assigned_supervisor_id) {
      emailService.notifyVoucherSubmitted(id, req.user.id, inspector.assigned_supervisor_id)
        .catch(err => console.error('Email notification failed:', err));
    }

    res.json({
      ...updated,
      approvalRoute: {
        firstApprover: approvalRoute.firstApprover,
        secondApprover: approvalRoute.secondApprover,
        tier: approvalRoute.tier
      }
    });
  } catch (error) {
    console.error('Error submitting voucher:', error);
    res.status(500).json({ error: 'Failed to submit voucher' });
  }
};

// Delete a voucher (only if draft)
exports.deleteVoucher = (req, res) => {
  try {
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND user_id = ?
    `).get(id, req.user.id);

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (voucher.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Only draft vouchers can be deleted' 
      });
    }

    // Delete voucher (cascade will delete voucher_trips)
    db.prepare('DELETE FROM vouchers WHERE id = ?').run(id);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.DELETE_VOUCHER,
      entityType: 'voucher',
      entityId: id,
      details: { 
        month: voucher.month,
        year: voucher.year,
        totalAmount: voucher.total_amount 
      },
      ipAddress: getClientIp(req)
    });

    res.json({ message: 'Voucher deleted successfully' });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({ error: 'Failed to delete voucher' });
  }
};

// Reopen rejected voucher for editing
exports.reopenVoucher = (req, res) => {
  try {
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND user_id = ?
    `).get(id, req.user.id);

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (voucher.status !== 'rejected') {
      return res.status(400).json({ 
        error: 'Only rejected vouchers can be reopened' 
      });
    }

    // Reset voucher to draft status and clear approval data
    db.prepare(`
      UPDATE vouchers 
      SET status = 'draft', 
          submitted_at = NULL,
          supervisor_id = NULL,
          supervisor_approved_at = NULL,
          fleet_manager_id = NULL,
          fleet_approved_at = NULL
      WHERE id = ?
    `).run(id);

    const updated = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.REOPEN_VOUCHER,
      entityType: 'voucher',
      entityId: id,
      details: { 
        previousStatus: 'rejected',
        newStatus: 'draft',
        totalAmount: updated.total_amount 
      },
      ipAddress: getClientIp(req)
    });

    res.json(updated);
  } catch (error) {
    console.error('Error reopening voucher:', error);
    res.status(500).json({ error: 'Failed to reopen voucher' });
  }
};

// Download voucher as PDF
exports.downloadVoucherPDF = (req, res) => {
  console.log('📄 PDF download requested for voucher ID:', req.params.id);
  
  try {
    const { id } = req.params;

    // Get voucher - allow supervisors/fleet managers to download any voucher
    let voucher;
    if (req.user.role === 'supervisor' || req.user.role === 'fleet_manager' || req.user.role === 'admin') {
      voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);
    } else {
      voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ? AND user_id = ?`).get(id, req.user.id);
    }

    if (!voucher) {
      console.log('❌ Voucher not found:', id);
      return res.status(404).json({ error: 'Voucher not found' });
    }

    console.log('✅ Voucher found:', voucher.id);

    // Get trips
    const trips = db.prepare(`
      SELECT t.* FROM trips t
      INNER JOIN voucher_trips vt ON t.id = vt.trip_id
      WHERE vt.voucher_id = ?
      ORDER BY t.date
    `).all(id);

    console.log(`✅ Found ${trips.length} trips`);

    // Get the voucher owner's profile (not the logged-in user's profile)
    const profile = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(voucher.user_id);

    console.log('✅ Profile loaded');

    // Generate PDF
    console.log('📄 Generating PDF...');
    const doc = generateVoucherPDF({
      voucher,
      trips,
      profile: profile || {}
    });

    console.log('✅ PDF generated');

    // Set response headers
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const filename = `AD-616_${monthNames[voucher.month - 1]}_${voucher.year}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    console.log('✅ Sending PDF to client...');

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Get pending vouchers for supervisor (My Team + All Pending)
exports.getPendingVouchers = (req, res) => {
  try {
    const { tab = 'my-team' } = req.query;
    
    console.log('🔍 getPendingVouchers called - User:', req.user.id, 'Role:', req.user.role, 'Tab:', tab);

    // Verify user is supervisor or fleet manager
    if (req.user.role !== 'supervisor' && req.user.role !== 'fleet_manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let vouchers;

    if (req.user.role === 'supervisor') {
      // Get supervisor's position
      const supervisorProfile = db.prepare(`
        SELECT position FROM profiles WHERE user_id = ?
      `).get(req.user.id);

      const supervisorPosition = supervisorProfile?.position;

      if (tab === 'my-team') {
        // Get all submitted vouchers and filter based on position-based approval routing
        vouchers = db.prepare(`
          SELECT v.*, 
                 u.email as inspector_email,
                 p.first_name, p.last_name, p.office, p.position as submitter_position,
                 (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
          FROM vouchers v
          INNER JOIN users u ON v.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE v.status = 'submitted'
          ORDER BY v.submitted_at DESC
        `).all();

        console.log('📊 Total submitted vouchers:', vouchers.length);
        if (vouchers.length > 0) {
          console.log('📋 Sample voucher trip_count:', vouchers[0].trip_count);
          console.log('📋 Sample voucher keys:', Object.keys(vouchers[0]));
        }
        console.log('👤 Supervisor position:', supervisorPosition);

        // Filter based on position-based approval routing from form_data
        if (supervisorPosition) {
          vouchers = vouchers.filter(v => {
            // Parse form_data to get required_first_approver
            let requiredApprover = null;
            if (v.form_data) {
              try {
                const formData = JSON.parse(v.form_data);
                requiredApprover = formData.required_first_approver;
              } catch (e) {
                console.error('Error parsing form_data for voucher', v.id);
              }
            }
            console.log(`  Voucher ${v.id}: required=${requiredApprover}, supervisor=${supervisorPosition}, match=${requiredApprover === supervisorPosition}`);
            // Match supervisor's position with required approver
            return requiredApprover === supervisorPosition;
          });
        }
        
        console.log('✅ Filtered vouchers for supervisor:', vouchers.length);
      } else {
        // Get all submitted vouchers (backup coverage) that this supervisor can approve
        vouchers = db.prepare(`
          SELECT v.*, 
                 u.email as inspector_email,
                 p.first_name, p.last_name, p.office, p.position as submitter_position,
                 (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
          FROM vouchers v
          INNER JOIN users u ON v.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE v.status = 'submitted'
          ORDER BY v.submitted_at DESC
        `).all();

        // Filter based on position-based approval routing
        if (supervisorPosition) {
          vouchers = vouchers.filter(v => {
            // Parse form_data to get required_first_approver
            let requiredApprover = null;
            if (v.form_data) {
              try {
                const formData = JSON.parse(v.form_data);
                requiredApprover = formData.required_first_approver;
              } catch (e) {
                console.error('Error parsing form_data for voucher', v.id);
              }
            }
            // Match supervisor's position with required approver
            return requiredApprover === supervisorPosition;
          });
        }
      }
    } else if (req.user.role === 'fleet_manager') {
      // Fleet manager sees supervisor-approved vouchers
      vouchers = db.prepare(`
        SELECT v.*, 
               u.email as inspector_email,
               p.first_name, p.last_name, p.office, p.position as submitter_position,
               sp.first_name as supervisor_first_name, 
               sp.last_name as supervisor_last_name,
               (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
        FROM vouchers v
        INNER JOIN users u ON v.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN users su ON v.supervisor_id = su.id
        LEFT JOIN profiles sp ON su.id = sp.user_id
        WHERE v.status = 'supervisor_approved'
        ORDER BY v.supervisor_approved_at DESC
      `).all();
    }

    res.json(vouchers);
  } catch (error) {
    console.error('Error fetching pending vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch pending vouchers' });
  }
};

// Supervisor approves a voucher
exports.approveVoucherAsSupervisor = async (req, res) => {
  console.log('📝 Supervisor approval request:', { voucherId: req.params.id, user: req.user.id });
  
  try {
    const { id } = req.params;
    const { comments } = req.body || {}; // Handle empty body

    // Verify user is supervisor
    if (req.user.role !== 'supervisor') {
      console.log('❌ User is not supervisor:', req.user.role);
      return res.status(403).json({ error: 'Only supervisors can perform this action' });
    }

    console.log('✅ User verification passed');

    // Get voucher with submitter's position
    const voucher = db.prepare(`
      SELECT v.*, u.assigned_supervisor_id, p.position as submitter_position
      FROM vouchers v
      INNER JOIN users u ON v.user_id = u.id
      LEFT JOIN profiles p ON v.user_id = p.user_id
      WHERE v.id = ?
    `).get(id);
    
    console.log('📄 Voucher retrieved:', voucher ? voucher.id : 'not found');

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (voucher.status !== 'submitted') {
      console.log('❌ Invalid status:', voucher.status);
      return res.status(400).json({ error: 'Only submitted vouchers can be approved' });
    }

    // Get approver's position from profile
    const approverProfile = db.prepare(`
      SELECT position, first_name, last_name, middle_initial 
      FROM profiles 
      WHERE user_id = ?
    `).get(req.user.id);

    if (!approverProfile || !approverProfile.position) {
      return res.status(400).json({ 
        error: 'Approver must have a position set in their profile' 
      });
    }

    // Get approval route based on submitter's position
    const approvalRoute = getApprovalRoute(voucher.submitter_position);
    
    // Validate: Is this person authorized to approve based on their position?
    if (!approvalRoute.requiredPositions.includes(approverProfile.position)) {
      console.log('❌ Position mismatch:', {
        approverPosition: approverProfile.position,
        requiredPositions: approvalRoute.requiredPositions
      });
      return res.status(403).json({ 
        error: `Only ${approvalRoute.requiredPositions.join(' or ')} can approve vouchers from ${voucher.submitter_position || 'this position'}. You are: ${approverProfile.position}` 
      });
    }

    console.log('✅ Position validation passed:', approverProfile.position);
    console.log('💾 Updating voucher status...');
    
    const supervisorName = `${approverProfile.first_name} ${approverProfile.middle_initial ? approverProfile.middle_initial + '. ' : ''}${approverProfile.last_name}`.trim();
    
    console.log('Supervisor name:', supervisorName);
    
    // Create digital signature timestamp with Eastern timezone
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
    
    // Update voucher status with supervisor signature
    const updateStmt = db.prepare(`
      UPDATE vouchers 
      SET status = 'supervisor_approved', 
          supervisor_id = ?,
          supervisor_approved_at = CURRENT_TIMESTAMP,
          approver_signature = ?,
          approver_signed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const signatureText = `Digitally signed by ${supervisorName} (${approverProfile.position}) on ${timestamp}`;
    updateStmt.run(req.user.id, signatureText, id);
    console.log('✅ Voucher updated');

    const updated = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
    console.log('✅ Updated voucher retrieved:', updated.id);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.APPROVE_VOUCHER_SUPERVISOR,
      entityType: 'voucher',
      entityId: id,
      details: { 
        status: 'supervisor_approved',
        totalAmount: updated.total_amount,
        voucherUserId: updated.user_id,
        approverPosition: approverProfile.position,
        submitterPosition: voucher.submitter_position
      },
      ipAddress: getClientIp(req)
    });

    // Send email notification to fleet managers
    emailService.notifySupervisorApproved(id, voucher.user_id, req.user.id)
      .catch(err => console.error('Email notification failed:', err));

    console.log('📤 Sending response...');
    res.status(200).json(updated);
    console.log('✅ Response sent successfully');
  } catch (error) {
    console.error('❌ Error approving voucher as supervisor:', error);
    console.error('Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to approve voucher', details: error.message });
    }
  }
};

// Fleet Manager approves a voucher (final approval)
exports.approveVoucherAsFleetManager = async (req, res) => {
  try {
    debugLog('=== FLEET APPROVAL FUNCTION ENTRY ===');
    debugLog('Fleet approval START - ID: ' + req.params.id);
    debugLog('User: ' + (req.user ? req.user.id : 'undefined'));
    console.log('Fleet manager approval request:', { voucherId: req.params.id, user: req.user });
  
    debugLog('Step 1: Extracting parameters');
    const { id } = req.params;
    const { comments, fleet_manager_name, fleet_manager_phone, fleet_approved_date } = req.body || {};

    debugLog('Step 2: Verifying user role');
    // Verify user is fleet manager
    if (req.user.role !== 'fleet_manager') {
      debugLog('ERROR: User is not fleet manager: ' + req.user.role);
      console.log('User is not fleet manager:', req.user.role);
      return res.status(403).json({ error: 'Only fleet managers can perform this action' });
    }

    debugLog('SUCCESS: User verification passed');
    console.log('User verification passed');

    debugLog('Step 3: Querying voucher from database');
    // Get voucher
    const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
    debugLog('Voucher retrieved: ' + (voucher ? voucher.id : 'not found'));
    console.log('Voucher retrieved:', voucher ? voucher.id : 'not found');

    if (!voucher) {
      debugLog('ERROR: Voucher not found');
      return res.status(404).json({ error: 'Voucher not found' });
    }

    debugLog('Step 4: Checking voucher status: ' + voucher.status);
    if (voucher.status !== 'supervisor_approved') {
      debugLog('ERROR: Invalid status: ' + voucher.status);
      console.log('Invalid status:', voucher.status);
      return res.status(400).json({ error: 'Only supervisor-approved vouchers can be approved by fleet manager' });
    }

    debugLog('Step 5: Using provided fleet manager info or getting from profile');
    // Use provided name and phone from frontend, or get from profile as fallback
    let fleetManagerNameToUse = fleet_manager_name;
    let fleetManagerPhoneToUse = fleet_manager_phone;
    
    if (!fleetManagerNameToUse) {
      const fleetManagerProfile = db.prepare(`
        SELECT first_name, last_name, middle_initial 
        FROM profiles 
        WHERE user_id = ?
      `).get(req.user.id);
      
      fleetManagerNameToUse = fleetManagerProfile 
        ? `${fleetManagerProfile.first_name} ${fleetManagerProfile.middle_initial ? fleetManagerProfile.middle_initial + '. ' : ''}${fleetManagerProfile.last_name}`.trim()
        : 'Fleet Manager';
    }
    
    debugLog('Fleet manager name: ' + fleetManagerNameToUse);
    console.log('Fleet manager name:', fleetManagerNameToUse);
    console.log('Fleet manager phone:', fleetManagerPhoneToUse);
    
    // Create digital signature timestamp with Eastern timezone
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
    const signatureText = `Digitally signed by ${fleetManagerNameToUse} on ${timestamp}`;
    
    debugLog('Signature text: ' + signatureText);
    console.log('Signature text:', signatureText);

    debugLog('Step 6: Updating form_data with fleet manager info');
    // Get current form_data and add fleet manager info
    const currentFormData = voucher.form_data ? JSON.parse(voucher.form_data) : {};
    currentFormData.fleet_manager_signature = signatureText;
    currentFormData.fleet_manager_name = fleetManagerNameToUse;
    currentFormData.fleet_manager_phone = fleetManagerPhoneToUse || '';
    currentFormData.fleet_approved_at = fleet_approved_date || timestamp;
    
    debugLog('Step 7: Updating voucher status...');
    console.log('Updating voucher status...');
    
    // Update voucher status
    const updateStmt = db.prepare(`
      UPDATE vouchers 
      SET status = 'approved', 
          fleet_manager_id = ?,
          fleet_approved_at = CURRENT_TIMESTAMP,
          form_data = ?
      WHERE id = ?
    `);
    
    debugLog('Step 8: Running update statement');
    updateStmt.run(req.user.id, JSON.stringify(currentFormData), id);
    debugLog('SUCCESS: Voucher updated');
    console.log('Voucher updated');

    debugLog('Step 9: Retrieving updated voucher');
    const updated = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
    debugLog('SUCCESS: Updated voucher retrieved: ' + updated.id);
    console.log('Updated voucher retrieved:', updated.id);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.APPROVE_VOUCHER_FLEET,
      entityType: 'voucher',
      entityId: id,
      details: { 
        status: 'approved',
        totalAmount: updated.total_amount,
        voucherUserId: updated.user_id,
        supervisorId: updated.supervisor_id
      },
      ipAddress: getClientIp(req)
    });

    // Send email notification to inspector and supervisor
    emailService.notifyVoucherApproved(id, voucher.user_id, voucher.supervisor_id, req.user.id)
      .catch(err => console.error('Email notification failed:', err));

    debugLog('Step 8: Sending response...');
    console.log('Sending response...');
    const response = { ...updated };
    res.status(200).json(response);
    debugLog('SUCCESS: Response sent successfully');
    console.log('Response sent successfully');
  } catch (error) {
    debugLog('ERROR CAUGHT: ' + error.message);
    debugLog('Stack: ' + error.stack);
    console.error('Error approving voucher as fleet manager:', error);
    console.error('Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to approve voucher', details: error.message });
    }
  }
};

// Reject a voucher (supervisor or fleet manager)
exports.rejectVoucher = (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Verify user is supervisor or fleet manager
    if (req.user.role !== 'supervisor' && req.user.role !== 'fleet_manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get voucher
    const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    // Verify status
    if (req.user.role === 'supervisor' && voucher.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted vouchers can be rejected by supervisors' });
    }

    if (req.user.role === 'fleet_manager' && voucher.status !== 'supervisor_approved') {
      return res.status(400).json({ error: 'Only supervisor-approved vouchers can be rejected by fleet managers' });
    }

    // Update voucher status
    db.prepare(`
      UPDATE vouchers 
      SET status = 'rejected', 
          rejection_reason = ?
      WHERE id = ?
    `).run(reason, id);

    const updated = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.REJECT_VOUCHER,
      entityType: 'voucher',
      entityId: id,
      details: { 
        status: 'rejected',
        reason: reason,
        rejectedBy: req.user.role,
        totalAmount: updated.total_amount,
        voucherUserId: updated.user_id
      },
      ipAddress: getClientIp(req)
    });

    // Send email notification to inspector
    emailService.notifyVoucherRejected(id, voucher.user_id, req.user.id)
      .catch(err => console.error('Email notification failed:', err));

    res.json(updated);
  } catch (error) {
    console.error('Error rejecting voucher:', error);
    res.status(500).json({ error: 'Failed to reject voucher' });
  }
};

// Get all vouchers (for admins/fleet managers)
exports.getAllVouchers = (req, res) => {
  try {
    // Allow supervisors, fleet managers and admins
    if (req.user.role !== 'supervisor' && req.user.role !== 'fleet_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Build query with filters
    let query = `
      SELECT v.*, 
             p.first_name, 
             p.last_name,
             p.middle_initial,
             p.state,
             p.circuit,
             (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as inspector_name
      FROM vouchers v
      LEFT JOIN profiles p ON v.user_id = p.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // For supervisors, only show vouchers from their assigned inspectors
    if (req.user.role === 'supervisor') {
      const assignedInspectors = db.prepare(`
        SELECT user_id FROM profiles WHERE supervisor_id = ?
      `).all(req.user.id);
      
      if (assignedInspectors.length === 0) {
        return res.json([]);
      }
      
      const inspectorIds = assignedInspectors.map(i => i.user_id);
      const placeholders = inspectorIds.map(() => '?').join(',');
      query += ` AND v.user_id IN (${placeholders})`;
      params.push(...inspectorIds);
    }
    
    // Apply filters from query parameters
    if (req.query.inspector_id) {
      query += ` AND v.user_id = ?`;
      params.push(req.query.inspector_id);
    }
    
    if (req.query.status) {
      query += ` AND v.status = ?`;
      params.push(req.query.status);
    }
    
    if (req.query.year) {
      query += ` AND v.year = ?`;
      params.push(parseInt(req.query.year));
    }
    
    if (req.query.month) {
      query += ` AND v.month = ?`;
      params.push(parseInt(req.query.month));
    }
    
    if (req.query.state) {
      query += ` AND p.state = ?`;
      params.push(req.query.state);
    }
    
    if (req.query.circuit) {
      query += ` AND p.circuit = ?`;
      params.push(req.query.circuit);
    }
    
    query += ` ORDER BY v.year DESC, v.month DESC, v.created_at DESC`;
    
    const vouchers = db.prepare(query).all(...params);

    res.json(vouchers);
  } catch (error) {
    console.error('Error fetching all vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch vouchers' });
  }
};

// Get list of inspectors for filtering (supervisors see assigned inspectors, fleet managers see all)
exports.getInspectors = (req, res) => {
  try {
    // Allow supervisors, fleet managers and admins
    if (req.user.role !== 'supervisor' && req.user.role !== 'fleet_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let inspectors;
    
    if (req.user.role === 'supervisor') {
      // Supervisors only see inspectors assigned to them
      inspectors = db.prepare(`
        SELECT DISTINCT 
          p.user_id,
          p.first_name,
          p.last_name,
          p.middle_initial,
          p.state,
          p.circuit,
          (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
        FROM profiles p
        WHERE p.supervisor_id = ?
        ORDER BY p.last_name, p.first_name
      `).all(req.user.id);
    } else {
      // Fleet managers and admins see all inspectors
      inspectors = db.prepare(`
        SELECT DISTINCT 
          p.user_id,
          p.first_name,
          p.last_name,
          p.middle_initial,
          p.state,
          p.circuit,
          (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
        FROM profiles p
        INNER JOIN users u ON p.user_id = u.id
        WHERE u.role = 'inspector'
        ORDER BY p.last_name, p.first_name
      `).all();
    }

    res.json(inspectors);
  } catch (error) {
    console.error('Error fetching inspectors:', error);
    res.status(500).json({ error: 'Failed to fetch inspectors' });
  }
};

// Get vouchers pending fleet manager approval
exports.getPendingFleetVouchers = (req, res) => {
  console.log('🚙 getPendingFleetVouchers called! User role:', req.user?.role);
  
  try {
    // Only allow fleet managers
    if (req.user.role !== 'fleet_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const vouchers = db.prepare(`
      SELECT v.*, 
             p.first_name, 
             p.last_name,
             p.middle_initial
      FROM vouchers v
      LEFT JOIN profiles p ON v.user_id = p.user_id
      WHERE v.status = 'supervisor_approved'
      ORDER BY v.created_at ASC
    `).all();

    console.log('✅ Found', vouchers.length, 'pending fleet vouchers');
    res.json(vouchers);
  } catch (error) {
    console.error('Error fetching pending fleet vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch pending vouchers' });
  }
};

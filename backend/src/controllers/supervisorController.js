const { db } = require('../models/database');

// Get available supervisors based on user's position
exports.getAvailableSupervisors = (req, res) => {
  try {
    const userProfile = db.prepare(`
      SELECT position FROM profiles WHERE user_id = ?
    `).get(req.user.id);

    if (!userProfile || !userProfile.position) {
      return res.json([]);
    }

    const position = userProfile.position;
    let supervisorPositions = [];

    // Determine which supervisor positions this user should select from
    const supervisorMap = {
      'Food Inspector': ['FLS'],
      'CSI': ['SCSI'],
      'SPHV': ['FLS'], // Supervisor Public Health Veterinarian reports to FLS
      'FLS': ['DDM'],
      'SCSI': ['FLS', 'DDM'], // SCSI can report to FLS or DDM
      'EIAO': ['DDM'],
      'Resource Coordinator': ['DDM'],
      'DDM': ['DM'],
      'DM': [] // DM doesn't need a supervisor
    };

    supervisorPositions = supervisorMap[position] || [];

    if (supervisorPositions.length === 0) {
      return res.json([]);
    }

    // Build query to find users with these positions
    const placeholders = supervisorPositions.map(() => '?').join(',');
    const supervisors = db.prepare(`
      SELECT 
        u.id,
        u.email,
        p.first_name,
        p.last_name,
        p.middle_initial,
        p.position,
        (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE p.position IN (${placeholders})
      AND u.role = 'supervisor'
      AND u.id != ?
      ORDER BY p.last_name, p.first_name
    `).all(...supervisorPositions, req.user.id);

    res.json(supervisors);
  } catch (error) {
    console.error('Error fetching available supervisors:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
};

// Get subordinates (for FLS/SCSI/DDM to manage their team)
exports.getSubordinates = (req, res) => {
  try {
    // Get supervisor's position
    const supervisorProfile = db.prepare(`
      SELECT position FROM profiles WHERE user_id = ?
    `).get(req.user.id);

    if (!supervisorProfile || !supervisorProfile.position) {
      return res.json([]);
    }

    const position = supervisorProfile.position.toUpperCase();

    let subordinates = [];

    // If SCSI supervisor, get all CSIs who have this SCSI as their supervisor_id in profiles
    if (position.includes('SCSI')) {
      subordinates = db.prepare(`
        SELECT 
          u.id,
          u.email,
          u.role,
          p.supervisor_id as assigned_supervisor_id,
          p.first_name,
          p.last_name,
          p.middle_initial,
          p.position,
          p.state,
          p.circuit,
          p.hire_date,
          p.phone,
          p.employee_id,
          (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name,
          CAST((julianday('now') - julianday(p.hire_date)) / 365.25 AS INTEGER) as years_of_service,
          CAST(((julianday('now') - julianday(p.hire_date)) / 30.44) % 12 AS INTEGER) as months_of_service,
          (sp.first_name || ' ' || COALESCE(sp.middle_initial || '. ', '') || sp.last_name) as assigned_supervisor_name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN users su ON p.supervisor_id = su.id
        LEFT JOIN profiles sp ON su.id = sp.user_id
        WHERE p.supervisor_id = ?
        ORDER BY p.hire_date ASC, p.last_name, p.first_name
      `).all(req.user.id);
    } else {
      // For FLS/DDM, get all users where the FLS is the assigned_supervisor (team members under this FLS)
      // Include their SCSI supervisor assignment if they have one (stored in profiles.supervisor_id)
      subordinates = db.prepare(`
        SELECT 
          u.id,
          u.email,
          u.role,
          p.supervisor_id as assigned_supervisor_id,
          p.first_name,
          p.last_name,
          p.middle_initial,
          p.position,
          p.state,
          p.circuit,
          p.hire_date,
          p.phone,
          p.employee_id,
          (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name,
          CAST((julianday('now') - julianday(p.hire_date)) / 365.25 AS INTEGER) as years_of_service,
          CAST(((julianday('now') - julianday(p.hire_date)) / 30.44) % 12 AS INTEGER) as months_of_service,
          (sp.first_name || ' ' || COALESCE(sp.middle_initial || '. ', '') || sp.last_name) as assigned_supervisor_name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN users su ON p.supervisor_id = su.id
        LEFT JOIN profiles sp ON su.id = sp.user_id
        WHERE u.assigned_supervisor_id = ?
        ORDER BY p.hire_date ASC, p.last_name, p.first_name
      `).all(req.user.id);
    }

    res.json(subordinates);
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    res.status(500).json({ error: 'Failed to fetch subordinates' });
  }
};

// Assign subordinate to supervisor (for FLS/DDM user management)
exports.assignSubordinate = (req, res) => {
  try {
    const { user_id, supervisor_id } = req.body;

    // Verify the requesting user is a supervisor
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only supervisors can assign subordinates' });
    }

    // Get requesting user's position
    const requestingUser = db.prepare(`
      SELECT p.position
      FROM profiles p
      WHERE p.user_id = ?
    `).get(req.user.id);

    // Only FLS (First Line Supervisor) and admins can directly assign subordinates
    // SCSI and PHV must use the request reassignment workflow
    const allowedPositions = ['FLS', 'First Line Supervisor', 'DDM', 'DM'];
    if (req.user.role !== 'admin' && (!requestingUser || !allowedPositions.includes(requestingUser.position))) {
      return res.status(403).json({ 
        error: 'Only FLS and higher positions can directly assign inspectors. SCSI and PHV supervisors must use the Request Reassignment workflow.' 
      });
    }

    // Verify supervisor_id is valid
    const supervisor = db.prepare(`
      SELECT u.id, u.role, p.position
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(supervisor_id);

    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(400).json({ error: 'Invalid supervisor ID' });
    }

    // Update user's assigned supervisor
    db.prepare(`
      UPDATE users SET assigned_supervisor_id = ? WHERE id = ?
    `).run(supervisor_id, user_id);

    // Also update profiles.supervisor_id for consistency
    db.prepare(`
      UPDATE profiles SET supervisor_id = ? WHERE user_id = ?
    `).run(supervisor_id, user_id);

    res.json({ message: 'Subordinate assigned successfully' });
  } catch (error) {
    console.error('Error assigning subordinate:', error);
    res.status(500).json({ error: 'Failed to assign subordinate' });
  }
};

// Update user's assigned supervisor (for profile setup)
exports.updateAssignedSupervisor = (req, res) => {
  try {
    const { supervisor_id } = req.body;

    // Update user's assigned supervisor
    db.prepare(`
      UPDATE users SET assigned_supervisor_id = ? WHERE id = ?
    `).run(supervisor_id || null, req.user.id);

    // Also update profiles.supervisor_id for consistency
    db.prepare(`
      UPDATE profiles SET supervisor_id = ? WHERE user_id = ?
    `).run(supervisor_id || null, req.user.id);

    res.json({ message: 'Supervisor assigned successfully' });
  } catch (error) {
    console.error('Error updating assigned supervisor:', error);
    res.status(500).json({ error: 'Failed to update supervisor' });
  }
};

// Get available FLS supervisors (for profile setup)
exports.getAvailableFlsSupervisors = (req, res) => {
  try {
    console.log('Fetching available FLS supervisors...');
    
    // Get current user's position to determine which supervisors to show
    const userProfile = db.prepare(`
      SELECT position FROM profiles WHERE user_id = ?
    `).get(req.user.id);

    if (!userProfile || !userProfile.position) {
      return res.json([]);
    }

    const position = userProfile.position.toUpperCase();
    let targetPosition = '';

    // Determine which supervisor position to fetch based on user's position
    if (position.includes('SCSI') || position.includes('PHV')) {
      targetPosition = 'FLS'; // SCSI and PHV report to FLS
    } else if (position.includes('FLS')) {
      targetPosition = 'DDM'; // FLS reports to DDM
    } else if (position.includes('DDM')) {
      targetPosition = 'DM'; // DDM reports to DM
    } else {
      targetPosition = 'FLS'; // Default to FLS for other positions
    }

    console.log(`User position: ${position}, looking for: ${targetPosition}`);
    
    // Get all users with the target position
    const supervisors = db.prepare(`
      SELECT 
        u.id,
        u.email,
        p.first_name,
        p.last_name,
        p.middle_initial,
        p.position,
        (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE p.position = ?
      AND u.role = 'supervisor'
      AND u.id != ?
      ORDER BY p.last_name, p.first_name
    `).all(targetPosition, req.user.id);

    console.log(`${targetPosition} supervisors found:`, supervisors.length);
    res.json(supervisors);
  } catch (error) {
    console.error('Error fetching available FLS supervisors:', error);
    res.status(500).json({ error: 'Failed to fetch FLS supervisors' });
  }
};

// Update user's FLS supervisor (for profile setup)
exports.updateFlsSupervisor = (req, res) => {
  try {
    const { fls_supervisor_id } = req.body;

    console.log('Updating FLS supervisor for user:', req.user.id, 'to:', fls_supervisor_id);

    // Update user's FLS supervisor
    db.prepare(`
      UPDATE users SET fls_supervisor_id = ? WHERE id = ?
    `).run(fls_supervisor_id || null, req.user.id);

    res.json({ message: 'FLS supervisor assigned successfully' });
  } catch (error) {
    console.error('Error updating FLS supervisor:', error);
    res.status(500).json({ error: 'Failed to update FLS supervisor' });
  }
};

// Get all inspectors (for SCSI supervisors)
exports.getAllInspectors = (req, res) => {
  try {
    // SCSI supervisors can see all inspectors
    const inspectors = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.role,
        p.first_name,
        p.last_name,
        p.middle_initial,
        p.position,
        p.state,
        p.circuit,
        p.supervisor_id as assigned_supervisor_id,
        (
          SELECT (sp.first_name || ' ' || sp.last_name)
          FROM profiles sp
          WHERE sp.user_id = p.supervisor_id
        ) as assigned_supervisor_name,
        (
          SELECT COUNT(*)
          FROM vouchers v
          WHERE v.user_id = u.id 
          AND v.status = 'submitted'
        ) as pending_vouchers
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'inspector'
      ORDER BY p.first_name, p.last_name
    `).all();

    res.json(inspectors);
  } catch (error) {
    console.error('Error fetching all inspectors:', error);
    res.status(500).json({ error: 'Failed to fetch inspectors' });
  }
};

// Request assignment of a CSI (SCSI requests FLS to assign CSI to them)
exports.requestAssignment = (req, res) => {
  try {
    const { inspectorId } = req.params;
    const { reason } = req.body;
    const scsiUserId = req.user.id;
    
    // Get inspector details
    const inspector = db.prepare(`
      SELECT u.email, p.first_name, p.last_name, p.position
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(inspectorId);
    
    if (!inspector) {
      return res.status(404).json({ error: 'Inspector not found' });
    }
    
    // Check if there's already a pending request for this inspector
    const existingRequest = db.prepare(`
      SELECT id FROM assignment_requests
      WHERE inspector_id = ? AND requesting_supervisor_id = ? AND status = 'pending'
    `).get(inspectorId, scsiUserId);
    
    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request for this inspector' });
    }
    
    // Create assignment request record (stays PENDING until FLS approves)
    const requestResult = db.prepare(`
      INSERT INTO assignment_requests 
      (inspector_id, requesting_supervisor_id, status, reason)
      VALUES (?, ?, 'pending', ?)
    `).run(inspectorId, scsiUserId, reason || null);
    
    res.json({ 
      message: `Assignment request for ${inspector.first_name} ${inspector.last_name} has been sent to FLS for approval.`,
      requestId: requestResult.lastInsertRowid,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error requesting assignment:', error);
    res.status(500).json({ error: 'Failed to request assignment' });
  }
};

// Get assignment requests (for viewing history and pending requests)
exports.getAssignmentRequests = (req, res) => {
  try {
    const { status } = req.query; // Filter by status: pending, approved, rejected
    const userId = req.user.id;
    
    let query = `
      SELECT 
        ar.id,
        ar.inspector_id,
        ar.requesting_supervisor_id,
        ar.requested_at,
        ar.status,
        ar.processed_at,
        ar.processed_by,
        ar.notes,
        i.email as inspector_email,
        ip.first_name as inspector_first_name,
        ip.last_name as inspector_last_name,
        ip.position as inspector_position,
        rs.email as requesting_supervisor_email,
        rsp.first_name as requesting_supervisor_first_name,
        rsp.last_name as requesting_supervisor_last_name,
        pb.email as processed_by_email,
        pbp.first_name as processed_by_first_name,
        pbp.last_name as processed_by_last_name
      FROM assignment_requests ar
      LEFT JOIN users i ON ar.inspector_id = i.id
      LEFT JOIN profiles ip ON i.id = ip.user_id
      LEFT JOIN users rs ON ar.requesting_supervisor_id = rs.id
      LEFT JOIN profiles rsp ON rs.id = rsp.user_id
      LEFT JOIN users pb ON ar.processed_by = pb.id
      LEFT JOIN profiles pbp ON pb.id = pbp.user_id
      WHERE ar.requesting_supervisor_id = ?
    `;
    
    const params = [userId];
    
    if (status) {
      query += ` AND ar.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY ar.requested_at DESC`;
    
    const requests = db.prepare(query).all(...params);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching assignment requests:', error);
    res.status(500).json({ error: 'Failed to fetch assignment requests' });
  }
};

// Get all pending assignment requests (for FLS to review)
exports.getPendingAssignmentRequests = (req, res) => {
  try {
    const { status } = req.query; // Optional: filter by status
    
    let query = `
      SELECT 
        ar.id,
        ar.inspector_id,
        ar.requesting_supervisor_id,
        ar.requested_at,
        ar.status,
        ar.processed_at,
        ar.processed_by,
        ar.notes,
        ar.reason,
        ar.cancel_reason,
        i.email as inspector_email,
        ip.first_name as inspector_first_name,
        ip.last_name as inspector_last_name,
        ip.position as inspector_position,
        ip.state as inspector_state,
        ip.circuit as inspector_circuit,
        ip.supervisor_id as current_supervisor_id,
        cs.email as current_supervisor_email,
        csp.first_name as current_supervisor_first_name,
        csp.last_name as current_supervisor_last_name,
        rs.email as requesting_supervisor_email,
        rsp.first_name as requesting_supervisor_first_name,
        rsp.last_name as requesting_supervisor_last_name,
        rsp.position as requesting_supervisor_position,
        pb.email as processed_by_email,
        pbp.first_name as processed_by_first_name,
        pbp.last_name as processed_by_last_name
      FROM assignment_requests ar
      LEFT JOIN users i ON ar.inspector_id = i.id
      LEFT JOIN profiles ip ON i.id = ip.user_id
      LEFT JOIN users cs ON ip.supervisor_id = cs.id
      LEFT JOIN profiles csp ON cs.id = csp.user_id
      LEFT JOIN users rs ON ar.requesting_supervisor_id = rs.id
      LEFT JOIN profiles rsp ON rs.id = rsp.user_id
      LEFT JOIN users pb ON ar.processed_by = pb.id
      LEFT JOIN profiles pbp ON pb.id = pbp.user_id
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE ar.status = ?`;
      params.push(status);
    } else {
      // Default: show only pending requests
      query += ` WHERE ar.status = 'pending'`;
    }
    
    query += ` ORDER BY ar.requested_at DESC`;
    
    const requests = db.prepare(query).all(...params);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending assignment requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending assignment requests' });
  }
};

// Approve assignment request (FLS action)
exports.approveAssignmentRequest = (req, res) => {
  try {
    const { requestId } = req.params;
    const flsUserId = req.user.id;
    const { notes } = req.body;
    
    // Get request details
    const request = db.prepare(`
      SELECT ar.*, i.email as inspector_email, ip.first_name, ip.last_name
      FROM assignment_requests ar
      LEFT JOIN users i ON ar.inspector_id = i.id
      LEFT JOIN profiles ip ON i.id = ip.user_id
      WHERE ar.id = ?
    `).get(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Assignment request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }
    
    // Assign inspector to the requesting supervisor
    db.prepare(`
      UPDATE profiles
      SET supervisor_id = ?
      WHERE user_id = ?
    `).run(request.requesting_supervisor_id, request.inspector_id);
    
    // Update request status to approved
    db.prepare(`
      UPDATE assignment_requests
      SET status = 'approved', 
          processed_at = CURRENT_TIMESTAMP, 
          processed_by = ?,
          notes = ?
      WHERE id = ?
    `).run(flsUserId, notes || null, requestId);
    
    res.json({ 
      message: `${request.first_name} ${request.last_name} has been assigned successfully!`,
      request_id: requestId,
      status: 'approved'
    });
  } catch (error) {
    console.error('Error approving assignment request:', error);
    res.status(500).json({ error: 'Failed to approve assignment request' });
  }
};

// Reject assignment request (FLS action)
exports.rejectAssignmentRequest = (req, res) => {
  try {
    const { requestId } = req.params;
    const flsUserId = req.user.id;
    const { notes } = req.body;
    
    // Get request details
    const request = db.prepare(`
      SELECT ar.*, i.email as inspector_email, ip.first_name, ip.last_name
      FROM assignment_requests ar
      LEFT JOIN users i ON ar.inspector_id = i.id
      LEFT JOIN profiles ip ON i.id = ip.user_id
      WHERE ar.id = ?
    `).get(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Assignment request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }
    
    // Update request status to rejected (do NOT assign inspector)
    db.prepare(`
      UPDATE assignment_requests
      SET status = 'rejected', 
          processed_at = CURRENT_TIMESTAMP, 
          processed_by = ?,
          notes = ?
      WHERE id = ?
    `).run(flsUserId, notes || null, requestId);
    
    res.json({ 
      message: `Assignment request for ${request.first_name} ${request.last_name} has been rejected.`,
      request_id: requestId,
      status: 'rejected'
    });
  } catch (error) {
    console.error('Error rejecting assignment request:', error);
    res.status(500).json({ error: 'Failed to reject assignment request' });
  }
};

// Cancel assignment request (SCSI can cancel their own pending request)
exports.cancelAssignmentRequest = (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const scsiUserId = req.user.id;
    
    // Get request details and verify ownership
    const request = db.prepare(`
      SELECT ar.*, 
             ip.first_name, 
             ip.last_name
      FROM assignment_requests ar
      LEFT JOIN users i ON ar.inspector_id = i.id
      LEFT JOIN profiles ip ON i.id = ip.user_id
      WHERE ar.id = ?
    `).get(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Assignment request not found' });
    }
    
    // Verify the requesting supervisor is the one trying to cancel
    if (request.requesting_supervisor_id !== scsiUserId) {
      return res.status(403).json({ error: 'You can only cancel your own requests' });
    }
    
    // Only allow canceling pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }
    
    // Update request status to canceled
    db.prepare(`
      UPDATE assignment_requests
      SET status = 'canceled', 
          processed_at = CURRENT_TIMESTAMP, 
          processed_by = ?,
          cancel_reason = ?
      WHERE id = ?
    `).run(scsiUserId, reason || null, requestId);
    
    res.json({ 
      message: `Assignment request for ${request.first_name} ${request.last_name} has been canceled.`,
      request_id: requestId,
      status: 'canceled'
    });
  } catch (error) {
    console.error('Error canceling assignment request:', error);
    res.status(500).json({ error: 'Failed to cancel assignment request' });
  }
};

// Get list of all supervisors (for FLS supervisor lookup)
exports.getSupervisorsList = (req, res) => {
  try {
    const supervisors = db.prepare(`
      SELECT 
        u.id,
        u.email,
        p.first_name,
        p.last_name,
        p.position
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'supervisor'
      ORDER BY p.last_name, p.first_name
    `).all();

    res.json(supervisors);
  } catch (error) {
    console.error('Error fetching supervisors list:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors list' });
  }
};

// Get FLS Dashboard Statistics
exports.getFlsDashboardStats = (req, res) => {
  try {
    const stats = {};

    // Total inspectors (CSI role)
    const totalInspectors = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'inspector'
    `).get();
    stats.totalInspectors = totalInspectors.count;

    // Total supervisors
    const totalSupervisors = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'supervisor'
    `).get();
    stats.totalSupervisors = totalSupervisors.count;

    // Inspectors by position
    const inspectorsByPosition = db.prepare(`
      SELECT 
        COALESCE(p.position, 'Unknown') as position,
        COUNT(*) as count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'inspector'
      GROUP BY p.position
      ORDER BY count DESC
    `).all();
    stats.inspectorsByPosition = inspectorsByPosition;

    // Assignment statistics
    const assignedInspectors = db.prepare(`
      SELECT COUNT(*) as count 
      FROM profiles 
      WHERE user_id IN (SELECT id FROM users WHERE role = 'inspector')
      AND supervisor_id IS NOT NULL
    `).get();
    stats.assignedInspectors = assignedInspectors.count;
    stats.unassignedInspectors = stats.totalInspectors - stats.assignedInspectors;

    // Pending assignment requests
    const pendingRequests = db.prepare(`
      SELECT COUNT(*) as count 
      FROM assignment_requests 
      WHERE status = 'pending'
    `).get();
    stats.pendingAssignmentRequests = pendingRequests.count;

    // Voucher statistics - pending
    const pendingVouchers = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM vouchers 
      WHERE status = 'pending'
    `).get();
    stats.pendingVouchers = pendingVouchers.count;
    stats.totalPendingAmount = Math.round(pendingVouchers.amount * 100) / 100;

    // Voucher statistics - approved this month
    const approvedThisMonth = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM vouchers 
      WHERE status = 'approved'
      AND strftime('%Y-%m', supervisor_approved_at) = strftime('%Y-%m', 'now')
    `).get();
    stats.approvedThisMonth = approvedThisMonth.count;
    stats.totalApprovedAmount = Math.round(approvedThisMonth.amount * 100) / 100;

    // Voucher statistics - rejected this month
    const rejectedThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM vouchers 
      WHERE status = 'rejected'
      AND strftime('%Y-%m', supervisor_approved_at) = strftime('%Y-%m', 'now')
    `).get();
    stats.rejectedThisMonth = rejectedThisMonth.count;

    // Circuit distribution
    const circuitDistribution = db.prepare(`
      SELECT 
        COALESCE(TRIM(p.circuit), 'Unassigned') as circuit,
        COUNT(*) as count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'inspector'
      GROUP BY circuit
      ORDER BY count DESC
      LIMIT 15
    `).all();
    stats.circuitDistribution = circuitDistribution;

    // State distribution
    const stateDistribution = db.prepare(`
      SELECT 
        COALESCE(p.state, 'Unknown') as state,
        COUNT(*) as count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'inspector'
      GROUP BY state
      ORDER BY count DESC
      LIMIT 10
    `).all();
    stats.stateDistribution = stateDistribution;

    // Supervisor performance stats
    const supervisorStats = db.prepare(`
      SELECT 
        s.id,
        (sp.first_name || ' ' || sp.last_name) as name,
        sp.position,
        COUNT(DISTINCT p.user_id) as assignedInspectors,
        (
          SELECT COUNT(*) 
          FROM vouchers v 
          WHERE v.user_id IN (
            SELECT user_id FROM profiles WHERE supervisor_id = s.id
          ) 
          AND v.status = 'pending'
        ) as pendingVouchers,
        (
          SELECT COUNT(*) 
          FROM vouchers v 
          WHERE v.user_id IN (
            SELECT user_id FROM profiles WHERE supervisor_id = s.id
          ) 
          AND v.status = 'approved'
          AND strftime('%Y-%m', v.supervisor_approved_at) = strftime('%Y-%m', 'now')
        ) as approvedThisMonth
      FROM users s
      INNER JOIN profiles sp ON s.id = sp.user_id
      LEFT JOIN profiles p ON p.supervisor_id = s.id
      WHERE s.role = 'supervisor'
      GROUP BY s.id, sp.first_name, sp.last_name, sp.position
      ORDER BY assignedInspectors DESC
      LIMIT 10
    `).all();
    stats.supervisorStats = supervisorStats;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching FLS dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get DDM Dashboard Statistics
exports.getDdmDashboardStats = (req, res) => {
  try {
    const stats = {};

    // Total FLS supervisors
    const totalFls = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'supervisor'
      AND (p.position = 'FLS' OR p.position = 'First Line Supervisor')
    `).get();
    stats.totalFls = totalFls.count;

    // Total inspectors
    const totalInspectors = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'inspector'
    `).get();
    stats.totalInspectors = totalInspectors.count;

    // Total supervisors
    const totalSupervisors = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'supervisor'
    `).get();
    stats.totalSupervisors = totalSupervisors.count;

    // Voucher statistics - pending
    const pendingVouchers = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM vouchers 
      WHERE status = 'pending'
    `).get();
    stats.pendingVouchers = pendingVouchers.count;
    stats.totalPendingAmount = Math.round(pendingVouchers.amount * 100) / 100;

    // Voucher statistics - approved this month
    const approvedThisMonth = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM vouchers 
      WHERE status = 'approved'
      AND strftime('%Y-%m', supervisor_approved_at) = strftime('%Y-%m', 'now')
    `).get();
    stats.approvedThisMonth = approvedThisMonth.count;
    stats.totalApprovedAmount = Math.round(approvedThisMonth.amount * 100) / 100;

    // Voucher statistics - rejected this month
    const rejectedThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM vouchers 
      WHERE status = 'rejected'
      AND strftime('%Y-%m', supervisor_approved_at) = strftime('%Y-%m', 'now')
    `).get();
    stats.rejectedThisMonth = rejectedThisMonth.count;

    // Pending assignment requests
    const assignmentRequests = db.prepare(`
      SELECT COUNT(*) as count 
      FROM assignment_requests 
      WHERE status = 'pending'
    `).get();
    stats.assignmentRequests = assignmentRequests.count;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching DDM dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch DDM dashboard statistics' });
  }
};

// Get DM Dashboard Statistics
exports.getDmDashboardStats = (req, res) => {
  try {
    const stats = {};

    // Total DDM supervisors
    const totalDdm = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'supervisor'
      AND (p.position = 'DDM' OR p.position = 'District Director Manager')
    `).get();
    stats.totalDdm = totalDdm.count;

    // Total FLS supervisors
    const totalFls = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'supervisor'
      AND (p.position = 'FLS' OR p.position = 'First Line Supervisor')
    `).get();
    stats.totalFls = totalFls.count;

    // Total inspectors
    const totalInspectors = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'inspector'
    `).get();
    stats.totalInspectors = totalInspectors.count;

    // Total supervisors
    const totalSupervisors = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'supervisor'
    `).get();
    stats.totalSupervisors = totalSupervisors.count;

    // Voucher statistics - pending
    const pendingVouchers = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM vouchers 
      WHERE status = 'pending'
    `).get();
    stats.pendingVouchers = pendingVouchers.count;
    stats.totalPendingAmount = Math.round(pendingVouchers.amount * 100) / 100;

    // Voucher statistics - approved this month
    const approvedThisMonth = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM vouchers 
      WHERE status = 'approved'
      AND strftime('%Y-%m', supervisor_approved_at) = strftime('%Y-%m', 'now')
    `).get();
    stats.approvedThisMonth = approvedThisMonth.count;
    stats.totalApprovedAmount = Math.round(approvedThisMonth.amount * 100) / 100;

    // Voucher statistics - rejected this month
    const rejectedThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM vouchers 
      WHERE status = 'rejected'
      AND strftime('%Y-%m', supervisor_approved_at) = strftime('%Y-%m', 'now')
    `).get();
    stats.rejectedThisMonth = rejectedThisMonth.count;

    // Total miles driven this month (from vouchers)
    const totalMilesThisMonth = db.prepare(`
      SELECT 
        COALESCE(SUM(total_miles), 0) as miles
      FROM vouchers 
      WHERE strftime('%Y-%m', submitted_at) = strftime('%Y-%m', 'now')
    `).get();
    stats.totalMilesThisMonth = Math.round(totalMilesThisMonth.miles);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching DM dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch DM dashboard statistics' });
  }
};


module.exports = exports;

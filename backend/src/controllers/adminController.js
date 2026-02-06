const { db } = require('../models/database');
const bcrypt = require('bcryptjs');

let logAction;
try {
  const auditLogger = require('../utils/auditLogger');
  logAction = auditLogger.logAction;
  console.log('✅ logAction loaded:', typeof logAction);
} catch (err) {
  console.error('❌ Failed to load logAction:', err.message);
  logAction = () => console.log('⚠️  Audit logging disabled');
}

const { validatePassword, validateEmail } = require('../utils/validation');

console.log('✅ adminController loaded successfully');

// Get all users with their profiles
exports.getAllUsers = (req, res) => {
  try {
    const { role } = req.query;
    
    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.role, 
        u.assigned_supervisor_id,
        u.created_at,
        p.first_name,
        p.last_name,
        p.middle_initial,
        p.position,
        p.phone,
        (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
    `;
    
    const params = [];
    if (role) {
      query += ' WHERE u.role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY u.created_at DESC';
    
    const users = db.prepare(query).all(...params);

    // Get supervisor names for assigned supervisors
    const usersWithSupervisors = users.map(user => {
      if (user.assigned_supervisor_id) {
        const supervisor = db.prepare('SELECT email FROM users WHERE id = ?').get(user.assigned_supervisor_id);
        return { ...user, supervisor_email: supervisor?.email };
      }
      return user;
    });

    res.json(usersWithSupervisors);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Create a new user
exports.createUser = (req, res) => {
  try {
    const { 
      email, password, role, 
      firstName, lastName, middleInitial, 
      phone, assignedSupervisorId, supervisorId,
      position, state, circuit, employeeId, hireDate, dutyStation
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    if (!['inspector', 'supervisor', 'fleet_manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user (assignedSupervisorId is the FLS supervisor in users table)
    const result = db.prepare(
      'INSERT INTO users (email, password, role, assigned_supervisor_id) VALUES (?, ?, ?, ?)'
    ).run(email, hashedPassword, role, assignedSupervisorId || null);

    const userId = result.lastInsertRowid;

    // Create profile (supervisorId is the SCSI supervisor in profiles table)
    db.prepare(`
      INSERT INTO profiles (
        user_id, first_name, last_name, middle_initial, phone, 
        position, state, circuit, employee_id, hire_date, duty_station, mileage_rate, supervisor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.67, ?)
    `).run(
      userId, 
      firstName || '', 
      lastName || '', 
      middleInitial || '',
      phone || '',
      position || '',
      state || '',
      circuit || '',
      employeeId || '',
      hireDate || null,
      dutyStation || null,
      supervisorId || null  // SCSI supervisor
    );

    // Log action
    logAction(req.user.id, 'CREATE_USER', 'user', userId, {
      email,
      role,
      position,
      hireDate,
      createdBy: req.user.email
    }, req.ip);

    res.status(201).json({ 
      message: 'User created successfully', 
      userId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
exports.updateUser = (req, res) => {
  console.error('🚨🚨🚨 UPDATE USER CALLED 🚨🚨🚨');
  
  // Just return success immediately - no database operations
  res.json({ message: 'Test: User update called successfully' });
  
  console.error('🚨🚨🚨 UPDATE USER COMPLETED 🚨🚨🚨');
};

// Delete user
exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = db.prepare('SELECT email, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade will handle related records via foreign keys)
    // Note: You may want to soft-delete instead by setting active=0
    db.prepare('DELETE FROM profiles WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    // Log action
    logAction(req.user.id, 'DELETE_USER', 'user', parseInt(id), {
      deletedEmail: user.email,
      deletedRole: user.role,
      deletedBy: req.user.email
    }, req.ip);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Reset user password
exports.resetUserPassword = (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update password
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, id);

    // Log action
    logAction(req.user.id, 'RESET_USER_PASSWORD', 'user', parseInt(id), {
      resetForEmail: user.email,
      resetBy: req.user.email
    }, req.ip);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Get system statistics
exports.getSystemStats = (req, res) => {
  try {
    // Count users by role
    const userCounts = db.prepare(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `).all();

    // Total trips
    const totalTrips = db.prepare('SELECT COUNT(*) as count FROM trips').get();

    // Total vouchers
    const totalVouchers = db.prepare('SELECT COUNT(*) as count FROM vouchers').get();

    // Pending vouchers (submitted + supervisor_approved)
    const pendingVouchers = db.prepare(`
      SELECT COUNT(*) as count 
      FROM vouchers 
      WHERE status IN ('submitted', 'supervisor_approved')
    `).get();

    // Recent user registrations (last 30 days)
    const recentUsers = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= datetime('now', '-30 days')
    `).get();

    // Total mileage
    const totalMileage = db.prepare('SELECT COALESCE(SUM(miles_calculated), 0) as total FROM trips').get();

    // Total reimbursements
    const totalReimbursements = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM vouchers').get();

    res.json({
      userCounts: userCounts.reduce((acc, { role, count }) => {
        acc[role] = count;
        return acc;
      }, {}),
      totalTrips: totalTrips.count,
      totalVouchers: totalVouchers.count,
      pendingVouchers: pendingVouchers.count,
      recentUsers: recentUsers.count,
      totalMileage: totalMileage.total || 0,
      totalReimbursements: totalReimbursements.total || 0
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
};

// Get user details with full profile and supervisory chain
exports.getUserDetails = (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user with profile and duty station
    const user = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.assigned_supervisor_id,
        p.first_name,
        p.last_name,
        p.middle_initial,
        p.position,
        p.phone,
        p.duty_station,
        p.circuit,
        p.state,
        (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get FLS (Front Line Supervisor) details
    let fls_name = null;
    let fls_email = null;
    if (user.assigned_supervisor_id) {
      const fls = db.prepare(`
        SELECT 
          u.email,
          (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?
      `).get(user.assigned_supervisor_id);
      
      if (fls) {
        fls_name = fls.name;
        fls_email = fls.email;
      }
    }
    
    // Get SCSI (higher-level supervisor) - find supervisor's supervisor
    let scsi_name = null;
    let scsi_email = null;
    if (user.assigned_supervisor_id) {
      const supervisor = db.prepare('SELECT assigned_supervisor_id FROM users WHERE id = ?').get(user.assigned_supervisor_id);
      if (supervisor && supervisor.assigned_supervisor_id) {
        const scsi = db.prepare(`
          SELECT 
            u.email,
            (p.first_name || ' ' || COALESCE(p.middle_initial || '. ', '') || p.last_name) as name
          FROM users u
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE u.id = ?
        `).get(supervisor.assigned_supervisor_id);
        
        if (scsi) {
          scsi_name = scsi.name;
          scsi_email = scsi.email;
        }
      }
    }
    
    res.json({
      user_id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      phone: user.phone,
      state: user.state,
      circuit: user.circuit,
      duty_station: user.duty_station,
      fls_name,
      fls_email,
      scsi_name,
      scsi_email
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

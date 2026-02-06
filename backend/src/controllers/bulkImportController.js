const { db } = require('../models/database');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/auditLogger');

// Bulk import team members from CSV
exports.bulkImportTeam = (req, res) => {
  try {
    const { members, supervisorId } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'No members provided for import' });
    }

    const results = {
      success: [],
      errors: [],
      total: members.length
    };

    const defaultPassword = 'Test123!';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    members.forEach((member, index) => {
      try {
        const {
          firstName,
          lastName,
          middleName,
          email,
          position,
          eod, // Entry on Duty date
          state,
          circuit,
          phone,
          employeeId
        } = member;

        // Validation
        if (!email || !firstName || !lastName) {
          results.errors.push({
            row: index + 1,
            email: email || 'N/A',
            error: 'Missing required fields (email, first name, last name)'
          });
          return;
        }

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
          results.errors.push({
            row: index + 1,
            email,
            error: 'User with this email already exists'
          });
          return;
        }

        // Parse date (handle various formats)
        let hireDate = null;
        if (eod) {
          const date = new Date(eod);
          if (!isNaN(date.getTime())) {
            hireDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        }

        // Determine role based on position
        let role = 'inspector';
        if (position && (position.includes('SCSI') || position.includes('FLS') || position.includes('SPHV'))) {
          role = 'supervisor';
        }

        // Create user
        const userResult = db.prepare(
          'INSERT INTO users (email, password, role, assigned_supervisor_id) VALUES (?, ?, ?, ?)'
        ).run(email, hashedPassword, role, supervisorId || null);

        const userId = userResult.lastInsertRowid;

        // Create profile
        db.prepare(`
          INSERT INTO profiles (
            user_id, first_name, last_name, middle_initial, phone, 
            position, state, circuit, employee_id, hire_date, mileage_rate, supervisor_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.67, ?)
        `).run(
          userId,
          firstName,
          lastName,
          middleName || '',
          phone || '',
          position || 'CSI',
          state || '',
          circuit || '',
          employeeId || '',
          hireDate,
          supervisorId || null
        );

        // Log action
        logActivity({
          userId: req.user.id,
          action: 'BULK_IMPORT_USER',
          entityType: 'user',
          entityId: userId,
          details: {
            email,
            role,
            position,
            hireDate,
            createdBy: req.user.email
          },
          ipAddress: req.ip
        });

        results.success.push({
          row: index + 1,
          email,
          name: `${firstName} ${lastName}`
        });

      } catch (err) {
        results.errors.push({
          row: index + 1,
          email: member.email || 'N/A',
          error: err.message
        });
      }
    });

    res.json({
      message: 'Bulk import completed',
      results,
      defaultPassword
    });

  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ error: 'Failed to import team members' });
  }
};

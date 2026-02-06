const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

console.log('🔷 teamUpdate routes loading...');

// ALTERNATIVE UPDATE ENDPOINT - Different path to avoid whatever is causing crashes
router.patch('/team-member/:id', authenticateToken, (req, res) => {
  console.log('🔷 PATCH /team-member/:id called');
  
  try {
    const { id } = req.params;
    const { 
      email, role, assigned_supervisor_id,
      first_name, last_name, middle_initial, phone, 
      position, state, circuit, hire_date 
    } = req.body;

    // Check permissions
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // If changing assigned_supervisor_id, check position permissions
    if (assigned_supervisor_id !== undefined && req.user.role !== 'admin') {
      const requestingUser = db.prepare(`
        SELECT p.position
        FROM profiles p
        WHERE p.user_id = ?
      `).get(req.user.id);

      // Only FLS and higher positions can directly assign subordinates
      // SCSI and PHV must use the Request Reassignment workflow
      const allowedPositions = ['FLS', 'First Line Supervisor', 'DDM', 'DM'];
      if (!requestingUser || !allowedPositions.includes(requestingUser.position)) {
        return res.status(403).json({ 
          error: 'Only FLS and higher positions can directly assign inspectors. SCSI and PHV supervisors must use the Request Reassignment workflow.' 
        });
      }
    }

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent changing own role
    if (parseInt(id) === req.user.id && role && role !== user.role) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Update users table (including assigned_supervisor_id)
    if (email || role || assigned_supervisor_id !== undefined) {
      db.prepare(`
        UPDATE users 
        SET email = COALESCE(?, email),
            role = COALESCE(?, role),
            assigned_supervisor_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(email || null, role || null, assigned_supervisor_id, id);
    }

    // Update profiles table (including supervisor_id for consistency)
    if (first_name || last_name || middle_initial || phone || position || state || circuit || hire_date || assigned_supervisor_id !== undefined) {
      db.prepare(`
        UPDATE profiles 
        SET first_name = COALESCE(?, first_name),
            last_name = COALESCE(?, last_name),
            middle_initial = COALESCE(?, middle_initial),
            phone = COALESCE(?, phone),
            position = COALESCE(?, position),
            state = COALESCE(?, state),
            circuit = COALESCE(?, circuit),
            hire_date = COALESCE(?, hire_date),
            supervisor_id = ?
        WHERE user_id = ?
      `).run(
        first_name || null, 
        last_name || null, 
        middle_initial || null, 
        phone || null,
        position || null,
        state || null,
        circuit || null,
        hire_date || null,
        assigned_supervisor_id !== undefined ? assigned_supervisor_id : null,
        id
      );
    }

    console.log('✅ User updated successfully');
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ Error in PATCH /team-member:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

console.log('🔷 teamUpdate routes loaded');

module.exports = router;

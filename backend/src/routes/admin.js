const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bulkImportController = require('../controllers/bulkImportController');
const emailSettingsController = require('../controllers/emailSettingsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

console.log('📋 Admin routes loading...');

// EMERGENCY TEST ROUTE - NO MIDDLEWARE
router.put('/test-update/:id', (req, res) => {
  console.error('🔥 EMERGENCY TEST ROUTE HIT');
  res.json({ message: 'TEST ROUTE WORKS', id: req.params.id });
});

// User management routes - allow supervisors (FLS) to create, view, edit, and delete their team members
router.get('/users', authenticateToken, requireRole(['admin', 'supervisor']), adminController.getAllUsers);
router.get('/users/:id/details', authenticateToken, adminController.getUserDetails);  // Allow all authenticated users
router.post('/users', authenticateToken, requireRole(['admin', 'supervisor']), adminController.createUser);
router.post('/bulk-import-team', authenticateToken, requireRole(['admin', 'supervisor']), bulkImportController.bulkImportTeam);

// TEMPORARY: Test without requireRole middleware
router.put('/users/:id', authenticateToken, (req, res) => {
  console.error('🟢 Route handler called directly');
  adminController.updateUser(req, res);
});

router.delete('/users/:id', authenticateToken, requireRole(['admin', 'supervisor']), adminController.deleteUser);
router.put('/users/:id/reset-password', authenticateToken, requireRole(['admin', 'supervisor']), adminController.resetUserPassword);

console.log('📋 Admin routes loaded');

// System statistics - allow supervisors to view their team stats
router.get('/stats', authenticateToken, requireRole(['admin', 'supervisor']), adminController.getSystemStats);

// Email settings routes - admin only
router.get('/email-settings', authenticateToken, requireRole(['admin']), emailSettingsController.getEmailSettings);
router.put('/email-settings', authenticateToken, requireRole(['admin']), emailSettingsController.updateEmailSettings);
router.post('/email-settings/test', authenticateToken, requireRole(['admin']), emailSettingsController.sendTestEmail);

module.exports = router;

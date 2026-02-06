const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All backup routes require admin role
const adminOnly = [authenticateToken, authorize('admin', 'fleet_manager')];

// Create backup
router.post('/create', adminOnly, backupController.createBackup);

// List all backups
router.get('/list', adminOnly, backupController.listBackups);

// Get backup statistics
router.get('/stats', adminOnly, backupController.getStats);

// Download backup file
router.get('/download/:fileName', adminOnly, backupController.downloadBackup);

// Restore from backup
router.post('/restore', adminOnly, backupController.restoreBackup);

// Delete backup
router.delete('/:fileName', adminOnly, backupController.deleteBackup);

// Cleanup old backups
router.post('/cleanup', adminOnly, backupController.cleanupBackups);

// Export database as JSON
router.post('/export-json', adminOnly, backupController.exportJSON);

// Download JSON export
router.get('/download-json/:fileName', adminOnly, backupController.downloadJSON);

module.exports = router;

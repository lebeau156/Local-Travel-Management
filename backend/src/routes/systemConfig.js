const express = require('express');
const router = express.Router();
const systemConfigController = require('../controllers/systemConfigController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all configurations (admin only)
router.get('/', requireRole(['admin']), systemConfigController.getAllConfigs);

// Get categories (admin only)
router.get('/categories', requireRole(['admin']), systemConfigController.getCategories);

// Get single configuration (admin only)
router.get('/:key', requireRole(['admin']), systemConfigController.getConfig);

// Create configuration (admin only)
router.post('/', requireRole(['admin']), systemConfigController.createConfig);

// Update configuration (admin only)
router.put('/:key', requireRole(['admin']), systemConfigController.updateConfig);

// Delete configuration (admin only)
router.delete('/:key', requireRole(['admin']), systemConfigController.deleteConfig);

// Bulk update (admin only)
router.post('/bulk-update', requireRole(['admin']), systemConfigController.bulkUpdate);

// Reset to default (admin only)
router.post('/:key/reset', requireRole(['admin']), systemConfigController.resetToDefault);

module.exports = router;

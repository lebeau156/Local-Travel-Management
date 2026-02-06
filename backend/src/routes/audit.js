const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get audit logs (with filters)
router.get('/', authenticateToken, auditController.getAuditLogs);

// Get audit statistics
router.get('/stats', authenticateToken, auditController.getAuditStats);

module.exports = router;

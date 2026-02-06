const express = require('express');
const router = express.Router();
const mileageRateController = require('../controllers/mileageRateController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all rates (admin only)
router.get('/', requireRole(['admin']), mileageRateController.getAllRates);

// Get current rate (all authenticated users)
router.get('/current', mileageRateController.getCurrentRate);

// Get rate for specific date (all authenticated users)
router.get('/date/:date', mileageRateController.getRateForDate);

// Create rate (admin only)
router.post('/', requireRole(['admin']), mileageRateController.createRate);

// Update rate (admin only)
router.put('/:id', requireRole(['admin']), mileageRateController.updateRate);

// Delete rate (admin only)
router.delete('/:id', requireRole(['admin']), mileageRateController.deleteRate);

module.exports = router;

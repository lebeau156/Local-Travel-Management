const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

// Export trips to Excel
router.get('/trips/excel', authenticateToken, exportController.exportTripsToExcel);

// Export trips to CSV
router.get('/trips/csv', authenticateToken, exportController.exportTripsToCSV);

// Export voucher to Excel
router.get('/vouchers/:id/excel', authenticateToken, exportController.exportVoucherToExcel);

module.exports = router;

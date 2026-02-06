const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvImportController = require('../controllers/csvImportController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for CSV file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// All routes require authentication
router.use(authenticateToken);

// Download CSV template
router.get('/template', csvImportController.downloadTemplate);

// Import trips from CSV
router.post('/import', upload.single('file'), csvImportController.importTrips);

// Get import history
router.get('/history', csvImportController.getImportHistory);

// Export trips to CSV
router.get('/export', csvImportController.exportTrips);

module.exports = router;

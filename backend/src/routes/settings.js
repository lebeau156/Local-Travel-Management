const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All settings routes require admin or fleet_manager role
const adminOnly = [authenticateToken, authorize('admin', 'fleet_manager')];

// Any authenticated user can get API key for frontend use
const authOnly = [authenticateToken];

// Get current settings
router.get('/', adminOnly, settingsController.getSettings);

// Get Google Maps API key (for frontend autocomplete) - PUBLIC ENDPOINT
// Note: It's safe to expose Google Maps API key on frontend as it's domain-restricted
router.get('/google-maps-api-key', settingsController.getGoogleMapsApiKey);

// Save Google Maps API key
router.post('/google-maps-key', adminOnly, settingsController.saveGoogleMapsKey);

// Test Google Maps API
router.post('/test-google-maps', adminOnly, settingsController.testGoogleMapsApi);

module.exports = router;

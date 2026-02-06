const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, tripController.getTrips);
router.get('/:id', authenticateToken, tripController.getTrip);
router.post('/', authenticateToken, tripController.createTrip);
router.put('/:id', authenticateToken, tripController.updateTrip);
router.delete('/:id', authenticateToken, tripController.deleteTrip);
router.post('/calculate-mileage', authenticateToken, tripController.calculateMileageEndpoint);

module.exports = router;

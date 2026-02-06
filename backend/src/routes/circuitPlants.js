const express = require('express');
const router = express.Router();
const circuitPlantsController = require('../controllers/circuitPlantsController');
const { authenticateToken } = require('../middleware/auth');

// All circuit plants routes require authentication
router.use(authenticateToken);

console.log('🔍 Circuit Plants Routes - Loading specific routes BEFORE :id route');

// GET /api/circuit-plants/states - Get unique states (BEFORE :id route)
router.get('/states', (req, res, next) => {
  console.log('🎯 HIT /states route');
  circuitPlantsController.getStates(req, res);
});

// GET /api/circuit-plants/circuits - Get unique circuits (BEFORE :id route)
router.get('/circuits', (req, res, next) => {
  console.log('🎯 HIT /circuits route');
  circuitPlantsController.getCircuits(req, res);
});

// GET /api/circuit-plants/cities - Get unique cities (BEFORE :id route)
router.get('/cities', (req, res, next) => {
  console.log('🎯 HIT /cities route');
  circuitPlantsController.getCities(req, res);
});

// POST /api/circuit-plants/bulk-import - Bulk import plants (BEFORE :id route)
router.post('/bulk-import', circuitPlantsController.bulkImport);

// GET /api/circuit-plants - Get all plants (with optional filters)
router.get('/', circuitPlantsController.getAllPlants);

// GET /api/circuit-plants/:id - Get single plant
router.get('/:id', (req, res, next) => {
  console.log('🎯 HIT /:id route with id =', req.params.id);
  circuitPlantsController.getPlantById(req, res);
});

// POST /api/circuit-plants - Create new plant
router.post('/', circuitPlantsController.createPlant);

// PUT /api/circuit-plants/:id - Update plant
router.put('/:id', circuitPlantsController.updatePlant);

// DELETE /api/circuit-plants/:id - Delete plant
router.delete('/:id', circuitPlantsController.deletePlant);

console.log('✅ Circuit Plants Routes - All routes registered');

module.exports = router;

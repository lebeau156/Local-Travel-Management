const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/advanced', searchController.advancedSearch);
router.get('/saved', searchController.getSavedSearches);
router.post('/saved', searchController.saveSearch);
router.delete('/saved/:id', searchController.deleteSavedSearch);

module.exports = router;

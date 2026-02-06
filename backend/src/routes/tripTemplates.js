const express = require('express');
const router = express.Router();
const tripTemplateController = require('../controllers/tripTemplateController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', tripTemplateController.getAllTemplates);
router.post('/', tripTemplateController.createTemplate);
router.put('/:id', tripTemplateController.updateTemplate);
router.delete('/:id', tripTemplateController.deleteTemplate);
router.post('/:id/usage', tripTemplateController.incrementUsage);
router.post('/:id/favorite', tripTemplateController.toggleFavorite);

module.exports = router;

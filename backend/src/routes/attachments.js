const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Upload file
router.post('/upload', 
  attachmentController.uploadFile, 
  attachmentController.saveAttachment
);

// Get attachments for entity
router.get('/:entityType/:entityId', attachmentController.getAttachments);

// Download attachment
router.get('/:id/download', attachmentController.downloadAttachment);

// Delete attachment
router.delete('/:id', attachmentController.deleteAttachment);

// Get attachment stats (admin only)
router.get('/stats/summary', attachmentController.getAttachmentStats);

module.exports = router;

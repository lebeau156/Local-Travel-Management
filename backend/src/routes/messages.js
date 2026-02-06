const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get inbox messages
router.get('/inbox', messagesController.getInbox);

// Get sent messages
router.get('/sent', messagesController.getSent);

// Get unread count
router.get('/unread-count', messagesController.getUnreadCount);

// Get user list for composing messages
router.get('/users', messagesController.getUserList);

// Get single message
router.get('/:id', messagesController.getMessage);

// Send new message
router.post('/', messagesController.sendMessage);

// Mark message as read
router.patch('/:id/read', messagesController.markAsRead);

// Mark message as unread
router.patch('/:id/unread', messagesController.markAsUnread);

// Delete message
router.delete('/:id', messagesController.deleteMessage);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
// const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// RATE LIMITING DISABLED FOR DEVELOPMENT
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

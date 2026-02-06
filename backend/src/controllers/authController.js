const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/database');
const { JWT_SECRET } = require('../middleware/auth');
const { validatePassword, validateEmail } = require('../utils/validation');

// Register
exports.register = (req, res) => {
  try {
    const { email, password, role = 'inspector' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)')
      .run(email, hashedPassword, role);

    const token = jwt.sign({ id: result.lastInsertRowid, email, role }, JWT_SECRET, { expiresIn: '8h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.lastInsertRowid, email, role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user
exports.getMe = (req, res) => {
  try {
    // First get the basic user info
    const user = db.prepare('SELECT id, email, role, assigned_supervisor_id, fls_supervisor_id FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to get profile data (may not exist)
    let profile = null;
    try {
      profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    } catch (err) {
      console.log('Profile not found for user', req.user.id);
    }

    // Merge user and profile data
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      assigned_supervisor_id: user.assigned_supervisor_id,
      fls_supervisor_id: user.fls_supervisor_id,
      ...(profile || {})
    };

    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
};

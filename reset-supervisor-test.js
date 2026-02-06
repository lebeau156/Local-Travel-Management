const { db } = require('./backend/src/models/database');
const bcrypt = require('bcrypt');

const hash = bcrypt.hashSync('Test123!', 10);
db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, 'supervisor@usda.gov');
console.log('✅ Password reset for supervisor@usda.gov');

const user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get('supervisor@usda.gov');
console.log('User:', user);

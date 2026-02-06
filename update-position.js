const { db } = require('./backend/src/models/database');

// Update user 2's position to CSI
db.prepare('UPDATE profiles SET position = ? WHERE user_id = ?').run('CSI', 2);
console.log('✅ Updated user 2 position to CSI');

// Verify
const profile = db.prepare('SELECT position FROM profiles WHERE user_id = ?').get(2);
console.log('Current position:', profile.position);

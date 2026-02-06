const bcrypt = require('bcryptjs');
const {db} = require('./backend/src/models/database');

const password = 'password123';
const hashedPassword = bcrypt.hashSync(password, 10);

// Update SCSI supervisor password
db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, 'supervisor@usda.gov');
console.log('✓ Updated password for supervisor@usda.gov (SCSI)');

// Update FLS supervisor password
db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, 'fls@usda.gov');
console.log('✓ Updated password for fls@usda.gov (FLS)');

console.log('\nBoth users now have password: password123');

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'travel_mileage.db');
const db = new Database(dbPath);

console.log('📋 Checking supervisor accounts...\n');

// Get all supervisor users
const supervisors = db.prepare(`
  SELECT u.id, u.email, u.role, p.first_name, p.last_name, p.position
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  WHERE u.role = 'supervisor'
`).all();

console.log('Found supervisors:', supervisors.length);
supervisors.forEach(sup => {
  console.log(`  - ${sup.email} (ID: ${sup.id}, Position: ${sup.position || 'N/A'})`);
});

// Reset supervisor@usda.gov password
const email = 'supervisor@usda.gov';
const newPassword = 'Test123!';

console.log(`\n🔑 Resetting password for ${email}...`);

const hashedPassword = bcrypt.hashSync(newPassword, 10);

const result = db.prepare(`
  UPDATE users 
  SET password = ?
  WHERE email = ?
`).run(hashedPassword, email);

if (result.changes > 0) {
  console.log(`✅ Password reset successfully!`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}`);
} else {
  console.log(`❌ User not found: ${email}`);
}

db.close();

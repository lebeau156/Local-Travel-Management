const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new Database(dbPath);

console.log('📍 Updating test.user profile...\n');

// First, check if profile exists
const profile = db.prepare('SELECT * FROM profiles WHERE user_id = 5').get();

if (!profile) {
  console.log('❌ No profile found for user_id 5. Creating one...');
  db.prepare(`
    INSERT INTO profiles (user_id, first_name, last_name, state, circuit)
    VALUES (?, ?, ?, ?, ?)
  `).run(5, 'Test', 'User', 'Texas', 'Circuit 5');
  console.log('✅ Profile created for test.user');
} else {
  console.log('✅ Profile exists. Updating...');
  db.prepare(`
    UPDATE profiles 
    SET first_name = ?, last_name = ?, state = ?, circuit = ?
    WHERE user_id = ?
  `).run('Test', 'User', 'Texas', 'Circuit 5', 5);
  console.log('✅ Profile updated for test.user');
}

// Verify
const updated = db.prepare(`
  SELECT u.email, p.first_name, p.last_name, p.state, p.circuit
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  WHERE u.id = 5
`).get();

console.log('\n📊 Verification:');
console.log(`  Email: ${updated.email}`);
console.log(`  Name: ${updated.first_name} ${updated.last_name}`);
console.log(`  State: ${updated.state}`);
console.log(`  Circuit: ${updated.circuit}`);

db.close();

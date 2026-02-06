const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new Database(dbPath);

console.log('Creating FLS test user...');

const email = 'fls@usda.gov';
const password = 'Test123!';
const hashedPassword = bcrypt.hashSync(password, 10);

// Check if user exists
const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existingUser) {
  console.log('✅ FLS user already exists');
  console.log('Email:', email);
  console.log('Password:', password);
  
  // Update profile to FLS position
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(existingUser.id);
  if (profile) {
    db.prepare(`
      UPDATE profiles 
      SET position = 'FLS'
      WHERE user_id = ?
    `).run(existingUser.id);
    console.log('✅ Updated profile position to FLS');
  }
} else {
  // Create user
  const userResult = db.prepare(`
    INSERT INTO users (email, password, role)
    VALUES (?, ?, 'supervisor')
  `).run(email, hashedPassword);
  
  const userId = userResult.lastInsertRowid;
  
  // Create profile
  db.prepare(`
    INSERT INTO profiles (user_id, first_name, last_name, position, state, circuit)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, 'John', 'Williams', 'FLS', 'California', 'Circuit 9');
  
  console.log('✅ FLS user created successfully!');
}

console.log('\n📋 Login Credentials:');
console.log('Email:', email);
console.log('Password:', password);
console.log('\n📍 Use this account to approve assignment requests from SCSI supervisors');

db.close();

const { db } = require('./backend/src/models/database');
const bcrypt = require('bcryptjs');

// Create FLS user
console.log('Creating FLS user...');
const flsPassword = bcrypt.hashSync('Test123!', 10);
const flsResult = db.prepare(`
  INSERT INTO users (email, password, role) 
  VALUES (?, ?, ?)
`).run('fls@usda.gov', flsPassword, 'supervisor');

db.prepare(`
  INSERT INTO profiles (user_id, first_name, last_name, position) 
  VALUES (?, ?, ?, ?)
`).run(flsResult.lastInsertRowid, 'John', 'Williams', 'FLS');

console.log('✅ Created FLS: fls@usda.gov / Test123!');

// Create DDM user
console.log('Creating DDM user...');
const ddmPassword = bcrypt.hashSync('Test123!', 10);
const ddmResult = db.prepare(`
  INSERT INTO users (email, password, role) 
  VALUES (?, ?, ?)
`).run('ddm@usda.gov', ddmPassword, 'supervisor');

db.prepare(`
  INSERT INTO profiles (user_id, first_name, last_name, position) 
  VALUES (?, ?, ?, ?)
`).run(ddmResult.lastInsertRowid, 'Sarah', 'Johnson', 'DDM');

console.log('✅ Created DDM: ddm@usda.gov / Test123!');

// Create DM user
console.log('Creating DM user...');
const dmPassword = bcrypt.hashSync('Test123!', 10);
const dmResult = db.prepare(`
  INSERT INTO users (email, password, role) 
  VALUES (?, ?, ?)
`).run('dm@usda.gov', dmPassword, 'supervisor');

db.prepare(`
  INSERT INTO profiles (user_id, first_name, last_name, position) 
  VALUES (?, ?, ?, ?)
`).run(dmResult.lastInsertRowid, 'Michael', 'Davis', 'DM');

console.log('✅ Created DM: dm@usda.gov / Test123!');

// Verify all supervisors
console.log('\n📋 All supervisors:');
const allSupervisors = db.prepare(`
  SELECT u.email, p.first_name, p.last_name, p.position 
  FROM users u 
  LEFT JOIN profiles p ON u.id = p.user_id 
  WHERE u.role = 'supervisor'
  ORDER BY p.position
`).all();

console.table(allSupervisors);

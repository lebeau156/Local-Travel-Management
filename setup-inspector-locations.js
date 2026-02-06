const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new Database(dbPath);

console.log('📍 Adding State and Circuit information to profiles...\n');

// Update inspector profile with location data
const updateInspector = db.prepare(`
  UPDATE profiles 
  SET state = ?, circuit = ?
  WHERE user_id = ?
`);

// Assign Mohamed Diallo (inspector) to California, Circuit 9
updateInspector.run('California', 'Circuit 9', 2);
console.log('✅ Updated Inspector Mohamed Diallo: California, Circuit 9');

// Assign test.user to Texas, Circuit 5
updateInspector.run('Texas', 'Circuit 5', 5);
console.log('✅ Updated Inspector test.user: Texas, Circuit 5');

// Verify updates
console.log('\n📊 Updated Profiles:\n');
const profiles = db.prepare(`
  SELECT u.email, u.role, p.first_name, p.last_name, p.state, p.circuit, p.supervisor_id
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  WHERE u.role = 'inspector'
`).all();

profiles.forEach(profile => {
  console.log(`${profile.email}:`);
  console.log(`  Name: ${profile.first_name} ${profile.last_name}`);
  console.log(`  State: ${profile.state || 'Not set'}`);
  console.log(`  Circuit: ${profile.circuit || 'Not set'}`);
  console.log(`  Supervisor ID: ${profile.supervisor_id || 'Not assigned'}\n`);
});

db.close();
console.log('✅ All updates complete!');

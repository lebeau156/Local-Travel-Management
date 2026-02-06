const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new Database(dbPath);

console.log('📊 Current Users and Profiles:\n');

// Get all users
const users = db.prepare(`
  SELECT u.id, u.email, u.role, p.first_name, p.last_name, p.supervisor_id
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  ORDER BY u.role, u.email
`).all();

users.forEach(user => {
  console.log(`${user.role.toUpperCase()}: ${user.email} (ID: ${user.id})`);
  console.log(`  Name: ${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`);
  console.log(`  Supervisor ID: ${user.supervisor_id || 'None'}\n`);
});

// Find supervisor and inspector
const supervisor = users.find(u => u.role === 'supervisor');
const inspector = users.find(u => u.role === 'inspector');

if (supervisor && inspector) {
  console.log(`\n🔗 Assigning Inspector ${inspector.email} (ID: ${inspector.id}) to Supervisor ${supervisor.email} (ID: ${supervisor.id})\n`);
  
  // Update the inspector's profile to have the supervisor_id
  const updateProfile = db.prepare(`
    UPDATE profiles 
    SET supervisor_id = ? 
    WHERE user_id = ?
  `);
  
  updateProfile.run(supervisor.id, inspector.id);
  
  console.log('✅ Assignment complete!\n');
  
  // Verify the update
  const updatedProfile = db.prepare(`
    SELECT * FROM profiles WHERE user_id = ?
  `).get(inspector.id);
  
  console.log('Updated Profile:');
  console.log(`  Inspector: ${updatedProfile.first_name} ${updatedProfile.last_name}`);
  console.log(`  Supervisor ID: ${updatedProfile.supervisor_id}\n`);
} else {
  console.log('❌ Could not find both supervisor and inspector users');
}

db.close();

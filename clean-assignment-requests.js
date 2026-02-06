const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new Database(dbPath);

console.log('Clearing old assignment requests...');

// Delete all assignment requests
const result = db.prepare('DELETE FROM assignment_requests').run();
console.log(`✅ Deleted ${result.changes} assignment requests`);

// Reset inspector assignments for Test User (make unassigned again for testing)
const resetResult = db.prepare(`
  UPDATE profiles 
  SET supervisor_id = NULL 
  WHERE user_id = (SELECT id FROM users WHERE email = 'test.user@usda.gov')
`).run();

console.log(`✅ Reset Test User assignment (${resetResult.changes} rows updated)`);

// Show current state
const unassigned = db.prepare(`
  SELECT u.email, p.first_name, p.last_name
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  WHERE u.role = 'inspector' AND p.supervisor_id IS NULL
`).all();

console.log('\n📋 Unassigned Inspectors:', unassigned.length);
unassigned.forEach(i => {
  console.log(`  - ${i.first_name} ${i.last_name} (${i.email})`);
});

db.close();
console.log('\n✅ Database cleaned! Ready for testing.');

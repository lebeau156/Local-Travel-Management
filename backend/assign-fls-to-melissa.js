const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Get Melissa Byrd's profile
  const melissa = db.prepare("SELECT * FROM users WHERE email = 'supervisor@usda.gov'").get();
  
  if (!melissa) {
    console.log('Melissa not found');
    process.exit(1);
  }
  
  console.log(`Melissa Byrd: User ID ${melissa.id}`);
  
  // Get John Williams (FLS)
  const john = db.prepare("SELECT * FROM users WHERE email = 'fls@usda.gov'").get();
  
  if (!john) {
    console.log('John Williams (FLS) not found');
    process.exit(1);
  }
  
  console.log(`John Williams: User ID ${john.id}`);
  
  // Update Melissa's profile to set John as FLS supervisor
  const result = db.prepare(
    'UPDATE profiles SET fls_supervisor_id = ? WHERE user_id = ?'
  ).run(john.id, melissa.id);
  
  console.log(`\n✓ Successfully assigned John Williams as FLS supervisor for Melissa Byrd`);
  console.log(`  Changes: ${result.changes} row(s) updated`);
  
  // Verify the update
  const melissaProfile = db.prepare('SELECT first_name, last_name, position, fls_supervisor_id FROM profiles WHERE user_id = ?').get(melissa.id);
  console.log('\nMelissa\'s profile after update:');
  console.log(JSON.stringify(melissaProfile, null, 2));
  
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('Adding fls_supervisor_id column to profiles table...');
  
  // Add the column if it doesn't exist
  db.exec(`
    ALTER TABLE profiles ADD COLUMN fls_supervisor_id INTEGER;
  `);
  
  console.log('✓ Successfully added fls_supervisor_id column');
  
  // Verify the column was added
  const schema = db.prepare("PRAGMA table_info(profiles)").all();
  const hasColumn = schema.some(col => col.name === 'fls_supervisor_id');
  
  if (hasColumn) {
    console.log('✓ Column verified in schema');
  } else {
    console.error('✗ Column not found in schema');
  }
  
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column fls_supervisor_id already exists');
  } else {
    console.error('Error:', err.message);
  }
} finally {
  db.close();
}

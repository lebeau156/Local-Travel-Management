const { db } = require('./backend/src/models/database');

const emailToDelete = 'mbailo135@gmail.com';

console.log(`\n=== Deleting User: ${emailToDelete} ===\n`);

const user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(emailToDelete);

if (user) {
  console.log(`Found user:`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role: ${user.role}`);
  
  // Delete profile first (foreign key constraint)
  db.prepare('DELETE FROM profiles WHERE user_id = ?').run(user.id);
  console.log(`✓ Deleted profile for user ID ${user.id}`);
  
  // Delete user
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  console.log(`✓ Deleted user: ${emailToDelete}`);
  
  console.log(`\n✓ User deleted successfully!`);
  console.log(`\nYou can now use this email: ${emailToDelete}`);
  console.log(`Or try a different email like: mohamed.diallo@usda.gov\n`);
} else {
  console.log(`✗ User not found: ${emailToDelete}\n`);
}

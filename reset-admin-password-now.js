const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./backend/database.sqlite');

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@usda.gov'],
      function(err) {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log('✅ Admin password reset to: Admin123!');
          console.log(`   Rows affected: ${this.changes}`);
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
}

resetAdminPassword();

const bcrypt = require('bcryptjs');
const { db } = require('./backend/src/models/database');

async function resetPassword() {
  const email = 'admin@usda.gov';
  const password = 'admin123';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);
  
  console.log(`✅ Password reset for ${email}`);
  console.log(`   New password: ${password}`);
}

resetPassword();

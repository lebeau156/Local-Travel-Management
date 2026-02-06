const { db } = require('./backend/src/models/database');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    db.prepare(`
      UPDATE users 
      SET password = ? 
      WHERE email = 'admin@usda.gov'
    `).run(hashedPassword);
    
    console.log('✅ Admin password has been reset to: admin123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetAdminPassword();

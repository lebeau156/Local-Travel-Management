const { db } = require('./backend/src/models/database');

console.log('🔧 Fixing FLS user position...\n');

// Update position to FLS
db.prepare(`
  UPDATE users 
  SET position = 'FLS'
  WHERE email = 'fls@usda.gov'
`).run();

// Verify
const flsUser = db.prepare('SELECT * FROM users WHERE email = ?').get('fls@usda.gov');
console.log('✅ FLS user updated:');
console.log('   ID:', flsUser.id);
console.log('   Email:', flsUser.email);
console.log('   Role:', flsUser.role);
console.log('   Position:', flsUser.position);

console.log('\n✅ Ready to login!');
console.log('   Email: fls@usda.gov');
console.log('   Password: Test123!');

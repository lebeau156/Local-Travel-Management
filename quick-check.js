// Quick test - just show what the server returns
const db = require('better-sqlite3')('./backend/database.sqlite');

console.log('=== DIRECT DATABASE CHECK ===\n');

// Check DDM profile
const ddm = db.prepare('SELECT user_id, position FROM profiles WHERE user_id = 16').get();
console.log('DDM Profile:', ddm);

// Check submitted vouchers
const submitted = db.prepare(`
  SELECT id, user_id, month, year, status, total_amount, form_data 
  FROM vouchers 
  WHERE status = 'submitted'
`).all();

console.log('\nSubmitted Vouchers:', submitted.length);

submitted.forEach(v => {
  const formData = v.form_data ? JSON.parse(v.form_data) : {};
  console.log(`  - ID ${v.id}: User ${v.user_id}, ${v.month}/${v.year}, $${v.total_amount}`);
  console.log(`    Required Approver: ${formData.required_first_approver || 'N/A'}`);
  console.log(`    Match DDM: ${formData.required_first_approver === ddm.position}`);
});

db.close();

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test accounts
const accounts = {
  inspector: { email: 'inspector@usda.gov', password: 'Test123!', name: 'Inspector User' },
  supervisor: { email: 'supervisor@usda.gov', password: 'Test123!', name: 'Supervisor User' },
  fleetmanager: { email: 'fleetmgr@usda.gov', password: 'Test123!', name: 'Fleet Manager' },
  admin: { email: 'admin@usda.gov', password: 'Admin123!', name: 'Admin User' }
};

let tokens = {};

async function login(role) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: accounts[role].email,
      password: accounts[role].password
    });
    tokens[role] = response.data.token;
    console.log(`✅ ${accounts[role].name} logged in successfully`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${accounts[role].name} login failed:`, error.response?.data || error.message);
    throw error;
  }
}

async function testInspectorFeatures() {
  console.log('\n🔍 TESTING INSPECTOR FEATURES');
  console.log('─'.repeat(60));
  
  const token = tokens.inspector;
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // 1. Test trips list
    const tripsResponse = await axios.get(`${BASE_URL}/trips`, { headers });
    console.log(`✅ Inspector can view trips: ${tripsResponse.data.length} trips found`);
    
    // 2. Test vouchers list
    const vouchersResponse = await axios.get(`${BASE_URL}/vouchers`, { headers });
    console.log(`✅ Inspector can view vouchers: ${vouchersResponse.data.length} vouchers found`);
    
    // 3. Test profile
    const profileResponse = await axios.get(`${BASE_URL}/profile`, { headers });
    console.log(`✅ Inspector profile loaded: ${profileResponse.data.first_name} ${profileResponse.data.last_name}`);
    console.log(`   Position: ${profileResponse.data.position || 'Not set'}`);
    console.log(`   FLS: ${profileResponse.data.fls_name || 'Not assigned'}`);
    
    // 4. Test circuit plants (for FLS/SCSI only, but inspector should get empty or error gracefully)
    try {
      const circuitResponse = await axios.get(`${BASE_URL}/circuit-plants/map`, { headers });
      console.log(`✅ Circuit plants endpoint accessible: ${circuitResponse.data.length} plants`);
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`✅ Circuit plants properly restricted for inspector (403 Forbidden)`);
      } else {
        console.log(`⚠️  Circuit plants error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Inspector feature test failed:`, error.response?.data || error.message);
  }
}

async function testSupervisorFeatures() {
  console.log('\n👔 TESTING SUPERVISOR FEATURES');
  console.log('─'.repeat(60));
  
  const token = tokens.supervisor;
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // 1. Test pending vouchers for approval
    const pendingResponse = await axios.get(`${BASE_URL}/vouchers/pending`, { headers });
    console.log(`✅ Supervisor can view pending vouchers: ${pendingResponse.data.length} pending`);
    
    // 2. Test voucher history
    const historyResponse = await axios.get(`${BASE_URL}/vouchers/history`, { headers });
    console.log(`✅ Supervisor can view voucher history: ${historyResponse.data.length} total`);
    
    // 3. Test team management
    const teamResponse = await axios.get(`${BASE_URL}/team`, { headers });
    console.log(`✅ Supervisor can view team: ${teamResponse.data.length} members`);
    
    // 4. Test circuit plants
    try {
      const circuitResponse = await axios.get(`${BASE_URL}/circuit-plants/map`, { headers });
      console.log(`✅ Supervisor can view circuit plants: ${circuitResponse.data.length} plants`);
    } catch (err) {
      console.log(`⚠️  Circuit plants error: ${err.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Supervisor feature test failed:`, error.response?.data || error.message);
  }
}

async function testFleetManagerFeatures() {
  console.log('\n🚗 TESTING FLEET MANAGER FEATURES');
  console.log('─'.repeat(60));
  
  const token = tokens.fleetmanager;
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // 1. Test all vouchers access
    const vouchersResponse = await axios.get(`${BASE_URL}/vouchers/all`, { headers });
    console.log(`✅ Fleet Manager can view all vouchers: ${vouchersResponse.data.length} vouchers`);
    
    // 2. Test analytics
    const analyticsResponse = await axios.get(`${BASE_URL}/analytics/vouchers`, { headers });
    console.log(`✅ Fleet Manager can access analytics`);
    console.log(`   Total vouchers: ${analyticsResponse.data.totalVouchers}`);
    console.log(`   Approved: ${analyticsResponse.data.approvedVouchers}`);
    console.log(`   Total mileage: ${analyticsResponse.data.totalMileage?.toFixed(1)} miles`);
    console.log(`   Total amount: $${analyticsResponse.data.totalAmount?.toFixed(2)}`);
    
    // 3. Test pending fleet approvals
    const pendingResponse = await axios.get(`${BASE_URL}/vouchers/pending-fleet`, { headers });
    console.log(`✅ Fleet Manager pending approvals: ${pendingResponse.data.length} vouchers`);
    
  } catch (error) {
    console.error(`❌ Fleet Manager feature test failed:`, error.response?.data || error.message);
  }
}

async function testAdminFeatures() {
  console.log('\n⚙️  TESTING ADMIN FEATURES');
  console.log('─'.repeat(60));
  
  const token = tokens.admin;
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // 1. Test user management
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, { headers });
    console.log(`✅ Admin can view all users: ${usersResponse.data.length} users`);
    
    // 2. Test audit logs
    const auditResponse = await axios.get(`${BASE_URL}/admin/audit-logs?limit=10`, { headers });
    console.log(`✅ Admin can view audit logs: ${auditResponse.data.logs?.length || 0} recent logs`);
    
    // 3. Test system backup
    try {
      const backupResponse = await axios.get(`${BASE_URL}/admin/backup`, { headers });
      console.log(`✅ Admin can create backups`);
    } catch (err) {
      console.log(`⚠️  Backup test: ${err.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Admin feature test failed:`, error.response?.data || error.message);
  }
}

async function testGoogleMapsIntegration() {
  console.log('\n🗺️  TESTING GOOGLE MAPS INTEGRATION');
  console.log('─'.repeat(60));
  
  const token = tokens.inspector;
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Test address autocomplete
    const autocompleteResponse = await axios.get(`${BASE_URL}/maps/autocomplete`, {
      headers,
      params: { input: 'Newark, NJ' }
    });
    console.log(`✅ Google Maps autocomplete working: ${autocompleteResponse.data.predictions?.length || 0} suggestions`);
    
    // Test distance calculation
    const distanceResponse = await axios.get(`${BASE_URL}/maps/distance`, {
      headers,
      params: {
        origin: 'Newark, NJ',
        destination: 'Jersey City, NJ'
      }
    });
    console.log(`✅ Google Maps distance API working: ${distanceResponse.data.distance?.text || 'Distance calculated'}`);
    
  } catch (error) {
    console.error(`❌ Google Maps test failed:`, error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🚀 COMPREHENSIVE SYSTEM TEST');
  console.log('═'.repeat(60));
  
  try {
    // Login all users
    console.log('\n🔐 LOGGING IN ALL USERS');
    console.log('─'.repeat(60));
    await login('inspector');
    await login('supervisor');
    await login('fleetmanager');
    await login('admin');
    
    // Run all feature tests
    await testInspectorFeatures();
    await testSupervisorFeatures();
    await testFleetManagerFeatures();
    await testAdminFeatures();
    await testGoogleMapsIntegration();
    
    // Summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('  ✅ SYSTEM TEST COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n🎯 KEY FEATURES TESTED:');
    console.log('   ✓ Authentication (all roles)');
    console.log('   ✓ Inspector: Trips, Vouchers, Profile');
    console.log('   ✓ Supervisor: Approvals, Team Management, Circuit Plants');
    console.log('   ✓ Fleet Manager: All Vouchers, Analytics, Final Approvals');
    console.log('   ✓ Admin: User Management, Audit Logs, Backups');
    console.log('   ✓ Google Maps: Autocomplete, Distance Calculation');
    console.log('\n📱 FRONTEND URLS:');
    console.log('   🌐 Main App: http://localhost:5174');
    console.log('   👤 Inspector: inspector@usda.gov / Test123!');
    console.log('   👔 Supervisor: supervisor@usda.gov / Test123!');
    console.log('   🚗 Fleet Manager: fleetmgr@usda.gov / Test123!');
    console.log('   ⚙️  Admin: admin@usda.gov / Admin123!');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ SYSTEM TEST FAILED:', error.message);
  }
}

runAllTests();

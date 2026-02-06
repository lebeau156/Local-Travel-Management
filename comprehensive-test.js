const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
let testResults = [];
let tokens = {};

// Color output for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function addResult(category, test, status, details = '') {
  testResults.push({ category, test, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${category}: ${test} ${details}`, color);
}

// Test 1: Server Health Check
async function testServerHealth() {
  log('\n═══════ Testing Server Health ═══════', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (response.status === 200) {
      addResult('Server', 'Health Check', 'PASS', '- Server is responding');
      return true;
    }
  } catch (error) {
    addResult('Server', 'Health Check', 'FAIL', `- ${error.message}`);
    return false;
  }
}

// Test 2: Authentication
async function testAuthentication() {
  log('\n═══════ Testing Authentication ═══════', 'blue');
  
  const testUsers = [
    { role: 'admin', email: 'admin@usda.gov', password: 'admin123' },
    { role: 'inspector', email: 'inspector@usda.gov', password: 'Test123!' },
    { role: 'supervisor', email: 'supervisor@usda.gov', password: 'Test123!' },
    { role: 'fleet_manager', email: 'fleetmgr@usda.gov', password: 'Test123!' },
    { role: 'fls', email: 'fls@usda.gov', password: 'Test123!' },
    { role: 'ddm', email: 'ddm@usda.gov', password: 'Test123!' },
    { role: 'dm', email: 'dm@usda.gov', password: 'Test123!' }
  ];

  for (const user of testUsers) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      if (response.data.token) {
        tokens[user.role] = response.data.token;
        addResult('Auth', `${user.role.toUpperCase()} Login`, 'PASS', `- Token received`);
      } else {
        addResult('Auth', `${user.role.toUpperCase()} Login`, 'FAIL', '- No token returned');
      }
    } catch (error) {
      addResult('Auth', `${user.role.toUpperCase()} Login`, 'FAIL', `- ${error.response?.data?.error || error.message}`);
    }
  }
}

// Test 3: Dashboard Endpoints
async function testDashboards() {
  log('\n═══════ Testing Dashboard Endpoints ═══════', 'blue');
  
  const dashboardTests = [
    { name: 'FLS Dashboard Stats', endpoint: '/supervisors/fls-dashboard-stats', token: 'fls' },
    { name: 'DDM Dashboard Stats', endpoint: '/supervisors/ddm-dashboard-stats', token: 'ddm' },
    { name: 'DM Dashboard Stats', endpoint: '/supervisors/dm-dashboard-stats', token: 'dm' }
  ];

  for (const test of dashboardTests) {
    try {
      const token = tokens[test.token] || tokens.admin;
      const response = await axios.get(`${BASE_URL}${test.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200 && response.data) {
        const keys = Object.keys(response.data);
        addResult('Dashboard', test.name, 'PASS', `- ${keys.length} metrics returned`);
      } else {
        addResult('Dashboard', test.name, 'FAIL', '- Invalid response');
      }
    } catch (error) {
      addResult('Dashboard', test.name, 'FAIL', `- ${error.response?.status || error.message}`);
    }
  }
}

// Test 4: Core API Endpoints
async function testCoreEndpoints() {
  log('\n═══════ Testing Core API Endpoints ═══════', 'blue');
  
  const endpoints = [
    { name: 'User Profile', method: 'GET', endpoint: '/profile', token: 'inspector' },
    { name: 'Trips List', method: 'GET', endpoint: '/trips', token: 'inspector' },
    { name: 'Vouchers List', method: 'GET', endpoint: '/vouchers', token: 'inspector' },
    { name: 'Supervisors List', method: 'GET', endpoint: '/supervisors/list', token: 'admin' },
    { name: 'Circuit Plants', method: 'GET', endpoint: '/circuit-plants', token: 'fls' },
    { name: 'Mileage Rates', method: 'GET', endpoint: '/mileage-rates', token: 'admin' },
    { name: 'System Config', method: 'GET', endpoint: '/system-config', token: 'admin' },
    { name: 'Audit Logs', method: 'GET', endpoint: '/audit?limit=10', token: 'admin' },
    { name: 'Analytics Overview', method: 'GET', endpoint: '/analytics/overview', token: 'fleet_manager' }
  ];

  for (const test of endpoints) {
    try {
      const token = tokens[test.token] || tokens.admin;
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.endpoint}`,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        addResult('API', test.name, 'PASS', `- ${test.method} ${response.status}`);
      } else {
        addResult('API', test.name, 'FAIL', `- Unexpected status ${response.status}`);
      }
    } catch (error) {
      addResult('API', test.name, 'FAIL', `- ${error.response?.status || error.message}`);
    }
  }
}

// Test 5: Database Integrity
async function testDatabase() {
  log('\n═══════ Testing Database Integrity ═══════', 'blue');
  
  try {
    const { db } = require('./backend/src/models/database');
    
    const tables = [
      'users', 'profiles', 'trips', 'vouchers', 'audit_log',
      'circuit_plants', 'assignment_requests', 'mileage_rates',
      'attachments', 'system_config'
    ];
    
    for (const table of tables) {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        addResult('Database', `Table: ${table}`, 'PASS', `- ${result.count} records`);
      } catch (error) {
        addResult('Database', `Table: ${table}`, 'FAIL', `- ${error.message}`);
      }
    }
  } catch (error) {
    addResult('Database', 'Connection', 'FAIL', `- ${error.message}`);
  }
}

// Test 6: Google Maps API
async function testGoogleMapsAPI() {
  log('\n═══════ Testing Google Maps API ═══════', 'blue');
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    addResult('Google Maps', 'API Key', 'WARN', '- Not configured in environment');
    return;
  }
  
  addResult('Google Maps', 'API Key', 'PASS', `- Key loaded (${apiKey.substring(0, 20)}...)`);
  
  // Test API endpoint availability
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Washington,DC&key=${apiKey}`,
      { timeout: 5000 }
    );
    
    if (response.data.status === 'OK') {
      addResult('Google Maps', 'API Functionality', 'PASS', '- Geocoding works');
    } else {
      addResult('Google Maps', 'API Functionality', 'FAIL', `- Status: ${response.data.status}`);
    }
  } catch (error) {
    addResult('Google Maps', 'API Functionality', 'FAIL', `- ${error.message}`);
  }
}

// Test 7: File System Checks
async function testFileSystem() {
  log('\n═══════ Testing File System ═══════', 'blue');
  
  const directories = [
    { path: './backend/data', name: 'Database Directory' },
    { path: './backend/uploads', name: 'Uploads Directory' },
    { path: './backend/src', name: 'Backend Source' },
    { path: './frontend/src', name: 'Frontend Source' }
  ];
  
  for (const dir of directories) {
    if (fs.existsSync(dir.path)) {
      addResult('File System', dir.name, 'PASS', `- ${dir.path}`);
    } else {
      addResult('File System', dir.name, 'WARN', `- ${dir.path} not found`);
    }
  }
}

// Test 8: Security Headers
async function testSecurity() {
  log('\n═══════ Testing Security Configuration ═══════', 'blue');
  
  try {
    // Test CORS
    const response = await axios.get(`${BASE_URL}/health`);
    const corsHeader = response.headers['access-control-allow-origin'];
    
    if (corsHeader) {
      addResult('Security', 'CORS Headers', 'PASS', `- ${corsHeader}`);
    } else {
      addResult('Security', 'CORS Headers', 'WARN', '- No CORS headers found');
    }
    
    // Test unauthorized access
    try {
      await axios.get(`${BASE_URL}/admin/users`);
      addResult('Security', 'Auth Protection', 'FAIL', '- Admin route accessible without token');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        addResult('Security', 'Auth Protection', 'PASS', '- Protected routes secured');
      } else {
        addResult('Security', 'Auth Protection', 'WARN', `- Unexpected response: ${error.response?.status}`);
      }
    }
  } catch (error) {
    addResult('Security', 'Test Failed', 'FAIL', `- ${error.message}`);
  }
}

// Generate Report
function generateReport() {
  log('\n═══════════════════════════════════════', 'blue');
  log('        TEST RESULTS SUMMARY           ', 'blue');
  log('═══════════════════════════════════════\n', 'blue');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const warnings = testResults.filter(r => r.status === 'WARN').length;
  const total = testResults.length;
  
  log(`Total Tests: ${total}`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');
  
  const passRate = ((passed / total) * 100).toFixed(1);
  log(`\nPass Rate: ${passRate}%`, passRate >= 90 ? 'green' : 'yellow');
  
  // Save detailed report to file
  const reportContent = `
# Comprehensive Test Report
**Date:** ${new Date().toISOString()}
**Total Tests:** ${total}
**Passed:** ${passed}
**Failed:** ${failed}
**Warnings:** ${warnings}
**Pass Rate:** ${passRate}%

## Detailed Results

| Category | Test | Status | Details |
|----------|------|--------|---------|
${testResults.map(r => `| ${r.category} | ${r.test} | ${r.status} | ${r.details} |`).join('\n')}

## Summary by Category

${Object.entries(
  testResults.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = { PASS: 0, FAIL: 0, WARN: 0 };
    acc[r.category][r.status]++;
    return acc;
  }, {})
).map(([cat, counts]) => `
### ${cat}
- Passed: ${counts.PASS || 0}
- Failed: ${counts.FAIL || 0}
- Warnings: ${counts.WARN || 0}
`).join('\n')}

## Recommendations

${failed > 0 ? '⚠️ **CRITICAL**: Fix all failed tests before deployment!' : '✅ All critical tests passed!'}
${warnings > 0 ? `⚠️ Review ${warnings} warning(s) before production deployment.` : '✅ No warnings detected.'}
${passRate >= 95 ? '✅ System is ready for deployment!' : '⚠️ Additional testing recommended.'}

## Next Steps

${failed > 0 ? '1. Review and fix all failed tests\n2. Re-run comprehensive testing\n3. Verify fixes' : '1. Proceed with production configuration\n2. Build frontend for production\n3. Prepare deployment package'}
`;

  fs.writeFileSync('TEST_REPORT.md', reportContent);
  log('\n📄 Detailed report saved to TEST_REPORT.md', 'blue');
  
  if (failed > 0) {
    log('\n⚠️  CRITICAL ISSUES DETECTED - Review failed tests!', 'red');
  } else if (warnings > 0) {
    log('\n✅ All tests passed with some warnings', 'yellow');
  } else {
    log('\n🎉 ALL TESTS PASSED! System is ready for deployment!', 'green');
  }
}

// Main Test Runner
async function runAllTests() {
  log('═══════════════════════════════════════', 'blue');
  log('   COMPREHENSIVE SYSTEM TESTING', 'blue');
  log('═══════════════════════════════════════', 'blue');
  log(`Started at: ${new Date().toLocaleString()}\n`, 'blue');
  
  try {
    // Run all test suites
    await testServerHealth();
    await testAuthentication();
    await testDashboards();
    await testCoreEndpoints();
    await testDatabase();
    await testGoogleMapsAPI();
    await testFileSystem();
    await testSecurity();
    
    // Generate final report
    generateReport();
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests
runAllTests().catch(console.error);

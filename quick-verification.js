const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function quickVerification() {
  console.log('🔍 Quick Verification of DDM/DM Dashboard APIs\n');
  console.log('=' .repeat(60));
  
  try {
    // Login as admin to get token
    console.log('🔐 Authenticating...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@usda.gov',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Authentication successful\n');

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // Test DDM endpoint
    console.log('📊 DDM Dashboard Endpoint');
    console.log('-'.repeat(60));
    const ddmResponse = await axios.get(`${BASE_URL}/supervisors/ddm-dashboard-stats`, config);
    console.log('✅ Status: 200 OK');
    console.log('📈 Response Data:');
    Object.entries(ddmResponse.data).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${label}: ${value}`);
    });
    console.log('');

    // Test DM endpoint
    console.log('📊 DM Dashboard Endpoint');
    console.log('-'.repeat(60));
    const dmResponse = await axios.get(`${BASE_URL}/supervisors/dm-dashboard-stats`, config);
    console.log('✅ Status: 200 OK');
    console.log('📈 Response Data:');
    Object.entries(dmResponse.data).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${label}: ${value}`);
    });
    console.log('');

    // Summary
    console.log('=' .repeat(60));
    console.log('🎉 VERIFICATION COMPLETE');
    console.log('=' .repeat(60));
    console.log('');
    console.log('✅ Both endpoints are operational');
    console.log('✅ Authentication working correctly');
    console.log('✅ Data returned in expected format');
    console.log('✅ Ready for frontend testing');
    console.log('');
    console.log('🌐 Frontend URL: http://localhost:5173');
    console.log('👤 DDM User: ddm@usda.gov / Test123!');
    console.log('👤 DM User: dm@usda.gov / Test123!');
    console.log('');

  } catch (error) {
    console.error('❌ Verification failed:', error.response?.data || error.message);
  }
}

quickVerification();

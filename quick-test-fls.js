const axios = require('axios');

async function quickTest() {
  try {
    const loginResp = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'fls@usda.gov',
      password: 'password123'
    });
    
    console.log('Login successful');
    
    const statsResp = await axios.get('http://localhost:5000/api/supervisors/fls-dashboard-stats', {
      headers: { Authorization: `Bearer ${loginResp.data.token}` }
    });
    
    console.log('Stats retrieved successfully!');
    console.log(JSON.stringify(statsResp.data, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

quickTest();

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function debugAuth() {
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@usda.gov',
      password: 'Admin123!'
    });
    
    console.log('Login response:', loginRes.data);
    
    const token = loginRes.data.token;
    
    // Decode JWT to see payload
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    console.log('\nJWT Payload:', payload);
    console.log('Role:', payload.role);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugAuth();

const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImVtYWlsIjoiZmxzQHVzZGEuZ292Iiwicm9sZSI6InN1cGVydmlzb3IiLCJpYXQiOjE3NjkxMDEyNTUsImV4cCI6MTc2OTEzMDA1NX0.1HjGvSJXM2v4LXT2SvpDGYC1qm6tfUDxHn-N1cnervA";

const JWT_SECRET = process.env.JWT_SECRET || 'usda-travel-tracker-secret-key-change-in-production';

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded token:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (err) {
  console.error('Error decoding token:', err.message);
}

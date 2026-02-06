const fs = require('fs');
const path = require('path');

// Google Maps API Key (CORRECTED - lowercase L not uppercase I)
const apiKey = 'AIzaSyC3_l50rfef-IX8-1cDeLi4zzM0As32TcU';

// Path to .env file
const envPath = path.join(__dirname, 'backend', 'src', '.env');

// Create .env file content
const envContent = `GOOGLE_MAPS_API_KEY=${apiKey}\n`;

// Write to .env file
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ .env file created successfully at:', envPath);
  console.log('📝 Content:', envContent.trim());
  console.log('\n🔄 Next step: Restart the backend server');
  console.log('   Run: cd backend/src && node server.js');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Manual setup required:');
  console.log('1. Create file: backend/src/.env');
  console.log('2. Add this line:');
  console.log(`   GOOGLE_MAPS_API_KEY=${apiKey}`);
}

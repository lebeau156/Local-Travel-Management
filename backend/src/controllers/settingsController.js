const fs = require('fs');
const path = require('path');
const { calculateMileage } = require('../utils/mileageCalculator');

// Get current settings status
exports.getSettings = (req, res) => {
  try {
    const hasGoogleMapsKey = !!process.env.GOOGLE_MAPS_API_KEY;
    
    // Return masked API key (first 10 chars) for display purposes only
    let apiKeyPreview = '';
    if (hasGoogleMapsKey && process.env.GOOGLE_MAPS_API_KEY) {
      const key = process.env.GOOGLE_MAPS_API_KEY;
      apiKeyPreview = key.substring(0, 10) + '...' + key.substring(key.length - 4);
    }
    
    res.json({
      success: true,
      googleMapsApiStatus: hasGoogleMapsKey ? 'active' : 'mock',
      settings: {
        port: process.env.PORT || 5000,
        hasGoogleMapsKey: hasGoogleMapsKey,
        apiKeyPreview: apiKeyPreview
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Save Google Maps API key to .env file
exports.saveGoogleMapsKey = (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Read current .env file or create new one
    const envPath = path.join(__dirname, '../../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add GOOGLE_MAPS_API_KEY
    const lines = envContent.split('\n');
    let keyUpdated = false;
    
    const updatedLines = lines.map(line => {
      if (line.startsWith('GOOGLE_MAPS_API_KEY=')) {
        keyUpdated = true;
        return `GOOGLE_MAPS_API_KEY=${apiKey}`;
      }
      return line;
    });

    // If key wasn't found, add it
    if (!keyUpdated) {
      updatedLines.push(`GOOGLE_MAPS_API_KEY=${apiKey}`);
    }

    // Write back to .env
    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');

    // Note: This doesn't update process.env in current session
    // Server needs to be restarted
    
    res.json({
      success: true,
      message: 'Google Maps API key saved. Please restart the backend server for changes to take effect.',
      requiresRestart: true
    });
  } catch (error) {
    console.error('Save API key error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Test Google Maps API
exports.testGoogleMapsApi = async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const result = await calculateMileage(origin, destination);

    if (result.usedMock) {
      return res.status(200).json({
        success: false,
        message: 'Google Maps API is not configured or failed. Using mock mileage.',
        miles: result.miles,
        usedMock: true,
        error: result.error || 'No API key configured'
      });
    }

    res.json({
      success: true,
      message: 'Google Maps API is working correctly',
      miles: result.miles,
      usedMock: false,
      origin,
      destination
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Google Maps API key for frontend (only for authenticated users)
// Note: This is safe because the API key should be restricted in Google Cloud Console
exports.getGoogleMapsApiKey = (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
    console.log('🗺️  getGoogleMapsApiKey called');
    console.log('   process.env.GOOGLE_MAPS_API_KEY:', apiKey ? `${apiKey.substring(0, 20)}...` : 'EMPTY');
    
    // Prevent caching to ensure latest key is always fetched
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      success: true,
      apiKey: apiKey, // Can be empty string
      hasKey: !!apiKey
    });
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({ error: error.message });
  }
};

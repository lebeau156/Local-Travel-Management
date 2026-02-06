const axios = require('axios');

// Geocoding service using Google Maps Geocoding API
class GeocodingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  }

  async geocodeAddress(address, city, state, zipCode) {
    try {
      if (!this.apiKey) {
        console.warn('⚠️  Google Maps API key not configured');
        return null;
      }

      // Build full address
      const fullAddress = `${address}, ${city}, ${state} ${zipCode || ''}`.trim();
      
      const url = `${this.baseUrl}?address=${encodeURIComponent(fullAddress)}&key=${this.apiKey}`;
      
      console.log(`🗺️  Geocoding: ${fullAddress}`);
      
      const response = await axios.get(url);
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        console.log(`  ✓ Found: ${location.lat}, ${location.lng}`);
        
        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: response.data.results[0].formatted_address
        };
      } else {
        console.log(`  ✗ Geocoding failed: ${response.data.status}`);
        return null;
      }
    } catch (error) {
      console.error(`  ✗ Geocoding error: ${error.message}`);
      return null;
    }
  }

  async bulkGeocode(addresses) {
    const results = [];
    
    for (let i = 0; i < addresses.length; i++) {
      const { address, city, state, zipCode } = addresses[i];
      const result = await this.geocodeAddress(address, city, state, zipCode);
      
      results.push({
        ...addresses[i],
        ...result
      });
      
      // Add delay to avoid rate limiting (50 requests per second max)
      if (i < addresses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 10 requests/second
      }
    }
    
    return results;
  }
}

module.exports = new GeocodingService();

// Google Maps API Loader
// This script loads Google Maps JavaScript API with Places library
// Fetches API key from backend if user is authenticated

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let isLoading = false;
let isLoaded = false;
let loadAttempted = false;

export const loadGoogleMapsScript = async (): Promise<void> => {
  return new Promise(async (resolve) => {
    console.log('🗺️  loadGoogleMapsScript called');
    console.log('   isLoaded:', isLoaded);
    console.log('   loadAttempted:', loadAttempted);
    console.log('   window.google?.maps?.places:', !!window.google?.maps?.places);
    
    // Already loaded
    if (isLoaded || window.google?.maps?.places) {
      console.log('   ✅ Google Maps already loaded, skipping');
      isLoaded = true;
      resolve();
      return;
    }

    // Already loading
    if (isLoading) {
      console.log('   ⏳ Google Maps already loading, waiting...');
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          isLoaded = true;
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
          console.log('   ⚠️  Google Maps API loading timeout');
        }
        resolve(); // Don't reject, just continue without it
      }, 10000); // Increased timeout to 10 seconds
      return;
    }

    // Don't try multiple times if it fails
    if (loadAttempted) {
      console.log('   ⚠️  Google Maps load already attempted, skipping');
      resolve();
      return;
    }

    isLoading = true;
    loadAttempted = true;

    try {
      // Fetch API key from backend
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log('   🔑 Token found:', !!token);
      
      if (!token) {
        console.log('   ⚠️  No auth token found, trying without authentication...');
      }
      
      console.log('   📡 Fetching API key from backend...');
      const response = await axios.get(`${API_URL}/settings/google-maps-api-key`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5000 // 5 second timeout
      });
      
      const apiKey = response.data.apiKey || '';
      console.log('   📦 API key received:', apiKey ? `${apiKey.substring(0, 20)}... (length: ${apiKey.length})` : 'EMPTY');
      
      if (!apiKey) {
        console.log('   ❌ No API key available - Google Maps autocomplete will not work');
        console.log('   💡 Configure Google Maps API key in Settings to enable autocomplete');
        isLoading = false;
        resolve();
        return;
      }

      const script = document.createElement('script');
      const libraries = 'places,geometry'; // Added geometry library for distance calculations
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&callback=initGoogleMaps`;
      console.log('   🔄 Loading Google Maps API script...');
      
      script.async = true;
      script.defer = true;

      // Create callback function
      (window as any).initGoogleMaps = () => {
        isLoaded = true;
        isLoading = false;
        console.log('   ✅ Google Maps API loaded successfully');
        console.log('   ✅ Places library available:', !!window.google?.maps?.places);
        console.log('   ✅ Autocomplete enabled');
        resolve();
      };

      script.onerror = (error) => {
        isLoading = false;
        console.log('   ❌ Google Maps API failed to load');
        console.log('   Error:', error);
        console.log('   💡 This may be due to an invalid API key or network issues');
        resolve(); // Don't reject, just continue without it
      };

      document.head.appendChild(script);
      
      // Timeout fallback
      setTimeout(() => {
        if (!isLoaded && isLoading) {
          isLoading = false;
          console.log('   ⏱️  Google Maps loading timed out after 10 seconds');
          resolve();
        }
      }, 10000);
      
    } catch (error: any) {
      isLoading = false;
      console.log('   ❌ Could not fetch API key from backend');
      console.log('   Error:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
      console.log('   💡 Make sure you are logged in and the backend is running');
      resolve(); // Don't reject, just continue without it
    }
  });
};

// TypeScript type definitions for Google Maps
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: any;
          AutocompleteService: any;
          PlacesService: any;
        };
        LatLng: any;
        Map: any;
        Marker: any;
        geometry?: {
          spherical?: any;
        };
      };
    };
    initGoogleMaps?: () => void;
  }
}

export {};

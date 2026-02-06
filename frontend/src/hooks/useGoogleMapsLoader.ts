// Custom Google Maps loader hook
import { useState, useEffect } from 'react';

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const useGoogleMapsLoader = (apiKey: string) => {
  const [loaded, setLoaded] = useState(isLoaded);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If already loaded, just update state
    if (isLoaded) {
      setLoaded(true);
      return;
    }

    // If currently loading, wait for the promise
    if (isLoading && loadPromise) {
      loadPromise.then(() => setLoaded(true)).catch((err) => setError(err));
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for it to load...');
      // Wait for window.google to be available
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogle);
          isLoaded = true;
          setLoaded(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google) {
          setError(new Error('Google Maps failed to load'));
        }
      }, 10000); // 10 second timeout
      return;
    }

    // Start loading
    isLoading = true;
    loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully');
        isLoaded = true;
        isLoading = false;
        setLoaded(true);
        resolve();
      };

      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script');
        isLoading = false;
        const err = new Error('Failed to load Google Maps');
        setError(err);
        reject(err);
      };

      document.head.appendChild(script);
    });
  }, [apiKey]);

  return { isLoaded: loaded, error };
};

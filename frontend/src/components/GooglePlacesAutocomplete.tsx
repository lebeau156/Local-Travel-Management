import React, { useEffect, useRef, useState } from 'react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = '',
  label = '',
  required = false,
  disabled = false,
  id = `google-autocomplete-${Math.random().toString(36).substring(7)}`,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [hasGoogleApi, setHasGoogleApi] = useState(false);
  const isInitialized = useRef(false);
  const isMounted = useRef(true);

  // Initialize Google Places Autocomplete once
  useEffect(() => {
    isMounted.current = true;

    const checkGoogleApi = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setHasGoogleApi(true);
        return true;
      }
      return false;
    };

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places || isInitialized.current) return;

      try {
        const inputElement = inputRef.current;
        
        // Create autocomplete instance - DO NOT recreate on re-render
        autocompleteRef.current = new google.maps.places.Autocomplete(inputElement, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components', 'geometry'],
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          if (!isMounted.current) return;
          
          const place = autocompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            // Notify parent - React will update the input value via props
            onChange(place.formatted_address);
          }
        });

        isInitialized.current = true;
        console.log(`✅ Google Places Autocomplete initialized for ${id}`);
      } catch (error) {
        console.error('Failed to initialize Google Places Autocomplete:', error);
      }
    };

    // Try immediately
    if (checkGoogleApi()) {
      initAutocomplete();
    } else {
      // Wait for script to load
      const timer = setTimeout(() => {
        if (checkGoogleApi()) {
          initAutocomplete();
        } else {
          console.log('📍 Google Places API not available - using regular input');
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
        isMounted.current = false;
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, []); // Only run once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        />
        {hasGoogleApi && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
            <span title="Google Places Autocomplete enabled">🗺️</span>
          </div>
        )}
      </div>
      {!hasGoogleApi && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 Configure Google Places API in Settings for autocomplete suggestions
        </p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;




import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 1,
  backgroundColor: '#e0e0e0' // Fallback color
};

const center = { lat: 3.1175031, lng: 113.2648667 };
const libraries = ['marker'];

function MapComponent() {
  const [mapError, setMapError] = useState('');
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI',
    libraries,
    onError: (err) => setMapError('Failed to load Google Maps')
  });

  const mapRef = useRef(null);

  useEffect(() => {
    if (isLoaded && !loadError && mapRef.current) {
      try {
        const map = mapRef.current;
        // Your existing map configuration
      } catch (error) {
        setMapError('Map initialization failed');
      }
    }
  }, [isLoaded, loadError]);

  if (loadError) return <div>Error: {mapError}</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={7.2}
      onLoad={(map) => (mapRef.current = map)}
      options={{
        disableDefaultUI: true,
        gestureHandling: 'greedy',
      }}
    />
  );
}

export default MapComponent;
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, Marker, Pin} from '@vis.gl/react-google-maps'
import axios from 'axios';

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

function MapComponent() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("http://localhost:5050/locations/");
        const allFetchedLocations = response.data;

        const isValidLocation = (loc) => {
          const lat = loc.latitude;
          const lng = loc.longitude;
          return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
        };
        const validLocations = allFetchedLocations.filter(isValidLocation);
        const invalidLocations = allFetchedLocations.filter(loc => !isValidLocation(loc));

        if (invalidLocations.length > 0) {
          console.warn(`Found ${invalidLocations.length} invalid location(s) out of ${allFetchedLocations.length}. They will not be displayed:`);
          invalidLocations.forEach((loc, index) => console.warn(` - Invalid Item ${index}:`, loc));
        } else {
          console.log("All fetched locations have valid coordinates.");
        }

        setLocations(validLocations);
        console.log(`Set ${validLocations.length} valid locations to state.`);
      } catch (error) {
        console.error(error);
        setLocations([]);
      }
    };

    fetchLocations();
  }, []);

  // const handleMarkerClick = useCallback((location) => {
  //   setSelectedLocation(location);
  // }, []);

  return (
    <APIProvider apiKey='AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI'>
      <Map
        style={containerStyle}
        defaultCenter={center}
        defaultZoom={7.2}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId='DEMO_MAP_ID' // Do not change for now
      >
        {locations.map((loc) => (
          <AdvancedMarker
            key={loc.id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            title={loc.name}
          >
          </AdvancedMarker>
        ))};
      </Map>
    </APIProvider>
  );
}

export default MapComponent;
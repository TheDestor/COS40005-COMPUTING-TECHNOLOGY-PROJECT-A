import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps'
import axios from 'axios';

const containerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1,
  backgroundColor: '#e0e0e0', // Fallback color
  overflow: 'hidden',
};

const center = { lat: 3.1175031, lng: 113.2648667 };

function MapComponent({ startingPoint, destination, mapType}) {
  const [locations, setLocations] = useState([]);
  // const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const mapInstanceRef = useRef(null); // actual Google Maps Map instance

  // useEffect(() => {
  //   if (mapRef.current) {
  //     mapRef.current.setMapTypeId(mapType);
  //   }
  // }, [mapType]);

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

  useEffect(() => {
    if (!startingPoint || !destination || !window.google || !mapInstanceRef.current) return;

    const directionsService = new window.google.maps.DirectionsService();

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        preserveViewport: true,
      });
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    }

    directionsService.route(
      {
        origin: startingPoint,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          console.log("Route rendered");
        } else {
          console.error('Directions request failed:', status);
          directionsRendererRef.current.setDirections({ routes: [] });
        }
      }
    );
  }, [startingPoint, destination]);

  return (
    <APIProvider apiKey='AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI'>
      <Map
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            mapInstanceRef.current = map.map; // Native Google Maps instance
          }
        }}
        style={containerStyle}
        defaultCenter={center}
        defaultZoom={7.2}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId='DEMO_MAP_ID' // Do not change for now
        mapType={mapType}
      >
        {locations.map((loc) => (
          <AdvancedMarker
            key={loc.id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            title={loc.name}
          />
          
        ))}   
      </Map>
    </APIProvider>
  );
}

export default MapComponent;
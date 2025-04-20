import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps'
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

function MapComponent({ startingPoint, destination, selectedVehicle, mapType }) {
  const [locations, setLocations] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // actual Google Maps Map instance

  const travelModes = {
    Car: 'DRIVING',
    Bus: 'TRANSIT',
    Walking: 'WALKING',
    Bicycle: 'BICYCLING',
    Motorbike: 'DRIVING',
    Flight: 'DRIVING',
  };

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

  function Directions({ startingPoint={startingPoint}, destination={destination} }) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState();
    const [directionsRenderer, setDirectionsRenderer] = useState();
    const [routes, setRoutes] = useState([]);
    const [routesIndex, setRoutesIndex] = useState(0);
    const selected = routes[routesIndex];
    const leg = selected?.legs[0];

    useEffect(() => {
      if(!routesLibrary || !map) return;
      setDirectionsService(new routesLibrary.DirectionsService());
      setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
    }, [routesLibrary, map])

    useEffect(() => {
      if(!directionsService || !directionsRenderer) return;

      directionsService.route({
        origin: startingPoint,
        destination: destination,
        travelMode: travelModes[selectedVehicle] || 'DRIVING',
        provideRouteAlternatives: true,
      }). then(response => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);
      });
    }, [directionsService, directionsRenderer]);

    useEffect(() => {
      if(!directionsRenderer) return;

      directionsRenderer.setRouteIndex(routesIndex);
    }, [routesIndex, directionsRenderer]);

    if(!leg) return null;

    return (
      <div className="directions">
        <h2>{selected?.summary}</h2>
        <p>
          {leg.start_address.split(",")[0]} to {leg.end_address.split(",")[0]}
        </p>
        <p>Distance: {leg.distance?.text}</p>
        <p>Duration: {leg.duration?.text}</p>

        <h2>Other routes</h2>
        <ul>
          {routes.map((route, index) => (
            <li key={route.summary}>
              <button onClick={() => setRoutesIndex(index)}>
                {route.summary}
              </button>
            </li>
          ))}  
        </ul>
      </div>
    );
  }

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
        mapTypeId = {mapType}
      >
        {locations.map((loc) => (
          <AdvancedMarker
            key={loc.id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            title={loc.name}
          />   
        ))} 
        <Directions 
          startingPoint={startingPoint}
          destination={destination}
          travelMode={travelModes[selectedVehicle] || 'DRIVING'}
        />
      </Map>
    </APIProvider>
  );
}

export default MapComponent;
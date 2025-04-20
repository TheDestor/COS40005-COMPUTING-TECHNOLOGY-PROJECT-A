import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps'
import axios from 'axios';
import aeroplaneIcon from '../assets/aeroplane.png';
import MapViewMenu from './MapViewMenu'; // adjust path if needed


// const townCoordinates = {
//   'Kuching': { lat: 1.5535, lon: 110.3593 },
//   'Sibu': { lat: 2.2870, lon: 111.8320 },
//   'Mukah': { lat: 2.8988, lon: 112.0914 },
//   'Serian': { lat: 1.2020, lon: 110.3952 },
//   'Bintulu': { lat: 3.1707, lon: 113.0360 },
//   'Betong': { lat: 1.4075, lon: 111.5400 },
//   'Kota Samarahan': { lat: 1.4591, lon: 110.4883 },
//   'Miri': { lat: 4.3993, lon: 113.9914 },
//   'Kapit': { lat: 2.0167, lon: 112.9333 },
//   'Sri Aman': { lat: 1.2389, lon: 111.4636 },
//   'Sarikei': { lat: 2.1271, lon: 111.5182 },
//   'Limbang': { lat: 4.7500, lon: 115.0000 },
// };

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

function MapComponent({ startingPoint, destination, selectedVehicle, mapType, selectedCategory }) {
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

  // useEffect(() => {
  //   const fetchLocations = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:5050/locations/");
  //       const allFetchedLocations = response.data;

  //       const isValidLocation = (loc) => {
  //         const lat = loc.latitude;
  //         const lng = loc.longitude;
  //         return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
  //       };
  //       const validLocations = allFetchedLocations.filter(isValidLocation);
  //       const invalidLocations = allFetchedLocations.filter(loc => !isValidLocation(loc));

  //       if (invalidLocations.length > 0) {
  //         console.warn(`Found ${invalidLocations.length} invalid location(s) out of ${allFetchedLocations.length}. They will not be displayed:`);
  //         invalidLocations.forEach((loc, index) => console.warn(` - Invalid Item ${index}:`, loc));
  //       } else {
  //         console.log("All fetched locations have valid coordinates.");
  //       }

  //       setLocations(validLocations);
  //       console.log(`Set ${validLocations.length} valid locations to state.`);
  //     } catch (error) {
  //       console.error(error);
  //       setLocations([]);
  //     }
  //   };

  //   fetchLocations();
  // }, []);

  // Testing (console shows the location type is correct, but the locations does not show up on the map)
  const fetchLocations = async (type = 'National Park') => {
    try {
      let url = "http://localhost:5050/locations/";
      if (type !== 'All') {
        url += `?type=${type}`;
      }
  
      const response = await axios.get(url);
      const allFetchedLocations = response.data;
  
      const isValidLocation = (loc) => {
        const lat = loc.latitude;
        const lng = loc.longitude;
        return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
      };
      const validLocations = allFetchedLocations.filter(isValidLocation);
  
      setLocations(validLocations);
      console.log(`Set ${validLocations.length} valid ${type} locations to state.`);
    } catch (error) {
      console.error(error);
      setLocations([]);
    }
  };
  
  useEffect(() => {
    console.log("Fetching locations for category:", selectedCategory); // DEBUG
    fetchLocations(selectedCategory);
  }, [selectedCategory]);

function Directions({ startingPoint={startingPoint}, destination={destination} }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [routesIndex, setRoutesIndex] = useState(0);
  const selected = routes[routesIndex];
  const leg = selected?.legs[0];

  useEffect(() => {
    if(!routesLibrary || !map) return;

    const newService = new routesLibrary.DirectionsService();
    const newRenderer = new google.maps.DirectionsRenderer({ map });

    setDirectionsService(newService);
    setDirectionsRenderer(newRenderer);

    return () => {
      // Cleanup the renderer when the component unmounts or remounts
      newRenderer.setMap(null);
    };
  }, [routesLibrary, map])

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !startingPoint || !destination) return;
  
    const getRoutes = async () => {
      try {
        // Clear previous directions
        directionsRenderer.setDirections({ routes: [] });

        const routeResponse = await directionsService.route({
          origin: startingPoint,
          destination: destination,
          travelMode: travelModes[selectedVehicle] || 'DRIVING',
          provideRouteAlternatives: true,
        });
        
        directionsRenderer.setDirections(routeResponse);
        setRoutes(routeResponse.routes);
        setRoutesIndex(0); // Reset to the first route
      } catch (err) {
        console.error("Error getting directions:", err);
      }
    };
    getRoutes();
  }, [directionsService, directionsRenderer, startingPoint, destination, selectedVehicle]);
  

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
          >
            <img src={aeroplaneIcon} alt="plane" style={{ width: '40px', height: '40px' }}/>   
          </AdvancedMarker>
        ))} 
        
        {/* {filteredLocations.map((loc) => (
        <AdvancedMarker
          key={loc.id}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          title={loc.name}
        >
          <img src={aeroplaneIcon} alt="plane" style={{ width: '40px', height: '40px' }}/>
        </AdvancedMarker>
      ))} */}

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
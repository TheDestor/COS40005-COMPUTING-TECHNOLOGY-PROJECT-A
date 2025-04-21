import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary, useMap, ControlPosition, MapControl, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import axios from 'axios';
import aeroplaneIcon from '../assets/aeroplane.png';
import homestayIcon from '../assets/homestay.png';
import museumIcon from '../assets/museum.png';
import parkIcon from '../assets/national_park.png';
import townIcon from '../assets/town.png';

const townCoordinates = {
  'Kuching': { lat: 1.5535, lng: 110.3593 },
  'Sibu': { lat: 2.2870, lng: 111.8320 },
  'Mukah': { lat: 2.8988, lng: 112.0914 },
  'Serian': { lat: 1.2020, lng: 110.3952 },
  'Bintulu': { lat: 3.1707, lng: 113.0360 },
  'Betong': { lat: 1.4075, lng: 111.5400 },
  'Kota Samarahan': { lat: 1.4591, lng: 110.4883 },
  'Miri': { lat: 4.3993, lng: 113.9914 },
  'Kapit': { lat: 2.0167, lng: 112.9333 },
  'Sri Aman': { lat: 1.2389, lng: 111.4636 },
  'Sarikei': { lat: 2.1271, lng: 111.5182 },
  'Limbang': { lat: 4.7500, lng: 115.0000 },
};

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
const normalizeType = (typeStr) => typeStr?.toLowerCase().replace(/\s+/g, '').trim();

function Directions({ startingPoint={startingPoint}, destination={destination}, selectedVehicle }) {
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
  return null;

  // return (
  //   <div className="directions">
  //     <h2>{selected?.summary}</h2>
  //     <p>
  //       {leg.start_address.split(",")[0]} to {leg.end_address.split(",")[0]}
  //     </p>
  //     <p>Distance: {leg.distance?.text}</p>
  //     <p>Duration: {leg.duration?.text}</p>

  //     <h2>Other routes</h2>
  //     <ul>
  //       {routes.map((route, index) => (
  //         <li key={route.summary}>
  //           <button onClick={() => setRoutesIndex(index)}>
  //             {route.summary}
  //           </button>
  //         </li>
  //       ))}  
  //     </ul>
  //   </div>
  // );
}

function MapComponent({ startingPoint, destination, selectedVehicle, mapType, selectedCategory, selectedPlace, nearbyPlaces =[] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // actual Google Maps Map instance
  const [locations, setLocations] = useState([]);

  const categoryIcons = {
    'Major Town': townIcon,
    'Homestay': homestayIcon,
    'Airport': aeroplaneIcon,
    'Museum': museumIcon,
    'National Park': parkIcon,
    'Seaport': townIcon,
  };

  const travelModes = {
    Car: 'DRIVING',
    Bus: 'TRANSIT',
    Walking: 'WALKING',
    Bicycle: 'BICYCLING',
    Motorbike: 'DRIVING',
    Flight: 'DRIVING',
  };

  useEffect(() => {
    console.log(`MapComponent received category: ${selectedCategory}`);
    const fetchLocations = async () => {
      const type = selectedCategory || 'Museum'; // Default to 'Major Town' if none selected
      console.log(`Fetching locations for type: ${type}`);

      try {
        let fetchedLocations = [];
        if (type === 'Major Town') {
          fetchedLocations = Object.entries(townCoordinates).map(([name, coord]) => ({
            _id: name, // Use name as ID for towns
            name,
            type: 'Major Town',
            lat: coord.lat,
            lng: coord.lng // Ensure lng is used
          }));
          console.log(`Fetched Major Towns:`, fetchedLocations);
        } else {
          // Fetch from API only if not 'Major Town'
          const response = await axios.get("http://localhost:5050/locations"); // Ensure this URL is correct
          const valid = response.data.filter(loc =>
            typeof (loc.lat ?? loc.latitude) === 'number' && // Use nullish coalescing
            typeof (loc.lng ?? loc.longitude) === 'number'
          );
          console.log(`Fetched ${valid.length} valid locations from API`);

          const normalizedSelectedType = normalizeType(type);
          fetchedLocations = type === 'All'
            ? valid
            : valid.filter(loc => {
                const locTypeNormalized = normalizeType(loc.type);
                // console.log(`Comparing: '${locTypeNormalized}' === '${normalizedSelectedType}' for ${loc.name}`);
                return locTypeNormalized === normalizedSelectedType;
              });
        }

        console.log(`Filtered down to ${fetchedLocations.length} locations for type ${type}`);
        console.log('Setting locations state with:', fetchedLocations);
        setLocations([...fetchedLocations]);

      } catch (error) {
        console.error("Error fetching locations:", error);
        setLocations([]); // Clear locations on error
      }
    };

    fetchLocations();
  }, [selectedCategory]); // Re-run ONLY when selectedCategory changes

  const [markerComponents, setMarkerComponents] = useState([]);
  useEffect(() => {
    const markers = locations.map(loc => {
      const lat = Number(loc.lat ?? loc.latitude);
      const lng = Number(loc.lng ?? loc.longitude);
      const iconUrl = categoryIcons[loc.type];

      return (
        <AdvancedMarker
          key={loc._id}
          position={{ lat, lng }}
          title={loc.name}
        >
          <img src={iconUrl} alt={loc.type || 'Marker'} style={{ width: '30px', height: 'auto' }} />
        </AdvancedMarker>
      );
    });

    setMarkerComponents(markers);
  }, [locations]);

  // Log when component renders and how many locations it has
  console.log('Rendering MapComponent. Locations count:', locations.length);

  useEffect(() => {
    console.log('Locations changed:', locations);
  }, [locations]);
  
  return (
    <APIProvider apiKey='AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI'>
      <Map
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            mapInstanceRef.current = map.map; 
          }
        }}
        key={selectedCategory + '-' + locations.length}
        style={containerStyle}
        defaultCenter={center}
        defaultZoom={7.5}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId='e57efe6c5ed679ba' // Do not change for now
        mapTypeId = {mapType}
      >
      {/* Render markers ONLY for the filtered locations */}
      {/* <div key={selectedCategory}> 
  {locations.map((loc) => {
    const lat = Number(loc.lat ?? loc.latitude);
    const lng = Number(loc.lng ?? loc.longitude);

    if (isNaN(lat) || isNaN(lng)) return null;

    const iconUrl = categoryIcons[loc.type] || categoryIcons['Default'];

    return (
      <AdvancedMarker
        key={loc.id}
        position={{ lat, lng }}
        title={loc.name}
      >
        <img src={iconUrl} alt={loc.type || 'Marker'} style={{ width: '30px', height: 'auto' }} />
      </AdvancedMarker>
    );
  })}
</div> */}
{markerComponents}


        {/* Nearby Places */}
        {/* {nearbyPlaces
  .filter((place) => {
    const getPlaceType = (types) => {
      if (types?.includes('airport')) return "Airport";
      if (types?.includes('lodging')) return "Homestay";
      if (types?.includes('museum')) return "Museum";
      if (types?.includes('park')) return "National Park";
      return 'Other';
    };

    const type = getPlaceType(place.types);
    return selectedCategory === 'All' || type === selectedCategory;
  })
  .map((place) => {
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();
    if (!lat || !lng) return null;

    const getPlaceType = (types) => {
      if (types?.includes('airport')) return "Airport";
      if (types?.includes('lodging')) return "Homestay";
      if (types?.includes('museum')) return "Museum";
      if (types?.includes('park')) return "National Park";
      return 'Other';
    };

    const type = getPlaceType(place.types);
    const icon = categoryIcons[type];

    return (
      <AdvancedMarker
        key={place.place_id}
        position={{ lat, lng }}
        title={`Nearby: ${place.name}`}
      >
        <img
          src={icon}
          alt={type}
          style={{ width: '36px', height: '36px' }}
        />
      </AdvancedMarker>
    );
  })} */}

      {/* </div> */}

        <Directions 
          startingPoint={startingPoint}
          destination={destination}
          travelMode={travelModes[selectedVehicle] || 'DRIVING'}
        />
      </Map>
      
      {/* <MapControl position={ControlPosition.TOP}>
        <div className="autocomplete-control">
          <PlaceAutocomplete onPlaceSelect={setSelectedPlaces} />
        </div>
      </MapControl>
      <MapHandler place={selectedPlace} marker={marker} /> */}
    </APIProvider>
  );
}

export default MapComponent;

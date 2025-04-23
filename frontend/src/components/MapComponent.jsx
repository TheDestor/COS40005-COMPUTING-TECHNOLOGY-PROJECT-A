import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary, useMap, ControlPosition, MapControl, useAdvancedMarkerRef, CollisionBehavior } from '@vis.gl/react-google-maps';
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

function Directions({ startingPoint={startingPoint}, destination={destination}, nearbyPlaces=[], selectedVehicle, travelModes, selectedCategory }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [routesIndex, setRoutesIndex] = useState(0);
  const selected = routes[routesIndex];
  const leg = selected?.legs[0];
  const [isRoutesLoaded, setIsRoutesLoaded] = useState(false);

  useEffect(() => {
    if (routesLibrary) setIsRoutesLoaded(true);
  }, [routesLibrary]);

  useEffect(() => {
    if(!routesLibrary || !map) return;

    const newService = new routesLibrary.DirectionsService();
    const newRenderer = new routesLibrary.DirectionsRenderer({ map });

    setDirectionsService(newService);
    setDirectionsRenderer(newRenderer);

    return () => {
      // Cleanup the renderer when the component unmounts or remounts
      newRenderer.setMap(null);
    };
  }, [routesLibrary, map])

  // Fetch and render directions
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    const getRoutes = async () => {
      try {
        // Convert addresses to coordinates if needed
        const geocode = async (input) => {
          if (typeof input === 'string') {
            const geocoder = new window.google.maps.Geocoder();
            const results = await geocoder.geocode({ address: input });
            return results.results[0].geometry.location;
          }
          return input;
        };

        const origin = await geocode(startingPoint);
        const dest = await geocode(destination);

        const response = await directionsService.route({
          origin: origin,
          destination: dest,
          travelMode: selectedVehicle,
          provideRouteAlternatives: true,
        });

        directionsRenderer.setDirections(response);
      } catch (error) {
        console.error('Directions error:', error);
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
  const mapInstanceRef = useRef(null);
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
    if (!selectedCategory) return;
  
    console.log(`MapComponent received category: ${selectedCategory}`);
    fetchLocations(selectedCategory);
  }, [selectedCategory]);
  
  const fetchLocations = async (category) => {
    try {
      let fetchedLocations = [];
  
      if (category === 'Major Town') {
        // Use predefined town coordinates
        fetchedLocations = Object.entries(townCoordinates).map(([name, coord]) => ({
          _id: name,
          name,
          type: 'Major Town',
          lat: coord.lat,
          lng: coord.lng,
        }));
        console.log(`Fetched Major Towns:`, fetchedLocations);
      } else {
        const response = await axios.get("http://localhost:5050/locations");
        const validLocations = response.data.filter((loc) =>
          typeof (loc.lat ?? loc.latitude) === 'number' &&
          typeof (loc.lng ?? loc.longitude) === 'number'
        );
  
        console.log(`Fetched ${validLocations.length} valid locations from API`);
  
        const normalizedSelectedType = normalizeType(category);
  
        fetchedLocations = validLocations.filter((loc) => {
          const locType = normalizeType(loc.type);
          return locType === normalizedSelectedType;
        });
      }
  
      console.log(`Filtered down to ${fetchedLocations.length} locations for type ${category}`);
      setLocations(fetchedLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]); // Clear on error
    }
  };
  
  const normalizeType = (type = '') => {
    const map = {
      'majortown': 'Major Town',
      'homestay': 'Homestay',
      'airport': 'Airport',
      'museum': 'Museum',
      'nationalpark': 'National Park',
      'seaport': 'Seaport',
      'beach': 'Beach',
      'hospital': 'Hospital',
      'event': 'Event',
    };
    return map[type.toLowerCase().replace(/\s/g, '')] || type;
  };

  const getPlaceType = (types) => {
    if (types?.includes('airport')) return "Airport";
    if (types?.includes('lodging')) return "Homestay";
    if (types?.includes('museum')) return "Museum";
    if (types?.includes('park')) return "National Park";
    return 'Other';
  };
  
  
  // const [markerComponents, setMarkerComponents] = useState([]);
  // useEffect(() => {
  //   const markers = locations.map(loc => {
  //     const lat = Number(loc.lat ?? loc.latitude);
  //     const lng = Number(loc.lng ?? loc.longitude);
  //     const normalizedType = normalizeType(loc.type);
  //     const iconUrl = categoryIcons[normalizedType];

  //     return (
  //       <AdvancedMarker
  //         key={loc._id}
  //         position={{ lat, lng }}
  //         title={loc.name}
  //       >
  //         <img src={iconUrl} alt={loc.type || 'Marker'} style={{ width: '30px', height: 'auto' }} />
  //       </AdvancedMarker>
  //     );
  //   });

  //   setMarkerComponents(markers);
  // }, [locations]);

  // Log when component renders and how many locations it has
  // console.log('Rendering MapComponent. Locations count:', locations.length);

  // useEffect(() => {
  //   console.log('Locations changed:', locations);
  // }, [locations]);
  
  return (
    <APIProvider apiKey='AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI'>
      <Map
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            mapInstanceRef.current = map.map; 
          }
        }}
        style={containerStyle}
        defaultCenter={center}
        defaultZoom={7.5}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        // mapId='DEMO_MAP_ID'
        mapId='e57efe6c5ed679ba' // Do not change for now
        mapTypeId = {mapType}
      >
      {/* Render markers ONLY for the filtered locations */}
      {locations.length > 0 &&
          locations.map((loc) => {
            const lat = Number(loc.lat ?? loc.latitude);
            const lng = Number(loc.lng ?? loc.longitude);

            if (isNaN(lat) || isNaN(lng)) {
              console.log(`Skipping invalid coordinates for ${loc.name}`);
              return null;
            }

            const normalizedType = normalizeType(loc.type);
            const iconUrl = categoryIcons[normalizedType];

            console.log(`Rendering marker for ${loc.name}:`, { lat, lng, iconUrl });
            return (
              <AdvancedMarker
                key={loc._id}
                position={{ lat, lng }}
                title={loc.name}
                icon={iconUrl}

                // animation="drop" // Optional: Add animation
              >
              </AdvancedMarker>
            );
          })}

{/* <AdvancedMarker position={{ lat: 1.5535, lng: 110.3593 }} />
<AdvancedMarker position={{lat: 29.5, lng: -81.2}}>
    <img src={townIcon} width={32} height={32} />
  </AdvancedMarker> */}
        
        {/* Nearby Places */}
        {nearbyPlaces.filter((place) => {
          
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
        })}

      {/* </div> */}

        <Directions 
          startingPoint={startingPoint}
          destination={destination}
          selectedVehicle={selectedVehicle}
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

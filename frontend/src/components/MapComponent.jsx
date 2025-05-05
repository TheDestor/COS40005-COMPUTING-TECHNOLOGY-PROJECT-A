import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary, useMap, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { FaUsers, FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import aeroplaneIcon from '../assets/airport.gif';
import homestayIcon from '../assets/homestay.gif';
import museumIcon from '../assets/museum.gif';
import parkIcon from '../assets/nationalpark.gif';
import townIcon from '../assets/majortown.gif';
import seaportIcon from '../assets/seaport.png';
import beachIcon from '../assets/beach.gif';
import eventIcon from '../assets/event.gif';
import restaurantIcon from '../assets/restaurant.png';
import MapViewMenu from './MapViewMenu';
import CustomInfoWindow from './CustomInfoWindow';
import ReviewPage from '../pages/ReviewPage';

const containerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100vh',
  zIndex: 1,
  backgroundColor: '#e0e0e0', // Fallback color
  // overflow: 'hidden',
};

const center = { lat: 3.1175031, lng: 113.2648667 };

function Directions({ startingPoint, destination, addDestinations=[], nearbyPlaces=[], selectedVehicle, travelModes, selectedCategory, onRoutesCalculated, selectedRouteIndex, route }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  // const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [routesIndex, setRoutesIndex] = useState(0);
  const selected = routes[routesIndex];
  const leg = selected?.legs[0];
  const [isRoutesLoaded, setIsRoutesLoaded] = useState(false);

  const routeRenderersRef = useRef([]);

  useEffect(() => {
    console.log("Selected Route Index123:", selectedRouteIndex);
  }, [selectedRouteIndex]);

  useEffect(() => {
    if (routesLibrary) {
      setIsRoutesLoaded(true);
      setDirectionsService(new routesLibrary.DirectionsService());
    }
  }, [routesLibrary]);

  useEffect(() => {
    return () => {
      routeRenderersRef.current.forEach(renderer => renderer.setMap(null));
      routeRenderersRef.current = [];
    };
  }, []);

  const geocode = async (input) => {
    if (typeof input === 'string') {
      if (!input.trim() || input.trim().length < 3) {
        console.warn('Skipping geocode for short input:', input);
        return null;
      }

      const geocoder = new window.google.maps.Geocoder();
      const results = await geocoder.geocode({ address: input });

      if (!results.results || results.results.length === 0) {
        throw new Error('No geocoding results for: ' + input);
      }

      return results.results[0].geometry.location;
    }
    return input;
  };

  useEffect(() => {
    if (!directionsService || !map) return;
  
    const getRoutes = async () => {
      try {
        const origin = await geocode(startingPoint);
        const dest = await geocode(destination);
        const waypoints = await Promise.all(
          addDestinations.map(async (addDest) => ({
            location: await geocode(addDest)
          }))
        );
  
        const response = await directionsService.route({
          origin: origin,
          destination: dest,
          waypoints: waypoints,
          travelMode: selectedVehicle,
          provideRouteAlternatives: true,
        });
  
        setRoutes(response.routes);
  
        // Clear previous route renderers
        routeRenderersRef.current.forEach(renderer => renderer.setMap(null));
        routeRenderersRef.current = [];
  
        // Render all route alternatives with the proper styling
        response.routes.forEach((route, index) => {
          const renderer = new routesLibrary.DirectionsRenderer({
            map,
            directions: response,
            routeIndex: index,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: index === selectedRouteIndex ? '#0057e7' : '	#a7cdf2', // Highlight the selected route
              strokeOpacity: index === selectedRouteIndex ? 1 : 0.5,
              strokeWeight: index === selectedRouteIndex ? 8 : 6,
            },
          });
  
          // Store the renderer in ref for cleanup later
          routeRenderersRef.current.push(renderer);
        });
  
        // Callback with structured data
        if (onRoutesCalculated) {
          onRoutesCalculated({
            routes: response.routes.map(route => ({
              ...route,
              optimizedOrder: route.waypoint_order,
              segments: route.legs.map(leg => ({
                start: leg.start_address,
                end: leg.end_address,
                duration: leg.duration.text,
                distance: leg.distance.text,
              }))
            }))
          });
        }
  
      } catch (error) {
        console.error('Directions error:', error);
      }
    };
  
    getRoutes();
  }, [directionsService, startingPoint, destination, addDestinations, selectedVehicle, map, selectedRouteIndex]);
  
  // useEffect(() => {
  //   if (routesLibrary) setIsRoutesLoaded(true);
  // }, [routesLibrary]);

  // useEffect(() => {
  //   if(!routesLibrary || !map) return;

  //   const newService = new routesLibrary.DirectionsService();
  //   const newRenderer = new routesLibrary.DirectionsRenderer({ map });

  //   setDirectionsService(newService);
  //   setDirectionsRenderer(newRenderer);

  //   return () => {
  //     // Cleanup the renderer when the component unmounts or remounts
  //     newRenderer.setMap(null);
  //   };
  // }, [routesLibrary, map])

  // // Fetch and render directions
  // useEffect(() => {
  //   if (!directionsService || !directionsRenderer) return;

  //   const getRoutes = async () => {
  //     try {
  //       // Convert addresses to coordinates if needed
  //       const geocode = async (input) => {
  //         if (typeof input === 'string') {
  //           if (!input.trim() || input.trim().length < 3) {
  //             console.warn('Skipping geocode for short input:', input);
  //             return null; // Or throw if you want to abort
  //           }

  //           const geocoder = new window.google.maps.Geocoder();
  //           const results = await geocoder.geocode({ address: input });

  //           if (!results.results || results.results.length === 0) {
  //             throw new Error('No geocoding results for: ' + input);
  //           }
            
  //           return results.results[0].geometry.location;
  //         }
  //         return input;
  //       };

  //       const origin = await geocode(startingPoint);
  //       const dest = await geocode(destination);

  //       // Geocode additional destinations
  //       const waypoints = await Promise.all(
  //         addDestinations.map(async (addDest) => ({
  //           location: await geocode(addDest)
  //         }))
  //       );

  //       const response = await directionsService.route({
  //         origin: origin,
  //         destination: dest,
  //         waypoints: waypoints,
  //         travelMode: selectedVehicle,
  //         provideRouteAlternatives: true,
  //       });

  //       directionsRenderer.setDirections(response);
  //       setRoutes(response.routes);

  //       // Pass segmented routes data up to parent
  //       if (onRoutesCalculated) {
  //         onRoutesCalculated({
  //           routes: response.routes.map(route => ({
  //             ...route,
  //             optimizedOrder: route.waypoint_order,
  //             segments: route.legs.map(leg => ({
  //               start: leg.start_address,
  //               end: leg.end_address,
  //               duration: leg.duration.text,
  //               distance: leg.distance.text
  //             }))
  //           }))
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Directions error:', error);
  //     }
  //   };

  //   getRoutes();
  // }, [directionsService, directionsRenderer, startingPoint, destination, addDestinations, selectedVehicle]);
  

  // useEffect(() => {
  //   if(!directionsRenderer) return;

  //   directionsRenderer.setRouteIndex(routesIndex);
  // }, [routesIndex, directionsRenderer]);

  // if(!leg) return null;
  // return null;
}

function MapComponent({ startingPoint, destination, addDestinations=[], selectedVehicle, mapType, selectedCategory, selectedPlace, nearbyPlaces =[], onRoutesCalculated, selectedRouteIndex, routes }) {
  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  // const [locations, setLocations] = useState([]);
  const map = useMap();
  const [markerRef, setMarkerRef] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [activeOption, setActiveOption] = useState('');
  const [showReviewPage, setShowReviewPage] = useState(false);

  // Add this function to handle menu selections
  const handleMenuSelect = async (category, data) => {
    setActiveOption(category);
    
    if (data) {
      // Convert coordinates to numbers and validate
      const validLocations = data
        .filter(loc => !isNaN(loc.latitude) && !isNaN(loc.longitude))
        .map(loc => ({
          ...loc,
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude)
        }));
      
      setLocations(validLocations);
      console.log('Valid locations:', validLocations);
    } else {
      setLocations([]);
    }
  };

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
    
    // Pan to marker position
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: location.latitude, lng: location.longitude });
      mapInstanceRef.current.setZoom(14);
    }
  };

  useEffect(() => {
    if (
      selectedPlace &&
      selectedPlace.geometry &&
      typeof selectedPlace.geometry.location.lat === 'function'
    ) {
      const lat = selectedPlace.geometry.location.lat();
      const lng = selectedPlace.geometry.location.lng();
  
      // Log the coordinates
      console.log("Selected Place Coordinates:", { lat, lng });
  
      // Pan the map to the selected place
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat, lng });
        mapInstanceRef.current.setZoom(14);
      }
    }
  }, [selectedPlace]);
  
  const categoryIcons = {
    'Major Town': townIcon,
    'Homestay': homestayIcon,
    'Airport': aeroplaneIcon,
    'Museum': museumIcon,
    'National Park': parkIcon,
    'Beach': beachIcon,
    'Seaport': seaportIcon,
    'Event': eventIcon,
    'Restaurant': restaurantIcon,
  };

  useEffect(() => {
    console.log('Updated locations:', locations);
  }, [locations]);  
  

  const getPlaceType = (types) => {
    if (types?.includes('airport')) return "Airport";
    if (types?.includes('lodging')) return "Homestay";
    if (types?.includes('museum')) return "Museum";
    if (types?.includes('park')) return "National Park";
    if(types?.includes('restaurant')) return "Restaurant";
    return 'Other';
  };

  useEffect(() => {
    if (!map || locations.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    locations.forEach(loc => bounds.extend({ lat: loc.latitude, lng: loc.longitude }));
    map.fitBounds(bounds);
  }, [map, locations]);

  
  return (
    <APIProvider apiKey='AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI' libraries={['places']}>
      <Map
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            mapInstanceRef.current = map.map; 
          }
        }}
        style={containerStyle}
        defaultCenter={center}
        defaultZoom={7}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        // mapId='DEMO_MAP_ID'
        mapId='e57efe6c5ed679ba' // Do not change for now
        mapTypeId = {mapType}
      >
        

      {/* Locations based on type (render issue) */}
      {locations.map((loc) => (
        <AdvancedMarker
          key={loc.id}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          title={loc.name}
          onClick={() => handleMarkerClick(loc)}
          ref={setMarkerRef}
        >
          <img 
            src={categoryIcons[loc.type] || townIcon} 
            alt={loc.type} 
            style={{ 
              width: '30px', 
              height: '30px',
              cursor: 'pointer',
              borderRadius: '999px',
              transform: selectedLocation?.id === loc.id ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }} 
          />
        </AdvancedMarker>
      ))}
  
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
            if(types?.includes('restaurant')) return "Restaurant";
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

        <Directions 
          startingPoint={startingPoint}
          destination={destination}
          addDestinations={addDestinations}
          selectedVehicle={selectedVehicle}
          nearbyPlaces={nearbyPlaces}
          selectedCategory={selectedCategory}
          selectedRouteIndex={selectedRouteIndex}
        />

        {selectedLocation && !showReviewPage && (
          <InfoWindow
            position={{
              lat: selectedLocation.latitude,
              lng: selectedLocation.longitude,
            }}
            onCloseClick={() => {
              setSelectedLocation(null);
              setShowReviewPage(false); // Also hide review if it was open
            }}
          >
            <CustomInfoWindow
              location={{
                name: selectedLocation.name,
                image: selectedLocation.image || 'default-image.jpg',
                description: selectedLocation.description || "No description available.",
                url: selectedLocation.url || 'No URL provided',
              }}
              onCloseClick={() => setSelectedLocation(null)}
              onShowReview={() => setShowReviewPage(true)} // 👈 this is key
            />
          </InfoWindow>
        )}

        {showReviewPage && selectedLocation && (
          <div className="review-overlay-wrapper">
            <ReviewPage onClose={() => setShowReviewPage(false)} />
          </div>
        )}

        <MapViewMenu onSelect={handleMenuSelect} activeOption={activeOption} locations={setLocations} onRoutesCalculated={(data) => console.log(data)}/>
      </Map>
    </APIProvider>
  );
}

export default MapComponent;

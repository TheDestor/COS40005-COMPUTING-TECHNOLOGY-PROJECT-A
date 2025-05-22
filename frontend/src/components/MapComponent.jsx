import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary, useMap, InfoWindow, useAdvancedMarkerRef, Marker } from '@vis.gl/react-google-maps';
import carIcon from '../assets/car.gif';
import homestayIcon from '../assets/homestay.gif';
import townIcon from '../assets/majortown.gif';
import shoppingIcon from '../assets/shopping.gif';
import foodIcon from '../assets/food.gif';
import museumIcon from '../assets/museum.gif';
import tourIcon from '../assets/tour.gif';
import eventIcon from '../assets/event.gif';
import restaurantIcon from '../assets/restaurant.png';
import MapViewMenu from './MapViewMenu';
import MapViewTesting from './MapViewTesting';
import CustomInfoWindow from './CustomInfoWindow';
import ReviewPage from '../pages/ReviewPage';
import { UseBookmarkContext } from '../context/BookmarkProvider';
import '../styles/MapComponent.css';
import SearchBar from './Searchbar';
import SearchHandler from './SearchHandler';
import WeatherDateTime from './WeatherDateTime';
import { townCoordinates } from '../townCoordinates';
import LoginModal from '../pages/Loginpage';
import TouristInfoSection from './TouristInfoSection';
import ProfileDropdown from './ProfileDropdown';
import SharePlace from './SharePlace';
import MapZoomController from './MapZoomController';

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

function MarkerManager({ locations, selectedLocation, setSelectedLocation }) {
  const map = useMap('e57efe6c5ed679ba');

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);

    if (!map) {
      console.warn('Map is not ready yet.');
      return;
    }

    map.panTo({ lat: location.latitude, lng: location.longitude });
    map.setZoom(15);
  };

 const categoryIcons = {
    'Major Town': townIcon,
    'Accommodation': homestayIcon,
    'Food & Beverages': foodIcon,
    'Attractions': museumIcon,
    'Shoppings & Leisures': shoppingIcon,
    'Transportation': carIcon,
    'Tour Guides': tourIcon,
    'Events': eventIcon,
    'Restaurant': restaurantIcon,
  };

  return (
    <>
      {locations.map((loc, index) => (
        <AdvancedMarker
          key={index}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          title={loc.name}
          onClick={() => handleMarkerClick(loc)}
        >
          <img
            src={categoryIcons[loc.type] || townIcon}
            alt={loc.type}
            style={{
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              borderRadius: '999px',
              transform: selectedLocation?.name === loc.name ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}
          />
        </AdvancedMarker>
      ))}
    </>
  );
}

function Directions({ startingPoint, destination, addDestinations=[], selectedVehicle, onRoutesCalculated, selectedRouteIndex }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [markerPositions, setMarkerPositions] = useState({
    origin: null,
    waypoints: [],
    destination: null
  });
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const routeRenderersRef = useRef([]);

  // Animation styles
  const pulseAnimation = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;

  const markerStyles = {
    base: {
      borderRadius: "50%",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      border: "2px solid white",
      fontSize: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      cursor: "pointer",
      transition: "all 0.2s ease",
      animation: "pulse 2s infinite"
    },
    origin: {
      background: "#4285F4",
    },
    waypoint: {
      background: "#34A853",
    },
    destination: {
      background: "#EA4335",
    },
    hover: {
      transform: "scale(1.2)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
      zIndex: 100
    }
  };

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
    if (!routesLibrary) return;
    setDirectionsService(new routesLibrary.DirectionsService());
  }, [routesLibrary]);

  useEffect(() => {
    return () => {
      routeRenderersRef.current.forEach(renderer => renderer.setMap(null));
    };
  }, []);

  useEffect(() => {
    if (!directionsService || !map) return;

    const getRoutes = async () => {
      try {
        const origin = await geocode(startingPoint);
        const dest = await geocode(destination);
        const waypoints = await Promise.all(
          addDestinations.map(async (dest) => {
            const location = await geocode(dest);
            return {
              location,
              stopover: true // Explicitly mark it as a stopover
            };
          })
        );

        setMarkerPositions({
          origin: { location: origin, address: startingPoint },
          waypoints,
          destination: { location: dest, address: destination }
        });

        const response = await directionsService.route({
          origin,
          destination: dest,
          waypoints: waypoints.length > 0 ? waypoints : undefined,
          travelMode: selectedVehicle,
          provideRouteAlternatives: true,
          optimizeWaypoints: true
        });

        setRoutes(response.routes);
        
        // Clear previous renderers
        routeRenderersRef.current.forEach(renderer => renderer.setMap(null));
        routeRenderersRef.current = [];

        // Create new renderers
       response.routes.forEach((route, index) => {
          const singleRouteResponse = {
            ...response,
            routes: [route]
          };

          const renderer = new routesLibrary.DirectionsRenderer({
            map,
            directions: singleRouteResponse, // only the specific route
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: index === selectedRouteIndex ? '#0057e7' : '#a7cdf2',
              strokeOpacity: index === selectedRouteIndex ? 1 : 0.5,
              strokeWeight: index === selectedRouteIndex ? 8 : 6
            }
          });

          routeRenderersRef.current.push(renderer);
        });

        if (onRoutesCalculated) {
          onRoutesCalculated({
            routes: response.routes,
            waypointOrder: response.routes[0]?.waypoint_order || []
          });
        }
      } catch (error) {
        console.error('Directions error:', error);
      }
    };

    getRoutes();
  }, [directionsService, startingPoint, destination, addDestinations, selectedVehicle, selectedRouteIndex]);

  const getMarkerLabel = (type, index) => {
    if (type === 'origin') return 'A';
    if (type === 'destination') return String.fromCharCode(66 + markerPositions.waypoints.length);
    return String.fromCharCode(66 + index);
  };

  return (
    <>
      <style>{pulseAnimation}</style>
      
      {/* Starting Point (A) */}
      {markerPositions.origin && (
        <AdvancedMarker 
          position={markerPositions.origin.location}
          onClick={() => console.log('Origin clicked:', markerPositions.origin.address)}
          onMouseEnter={() => setHoveredMarker('origin')}
          onMouseLeave={() => setHoveredMarker(null)}
        >
          <div style={{
            ...markerStyles.base,
            ...markerStyles.origin,
            ...(hoveredMarker === 'origin' && markerStyles.hover)
          }}>
            {getMarkerLabel('origin')}
          </div>
          {hoveredMarker === 'origin' && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              Start: {markerPositions.origin.address}
            </div>
          )}
        </AdvancedMarker>
      )}

      {/* Waypoints (B, C, etc.) */}
      {markerPositions.waypoints.map((waypoint, index) => (
        <AdvancedMarker 
          key={index}
          position={waypoint.location}
          onClick={() => console.log('Waypoint clicked:', waypoint.address)}
          onMouseEnter={() => setHoveredMarker(`waypoint-${index}`)}
          onMouseLeave={() => setHoveredMarker(null)}
        >
          <div style={{
            ...markerStyles.base,
            ...markerStyles.waypoint,
            ...(hoveredMarker === `waypoint-${index}` && markerStyles.hover)
          }}>
            {getMarkerLabel('waypoint', index)}
          </div>
          {hoveredMarker === `waypoint-${index}` && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              Stop {index + 1}: {waypoint.address}
            </div>
          )}
        </AdvancedMarker>
      ))}

      {/* Destination (last letter) */}
      {markerPositions.destination && (
        <AdvancedMarker 
          position={markerPositions.destination.location}
          onClick={() => console.log('Destination clicked:', markerPositions.destination.address)}
          onMouseEnter={() => setHoveredMarker('destination')}
          onMouseLeave={() => setHoveredMarker(null)}
        >
          <div style={{
            ...markerStyles.base,
            ...markerStyles.destination,
            ...(hoveredMarker === 'destination' && markerStyles.hover)
          }}>
            {getMarkerLabel('destination')}
          </div>
          {hoveredMarker === 'destination' && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              Destination: {markerPositions.destination.address}
            </div>
          )}
        </AdvancedMarker>
      )}
    </>
  );
}

function MapComponent({ startingPoint, destination, addDestinations=[], selectedVehicle, mapType, selectedCategory, selectedPlace, nearbyPlaces =[], onRoutesCalculated, selectedRouteIndex, routes, setShowRecent, showRecent, setSelectedPlace }) {
  const mapRef = useRef();
  // const mapInstanceRef = useRef(null);
  const map = useMap('e57efe6c5ed679ba'); 

  const [markerRef, setMarkerRef] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [activeOption, setActiveOption] = useState('');
  const [showReviewPage, setShowReviewPage] = useState(false);
  const { addBookmark } = UseBookmarkContext();

  const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
  const [searchInfoOpen, setSearchInfoOpen] = useState(false);
  const [currentTown, setCurrentTown] = useState('Kuching');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [searchNearbyPlaces, setSearchNearbyPlaces] = useState([]);

  // New zoom function for nearby places
  const zoomToPlace = useCallback((place) => {
    if (!map || !place?.geometry?.location) {
      console.warn('Map or place location not available');
      return;
    }

    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };

    const zoomWithRetry = (attempt = 1) => {
      try {
        console.log(`Zoom attempt ${attempt} to:`, location);
        map.panTo(location);
        map.setZoom(18);
      } catch (error) {
        console.error('Zoom error:', error);
        if (attempt < 3) {
          setTimeout(() => zoomWithRetry(attempt + 1), 300 * attempt);
        }
      }
    };

    zoomWithRetry();
  }, [map]);

  // Handle map initialization
  useEffect(() => {
    if (map) {
      console.log("Map instance now available");
      setMapInitialized(true);
    }
  }, [map]);

  // Handle selected place changes
  useEffect(() => {
    if (selectedPlace && mapInitialized) {
      zoomToPlace(selectedPlace);
    }
  }, [selectedPlace, mapInitialized, zoomToPlace]);

  const renderNearbyPlaces = () => {
    return nearbyPlaces
      .filter((place) => {
        const type = getPlaceType(place.types);
        return selectedCategory === 'All' || type === selectedCategory;
      })
      .map((place) => {
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        if (!lat || !lng) return null;

        const type = getPlaceType(place.types);
        const icon = categoryIcons[type];
        const isSelected = selectedPlace?.place_id === place.place_id;

        return (
          <AdvancedMarker 
            key={place.place_id}
            position={{ lat, lng }}
            title={`Nearby: ${place.name}`}
            onClick={() => {
              setSelectedPlace(place);
              setSelectedLocation({
                latitude: lat,
                longitude: lng,
                name: place.name
              });
            }}
          >
            <img
                src={icon}
                alt={type}
                style={{ 
                  width: isSelected ? '42px' : '36px',
                  height: isSelected ? '42px' : '36px',
                  transition: 'all 0.2s ease',
                  filter: isSelected ? 'drop-shadow(0 0 8px rgba(0, 0, 255, 0.6))' : 'none'
                }}
              />
              {isSelected && (
                <div className="selected-marker-label">
                  {place.name}
                </div>
              )}
          </AdvancedMarker>
        );
      });
  };


  // Add this function to handle menu selections
  const handleMenuSelect = async (category, data) => {
    setActiveOption(category);
    
    if (data) {
      // Convert coordinates to numbers and validate
      const validLocations = data
        .filter(loc => !isNaN(loc.latitude) && !isNaN(loc.longitude))
        .map(loc => ({
          ...loc,
          type: category,
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude)
        }));
      
      setLocations(validLocations);
      console.log('Valid locations:', validLocations);
    } else {
      setLocations([]);
    }
  };

  const handleTownChange = (town) => {
    setCurrentTown(town);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };
   
  const categoryIcons = {
    'Major Town': townIcon,
    'Accommodation': homestayIcon,
    'Food & Beverages': foodIcon,
    'Attractions': museumIcon,
    'Shoppings & Leisures': shoppingIcon,
    'Transportation': carIcon,
    'Tour Guides': tourIcon,
    'Events': eventIcon,
    'Restaurant': restaurantIcon,
  };    

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

  useEffect(() => {
    console.log('MapComponent received selectedPlace:', selectedPlace);
  }, [selectedPlace]);

  useEffect(() => {
    console.log('Map loading status:', {
      selectedPlace: !!selectedPlace,
      mapInstance: !!map
    });
  }, [selectedPlace, map]);
  
  return (
    <APIProvider apiKey='AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI' libraries={['places']}>
      <Map
        ref={(map) => {
          if (map) {
            console.log("Map initialized");
            mapRef.current = map;
            // mapInstanceRef.current = map.map;
          } else {
            console.log("Map failed");
          }
        }}
      
        style={containerStyle}
        defaultCenter={center}
        defaultZoom={7}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        // mapId='DEMO_MAP_ID'
        id="e57efe6c5ed679ba"
        mapId='e57efe6c5ed679ba' // Do not change for now
        mapTypeId = {mapType}
        // defaultZoom={7}
       restriction={{
          latLngBounds: {
            north: 14.5,   
            south: -6.5,    
            east: 141.0,   
            west: 78.0     
          },
          strictBounds: false
        }}
        options={{
          gestureHandling: 'cooperative',
          keyboardShortcuts: false,
          scrollwheel: true,
          disableDoubleClickZoom: false,
          touchZoom: true
        }}
      >

      {/* Locations based on type */}
      <MarkerManager 
        locations={locations} 
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />

      {/* {locations.map((loc, index) => (
        <AdvancedMarker
          key={index}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          title={loc.name}
          onClick={() => setSelectedLocation(loc)}
        >
          <img
            src={categoryIcons[activeOption] || townIcon}
            alt={activeOption}
            style={{
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              borderRadius: '999px',
              transform: selectedLocation?.name === loc.name ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}
          />
        </AdvancedMarker>
      ))} */}

  
        {/* Nearby Places */}
        {/* {nearbyPlaces.filter((place) => {
          const type = getPlaceType(place.types);
          return selectedCategory === 'All' || type === selectedCategory;
        })
        .map((place) => {
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          if (!lat || !lng) return null;

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
        {/* <MapZoomController selectedPlace={selectedPlace} /> */}
        
        {/* {nearbyPlaces.filter((place) => {
          const type = getPlaceType(place.types);
          return selectedCategory === 'All' || type === selectedCategory;
        }).map((place) => {
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          if (!lat || !lng) return null;

          const type = getPlaceType(place.types);
          const icon = categoryIcons[type];
          const isSelected = selectedPlace?.place_id === place.place_id;

          return (
            <AdvancedMarker 
              key={place.place_id}
              position={{ lat, lng }}
              title={`Nearby: ${place.name}`}
              onClick={() => {
                setSelectedPlace(place);
                setSelectedLocation({
                  latitude: lat,
                  longitude: lng,
                  name: place.name
                });
                zoomToNearbyPlace(place); // Using the new zoom function
              }}
            >
              <img
                src={icon}
                alt={type}
                style={{ 
                  width: isSelected ? '42px' : '36px',
                  height: isSelected ? '42px' : '36px',
                  transition: 'all 0.2s ease',
                  filter: isSelected ? 'drop-shadow(0 0 8px rgba(0, 0, 255, 0.6))' : 'none'
                }}
              />
              {isSelected && (
                <div className="selected-marker-label">
                  {place.name}
                </div>
              )}
            </AdvancedMarker>
          );
        })} */}

        {renderNearbyPlaces()}

        {/* Search bar marker */}
        <SearchBar onPlaceSelected={setSelectedSearchPlace} setShowRecent={setShowRecent}/>
        {selectedSearchPlace && (
          <>
            <SearchHandler selectedSearchPlace={selectedSearchPlace} setSearchNearbyPlaces={setSearchNearbyPlaces} />
            <AdvancedMarker
              position={{
                lat: selectedSearchPlace.latitude,
                lng: selectedSearchPlace.longitude
              }}
              title={selectedSearchPlace.name}
            />
            {searchNearbyPlaces.map((place, index) => (
            <AdvancedMarker
              key={index}
              position={{ lat: place.latitude, lng: place.longitude }}
              title={place.name}
            />
          ))}
        </>
      )}

        {/* Direction services */}
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
              setShowReviewPage(false);
            }}
          >
            <CustomInfoWindow
              location={{
                name: selectedLocation.name,
                image: selectedLocation.image || 'default-image.jpg',
                description: selectedLocation.description || "No description available.",
                latitude: selectedLocation.latitude || "N/A",
                longitude: selectedLocation.longitude || "N/A",
                // url: selectedLocation.url || 'No URL provided',
                // rating: selectedLocation.rating,
                // openNowText: selectedLocation.openNowText,
                // open24Hours: selectedLocation.open24Hours,
              }}
              addBookmark={addBookmark}
              onCloseClick={() => setSelectedLocation(null)}
              onShowReview={() => setShowReviewPage(true)}
              onOpenLoginModal={() => setShowLoginModal(true)}
            />
          </InfoWindow>
        )}

        {/* {showReviewPage && selectedLocation && (
          <div className="review-overlay-wrapper">
            <ReviewPage onClose={() => setShowReviewPage(false)} />
          </div>
        )} */}
        {showReviewPage && selectedLocation && (
          <div className="review-overlay-wrapper">
            <ReviewPage
              onClose={() => setShowReviewPage(false)}
              rating={selectedLocation.rating || 0}
              placeName={selectedLocation.name}
              // You can also pass `selectedLocation.reviews` here if it's available
            />
          </div>
        )}
        <ProfileDropdown onLoginClick={handleLoginClick} />
        <WeatherDateTime currentTown={currentTown} setCurrentTown={handleTownChange} />
        {/* <MapViewMenu onSelect={handleMenuSelect} activeOption={activeOption} locations={setLocations} onRoutesCalculated={(data) => console.log(data)}/> */}
        <MapViewTesting onSelect={handleMenuSelect} activeOption={activeOption} locations={setLocations} onRoutesCalculated={(data) => console.log(data)} /> 
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        {selectedLocation && (
          <TouristInfoSection selectedLocation={selectedLocation} />
        )}
      </Map>
    </APIProvider>
  );
}

export default MapComponent;

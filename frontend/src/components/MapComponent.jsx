import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary, useMap, InfoWindow, useAdvancedMarkerRef, ControlPosition, MapControl } from '@vis.gl/react-google-maps';
import { FaUsers, FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";
import aeroplaneIcon from '../assets/aeroplane.png';
import homestayIcon from '../assets/homestay.png';
// import homestayIcon1 from '../assets/homestay1.png';
import museumIcon from '../assets/museum.png';
import parkIcon from '../assets/national_park.png';
import townIcon from '../assets/town.png';
import seaportIcon from '../assets/seaport.png';
import sibu from '../assets/Sibu.png';
import kuching from '../assets/Kuching.png';
import miri from '../assets/Miri.png';
import bintulu from '../assets/Bintulu.png';
import sarikei from '../assets/Sarikei.png';
import sriAman from '../assets/SriAman.png';
import betong from '../assets/Betong.png';
import kapit from '../assets/Kapit.png';
import mukah from '../assets/Mukah.png';
import limbang from '../assets/Limbang.png';
import serian from '../assets/Serian.png';
import kotaSamarahan from '../assets/KotaSamarahan.png';
import axios from 'axios';

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

const townData = {
  Kuching: {
    population: "570,000",
    attractions: ["Sarawak Cultural Village", "Kuching Waterfront", "Bako National Park"],
    images: [kuching, limbang, sibu],
    image: kuching
  },
  Miri: {
    population: "350,000",
    attractions: ["Niah Caves", "Canada Hill", "Coco Cabana"],
    images: [miri, kuching, sibu],
    image: miri
  },
  Sibu: {
    population: "240,000",
    attractions: ["Sibu Central Market", "Bukit Aup", "Wong Nai Siong Memorial Park"],
    images: [sibu, kuching, miri],
    image: sibu
  },
  Bintulu: {
    population: "210,000",
    attractions: ["Tanjung Batu Beach", "Similajau National Park", "Tumbina Zoo"],
    images: [bintulu, kuching, sibu],
    image: bintulu
  },
  Sarikei: {
    population: "60,000",
    attractions: ["Sarikei Pineapple Statue", "Central Market", "Sebangkoi Park"],
    images: [sarikei, kuching, sibu],
    image: sarikei
  },
  "Sri Aman": {
    population: "55,000",
    attractions: ["Fort Alice", "Sri Aman Waterfront", "Benak Festival"],
    images: [sriAman, kuching, sibu],
    image: sriAman
  },
  Betong: {
    population: "48,000",
    attractions: ["Betong Town Square", "Lichok Longhouse", "Sebetan River"],
    images: [betong, kuching, sibu],
    image: betong
  },
  Kapit: {
    population: "66,000",
    attractions: ["Fort Sylvia", "Belaga Longhouses", "Rejang River"],
    images: [kapit, kuching, kapit],
    image: sibu
  },
  Mukah: {
    population: "50,000",
    attractions: ["Kaul Festival", "Mukah Beach", "Tellian Village"],
    images: [mukah, kuching, sibu],
    image: mukah
  },
  Limbang: {
    population: "45,000",
    attractions: ["Limbang Museum", "Taman Tasik Bukit Mas", "Border to Brunei"],
    images: [limbang, kuching, sibu],
    image: limbang
  },
  Serian: {
    population: "90,000",
    attractions: ["Ranchan Waterfall", "Tebakang Market", "Tebedu Border Post"],
    images: [serian, kuching, sibu],
    image: serian
  },
  "Kota Samarahan": {
    population: "100,000",
    attractions: ["UNIMAS Campus", "Aiman Mall", "Samarahan Expressway Viewpoint"],
    images: [kotaSamarahan, kuching, sibu],
    image: kotaSamarahan
  }
};

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

function Directions({ startingPoint={startingPoint}, destination={destination}, addDestinations=[], nearbyPlaces=[], selectedVehicle, travelModes, selectedCategory }) {
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

        // Geocode additional destinations
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

        directionsRenderer.setDirections(response);

        // Pass segmented routes data up to parent
        if (onRoutesCalculated) {
          onRoutesCalculated({
            routes: response.routes.map(route => ({
              ...route,
              optimizedOrder: route.waypoint_order,
              segments: route.legs.map(leg => ({
                start: leg.start_address,
                end: leg.end_address,
                duration: leg.duration.text,
                distance: leg.distance.text
              }))
            }))
          });
        }
      } catch (error) {
        console.error('Directions error:', error);
      }
    };

    getRoutes();
  }, [directionsService, directionsRenderer, startingPoint, destination, addDestinations, selectedVehicle]);
  

  useEffect(() => {
    if(!directionsRenderer) return;

    directionsRenderer.setRouteIndex(routesIndex);
  }, [routesIndex, directionsRenderer]);

  if(!leg) return null;
  return null;
}

function MapComponent({ startingPoint, destination, addDestinations=[], selectedVehicle, mapType, selectedCategory, selectedPlace, nearbyPlaces =[] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const map = useMap();

  // Still in progress (do for autocomplete place)
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
    'Seaport': seaportIcon,
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
            console.log(`Fetched ${validLocations.length} valid locations from API`);
            }catch (error) {
              console.error("Error fetching locations:", error);
              setLocations([]); // Clear on error
            }
        };

        fetchLocations();
      }, []);

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
  //       const filteredByType = validLocations.filter(loc => loc.type === selectedCategory);
  
  //       console.log(`Fetched ${filteredByType.length} ${selectedCategory} locations`);
  //       filteredByType.forEach((loc, i) => {
  //         console.log(`Location ${i}:`, loc);
  //       });
  //       console.log('Filtered down to:', filteredByType);

        
  //       setLocations(filteredByType);
  //     } catch (error) {
  //       console.error("Error fetching locations:", error);
  //       setLocations([]);
  //     }
  //   };
  
  //   fetchLocations();
  // }, [selectedCategory]);
  
  const getPlaceType = (types) => {
    if (types?.includes('airport')) return "Airport";
    if (types?.includes('lodging')) return "Homestay";
    if (types?.includes('museum')) return "Museum";
    if (types?.includes('park')) return "National Park";
    return 'Other';
  };

  useEffect(() => {
    if (!map || locations.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    locations.forEach(loc => bounds.extend({ lat: loc.latitude, lng: loc.longitude }));
    map.fitBounds(bounds);
  }, [map, locations]);

  const MarkerWithInfoWindow = ({ position, townName, townInfo }) => {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [infoWindowShown, setInfoWindowShown] = useState(false);
  
    const handleToggle = () => setInfoWindowShown(prev => !prev);
    const handleClose = () => setInfoWindowShown(false);

    const [currentImgIdx, setCurrentImgIdx] = useState(0);

    useEffect(() => {
      if (!infoWindowShown || !townInfo?.images?.length) return;

      const interval = setInterval(() => {
        setCurrentImgIdx(prev => (prev + 1) % townInfo.images.length);
      }, 1500); // 1.5s per image

      return () => clearInterval(interval);
    }, [infoWindowShown, townInfo]);
  
    const externalLink = `https://www.google.com/search?q=${encodeURIComponent(
      townName + " Sarawak attractions"
    )}`;
  
    return (
      <>
        <AdvancedMarker
          ref={markerRef}
          position={position}
          onClick={handleToggle}
          title={townName}
        >
          <img
            src={townInfo?.image}
            alt={townName}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 0 8px rgba(0,0,0,0.4)",
              transition: "transform 0.3s ease",
              cursor: "pointer"
            }}
            onMouseOver={e => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
          />
        </AdvancedMarker>
  
        {infoWindowShown && townInfo && (
          <InfoWindow anchor={marker} onCloseClick={handleClose}>
          <div
            style={{
              maxWidth: "300px",
              borderRadius: "14px",
              overflow: "hidden",
              fontFamily: "'Segoe UI', sans-serif",
              backgroundColor: "#fff"
            }}
          >
            {/* Carousel Section */}
            <div style={{ position: "relative", width: "100%", height: "160px", overflow: "hidden" }}>
              {townInfo.images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${townName} image ${idx + 1}`}
                  style={{
                    display: idx === currentImgIdx ? "block" : "none",
                    width: "300px",
                    height: "200px",
                    objectFit: "cover",
                    transition: "opacity 0.6s ease-in-out",
                    paddingLeft: "10px",
                    paddingRight: "16px",
                  }}
                />
              ))}
            </div>
        
            {/* Text Content */}
            <div style={{ padding: "14px 16px", position: "relative" }}>
              <h3
                style={{
                  fontSize: "18px",
                  margin: "0 0 6px",
                  color: "#2c3e50",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FaMapMarkerAlt color="#e74c3c" />
                {townName}
              </h3>
        
              <p
                style={{
                  margin: "6px 0",
                  fontSize: "14px",
                  color: "#555",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FaUsers color="#3498db" />
                Population: <strong>{townInfo.population}</strong>
              </p>
        
              <p style={{ fontWeight: "600", marginTop: "10px", marginBottom: "6px" }}>
                Top Attractions:
              </p>
        
              <ul
                style={{
                  maxHeight: "90px",
                  overflowY: "auto",
                  margin: 0,
                  paddingLeft: "20px",
                  lineHeight: "1.5",
                  fontSize: "14px"
                }}
              >
                {townInfo.attractions.map((place, index) => (
                  <li
                    key={index}
                    style={{
                      color: "#34495e",
                      marginBottom: "4px",
                      transition: "color 0.2s ease",
                      cursor: "pointer"
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = "#e67e22")}
                    onMouseOut={e => (e.currentTarget.style.color = "#34495e")}
                  >
                    {place}
                  </li>
                ))}
              </ul>
        
              {/* Learn More CTA bottom right */}
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  justifyContent: "flex-end"
                }}
              >
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#fff",
                    background: "linear-gradient(to right, #3498db, #2980b9)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    transition: "background 0.3s ease"
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "#1c6ea4")}
                  onMouseOut={e =>
                    (e.currentTarget.style.background =
                      "linear-gradient(to right, #3498db, #2980b9)")
                  }
                >
                  Learn More <FaExternalLinkAlt size={12} />
                </a>
              </div>
            </div>
          </div>
        </InfoWindow>        
        )}
      </>
    );
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
        defaultZoom={7.5}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        // mapId='DEMO_MAP_ID'
        mapId='e57efe6c5ed679ba' // Do not change for now
        mapTypeId = {mapType}
      >
      {/* Render markers ONLY for the filtered locations */}
      {/* {locations.map((loc, i) => {
        console.log("Rendering marker for:", loc.name, loc.latitude, loc.longitude);
        console.log("Icon URL:", categoryIcons[loc.type] || townIcon);
        return (
          <AdvancedMarker
            key={loc._id || i}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            title={loc.name}
          >
            <img src={categoryIcons[loc.type] || townIcon} alt={loc.type} style={{ width: '30px', height: '30px'}} />
          </AdvancedMarker>
        );
      })} */}
      {locations.map((loc) => (
        <AdvancedMarker
          key={loc.id}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          title={loc.name}
        >
          <img src={categoryIcons[loc.type] || townIcon} alt={loc.type} style={{ width: '30px', height: '30px'}} />
        </AdvancedMarker>
      ))};


      {/* Temporary markers for major towns */}
      {Object.entries(townCoordinates).map(([townName, coords]) => (
        <MarkerWithInfoWindow
          key={townName}
          position={coords}
          townName={townName}
          townInfo={townData[townName]}
        />
      ))}

      {/* {selectedPlace && selectedPlace.geometry?.location && (
        <AdvancedMarker
          position={{
            lat: selectedPlace.geometry.location.lat(),
            lng: selectedPlace.geometry.location.lng(),
          }}
          title={selectedPlace.name}
        >
          <img
            src={categoryIcons[getPlaceType(selectedPlace.types)] || townIcon}
            alt="Selected Place"
            style={{ width: '36px', height: '36px' }}
          />
        </AdvancedMarker>
      )} */}
  
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

        <Directions 
          startingPoint={startingPoint}
          destination={destination}
          addDestinations={addDestinations}
          selectedVehicle={selectedVehicle}
          nearbyPlaces={nearbyPlaces}
          selectedCategory={selectedCategory}
        />
      </Map>
    </APIProvider>
  );
}

export default MapComponent;

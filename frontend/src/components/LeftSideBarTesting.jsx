import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { FaRoute, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaBookmark, FaLayerGroup, FaLocationArrow, FaChevronDown, FaChevronUp, FaCar, FaBus, FaWalking, FaBicycle, FaMotorcycle, FaPlane, FaCopy, FaShare, FaCompass, FaMapPin } from 'react-icons/fa';
import { MdManageAccounts, MdAddLocationAlt } from 'react-icons/md';
import { toast } from 'sonner';
import '../styles/LeftSideBar.css';
import RecentSection from './RecentSection';
import BookmarkPage from '../pages/Bookmarkpage';
import MapLayer from './MapLayers';
import BusinessSubmissionForm from '../pages/BusinessSubmissionForm';
import LoginModal from '../pages/Loginpage';
import { IoCloseOutline } from "react-icons/io5";
import { useAuth } from '../context/AuthProvider.jsx';
import NearbyPlacesPanel from './NearbyPlacesPanel';
import NearbyPlacesDrawer from './NearbyPlacesDrawer';
import { UseBookmarkContext } from '../context/BookmarkProvider.jsx';

function ComprehensiveAutocompleteInput({ value, onChange, onSelect, onManualSubmit, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [backendLocations, setBackendLocations] = useState([]);
  const [approvedBusinesses, setApprovedBusinesses] = useState([]);
  const debounceRef = useRef();
  const nominatimAbortRef = useRef(null);
  const photonAbortRef = useRef(null);
  const lastQueryRef = useRef({ q: '', results: [] });
  const BBOX = '109.5,0.8,115.5,5.5';
  const MIN_QUERY = 2;
  const LIMIT = 5;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/locations');
        const json = await res.json();
        const arr = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
        if (!cancelled) setBackendLocations(arr);
      } catch {}
      try {
        const res = await fetch('/api/businesses/approved');
        const json = await res.json();
        const arr = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
        if (!cancelled) setApprovedBusinesses(arr);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const normalizeBackend = (loc) => {
    const lat = parseFloat(loc.latitude ?? loc.lat);
    const lon = parseFloat(loc.longitude ?? loc.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      name: loc.name || loc.title || loc.placeName || 'Unnamed Location',
      lat, lon,
      source: 'backend',
      subtitle: loc.division || loc.region || undefined
    };
  };

  const normalizeBusiness = (b) => {
    const lat = parseFloat(b.latitude ?? b.lat);
    const lon = parseFloat(b.longitude ?? b.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      name: b.name || 'Unnamed Business',
      lat, lon,
      source: 'business',
      subtitle: b.address || b.location || undefined
    };
  };

  const mapNominatimItem = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const primary = (item.display_name || '').split(',')[0]?.trim();
    return {
      name: primary || item.name || 'Selected Location',
      lat, lon,
      source: 'nominatim',
      subtitle: item.display_name
    };
  };

  const mapPhotonFeature = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const props = feature.properties || {};
    const city = props.city || props.county || props.state;
    const country = props.country;
    const subtitle = [city, country].filter(Boolean).join(', ') || props.osm_value;
    return {
      name: props.name || props.street || 'Selected Location',
      lat, lon,
      source: 'photon',
      subtitle
    };
  };

  const fetchNominatim = async (q) => {
    if (nominatimAbortRef.current) nominatimAbortRef.current.abort();
    nominatimAbortRef.current = new AbortController();
    const url = `/api/nominatim/search?q=${encodeURIComponent(q)}&limit=${LIMIT}&countrycodes=my&viewbox=${BBOX}&bounded=1`;
    const res = await fetch(url, { signal: nominatimAbortRef.current.signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapNominatimItem) : [];
  };

  const fetchPhoton = async (q) => {
    if (photonAbortRef.current) photonAbortRef.current.abort();
    photonAbortRef.current = new AbortController();
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=en&limit=${LIMIT}&bbox=${BBOX}`;
    const res = await fetch(url, { signal: photonAbortRef.current.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data.features) ? data.features : [];
    return features.map(mapPhotonFeature);
  };

  const handleInput = (e) => {
    const q = e.target.value;
    onChange(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q || q.trim().length < MIN_QUERY) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const qLower = q.toLowerCase();
      const backendResults = backendLocations
        .filter(loc => {
          const name = String(loc.name || '').toLowerCase();
          const div = String(loc.division || '').toLowerCase();
          return name.includes(qLower) || div.includes(qLower);
        })
        .slice(0, LIMIT)
        .map(normalizeBackend)
        .filter(Boolean);

      const businessResults = approvedBusinesses
        .filter(b => {
          const name = String(b.name || '').toLowerCase();
          const addr = String(b.address || '').toLowerCase();
          return name.includes(qLower) || addr.includes(qLower);
        })
        .slice(0, LIMIT)
        .map(normalizeBusiness)
        .filter(Boolean);

      const internal = [...backendResults, ...businessResults];
      if (internal.length > 0) {
        setSuggestions(internal);
        setShowDropdown(true);
        return;
      }

      try {
        if (lastQueryRef.current.q === q && lastQueryRef.current.results.length > 0) {
          setSuggestions(lastQueryRef.current.results);
          setShowDropdown(true);
          return;
        }
        const nom = await fetchNominatim(q);
        if (nom.length > 0) {
          lastQueryRef.current = { q, results: nom };
          setSuggestions(nom);
          setShowDropdown(true);
          return;
        }
        const pho = await fetchPhoton(q);
        lastQueryRef.current = { q, results: pho };
        setSuggestions(pho);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 250);
  };

  const handleSelect = (item) => {
    onChange(item.name);
    onSelect(item);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        value={value}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onManualSubmit) {
            e.preventDefault();
            onManualSubmit(e.target.value);
            setShowDropdown(false);
          }
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 150);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className='photon-autocomplete-dropdown'>
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              style={{ padding: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>{s.name}</span>
              </div>
              {s.subtitle && (
                <div style={{ fontSize: 11, color: '#555' }}>
                  {s.subtitle}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Nominatim reverse geocoding helper (free alternative to Google Geocoding)
async function reverseGeocodeNominatim(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SarawakTourismApp/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      // Format the address nicely
      const address = data.display_name;
      return address;
    }
    
    throw new Error('No address found');
  } catch (error) {
    console.error('Nominatim reverse geocoding error:', error);
    throw error;
  }
}

// Nominatim geocoding helper
async function geocodeAddressNominatim(address) {
  const url = `/api/nominatim/search?q=${encodeURIComponent(address)}&limit=1&countrycodes=my&viewbox=109.5,0.8,115.5,5.5&bounded=1`;
  const response = await fetch(url);
  const data = await response.json();
  if (data && data[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  throw new Error('Address not found');
}

// helper: snap to road
async function snapToRoadOSRM(lng, lat, profile = 'driving', signal) {
  const url = `https://router.project-osrm.org/nearest/v1/${profile}/${lng},${lat}?number=1`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    return { lng, lat }; // fall back to original
  }
  const data = await res.json();
  const loc = data?.waypoints?.[0]?.location;
  if (Array.isArray(loc) && loc.length === 2) {
    return { lng: loc[0], lat: loc[1] };
  }
  return { lng, lat };
}

// OSRM routing helper (existing)
async function fetchOSRMRoute(start, end, waypoints = [], profile = 'driving', signal) {
  const snappedStart = await snapToRoadOSRM(start.lng, start.lat, profile, signal);
  const snappedEnd = await snapToRoadOSRM(end.lng, end.lat, profile, signal);
  const snappedWaypoints = await Promise.all(
    waypoints.map(wp => snapToRoadOSRM(wp.lng, wp.lat, profile, signal))
  );

  const coords = [
    `${snappedStart.lng},${snappedStart.lat}`,
    ...snappedWaypoints.map(wp => `${wp.lng},${wp.lat}`),
    `${snappedEnd.lng},${snappedEnd.lat}`
  ].join(';');
  
  // Don't encode coordinates for OSRM - it expects them as-is
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;
  
  console.log(`Fetching route for ${profile}:`, url);
  
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OSRM request failed for ${profile}:`, response.status, errorText);
    throw new Error(`OSRM request failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  
  // Check if the response has routes
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No routes found in OSRM response for ${profile}`);
  }
  
  return data;
}

// OSRM routing helper with multiple alternatives
async function fetchOSRMRouteAlternatives(start, end, waypoints = [], profile = 'driving', alternatives = 3) {
  const snappedStart = await snapToRoadOSRM(start.lng, start.lat, profile);
  const snappedEnd = await snapToRoadOSRM(end.lng, end.lat, profile);
  const snappedWaypoints = await Promise.all(
    waypoints.map(wp => snapToRoadOSRM(wp.lng, wp.lat, profile))
  );

  const coords = [
    `${snappedStart.lng},${snappedStart.lat}`,
    ...snappedWaypoints.map(wp => `${wp.lng},${wp.lat}`),
    `${snappedEnd.lng},${snappedEnd.lat}`
  ].join(';');
  
  // For walking and cycling, don't use alternatives parameter as it may not be supported
  let url;
  if (profile === 'walking' || profile === 'cycling') {
    // Don't encode coordinates for OSRM - it expects them as-is
    url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;
  } else {
    // Use alternatives for driving but with simpler parameters
    url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true`;
  }
  
  console.log(`Fetching alternatives for ${profile}:`, url);
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OSRM request failed for ${profile}:`, response.status, errorText);
    throw new Error(`OSRM request failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  
  // Check if the response has routes
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No routes found in OSRM response for ${profile}`);
  }
  
  return data;
}

// GraphHopper routing helper (using backend API)
async function fetchGraphHopperRoute(start, end, waypoints = [], profile = 'car') {
  try {
    console.log(`Fetching GraphHopper route via backend API for ${profile}...`);
    console.log(`Start:`, start);
    console.log(`End:`, end);
    console.log(`Waypoints:`, waypoints);
    
    const response = await fetch('/api/graphhopper/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start,
        end,
        waypoints,
        vehicle: profile
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Backend GraphHopper request failed: ${response.status}`, errorData);
      throw new Error(`Backend GraphHopper request failed: ${response.status} - ${errorData.message}`);
    }
    
    const data = await response.json();
    console.log('Backend GraphHopper response:', data);
    
    if (!data.success || !data.routes || data.routes.length === 0) {
      throw new Error('No routes found in backend GraphHopper response');
    }
    
    // Convert backend response to expected format
    return {
      paths: data.routes.map(route => ({
        points: {
          coordinates: route.coordinates.map(([lat, lng]) => [lng, lat]) // Convert back to [lng, lat]
        },
        distance: route.distance,
        time: route.duration * 1000, // Convert seconds to ms
        instructions: route.roadInfo.map(info => ({
          street_name: info.road,
          distance: info.distance,
          time: info.duration * 1000,
          text: info.direction
        }))
      }))
    };
  } catch (error) {
    console.warn('Backend GraphHopper failed:', error);
    throw error;
  }
}

// GraphHopper alternatives helper (using backend API)
async function fetchGraphHopperAlternatives(start, end, waypoints = [], profile = 'car', alternatives = 3) {
  try {
    console.log(`Fetching GraphHopper alternatives via backend API for ${profile}...`);
    console.log(`Start:`, start);
    console.log(`End:`, end);
    console.log(`Waypoints:`, waypoints);
    console.log(`Alternatives:`, alternatives);
    
    const response = await fetch('/api/graphhopper/alternatives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start,
        end,
        waypoints,
        vehicle: profile,
        alternatives
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Backend GraphHopper alternatives request failed: ${response.status}`, errorData);
      throw new Error(`Backend GraphHopper alternatives request failed: ${response.status} - ${errorData.message}`);
    }
    
    const data = await response.json();
    console.log('Backend GraphHopper alternatives response:', data);
    
    if (!data.success || !data.routes || data.routes.length === 0) {
      throw new Error('No routes found in backend GraphHopper alternatives response');
    }
    
    // Convert backend response to expected format
    return {
      paths: data.routes.map(route => ({
        points: {
          coordinates: route.coordinates.map(([lat, lng]) => [lng, lat]) // Convert back to [lng, lat]
        },
        distance: route.distance,
        time: route.duration * 1000, // Convert seconds to ms
        instructions: route.roadInfo.map(info => ({
          street_name: info.road,
          distance: info.distance,
          time: info.duration * 1000,
          text: info.direction
        }))
      }))
    };
  } catch (error) {
    console.warn('Backend GraphHopper alternatives failed:', error);
    throw error;
  }
}

// Valhalla routing helper (free and open source)
async function fetchValhallaRoute(start, end, waypoints = [], profile = 'auto') {
  const coords = [
    [start.lng, start.lat],
    ...waypoints.map(wp => [wp.lng, wp.lat]),
    [end.lng, end.lat]
  ];
  
  const body = {
    locations: coords.map(coord => ({ lat: coord[1], lon: coord[0] })),
    costing: profile,
    directions_options: {
      units: 'kilometers'
    }
  };
  
  try {
    const response = await fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Valhalla request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.trip || !data.trip.legs) {
      throw new Error('No route found in Valhalla response');
    }
    
    return data;
  } catch (error) {
    console.warn('Valhalla failed:', error);
    throw error;
  }
}

const travelModes = {
  Car: { service: 'graphhopper', profile: 'car', fallbackService: 'osrm', fallbackProfile: 'driving' },
  Bus: { service: 'graphhopper', profile: 'car', fallbackService: 'osrm', fallbackProfile: 'driving', multiplier: { time: 1.5, distance: 1.1 } }, // Bus takes longer due to stops
  Walking: { service: 'graphhopper', profile: 'foot', fallbackService: 'osrm', fallbackProfile: 'walking' },
  Bicycle: { service: 'graphhopper', profile: 'bike', fallbackService: 'osrm', fallbackProfile: 'cycling' },
  Motorbike: { service: 'graphhopper', profile: 'motorcycle', fallbackService: 'osrm', fallbackProfile: 'driving', multiplier: { time: 0.8, distance: 0.95 } }, // Motorbike can be faster
};

// Function to fetch route with alternatives for a specific vehicle
async function fetchRouteWithAlternatives(start, end, waypoints = [], vehicle = 'Car') {
  const routeConfig = travelModes[vehicle];
  
  try {
    let routeData;
    
            // Try primary service first
            try {
              if (routeConfig.service === 'graphhopper') {
                console.log(`Using GraphHopper for ${vehicle}...`);
                // Try alternatives first for driving vehicles
                if (vehicle === 'Car' || vehicle === 'Bus' || vehicle === 'Motorbike') {
                  try {
                    routeData = await fetchGraphHopperAlternatives(start, end, waypoints, routeConfig.profile, 3);
                  } catch (alternativesError) {
                    console.log(`GraphHopper alternatives failed, trying basic route:`, alternativesError.message);
                    routeData = await fetchGraphHopperRoute(start, end, waypoints, routeConfig.profile);
                  }
                } else {
                  routeData = await fetchGraphHopperRoute(start, end, waypoints, routeConfig.profile);
                }
                
                // Check if GraphHopper returned valid coordinates
                if (routeData.paths && routeData.paths.length > 0) {
                  const hasValidCoordinates = routeData.paths.some(path => {
                    return (path.points && path.points.coordinates) || 
                           (path.points && Array.isArray(path.points)) ||
                           (path.geometry && path.geometry.coordinates) ||
                           path.coordinates;
                  });
                  
                  if (!hasValidCoordinates) {
                    console.warn('GraphHopper returned route without coordinates, trying OSRM fallback');
                    throw new Error('GraphHopper missing coordinates');
                  }
                }
              } else if (routeConfig.service === 'valhalla') {
                routeData = await fetchValhallaRoute(start, end, waypoints, routeConfig.profile);
              } else if (routeConfig.service === 'osrm') {
                if (vehicle === 'Walking' || vehicle === 'Bicycle') {
                  console.log(`Using OSRM basic route for ${vehicle}...`);
                  routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.profile);
                } else {
                  try {
                    console.log(`Trying OSRM alternatives for ${vehicle}...`);
                    routeData = await fetchOSRMRouteAlternatives(start, end, waypoints, routeConfig.profile, 3);
                  } catch (alternativesError) {
                    console.log(`OSRM alternatives failed, falling back to basic route:`, alternativesError.message);
                    routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.profile);
                  }
                }
              }
            } catch (primaryError) {
              console.warn(`Primary service failed for ${vehicle}, trying fallback:`, primaryError);
              
              // Fallback to OSRM
              if (routeConfig.fallbackService === 'osrm') {
                if (vehicle === 'Walking' || vehicle === 'Bicycle') {
                  console.log(`Using OSRM basic route for ${vehicle} fallback...`);
                  routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.fallbackProfile);
                } else {
                  try {
                    console.log(`Trying OSRM alternatives for ${vehicle} fallback...`);
                    routeData = await fetchOSRMRouteAlternatives(start, end, waypoints, routeConfig.fallbackProfile, 3);
                  } catch (alternativesError) {
                    console.log(`OSRM alternatives failed, falling back to basic route:`, alternativesError.message);
                    routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.fallbackProfile);
                  }
                }
              } else if (routeConfig.fallbackService === 'valhalla') {
                console.log(`Using Valhalla for ${vehicle} fallback...`);
                routeData = await fetchValhallaRoute(start, end, waypoints, routeConfig.fallbackProfile);
              }
            }

    // Handle different response formats
    let routes = [];
    
    if (routeData.paths && routeData.paths.length > 0) {
      // GraphHopper response format
      routes = routeData.paths.map(path => {
        
        // Check different possible coordinate structures in GraphHopper response
        let coordinates = [];
        
        if (path.points && path.points.coordinates) {
          // Standard GraphHopper format
          coordinates = path.points.coordinates;
        } else if (path.points && Array.isArray(path.points)) {
          // Alternative format where points is directly an array
          coordinates = path.points;
        } else if (path.geometry && path.geometry.coordinates) {
          // Geometry format
          coordinates = path.geometry.coordinates;
        } else if (path.coordinates) {
          // Direct coordinates format
          coordinates = path.coordinates;
        } else {
          console.warn('GraphHopper path missing coordinates in all expected formats:', path);
          
          // Return empty coordinates - this will be handled by the fallback logic above
          return {
            geometry: { coordinates: [] },
            distance: path.distance || 0,
            duration: (path.time || 0) / 1000,
            legs: []
          };
        }
        
        return {
          geometry: {
            coordinates: coordinates.map(([lng, lat]) => [lng, lat])
          },
          distance: path.distance,
          duration: path.time / 1000, // Convert ms to seconds
          legs: [],
          roadInfo: path.instructions ? path.instructions.map(instruction => ({
            road: instruction.street_name || 'Unknown Road',
            distance: instruction.distance,
            duration: instruction.time / 1000,
            direction: instruction.text
          })) : []
        };
      });
    } else if (routeData.trip && routeData.trip.legs) {
      // Valhalla response format
      const totalDistance = routeData.trip.summary.length * 1000; // Convert km to meters
      const totalDuration = routeData.trip.summary.time; // Already in seconds
      
      routes = [{
        geometry: {
          coordinates: routeData.trip.legs.flatMap(leg => 
            leg.shape.map(coord => [coord[1], coord[0]]) // Valhalla uses [lat, lng], we need [lng, lat]
          )
        },
        distance: totalDistance,
        duration: totalDuration,
        legs: routeData.trip.legs,
        roadInfo: routeData.trip.legs.map(leg => ({
          road: leg.summary?.road_class || 'Unknown Road',
          distance: leg.summary?.length * 1000 || 0,
          duration: leg.summary?.time || 0,
          direction: leg.summary?.road_class || 'Continue'
        }))
      }];
    } else if (routeData.routes && routeData.routes.length > 0) {
      // OSRM response format
      routes = routeData.routes.map(route => ({
        ...route,
        roadInfo: route.legs ? route.legs.flatMap(leg => 
          leg.steps ? leg.steps.map(step => ({
            road: step.name || 'Unknown Road',
            distance: step.distance,
            duration: step.duration,
            direction: step.maneuver?.instruction || 'Continue'
          })) : []
        ) : []
      }));
    }
    
    if (routes.length === 0) {
      throw new Error('No routes found in response');
    }
    
    // Check if all routes have empty coordinates
    const allRoutesEmpty = routes.every(route => !route.geometry.coordinates || route.geometry.coordinates.length === 0);
    if (allRoutesEmpty) {
      console.warn('All routes have empty coordinates, this should trigger fallback');
      throw new Error('All routes have empty coordinates');
    }
    
    
    // Apply multipliers if they exist (for Bus and Motorbike only)
    if (routeConfig.multiplier && routes && routes.length > 0) {
      routes.forEach(route => {
        if (route.duration && route.distance) {
          route.duration = route.duration * routeConfig.multiplier.time;
          route.distance = route.distance * routeConfig.multiplier.distance;
        }
      });
    }
    
    return { routes };
  } catch (error) {
    console.error(`Error fetching ${vehicle} routes:`, error);
    throw error;
  }
}

const LeftSidebarTesting = forwardRef(({ 
  onSearch, history, setHistory, showRecent, setShowRecent, setSelectedPlace, selectedPlace, 
  setOsrmRouteCoords, setOsrmWaypoints, setIsRoutingActive, onBasemapChange, 
  setActiveSearchLocation, activeSearchLocation, onRouteAlternativesChange, onNearbyPlacesChange, 
  onRouteInfoChange, onClearAllRouting, onSetAddToRecentRef, onSetOpenRecentSectionRef, 
  onSetToggleBookmarkRef, isExpand, setIsExpand, destinationInput, setDestinationInput,
  // New props for auto-opening and setting destination
  autoOpen = false,
  autoDestination = null,
  // New props for nearby places drawer
  selectedSearchBarPlace,
  searchNearbyPlaces,
  isSearchNearbyLoading,
  searchNearbyError,
  fetchSearchNearbyPlaces,
  // Add missing filter props here to avoid re-destructuring from props later
  nearbyFilterCategory,
  onNearbyFilterCategoryChange,
  // Add setter if parent passes it (used later in this file)
  setSelectedSearchBarPlace
}, ref) => {
  const { user, isLoggedIn } = useAuth();
  // Add bookmark context to feed bookmarks into Nearby panel
  const { bookmarks } = UseBookmarkContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [startingPointCoords, setStartingPointCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showBookmarkpage, setShowBookmarkpage] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showRecentSection, setShowRecentSection] = useState(false);
  const [recentLocations, setRecentLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('sarawakTourismRecentLocations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addDestinations, setAddDestinations] = useState([]);
  const [waypointCoords, setWaypointCoords] = useState([]);
  const [routeAlternatives, setRouteAlternatives] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [activeMenu, setActiveMenu] = useState('');
  const [routeSummary, setRouteSummary] = useState(null);
  const autoCalculatedRef = useRef(false);
  const [isLocationFetching, setIsLocationFetching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyError, setNearbyError] = useState(null);
  const [isNearbyDrawerOpen, setIsNearbyDrawerOpen] = useState(false);
  const routeAbortRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [panelHeight, setPanelHeight] = useState(() => (isMobile ? 30 : undefined));

  useEffect(() => {
    if (isMobile) setPanelHeight(30);
  }, [isMobile]);

  // Compute a robust anchor for distance: prefer search selection, then recent selection, then destination
  const anchorCoords = useMemo(() => {
    const resolveNum = (v) => (typeof v === 'string' ? parseFloat(v) : v);
    const lat = (
      selectedSearchBarPlace?.coordinates?.latitude ??
      selectedSearchBarPlace?.latitude ??
      activeSearchLocation?.coordinates?.latitude ??
      activeSearchLocation?.latitude ??
      destinationCoords?.lat
    );
    const lng = (
      selectedSearchBarPlace?.coordinates?.longitude ??
      selectedSearchBarPlace?.longitude ??
      activeSearchLocation?.coordinates?.longitude ??
      activeSearchLocation?.longitude ??
      destinationCoords?.lng
    );
    const nlat = resolveNum(lat);
    const nlng = resolveNum(lng);
    return Number.isFinite(nlat) && Number.isFinite(nlng) ? { lat: nlat, lng: nlng } : null;
  }, [selectedSearchBarPlace, activeSearchLocation, destinationCoords]);

  // Helper: exclude the anchor itself from the nearby panel
  const isSamePlaceAsAnchor = useCallback((place, anchor) => {
    if (!anchor || !place) return false;
    const plat =
      (typeof place?.geometry?.location?.lat === 'function'
        ? place.geometry.location.lat()
        : place?.geometry?.location?.lat) ??
      place?.latitude ??
      place?.coordinates?.latitude ??
      place?.lat;

    const plng =
      (typeof place?.geometry?.location?.lng === 'function'
        ? place.geometry.location.lng()
        : place?.geometry?.location?.lng) ??
      place?.longitude ??
      place?.coordinates?.longitude ??
      place?.lng;

    if (!Number.isFinite(plat) || !Number.isFinite(plng)) return false;
    const EPS = 1e-5;
    return Math.abs(plat - anchor.lat) < EPS && Math.abs(plng - anchor.lng) < EPS;
  }, []);

  // Close all panels
  const closeAllPanels = () => {
    setSidebarExpanded(false);
    setShowBusiness(false);
    setShowBookmarkpage(false);
    setShowLayersPanel(false);
    setShowRecentSection(false);
    setIsNearbyDrawerOpen(false);
    setActiveMenu('');
    if (typeof setShowRecent === 'function') {
      setShowRecent(false);
    }
  };

  // Keyboard shortcut: Shift+N to reopen/toggle the drawer
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        setIsNearbyDrawerOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const matchesCategoryInSidebar = (place, cat) => {
    if (!cat || cat === 'all') return true;
    const tokens = [
      (place.category || ''),
      (place.type || ''),
      (place.subcategory || ''),
      (place.class || ''),
      ...(Array.isArray(place.categories) ? place.categories : []),
      ...(Array.isArray(place.tags) ? place.tags : []),
      ...(Array.isArray(place?.properties?.categories) ? place.properties.categories : []),
    ].filter(Boolean).map((s) => String(s).toLowerCase());

    if (cat === 'restaurant') {
      return tokens.some((s) =>
        s.includes('restaurant') || s.includes('food') || s.includes('cafe') || s.includes('eat')
      );
    }
    if (cat === 'toilet') {
      return tokens.some((s) =>
        s.includes('toilet') || s.includes('restroom') || s.includes('washroom') || s === 'wc'
      );
    }
    if (cat === 'pharmacy') {
      return tokens.some((s) =>
        s.includes('pharmacy') || s.includes('chemist') || s.includes('drugstore')
      );
    }
    return false;
  };

  // Use external expand state if provided, otherwise use internal state
  const sidebarExpanded = isExpand !== undefined ? isExpand : isExpanded;
  const setSidebarExpanded = setIsExpand || setIsExpanded;
  
  // Use external destination input if provided, otherwise use internal state
  const currentDestinationInput = destinationInput !== undefined ? destinationInput : destination;
  const setCurrentDestinationInput = setDestinationInput || setDestination;

  const hasValidInputs =
    (String(startingPoint).trim().length > 0) &&
    (String(currentDestinationInput).trim().length > 0);

  const handleRouteAlternativeSelect = async (route, index) => {
    setSelectedRouteIndex(index);
    if (setOsrmRouteCoords) setOsrmRouteCoords(route.coords);
    setRouteSummary({
      distance: route.distance,
      duration: route.duration,
      vehicle: route.vehicle,
      roadInfo: route.roadInfo,
    });

    // Refresh nearby places around the current destination
    try {
      if (destinationCoords) {
        const places = await fetchNearbyPlaces(destinationCoords, 5000);
        setNearbyPlaces(places || []);
      }
    } catch (err) {
      console.warn('Failed to refresh nearby places:', err);
      setNearbyPlaces([]);
    }
  };

  // NEW: Auto-open sidebar and set destination when component mounts or props change
  useEffect(() => {
    if (autoOpen) {
      console.log('Auto-opening sidebar and setting destination:', autoDestination);
      // Open the sidebar
      setSidebarExpanded(true);
      
      // Set the destination if provided
      if (autoDestination) {
        const { name, coordinates } = autoDestination;
        setCurrentDestinationInput(name || 'Selected Location');
        setDestinationCoords({
          lat: coordinates.lat,
          lng: coordinates.lng
        });
        
        // Add to recent locations
        addToRecentLocations({
          name: name || 'Selected Location',
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          type: 'Location',
          source: 'auto'
        });
      }
    }
  }, [autoOpen, autoDestination]);

  // NEW: Open the drawer when a place is selected via search.
  useEffect(() => {
    const lat =
      selectedSearchBarPlace?.coordinates?.latitude ?? selectedSearchBarPlace?.latitude;
    const lng =
      selectedSearchBarPlace?.coordinates?.longitude ?? selectedSearchBarPlace?.longitude;

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setIsNearbyDrawerOpen(true);
    } else if (!selectedSearchBarPlace) {
      // Ensure clearing search does not open and also closes the drawer
      setIsNearbyDrawerOpen(false);
    }
  }, [selectedSearchBarPlace]);

  // NEW: Auto-open when recent/bookmark selection or destination changes
  useEffect(() => {
    const lat =
      activeSearchLocation?.coordinates?.latitude ??
      activeSearchLocation?.latitude ??
      destinationCoords?.lat;
    const lng =
      activeSearchLocation?.coordinates?.longitude ??
      activeSearchLocation?.longitude ??
      destinationCoords?.lng;

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setIsNearbyDrawerOpen(true);
      setActiveMenu('nearby');
    }
  }, [activeSearchLocation, destinationCoords]);

  const handleCloseNearbyDrawer = useCallback(() => {
    setIsNearbyDrawerOpen(false);
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    setDestinationFromExternal: (name, coords) => {
      console.log('Setting destination from external:', name, coords);
      setCurrentDestinationInput(name);
      setDestinationCoords(coords);
      
      // Also open the sidebar when destination is set externally
      setSidebarExpanded(true);
      
      // If coordinates are provided, we can immediately use them for routing
      if (coords && coords.lat && coords.lng) {
        console.log('Destination coordinates set:', coords);
        // This will trigger the auto-calculation if starting point is also set
      }
    },
    // NEW: Method to open sidebar programmatically
    openSidebar: () => {
      setSidebarExpanded(true);
    },
    // NEW: Method to close sidebar programmatically
    closeSidebar: () => {
      setSidebarExpanded(false);
    },
    // NEW: Method to set both destination and open sidebar
    setDestinationAndOpen: (name, coords) => {
      setCurrentDestinationInput(name);
      setDestinationCoords(coords);
      setSidebarExpanded(true);
      
      // Add to recent locations
      if (name && coords) {
        addToRecentLocations({
          name: name,
          latitude: coords.lat,
          longitude: coords.lng,
          type: 'Location',
          source: 'external'
        });
      }
    },
    // NEW: Method to set destination name in the input field
    setDestinationName: (name) => {
      setCurrentDestinationInput(name);
    }
  }));

  // Load recent locations from localStorage on component mount
  useEffect(() => {
    const savedRecentLocations = localStorage.getItem('sarawakTourismRecentLocations');
    if (savedRecentLocations) {
      try {
        setRecentLocations(JSON.parse(savedRecentLocations));
      } catch (error) {
        console.error('Error parsing recent locations from localStorage:', error);
        setRecentLocations([]);
      }
    }
  }, []);

  // Save recent locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify(recentLocations));
  }, [recentLocations]);

  // Set up the addToRecent function reference for the parent component
  useEffect(() => {
    if (onSetAddToRecentRef) {
      onSetAddToRecentRef(addToRecentLocations);
    }
  }, [onSetAddToRecentRef]);

  // Set up the openRecentSection function reference for the parent component
  useEffect(() => {
    if (onSetOpenRecentSectionRef) {
      onSetOpenRecentSectionRef(() => {
        setShowRecentSection(true);
        setActiveMenu('recentLocations');
      });
    }
  }, [onSetOpenRecentSectionRef]);

  // Set up the toggleBookmark function reference for the parent component
  useEffect(() => {
    if (onSetToggleBookmarkRef) {
      onSetToggleBookmarkRef(() => {
        setShowBookmarkpage(true);
        setActiveMenu('bookmark');
      });
    }
  }, [onSetToggleBookmarkRef]);

  // Clear functions
  const handleClearStartingPoint = () => {
    setStartingPoint('');
    setStartingPointCoords(null);
    if (setOsrmRouteCoords) setOsrmRouteCoords([]);
    if (setOsrmWaypoints) setOsrmWaypoints([]);
    setAddDestinations([]);
    setWaypointCoords([]);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setNearbyPlaces([]);
    autoCalculatedRef.current = false;
  };

  const handleClearDestination = () => {
    setCurrentDestinationInput('');
    setDestinationCoords(null);
    if (setOsrmRouteCoords) setOsrmRouteCoords([]);
    if (setOsrmWaypoints) setOsrmWaypoints([]);
    setAddDestinations([]);
    setWaypointCoords([]);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setNearbyPlaces([]);
    autoCalculatedRef.current = false;
  };

  const handleClearAllRouting = () => {
    setStartingPoint('');
    setCurrentDestinationInput('');
    setStartingPointCoords(null);
    setDestinationCoords(null);
    if (setOsrmRouteCoords) setOsrmRouteCoords([]);
    if (setOsrmWaypoints) setOsrmWaypoints([]);
    setAddDestinations([]);
    setWaypointCoords([]);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setNearbyPlaces([]);
    autoCalculatedRef.current = false;
    
    if (onClearAllRouting) {
      onClearAllRouting();
    }
  };

  const handleAddCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Prevent multiple clicks
    if (isLocationFetching) {
      toast.warning("Please wait... Fetching your location");
      return;
    }

    setIsLocationFetching(true);

    // Check permission status (if available)
    try {
      const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
      if (permissionStatus?.state === 'denied') {
        toast.error("Location permission denied. Please enable it in browser settings.");
        setIsLocationFetching(false);
        return;
      }
    } catch {
      // Ignore permissions API errors; proceed to geolocation
    }

    // Small debounce to prevent spamming
    await new Promise(resolve => setTimeout(resolve, 2500));

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Basic validation of coordinates
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          toast.error("Invalid coordinates from geolocation");
          setIsLocationFetching(false);
          return;
        }

        setCurrentLocation({ lat: latitude, lng: longitude });

        // Accuracy check (meters)
        if (accuracy > 10000) {
          toast.error(
            `GPS signal weak (accuracy: ${Math.round(accuracy)}m).\n
          1. Ensure high-accuracy mode is enabled on your device.\n
          2. Move to an open area.`,
          );
          setIsLocationFetching(false);
          return;
        }

        // Prepare current location label and coords
        const label = "Current Location";
        const coords = { lat: latitude, lng: longitude };

        // Determine how to apply current location based on filled inputs
        const startText = (startingPoint || "").trim();
        const destText = (currentDestinationInput || "").trim();
        const hasStart = startText.length > 0;
        const hasDest = destText.length > 0;

        try {
          if (hasStart && hasDest) {
            // Both fields filled → add current location as a waypoint
            setAddDestinations(prev => [...prev, label]);
            setWaypointCoords(prev => [...prev, coords]);
            toast.success("Current location added as waypoint");
          } else if (hasStart) {
            // Only starting filled → set current location as destination
            setCurrentDestinationInput(label);
            setDestinationCoords(coords);
            toast.success("Current location set as destination");
          } else {
            // Starting empty → set current location as starting point
            setStartingPoint(label);
            setStartingPointCoords(coords);
            toast.success("Current location set as starting point");
          }
        } finally {
          setIsLocationFetching(false);
        }
      },
      (error) => {
        setIsLocationFetching(false);
        const errorMessage = error.code === error.PERMISSION_DENIED 
          ? "Please enable location permissions in your browser settings"
          : error.message;
        toast.error(errorMessage);
      },
      options
    );
  };

  // Helper functions
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}mins` : `${minutes}mins`;
  };

  const formatDistance = (meters) => {
    const km = meters / 1000;
    return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`;
  };

  // Function to generate directions link
  const generateDirectionsLink = async () => {
    let startCoords = startingPointCoords;
    let endCoords = destinationCoords;

    // Fallback geocoding for manual text entry (no autocomplete selection)
    if (!startCoords && startingPoint?.trim()) {
      try {
        startCoords = await geocodeAddressNominatim(startingPoint);
      } catch (error) {
        console.error('Failed to geocode starting point:', error);
      }
    }
    if (!endCoords && (currentDestinationInput?.trim() || destination?.trim())) {
      try {
        const addressText = currentDestinationInput?.trim() || destination?.trim();
        endCoords = await geocodeAddressNominatim(addressText);
      } catch (error) {
        console.error('Failed to geocode destination:', error);
      }
    }

    if (!startCoords || !endCoords) {
      toast.error('Please set both starting point and destination');
      return null;
    }

    const start = `${startCoords.lat},${startCoords.lng}`;
    const end = `${endCoords.lat},${endCoords.lng}`;

    const googleMapsLink = `https://www.google.com/maps/dir/${start}/${end}`;
    const appLink = `${window.location.origin}?route=true&start=${start}&end=${end}&vehicle=${selectedVehicle}`;
    return { googleMapsLink, appLink };
  };

  // Function to copy directions link
  const copyDirectionsLink = async () => {
    const links = await generateDirectionsLink();
    if (!links) return;
    try {
      await navigator.clipboard.writeText(links.googleMapsLink);
      toast.success('Directions link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link. Please try again.');
     }
  };

  // Function to share directions
  const shareDirections = async () => {
    const links = await generateDirectionsLink();
    if (!links) return;
    const shareData = {
      title: 'Directions',
      text: `Directions from ${startingPoint} to ${destination}`,
      url: links.googleMapsLink,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Directions shared successfully!');
      } else {
        await navigator.clipboard.writeText(links.googleMapsLink);
        toast.success('Directions link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error);
        toast.error('Failed to share directions. Please try again.');
      }
    }
  };

  // Toggle functions
  function toggleRecentHistory() {
    const wasOpen = showRecentSection;
    closeAllPanels();
    if (!wasOpen) {
      setShowRecentSection(true);
      setActiveMenu('recent');
    }
  }

   const toggleSidebar = () => {
    const wasOpen = sidebarExpanded;
    closeAllPanels();
    if (!wasOpen) {
      setSidebarExpanded(true);
    }
  };

  const toggleRecentSection = () => {
    const wasOpen = showRecentSection;
    closeAllPanels();
    if (!wasOpen) {
      setShowRecentSection(true);
      setActiveMenu('recent');
    }
  };

  const toggleBusinessPanel = () => {
    const wasOpen = showBusiness;
    closeAllPanels();
    if (!wasOpen) {
      setShowBusiness(true);
    }
  };

  const toggleBookmark = () => {
    console.log('toggleBookmark called, isLoggedIn:', isLoggedIn);
    
    // Check if user is logged in before opening bookmark panel
    if (!isLoggedIn) {
      console.log('User not logged in, opening login overlay');
      toast.info('Please login to access your bookmarks');
      openLoginOverlay();
      return;
    }
    
    console.log('User is logged in, toggling bookmark panel');
    const wasOpen = showBookmarkpage;
    closeAllPanels();
    if (!wasOpen) {
      setShowBookmarkpage(true);
      setActiveMenu('bookmark');
    }
  };

  const toggleLayersPanel = () => {
    const wasOpen = showLayersPanel;
    closeAllPanels();
    if (!wasOpen) {
      setShowLayersPanel(true);
    }
  };

  // NEW: Toggle function for nearby drawer to be used in onClick
  const toggleNearbyDrawer = () => {
    const wasOpen = isNearbyDrawerOpen;
    closeAllPanels();
    if (!wasOpen) {
      setIsNearbyDrawerOpen(true);
      setActiveMenu('nearby');
    }
  };

  const openLoginOverlay = () => {
    setShowLoginModal(true);
  };

  const handleDeleteItems = (itemsToDelete) => {
    if (setHistory) {
      setHistory(prev => prev.filter(item => !itemsToDelete.includes(item)));
    }
  };

  // Function to add a location to recent locations
  const normalizeRecentLocation = (raw) => {
    const full = raw.full || {};
    const latRaw = raw.latitude ?? raw.lat ?? full.latitude;
    const lngRaw = raw.longitude ?? raw.lng ?? full.longitude;
    const latitude = typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw;
    const longitude = typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw;

    const base = {
      name: raw.name || full.name,
      description: raw.description || full.description || '',
      latitude,
      longitude,
      type: raw.type || full.type || 'Location',
      source: raw.source || full.source || 'search',
      image: raw.image || full.image,
      businessImage: raw.businessImage || full.businessImage,
      website: raw.website || full.website || full.url,
      address: raw.address || full.address,
      phone: raw.phone || full.phone,
      openingHours: raw.openingHours || full.openingHours,
      ownerEmail: raw.ownerEmail || full.ownerEmail,
      owner: raw.owner || full.owner,
      category: raw.category || full.category,
      status: raw.status || full.status,
      rating: raw.rating ?? full.rating,
      division: raw.division || full.division,
      eventType: raw.eventType || full.eventType,
      startDate: raw.startDate || full.startDate,
      endDate: raw.endDate || full.endDate,
      startTime: raw.startTime || full.startTime,
      endTime: raw.endTime || full.endTime,
      registrationRequired: raw.registrationRequired || full.registrationRequired,
      dailySchedule: raw.dailySchedule || full.dailySchedule,
      eventHashtags: raw.eventHashtags || full.eventHashtags,
      eventOrganizer: raw.eventOrganizer || full.eventOrganizer,
    };

    return {
      ...base,
      placeId: raw.placeId || full._id || `${base.name}-${latitude}-${longitude}`,
      timestamp: new Date().toISOString(),
    };
  };

  const addToRecentLocations = (location) => {
    if (!location || !location.name) return;

    const normalized = normalizeRecentLocation(location);

    setRecentLocations(prev => {
      const near = 0.0001;
      const filtered = prev.filter(item =>
        !(item.name === normalized.name &&
          Math.abs(Number(item.latitude) - Number(normalized.latitude)) < near &&
          Math.abs(Number(item.longitude) - Number(normalized.longitude)) < near)
      );
      const next = [normalized, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('recentLocationsUpdated', { detail: { action: 'add', item: normalized } }));
      } catch {}
      return next;
    });
  };

  // Drawer bookmark click handler: mirror bookmark plotting in BookmarkPage
  const handleNearbyBookmarkClick = (bookmarkData) => {
    handleClearAllRouting();
    if (setSelectedSearchBarPlace) {
      setSelectedSearchBarPlace(null);
    }

    const latRaw = bookmarkData.latitude ?? bookmarkData.coordinates?.latitude;
    const lngRaw = bookmarkData.longitude ?? bookmarkData.coordinates?.longitude;
    const latitude = typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw;
    const longitude = typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw;

    if (setSelectedSearchBarPlace) {
      setSelectedSearchBarPlace({
        name: bookmarkData.name,
        latitude,
        longitude,
        description: bookmarkData.description || '',
        type: bookmarkData.type || 'Bookmark',
        placeId: bookmarkData.placeId || bookmarkData.place_id
      });
    }

    // Ensure only one anchor source is active
    if (setActiveSearchLocation) {
      setActiveSearchLocation(null);
    }

    if (setSelectedPlace) {
      setSelectedPlace({
        ...bookmarkData,
        latitude,
        longitude,
      });
    }
    setIsNearbyDrawerOpen(true);
    setActiveMenu('nearby');
  };

  // Function to handle recent location click
  const handleRecentLocationClick = (location) => {
    handleClearAllRouting();

    const latRaw = location.latitude ?? location.coordinates?.latitude;
    const lngRaw = location.longitude ?? location.coordinates?.longitude;
    const latitude = typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw;
    const longitude = typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw;

    // Use the same pattern as bookmark handlers for consistent behavior
    if (setSelectedSearchBarPlace) {
      setSelectedSearchBarPlace(null);
      setSelectedSearchBarPlace({
        name: location.name,
        latitude,
        longitude,
        description: location.description || '',
        type: location.type || 'Recent',
        placeId: location.placeId || location.place_id
      });
    }

    // Clear activeSearchLocation to ensure only one anchor source is active
    if (setActiveSearchLocation) {
      setActiveSearchLocation(null);
    }

    if (setSelectedPlace) {
      setSelectedPlace({
        ...location,
        latitude,
        longitude
      });
    }

    setShowRecentSection(false);
    setActiveMenu('');
    setIsNearbyDrawerOpen(true);
    setActiveMenu('nearby');
  };

  // Function to delete selected recent locations
  const handleDeleteRecentItems = (itemsToDelete) => {
    try {
      // Compute next list now so we can persist before broadcasting
      const next = recentLocations.filter(item => !itemsToDelete.includes(item));
      setRecentLocations(next);
      localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify(next));
      // Notify any listeners (e.g., search dropdown) to refresh their recent caches
      window.dispatchEvent(new CustomEvent('recentLocationsUpdated', { detail: { action: 'delete_selected', items: itemsToDelete } }));
    } catch (_) {
      // no-op
    }
  };

  // Function to clear all recent locations
  const handleClearAllRecent = () => {
    try {
      setRecentLocations([]);
      // Clear persisted storage immediately for other components relying on it
      localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify([]));
      // Broadcast a global event so any dropdowns/consumers can clear their UI
      window.dispatchEvent(new CustomEvent('recentLocationsUpdated', { detail: { action: 'clear_all' } }));
    } catch (_) {
      // no-op
    }
  };

  const handleRoutesCalculated = (routesData) => {
    if (routesData && routesData.routes) {
      // setRoutes(routesData.routes || []);
      // setSelectedRouteIndex(0);
    } else {
      // setRoutes([]);
    }
  };

  const handleAddDestination = () => {
    setAddDestinations(prev => [...prev, '']);
    setWaypointCoords(prev => [...prev, null]);
  };

  const handleDestinationChange = (index, value) => {
    const newDestinations = [...addDestinations];
    newDestinations[index] = value;
    setAddDestinations(newDestinations);
  };

  const handleNearbyPlaceClick = (place) => {
    const resolveLat = () =>
      typeof place?.geometry?.location?.lat === 'function'
        ? place.geometry.location.lat()
        : place?.geometry?.location?.lat ?? place?.latitude;

    const resolveLng = () =>
      typeof place?.geometry?.location?.lng === 'function'
        ? place.geometry.location.lng()
        : place?.geometry?.location?.lng ?? place?.longitude;

    const lat = resolveLat();
    const lng = resolveLng();

    const placeData = {
      place_id: place.place_id || place.id,
      name: place.name,
      vicinity: place.vicinity || 'Nearby area',
      rating: place.rating || null,
      user_ratings_total: place.user_ratings_total || 0,
      // normalized coordinates for map usage
      latitude: typeof lat === 'string' ? parseFloat(lat) : lat,
      longitude: typeof lng === 'string' ? parseFloat(lng) : lng,
      // add redundant formats so any consumer can read them
      lat: typeof lat === 'string' ? parseFloat(lat) : lat,
      lng: typeof lng === 'string' ? parseFloat(lng) : lng,
      coordinates: { latitude: typeof lat === 'string' ? parseFloat(lat) : lat,
                     longitude: typeof lng === 'string' ? parseFloat(lng) : lng },
      type: place.type || 'place',
      categories: place.categories,
      tags: place.tags,
      properties: place.properties,
      phone: place.phone,
      website: place.website || place.url,
      owner: place.owner,
      ownerEmail: place.ownerEmail,
      openingHours: place.openingHours,
      businessImage: place.businessImage,
      image: place.image || place.imageUrl,
      description:
        place.description ||
        place.vicinity ||
        place.type ||
        'Nearby place',
    };

    if (setSelectedPlace) {
      setSelectedPlace(placeData);
    }

    const customEvent = new CustomEvent('nearbyPlaceSelected', { detail: placeData });
    window.dispatchEvent(customEvent);
  };

  // Fetch nearby places using Overpass API (free alternative to Google Places)
const fetchNearbyPlaces = async (locationCoords, radius = 5000) => {
  const { lat, lng } = locationCoords;
  
  // Convert radius from meters to degrees (approximate)
  const radiusDegrees = radius / 111000; // 1 degree ≈ 111km
  
  // Overpass API query for nearby amenities
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|food_court)$"]["name"](around:${radius},${lat},${lng});
      node["tourism"~"^(hotel|guest_house|hostel|attraction|museum|gallery)$"]["name"](around:${radius},${lat},${lng});
      node["shop"~"^(supermarket|convenience|clothes|electronics|bookstore)$"]["name"](around:${radius},${lat},${lng});
      node["leisure"~"^(park|playground|sports_centre|swimming_pool)$"]["name"](around:${radius},${lat},${lng});
    );
    out center meta;
  `;
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    
    if (!response.ok) {
      throw new Error('Overpass API request failed');
    }
    
    const data = await response.json();
    
    // Process the results
    const places = data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => ({
        place_id: `overpass_${element.id}`,
        name: element.tags.name,
        vicinity: element.tags['addr:street'] || element.tags['addr:city'] || 'Nearby area',
        rating: null, // Overpass doesn't provide ratings
        user_ratings_total: 0,
        geometry: {
          location: {
            lat: () => element.lat || element.center?.lat,
            lng: () => element.lon || element.center?.lon
          }
        },
        type: element.tags.amenity || element.tags.tourism || element.tags.shop || element.tags.leisure || 'place',
        tags: element.tags
      }))
      .slice(0, 10); // Limit to 10 results
    
    return places;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return [];
  }
};

const handleVehicleClick = async (vehicle) => {
  setSelectedVehicle(vehicle);
  setIsLoading(true);
  const toastId = toast.loading('Calculating route...');
  
  // If this is a manual selection (not auto-calculation), reset the flag
  if (autoCalculatedRef.current) {
    autoCalculatedRef.current = false;
  }

  try {
    let startCoords = startingPointCoords;
    let endCoords = destinationCoords;

    // Fallback geocode starting point if coords missing
    if (!(startCoords?.lat && startCoords?.lng) && startingPoint?.trim()) {
      try {
        const geo = await geocodeAddressNominatim(startingPoint.trim());
        startCoords = geo;
      } catch (error) {
        console.error('Failed to geocode starting point:', error);
      }
    }

    // Fallback geocode destination using displayed input
    const destinationText = (currentDestinationInput ?? destination)?.trim();
    if (!(endCoords?.lat && endCoords?.lng) && destinationText) {
      try {
        const geo = await geocodeAddressNominatim(destinationText);
        endCoords = geo;
      } catch (error) {
        console.error('Failed to geocode destination:', error);
      }
    }

    // Strict coordinate presence check
    if (!(startCoords?.lat && startCoords?.lng) || !(endCoords?.lat && endCoords?.lng)) {
      toast.error('Please set both starting point and destination', { id: toastId });
      setIsLoading(false);
      return;
    }

    // Use waypointCoords for waypoints that have a value, otherwise geocode
    const waypointsCoords = await Promise.all(
      addDestinations.map(async (dest, idx) => {
        if (!dest?.trim()) return null;
        if (waypointCoords[idx]) return waypointCoords[idx];
        try {
          return await geocodeAddressNominatim(dest);
        } catch (error) {
          console.error(`Failed to geocode waypoint ${idx}:`, error);
          return null;
        }
      })
    ).then(arr => arr.filter(Boolean));

    // Abort any in-flight route requests
    if (routeAbortRef.current) routeAbortRef.current.abort();
    routeAbortRef.current = new AbortController();
    const { signal } = routeAbortRef.current;

    // FAST PATH: render a basic OSRM route first for instant feedback
    const fastProfile = travelModes[vehicle]?.fallbackProfile || travelModes[vehicle]?.profile || 'driving';
    let fastData;
    try {
      fastData = await fetchOSRMRoute(startCoords, endCoords, waypointsCoords, fastProfile, signal);
    } catch (e) {
      console.warn('Fast OSRM route failed, continuing to fallback:', e?.message);
      fastData = null;
    }

    if (fastData?.routes?.length) {
      const first = fastData.routes[0];
      const coords = first.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      toast.loading('Found a quick route. Refining options...', { id: toastId });

      setRouteAlternatives([{
        index: 0, distance: first.distance, duration: first.duration,
        coords, vehicle, roadInfo: first.roadInfo || []
      }]);
      setSelectedRouteIndex(0);

      if (setOsrmRouteCoords) setOsrmRouteCoords(coords);
      if (setOsrmWaypoints) setOsrmWaypoints(waypointsCoords);
      setRouteSummary({
        distance: first.distance,
        duration: first.duration,
        vehicle,
        roadInfo: first.roadInfo || []
      });
    }

    // End loading early so map draws immediately
    setIsLoading(false);

    // Fetch nearby places around the destination (always, not only when drawer is open)
    try {
      const nearby = await fetchNearbyPlaces(endCoords, 2000);
      setNearbyPlaces(nearby || []);
    } catch (error) {
      console.warn('Failed to fetch nearby places:', error);
      setNearbyPlaces([]);
    }

    // BACKGROUND: compute richer alternatives; don't block the UI
    Promise.resolve().then(async () => {
      try {
        const routeData = await fetchRouteWithAlternatives(startCoords, endCoords, waypointsCoords, vehicle);
        if (routeData.routes && routeData.routes.length > 0) {
          const alternatives = routeData.routes.map((route, index) => ({
            index,
            distance: route.distance,
            duration: route.duration,
            coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            vehicle,
            roadInfo: route.roadInfo || []
          }));
          setRouteAlternatives(alternatives);
          setSelectedRouteIndex(0);
          // Keep summary in sync with the best route
          const best = alternatives[0];
          setRouteSummary({
            distance: best.distance,
            duration: best.duration,
            vehicle: best.vehicle,
            roadInfo: best.roadInfo
          });
          toast.success(
            alternatives.length > 1
              ? `${vehicle} routes updated: ${alternatives.length} options available.`
              : `${vehicle} route updated.`,
              { id: toastId }
          );
        }
      } catch (err) {
        console.warn('Background alternatives failed:', err?.message);
        toast.error('Could not find better route options.', { id: toastId });
      }
    });
  } catch (error) {
    console.error('Routing error:', error);
    
    // Create a fallback straight-line route if we have start and end coordinates
    if (startingPointCoords && destinationCoords) {
      console.log('Creating fallback straight-line route');
      const fallbackCoords = [
        [startingPointCoords.lat, startingPointCoords.lng],
        [destinationCoords.lat, destinationCoords.lng]
      ];
      
      // Calculate straight-line distance
      const distance = Math.sqrt(
        Math.pow(destinationCoords.lat - startingPointCoords.lat, 2) + 
        Math.pow(destinationCoords.lng - startingPointCoords.lng, 2)
      ) * 111000; // Convert to meters (rough approximation)
      
      const fallbackRoute = {
        index: 0,
        distance: distance,
        duration: distance / (vehicle === 'Walking' ? 1.4 : vehicle === 'Bicycle' ? 4.2 : 13.9), // Rough speed in m/s
        coords: fallbackCoords,
        vehicle
      };
      
      setRouteAlternatives([fallbackRoute]);
      setSelectedRouteIndex(0);
      if (setOsrmRouteCoords) setOsrmRouteCoords(fallbackCoords);
      setRouteSummary({ 
        distance: fallbackRoute.distance, 
        duration: fallbackRoute.duration,
        vehicle: fallbackRoute.vehicle
      });
      
      toast.warning(`Using fallback route for ${vehicle}. API routing failed: ${error.message}`, { id: toastId });
    } else {
      setRouteSummary(null);
      if (setOsrmRouteCoords) setOsrmRouteCoords([]);
      setRouteAlternatives([]);
      setSelectedRouteIndex(0);
      setNearbyPlaces([]);
      
      // Show more helpful error messages
      if (vehicle === 'Walking' && error.message.includes('walking route')) {
        toast.error('Walking route not available. The route may not be accessible on foot. Try using a different transport mode.', { id: toastId });
      } else if (vehicle === 'Bicycle' && error.message.includes('cycling route')) {
        toast.error('Cycling route not available. The route may not be accessible by bicycle. Try using a different transport mode.', { id: toastId });
      } else {
        toast.error(`Failed to calculate routes for ${vehicle}: ${error.message}`, { id: toastId });
      }
    }
  } finally {
    setIsLoading(false);
  }
};

// Coordinate-based auto-calc: keep guard; no default vehicle means it won't run
  useEffect(() => {
    const shouldAutoCalculate = 
      startingPointCoords &&
      destinationCoords &&
      !isLoading &&
      routeAlternatives.length === 0 &&
      !autoCalculatedRef.current;

    if (shouldAutoCalculate) {
      autoCalculatedRef.current = true;
      setSelectedVehicle('Car');
      handleVehicleClick('Car');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startingPointCoords, destinationCoords, isLoading, routeAlternatives.length]);

  // NEW: Recalculate route automatically when waypoint coordinates change
  useEffect(() => {
    // Only run when we have start, destination and a chosen vehicle
    const hasStart = !!(startingPointCoords?.lat && startingPointCoords?.lng);
    const hasEnd = !!(destinationCoords?.lat && destinationCoords?.lng);
    const hasVehicle = !!selectedVehicle;

    if (!hasStart || !hasEnd || !hasVehicle) return;
    if (isLoading) return;

    // Trigger a route recalculation to refresh route and waypoint markers
    handleVehicleClick(selectedVehicle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypointCoords]);

// Input-based auto-calc effect: disable unless a vehicle is selected
useEffect(() => {
  const hasInputs = Boolean(startingPoint?.trim()) && Boolean(currentDestinationInput?.trim());
  if (!hasInputs || !selectedVehicle || isLoading || routeAlternatives.length > 0) {
    return;
  }
  // No auto-trigger here; user must click a transport option
}, [startingPoint, currentDestinationInput, selectedVehicle, isLoading, routeAlternatives.length]);

  // Handle starting point selection from search
  const handleStartingPointSelect = useCallback((place) => {
    if (place && place.lat !== undefined && place.lon !== undefined) {
      setStartingPoint(place.name || place.display_name || 'Selected Location');
      setStartingPointCoords({ lat: place.lat, lng: place.lon });
      
      // Add to recent locations
      addToRecentLocations({
        name: place.name || place.display_name,
        latitude: place.lat,
        longitude: place.lon,
        type: 'Location',
        source: 'search'
      });
    }
  }, []);

  // Handle destination selection from search - UPDATED to set both name and coordinates
  const handleDestinationSelect = useCallback((place) => {
    if (!place) return;

    const placeName =
        place.properties?.name ||
        place.name ||
        place.display_name ||
        'Selected Location';

    const lon = place.lon ?? place.lng ?? place.geometry?.coordinates?.[0];
    const lat = place.lat ?? place.geometry?.coordinates?.[1];

    setCurrentDestinationInput(placeName);

    if (typeof lat === 'number' && typeof lon === 'number') {
        setDestinationCoords({ lat, lng: lon });

        addToRecentLocations({
            name: placeName,
            latitude: lat,
            longitude: lon,
            type: 'Location',
            source: 'search'
        });

        if (startingPointCoords) {
            autoCalculatedRef.current = false;
        }
    } else {
        geocodeAddressNominatim(placeName)
            .then((geo) => {
                setDestinationCoords({ lat: geo.lat, lng: geo.lng });
                addToRecentLocations({
                    name: placeName,
                    latitude: geo.lat,
                    longitude: geo.lng,
                    type: 'Location',
                    source: 'search'
                });
                if (startingPointCoords) {
                    autoCalculatedRef.current = false;
                }
            })
            .catch(() => {
                toast.error('Unable to resolve coordinates for selected destination');
            });
    }
  }, [startingPointCoords]);

  const handleManualDestinationSubmit = useCallback(async (text) => {
    try {
      const query = (text || '').trim();
      if (!query) {
        toast.error('Please enter a destination');
        setCurrentDestinationInput(text);
        setDestinationCoords(null);
        return;
      }

      const res = await geocodeAddressNominatim(query);
      if (res && typeof res.lat === 'number' && typeof res.lng === 'number') {
        setCurrentDestinationInput(query);
        setDestinationCoords({ lat: res.lat, lng: res.lng });

        addToRecentLocations({
          name: query,
          latitude: res.lat,
          longitude: res.lng,
          type: 'Location',
          source: 'manual'
        });

        if (startingPointCoords) {
          autoCalculatedRef.current = false;
        }
      } else {
        setCurrentDestinationInput(text);
        setDestinationCoords(null);
        toast.error('No matching address found.');
      }
    } catch (err) {
      setCurrentDestinationInput(text);
      setDestinationCoords(null);
      toast.error('No matching address found.');
    }
  }, [startingPointCoords]);

  // Enhanced function to set destination from external sources with detailed data fetching
  const setDestinationFromExternal = useCallback(async (name, coords, additionalData = {}) => {
    console.log('Setting destination from external:', name, coords, additionalData);
    
    // Set both the destination input field and coordinates
    setCurrentDestinationInput(name || 'Selected Location');
    
    if (coords && coords.lat && coords.lng) {
      setDestinationCoords({
        lat: coords.lat,
        lng: coords.lng
      });
      
      // Enhanced recent location entry with additional data
      const enhancedLocationData = {
        name: name || 'Selected Location',
        latitude: coords.lat,
        longitude: coords.lng,
        type: additionalData.type || 'Location',
        source: additionalData.source || 'directions',
        description: additionalData.description || '',
        address: additionalData.address || '',
        website: additionalData.website || '',
        phone: additionalData.phone || '',
        category: additionalData.category || '',
        ...additionalData
      };
      
      // Add to recent locations with enhanced data
      addToRecentLocations(enhancedLocationData);
      
      console.log('Enhanced destination coordinates set:', coords);
      
      // If starting point is also set, reset auto-calculate flag to trigger route calculation
      if (startingPointCoords) {
        autoCalculatedRef.current = false;
      }
    }
  }, [startingPointCoords]);

  // Update the useImperativeHandle to use the new function
  useImperativeHandle(ref, () => ({
    setDestinationFromExternal: setDestinationFromExternal,
    // ... other methods
    openSidebar: () => {
      setSidebarExpanded(true);
    },
    closeSidebar: () => {
      setSidebarExpanded(false);
    },
    setDestinationAndOpen: (name, coords) => {
      setDestinationFromExternal(name, coords);
      setSidebarExpanded(true);
    },
    setDestinationName: (name) => {
      setCurrentDestinationInput(name);
    },
    // NEW: clear all routing programmatically (inputs, coords, and map state via props)
    clearAllRouting: () => {
      handleClearAllRouting();
    }
  }));

useEffect(() => {
    // Routing is active if both start and end are set (and valid), or if there are any waypoints
    const routingActive =
      !!startingPointCoords &&
      !!destinationCoords &&
      (addDestinations.length === 0 || waypointCoords.some(Boolean));
    if (setIsRoutingActive) {
      setIsRoutingActive(routingActive);
    }
  }, [startingPointCoords, destinationCoords, addDestinations, waypointCoords, setIsRoutingActive]);

  // Notify parent component when route alternatives change
  useEffect(() => {
    if (onRouteAlternativesChange) {
      onRouteAlternativesChange(routeAlternatives, selectedRouteIndex);
    }
  }, [routeAlternatives, selectedRouteIndex, onRouteAlternativesChange]);

  // Fetch nearby places when a searched location is selected (no routing required)
  useEffect(() => {
    const lat = activeSearchLocation?.coordinates?.latitude ?? activeSearchLocation?.latitude;
    const lng = activeSearchLocation?.coordinates?.longitude ?? activeSearchLocation?.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        setNearbyError(null);
        const places = await fetchNearbyPlaces({ lat, lng }, 1000);
        if (!cancelled) {
          setNearbyPlaces(places || []);
        }
      } catch (err) {
        if (!cancelled) {
          setNearbyPlaces([]);
          setNearbyError('Failed to load nearby places');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [activeSearchLocation]);

  // Keep map state synchronized with panel updates
  useEffect(() => {
    if (onNearbyPlacesChange) {
      onNearbyPlacesChange(nearbyPlaces);
    }
  }, [nearbyPlaces, onNearbyPlacesChange]);

  // Notify parent component when route info changes
  useEffect(() => {
    if (onRouteInfoChange) {
      const waypointsDetails = addDestinations
        .map((wpName, idx) => {
          const coords = waypointCoords[idx] || null;
          return {
            name: wpName,
            address: wpName,
            latitude: coords?.lat,
            longitude: coords?.lng,
            coordinates: coords ? { latitude: coords.lat, longitude: coords.lng } : null
          };
        })
        .filter(wp => wp?.name?.trim());

      onRouteInfoChange({
        startingPoint,
        destination: currentDestinationInput || destination,
        startingPointCoords,
        destinationCoords,
        waypoints: waypointsDetails
      });
    }
  }, [startingPoint, destination, currentDestinationInput, startingPointCoords, destinationCoords, addDestinations, waypointCoords, onRouteInfoChange]);
  

  return (
    <>
      {/* Sliding drawer for search-selected location nearby places */}
      <NearbyPlacesDrawer
        isOpen={isNearbyDrawerOpen}
        onToggle={setIsNearbyDrawerOpen}
        headerTitle="Nearby Places"
        selectedCategory={nearbyFilterCategory}
        onCategoryChange={onNearbyFilterCategoryChange}
      >
        {/* Nearby Around Selection */}
        <NearbyPlacesPanel
          title="Nearby Around Selection"
          places={(
            ((activeSearchLocation || destinationCoords) ? nearbyPlaces : (searchNearbyPlaces || []))
              .filter((p) => matchesCategoryInSidebar(p, nearbyFilterCategory))
              // Exclude the anchor/bookmark location itself from the list
              .filter((p) => !isSamePlaceAsAnchor(p, anchorCoords))
          )}
          anchorCoords={anchorCoords}
          onItemClick={handleNearbyPlaceClick}
          selectedPlaceId={selectedPlace?.place_id}
        />
      </NearbyPlacesDrawer>

      <div className="sidebar100">
        <div
          className="menu-icon100 menu-icon100-route"
          onClick={toggleSidebar}
          role="button"
          aria-label="Open Route panel"
          tabIndex={0}
          onKeyDown={(e) => handleAccessibleKeyDown(e, toggleSidebar)}
        >
          <FaRoute className="icon100" aria-hidden="true" />
          <span className="label100-route desktop-only">Route</span>
        </div>
        <div
          className={`menu-item100${activeMenu === 'recent' ? ' active' : ''}`}
          onClick={toggleRecentSection}
          role="button"
          aria-label="Open Recent"
          tabIndex={0}
          onKeyDown={(e) => handleAccessibleKeyDown(e, toggleRecentSection)}
        >
          <FaClock className="icon100" aria-hidden="true" />
          <span className="label100">Recent</span>
        </div>
      
        <div
          className={`menu-item100${activeMenu === 'bookmark' ? ' active' : ''}`}
          onClick={toggleBookmark}
          role="button"
          aria-label="Open Bookmark"
          tabIndex={0}
          onKeyDown={(e) => handleAccessibleKeyDown(e, toggleBookmark)}
        >
          <FaBookmark className="icon100" aria-hidden="true" />
          <span className="label100">Bookmark</span>
        </div>

        <div
          className={`menu-item100${activeMenu === 'nearby' ? ' active' : ''}`}
          onClick={toggleNearbyDrawer}
          role="button"
          aria-label="Open Nearby"
          tabIndex={0}
          onKeyDown={(e) => handleAccessibleKeyDown(e, toggleNearbyDrawer)}
        >
          <FaCompass className="icon100" aria-hidden="true" />
          <span className="label100">Nearby</span>
        </div>

        {isLoggedIn && user?.role === 'business' && (
          <div
            className={`menu-item100${activeMenu === 'business' ? ' active' : ''}`}
            onClick={() => {
              if (activeMenu === 'business') {
                setActiveMenu('');
                toggleBusinessPanel();
              } else {
                setActiveMenu('business');
                toggleBusinessPanel();
              }
            }}
          >
            <FaBuilding className="icon100" />
            <span className="label100">Business</span>
          </div>
        )}

        {isLoggedIn && user?.role === 'business' && (
          <div
            className={`menu-item100${activeMenu === 'managebusiness' ? ' active' : ''}`}
            onClick={() => {
              setActiveMenu('managebusiness');
              window.location.href = '/manage-business';
            }}
          >
            <MdManageAccounts className="icon100" />
            <span className="label100">Manage Business</span>
          </div>
        )}
        <div
          className={`menu-item101${activeMenu === 'layers' ? ' active' : ''}`}
          onClick={() => {
            if (activeMenu === 'layers') {
              setActiveMenu('');
              toggleLayersPanel();
            } else {
              setActiveMenu('layers');
              toggleLayersPanel();
            }
          }}
        >
          <FaLayerGroup className="icon100" />
          <span className="label100">Layers</span>
        </div>
      </div>
    
      <div 
        className={`side-panel100 ${sidebarExpanded ? 'expanded' : ''}`}
        style={isMobile ? { height: `${panelHeight}vh`, transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)' } : {}}
      >
        <div 
        className="transport-section"
        onClick={(e) => {
          if (!isMobile) return;
          setPanelHeight(h => (h >= 60 ? 30 : 60));
          e.stopPropagation(); // Prevent event from bubbling if needed
        }}
        style={{ cursor: isMobile ? "pointer" : undefined }}>
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaMapMarkerAlt className="section-icon" />
                <span>Map Route Direction</span>
              </span>
              {/* Chevron indicator */}
              {isMobile ? (
                panelHeight >= 60 ? (
                  <FaChevronDown style={{ fontSize: 18, marginLeft: "auto" }} />
                ) : (
                  <FaChevronUp style={{ fontSize: 18, marginLeft: "auto" }} />
                )
              ) : null}
            </div>
            <div className="transport-row">
              {['Car', 'Bus', 'Walking'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} 
                    onClick={() => handleVehicleClick(v)}>
                  {v === 'Car' ? <FaCar /> : v === 'Bus' ? <FaBus /> : <FaWalking />}
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="transport-row">
              {['Bicycle', 'Motorbike'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} 
                    onClick={() => handleVehicleClick(v)}>
                  {v === 'Bicycle' ? <FaBicycle /> : <FaMotorcycle />}
                  <span>{v}</span>
                </div>
              ))}
              <div className="transport-option disabled" title="Not available">
                <FaPlane />
                <span>Flight</span>
              </div>
            </div>
          </div>
              
          <div className="input-container">
            <div className="input-box">
              <FaMapMarkerAlt className="input-icon-lsb red" />
              <ComprehensiveAutocompleteInput
                value={startingPoint}
                onChange={setStartingPoint}
                onSelect={(place) => {
                  setStartingPoint(place.name);
                  setStartingPointCoords({ lat: place.lat, lng: place.lon });
                }}
                placeholder="Enter starting location..."
              />
              {startingPoint && (
                <button 
                  className="clear-button2" 
                  onClick={handleClearStartingPoint}
                  title="Clear input"
                >
                  <IoCloseOutline />
                </button>
              )}
              <FaSearch className="input-icon-lsb-search" />
            </div>
          </div>

          <div className="input-container">
            <div className="input-box">
              <FaMapMarkerAlt className="input-icon-lsb red" />
              <ComprehensiveAutocompleteInput
                value={currentDestinationInput}
                onChange={setCurrentDestinationInput}
                onSelect={handleDestinationSelect}
                onManualSubmit={handleManualDestinationSubmit}
                placeholder="Enter destination..."
              />
              {currentDestinationInput && (
                <button 
                  className="clear-button2" 
                  onClick={handleClearDestination}
                  title="Clear input"
                >
                  <IoCloseOutline />
                </button>
              )}
              <FaSearch className="input-icon-lsb-search" />
            </div>
          </div>

          {addDestinations.map((dest, index) => (
            <div className="input-container" key={index}>
              <div className="input-box">
                <FaMapMarkerAlt className="input-icon-lsb-add" />
                <ComprehensiveAutocompleteInput
                  value={addDestinations[index]}
                  onChange={(val) => {
                    setAddDestinations(prev => {
                      const arr = [...prev];
                      arr[index] = val;
                      return arr;
                    });
                    setWaypointCoords(prev => {
                      const arr = [...prev];
                      arr[index] = null;
                      return arr;
                    });
                  }}
                  onSelect={(place) => {
                    setAddDestinations(prev => {
                      const arr = [...prev];
                      arr[index] = place.name;
                      return arr;
                    });
                    setWaypointCoords(prev => {
                      const arr = [...prev];
                      arr[index] = { lat: place.lat, lng: place.lon };
                      return arr;
                    });
                  }}
                  placeholder={`Add destination ${index + 1}`}
                />
                <button className="clear-button2" onClick={() => {
                    setAddDestinations(prev => prev.filter((_, i) => i !== index));
                    setWaypointCoords(prev => prev.filter((_, i) => i !== index));
                }}>
                    <IoCloseOutline />
                </button>
              </div>
            </div>
          ))}

          <div className="destination-actions-container">
            <div className="destination-actions-buttons">
              <button className="add-destination-button" onClick={handleAddDestination}>
                <MdAddLocationAlt className="action-icon" />
                Add Destination
              </button>
              <button 
                className="current-location-button" 
                onClick={handleAddCurrentLocation}
                title="Use my current location"
                disabled={isLocationFetching}
              >
                {isLocationFetching ? (
                  <>
                    <span className="location-error"></span>
                    Locating...
                  </>
                ) : (
                  <>
                    <FaLocationArrow className="action-icon" />
                    My Location
                  </>
                )}
              </button>
            </div>
          </div>

 {isLoading ? (
            <div className="loading-message">Calculating route...</div>
          ) : (hasValidInputs && routeSummary) ? (
            <div className="route-summary-container">
              <div className="route-summary-header">
                <FaMapMarkerAlt className="section-icon" />
                <h4>Route Summary</h4>
              </div>
              <div className="route-summary-item">
                <FaMapMarkerAlt className="summary-icon-lsb" />
                <span className="summary-label">Distance:</span>
                <span className="summary-value">{(routeSummary.distance / 1000).toFixed(2)} km</span>
              </div>
              <div className="route-summary-item">
                <FaClock className="summary-icon-lsb" />
                <span className="summary-label">Duration:</span>
                <span className="summary-value">{formatDuration(routeSummary.duration)}</span>
              </div>
              <div className="route-summary-item">
                <FaCar className="summary-icon-lsb" />
                <span className="summary-label">Transport:</span>
                <span className="summary-value">{routeSummary.vehicle}</span>
              </div>
              {routeSummary.roadInfo && routeSummary.roadInfo.length > 0 && (
                <div className="route-summary-item">
                  <FaMapMarkerAlt className="summary-icon-lsb" />
                  <span className="summary-label">Main Roads:</span>
                  <span className="summary-value">
                    {routeSummary.roadInfo
                      .filter(road => road.road && road.road !== 'Unknown Road')
                      .slice(0, 3)
                      .map(road => road.road)
                      .join(', ') || 'Various roads'}
                  </span>
                </div>
              )}
            </div>
          ) : null}

{isLoading ? (
            <div className="loading-message">Loading nearby places...</div>
          ) : (hasValidInputs && routeSummary) ? (
            <>
              {/* Explore Nearby (hidden until both inputs valid) */}
          <div className="route-footer">
            <div className="explore-nearby-text">
              <FaCompass className="explore-icon" />
              Explore Nearby
            </div>
            {nearbyPlaces.length > 0 ? (
              <div className="nearby-places-container100">
                {nearbyPlaces.map((place, index) => (
                  <div 
                    key={index} 
                    className={`nearby-place-item100 ${selectedPlace?.place_id === place.place_id ? 'selected-place' : ''}`}
                    onClick={() => handleNearbyPlaceClick(place)}
                  >
                    <div className="nearby-place-content100">
                      <div className="place-header100">
                        <div className="place-name100">{place.name}</div>
                        <div className="place-type100">
                          <FaMapPin className="place-type-icon" />
                          {String(place.type || '').replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="place-address100">{place.vicinity}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-nearby-places">
                No nearby places found around the destination.
              </div>
            )}
          </div>

          {/* Nearby for searched location (shown when a search selection exists and route inputs are not both set) */}
          {activeSearchLocation && !hasValidInputs && (
            <div className="route-footer">
              <div className="explore-nearby-text">
                <FaCompass className="explore-icon" />
                Explore Nearby
              </div>
              <NearbyPlacesPanel
                title="Explore Nearby"
                places={nearbyPlaces}
                anchorCoords={{
                  lat: activeSearchLocation?.coordinates?.latitude ?? activeSearchLocation?.latitude,
                  lng: activeSearchLocation?.coordinates?.longitude ?? activeSearchLocation?.longitude
                }}
                isLoading={isLoading}
                error={nearbyError}
                onRetry={() => {
                  const lat = activeSearchLocation?.coordinates?.latitude ?? activeSearchLocation?.latitude;
                  const lng = activeSearchLocation?.coordinates?.longitude ?? activeSearchLocation?.longitude;
                  if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    setNearbyError(null);
                    setIsLoading(true);
                    fetchNearbyPlaces({ lat, lng }, 1000)
                      .then((p) => setNearbyPlaces(p || []))
                      .catch(() => setNearbyError('Failed to load nearby places'))
                      .finally(() => setIsLoading(false));
                  }
                }}
                onItemClick={handleNearbyPlaceClick}
                selectedPlaceId={selectedPlace?.place_id}
              />
            </div>
          )}

              {/* Route Options (hidden until both inputs valid) */}
              {hasValidInputs && routeSummary && routeAlternatives.length > 0 && (
                <div className="route-alternatives-container">
                  <div className="route-alternatives-header">
                    <h4>Route Options</h4>
                    <span className="route-count">{routeAlternatives.length} routes available</span>
                  </div>
                  <div className="route-alternatives-list">
                    {routeAlternatives.map((route, index) => (
                      <div
                        key={index}
                        className={`route-alternative-item ${index === selectedRouteIndex ? 'active' : ''}`}
                        onClick={() => handleRouteAlternativeSelect(route, index)}
                      >
                        <div className="route-alternative-header">
                          <div className="route-info">
                            <span className="route-number">Route {index + 1}</span>
                            {index === 0 && <span className="fastest-badge">Fastest</span>}
                          </div>
                        </div>
                        <div className="route-alternative-details">
                          <div className="route-detail-item">
                            <FaClock className="detail-icon" />
                            <span>{formatDuration(route.duration)}</span>
                          </div>
                          <div className="route-detail-item">
                            <FaMapMarkerAlt className="detail-icon" />
                            <span>{formatDistance(route.distance)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Directions (hidden until both inputs valid) */}
              {hasValidInputs && routeSummary && routeAlternatives.length > 0 && (
                <div className="directions-actions-container">
                  <div className="directions-actions-header">
                    <FaShare className="section-icon" />
                    <h4>Share Directions</h4>
                  </div>
                  <div className="directions-actions-buttons">
                    <button 
                      className="copy-directions-button"
                      onClick={copyDirectionsLink}
                      title="Copy Google Maps directions link"
                    >
                      <FaCopy className="action-icon" />
                      Copy Link
                    </button>
                    <button 
                      className="share-directions-button"
                      onClick={shareDirections}
                      title="Share directions"
                    >
                      <FaShare className="action-icon" />
                      Share
                    </button>
                  </div>
                  <div className="directions-info">
                    <small>Links will open in Google Maps for navigation</small>
                  </div>
                </div>
              )}
            </>
          ) : null}

          </div>
            {showBusiness && (
              <BusinessSubmissionForm
                isOpen={showBusiness}
                onClose={() => setShowBusiness(false)}
                onSubmitSuccess={() => {
                  toast.success('Business submitted successfully!');
                  setShowBusiness(false);
                }}
              />
            )}

            <MapLayer
              isOpen={showLayersPanel}
              onClose={() => setShowLayersPanel(false)}
              onMapTypeChange={onBasemapChange}
            />

          {/* Recent Section */}
          {showRecentSection && (
            <RecentSection
              isOpen={showRecentSection}
              onClose={() => {
                setShowRecentSection(false);                
                setActiveMenu('');
              }}
              history={recentLocations}
              onItemClick={handleRecentLocationClick}
              onDeleteItems={handleDeleteRecentItems}
              onClearAll={handleClearAllRecent}
            />
          )}

          {showLoginModal && (
            <LoginModal 
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              // Add any other props your LoginModal needs
            />
          )}

          {/* Bookmark Section */}
          {showBookmarkpage && (
            <BookmarkPage
              isOpen={showBookmarkpage}
              onClose={() => {
                setShowBookmarkpage(false);
                setActiveMenu('');
              }}
              showLoginOverlay={openLoginOverlay}
              onBookmarkClick={(bookmarkData) => {
                handleClearAllRouting();

                // Always clear activeSearchLocation before setting bookmark anchor
                if (setActiveSearchLocation) {
                  setActiveSearchLocation(null);
                }

                if (setSelectedSearchBarPlace) {
                  setSelectedSearchBarPlace(null);
                  const latitude = bookmarkData.latitude ?? bookmarkData.coordinates?.latitude;
                  const longitude = bookmarkData.longitude ?? bookmarkData.coordinates?.longitude;
                  setSelectedSearchBarPlace({
                    name: bookmarkData.name,
                    latitude,
                    longitude,
                    description: bookmarkData.description,
                    type: bookmarkData.type || 'Bookmark'
                  });
                }

                if (setSelectedPlace) {
                  setSelectedPlace(bookmarkData);
                }

                setShowBookmarkpage(false);
                setActiveMenu('');
              }}
            />
          )}
          </>
  );
});

export default LeftSidebarTesting;

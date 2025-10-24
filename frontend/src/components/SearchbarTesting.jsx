import { FiSearch, FiMic, FiX, FiClock } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { useRef, useEffect, useState } from 'react';
import '../styles/Searchbar.css';

function SearchBarTesting({ onPlaceSelected, setShowRecent, onAddToRecent, onOpenRecentSection }) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('sarawakTourismRecentLocations');
      return saved ? JSON.parse(saved).slice(0, 5).map(item => ({
        name: item.name,
        description: getDisplayDescriptionBySource(item),
        latitude: item.latitude,
        longitude: item.longitude,
        placeId: item.placeId || `${item.name}-${item.latitude}-${item.longitude}`,
        source: item.source || 'recent'
      })) : [];
    } catch {
      return [];
    }
  });
  const [predictions, setPredictions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Restore normalizer
  const normalizeName = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  // Display-only description resolver. Does not mutate original data.
  const getDisplayDescriptionBySource = (item) => {
    const src = (item?.source || '').toLowerCase();
    if (src === 'backend') return item.division || item.full?.division || '';
    if (src === 'business') return item.address || item.full?.address || '';
    if (src === 'photon' || src === 'nominatim') return item.description || '';

    // Fallback for older "recent" items lacking source/division/address
    const near = 0.0005;
    const name = normalizeName(item.name || '');
    const lat = Number(item.latitude);
    const lon = Number(item.longitude);

    const backendMatch = backendLocations.find(loc =>
      normalizeName(loc.name) === name &&
      Math.abs(Number(loc.latitude) - lat) < near &&
      Math.abs(Number(loc.longitude) - lon) < near
    );
    if (backendMatch) {
      return backendMatch.division || backendMatch.full?.division || '';
    }

    const businessMatch = approvedBusinesses.find(b =>
      normalizeName(b.name) === name &&
      Math.abs(Number(b.latitude) - lat) < near &&
      Math.abs(Number(b.longitude) - lon) < near
    );
    if (businessMatch) {
      return businessMatch.address || '';
    }

    return item.description || '';
  };
  // Approved businesses only
  const [approvedBusinesses, setApprovedBusinesses] = useState([]);
  const [approvedReady, setApprovedReady] = useState(false);
  const [approvedLoadError, setApprovedLoadError] = useState(null);
  
  useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const r = await fetch('/api/businesses/approved');
                if (!r.ok) throw new Error(`Failed to load approved businesses (${r.status})`);
                const json = await r.json();
                const arr = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
                const mapped = arr
                    .filter(b => String(b.status).toLowerCase() === 'approved')
                    .map(b => ({
                        name: b.name,
                        // description: [b.category, b.address].filter(Boolean).join(' • '),
                        description: b.description || '', // CHANGED: business => use address in dropdowns
                        latitude: Number(b.latitude),
                        longitude: Number(b.longitude),
                        placeId: b._id || `${b.name}-${b.latitude}-${b.longitude}`,
                        phone: b.phone || '',
                        website: b.website || '',
                        openingHours: b.openingHours || '',
                        ownerEmail: b.ownerEmail || '',
                        image: b.businessImage,
                        category: b.category,
                        address: b.address,
                        website: b.website,
                        full: b,
                        source: 'business',
                        status: b.status,
                        type: 'Business'
                    }));
                if (mounted) {
                    setApprovedBusinesses(mapped);
                    setApprovedReady(true);
                }
            } catch (e) {
                if (mounted) {
                    setApprovedLoadError(e.message || 'Failed to load approved businesses');
                    setApprovedBusinesses([]);
                    setApprovedReady(true);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

  // NEW: load backend locations on mount
const [backendLocations, setBackendLocations] = useState([]);

// NEW: dedupe helper for external items (Photon/Nominatim)
const dedupeByNameAndCoords = (items) => {
    const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const byName = new Map();
    const THRESH = 0.0005;

    for (const item of items) {
      const key = normalize(item.name);
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, item);
        continue;
      }
      const near =
        Math.abs(existing.latitude - item.latitude) < THRESH &&
        Math.abs(existing.longitude - item.longitude) < THRESH;

      if (near || key === normalize(existing.name)) {
        if (existing.source !== 'photon' && item.source === 'photon') {
          byName.set(key, item);
        }
      } else {
        if (existing.source !== 'photon' && item.source === 'photon') {
          byName.set(key, item);
        }
      }
    }
    return Array.from(byName.values());
  };

const [backendLoadError, setBackendLoadError] = useState(null);

useEffect(() => {
  let isMounted = true;
  const fetchLocations = async () => {
    try {
      const r = await fetch('/api/locations');
      if (!r.ok) throw new Error(`Failed to load locations (${r.status})`);
      const data = await r.json();
      if (!Array.isArray(data)) throw new Error('Unexpected locations payload');
      const mapped = data.map(loc => ({
        name: loc.name,
        description: loc.description,
        division: loc.division,
        latitude: loc.latitude,
        longitude: loc.longitude,
        placeId: loc._id || `${loc.name}-${loc.latitude}-${loc.longitude}`,
        image: loc.image,
        url: loc.url,
        full: loc,
        source: 'backend'
      }));
      if (isMounted) setBackendLocations(mapped);
    } catch (e) {
      if (isMounted) setBackendLoadError(e.message || 'Failed to load locations');
      console.error('Backend locations load error:', e);
    }
  };
  fetchLocations();
  return () => { isMounted = false; };
}, []);

useEffect(() => {
    const q = inputValue.trim().toLowerCase();

    if (!q) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }
    if (!approvedReady) {
        setIsLoading(true);
        return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      // 1) Rank backend matches first
      const backendRanked = backendLocations
        .map(p => {
          const name = normalizeName(p.name);
          const desc = normalizeName(p.description);
          const div = normalizeName(p.full?.division);
          let score = Infinity;
          if (name.startsWith(q)) score = 0;
          else if (name.includes(q)) score = 1;
          else if (div.includes(q)) score = 2;
          else if (desc.includes(q)) score = 3;
          return { p, score, key: name };
        })
        .filter(x => x.score !== Infinity)
        .sort((a, b) => a.score - b.score || a.p.name.length - b.p.name.length);

      const finalList = [];
      const seenNames = new Set();
      for (const x of backendRanked) {
        if (!seenNames.has(x.key)) {
          finalList.push(x.p);
          seenNames.add(x.key);
        }
      }

      const ranked = approvedBusinesses
          .map(p => {
              const name = normalizeName(p.name);
              const cat = normalizeName(p.category);
              const addr = normalizeName(p.address);
              let score = Infinity;
              if (name.startsWith(q)) score = 0;
              else if (name.includes(q)) score = 1;
              else if (cat.includes(q)) score = 2;
              else if (addr.includes(q)) score = 3;
              return { p, score, key: name };
          })
          .filter(x => x.score !== Infinity)
          .sort((a, b) => a.score - b.score || a.p.name.length - b.p.name.length);

      // const finalList = [];
      const seen = new Set();
      for (const x of ranked) {
          if (!seen.has(x.key)) {
              finalList.push(x.p);
              seen.add(x.key);
          }
      }

      // 2) Fill remaining slots with external suggestions (Photon/Nominatim)
      const remainingSlots = Math.max(0, 5 - finalList.length);
      if (remainingSlots > 0) {
        let external = [];
        try {
          const [photonResult, nominatimResult] = await Promise.allSettled([
            fetchPhotonSuggestions(inputValue, controller.signal).catch(() => []),
            fetchNominatimSuggestions(inputValue, controller.signal).catch(() => [])
          ]);

          if (photonResult.status === 'fulfilled' && Array.isArray(photonResult.value)) {
            external = external.concat(photonResult.value);
          }
          if (nominatimResult.status === 'fulfilled' && Array.isArray(nominatimResult.value)) {
            external = external.concat(nominatimResult.value);
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('External search failed:', err);
          }
        }

        // Remove external items that conflict with backend by name
        const externalAfterBackend = external.filter(
          ext => !seenNames.has(normalizeName(ext.name))
        );

        // NEW: dedupe external items by name/coords, prefer Photon
        const externalDeduped = dedupeByNameAndCoords(externalAfterBackend);

        // Rank remaining external (lower priority than backend)
        const externalRanked = externalDeduped
          .map(e => {
            const name = normalizeName(e.name);
            const desc = normalizeName(e.description);
            let score = Infinity;
            if (name.startsWith(q)) score = 10;
            else if (name.includes(q)) score = 11;
            else if (desc.includes(q)) score = 12;
            return { e, score };
          })
          .filter(x => x.score !== Infinity)
          .sort((a, b) => a.score - b.score || a.e.name.length - b.e.name.length)
          .slice(0, remainingSlots)
          .map(x => x.e);

        // Use originals; compute display-only description in JSX
        setPredictions([...finalList, ...externalRanked]);
      } else {
        // Use originals; compute display-only description in JSX
        setPredictions(finalList.slice(0, 5));
      }

      setIsLoading(false);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
      setIsLoading(false);
    };
  }, [inputValue, backendLocations, approvedBusinesses, approvedReady]);

  // Sarawak bounding box: 109.5,0.8,115.5,5.5
  const sarawakBbox = '109.5,0.8,115.5,5.5';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions from backend, Photon, and Nominatim with fallback, debounced and restricted to Sarawak
  // useEffect(() => {
  //   if (!inputValue.trim()) {
  //     setPredictions([]);
  //     setIsLoading(false);
  //     return;
  //   }

  //   setIsLoading(true);
  //   const controller = new AbortController();
  //   const timeoutId = setTimeout(() => {
  //     // Try to fetch from all sources in parallel
  //     Promise.allSettled([
  //       fetchPhotonSuggestions(inputValue, controller.signal).catch(() => []),
  //       fetchNominatimSuggestions(inputValue, controller.signal).catch(() => [])
  //     ])
  //       .then(([photonResult, nominatimResult]) => {
  //         let allResults = [];
          
  //         // Add Photon results first
  //         if (photonResult.status === 'fulfilled' && photonResult.value.length > 0) {
  //           allResults = [...photonResult.value];
  //         }
          
  //         // Add Nominatim results if we have less than 5 results
  //         if (allResults.length < 5) {
  //           if (nominatimResult.status === 'fulfilled' && nominatimResult.value.length > 0) {
  //             allResults = [...allResults, ...nominatimResult.value.slice(0, 5 - allResults.length)];
  //           }
  //         }
          
  //         // Remove duplicates based on name and coordinates
  //         const uniqueResults = allResults.filter((item, index, self) => 
  //           index === self.findIndex(t => 
  //             t.name.toLowerCase() === item.name.toLowerCase() && 
  //             Math.abs(t.latitude - item.latitude) < 0.0001 && 
  //             Math.abs(t.longitude - item.longitude) < 0.0001
  //           )
  //         );
          
  //         setPredictions(uniqueResults.slice(0, 5));
  //       })
  //       .catch((err) => {
  //         if (err.name !== 'AbortError') {
  //           console.error('Search failed:', err);
  //           setPredictions([]);
  //         }
  //       })
  //       .finally(() => {
  //         setIsLoading(false);
  //       });
  //   }, 300); // Wait 300ms after user stops typing

  //   return () => {
  //     clearTimeout(timeoutId);
  //     controller.abort();
  //     setIsLoading(false);
  //   };
  // }, [inputValue]);

  // Fetch suggestions from Photon API with timeout - FIXED VERSION
  const fetchPhotonSuggestions = async (query, signal) => {
    try {
      // Use direct Photon API without CORS proxy
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=en&limit=5&bbox=${sarawakBbox}`;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Photon API timeout')), 8000);
      });
      
      const fetchPromise = fetch(url, { 
        signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`Photon API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sarawak bounding box
      const minLat = 0.8, maxLat = 5.5, minLon = 109.5, maxLon = 115.5;
      return (data.features || [])
        .filter(feature => {
          const lat = feature.geometry.coordinates[1];
          const lon = feature.geometry.coordinates[0];
          // Only keep results within Sarawak bounds
          return (
            lat >= minLat && lat <= maxLat &&
            lon >= minLon && lon <= maxLon
          );
        })
        .map(feature => ({
          name: feature.properties.name || feature.properties.city || feature.properties.country,
          description: feature.properties.country
            ? `${feature.properties.city || ''} ${feature.properties.country}`.trim()
            : feature.properties.osm_value,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          placeId: feature.properties.osm_id,
          full: feature,
          source: 'photon'
        }));
    } catch (error) {
      console.warn('Photon API failed:', error.message);
      return []; // Return empty array instead of throwing
    }
  };

  // Fetch suggestions from Nominatim API (fallback) with timeout - FIXED VERSION
  const fetchNominatimSuggestions = async (query, signal) => {
    try {
      // Use your own backend proxy for Nominatim to avoid CORS issues
      const url = `/api/nominatim/search?q=${encodeURIComponent(query)}&limit=5&countrycodes=my&bounded=1&viewbox=109.5,0.8,115.5,5.5`;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Nominatim API timeout')), 8000);
      });
      
      const fetchPromise = fetch(url, { 
        signal,
        headers: {
          'User-Agent': 'SarawakTourismApp/1.0',
          'Accept': 'application/json',
        }
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter and format Nominatim results for Sarawak
      const minLat = 0.8, maxLat = 5.5, minLon = 109.5, maxLon = 115.5;
      return (data || [])
        .filter(item => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          return (
            lat >= minLat && lat <= maxLat &&
            lon >= minLon && lon <= maxLon
          );
        })
        .map(item => ({
          name: item.display_name.split(',')[0].trim(), // First part of display name
          description: item.display_name.split(',').slice(1).join(',').trim(), // Rest of the address
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          placeId: item.place_id,
          full: item,
          source: 'nominatim'
        }));
    } catch (error) {
      console.warn('Nominatim API failed:', error.message);
      return []; // Return empty array instead of throwing
    }
  };

  // Alternative: Use a simple CORS proxy for development
  const fetchWithCorsProxy = async (url, signal) => {
    // For development, you can use a simple CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, { signal });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  };

  // Helper: build a full location object consistent with CustomInfoWindow
  const buildLocationFromPlace = (place) => {
    const src = (place?.source || '').toLowerCase();
    const full = place?.full || {};
    const latitude = Number(place.latitude ?? full.latitude);
    const longitude = Number(place.longitude ?? full.longitude);

    const base = {
      name: place.name,
      description: place.description || full.description || '',
      latitude,
      longitude,
      type: place.type || full.type || 'Location',
      source: place.source || full.source || src || 'search',
      // Common optional fields
      image: place.image || full.image,
      businessImage: place.businessImage || full.businessImage,
      website: place.website || full.website || full.url,
      address: place.address || full.address,
      phone: place.phone || full.phone,
      rating: place.rating ?? full.rating,
      division: place.division || full.division,
    };

    if (src === 'business') {
      return {
        ...base,
        category: place.category || full.category,
        openingHours: place.openingHours || full.openingHours,
        owner: full.owner,
        ownerEmail: place.ownerEmail || full.ownerEmail,
        status: place.status || full.status,
      };
    }

    // Event fields if present
    if (full.startDate || full.eventType || full.registrationRequired || base.type === 'Events') {
      return {
        ...base,
        eventType: full.eventType,
        startDate: full.startDate,
        endDate: full.endDate,
        startTime: full.startTime,
        endTime: full.endTime,
        registrationRequired: full.registrationRequired,
        dailySchedule: full.dailySchedule,
        eventHashtags: full.eventHashtags,
        eventOrganizer: full.eventOrganizer,
      };
    }

    // Major town fallback: keep division/name; otherwise leave as base
    return base;
  };

  const handlePlace = (place) => {
    if (!place.latitude || !place.longitude) {
      console.error('No geometry found for selected place');
      return;
    }
    console.log('Selected place:', place);

    const locationData = buildLocationFromPlace(place);

    onPlaceSelected && onPlaceSelected(locationData);
    updateRecentSearches(locationData);
    if (onAddToRecent) {
      onAddToRecent(locationData);
    }

    // Immediately open pop-out details and video in map
    try {
      window.dispatchEvent(new CustomEvent('nearbyPlaceSelected', { detail: locationData }));
    } catch {}
  };

  const updateRecentSearches = (locationData) => {
    // Persist in component recent state (preview list below input)
    setRecentSearches((prev) => {
      const placeId =
        locationData.placeId ||
        `${locationData.name}-${locationData.latitude}-${locationData.longitude}`;
      const normalized = { ...locationData, placeId };
      const exists = prev.some((p) => p.placeId === placeId);
      const next = exists ? prev : [normalized, ...prev].slice(0, 5);
      return next;
    });

    // Persist to localStorage with full object the pop-out expects
    try {
      const saved = localStorage.getItem('sarawakTourismRecentLocations');
      const list = saved ? JSON.parse(saved) : [];

      const exists = list.some(
        (p) =>
          p.name === locationData.name &&
          Math.abs(Number(p.latitude) - Number(locationData.latitude)) < 0.0001 &&
          Math.abs(Number(p.longitude) - Number(locationData.longitude)) < 0.0001
      );

      if (!exists) {
        const merged = [
          {
            ...locationData,
            type: locationData.type || 'Location',
            timestamp: new Date().toISOString(),
          },
          ...list,
        ].slice(0, 20);

        localStorage.setItem(
          'sarawakTourismRecentLocations',
          JSON.stringify(merged)
        );
        window.dispatchEvent(
          new CustomEvent('recentLocationsUpdated', {
            detail: { action: 'add', item: locationData },
          })
        );
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  };

  const handleRecentClick = (place) => {
    inputRef.current.value = place.name;
    handlePlace(place);
    setIsFocused(false);
  };

  const handlePredictionClick = (prediction) => {
    handlePlace(prediction);
    setInputValue(prediction.name);
    setIsFocused(false);
  };

  const handleClickMoreFromRecent = () => {
    setIsFocused(false);
    setPredictions([]);
    if (typeof setShowRecent === 'function') {
      setShowRecent(true);
    }
    // Also open the recent section in the sidebar
    if (typeof onOpenRecentSection === 'function') {
      onOpenRecentSection();
    }
  };

  // keep dropdown in sync when recent list is changed elsewhere (clear/delete)
  useEffect(() => {
    const handler = (e) => {
      const saved = localStorage.getItem('sarawakTourismRecentLocations');
      const arr = saved ? JSON.parse(saved) : [];
      setRecentSearches(arr.slice(0, 5).map(item => ({
        name: item.name,
        description: getDisplayDescriptionBySource(item), // CHANGED: use correct description for recent dropdown
        latitude: item.latitude,
        longitude: item.longitude,
        phone: item.phone || '',
        website: item.website || '',
        openingHours: item.openingHours || '',
        ownerEmail: item.ownerEmail || '',
        image: item.image || '',
        category: item.category || '',
        address: item.address || '',
        description: item.description || '',
        ownerEmail: item.ownerEmail || '',
        placeId: item.placeId || `${item.name}-${item.latitude}-${item.longitude}`,
        source: item.source || 'recent'
      })));
    };
    window.addEventListener('recentLocationsUpdated', handler);
    return () => window.removeEventListener('recentLocationsUpdated', handler);
  }, []);

  // Speech-to-text handler
  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      inputRef.current.value = transcript;
      inputRef.current.focus();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
  };

  return (
    <div ref={containerRef} className={`styled-searchbar-container expanded ${isFocused ? 'focused' : ''}`}>
      <img src={logo} alt="Logo" className="searchbar-logo" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search destinations"
        className="styled-searchbar-input"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsFocused(true)}
        onKeyDown={(e) => {
          if (predictions.length === 0) return;
          if (e.key === 'ArrowDown') {
            setHighlightedIndex((prev) =>
              prev < predictions.length - 1 ? prev + 1 : 0
            );
          } else if (e.key === 'ArrowUp') { 
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : predictions.length - 1
            );
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (predictions.length > 0) {
              const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
              handlePredictionClick(predictions[idx]);
            }
          }
        }}
      />

      <div className="searchbar-right-icons">
        {(isFocused || inputValue) && (
          <>
            <FiX className="styled-clear-icon" onClick={() => {
              setInputValue('');
              inputRef.current.value = '';
              inputRef.current.focus();
              onPlaceSelected && onPlaceSelected(null);
            }} />
            <FiMic className="styled-mic-icon" onClick={handleMicClick} />
          </>
        )}
        <FiSearch
          className="styled-search-icon"
          onClick={() => {
            if (predictions.length > 0) handlePredictionClick(predictions[0]);
          }}
        />
      </div>

      {isFocused && (
        <div className="recent-dropdown5">
          {inputValue.trim() ? (
            <>
              {isLoading && (
                <div className="search-loading">
                  <div className="loading-spinner"></div>
                  Searching...
                </div>
              )}
              {!isLoading && inputValue.trim() && approvedReady && predictions.length === 0 && (
                <div className="search-no-results">
                  No results found for "{inputValue}"
                </div>
              )}
              {predictions.map((prediction, idx) => (
                <div
                  key={idx}
                  className={`recent-item5 ${highlightedIndex === idx ? 'highlighted' : ''}`}
                  onMouseDown={() => handlePredictionClick(prediction)}
                >
                  <FiClock className="recent-icon5" />
                  <div className="search-result-content">
                    <div className="search-result-name">{prediction.name}</div>
                    {getDisplayDescriptionBySource(prediction) && (
                      <div className="search-result-description">
                        {getDisplayDescriptionBySource(prediction)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : recentSearches.length > 0 ? (
            <>
              {recentSearches.map((place, idx) => (
                <div
                  key={idx}
                  className="recent-item5"
                  onMouseDown={() => handleRecentClick(place)}
                >
                  <FiClock className="recent-icon5" />
                  <div className="search-result-content">
                    <span className="search-result-name">{place.name}</span>
                    {getDisplayDescriptionBySource(place) && (
                      <div className="search-result-description">
                        {getDisplayDescriptionBySource(place)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="recent-more5" onClick={handleClickMoreFromRecent}>
                More from recent history
              </div>
            </>
          ) : (
            <div className="search-no-results">
              {/* Start typing to search for locations */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBarTesting;

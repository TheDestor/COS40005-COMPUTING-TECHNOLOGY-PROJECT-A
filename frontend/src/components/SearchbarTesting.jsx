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
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        placeId: item.placeId || `${item.name}-${item.latitude}-${item.longitude}`,
        source: 'recent'
      })) : [];
    } catch {
      return [];
    }
  });
  const [predictions, setPredictions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

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
  useEffect(() => {
    if (!inputValue.trim()) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      // Try to fetch from all sources in parallel
      Promise.allSettled([
        fetchPhotonSuggestions(inputValue, controller.signal).catch(() => []),
        fetchNominatimSuggestions(inputValue, controller.signal).catch(() => [])
      ])
        .then(([photonResult, nominatimResult]) => {
          let allResults = [];
          
          // Add Photon results first
          if (photonResult.status === 'fulfilled' && photonResult.value.length > 0) {
            allResults = [...photonResult.value];
          }
          
          // Add Nominatim results if we have less than 5 results
          if (allResults.length < 5) {
            if (nominatimResult.status === 'fulfilled' && nominatimResult.value.length > 0) {
              allResults = [...allResults, ...nominatimResult.value.slice(0, 5 - allResults.length)];
            }
          }
          
          // Remove duplicates based on name and coordinates
          const uniqueResults = allResults.filter((item, index, self) => 
            index === self.findIndex(t => 
              t.name.toLowerCase() === item.name.toLowerCase() && 
              Math.abs(t.latitude - item.latitude) < 0.0001 && 
              Math.abs(t.longitude - item.longitude) < 0.0001
            )
          );
          
          setPredictions(uniqueResults.slice(0, 5));
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Search failed:', err);
            setPredictions([]);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 300); // Wait 300ms after user stops typing

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
      setIsLoading(false);
    };
  }, [inputValue]);

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

  const handlePlace = (place) => {
    if (!place.latitude || !place.longitude) {
      console.error('No geometry found for selected place');
      return;
    }
    console.log('Selected place:', place);
    onPlaceSelected && onPlaceSelected(place);
    updateRecentSearches(place);
    
    // Add to recent locations in the sidebar
    if (onAddToRecent) {
      onAddToRecent(place);
    }
  };

  const updateRecentSearches = (place) => {
    setRecentSearches((prev) => {
      const normalized = {
        name: place.name,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId || `${place.name}-${place.latitude}-${place.longitude}`,
        source: place.source || 'recent'
      };
      const exists = prev.some((p) => p.placeId === normalized.placeId);
      const next = exists ? prev : [normalized, ...prev].slice(0, 5);
      return next;
    });

    // persist to localStorage shared list used by sidebar
    try {
      const saved = localStorage.getItem('sarawakTourismRecentLocations');
      const list = saved ? JSON.parse(saved) : [];
      const exists = list.some((p) => (
        p.name === place.name && Math.abs(p.latitude - place.latitude) < 0.0001 && Math.abs(p.longitude - place.longitude) < 0.0001
      ));
      if (!exists) {
        const merged = [{
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          description: place.description || '',
          type: place.type || 'Location',
          timestamp: new Date().toISOString(),
          source: place.source || 'search'
        }, ...list].slice(0, 20);
        localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify(merged));
        // notify listeners to refresh
        window.dispatchEvent(new CustomEvent('recentLocationsUpdated', { detail: { action: 'add', item: place } }));
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
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        placeId: item.placeId || `${item.name}-${item.latitude}-${item.longitude}`,
        source: 'recent'
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
              {!isLoading && predictions.length === 0 && (
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
                    {prediction.description && (
                      <div className="search-result-description">
                        {prediction.description}
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
                  <span>{place.name}</span>
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
import { FiSearch, FiMic, FiX, FiClock } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { useRef, useEffect, useState } from 'react';
import '../styles/Searchbar.css';

function SearchBarTesting({ onPlaceSelected, setShowRecent, onAddToRecent, onOpenRecentSection }) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  // Fetch suggestions from Photon with Nominatim fallback, debounced and restricted to Sarawak
  useEffect(() => {
    if (!inputValue.trim()) {
        setPredictions([]);
        return;
      }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      fetchPhotonSuggestions(inputValue, controller.signal)
        .catch((error) => {
          console.warn('Photon service failed, trying Nominatim fallback:', error);
          return fetchNominatimSuggestions(inputValue, controller.signal);
        })
        .then(data => {
          if (data && data.length > 0) {
            setPredictions(data);
          } else {
            setPredictions([]);
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Both Photon and Nominatim failed:', err);
            setPredictions([]);
          }
        });
    }, 300); // Wait 300ms after user stops typing

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputValue]);

  // Fetch suggestions from Photon API with timeout
  const fetchPhotonSuggestions = async (query, signal) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Photon API timeout')), 5000);
    });
    
    const fetchPromise = fetch(
      `https://corsproxy.io/?https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=en&limit=5&bbox=${sarawakBbox}`,
      { signal }
    );
    
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
  };

  // Fetch suggestions from Nominatim API (fallback) with timeout
  const fetchNominatimSuggestions = async (query, signal) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Nominatim API timeout')), 8000);
    });
    
    const fetchPromise = fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=my&bounded=1&viewbox=109.5,0.8,115.5,5.5`,
      { 
        signal,
        headers: {
          'User-Agent': 'SarawakTourismApp/1.0' // Required by Nominatim
        }
      }
    );
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter and format Nominatim results for Sarawak
    const minLat = 0.8, maxLat = 5.5, minLon = 109.5, maxLon = 115.5;
    return data
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
  };

  const handlePlace = (place) => {
    if (!place.latitude || !place.longitude) {
      console.error('No geometry found for selected place');
      return;
    }
    console.log(place);
    onPlaceSelected && onPlaceSelected(place);
    updateRecentSearches(place);
    
    // Add to recent locations in the sidebar
    if (onAddToRecent) {
      onAddToRecent(place);
    }
  };

  const updateRecentSearches = (place) => {
    setRecentSearches((prev) => {
      const exists = prev.some((p) => p.placeId === place.placeId);
      if (exists) return prev;
      return [place, ...prev].slice(0, 5);
    });
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
            predictions.map((prediction, idx) => (
              <div
                key={idx}
                className={`recent-item5 ${highlightedIndex === idx ? 'highlighted' : ''}`}
                onMouseDown={() => handlePredictionClick(prediction)}
              >
                <FiClock className="recent-icon5" />
                <span>
                  {prediction.name}
                  {prediction.description ? `, ${prediction.description}` : ''}
                </span>
              </div>
            ))
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
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchBarTesting;

import { FiSearch, FiMic, FiX, FiClock } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { useRef, useEffect, useState } from 'react';
import '../styles/Searchbar.css';

function SearchBar({ onPlaceSelected, setShowRecent }) {
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const containerRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  useEffect(() => {
    if (!window.google) return;

    const autocompleteService = new window.google.maps.places.AutocompleteService();

    const handleInputChange = () => {
      const input = inputRef.current.value.trim();
      if (!input) {
        setPredictions([]);
        return;
      }

      autocompleteService.getPlacePredictions(
        { input, componentRestrictions: { country: 'my' } },
        (preds, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            preds?.length > 0
          ) {
            setPredictions(preds);
          } else {
            setPredictions([]);
          }
        }
      );
    };

    const inputEl = inputRef.current;
    inputEl.addEventListener('input', handleInputChange);

    return () => inputEl.removeEventListener('input', handleInputChange);
  }, []);

  const fetchPlaceDetails = (placeId) => {
    const placesService = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );
    placesService.getDetails(
      { placeId, fields: ['geometry', 'name', 'place_id'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          handlePlace(place);
        } else {
          console.error('Failed to get place details:', status);
        }
      }
    );
  };

  const handlePlace = (place) => {
    if (!place.geometry) {
      console.error('No geometry found for selected place');
      return;
    }

    const selectedPlace = {
      name: place.name,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      placeId: place.place_id,
    };

    onPlaceSelected(selectedPlace);
    updateRecentSearches(selectedPlace);
  };

  const updateRecentSearches = (place) => {
    setRecentSearches((prev) => {
      const exists = prev.some((p) => p.placeId === place.placeId);
      if (exists) return prev;
      return [place, ...prev].slice(0, 5);
    });
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // recognition.onresult = (event) => {
    //   const transcript = event.results[0][0].transcript;
    //   inputRef.current.value = transcript;
    //   inputRef.current.focus();
    // };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript); // this updates React state
      inputRef.current.value = transcript; // update DOM input field
    
      // Manually trigger predictions (since input event listener won't fire automatically)
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        { input: transcript, componentRestrictions: { country: 'my' } },
        (preds, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            preds?.length > 0
          ) {
            setPredictions(preds);
            // Optionally auto-select the first prediction
            fetchPlaceDetails(preds[0].place_id);
          } else {
            setPredictions([]);
            // Optional fallback to text search
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            service.textSearch({ query: transcript }, (results, status) => {
              if (
                status === window.google.maps.places.PlacesServiceStatus.OK &&
                results.length > 0
              ) {
                handlePlace(results[0]);
              }
            });
          }
        }
      );
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleRecentClick = (place) => {
    inputRef.current.value = place.name;
    fetchPlaceDetails(place.placeId);
    setIsFocused(false);
  };

  const handlePredictionClick = (prediction) => {
    fetchPlaceDetails(prediction.place_id);
    inputRef.current.value = prediction.description;
    setIsFocused(false);
  };

  const handleClickMoreFromRecent = () => {
    setIsFocused(false);
    setPredictions([]);
    if (typeof setShowRecent === 'function') {
      setShowRecent(true);
    } else {
      console.warn('setShowRecent is not a function');
    }
  };  

  useEffect(() => {
    console.log('setShowRecent:', typeof setShowRecent);
  }, []);
  
  

  return (
    <div ref={containerRef} className={`styled-searchbar-container expanded ${isFocused ? 'focused' : ''}`}>
      <img src={logo} alt="Logo" className="searchbar-logo" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search homestays..."
        className="styled-searchbar-input"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setHighlightedIndex(-1); // Reset highlight on input change
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
            if (highlightedIndex >= 0 && predictions.length > 0) {
              handlePredictionClick(predictions[highlightedIndex]);
            } else if (inputValue.trim()) {
              // Fallback search using first prediction
              const prediction = predictions[0];
              if (prediction) {
                handlePredictionClick(prediction);
              } else {
                // Use PlacesService's textSearch if no predictions available
                const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                service.textSearch({ query: inputValue }, (results, status) => {
                  if (
                    status === window.google.maps.places.PlacesServiceStatus.OK &&
                    results.length > 0
                  ) {
                    handlePlace(results[0]);
                  } else {
                    console.warn('No results found for manual search.');
                  }
                });
              }
            }
          }
          
        }}
      />

      {(isFocused || inputValue) && (
        <>
          <FiMic className="styled-mic-icon" onClick={handleMicClick} />
          <FiX className="styled-clear-icon" onClick={() => {
            setInputValue('');
            inputRef.current.value = '';
            inputRef.current.focus(); 
            onPlaceSelected(null);
          }} />
        </>
      )}

      <FiSearch
        className="styled-search-icon"
        onClick={() => {
          const prediction = predictions[0];
          if (prediction) handlePredictionClick(prediction);
        }}
      />

      {isFocused && (
        <div className="recent-dropdown5">
          {inputRef.current?.value.trim() ? (
            predictions.map((prediction, idx) => (
              <div
                key={idx}
                className={`recent-item5 ${highlightedIndex === idx ? 'highlighted' : ''}`}
                onMouseDown={() => handlePredictionClick(prediction)}
              >
                <FiClock className="recent-icon5" />
                <span>{prediction.description}</span>
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

export default SearchBar;

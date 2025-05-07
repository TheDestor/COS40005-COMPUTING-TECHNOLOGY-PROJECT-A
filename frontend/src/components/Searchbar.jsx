// import React, { useState, useEffect, useRef } from 'react';
// import { FiSearch, FiX, FiMic } from 'react-icons/fi';
// import { Link } from 'react-router-dom';
// import SearchBarExpanded from './SearchBarExpanded.jsx';
// import '../styles/Searchbar.css';
// import logo from '../assets/SarawakTourismLogo.png'; 

// const SearchBar = ({ setSelectedPlace, onSearch, history }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [predictions, setPredictions] = useState([]);
  
//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setPredictions([]);
//       return;
//     }
  
//     const service = new window.google.maps.places.AutocompleteService();
  
//     service.getPlacePredictions(
//       {
//         input: searchTerm,
//         componentRestrictions: { country: 'MY' },
//         types: ['establishment'],
//         // types: ['(regions)'],
//         bounds: new window.google.maps.LatLngBounds(
//           new window.google.maps.LatLng(0.9, 109.3),
//           new window.google.maps.LatLng(5.0, 115.5)
//         ),
//         strictBounds: true
//       },
//       (preds) => setPredictions(preds || [])
//     );
//   }, [searchTerm]);

//   const handlePredictionClick = (placeId, description) => {
//     const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
//     placesService.getDetails(
//       {
//         placeId,
//         fields: ['name', 'geometry', 'formatted_address', 'photos']
//       },
//       (place) => {
//         if (!place || !place.geometry) return;

//         const photoUrl = place.photos && place.photos[0]
//         ? place.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 })
//         : null; // You can adjust the size as per your needs
  
//         setSelectedPlace(place);
//         handleSearch(description);
//         setSearchTerm('');
//         setPredictions([]);
//       }
//     );
//   };

//   const [category, setCategory] = useState('All');
//   const ref = useRef();
//   const inputRef = useRef(null);

//   const handleSearch = (term) => {
//     if (!term.trim()) return;
//     onSearch(term); // Use parent's handler
//     setSearchTerm('');
//   };

//   const handleClear = () => setSearchTerm('');

//   const handleClickOutside = (e) => {
//     if (ref.current && !ref.current.contains(e.target)) {
//       setIsExpanded(false);
//     }
//   };

//   useEffect(() => {
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Speech Recognition Setup
//   const handleMicClick = () => {
//     if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
//       alert('Speech recognition not supported in your browser.');
//       return;
//     }

//     const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
//     recognition.lang = 'en-US'; // Set the language (you can change this if needed)
//     recognition.continuous = false; // Single result mode
//     recognition.interimResults = false; // Do not show interim results

//     recognition.start();

//     recognition.onresult = (event) => {
//       const transcript = event.results[0][0].transcript;
//       setSearchTerm(transcript);
//       handleSearch(transcript); // Optionally trigger search on result
//     };

//     recognition.onerror = (event) => {
//       console.error('Speech recognition error', event);
//       alert('Sorry, there was an error with the microphone.');
//     };

//     recognition.onend = () => {
//       console.log('Speech recognition ended');
//     };
//   };

//   return (
//     <div ref={ref} className={`searchbar-wrapper ${isExpanded ? 'expanded' : ''}`}>
//       <div className="searchbar-top" onClick={() => setIsExpanded(true)}>
//         <Link to="/" className="logo-container">
//           <img src={logo} alt="Logo" className="logo" />
//         </Link>
//         <input
//           ref={inputRef}
//           type="text"
//           className="searchbar-input"
//           placeholder="Search for homestay"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
//         />
//         {isExpanded && (
//             <>
//               {searchTerm && <FiX className="icon-button" onClick={handleClear} />}
//               {searchTerm && <div className="divider2" />}
//               <FiMic className="icon-button" onClick={handleMicClick} />
//             </>
//           )}
//         <FiSearch className="icon-button" onClick={() => handleSearch(searchTerm)} />
//       </div>

//       {isExpanded && (
//         <SearchBarExpanded
//           category={category}
//           setCategory={setCategory}
//           history={history}
//           searchTerm={searchTerm}
//           predictions={predictions}
//           onPredictionClick={handlePredictionClick}
//         />
//       )}
//     </div>
//   );
// };

// export default SearchBar;
import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ onSearch, setSelectedPlace }) => {
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState([]);
  const autocompleteService = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps.places) return;

    if (!autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }

    if (inputValue.trim()) {
      autocompleteService.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: 'MY' },
        },
        (preds) => {
          setPredictions(preds || []);
        }
      );
    } else {
      setPredictions([]);
    }
  }, [inputValue]);

  const handleSearch = async (address = inputValue) => {
    if (!address.trim()) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;

        const place = {
          name: result.formatted_address,
          latitude: location.lat,
          longitude: location.lng,
          id: result.place_id
        };
        console.log("Location found:", place);

        setSelectedPlace(place);
        onSearch && onSearch(address);
        setInputValue('');
        setPredictions([]);
      } else {
        alert('Location not found!');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handlePredictionClick = (description) => {
    handleSearch(description);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          placeholder="Search location..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          style={styles.input}
        />
        {predictions.length > 0 && (
          <ul style={styles.suggestions}>
            {predictions.map((pred) => (
              <li
                key={pred.place_id}
                style={styles.suggestionItem}
                onClick={() => handlePredictionClick(pred.description)}
              >
                {pred.description}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={() => handleSearch()} style={styles.button}>
        Search
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    margin: '10px',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    zIndex: '1000',
    position: 'fixed',
    left: '10%',
    top: '0',
    width: '80%',
  },
  input: {
    padding: '8px',
    fontSize: '16px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '8px 16px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
  },
  suggestions: {
    position: 'absolute',
    top: '38px',
    left: '0',
    right: '0',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '0 0 4px 4px',
    maxHeight: '200px',
    overflowY: 'auto',
    listStyle: 'none',
    padding: '0',
    margin: '0',
    zIndex: 1001,
  },
  suggestionItem: {
    padding: '8px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
  },
};

export default SearchBar;

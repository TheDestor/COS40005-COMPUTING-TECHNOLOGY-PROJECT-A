import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiMic } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import SearchBarExpanded from './SearchBarExpanded.jsx';
import '../styles/Searchbar.css';
import logo from '../assets/SarawakTourismLogo.png'; 

const SearchBar = ({ setSelectedPlace, onSearch, history }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [predictions, setPredictions] = useState([]);
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setPredictions([]);
      return;
    }
  
    const service = new window.google.maps.places.AutocompleteService();
  
    service.getPlacePredictions(
      {
        input: searchTerm,
        componentRestrictions: { country: 'MY' },
        types: ['establishment'],
        // types: ['(regions)'],
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(0.9, 109.3),
          new window.google.maps.LatLng(5.0, 115.5)
        ),
        strictBounds: true
      },
      (preds) => setPredictions(preds || [])
    );
  }, [searchTerm]);

  const handlePredictionClick = (placeId, description) => {
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
    placesService.getDetails(
      {
        placeId,
        fields: ['name', 'geometry', 'formatted_address']
      },
      (place) => {
        if (!place || !place.geometry) return;
  
        setSelectedPlace(place);
        handleSearch(description);
        setSearchTerm('');
        setPredictions([]);
      }
    );
  };

  const [category, setCategory] = useState('All');
  const ref = useRef();
  const inputRef = useRef(null);

  const handleSearch = (term) => {
    if (!term.trim()) return;
    onSearch(term); // Use parent's handler
    setSearchTerm('');

    setSearchHistory((prevHistory) => {
      const updated = [term, ...prevHistory.filter((t) => t !== term)];
      return updated.slice(0, 10); // Limit to last 10
    });
  };

  const handleClear = () => setSearchTerm('');

  const handleClickOutside = (e) => {
    if (ref.current && !ref.current.contains(e.target)) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`searchbar-wrapper ${isExpanded ? 'expanded' : ''}`}>
      <div className="searchbar-top" onClick={() => setIsExpanded(true)}>
        <Link to="/" className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
        <input
          ref={inputRef}
          type="text"
          className="searchbar-input"
          placeholder="Search for airport, homestay"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
        />
        {isExpanded && (
            <>
              {searchTerm && <FiX className="icon-button" onClick={handleClear} />}
              {searchTerm && <div className="divider2" />}
              <FiMic className="icon-button" />
            </>
          )}
        <FiSearch className="icon-button" onClick={() => handleSearch(searchTerm)} />
      </div>

      {isExpanded && (
        <SearchBarExpanded
          category={category}
          setCategory={setCategory}
          history={history}
          searchTerm={searchTerm}
          predictions={predictions}
          onPredictionClick={handlePredictionClick}
        />
      )}
    </div>
  );
};

export default SearchBar;

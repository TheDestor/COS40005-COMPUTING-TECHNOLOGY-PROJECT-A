import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiMic } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import SearchBarExpanded from './SearchBarExpanded.jsx';
import '../styles/Searchbar.css';
import logo from '../assets/SarawakTourismLogo.png'; 

const SearchBar = ({ setSelectedPlace }) => {
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
  
  const [history, setHistory] = useState([
    'Borneo Cultural Museum',
    'Borneo Cultural Museum',
    'Borneo Cultural Museum',
    'Borneo Cultural Museum',
    'Borneo Cultural Museum',
  ]);
  const [category, setCategory] = useState('All');
  const ref = useRef();
  const inputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        inputRef.current
      ) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'MY' },
          fields: ['formatted_address', 'geometry', 'name'], // optional but useful
          types: ['establishment'], // or ['geocode'], ['address'], or ['(regions)'] depending on use
        });
        
        // Restrict to Sarawak via bounding box
        const sarawakBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(0.9, 109.3),   // SW corner
          new window.google.maps.LatLng(5.0, 115.5)    // NE corner
        );
        autocomplete.setBounds(sarawakBounds);
        autocomplete.setOptions({ strictBounds: true });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;

          const name = place.formatted_address || place.name;
          setSearchTerm('');
          setSelectedPlace(place); // <--- pass place object up
          handleSearch(name);
        });

        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (term) => {
    if (!term.trim()) return;
    const newHistory = [term, ...history.filter((item) => item !== term)].slice(0, 5);
    setHistory(newHistory);
    setSearchTerm('');
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

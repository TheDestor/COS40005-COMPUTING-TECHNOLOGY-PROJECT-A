import React, { useState, useEffect, useRef } from 'react';
// import { APIProvider } from '@vis.gl/react-google-maps';
import { FiSearch, FiX, FiMic } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import SearchBarExpanded from './SearchBarExpanded.jsx';
import '../styles/Searchbar.css';
import logo from '../assets/SarawakTourismLogo.png'; 

const SearchBar = ({ setSelectedPlace }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
          // types: ['(cities)'],
          // componentRestrictions: { country: 'MY' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;

          const name = place.formatted_address || place.name;
          setSearchTerm(name);
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
        />
      )}
    </div>
  );
};

export default SearchBar;

import { FiSearch } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { useRef, useEffect } from 'react';
import '../styles/Searchbar.css';

function SearchBar({ onPlaceSelected }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'],
      fields: ['geometry', 'name', 'place_id'],
      componentRestrictions: { country: 'my' },
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry || !place.geometry.location) {
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
    });
  }, [onPlaceSelected]);

  return (
    <div className="styled-searchbar-container">
      <img src={logo} alt="Logo" className="searchbar-logo" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search your destination"
        className="styled-searchbar-input"
      />
      <FiSearch className="styled-search-icon" />
    </div>
  );
}

export default SearchBar;

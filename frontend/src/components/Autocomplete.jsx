// import { useRef, useEffect } from 'react';

// const AutocompleteInput = ({ placeholder, value, onChange }) => {
//   const inputRef = useRef(null);

//   useEffect(() => {
//     if (!window.google || !window.google.maps || !window.google.maps.places) return;

//     const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
//       types: ['geocode'], // You can change this to ['establishment'] or others
//     });

//     autocomplete.addListener('place_changed', () => {
//       const place = autocomplete.getPlace();
//       if (place && place.formatted_address) {
//         onChange(place.formatted_address);
//       }
//     });
//   }, [onChange]);

//   return (
//     <input
//       ref={inputRef}
//       type="text"
//       placeholder={placeholder}
//       defaultValue={value} // Use defaultValue instead of value to avoid conflict
//       onChange={(e) => onChange(e.target.value)}
//     />
//   );
// };

// export default AutocompleteInput;

// ZoomHandler.jsx
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export default function ZoomHandlerTesting({ selectedSearchPlace, selectedCategory }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedSearchPlace?.latitude && selectedSearchPlace?.longitude) {
      const position = [
        selectedSearchPlace.latitude,
        selectedSearchPlace.longitude
      ];
      
      // Set zoom level based on category
      if (selectedCategory === 'Major Town') {
        map.setView(position, 7); // Zoom level 7 for Major Town
      } else {
        map.setView(position, 13); // Default zoom level 13 for other categories
      }
    }
  }, [map, selectedSearchPlace, selectedCategory]);

  return null;
}

// ZoomHandler.jsx
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export default function ZoomHandlerTesting({ selectedSearchPlace, selectedCategory, zoomTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedSearchPlace?.latitude || !selectedSearchPlace?.longitude) return;

    const position = [
      selectedSearchPlace.latitude,
      selectedSearchPlace.longitude
    ];

    if (selectedCategory === 'Major Town') {
      map.setView(position, 7);
    } else {
      map.setView(position, 13);
    }
  }, [map, selectedSearchPlace, selectedCategory, zoomTrigger]);

  return null;
}
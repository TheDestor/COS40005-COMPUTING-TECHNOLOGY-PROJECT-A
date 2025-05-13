// ZoomHandler.jsx
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

export default function ZoomHandler({ selectedSearchPlace }) {
  const map = useMap('e57efe6c5ed679ba'); // Assuming this is your map ID or ref

  useEffect(() => {
    if (map && selectedSearchPlace?.latitude && selectedSearchPlace?.longitude) {
      const position = {
        lat: selectedSearchPlace.latitude,
        lng: selectedSearchPlace.longitude,
      };
      map.panTo(position);  // This will move the map center to the place
      map.setZoom(15);      // Set zoom level to 15 (you can adjust this value)
    } else {
      console.log("Map not available or selectedSearchPlace missing");
    }
  }, [map, selectedSearchPlace]);

  return null;
}

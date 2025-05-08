// SearchHandler.jsx
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

export default function SearchHandler({ selectedSearchPlace }) {
  const map = useMap('e57efe6c5ed679ba');

  useEffect(() => {
    if (map && selectedSearchPlace?.latitude && selectedSearchPlace?.longitude) {
      const position = {
        lat: selectedSearchPlace.latitude,
        lng: selectedSearchPlace.longitude
      };
      map.panTo(position);
      map.setZoom(15);
    } else {
        console.log("TESTING MAP FAILED");
        return;
    }
  }, [map, selectedSearchPlace]);

  return null;
}

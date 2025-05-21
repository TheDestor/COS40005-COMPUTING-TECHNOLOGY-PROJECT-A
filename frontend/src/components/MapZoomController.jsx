import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

export default function MapZoomController({ location, zoom = 15 }) {
  const map = useMap('e57efe6c5ed679ba');

  useEffect(() => {
    if (map && location?.lat && location?.lng) {
      map.panTo(location);
      map.setZoom(zoom);
    }
  }, [map, location, zoom]);

  return null;
}
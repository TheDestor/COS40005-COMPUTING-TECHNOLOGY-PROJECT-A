import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

export default function MapZoomController({ location, zoom = 15 }) {
  const map = useMap('e57efe6c5ed679ba');
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (map) {
      setIsMapReady(true);
    }
  }, [map]);

  useEffect(() => {
    if (isMapReady && location?.lat && location?.lng) {
      console.log('Panning to:', location);
      map.panTo(location);
      map.setZoom(zoom);
    }
  }, [isMapReady, location, zoom, map]);

  return null;
}
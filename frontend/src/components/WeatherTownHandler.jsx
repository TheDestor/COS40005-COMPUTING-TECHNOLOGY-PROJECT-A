// WeatherTownHandler.jsx
import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { townCoordinates } from '../townCoordinates';

const WeatherTownHandler = ({ currentTown, shouldZoom, setShouldZoom }) => {
  const map = useMap('e57efe6c5ed679ba');

  useEffect(() => {
    if (!map || !shouldZoom || !currentTown) return

    const coords = townCoordinates[currentTown];
    if (coords) {
      map.panTo({ lat: coords.lat, lng: coords.lon });
      map.setZoom(14); // You can change zoom level here
      setShouldZoom(false);
    }
  }, [map, currentTown, shouldZoom, setShouldZoom]);

  return null; // This component doesn’t render anything
};

export default WeatherTownHandler;

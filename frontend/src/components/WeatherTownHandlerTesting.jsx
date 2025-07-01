// WeatherTownHandlerTesting.jsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { townCoordinates } from '../townCoordinates';

const WeatherTownHandlerTesting = ({ currentTown, shouldZoom, setShouldZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !shouldZoom || !currentTown) return;

    const coords = townCoordinates[currentTown];
    if (coords) {
      map.setView([coords.lat, coords.lon], 14); // [lat, lng], zoom level
      setShouldZoom(false);
    }
  }, [map, currentTown, shouldZoom, setShouldZoom]);

  return null; // This component doesn't render anything
};

export default WeatherTownHandlerTesting;

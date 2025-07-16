import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

export default function MapZoomControllerTesting({ routeCoords, zoomPadding = [50, 50] }) {
  const map = useMap();

  useEffect(() => {
    if (map && Array.isArray(routeCoords) && routeCoords.length > 1) {
      // Invalidate size in case the map was hidden or resized
      map.invalidateSize();
      // Fit bounds to the route
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: zoomPadding });
      console.log('Leaflet map zoomed to route:', routeCoords);
    }
  }, [map, routeCoords, zoomPadding]);

  return null;
}
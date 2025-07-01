import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export default function SearchHandlerTesting({ selectedSearchPlace, setSearchNearbyPlaces }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedSearchPlace?.latitude || !selectedSearchPlace?.longitude) {
      return;
    }

    const lat = selectedSearchPlace.latitude;
    const lon = selectedSearchPlace.longitude;
    const radius = 5000; // 5km radius

    // This is an Overpass QL query to find restaurants, cafes, and bars.
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"restaurant|cafe|bar|food_court"](around:${radius},${lat},${lon});
        way["amenity"~"restaurant|cafe|bar|food_court"](around:${radius},${lat},${lon});
        relation["amenity"~"restaurant|cafe|bar|food_court"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Overpass API response was not ok.');
        return response.json();
      })
      .then(data => {
        const nearbyPlaces = data.elements
          .map(element => ({
            name: element.tags?.name,
            latitude: element.lat || element.center?.lat,
            longitude: element.lon || element.center?.lon,
            placeId: element.id,
            type: 'Restaurant' // So we can use an icon
          }))
          .filter(place => place.name && place.latitude && place.longitude); // Filter out incomplete results

        if (setSearchNearbyPlaces) {
          setSearchNearbyPlaces(nearbyPlaces.slice(0, 20)); // Limit to 20 results
        }
      })
      .catch(error => {
        console.error('Error fetching from Overpass API:', error);
      });
      
  }, [map, selectedSearchPlace, setSearchNearbyPlaces]);

  return null;
}

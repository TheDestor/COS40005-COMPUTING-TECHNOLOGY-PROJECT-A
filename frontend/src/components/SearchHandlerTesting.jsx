import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export default function SearchHandlerTesting({ selectedSearchBarPlace, setSearchNearbyPlaces, searchBarZoomTrigger }) {
  const map = useMap();

  useEffect(() => {
    const lat = selectedSearchBarPlace?.coordinates?.latitude ?? selectedSearchBarPlace?.latitude;
    const lon = selectedSearchBarPlace?.coordinates?.longitude ?? selectedSearchBarPlace?.longitude;

    // UPDATED: use numeric validation, not truthiness, to avoid first-run race and string issues
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    const radius = 500; // 500m radius
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
            type: 'Restaurant'
          }))
          .filter(place => place.name && place.latitude && place.longitude);

        if (setSearchNearbyPlaces) {
          setSearchNearbyPlaces(nearbyPlaces.slice(0, 20));
        }
      })
      .catch(error => {
        console.error('Error fetching from Overpass API:', error);
      });
      
  }, [map, selectedSearchBarPlace, setSearchNearbyPlaces]);

  useEffect(() => {
    const lat = selectedSearchBarPlace?.coordinates?.latitude ?? selectedSearchBarPlace?.latitude;
    const lon = selectedSearchBarPlace?.coordinates?.longitude ?? selectedSearchBarPlace?.longitude;
    if (map && Number.isFinite(lat) && Number.isFinite(lon)) {
      setTimeout(() => {
        map.flyTo([lat, lon], 17);
      }, 100);
    }
  }, [map, selectedSearchBarPlace, searchBarZoomTrigger]);

  return null;
}

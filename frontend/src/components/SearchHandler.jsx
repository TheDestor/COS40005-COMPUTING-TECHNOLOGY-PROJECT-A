// import { useMap } from '@vis.gl/react-google-maps';
// import { useEffect } from 'react';

// export default function SearchHandler({ selectedSearchPlace, setSearchNearbyPlaces }) {
//   const map = useMap('e57efe6c5ed679ba');

//   useEffect(() => {
//   if (!map || !selectedSearchPlace?.latitude || !selectedSearchPlace?.longitude) {
//     console.warn('Map or location data not ready');
//     return;
//   }

//   if (!window.google?.maps?.places) {
//     console.error('Google Places API not loaded');
//     return;
//   }

//   const lat = Number(selectedSearchPlace.latitude);
//   const lng = Number(selectedSearchPlace.longitude);

//   if (isNaN(lat) || isNaN(lng)) {
//     console.error('Invalid lat/lng values:', lat, lng);
//     return;
//   }

//   const position = { lat, lng };

//   map.panTo(position);
//   map.setZoom(15);

//   try {
//     const service = new window.google.maps.places.PlacesService(map);

//     const request = {
//       location: position,
//       radius: 5000,
//       type: ['restaurant']
//     };

//     service.nearbySearch(request, (results, status) => {
//       console.log('Places nearbySearch result:', { status, results });

//       if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
//         const limitedResults = results.slice(0, 10);
//         setSearchNearbyPlaces(
//           limitedResults.map(result => ({
//             name: result.name,
//             latitude: result.geometry.location.lat(),
//             longitude: result.geometry.location.lng(),
//             placeId: result.place_id
//           }))
//         );
//       } else {
//         console.error('PlacesService returned error:', status);
//       }
//     });
//   } catch (err) {
//     console.error('Error initializing PlacesService or using nearbySearch:', err);
//   }
// }, [map, selectedSearchPlace, setSearchNearbyPlaces]);



//   return null;
// }

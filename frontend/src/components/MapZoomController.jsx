// import { useMap } from '@vis.gl/react-google-maps';
// import { useEffect, useState } from 'react';

// export default function MapZoomController({ selectedPlace }) {
//   const map = useMap('e57efe6c5ed679ba');

//   useEffect(() => {
//     if (!selectedPlace?.geometry?.location) return;

//     const location = {
//       lat: selectedPlace.geometry.location.lat(),
//       lng: selectedPlace.geometry.location.lng()
//     };

//     console.log('Map ready, zooming to:', location);
    
//     // First pan smoothly to the location
//     map.panTo(location);
    
//     // Then zoom after a small delay for better UX
//     const zoomTimer = setTimeout(() => {
//       map.setZoom(20);
//       console.log('Zoom completed');
//     }, 100);

//     return () => clearTimeout(zoomTimer);
//   }, [selectedPlace, map]);

//   return null;
// }
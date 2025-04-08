import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = () => {
  const position = [1.5533, 110.3592]; // e.g. coordinates for Sarawak (Kuching approx.)

  return (
    <MapContainer 
      center={position} 
      zoom={10} 
      scrollWheelZoom={true} 
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Hello from Sarawak!
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;

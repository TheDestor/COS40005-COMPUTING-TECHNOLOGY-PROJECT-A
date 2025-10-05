import React, { useState } from 'react';
import '../styles/MapLayers.css';
import roadmap from '../assets/roadmap.png';
import satellite from '../assets/satellite.png';
import terrain from '../assets/terrain.png';
import hybrid from '../assets/hybrid.png';

const basemaps = [
  {
    id: 'osm',
    name: 'Roadmap',
    image: roadmap,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  {
    id: 'esri-imagery',
    name: 'Satellite',
    image: satellite,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
    attribution: 'Tiles &copy; Esri'
  },
];

const MapLayer = ({ isOpen, onClose, onMapTypeChange }) => {
  const [selectedId, setSelectedId] = useState('osm');

  const handleSelect = (id) => {
    setSelectedId(id);
    const bm = basemaps.find(b => b.id === id);
    if (bm) onMapTypeChange(bm);
    onClose();
  };

  return (
    <div className={`map-layer-panel ${isOpen ? 'open' : ''}`}>
      <div className="map-layer-options">
        {basemaps.map(({ id, name, image }) => (
          <div
            key={id}
            className={`layer-box ${selectedId === id ? 'selected' : ''}`}
            onClick={() => handleSelect(id)}
          >
            <img src={image} alt={name} className="layer-image" />
            <div className="layer-label">{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLayer;

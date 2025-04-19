import React, { useState } from 'react';
import '../styles/MapLayers.css';
import roadmap from '../assets/roadmap.png';
import satellite from '../assets/satellite.png';
import terrain from '../assets/terrain.png';
import hybrid from '../assets/hybrid.png';

const mapTypes = [
  { name: 'roadmap', image: roadmap },
  { name: 'satellite', image: satellite },
  { name: 'terrain', image: terrain },
  { name: 'hybrid', image: hybrid },
];

const MapLayer = ({ isOpen, onClose, onMapTypeChange }) => {
  const [selectedType, setSelectedType] = useState('roadmap');

  const handleSelect = (type) => {
    setSelectedType(type);           
    onMapTypeChange(type);           
    onClose();                       
  };

  return (
    <div className={`map-layer-panel ${isOpen ? 'open' : ''}`}>
      <div className="map-layer-options">
        {mapTypes.map(({ name, image }) => (
          <div
            key={name}
            className={`layer-box ${selectedType === name ? 'selected' : ''}`}
            onClick={() => handleSelect(name)}
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

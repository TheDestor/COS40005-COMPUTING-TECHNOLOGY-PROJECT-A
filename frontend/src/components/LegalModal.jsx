import React from 'react';
import { IoClose } from 'react-icons/io5';
import '../styles/AboutMapModal.css'; // Reuse modal styles for consistency

const LegalModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="about-map-overlay">
      <div className="about-map-modal" style={{maxWidth: 500}}>
        <div className="about-map-header">
          <h2 style={{fontSize: 22}}>{title}</h2>
          <button className="close-button-amm" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        <div className="about-map-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LegalModal;

import React from 'react';
import '../styles/SeniorModeConfirm.css';
import { FaCheckCircle } from 'react-icons/fa';
import ElderImg from '../assets/elderly.png';

const SeniorModeConfirm = ({ onConfirm, onCancel }) => {
  return (
    <div className="senior-overlay">
      <div className="senior-modal animate-in">
        {/* <FaCheckCircle className="senior-icon"/> */}
        <img src={ElderImg} alt="Elderly" className="senior-image" />
        <h2>Enable Senior Mode?</h2>
        <p>This will apply a larger font, simplified design, and clearer layout for easier navigation.</p>
        
        <div className="senior-buttons">
          <button className="senior-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="senior-confirm-btn" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default SeniorModeConfirm;

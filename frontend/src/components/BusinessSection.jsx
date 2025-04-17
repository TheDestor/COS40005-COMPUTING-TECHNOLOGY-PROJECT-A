import React from "react";
import "../styles/BusinessSection.css";
import { FaArrowLeft } from "react-icons/fa";

const BusinessSection = ({ isOpen, onClose }) => {
  return (
    <div className={`business-slide-container ${isOpen ? "show" : ""}`}>
      <div className="business-header">
        <span>Business</span>
        <FaArrowLeft className="back-icon" onClick={onClose} />
      </div>

      <div className="business-content">
        {/* Empty content for now */}
      </div>
    </div>
  );
};

export default BusinessSection;

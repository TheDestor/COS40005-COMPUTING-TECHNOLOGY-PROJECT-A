import React from 'react';
import { IoClose } from 'react-icons/io5';
import { FaMap, FaRoute, FaBuilding, FaUsers, FaGlobe, FaTools, FaBullseye, FaPhone, FaStar } from 'react-icons/fa';
import '../styles/AboutMapModal.css';

const AboutMapModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const currentYear = new Date().getFullYear();

  return (
    <div className="about-map-overlay">
      <div className="about-map-modal">
        <div className="about-map-header">
          <h2>
            <FaMap className="modal-icon" />
            About Sarawak Tourism Map
          </h2>
          <button className="close-button-amm" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        
        <div className="about-map-content">
          <div className="about-section">
            <h3><FaMap className="section-title-icon" /> Interactive Tourism Platform</h3>
            <p>
              The Sarawak Tourism Map is a comprehensive digital platform designed to showcase 
              the beauty and diversity of Sarawak, Malaysia. Our interactive map provides 
              visitors and locals with detailed information about attractions, businesses, 
              and cultural sites across the state.
            </p>
          </div>

          <div className="features-section">
            <h3><FaStar className="section-title-icon" /> Key Features</h3>
            <div className="features-grid">
              <div className="feature-item">
                <FaRoute className="feature-icon" />
                <div className="feature-content">
                  <h4>Smart Navigation</h4>
                  <p>Multi-modal routing with real-time traffic data for cars, buses, walking, and cycling</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaBuilding className="feature-icon" />
                <div className="feature-content">
                  <h4>Business Directory</h4>
                  <p>Discover local businesses, restaurants, hotels, and attractions with detailed information</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaUsers className="feature-icon" />
                <div className="feature-content">
                  <h4>Community Driven</h4>
                  <p>Local businesses can submit and manage their listings to reach more visitors</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaGlobe className="feature-icon" />
                <div className="feature-content">
                  <h4>Cultural Heritage</h4>
                  <p>Explore Sarawak's rich cultural heritage, national parks, and historical sites</p>
                </div>
              </div>
            </div>
          </div>

          <div className="purpose-section">
            <h3><FaBullseye className="section-title-icon" /> Our Mission</h3>
            <p>
              To promote sustainable tourism in Sarawak by providing an accessible, 
              user-friendly platform that connects visitors with local businesses and 
              cultural experiences. We aim to support the local economy while preserving 
              the natural beauty and cultural heritage of Sarawak.
            </p>
          </div>

          <div className="contact-section">
            <h3><FaPhone className="section-title-icon" /> Support</h3>
            <p>
              For technical support, business inquiries, or feedback, please contact 
              our support team through the Contact Us or swkmap@gmail.com.
            </p>
          </div>
        </div>
        
        <div className="about-map-footer">
          <p>© {currentYear} Metaverse Trails 2.0. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutMapModal;

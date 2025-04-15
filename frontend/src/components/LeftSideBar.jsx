import React, { useState } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaSort } from 'react-icons/fa';
import '../styles/LeftSideBar.css';

const LeftSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  const handleVehicleClick = (vehicle) => {
    if (!startingPoint.trim() || !destination.trim()) {
      alert('You need to fill in your starting point and destination first');
      return;
    }
    setSelectedVehicle(vehicle);
  };

  return (
    <>
      {/* Collapsed Sidebar */}
      <div className="sidebar100">
        <div className="menu-icon100" onClick={toggleSidebar}>
          <FaBars />
        </div>
        <div className="menu-item100">
          <FaClock className="icon100" />
          <span className="label100">Recent</span>
        </div>
        <div className="menu-item100">
          <FaBuilding className="icon100" />
          <span className="label100">Business</span>
        </div>
      </div>

      {/* Expanded Panel */}
      <div className={`side-panel100 ${isExpanded ? 'expanded' : ''}`}>
        <div className="transport-section">
          <div className="transport-row">
            <div 
              className={`transport-option ${selectedVehicle === 'Car' ? 'active' : ''}`} 
              onClick={() => handleVehicleClick('Car')}
            >
              🚗<span>Car</span>
            </div>
            <div 
              className={`transport-option ${selectedVehicle === 'Bus' ? 'active' : ''}`} 
              onClick={() => handleVehicleClick('Bus')}
            >
              🚌<span>Bus</span>
            </div>
            <div 
              className={`transport-option ${selectedVehicle === 'Walking' ? 'active' : ''}`} 
              onClick={() => handleVehicleClick('Walking')}
            >
              🚶<span>Walking</span>
            </div>
          </div>
          <div className="transport-row">
            <div 
              className={`transport-option ${selectedVehicle === 'Bicycle' ? 'active' : ''}`} 
              onClick={() => handleVehicleClick('Bicycle')}
            >
              🚴<span>Bicycle</span>
            </div>
            <div 
              className={`transport-option ${selectedVehicle === 'Motorbike' ? 'active' : ''}`} 
              onClick={() => handleVehicleClick('Motorbike')}
            >
              🏍️<span>Motorbike</span>
            </div>
            <div 
              className={`transport-option ${selectedVehicle === 'Flight' ? 'active' : ''}`} 
              onClick={() => handleVehicleClick('Flight')}
            >
              ✈️<span>Flight</span>
            </div>
          </div>
        </div>

        <div className="input-container">
          <div className="input-box">
            <FaMapMarkerAlt className="input-icon red" />
            <input 
              type="text" 
              placeholder="Choosing Starting point" 
              value={startingPoint}
              onChange={(e) => setStartingPoint(e.target.value)}
            />
            <FaSearch className="input-icon" />
          </div>
          <button className="sort-btn"><FaSort /></button>
        </div>

        <div className="input-container">
          <div className="input-box">
            <FaMapMarkerAlt className="input-icon red" />
            <input 
              type="text" 
              placeholder="Choosing Destination" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <FaSearch className="input-icon" />
          </div>
          <button className="sort-btn"><FaSort /></button>
        </div>

        <div className="add-destination">➕ Add destination</div>

        <div className="location-list">
          {[
            'Your Location',
            'Kuching',
            'Warung Acik Mila',
            'Borneo Cultures Museum',
            'Borneo Medical Centre',
            'Hotel',
            'Airport Airasia',
            'Airport Airasia',
            'Airport Airasia',
            'Airport Airasia',
            'Airport Airasia',
          ].map((item, index) => (
            <div className="location-item" key={index}>
              <FaClock className="location-icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LeftSidebar;
import React, { useState } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaSort } from 'react-icons/fa';
import '../styles/LeftSideBar.css';
import RecentSection from './RecentSection'; // Make sure this path is correct

const LeftSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [showRecent, setShowRecent] = useState(false);

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  const handleVehicleClick = (vehicle) => {
    if (!startingPoint.trim() || !destination.trim()) {
      alert('You need to fill in your starting point and destination first');
      return;
    }
    setSelectedVehicle(vehicle);
  };

  const toggleRecentHistory = () => {
    setShowRecent(true);
  };

  return (
    <>
      {/* Collapsed Sidebar */}
      <div className="sidebar100">
        <div className="menu-icon100" onClick={toggleSidebar}>
          <FaBars />
        </div>
        <div className="menu-item100">
          <FaClock className="icon100" onClick={toggleRecentHistory} />
          <span className="label100" onClick={toggleRecentHistory}>Recent</span>
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
            <div className={`transport-option ${selectedVehicle === 'Car' ? 'active' : ''}`} onClick={() => handleVehicleClick('Car')}>
              🚗<span>Car</span>
            </div>
            <div className={`transport-option ${selectedVehicle === 'Bus' ? 'active' : ''}`} onClick={() => handleVehicleClick('Bus')}>
              🚌<span>Bus</span>
            </div>
            <div className={`transport-option ${selectedVehicle === 'Walking' ? 'active' : ''}`} onClick={() => handleVehicleClick('Walking')}>
              🚶<span>Walking</span>
            </div>
          </div>
          <div className="transport-row">
            <div className={`transport-option ${selectedVehicle === 'Bicycle' ? 'active' : ''}`} onClick={() => handleVehicleClick('Bicycle')}>
              🚴<span>Bicycle</span>
            </div>
            <div className={`transport-option ${selectedVehicle === 'Motorbike' ? 'active' : ''}`} onClick={() => handleVehicleClick('Motorbike')}>
              🏍️<span>Motorbike</span>
            </div>
            <div className={`transport-option ${selectedVehicle === 'Flight' ? 'active' : ''}`} onClick={() => handleVehicleClick('Flight')}>
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

        <hr />

        {startingPoint.trim() && destination.trim() ? (
          <div className="route-list">
            <div className="route-item">
              <div><strong>Via Jalan Taman Budaya</strong></div>
              <div className="route-details">
                <span className="time">6 min</span>
                <span className="distance">2.6 km</span>
              </div>
            </div>
            <hr />
            <div className="route-item">
              <div><strong>Via Jalan P Ramlee</strong></div>
              <div className="route-details">
                <span className="time">7 min</span>
                <span className="distance">3.1 km</span>
              </div>
            </div>
            <hr />
            <div className="route-item">
              <div><strong>Via Jalan Tun Abang Haji Openg</strong></div>
              <div className="route-details">
                <span className="time">8 min</span>
                <span className="distance">3.4 km</span>
              </div>
            </div>

            <hr />

            <div className="route-footer">
              <div className="send-copy-row">
                <div className="send-directions-text">📩 Send Directions</div>
                <div className="copy-link">COPY LINK</div>
              </div>

              <hr />

              <div className="explore-nearby-text">🔍 Explore Nearby</div>
              <div className="nearby-items">
                {[
                  { icon: '🍽️', label: 'Restaurant' },
                  { icon: '🏨', label: 'Hotel' },
                  { icon: '🛍️', label: 'Mall' },
                  { icon: '🏥', label: 'Hospital' },
                  { icon: '⛽', label: 'Gas Station' },
                  { icon: '🚓', label: 'Police Station' },
                ].map((item, index) => (
                  <div className="nearby-item" key={index}>
                    <span className="nearby-icon">{item.icon}</span>
                    <span className="nearby-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="location-list">
            {[
              'Your Location',
              'Kuching',
              'Warung Acik Mila',
              'Borneo Cultures Museum',
              'Borneo Medical Centre',
              'Hotel',
              'Airport Airasia',
            ].map((item, index) => (
              <div className="location-item" key={index}>
                <FaClock className="location-icon" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-in RecentSection */}
      <RecentSection isOpen={showRecent} onClose={() => setShowRecent(false)} />
    </>
  );
};

export default LeftSidebar;

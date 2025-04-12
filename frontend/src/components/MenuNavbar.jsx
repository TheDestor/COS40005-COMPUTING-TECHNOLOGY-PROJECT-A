import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt
} from 'react-icons/fa';
import { FaLocationDot, FaMapLocationDot } from "react-icons/fa6";
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import '../styles/MenuNavbar.css';
import logo from '../assets/SarawakTourismLogo.png'; // Make sure the logo is placed correctly

const MenuNavbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const menuItems = [
    { name: 'Map', icon: <FaMapLocationDot />, path: '/map' },
    { name: 'Major Town', icon: <FaLocationDot />, path: '/major-town' },
    { name: 'Homestay', icon: <FaBed />, path: '/homestay' },
    { name: 'Museum', icon: <FaUniversity />, path: '/museum' },
    { name: 'National Park', icon: <FaMountain />, path: '/national-park' },
    { name: 'Airport', icon: <FaPlaneDeparture />, path: '/airport' },
    { name: 'Beach', icon: <FaUmbrellaBeach />, path: '/beach' },
    { name: 'Hospital', icon: <FaHospital />, path: '/hospital' },
    { name: 'Event', icon: <FaCalendarAlt />, path: '/event' }
  ];

  const currentPath = location.pathname;

  return (
    <div className="mapview-navbar">
      <Link to="/" className="nav-logo">
        <img src={logo} alt="Sarawak Tourism" className="logo-image" />
      </Link>

      {!isMobile ? (
        <div className="menu-container2">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`menu-item3 ${isActive ? 'active' : ''}`}
              >
                <div className={`icon-container2 ${isActive ? 'active-icon-container2' : ''}`}>
                  <span className={`menu-icon3 ${isActive ? 'active-icon2' : ''}`}>
                    {item.icon}
                  </span>
                </div>
                <span className={`menu-text3 ${isActive ? 'active-text2' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="dropdown-container">
          <div
            className="dropdown-wrapper"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="menu-dropdown">Menu</span>
            {isDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="menu-item-dropdown"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  {item.icon} {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuNavbar;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBed, FaPlaneDeparture, FaHospital, FaCalendarAlt, FaShoppingCart
} from 'react-icons/fa';
import { MdForest } from "react-icons/md";
import { IoFastFood } from "react-icons/io5";
import { FaLocationDot, FaMapLocationDot } from "react-icons/fa6";
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import '../styles/MenuNavbar.css';
import logo from '../assets/SarawakTourismLogo.png'; 
import ProfileDropdown from '../components/ProfileDropdown.jsx';
import ky from 'ky';

const MenuNavbar = ({ onLoginClick, onMenuSelect }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMobileMenuItem, setSelectedMobileMenuItem] = useState({ name: 'Major Town', icon: <FaLocationDot />, path: '/major-towns' });
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: 'Map', icon: <FaMapLocationDot />, path: '/' },
    { name: 'Major Town', icon: <FaLocationDot />, path: '/major-towns' },
    { name: 'Attractions', icon: <MdForest />, path: '/attractions' },
    { name: 'Shoppings & Leisures', icon: <FaShoppingCart />, path: '/shopping' },
    { name: 'Food & Beverages', icon: <IoFastFood />, path: '/food' },
    { name: 'Transportation', icon: <FaPlaneDeparture />, path: '/transportation' },
    { name: 'Accomodation', icon: <FaBed />, path: '/accomodation' },
    { name: 'Tour Guides', icon: <FaHospital />, path: '/tourguides' },
    { name: 'Event', icon: <FaCalendarAlt />, path: '/event' }
  ];

  const handleMobileMenuClick = (item) => {
    setSelectedMobileMenuItem(item);
    setIsDropdownOpen(false);
    if (onMenuSelect) {
      onMenuSelect(item.name, item.path);
    }
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const currentPath = location.pathname;

  return (
    <div className="mapview-navbar">
      <Link to="/" className="nav-logo">
          <img src={logo} alt="Sarawak Tourism" className="logo-image" />
      </Link>

      {isMobile ? (
        <div className="mobile-menu-dropdown-wrapper">
          <button className="dropdown-toggle-button" onClick={handleDropdownToggle}>
            <span className="dropdown-toggle-text">{selectedMobileMenuItem.name}</span>
            <span className="dropdown-toggle-icon">
              {isDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu-list">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`dropdown-menu-item ${selectedMobileMenuItem.name === item.name ? 'active-dropdown-item' : ''}`}
                  onClick={() => handleMobileMenuClick(item)}
                >
                  <span className="dropdown-item-icon">{item.icon}</span>
                  <span className="dropdown-item-text">{item.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="menu-wrapper">
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
                    <span className={`menu-icon2 ${isActive ? 'active-icon2' : ''}`}>
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
        </div>
      )}
      
      <div className="profile-container2">
          <ProfileDropdown onLoginClick={onLoginClick} />
      </div>
    </div>
  );
};

export default MenuNavbar;

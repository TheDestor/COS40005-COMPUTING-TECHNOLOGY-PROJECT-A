import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt
} from 'react-icons/fa';
import { FaLocationDot, FaMapLocationDot } from "react-icons/fa6";
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import '../styles/MenuNavbar.css';
import logo from '../assets/SarawakTourismLogo.png'; 
import ProfileDropdown from '../components/ProfileDropdown.jsx';

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
    { name: 'Map', icon: <FaMapLocationDot />, path: '/' },
    { name: 'Major Town', icon: <FaLocationDot />, path: '/' },
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
    <div className="profile-container2">
        <ProfileDropdown />
    </div>
    </div>
  );
};

export default MenuNavbar;

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
import ky from 'ky';

const MenuNavbar = ({ onLoginClick, onMenuSelect }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const [selectedMenu, setSelectedMenu] = useState('');

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
    { name: 'Major Town', icon: <FaLocationDot />, path: '/major-towns' },
    { name: 'Attractions', icon: <FaBed />, path: '/homestay' },
    { name: 'Shoppings & Leisures', icon: <FaUniversity />, path: '/museum' },
    { name: 'Food & Beverages', icon: <FaMountain />, path: '/national-parks' },
    { name: 'Transportation', icon: <FaPlaneDeparture />, path: '/airport' },
    { name: 'Accomodation', icon: <FaUmbrellaBeach />, path: '/beach' },
    { name: 'Tour Guides', icon: <FaUmbrellaBeach />, path: '/beach' },
    { name: 'Event', icon: <FaCalendarAlt />, path: '/event' }
  ];

  // const handleMenuClick = async (item) => {
  //   if (item.isFetchOnly) {
  //     setSelectedMenu(item.name);
  //     try {
  //       const response = await ky.get(`/api/locations?type=${encodeURIComponent(item.name)}`).json();
  //       console.log(`Fetched ${item.name} Data:`, response);

  //       // Trigger parent to update
  //       if (onMenuSelect) {
  //         onMenuSelect(item.name, response);
  //       }

  //       // You can now set this data into state if you want to display it
  //     } catch (error) {
  //       console.error(`Error fetching ${item.name}:`, error);
  //     }
  //   }
  // };

  // useEffect(() => {
  //   const defaultItem = menuItems.find(item => item.name === 'Major Town');
  //   if (defaultItem) {
  //     handleMenuClick(defaultItem);
  //   }
  // }, []);
  

  const currentPath = location.pathname;

  return (
    <div className="mapview-navbar">
    <Link to="/" className="nav-logo">
        <img src={logo} alt="Sarawak Tourism" className="logo-image" />
    </Link>

    <div className="menu-wrapper">
        <div className="menu-container2">
          {menuItems.map((item) => {
            const isActive = selectedMenu === item.name || (!item.isFetchOnly && currentPath === item.path);

            return item.isFetchOnly ? (
              <div
                key={item.name}
                className={`menu-item3 ${isActive ? 'active' : ''}`}
                onClick={() => handleMenuClick(item)}
              >
                <div className={`icon-container2 ${isActive ? 'active-icon-container2' : ''}`}>
                  <span className={`menu-icon2 ${isActive ? 'active-icon2' : ''}`}>
                    {item.icon}
                  </span>
                </div>
                <span className={`menu-text3 ${isActive ? 'active-text2' : ''}`}>
                  {item.name}
                </span>
              </div>
            ) : (
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
        <ProfileDropdown onLoginClick={onLoginClick} />
    </div>
    </div>
  );
};

export default MenuNavbar;

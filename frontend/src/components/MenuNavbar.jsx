import React, { useState, useEffect, useRef } from 'react';
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

const MenuNavbar = ({ 
  onLoginClick, 
  onMenuSelect, 
  onMajorTownHover,
  onAttractionsHover,
  onShoppingHover,
  onFoodHover,
  onTransportationHover,
  onAccommodationHover,
  onTourGuidesHover,
  onEventHover 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMobileMenuItem, setSelectedMobileMenuItem] = useState({ name: 'Map', icon: <FaMapLocationDot />, path: '/' });
  const location = useLocation();

  // 🚀 RATE LIMITING: Track last preload times for each category
  const lastPreloadTimes = useRef({});
  const preloadCooldown = 30000; // 30 seconds cooldown between preloads
  const isPreloading = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: 'Map', icon: <FaMapLocationDot />, path: '/', onMouseEnter: null },
    { name: 'Major Town', icon: <FaLocationDot />, path: '/major-towns', onMouseEnter: onMajorTownHover },
    { name: 'Attractions', icon: <MdForest />, path: '/attractions', onMouseEnter: onAttractionsHover },
    { name: 'Shoppings & Leisures', icon: <FaShoppingCart />, path: '/shopping', onMouseEnter: onShoppingHover },
    { name: 'Food & Beverages', icon: <IoFastFood />, path: '/food', onMouseEnter: onFoodHover },
    { name: 'Transportation', icon: <FaPlaneDeparture />, path: '/transportation', onMouseEnter: onTransportationHover },
    { name: 'Accomodation', icon: <FaBed />, path: '/accomodation', onMouseEnter: onAccommodationHover },
    { name: 'Tour Guides', icon: <FaHospital />, path: '/tourguides', onMouseEnter: onTourGuidesHover },
    { name: 'Event', icon: <FaCalendarAlt />, path: '/event', onMouseEnter: onEventHover }
  ];

  // 🚀 RATE LIMITED PRELOADING: Smart preloading with cooldowns
  const rateLimitedPreload = (preloadFn, categoryName) => {
    const now = Date.now();
    const lastPreload = lastPreloadTimes.current[categoryName] || 0;
    
    // Check if enough time has passed since last preload
    if (now - lastPreload < preloadCooldown) {
      console.log(`⏳ Rate limited: ${categoryName} preload skipped (cooldown active)`);
      return;
    }

    // Check if already preloading
    if (isPreloading.current) {
      console.log(`⏳ Rate limited: ${categoryName} preload skipped (another preload in progress)`);
      return;
    }

    if (preloadFn && typeof preloadFn === 'function') {
      isPreloading.current = true;
      lastPreloadTimes.current[categoryName] = now;
      
      try {
        console.log(`🚀 Preloading: ${categoryName}`);
        preloadFn();
      } catch (error) {
        console.warn(`Preload error for ${categoryName}:`, error);
      } finally {
        // Reset preloading flag after a short delay
        setTimeout(() => {
          isPreloading.current = false;
        }, 1000);
      }
    }
  };

  // 🚀 SMART PRELOADING: Only preload on initial mount, not repeatedly
  useEffect(() => {
    const preloadFunctions = [
      { fn: onMajorTownHover, name: 'MajorTown' },
      { fn: onAttractionsHover, name: 'Attractions' },
      { fn: onShoppingHover, name: 'Shopping' },
      { fn: onFoodHover, name: 'Food' },
      { fn: onTransportationHover, name: 'Transportation' },
      { fn: onAccommodationHover, name: 'Accommodation' },
      { fn: onTourGuidesHover, name: 'TourGuides' },
      { fn: onEventHover, name: 'Event' }
    ].filter(item => item.fn);

    // 🚀 INITIAL PRELOAD: Only preload once on mount, with staggered timing
    const initialPreload = () => {
      preloadFunctions.forEach((item, index) => {
        // Stagger preloads by 2 seconds each to avoid overwhelming APIs
        setTimeout(() => {
          rateLimitedPreload(item.fn, item.name);
        }, index * 2000);
      });
    };

    // Run initial preload
    initialPreload();
    
    // 🚀 REDUCED FREQUENCY: Only refresh every 5 minutes instead of 15 seconds
    const interval = setInterval(() => {
      // Only preload if user is actively on the site (not idle)
      if (document.visibilityState === 'visible') {
        preloadFunctions.forEach((item, index) => {
          setTimeout(() => {
            rateLimitedPreload(item.fn, item.name);
          }, index * 1000); // Stagger by 1 second for background refreshes
        });
      }
    }, 5 * 60 * 1000); // 5 minutes instead of 15 seconds
    
    return () => clearInterval(interval);
  }, [
    onMajorTownHover,
    onAttractionsHover,
    onShoppingHover,
    onFoodHover,
    onTransportationHover,
    onAccommodationHover,
    onTourGuidesHover,
    onEventHover
  ]);

  // 🚀 HOVER PRELOADING: Only preload on actual hover, with rate limiting
  const handleMouseEnter = (item) => {
    if (item.onMouseEnter) {
      rateLimitedPreload(item.onMouseEnter, item.name);
    }
  };

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

  // Keep mobile dropdown selection in sync with current route
  useEffect(() => {
    const activeItem = menuItems.find((item) => item.path === location.pathname);
    if (activeItem) {
      setSelectedMobileMenuItem(activeItem);
      setIsDropdownOpen(false); // close dropdown when route changes
    }
  }, [location.pathname]);

  return (
    <div className="mapview-navbar">
      <Link to="/" className="nav-logo">
          <img src={logo} alt="Sarawak Tourism" className="logo-image" />
      </Link>

      {isMobile ? (
        <div className="mobile-menu-dropdown-wrapper">
          <button
            className={`dropdown-toggle-button ${selectedMobileMenuItem ? 'active' : ''}`}
            onClick={handleDropdownToggle}
            aria-label={`Select menu: ${selectedMobileMenuItem?.name || ''}`}
          >
            <span className="dropdown-selected-icon">
              {selectedMobileMenuItem?.icon}
            </span>
            <span className="dropdown-toggle-text">{selectedMobileMenuItem?.name}</span>
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
                  aria-current={selectedMobileMenuItem.name === item.name ? 'page' : undefined}
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
                  onMouseEnter={() => handleMouseEnter(item)}
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
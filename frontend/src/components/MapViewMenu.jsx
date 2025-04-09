import React, { useState, useEffect } from 'react';
import { 
  FiMapPin,
  FiHome,
  FiBook,
  FiAnchor,
  FiNavigation,
  FiUmbrella,
  FiPlusCircle,
  FiCalendar,
  FiMenu,
  FiX
} from 'react-icons/fi';

const MapViewMenu = ({ onSelect, activeOption = 'Major Town' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if mobile view on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Add to your useEffect in the component
useEffect(() => {
  if (isMenuOpen) {
    document.body.classList.add('menu-open');
  } else {
    document.body.classList.remove('menu-open');
  }
  
  return () => {
    document.body.classList.remove('menu-open');
  };
}, [isMenuOpen]);

  const menuItems = [
    { name: 'Major Town', icon: <FiMapPin /> },
    { name: 'HomeStay', icon: <FiHome /> },
    { name: 'Museum', icon: <FiBook /> },
    { name: 'National Park', icon: <FiAnchor /> },
    { name: 'Airport', icon: <FiNavigation /> },
    { name: 'Beach', icon: <FiUmbrella /> },
    { name: 'Hospital', icon: <FiPlusCircle /> },
    { name: 'Event', icon: <FiCalendar /> }
  ];

  const styles = {
    menuContainer: {
      display: 'flex',
      backgroundColor: '#ECE6F0',
      borderRadius: '12px',
      padding: '2px',
      margin: '0 6px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      height: '52px',
      maxWidth: '100%',
      boxSizing: 'border-box',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      '@media (max-width: 768px)': {
        justifyContent: 'flex-start',
        padding: '8px',
        height: 'auto',
        flexDirection: 'column',
        position: 'absolute',
        top: '60px',
        right: '10px',
        zIndex: 1000,
        display: isMenuOpen ? 'flex' : 'none',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        width: '200px'
      }
    },
    menuItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '12px',
      color: '#555',
      border: 'none',
      background: 'none',
      outline: 'none',
      flexShrink: 0,
      minWidth: '64px',
      position: 'relative',
      '@media (max-width: 768px)': {
        flexDirection: 'row',
        width: '100%',
        padding: '8px 12px',
        justifyContent: 'flex-start',
        minWidth: 'auto'
      }
    },
    iconContainer: {
      width: '28px',
      height: '28px',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '2px',
      '@media (max-width: 768px)': {
        marginBottom: 0,
        marginRight: '10px'
      }
    },
    activeIconContainer: {
      backgroundColor: '#007AFF',
    },
    menuIcon: {
      fontSize: '12px',
    },
    activeIcon: {
      color: 'white',
    },
    menuText: {
      fontSize: '10px',
      textAlign: 'center',
      fontWeight: '400',
      transition: 'color 0.2s ease',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      '@media (max-width: 768px)': {
        textAlign: 'left',
        fontSize: '12px'
      }
    },
    activeText: {
      color: '#007AFF',
      fontWeight: '500',
    },
    hamburgerButton: {
      display: 'none',
      '@media (max-width: 768px)': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ECE6F0',
        border: 'none',
        borderRadius: '12px',
        padding: '10px',
        cursor: 'pointer',
        marginLeft: 'auto'
      }
    },
    hamburgerIcon: {
      fontSize: '20px',
      color: '#333'
    }
  };

  // Function to merge styles with media queries
  const getStyle = (styleName) => {
    const style = styles[styleName];
    if (!style) return {};
    
    const baseStyle = {};
    const mediaStyles = {};
    
    Object.keys(style).forEach(key => {
      if (key.startsWith('@media')) {
        if (isMobile) {
          Object.assign(baseStyle, style[key]);
        }
      } else {
        baseStyle[key] = style[key];
      }
    });
    
    return baseStyle;
  };

  const handleMenuItemClick = (name) => {
    onSelect(name);
    if (isMobile) {
      setIsMenuOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {isMobile && (
        <button 
          style={getStyle('hamburgerButton')}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <FiX style={getStyle('hamburgerIcon')} />
          ) : (
            <FiMenu style={getStyle('hamburgerIcon')} />
          )}
        </button>
      )}
      
      <div style={getStyle('menuContainer')}>
        {menuItems.map((item) => {
          const isActive = activeOption === item.name;
          return (
            <button
              key={item.name}
              style={getStyle('menuItem')}
              onClick={() => handleMenuItemClick(item.name)}
            >
              <div style={{
                ...getStyle('iconContainer'),
                ...(isActive ? getStyle('activeIconContainer') : {})
              }}>
                <span style={{
                  ...getStyle('menuIcon'),
                  ...(isActive ? getStyle('activeIcon') : {})
                }}>
                  {item.icon}
                </span>
              </div>
              <span style={{
                ...getStyle('menuText'),
                ...(isActive ? getStyle('activeText') : {})
              }}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MapViewMenu;
import React from 'react';
import { 
  FiMapPin,
  FiHome,
  FiBook,
  FiAnchor,
  FiNavigation,
  FiUmbrella,
  FiPlusCircle,
  FiCalendar
} from 'react-icons/fi';

const MapViewMenu = ({ onSelect, activeOption }) => {
  const menuItems = [
    { name: 'Major Town', icon: <FiMapPin /> },
    { name: 'Homestay', icon: <FiHome /> },
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
      gap: '10px',
      alignItems: 'flex-start', // Align items to top
      marginLeft: '10px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      padding: '5px 0',
    },
    menuItem: {
      display: 'flex',
      flexDirection: 'column', // Stack vertically
      alignItems: 'center', // Center horizontally
      padding: '6px 12px', // Adjusted padding
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333',
      backgroundColor: '#ECE6F0',
      borderRadius: '20px',
      border: 'none',
      flexShrink: 0,
      transition: 'all 0.2s ease',
      width: '90px', // Fixed width for consistency
    },
    activeMenuItem: {
      backgroundColor: '#007AFF',
      color: 'white',
    },
    menuIcon: {
      fontSize: '16px', // Slightly larger icon
    },
    menuText: {
      fontSize: '12px', // Slightly smaller text
      textAlign: 'center',
    }
  };

  return (
    <div style={styles.menuContainer}>
      {menuItems.map((item) => (
        <button
          key={item.name}
          style={{
            ...styles.menuItem,
            ...(activeOption === item.name ? styles.activeMenuItem : {}),
          }}
          onClick={() => onSelect(item.name)}
        >
          <span style={styles.menuIcon}>{item.icon}</span>
          <span style={styles.menuText}>{item.name}</span>
        </button>
      ))}
    </div>
  );
};

export default MapViewMenu;
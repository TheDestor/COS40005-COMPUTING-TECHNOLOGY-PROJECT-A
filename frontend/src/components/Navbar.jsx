import React, { useState, useEffect } from 'react';

const NavigationBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleTimeString('en-US', options);
  };

  const menuItems = [
    { title: 'Major Team', items: ['HonorStay', 'Museum', 'National Park'] },
    { title: 'Locations', items: ['Airport', 'Beach', 'Hospital', 'Event'] }
  ];

  const styles = {
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      backgroundColor: '#404040',
      padding: '15px 30px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      gap: '40px'
    },
    logoSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    logo: {
      width: '120px',
      height: 'auto'
    },
    searchBar: {
      padding: '8px 12px',
      borderRadius: '20px',
      border: 'none',
      width: '200px',
      fontSize: '14px'
    },
    menuSection: {
      display: 'flex',
      gap: '40px',
      color: 'white',
      flexGrow: 1
    },
    menuGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    menuTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    menuItem: {
      fontSize: '14px',
      color: '#e0e0e0',
      textDecoration: 'none',
      '&:hover': {
        color: 'white'
      }
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '25px',
      color: 'white'
    },
    timeSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    },
    userIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#606060',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.navbar}>
      {/* Left Section - Logo and Search */}
      <div style={styles.logoSection}>
        <img 
          src="/path-to-your-logo.png" 
          alt="Logo" 
          style={styles.logo}
        />
        <input
          type="text"
          placeholder="Search..."
          style={styles.searchBar}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Middle Section - Menu Items
      <div style={styles.menuSection}>
        {menuItems.map((group, index) => (
          <div key={index} style={styles.menuGroup}>
            <div style={styles.menuTitle}>{group.title}</div>
            {group.items.map((item, itemIndex) => (
              <a
                key={itemIndex}
                href="#"
                style={styles.menuItem}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#e0e0e0'}
              >
                {item}
              </a>
            ))}
          </div>
        ))}
      </div> */}

      {/* Right Section - Time and User Icon */}
      <div style={styles.rightSection}>
        <div style={styles.timeSection}>
          <div>{formatTime(currentTime)}</div>
          <div style={{ fontSize: '12px' }}>{currentTime.toLocaleDateString()}</div>
        </div>
        <div style={styles.userIcon}>
          <span>👤</span> {/* Replace with your icon */}
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
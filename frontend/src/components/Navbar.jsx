import React, { useState, useEffect } from 'react';
import logo from '../assets/SarawakTourismLogo.png';
import SearchBar from './Searchbar.jsx';
import MapViewMenu from './MapViewMenu.jsx';

const API_KEY = '8be72b9eaf2d1c81e052f4fc2c58ad0c';

const NavigationBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [currentTown, setCurrentTown] = useState('Kuching');
  const [showTownDropdown, setShowTownDropdown] = useState(false);

  const towns = [
    'Kuching', 'Sibu', 'Mukah', 'Serian', 'Bintulu', 'Betong',
    'Kota Samarahan', 'Miri', 'Kapit', 'Sri Aman', 'Sarikei', 'Limbang'
  ];

  const handleSearch = (query) => {
    console.log('Searching for:', query);
    // Implement your search functionality here
  };

  const [activeMenuOption, setActiveMenuOption] = useState('Major Town');

  const handleMenuSelect = (option) => {
    setActiveMenuOption(option);
    // Add your map view change logic here
    console.log('Selected view:', option);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const seconds = now.getSeconds();
      const msUntilNextMinute = (60 - seconds) * 1000;
      
      setTimeout(() => {
        updateTime();
        const timer = setInterval(updateTime, 60000);
        return () => clearInterval(timer);
      }, msUntilNextMinute);
    };

    updateTime();
    return () => clearTimeout(updateTime);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${currentTown},MY&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();
  }, [currentTown]);

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

  const handleTownSelect = (town) => {
    setCurrentTown(town);
    setShowTownDropdown(false);
  };

  const getTownCode = (townName) => {
    const codeMap = {
      'Kuching': 'KCH',
      'Sibu': 'SIBU',
      'Bintulu': 'BTU',
      'Miri': 'MIRI',
      'Kota Samarahan': 'KS',
      'Sri Aman': 'SRI',
      'Kapit': 'KPT',
      'Serian': 'SER',
      'Betong': 'BET',
      'Mukah': 'MKH',
      'Sarikei': 'SRK',
      'Limbang': 'LIM',
    };
    return codeMap[townName] || townName.substring(0, 3).toUpperCase();
  };

  const getWeatherIcon = (weather) => {
    if (!weather) return '🌤️';
    const weatherMain = weather[0]?.main.toLowerCase();
    
    switch(weatherMain) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'drizzle':
        return '🌦️';
      case 'thunderstorm':
        return '⛈️';
      case 'snow':
        return '❄️';
      case 'mist':
      case 'smoke':
      case 'haze':
      case 'dust':
      case 'fog':
      case 'sand':
      case 'ash':
      case 'squall':
      case 'tornado':
        return '🌫️';
      default:
        return '🌤️';
    }
  };

  const styles = {
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#DFE2DE',
      padding: '15px 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      flexWrap: 'wrap', // Add this for mobile responsiveness
    },
    leftSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      alignItems: 'flex-start', // Align items to the left
    },
    centerSection: {
      display: 'flex',
      flexDirection: 'column', // Stack search and menu vertically
      alignItems: 'center',
      gap: '10px',
      flex: 1,
      margin: '0 20px', // Center the menu with some margin
    },
    searchContainer: {
      marginLeft: '0', // Remove left margin since we don't need it now
    },
    logo: {
      height: '40px',
      width: 'auto',
    },
    topRightSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      position: 'relative',
    },
    topRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    dateTime: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-end',
      fontSize: '12px',
      color: '#007AFF',
      gap: '10px',
      fontWeight: 'bold',
      backgroundColor: '#ECE6F0',
      padding: '5px 10px',
      borderRadius: '5px',
    },
    profileIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#ECE6F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    weatherSection: {
      marginTop: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px', // Increased gap for better spacing
      fontSize: '12px', // Increased font size
      color: '#333',
      backgroundColor: '#ECE6F0',
      padding: '5px 8px', // Increased padding
      borderRadius: '25px',
      position: 'relative',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    weatherInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px', // Space between icon and text
    },
    weatherIcon: {
      fontSize: '20px', // Larger icon size
      borderRadius: '50%',
    },
    townSelector: {
      border: 'none',
      background: 'none',
      fontSize: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: '#ECE6F0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '15px',
      zIndex: 1001,
      marginTop: '10px',
      width: 'auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '10px',
    },
    dropdownItem: {
      padding: '10px 8px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      borderRadius: '4px',
      color: '#007AFF',
      textAlign: 'center',
      '&:hover': {
        backgroundColor: '#007AFF',
      },
    },
    dropdownContainer: {
      position: 'relative',
      display: 'inline-block',
    },
    currentLocation: {
      gridColumn: '1 / -1',
      fontSize: '12px',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#333',
      paddingBottom: '10px',
      borderBottom: '2px solid #ccc',
    },
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.leftSection}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <div style={styles.searchContainer}>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <div style={styles.centerSection}>
        <MapViewMenu 
          onSelect={handleMenuSelect} 
          activeOption={activeMenuOption} 
        />
      </div>

      <div style={styles.topRightSection}>
        <div style={styles.topRow}>
          <div style={styles.dateTime}>
            <div>{formatDate(currentTime)}</div>
            <div>{formatTime(currentTime)}</div>
          </div>
          <div style={styles.profileIcon}>👤</div>
        </div>
        
        <div style={styles.weatherSection}>
          <div style={styles.dropdownContainer}>
            <button 
              style={styles.townSelector}
              onClick={() => setShowTownDropdown(!showTownDropdown)}
            >
              {getTownCode(currentTown)} ▼
            </button>
            
            {showTownDropdown && (
              <div style={styles.dropdown}>
                <div style={styles.currentLocation}>Current Location: {currentTown}</div>
                {towns.map((town) => (
                  <div 
                    key={town}
                    style={styles.dropdownItem}
                    onClick={() => handleTownSelect(town)}
                  >
                    {town}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={styles.weatherInfo}>
            <div>
              {weatherData?.weather?.[0]?.main}<br />
              {Math.round(weatherData?.main?.temp)}°C
            </div>
            <span style={styles.weatherIcon}>
              {getWeatherIcon(weatherData?.weather)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
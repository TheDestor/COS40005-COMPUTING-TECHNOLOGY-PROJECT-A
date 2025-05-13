import React, { useState, useEffect } from 'react';
import logo from '../assets/MalaysiaLogo.png';
import '../styles/Navbar.css';
import { townCoordinates } from '../townCoordinates';
import WeatherTownHandler from './WeatherTownHandler';

const API_KEY = '8be72b9eaf2d1c81e052f4fc2c58ad0c';

const WeatherDateTime = ({ currentTown, setCurrentTown }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [showTownDropdown, setShowTownDropdown] = useState(false);
  const [shouldZoom, setShouldZoom] = useState(false);

  const towns = Object.keys(townCoordinates);

  // ✅ Time updater
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 🔁 Updates every second
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);  

  // ✅ Weather fetch
  useEffect(() => {
    const fetchWeather = async () => {
      const coordinates = townCoordinates[currentTown];

      if (!coordinates) return;

      const { lat, lon } = coordinates;

      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
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
    setShouldZoom(true); // trigger zoom only on manual selection
  };
  

  const getTownCode = (townName) => {
    const codeMap = {
      'Kuching': 'KCH', 'Sibu': 'SIBU', 'Bintulu': 'BTU', 'Miri': 'MIRI',
      'Kota Samarahan': 'KS', 'Sri Aman': 'SRI', 'Kapit': 'KPT', 'Serian': 'SER',
      'Betong': 'BET', 'Mukah': 'MKH', 'Sarikei': 'SRK', 'Limbang': 'LIM'
    };
    return codeMap[townName] || townName.substring(0, 3).toUpperCase();
  };

  const getWeatherIcon = (weather) => {
    if (!weather) return '🌤️';
    const weatherMain = weather[0]?.main.toLowerCase();

    switch(weatherMain) {
      case 'clear': return '☀️';
      case 'clouds': return '☁️';
      case 'rain': return '🌧️';
      case 'drizzle': return '🌦️';
      case 'thunderstorm': return '⛈️';
      case 'snow': return '❄️';
      case 'mist':
      case 'smoke':
      case 'haze':
      case 'dust':
      case 'fog':
      case 'sand':
      case 'ash':
      case 'squall':
      case 'tornado': return '🌫️';
      default: return '🌤️';
    }
  };

  return (
    <>
    <WeatherTownHandler currentTown={currentTown} shouldZoom={shouldZoom} setShouldZoom={setShouldZoom} />
    <div className="date-time-weather-container">
      <div className="date-time">
        <img src={logo} alt="Logo" className="logo" />
        <div>{formatDate(currentTime)}</div>
        <div>{formatTime(currentTime)}</div>
      </div>
      <div className="weather-section">
        <div className="dropdown-container2">
          <button className="town-selector" onClick={() => setShowTownDropdown(!showTownDropdown)}>
            {getTownCode(currentTown)} <span className={`arrow ${showTownDropdown ? 'up' : 'down'}`}>{showTownDropdown ? '▲' : '▼'}</span>
          </button>
          {showTownDropdown && (
            <div className="dropdown2">
              <div className="current-location">Current Location: {currentTown}</div>
              <div className="dropdown-items-grid">
                {towns.map((town) => (
                  <div key={town} className="dropdown-item" onClick={() => handleTownSelect(town)}>
                    {town}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="weather-info">
          {weatherData ? (
            <div>
              {weatherData.weather?.[0]?.main}<br />
              {Math.round(weatherData.main?.temp)}°C
            </div>
          ) : (
            <div>Loading...</div>
          )}
          <span className="weather-icon">
            {getWeatherIcon(weatherData?.weather)}
          </span>
        </div>
      </div>
    </div>
    </>
  );
};

export default WeatherDateTime;

import React, { useState, useEffect } from 'react';
import logo from '../assets/MalaysiaLogo.png';
import '../styles/Navbar.css';

const API_KEY = '8be72b9eaf2d1c81e052f4fc2c58ad0c';

const WeatherDateTime = ({ currentTown, setCurrentTown }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [showTownDropdown, setShowTownDropdown] = useState(false);

  const towns = [
    'Kuching', 'Sibu', 'Mukah', 'Serian', 'Bintulu', 'Betong',
    'Kota Samarahan', 'Miri', 'Kapit', 'Sri Aman', 'Sarikei', 'Limbang'
  ];

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
            <div className="dropdown">
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
          <div>
            {weatherData?.weather?.[0]?.main}<br />
            {Math.round(weatherData?.main?.temp)}°C
          </div>
          <span className="weather-icon">
            {getWeatherIcon(weatherData?.weather)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherDateTime;
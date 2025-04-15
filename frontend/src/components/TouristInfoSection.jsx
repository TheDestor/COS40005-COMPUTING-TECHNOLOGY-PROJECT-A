import React, { useEffect, useState } from 'react';
import '../styles/TouristInfoSection.css';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import kuchingImage from '../assets/Kuching.png';
import sibuImage from '../assets/Sibu.png'; // Add these image imports
import miriImage from '../assets/Miri.png';
import bintuluImage from '../assets/Bintulu.png';
import { Link } from 'react-router-dom';

const TouristInfoSection = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [containerStyle, setContainerStyle] = useState({ top: '60px' });

  useEffect(() => {
    const updatePosition = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        setContainerStyle({ top: `${navbar.offsetHeight}px` });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const data = [
    { 
      id: 1, 
      name: 'Kuching', 
      description: 'The capital city of Sarawak with rich cultural heritage.', 
      image: kuchingImage 
    },
    { 
      id: 2, 
      name: 'Sibu', 
      description: 'Bustling town along the Rajang River.',
      image: sibuImage 
    },
    { 
      id: 3, 
      name: 'Miri', 
      description: 'Birthplace of Malaysia\'s petroleum industry.',
      image: miriImage 
    },
    { 
      id: 4, 
      name: 'Bintulu', 
      description: 'Industrial town with beautiful beaches.',
      image: bintuluImage 
    }
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={`tourist-info-container ${isCollapsed ? 'collapsed' : ''}`}
      style={containerStyle}
    >
      <div className="collapse-toggle" onClick={toggleCollapse}>
        {isCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
      </div>
      
      <div className="info-content">
        <div className="discover-more-container">
          <span className="discover-more">Discover more?</span>
          <Link to="/major-town" className="show-more">Show more</Link>
        </div>

        <div className="items-list">
          {data.map(item => (
            <div key={item.id} className="info-item">
              <div className="item-image">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="item-text">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <div className="view-more-container">
                <button className="view-more-btn">View more</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TouristInfoSection;
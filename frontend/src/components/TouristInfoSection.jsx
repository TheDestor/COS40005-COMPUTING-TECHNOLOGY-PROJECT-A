import React, { useEffect, useState } from 'react';
import '../styles/TouristInfoSection.css';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import kuchingImage from '../assets/Kuching.png';

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
      description: 'Bustling town along the Rajang River.' 
    },
    { 
      id: 3, 
      name: 'Miri', 
      description: 'Birthplace of Malaysia\'s petroleum industry.' 
    },
    { 
      id: 4, 
      name: 'Bintulu', 
      description: 'Industrial town with beautiful beaches.' 
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
        <div className="discover-more">
          Discover more? <span className="show-more">Show more</span>
        </div>

        <div className="items-list">
          {data.map(item => (
            <div key={item.id} className="info-item">
              {item.image && (
                <div className="item-image">
                  <img src={item.image} alt={item.name} />
                </div>
              )}
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
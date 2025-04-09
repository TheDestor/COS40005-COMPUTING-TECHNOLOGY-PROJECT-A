import React, { useState, useEffect } from 'react';
import '../styles/TouristInfoSection.css';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';

const TouristInfoSection = () => {
  const [activeCategory, setActiveCategory] = useState('cities');
  const [expandedItem, setExpandedItem] = useState(null);
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

  // Enhanced data structure with more categories
  const data = {
    cities: [
      { id: 1, name: 'Kuching', description: 'The capital city of Sarawak with rich cultural heritage.' },
      { id: 2, name: 'Sibu', description: 'Bustling town along the Rajang River.' },
      { id: 3, name: 'Miri', description: 'Birthplace of Malaysia\'s petroleum industry.' },
      { id: 4, name: 'Bintulu', description: 'Industrial town with beautiful beaches.' }
    ],
    museums: [
      { id: 1, name: 'Sarawak Museum', description: 'Oldest museum in Borneo showcasing indigenous cultures.' },
      { id: 2, name: 'Chinese History Museum', description: 'History of Chinese immigrants in Sarawak.' },
      { id: 3, name: 'Textile Museum', description: 'Traditional Sarawakian textiles and weaving.' }
    ],
    parks: [
      { id: 1, name: 'Bako National Park', description: 'Diverse wildlife and stunning rock formations.' },
      { id: 2, name: 'Gunung Mulu National Park', description: 'UNESCO site famous for its caves.' }
    ],
    food: [
      { id: 1, name: 'Kolo Mee', description: 'Signature Sarawakian noodle dish.' },
      { id: 2, name: 'Laksa Sarawak', description: 'Unique coconut milk-based noodle soup.' }
    ]
  };

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Category configuration
  const categories = [
    { id: 'cities', name: 'Major Cities' },
    { id: 'museums', name: 'Museums' },
    { id: 'parks', name: 'National Parks' },
    { id: 'food', name: 'Local Food' }
  ];

  return (
    <div 
      className={`tourist-info-container ${isCollapsed ? 'collapsed' : ''}`}
      style={containerStyle}
    >
      <div className="collapse-toggle" onClick={toggleCollapse}>
        {isCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
      </div>
      
      <div className="info-content">
        <h2>Explore Sarawak</h2>
        
        {/* Category selector */}
        <div className="category-selector">
          {categories.map(category => (
            <button
              key={category.id}
              className={activeCategory === category.id ? 'active' : ''}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Dynamic content based on selected category */}
        <div className="items-list">
          {data[activeCategory]?.map(item => (
            <div key={item.id} className="info-item">
              <div 
                className="item-header"
                onClick={() => toggleExpand(item.id)}
              >
                <h3>{item.name}</h3>
                <span className="toggle-icon">
                  {expandedItem === item.id ? '−' : '+'}
                </span>
              </div>
              {expandedItem === item.id && (
                <div className="item-details">
                  <p>{item.description}</p>
                  <button className="view-more-btn">View more</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TouristInfoSection;
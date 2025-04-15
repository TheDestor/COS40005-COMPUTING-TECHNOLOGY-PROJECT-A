// ShowAllCategoryPage.jsx
import React, { useState } from 'react';
import Navbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import '../styles/MajorTownPage.css';
import metaverseIMG from '../assets/MetaverseTrails.jpg';

const ShowAllCategoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  const places = [
    { name: "Kuching", desc: "This is Kuching." },
    { name: "Kota Samarahan", desc: "This is Kota Samarahan." },
    { name: "Serian", desc: "This is Serian." },
    { name: "Sri Aman", desc: "This is Sri Aman." },
    { name: "Betong", desc: "This is Betong." },
    { name: "Sarikei", desc: "This is Sarikei." },
    { name: "Sibu", desc: "This is Sibu." },
    { name: "Kapit", desc: "This is Kapit." },
    { name: "Mukah", desc: "This is Mukah." },
    { name: "Bintulu", desc: "This is Bintulu." },
    { name: "Miri", desc: "This is Miri." },
    { name: "Limbang", desc: "This is Limbang." }
  ];

  const filteredPlaces = places
    .filter(place =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'desc') return b.name.localeCompare(a.name);
      return 0;
    });

  const handleSortToggle = () => {
    setSortOrder(prev => {
      if (prev === 'default') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'default';
    });
  };

  return (
    <div className="category-page">
      <Navbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>Metaverse Trails</h1>
          <p>Navigating Sarawak Tourism Destination Sustainably</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search Major Town..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`sort-btn ${sortOrder !== 'default' ? 'active' : ''}`}
            onClick={handleSortToggle}
          >
            <span>≡</span>
            {sortOrder === 'asc' && 'A-Z'}
            {sortOrder === 'desc' && 'Z-A'}
            {sortOrder === 'default' && 'Sort'}
          </button>
        </div>
      </div>

      <div className="cards-section">
        {filteredPlaces.map((place, index) => (
          <div
            className={`card ${index % 2 === 0 ? 'tall-card' : 'short-card'}`}
            key={index}
          >
            <img src={metaverseIMG} alt={place.name} />
            <div className="card-content">
              <h3>{place.name}</h3>
              <div className="rating">⭐⭐⭐⭐⭐</div>
              <p>{place.desc}</p>
              <button className="explore-btn">Explore</button>
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default ShowAllCategoryPage;

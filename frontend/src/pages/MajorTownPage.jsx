import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/MajorTownPage.css';
import kuchingImg from '../assets/Kuching.png';
import kotaSamarahanImg from '../assets/KotaSamarahan.png';
import serianImg from '../assets/Serian.png';
import sriAmanImg from '../assets/SriAman.png';
import betongImg from '../assets/Betong.png';
import sarikeiImg from '../assets/Sarikei.png';
import sibuImg from '../assets/Sibu.png';
import kapitImg from '../assets/Kapit.png';
import mukahImg from '../assets/Mukah.png';
import bintuluImg from '../assets/Bintulu.png';
import miriImg from '../assets/Miri.png';
import limbangImg from '../assets/Limbang.png';

const MajorTownPage = () => {
  const [showLogin, setShowLogin] = useState(false);
    
  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  const handleSortToggle = () => {
    setSortOrder(prevOrder => {
      if (prevOrder === 'default') return 'asc';
      if (prevOrder === 'asc') return 'desc';
      return 'default';
    });
  };

  const highlightMatch = (name) => {
    const index = name.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (index === -1 || !searchQuery) return name;
  
    return (
      <>
        {name.substring(0, index)}
        <span style={{ backgroundColor: '#ffe066' }}>
          {name.substring(index, index + searchQuery.length)}
        </span>
        {name.substring(index + searchQuery.length)}
      </>
    );
  };  

  const places = [
    { name: "Kuching", slug: "kuching", desc: "Sarawak’s capital city, known for its culture, food, and waterfront.", image: kuchingImg },
    { name: "Kota Samarahan", slug: "kota-samarahan", desc: "A growing education and medical hub near Kuching.", image: kotaSamarahanImg },
    { name: "Serian", slug: "serian", desc: "Famous for its markets, hills, and Bidayuh culture.", image: serianImg },
    { name: "Sri Aman", slug: "sri-aman", desc: "Known for the Tidal Bore Festival and Batang Lupar River.", image: sriAmanImg },
    { name: "Betong", slug: "betong", desc: "A peaceful rural town with rich Iban heritage.", image: betongImg },
    { name: "Sarikei", slug: "sarikei", desc: "Renowned for its agriculture, especially pineapples and pepper.", image: sarikeiImg },
    { name: "Sibu", slug: "sibu", desc: "A bustling riverine town rich in Chinese and Iban culture.", image: sibuImg },
    { name: "Kapit", slug: "kapit", desc: "Located upriver on the Rajang, known for longhouses and rapids.", image: kapitImg },
    { name: "Mukah", slug: "mukah", desc: "Cultural heartland of the Melanau people by the sea.", image: mukahImg },
    { name: "Bintulu", slug: "bintulu", desc: "An industrial town famous for natural gas and beaches.", image: bintuluImg },
    { name: "Miri", slug: "miri", desc: "A resort city and gateway to national parks and caves.", image: miriImg },
    { name: "Limbang", slug: "limbang", desc: "Border town between Brunei, rich in culture and nature.", image: limbangImg }
  ];

  const filteredPlaces = [...places]
    .filter(place =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'desc') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <div className="category-page">
      <MenuNavbar onLoginClick={handleLoginClick} />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>Metaverse Trails 2.0</h1>
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
            <span aria-label="Sort by name">≡</span>
            {sortOrder === 'asc' && 'A-Z'}
            {sortOrder === 'desc' && 'Z-A'}
            {sortOrder === 'default' && 'Sort'}
          </button>
        </div>
      </div>

      <div className="cards-section">
        {filteredPlaces.map((place, index) => {
          const lineNumber = Math.floor(index / 4);
          const positionInLine = index % 4;
          const isTall = lineNumber % 2 === 0 
            ? positionInLine % 2 === 0 
            : positionInLine % 2 !== 0;

          return (
            <div 
              className="card-wrapper" 
              key={index}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`card ${isTall ? 'tall-card' : 'short-card'}`}>
                <img src={place.image} alt={place.name} />
                <div className="card-content">
                <h3>{highlightMatch(place.name)}</h3>
                  <div className="rating">⭐⭐⭐⭐⭐</div>
                  <div className="desc-scroll">
                    <p>{place.desc}</p>
                  </div>
                  <div className="button-container">
                    <Link to={`/details/${place.slug}`} className="explore-btn">
                      Explore
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {showLogin && <LoginPage onClose={closeLogin} />}

      <Footer />
    </div>
  );
};

export default MajorTownPage;

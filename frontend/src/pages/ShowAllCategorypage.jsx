import React from 'react';
import Navbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import '../styles/ShowAllCategoryPage.css';
import metaverseIMG from '../assets/MetaverseTrails.jpg';

const ShowAllCategoryPage = () => {
  const places = Array(12).fill({
    name: "Sibu",
    rating: 4.9,
    reviews: 321,
    desc: "This is Sibu.",
    image: metaverseIMG
  });

  return (
    <div className="category-page">
      <Navbar />

      <div className="hero-banner">
        <div className="hero-content">
          <h1>Metaverse Trails</h1>
          <p>Explore the most visited places and metaverse experiences.</p>
        </div>
      </div>

      <div className="category-header">
        <div className="category-filters">
          <span>🔥 Popular</span>
          <span>🧭 Adventure</span>
          <span>📍 Nearby</span>
        </div>
      </div>

      <div className="cards-section">
        {places.map((place, index) => (
          <div className="card" key={index}>
            <img src={place.image} alt={place.name} />
            <div className="card-info">
              <h3>{place.name}</h3>
              <div className="rating">
                ⭐ {place.rating} <span>({place.reviews})</span>
              </div>
              <p>{place.desc}</p>
              <button>Explore</button>
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default ShowAllCategoryPage;

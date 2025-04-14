import React, { useState } from 'react';
import BookmarkDetail from './BookmarkDetail'; // New component
import '../styles/Bookmarkpage.css';
import { FaRegBookmark, FaRegFlag, FaRegStar } from 'react-icons/fa';
import { MdOutlineFavoriteBorder } from 'react-icons/md';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import petrosainsImg from '../assets/petrosains.jpg';
import borneoImg from '../assets/borneo.jpg';
import raneeImg from '../assets/ranee.jpg';

const BookmarkPage = () => {
  const [selectedSection, setSelectedSection] = useState(null);

  const sections = [
    {
      key: "want-to-go",
      title: "Want to go",
      icon: FaRegFlag,
      count: 3,
      places: [
        {
          title: "Petrosains Playsmart Kuching",
          rating: 4.7,
          reviews: 237,
          category: "Science museum",
          image: petrosainsImg
        },
        {
          title: "Borneo Cultural Museum",
          rating: 4.7,
          reviews: 237,
          category: "Museum",
          image: borneoImg
        },
        {
          title: "The Ranee Museum",
          rating: 4.7,
          reviews: 237,
          category: "Museum",
          image: raneeImg
        }
      ]
    },
    {
      key: "favourites",
      title: "Favourites",
      icon: MdOutlineFavoriteBorder,
      count: 3,
      places: []
    },
    {
      key: "starred-places",
      title: "Starred places",
      icon: FaRegStar,
      count: 2,
      places: []
    }
  ];

  if (selectedSection !== null) {
    const section = sections[selectedSection];
    return (
      <BookmarkDetail
        title={section.title}
        places={section.places}
        onClose={() => setSelectedSection(null)}
      />
    );
  }

  const HeaderWithLogo = ({ title, count, Icon }) => (
    <div className="header-with-logo">
      <Icon className="header-icon" />
      <div>
        <span className="header-text">{title}</span>
        <span className="count">({count} places)</span>
      </div>
    </div>
  );

  return (
    <div className="bookmark-container">
      <div className="main-header">
        <div className="main-title">
          <FaRegBookmark className="main-icon" />
          My Bookmark
        </div>
        <span className="close-icon">✕</span>
      </div>

      <hr className="divider" />

      <div className="sections-wrapper">
        {sections.map((section, index) => (
          <div
            key={index}
            className="section-card"
            onClick={() => setSelectedSection(index)}
          >
            <HeaderWithLogo 
              title={section.title} 
              count={section.count} 
              Icon={section.icon} 
            />
            <HiOutlineDotsVertical className="dots" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarkPage;

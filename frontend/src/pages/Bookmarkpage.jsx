import React, { useState } from 'react';
import BookmarkDetail from './BookmarkDetail';
import '../styles/Bookmarkpage.css';
import { FaRegBookmark, FaRegFlag, FaRegStar } from 'react-icons/fa';
import { MdOutlineFavoriteBorder } from 'react-icons/md';
import { RxCross1 } from 'react-icons/rx';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import petrosainsImg from '../assets/petrosains.jpg';
import borneoImg from '../assets/borneo.jpg';
import raneeImg from '../assets/ranee.jpg';

const BookmarkPage = ({ onClose }) => {
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
      <div className="header-info">
        <div className="header-text">{title}</div>
        <div className="count">{count} place{count > 1 ? 's' : ''}</div>
      </div>
    </div>
  );

  return (
    <div className="bookmark-panel">
      <div className="bookmark-header">
        <div className="bookmark-title">
          <FaRegBookmark className="bookmark-icon" />
          My Bookmark
        </div>
        <span className="bookmark-close" onClick={onClose}><RxCross1 /></span>
      </div>

      <div className="bookmark-sections">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bookmark-section-card"
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

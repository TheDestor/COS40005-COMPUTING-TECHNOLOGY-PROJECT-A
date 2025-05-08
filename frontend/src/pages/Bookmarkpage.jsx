import React, { useState, useEffect } from 'react';
// import BookmarkDetail from './BookmarkDetail';
import '../styles/Bookmarkpage.css';
import { FaRegBookmark, FaRegFlag, FaRegStar, FaArrowLeft } from 'react-icons/fa';
import { MdOutlineFavoriteBorder } from 'react-icons/md';
import petrosainsImg from '../assets/petrosains.jpg';
import borneoImg from '../assets/borneo.jpg';
import raneeImg from '../assets/ranee.jpg';
import LoginPage from './Loginpage';
import { useAuth } from '../context/AuthProvider.jsx'; // adjust if needed
import { UseBookmarkContext } from '../context/BookmarkProvider.jsx';


const BookmarkPage = ({ isOpen, onClose, showLoginOverlay }) => {
  const [selectedSection, setSelectedSection] = useState(null);
  const auth = useAuth();
  const { bookmarks } = UseBookmarkContext();

  useEffect(() => {
    if (isOpen && (!auth || !auth.user)) {
      if (showLoginOverlay) showLoginOverlay(); // show the login overlay
      if (onClose) onClose(); // close the bookmark panel
    }
  }, [isOpen, auth, showLoginOverlay, onClose]);

  // const sections = [
  //   {
  //     key: "want-to-go",
  //     title: "Want to go",
  //     icon: FaRegFlag,
  //     count: 3,
  //     places: [
  //       {
  //         title: "Petrosains Playsmart Kuching",
  //         rating: 4.7,
  //         reviews: 237,
  //         category: "Science museum",
  //         image: petrosainsImg
  //       },
  //       {
  //         title: "Borneo Cultural Museum",
  //         rating: 4.7,
  //         reviews: 237,
  //         category: "Museum",
  //         image: borneoImg
  //       },
  //       {
  //         title: "The Ranee Museum",
  //         rating: 4.7,
  //         reviews: 237,
  //         category: "Museum",
  //         image: raneeImg
  //       }
  //     ]
  //   },
  //   {
  //     key: "favourites",
  //     title: "Favourites",
  //     icon: MdOutlineFavoriteBorder,
  //     count: 3,
  //     places: []
  //   },
  //   {
  //     key: "starred-places",
  //     title: "Starred places",
  //     icon: FaRegStar,
  //     count: 2,
  //     places: []
  //   }
  // ];

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
    <div className={`bookmark-panel ${isOpen ? "hidden" : ""}`}>
          <div className="bookmark-header">
            <div className="bookmark-title">
              <FaRegBookmark className="bookmark-icon" />
              My Bookmarks
            </div>
            <span className="bookmark-close" onClick={onClose}><FaArrowLeft /></span>
          </div>

      <div className="bookmark-sections">
        {bookmarks.map((bookmark) => (
          <div key={bookmark.name}>
            <div>
              <h4>{bookmark.name}</h4>
            </div>
          </div>
        ))}
            {/* {sections.map((section, index) => (
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
              </div>
            ))} */}
          </div>
    </div>
  );
};

export default BookmarkPage;

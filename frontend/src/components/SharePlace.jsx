import React from "react";
import ReactDOM from "react-dom";
import "../styles/SharePlace.css";
import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa";

const SharePlace = ({ visible, onClose, location }) => {
  if (!visible || !location) return null;

  const { name, image, description, latitude, longitude, url } = location;

  return ReactDOM.createPortal(
    <div className="share-container">
      <div className="share-overlay" onClick={onClose}></div>
      <div className="share-box">
        <div className="share-header">
          <h3>Share</h3>
          <button className="close-btn99" onClick={onClose}>×</button>
        </div>

        <div className="share-tabs">
          <span className="active-tab5">Send a link</span>
          <span className="inactive-tab5">Embed a map</span>
        </div>

        <div className="share-preview">
          <img src={image} alt={name} className="share-image" />
          <div className="share-address">
            <strong>{name}</strong><br />
            {description}<br />
            Lat: {latitude}, Lng: {longitude}
          </div>
        </div>

        <div className="share-link-row">
          <input
            className="share-link-input"
            value={url}
            readOnly
          />
          <button
            className="copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(url);
              alert("Link copied!");
            }}
          >
            COPY LINK
          </button>
        </div>

        <div className="share-social-icons">
          <FaFacebookF className="social-icon fb" />
          <FaInstagram className="social-icon ig" />
          <FaXTwitter className="social-icon x" />
          <FaTelegram className="social-icon tg" />
        </div>
      </div>
    </div>,
    document.body
  );
};


export default SharePlace;

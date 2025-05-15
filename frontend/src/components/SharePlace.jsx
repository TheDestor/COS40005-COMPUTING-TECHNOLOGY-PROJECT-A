import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../styles/SharePlace.css";
import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa";
import defaultImage from "../assets/default.png";

const SharePlace = ({ visible, onClose, location }) => {
  const [activeTab, setActiveTab] = useState("link");

  if (!visible || !location) return null;

  const { name, image, description, latitude, longitude, url } = location;

  // SAFE embed URL without API key
  const safeEmbedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`;

  return ReactDOM.createPortal(
    <div className="share-container">
      <div className="share-overlay" onClick={onClose}></div>
      <div className="share-box">
        <div className="share-header">
          <h3>Share</h3>
          <button className="close-btn99" onClick={onClose}>×</button>
        </div>

        <div className="share-tabs">
          <span
            className={activeTab === "link" ? "active-tab5" : "inactive-tab5"}
            onClick={() => setActiveTab("link")}
          >
            Send a link
          </span>
          <span
            className={activeTab === "embed" ? "active-tab5" : "inactive-tab5"}
            onClick={() => setActiveTab("embed")}
          >
            Embed a map
          </span>
        </div>

        {activeTab === "link" ? (
          <div className="share-preview">
            <img
              src={image || defaultImage}
              alt={name}
              className="share-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultImage;
              }}
            />
            <div className="share-address">
              <strong>{name}</strong><br />
              {description}<br />
              Lat: {latitude}, Lng: {longitude}
            </div>
          </div>
        ) : (
          <div className="map-embed">
            <iframe
              width="100%"
              height="250"
              frameBorder="0"
              style={{ border: 0, borderRadius: "8px" }}
              src={safeEmbedUrl}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Embedded Map"
            ></iframe>
            <div className="embed-code-section">
              <label>Embed HTML:</label>
              <textarea
                className="embed-code"
                value={`<iframe width="600" height="450" frameborder="0" style="border:0" src="https://www.google.com/maps?q=${latitude},${longitude}&output=embed" allowfullscreen></iframe>`}
                readOnly
              />
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `<iframe width="600" height="450" frameborder="0" style="border:0" src="https://www.google.com/maps?q=${latitude},${longitude}&output=embed" allowfullscreen></iframe>`
                  );
                  alert("Embed code copied!");
                }}
              >
                COPY EMBED CODE
              </button>
            </div>
          </div>
        )}

        {activeTab === "link" && (
          <div className="share-link-row">
            <input className="share-link-input" value={url} readOnly />
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
        )}

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

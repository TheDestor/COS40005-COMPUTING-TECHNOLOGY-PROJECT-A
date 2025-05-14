import React from "react";
import "../styles/SharePlace.css";
import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa";

const SharePlace = () => {
  return (
    <div className="share-container">
      <div className="share-box">
        <div className="share-header">
          <h3>Share</h3>
          <button className="close-btn99">×</button>
        </div>

        <div className="share-tabs">
          <span className="active-tab5">Send a link</span>
          <span className="inactive-tab5">Embed a map</span>
        </div>

        <div className="share-preview">
          <img
            src="https://via.placeholder.com/300x150"
            alt="Place"
            className="share-image"
          />
          <div className="share-address">
            Blablablabalbalbalbal  
            <br />
            93400 Bau, Sarawak
          </div>
        </div>

        <div className="share-link-row">
          <input
            className="share-link-input"
            value="https://fiafkaenfaiofnaiof.fefafwaf.fwafa"
            readOnly
          />
          <button className="copy-btn">COPY LINK</button>
        </div>

        <div className="share-social-icons">
          <FaFacebookF className="social-icon fb" />
          <FaInstagram className="social-icon ig" />
          <FaXTwitter className="social-icon x" />
          <FaTelegram className="social-icon tg" />
        </div>
      </div>
    </div>
  );
};

export default SharePlace;

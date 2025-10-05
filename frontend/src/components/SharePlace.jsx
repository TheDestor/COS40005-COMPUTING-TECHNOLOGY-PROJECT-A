import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../styles/SharePlace.css";
import { FaFacebookF, FaInstagram, FaXTwitter, FaWhatsapp } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa";
import { toast } from "sonner";
import defaultImage from "../assets/default.png";

export default function SharePlace({ visible, onClose, location }) {
  const [activeTab, setActiveTab] = useState("link");

  if (!visible || !location) return null;

  const { name, image, description, latitude, longitude, url } = location;

  // SAFE embed URL without API key
  const safeEmbedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`;

  // Share message text
  const shareText = `Check out ${name} on Sarawak Tourism!\n${description || ''}\n${url}`;
  const encodedShareText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);
  const encodedName = encodeURIComponent(name);

  // Social media share functions
  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedName}&url=${encodedUrl}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodedShareText}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareOnTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedName}`;
    window.open(telegramUrl, '_blank');
  };

  const shareOnInstagram = () => {
    // Instagram doesn't support web sharing, so copy link for user to paste
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success("Link copied! Paste it in Instagram DM or Story");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  // Copy link function with toast notification
  const copyLink = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  // Copy embed code function
  const copyEmbedCode = () => {
    const embedCode = `<iframe width="600" height="450" frameborder="0" style="border:0" src="https://www.google.com/maps?q=${latitude},${longitude}&output=embed" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedCode)
      .then(() => {
        toast.success("Embed code copied!");
      })
      .catch(() => {
        toast.error("Failed to copy embed code");
      });
  };

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
                onClick={copyEmbedCode}
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
              onClick={copyLink}
            >
              COPY LINK
            </button>
          </div>
        )}

        <div className="share-social-icons">
          <FaFacebookF 
            className="social-icon fb" 
            onClick={shareOnFacebook}
            title="Share on Facebook"
          />
          <FaInstagram 
            className="social-icon ig" 
            onClick={shareOnInstagram}
            title="Copy link for Instagram"
          />
          <FaWhatsapp 
            className="social-icon wa" 
            onClick={shareOnWhatsApp}
            title="Share on WhatsApp"
          />
          <FaXTwitter 
            className="social-icon x" 
            onClick={shareOnTwitter}
            title="Share on X (Twitter)"
          />
          <FaTelegram 
            className="social-icon tg" 
            onClick={shareOnTelegram}
            title="Share on Telegram"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
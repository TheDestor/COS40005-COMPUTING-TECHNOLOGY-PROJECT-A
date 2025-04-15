import React, { useState } from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/Footer.css';
import HornbillImage from '../assets/Hornbill.gif'; // Adjust path accordingly
import { FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!email) {
      toast.error("Please enter a valid email!");
    } else {
      toast.success("Thanks for subscribing!");
      setEmail("");
    }
  };

  return (
    <footer className="footer">
      {/* Top: Newsletter */}
      <div className="footer-main">
        <div className="newsletter-heading">
            <h3>
            Join our newsletter to keep<br />up to date with us!
            </h3>
        </div>
        <div className="newsletter">
            <div className="email-input2">
            <div className="email-icon-wrapper">
                <FaEnvelope className="email-icon" />
                <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <button onClick={handleSubscribe}>
                Subscribe <FaArrowRight />
            </button>
            </div>
        </div>
      </div>

      {/* Middle: Hornbill + Social Icons + Links */}
      <div className="footer-middle">
        {/* Hornbill + Social */}
        <div className="hornbill-social">
          <img src={HornbillImage} alt="Hornbill" className="hornbill-img" />
          <div className="icons">
            <FaInstagram />
            <FaFacebookF />
            <FaTwitter />
          </div>
        </div>

        {/* Footer Links */}
        <div className="footer-links">
          <div className="links-column">
            <h4>Explore</h4>
            <ul>
              <li>Destinations</li>
              <li>Popular Attractions</li>
              <li>Travel Guides</li>
              <li>Recommended Tours</li>
            </ul>
          </div>
          <div className="links-column">
            <h4>Be a part of us</h4>
            <ul>
              <li>Testimonials</li>
              <li>Campaigns</li>
              <li>Community</li>
            </ul>
          </div>
          <div className="links-column">
            <h4>Business & Partnerships</h4>
            <ul>
              <li>List your business</li>
              <li>Partner with us</li>
              <li>Advertising opportunities</li>
            </ul>
          </div>
          <div className="links-column">
            <h4>Help & Support</h4>
            <ul>
              <li>FAQ</li>
              <li>Customer support</li>
              <li>How it works</li>
              <li>Report an issue</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="copyright">
          ©2025 Metaverse Trail 2.0 | Sarawak Tourism
        </div>
        <div className="legal-links">
          <span>Terms of service</span>
          <span>Privacy policy</span>
          <span>Cookies</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

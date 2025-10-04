import React, { useState } from 'react';
import { FaFacebookF, FaInstagram, FaPinterest } from 'react-icons/fa';
import { FaXTwitter, FaYoutube, FaTiktok } from 'react-icons/fa6';
import { toast } from 'sonner';
import ky from 'ky';
import '../styles/Footer.css';
import LogoImage from '../assets/logo.png';
import LegalModal from './LegalModal';

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [openLegal, setOpenLegal] = useState(null); // 'terms', 'privacy', 'cookies', or null

  const handleSubscribe = async () => {
    // Validation
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await ky.post(
        "/api/user/newsletter/subscribe",
        {
          json: { email: email }
        }
      ).json();

      const { success, message } = response;

      if (success) {
        toast.success(message || "You are subscribed to our newsletter!");
        setEmail('');
      } else {
        toast.error(message || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        try {
          const errorJson = await error.response.json();
          toast.error(errorJson.message || "Failed to subscribe. Please try again.");
        } catch {
          toast.error("Failed to subscribe. Please try again.");
        }
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubscribe();
    }
  };

  return (
    <footer className="footer">
      {/* Top: Newsletter */}
      <div className="footer-main">
        <div className="footer-content">
          <p>
            <svg className="newsletter-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Join our newsletter to keep up to date with us!
          </p>
          <div className="newsletter">
            <div className="input-wrapper">
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubscribing}
              />
            </div>
            <button onClick={handleSubscribe} disabled={isSubscribing}>
              <svg className="button-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Hornbill + Social Icons + Links */}
      <div className="footer-middle">
        {/* Hornbill + Social */}
        <div className="hornbill-social">
          <img src={LogoImage} alt="Sarawak Tourism" className="hornbill-img" />
          <div className="icons">
            <a href="https://www.instagram.com/sarawaktravel/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://www.facebook.com/visitsarawak" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
            <a href="https://x.com/SarawakTravel" target="_blank" rel="noopener noreferrer"><FaXTwitter /></a>
            <a href="https://www.youtube.com/@SarawakTourismBoard" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://www.tiktok.com/@sarawaktravel" target="_blank" rel="noopener noreferrer"><FaTiktok /></a>
            <a href="https://www.pinterest.com/sarawaktravel/" target="_blank" rel="noopener noreferrer"><FaPinterest /></a>
          </div>
        </div>

        {/* Footer Links */}
        <div className="footer-links">
          <div className="links-column">
            <h4>Explore</h4>
            <ul>
              <li><a href="/">Map</a></li>
              <li><a href="/events">Events</a></li>
              <li><a href="/attractions">Popular Attractions</a></li>
            </ul>
          </div>
          <div className="links-column">
            <h4>Business</h4>
            <ul>
              <li><a href="/business-submission">Submit Business</a></li>
              <li><a href="/manage-business">Manage Business</a></li>
            </ul>
          </div>
          <div className="links-column">
            <h4>Community</h4>
            <ul>
              <li><a href="https://www.sarawaktourism.com/web/stories/story-view/sarawak-the-mystical-gateway-to-borneo" target="_blank" rel="noopener noreferrer">Campaigns</a></li>
              <li><a href="https://www.sarawaktourism.com/web/stories/stories-list/" target="_blank" rel="noopener noreferrer">Community</a></li>
            </ul>
          </div>
          <div className="links-column">
            <h4>Help & Support</h4>
            <ul>
              <li><a href="/settings">FAQ</a></li>
              <li><a href="/contact-us">Contact Us</a></li>
              <li><a href="/contact-us">Report an Issue</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="copyright">
          ©{new Date().getFullYear()} Metaverse Trails 2.0 | Sarawak Tourism
        </div>
        <div className="legal-links">
          <span onClick={() => setOpenLegal('terms')} style={{cursor:'pointer'}}>Terms of service</span>
          <span onClick={() => setOpenLegal('privacy')} style={{cursor:'pointer'}}>Privacy policy</span>
          <span onClick={() => setOpenLegal('cookies')} style={{cursor:'pointer'}}>Cookies</span>
        </div>
      </div>

      {/* Legal Modals */}
      <LegalModal
        isOpen={openLegal === 'terms'}
        onClose={() => setOpenLegal(null)}
        title="Terms of Service"
      >
        <p>
          By using this website, you agree to comply with all applicable laws and regulations. You may not use the site for any unlawful or prohibited purpose. All content is provided for informational purposes only and may be updated or changed at any time.
        </p>
        <p>
          The Sarawak Tourism Map and Metaverse Trails 2.0 reserve the right to suspend or terminate access for users who violate these terms.
        </p>
      </LegalModal>
      <LegalModal
        isOpen={openLegal === 'privacy'}
        onClose={() => setOpenLegal(null)}
        title="Privacy Policy"
      >
        <p>
          We respect your privacy. Any personal information collected (such as email for newsletter) will be used solely for communication purposes and will not be shared with third parties without your consent. Cookies may be used to enhance your experience.
        </p>
        <p>
          For more details, please contact our support team.
        </p>
      </LegalModal>
      <LegalModal
        isOpen={openLegal === 'cookies'}
        onClose={() => setOpenLegal(null)}
        title="Cookies Policy"
      >
        <p>
          This website uses cookies to improve your browsing experience and to analyze site traffic. By continuing to use this site, you consent to our use of cookies. You can disable cookies in your browser settings at any time.
        </p>
      </LegalModal>
    </footer>
  );
};

export default Footer;
// ContactUs.jsx
import React, { useState } from "react";
import "../styles/ContactUs.css";
import ky from "ky";
import { toast } from "sonner";
import MenuNavBar from "../components/MenuNavbar";
import LoginPage from './Loginpage.jsx';
import AIChatbot from '../components/AiChatbot.jsx';

export default function ContactUs() {
  // States
  const [activeButton, setActiveButton] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: ''
  });
  
  const { name, email, topic, message } = formData;
  const [showLogin, setShowLogin] = useState(false);
    
  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  // Category button click handler
  const handleButtonClick = (buttonName) => {
    setActiveButton(activeButton === buttonName ? null : buttonName);
  };

  // Handle the form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toast success
  const handleSuccess = (msg) => {
    toast.success(msg);
  };
  
  // Toast error
  const handleError = (msg) => {
    toast.error(msg);
  };

  // Submit the form using backend api
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      handleError("Please enter your name");
      return;
    }
    if (!email.trim()) {
      handleError("Please enter your email address");
      return;
    }
    if (!activeButton) {
      handleError("Please choose a category");
      return;
    }
    if (!topic.trim()) {
      handleError("Please enter a topic");
      return;
    }
    if (!message.trim()) {
      handleError("Please enter a message");
      return;
    }

    // Prepare data for submission
    const submissionData = {
      name: name,
      email: email,
      category: activeButton,
      topic: topic,
      message: message
    }

    // POST api call to backend
    try {
      const response = await ky.post(
        "/api/user/contactUs",
        {
          json: submissionData,
        }
      ).json();

      const { success, message } = response;

      if (success) {
        handleSuccess(message);
        setFormData({
          name: name,
          email: '',
          topic: '',
          message: ''
        })
        setActiveButton(null);
      } else {
        handleError(response.message);
      }
    } catch (error) {
      console.error(error.response);
      if (error.response) {
        const errorJson = await error.response.json();
        handleError(errorJson.message);
      }
    }
  }

  return (
    <>
    <MenuNavBar onLoginClick={handleLoginClick}/>
    <div className="contact-us-container">
      <div className="header">
        <h1>
          <span className="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          Contact Us
        </h1>
        <p>
          Having trouble with something? Send us your request/query by filling
          up the form
        </p>
      </div>
      <div className="content">
        <div className="help-section">
          <h2>
            <span className="icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </span>
            Need Help?
          </h2>
          <p>
            Want answers right away? Select your reference below for our
            answers
          </p>
          <div className="help-options">
            <div className="help-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </div>
              <h3>Getting Started</h3>
              <p>Everything you need to know to get started and explore Sarawak</p>
            </div>
            <div className="help-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3>Trust and Safety</h3>
              <p>
                Trust on our current Database and learn how we distribute your
                data.
              </p>
            </div>
            <div className="help-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h3>Billing Help</h3>
              <p>
                That feel when you look at your Bank Account and Billing Works!
              </p>
            </div>
            <div className="help-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3>Login and Verification</h3>
              <p>
                Read on to learn how to sign in with your email address, or your
                Apple or Google
              </p>
            </div>
          </div>
        </div>
        <div className="form-section">
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Full Name
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className="email-input"
                  required
                  value={name}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Email address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="email-input"
                  required
                  value={email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <p className="select-category">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Select a category:
            </p>
            <div className="button-group">
              <button 
                type="button"
                className={activeButton === 'billing' ? 'active' : ''} 
                onClick={() => handleButtonClick('billing')}
              >
                <svg className="button-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Billing
              </button>
              <button 
                type="button"
                className={activeButton === 'booking' ? 'active' : ''} 
                onClick={() => handleButtonClick('booking')}
              >
                <svg className="button-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Booking
              </button>
              <button 
                type="button"
                className={activeButton === 'login' ? 'active' : ''} 
                onClick={() => handleButtonClick('login')}
              >
                <svg className="button-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Login
              </button>
              <button 
                type="button"
                className={activeButton === 'signup' ? 'active' : ''} 
                onClick={() => handleButtonClick('signup')}
              >
                <svg className="button-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Signup
              </button>
            </div>
            <div className="divider">
              <span>Or</span>
            </div>
            <div className="form-group">
              <label htmlFor="topic">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7"></polyline>
                  <line x1="9" y1="20" x2="15" y2="20"></line>
                  <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
                Your topic
              </label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  id="topic" 
                  name="topic"
                  placeholder="Enter your topic" 
                  className="topic-input" 
                  required
                  value={topic}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="message">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="17" y1="10" x2="3" y2="10"></line>
                  <line x1="21" y1="6" x2="3" y2="6"></line>
                  <line x1="21" y1="14" x2="3" y2="14"></line>
                  <line x1="17" y1="18" x2="3" y2="18"></line>
                </svg>
                Your message
              </label>
              <div className="input-wrapper">
                <textarea 
                  id="message"
                  name="message"
                  placeholder="Describe your issue in detail..." 
                  className="message-input"
                  rows="4"
                  value={message}
                  required
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>
            <button className="submit-button">
              <span>Send your request</span>
              <svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>
      </div>
      <footer>
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
              <input type="email" placeholder="Enter your email" />
            </div>
            <button>
              <svg className="button-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Subscribe
            </button>
          </div>
        </div>
      </footer>
      {showLogin && <LoginPage onClose={closeLogin} />}

      {/* Ai Chatbot */}
      <AIChatbot />
    </div>
    </>
  );
}
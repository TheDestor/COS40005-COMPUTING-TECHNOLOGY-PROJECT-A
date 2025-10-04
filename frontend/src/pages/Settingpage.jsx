import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Settingpage.css';
import Switch from 'react-switch';
import { FaRegQuestionCircle, FaUserCog, FaBug, FaMicrophoneSlash } from 'react-icons/fa';
import { RiGlobalLine } from "react-icons/ri";
import { MdOutlineSettings, MdOutlineQuestionAnswer } from "react-icons/md";
import { FiCheck } from "react-icons/fi";
import MenuNavbar from '../components/MenuNavbar.jsx'; 
import SeniorModeConfirm from '../components/SeniorModeConfirm.jsx';
import LoginPage from './Loginpage.jsx';
import AIChatbot from '../components/AiChatbot.jsx';
import AboutMapModal from '../components/AboutMapModal.jsx';

// SettingsPage component
function SettingsPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showAboutMap, setShowAboutMap] = useState(false);
  
  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  const handleAboutMapClick = () => {
    setShowAboutMap(true);
  };

  const closeAboutMap = () => {
    setShowAboutMap(false);
  };

  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('activeSection') || 'general';
  });
  const [seniorMode, setSeniorMode] = useState(false);
  const [voiceAssistant, setVoiceAssistant] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSeniorConfirm, setShowSeniorConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSectionChange = (section) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  // FAQ modal state and questions
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [faqClosing, setFaqClosing] = useState(false);

  const faqItems = [
    {
      id: 'explore-map',
      question: 'How do I explore the map?',
      answer:
        'Use the search bar on the Map page to find places. Click markers for details and use zoom controls to navigate. Use the side bar to find a route to the location. The map nav bar allows you to switch between different categories.'
    },
    {
      id: 'save-favorites',
      question: 'How can I save locations to Bookmark?',
      answer:
        'You need to sign in first. Then, open any location detail card, click the bookmark icon to add it to Bookmark. View Bookmark either from top right button or the sidebar shortcut.'
    },
    {
      id: 'update-phone',
      question: 'How do I update my phone number?',
      answer:
        'You need to have an account to update your phone number. Go to Top right button → Profile settings, edit your phone number, and confirm changes..'
    },
    {
      id: 'reset-password',
      question: 'I forgot my password — how can I reset it?',
      answer:
        'On the Login page, click “Forgot password”. Enter your account email to receive a reset link. If you don’t see the email, check spam or try again.'
    },
    {
      id: 'map-not-loading',
      question: 'The map is not loading — what should I do?',
      answer:
        'Check your internet connection and reload. Disable ad blockers or VPN temporarily, clear browser cache, and try in an incognito window. If the issue persists, contact our support via Contact Us.'
    },
    {
      id: 'video-audio',
      question: 'Video reels have no audio — how do I fix it?',
      answer:
        'Make sure device volume is up and silent mode is off (iOS). Tap the player’s mute icon to unmute. On mobile, some browsers block autoplay with sound — press play to enable audio.'
    },
    {
      id: 'senior-mode',
      question: 'How do I enable or disable Senior Mode?',
      answer:
        'Open General → General settings and toggle Senior Mode. Enabling may display a confirmation dialog — accept it to apply larger UI and simplified actions.'
    },
    { id: 'find-route', question: 'How do I find a route?', answer: 'Go to the Map side bar, set a starting point and destination. If you wishes to change the transport option, click the any transport option available.' },
    { id: 'manage-business', question: 'As a business user, how can I manage my business on this website?', answer: 'You need to sign up via Business Registration to indicate you are a business user. Sign in and navigate to Business icon from the sidebar. From there, you need to submit your business form by filling in your details. You can navigate to Manage Business icon to edit your business listing, update details, upload images, and track approval status.' },
    { id: 'use-ai-chatbot', question: 'How do I use the AI chatbot?', answer: 'Open the AI Chatbot widget from the bottom-right. Ask questions about places, routes, or features. The bot can help with troubleshooting, recommendations, and quick navigation. On mobile, tap the chatbot icon to expand the chat.' },
    { id: 'submit-inquiries', question: 'Where should I navigate to submit inquiries?', answer: 'Navigate to the Contact Us page from the top right button. Fill out the form with details and submit. You can view responses or follow-ups under your email.' },
    { id: 'more-details', question: 'How to explore more details of the location?', answer: 'You can click on the location marker → Explore, you will navigate to the location detail page. You can view more locations in different categories via clicking the nav bar on top of the page' },
  ];

  const handleFaqClose = () => {
    setFaqClosing(true);
    setTimeout(() => {
      setFaqClosing(false);
      setFaqModalOpen(false);
    }, 180);
  };

  const faqIndex = selectedFaq ? faqItems.findIndex(f => f.id === selectedFaq.id) : -1;
  const gotoPrevFaq = () => {
    if (faqIndex > 0) setSelectedFaq(faqItems[faqIndex - 1]);
  };
  const gotoNextFaq = () => {
    if (faqIndex < faqItems.length - 1) setSelectedFaq(faqItems[faqIndex + 1]);
  };
  const handleQuestionSelect = (id) => {
    const f = faqItems.find(fi => fi.id === id);
    if (f) setSelectedFaq(f);
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'general':
        return (
          <div className="content-section">
            <h2><MdOutlineSettings className="icon-setting" /> General Settings</h2>

            <div className="setting-item">
              <span>Senior Mode</span>
              <Switch
                onChange={(checked) => {
                  if (checked) {
                    setShowSeniorConfirm(true); // open popup, wait for confirmation
                  } else {
                    setSeniorMode(false); // if toggling OFF, apply immediately
                  }
                }}
                checked={seniorMode}
                offColor="#ccc"
                onColor="#007bff"
                uncheckedIcon={false}
                checkedIcon={false}
              />
            </div>

            {/* <div className="setting-item">
              <span>Enable Voice Assistant</span>
              <Switch
                onChange={setVoiceAssistant}
                checked={voiceAssistant}
                offColor="#ccc"
                onColor="#007bff"
                uncheckedIcon={false}
                checkedIcon={false}
              />
            </div> */}

            <ul className="settings-list">
              {/* <li onClick={() => navigate('/error')}>Clear cache</li> */}
              {/* <li onClick={() => navigate('/error')}>System updates</li> */}
              <li onClick={handleAboutMapClick}>About the map</li>
            </ul>
          </div>
        );

      case 'languages':
        return (
          <div className="content-section">
            <h2><RiGlobalLine className="icon-setting" /> Languages</h2>
            <ul className="language-list">
              {['English', '简体中文', 'Melayu'].map((lang) => (
                <li
                  key={lang}
                  className={`language-option ${selectedLanguage === lang ? 'selected' : ''}`}
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {lang}
                  {selectedLanguage === lang && <span><FiCheck className="tick-mark"/></span>}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'help':
        return (
          <div className="content-section">
            <h2><FaRegQuestionCircle className="icon-setting" /> Help Centre</h2>
            <div className="faq-section">
              <h3 className="faq-title">Frequently Asked Questions</h3>
              <ul className="faq-list faq-grid">
                {faqItems.map((item) => (
                  <li
                    key={item.id}
                    className="faq-list-item"
                    onClick={() => { setSelectedFaq(item); setFaqModalOpen(true); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { setSelectedFaq(item); setFaqModalOpen(true); }
                    }}
                    aria-label={`Open answer for ${item.question}`}
                  >
                    {item.question}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <MenuNavbar onLoginClick={handleLoginClick}/> 
      <div className="settings-container">
        <div className="sidebar3">
          <h3 className="settings-heading">Settings</h3>
          <div
            className={`sidebar-item ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => handleSectionChange('general')}
          >
            <MdOutlineSettings className="sidebar-icon" /> General settings
          </div>
          <div
            className={`sidebar-item ${activeSection === 'languages' ? 'active' : ''}`}
            onClick={() => handleSectionChange('languages')}
          >
            <RiGlobalLine className="sidebar-icon" /> Languages
          </div>
          <div
            className={`sidebar-item ${activeSection === 'help' ? 'active' : ''}`}
            onClick={() => handleSectionChange('help')}
          >
            <FaRegQuestionCircle className="sidebar-icon" /> Help centre
          </div>
        </div>

        <div className="main-content">
          {renderContent()}
        </div>
      </div>
      <>
      {showSeniorConfirm && (
          <SeniorModeConfirm
            onConfirm={() => {
              setSeniorMode(true); // apply setting
              setShowSeniorConfirm(false); // close popup
            }}
            onCancel={() => {
              setShowSeniorConfirm(false); // just close popup, don’t change mode
            }}
          />
        )}
      </>
      {showLogin && <LoginPage onClose={closeLogin} />}
      {showAboutMap && <AboutMapModal isOpen={showAboutMap} onClose={closeAboutMap} />}

      {/* Ai Chatbot */}
      <AIChatbot />

      {faqModalOpen && selectedFaq && (
        <div
          className={`faq-modal-overlay ${faqClosing ? 'closing' : ''}`}
          onClick={handleFaqClose}
          role="dialog"
          aria-modal="true"
        >
          <div className="faq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="faq-modal-header">
              <h4 className="faq-modal-title">{selectedFaq.question}</h4>
              <button
                type="button"
                className="faq-modal-close"
                onClick={handleFaqClose}
                aria-label="Close FAQ"
              >
                ×
              </button>
            </div>

            <div className="faq-modal-content">
              <div className="faq-questions" role="navigation" aria-label="FAQ navigation">
                {faqItems.map((item) => (
                  <button
                    key={item.id}
                    className={`faq-question-item ${selectedFaq.id === item.id ? 'active' : ''}`}
                    onClick={() => handleQuestionSelect(item.id)}
                  >
                    {item.question}
                  </button>
                ))}
              </div>

              <div className="faq-answer">
                <div className="faq-modal-body">
                  <p>{selectedFaq.answer}</p>
                </div>
              </div>
            </div>

            <div className="faq-modal-footer">
              <button
                className="faq-nav-button prev"
                onClick={gotoPrevFaq}
                disabled={faqIndex <= 0}
                aria-label="Previous question"
              >
                Previous
              </button>
              <button
                className="faq-nav-button next"
                onClick={gotoNextFaq}
                disabled={faqIndex >= faqItems.length - 1}
                aria-label="Next question"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;

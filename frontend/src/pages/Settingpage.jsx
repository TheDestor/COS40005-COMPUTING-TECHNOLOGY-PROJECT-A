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

const SettingsPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  
  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
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

            <div className="setting-item">
              <span>Enable Voice Assistant</span>
              <Switch
                onChange={setVoiceAssistant}
                checked={voiceAssistant}
                offColor="#ccc"
                onColor="#007bff"
                uncheckedIcon={false}
                checkedIcon={false}
              />
            </div>

            <ul className="settings-list">
              {/* <li onClick={() => navigate('/error')}>Clear cache</li> */}
              {/* <li onClick={() => navigate('/error')}>System updates</li> */}
              <li onClick={() => navigate('/error')}>About the map</li>
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

            {/* <ul className="help-list">
              <li><FaRegQuestionCircle className="help-icon" /> FAQ</li>
              <li><FaUserCog className="help-icon" /> Account Issue</li>
              <li><FaBug className="help-icon" /> Report Error</li>
              <li><FaMicrophoneSlash className="help-icon" /> Voice Error</li>
            </ul> */}

            <div className="faq-section">
              {/* <h3><MdOutlineQuestionAnswer className="icon-setting" /> Frequently Asked Questions</h3> */}
              <ol className="faq-list">
                <li>Explore about this map</li>
                <li>If I want to change the phone number</li>
                <li>Can I add locations for this map?</li>
                <li>How to change senior mode?</li>
              </ol>
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
    </div>
  );
};

export default SettingsPage;

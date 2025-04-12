import React, { useState } from 'react';
import '../styles/Settingpage.css';
import Switch from 'react-switch';
import { FaRegQuestionCircle, FaUserCog, FaBug, FaMicrophoneSlash } from 'react-icons/fa';
import { RiGlobalLine } from "react-icons/ri";
import { MdOutlineSettings, MdOutlineQuestionAnswer } from "react-icons/md";
import { FiCheck } from "react-icons/fi";
import Navbar from '../components/MenuNavbar.jsx'; 

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [seniorMode, setSeniorMode] = useState(false);
  const [voiceAssistant, setVoiceAssistant] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const renderContent = () => {
    switch(activeSection) {
      case 'general':
        return (
          <div className="content-section">
            <h2><MdOutlineSettings className="icon-setting" /> General Settings</h2>

            <div className="setting-item">
              <span>Senior Mode</span>
              <Switch
                onChange={setSeniorMode}
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
              <li>Clear cache</li>
              <li>System updates</li>
              <li>About the map</li>
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

            <ul className="help-list">
              <li><FaRegQuestionCircle className="help-icon" /> FAQ</li>
              <li><FaUserCog className="help-icon" /> Account Issue</li>
              <li><FaBug className="help-icon" /> Report Error</li>
              <li><FaMicrophoneSlash className="help-icon" /> Voice Error</li>
            </ul>

            <div className="faq-section">
              <h3><MdOutlineQuestionAnswer className="icon-setting" /> Frequently Asked Questions</h3>
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
      <Navbar /> 
      <div className="settings-container">
        <div className="sidebar">
          <div
            className={`sidebar-item ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSection('general')}
          >
            <MdOutlineSettings className="sidebar-icon" /> General settings
          </div>
          <div
            className={`sidebar-item ${activeSection === 'languages' ? 'active' : ''}`}
            onClick={() => setActiveSection('languages')}
          >
            <RiGlobalLine className="sidebar-icon" /> Languages
          </div>
          <div
            className={`sidebar-item ${activeSection === 'help' ? 'active' : ''}`}
            onClick={() => setActiveSection('help')}
          >
            <FaRegQuestionCircle className="sidebar-icon" /> Help centre
          </div>
        </div>

        <div className="main-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

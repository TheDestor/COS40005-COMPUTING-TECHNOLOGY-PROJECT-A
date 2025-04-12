import React, { useState } from 'react';
import '../styles/Loginpage.css';
import backgroundImg from '../assets/Kuching.png'; // Adjust path if needed
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('otp');
  const [phoneEmail, setPhoneEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleTabClick = (tab) => setActiveTab(tab);
  const handleSendOtp = (e) => e.preventDefault();
  const handleLogin = (e) => e.preventDefault();

  return (
    <div className="overlay">
      <div className="login-wrapper">
        <div className="login-image">
          <img src={backgroundImg} alt="login background" />
        </div>
        <div className="login-container">
          <div className="login-type-selector">
            <button
              className={`login-tab ${activeTab === 'otp' ? 'active-tab' : ''}`}
              onClick={() => handleTabClick('otp')}
            >
              OTP Login
            </button>
            <button
              className={`login-tab ${activeTab === 'password' ? 'active-tab' : ''}`}
              onClick={() => handleTabClick('password')}
            >
              Password Login
            </button>
            <Link to="/" className="close-btn">✕</Link>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="text"
                className="input-field"
                placeholder="Phone Number/Email"
                value={phoneEmail}
                onChange={(e) => setPhoneEmail(e.target.value)}
                required
              />
            </div>

            {activeTab === 'otp' ? (
              <div className="form-group">
                <div className="otp-input-wrapper">
                  <input
                    type="text"
                    className="input-field otp-input"
                    placeholder="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  <button className="send-button-inside" onClick={handleSendOtp}>Send</button>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <div className="input-with-icon">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
            )}

            <div className="captcha-section">
              <label className="captcha-item">
                <input
                  type="checkbox"
                  checked={isRobotChecked}
                  onChange={(e) => setIsRobotChecked(e.target.checked)}
                  required
                />
                <span className="kal-label">I'm not a robot</span>
              </label>
            </div>

            <button type="submit" className="login-button">
              Login
            </button>
          </form>

          {activeTab === 'otp' ? (
            <div className="bottom-links-row center-links">
              <span className="signup-text">
                Don’t have an account? <Link to="/register" className="signup-link">Sign up</Link>
              </span>
            </div>
          ) : (
            <div className="bottom-links-row spaced-links">
              <span className="signup-text">
                Don’t have an account? <Link to="/register" className="signup-link">Sign up</Link>
              </span>
              <span className="forgot-password">
                <Link to="/forgetpassword">Forgot Password?</Link>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

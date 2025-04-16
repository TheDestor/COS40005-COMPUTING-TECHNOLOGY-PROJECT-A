import React, { useState, useEffect } from 'react';
import '../styles/Loginpage.css';
import backgroundImg from '../assets/Kuching.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserRegistration from './UserRegistration.jsx';
import BusinessRegistrationpage from './BusinessRegistrationpage.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  // States
  const [activeTab, setActiveTab] = useState('otp');
  const [otp, setOtp] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
  });
  const { identifier, password } = formData;

  // Handlers
  const handleTabClick = (tab) => setActiveTab(tab);
  const handleSendOtp = (e) => e.preventDefault();
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSuccess = (msg) => {
    toast.success(msg, {
      position: "bottom-right",
    });
  };

  const handleError = (msg) => {
    toast.error(msg, {
      position: "bottom-right",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(identifier, password);

    if (result.success) {
      handleSuccess(result.message);
      setFormData({ identifier: '', password: '' });
      setIsRobotChecked(false);
      navigate('/');
    } else {
      handleError(result.message || "Login failed. Please check credentials.");
    }
  }

  // Add this state at the top of your LoginPage component
const [showUserRegister, setShowUserRegister] = useState(false);
const [showBusinessRegister, setShowBusinessRegister] = useState(false);

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
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="input-field"
                placeholder="Phone Number/Email"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
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
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
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
                Don’t have an account? <span className="signup-link" onClick={() => setShowUserRegister(true)}>Sign up</span>
              </span>
            </div>
          ) : (
            <div className="bottom-links-row spaced-links">
              <span className="signup-text">
                Don’t have an account? <span className="signup-link" onClick={() => setShowUserRegister(true)}>Sign up</span>
              </span>
              <span className="forgot-password">
                <Link to="/forget-password">Forgot Password?</Link>
              </span>
            </div>
          )}
          {showUserRegister && (
            <UserRegistration
              onClose={() => setShowUserRegister(false)}
              onSwitchToLogin={() => {
                setShowUserRegister(false);
              }}
              onSwitchToBusiness={() => {
                setShowUserRegister(false);
                setShowBusinessRegister(true);
              }}
            />
          )}

          {showBusinessRegister && (
            <BusinessRegistrationpage
              onClose={() => setShowBusinessRegister(false)}
              onSwitchToLogin={() => {
                setShowBusinessRegister(false);
              }}
              onSwitchToUser={() => {
                setShowBusinessRegister(false);
                setShowUserRegister(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

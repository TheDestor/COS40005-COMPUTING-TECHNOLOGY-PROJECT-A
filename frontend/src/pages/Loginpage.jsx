import React, { useState, useEffect } from 'react';
import '../styles/Loginpage.css';
import backgroundImg from '../assets/Kuching.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserRegistration from './UserRegistration.jsx';
import BusinessRegistrationpage from './BusinessRegistrationpage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ForgotPasswordpage from './ForgetPasswordpage.jsx';


const LoginPage = ({ onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState('otp');
  const [otp, setOtp] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const { identifier, password } = formData;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleTabClick = (tab) => setActiveTab(tab);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSuccess = (msg) => {
    toast.success(msg, {
      position: 'bottom-right',
    });
  };

  const handleError = (msg) => {
    toast.error(msg, {
      position: 'bottom-right',
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!identifier) {
      handleError("Please enter your phone number or email.");
      return;
    }

    setLoadingOtp(true);

    try {
      const response = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (data.success) {
        handleSuccess(data.message || 'OTP sent successfully!');
        setOtpSent(true);
      } else {
        handleError(data.message || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error(error);
      handleError("Something went wrong while sending OTP.");
    }

    setLoadingOtp(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isRobotChecked) {
      handleError("Please verify the captcha.");
      return;
    }

    if (activeTab === 'otp') {
      handleError("OTP login is not yet supported on backend.");
      return;
    }

    const result = await login(identifier, password);

    if (result.success) {
      handleSuccess(result.message || "Login successful!");
      setFormData({ identifier: '', password: '' });
      setIsRobotChecked(false);
      navigate('/');
    } else {
      handleError(result.message || "Login failed. Please check credentials.");
    }
  };

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
                  <button
                    className="send-button-inside"
                    onClick={handleSendOtp}
                    disabled={loadingOtp}
                  >
                    {loadingOtp ? 'Sending...' : 'Send'}
                  </button>
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
                <span onClick={() => setShowForgotPassword(true)}>Forgot Password?</span>
              </span>
            </div>
          )}

          {showForgotPassword && (
            <ForgotPasswordpage onClose={() => setShowForgotPassword(false)} />
          )}

          {showUserRegister && (
            <UserRegistration
              onClose={() => setShowUserRegister(false)}
              onSwitchToLogin={() => setShowUserRegister(false)}
              onSwitchToBusiness={() => {
                setShowUserRegister(false);
                setShowBusinessRegister(true);
              }}
            />
          )}

          {showBusinessRegister && (
            <BusinessRegistrationpage
              onClose={() => setShowBusinessRegister(false)}
              onSwitchToLogin={() => setShowBusinessRegister(false)}
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

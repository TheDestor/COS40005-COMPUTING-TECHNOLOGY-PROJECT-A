import React, { useState, useEffect } from 'react';
import '../styles/Loginpage.css';
import backgroundImg from '../assets/Kuching.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserRegistration from './UserRegistration.jsx';
import BusinessRegistrationpage from './BusinessRegistrationpage.jsx';
import ForgotPasswordpage from './ForgetPasswordpage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
// import { auth } from '../firebaseConfig.js';

const LoginPage = ({ onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState('otp');
  const [otp, setOtp] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showUserRegister, setShowUserRegister] = useState(false);
  const [showBusinessRegister, setShowBusinessRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSuccess = (msg) => {
    toast.success(msg, { position: 'bottom-right' });
  };

  const handleError = (msg) => {
    toast.error(msg, { position: 'bottom-right' });
  };

  const handleSendOtp = async () => {
    if (!identifier) {
      handleError('Please enter your phone number.');
      return;
    }

    if (!/^\+?\d{10,15}$/.test(identifier)) {
      handleError('Enter a valid phone number with country code (e.g., +60)');
      return;
    }

    setLoadingOtp(true);

    try {
      if (!window.recaptchaVerifier) {
        // Initialize RecaptchaVerifier
        window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
          size: 'invisible',
          callback: (response) => {
            // Handle success here (if needed)
          },
          'expired-callback': () => {
            // Handle expiration here (if needed)
          }
        }, auth);

        // Only disable app verification for testing in development mode
        if (process.env.NODE_ENV === 'development') {
          window.recaptchaVerifier.verifyForTesting = true;
        }

        // Render reCAPTCHA
        await window.recaptchaVerifier.render();
      }

      // Send OTP
      const result = await signInWithPhoneNumber(auth, identifier, window.recaptchaVerifier);
      setConfirmationResult(result);
      handleSuccess('OTP sent successfully!');
      setOtpSent(true);
    } catch (error) {
      console.error('🔥 OTP Error:', error.message);
      handleError(`Error sending OTP: ${error.message}`);
    }

    setLoadingOtp(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!confirmationResult) {
      handleError('Please request an OTP first.');
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const token = await user.getIdToken();

      const response = await fetch('http://localhost:5050/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        handleSuccess('Logged in via OTP!');
        onClose();
        navigate('/');
      } else {
        handleError(data.message || 'Backend login failed.');
      }
    } catch (error) {
      console.error(error);
      handleError('Invalid OTP. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isRobotChecked) {
      handleError('Please verify the captcha.');
      return;
    }

    if (activeTab === 'otp') {
      handleVerifyOtp(e);
      return;
    }

    const result = await login(identifier, password);

    if (result.success) {
      handleSuccess(result.message || 'Login successful!');
      setFormData({ identifier: '', password: '' });
      setIsRobotChecked(false);
      onClose();
    } else {
      handleError(result.message || 'Login failed. Please check credentials.');
    }
  };

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
                placeholder="Email/Phone Number"
                name="identifier"
                value={identifier}
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
                    type="button"
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
                    value={password}
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

            <div id="recaptcha-container"></div>
          </form>

          {activeTab === 'otp' ? (
            <div className="bottom-links-row center-links">
              <span className="signup-text">
                Don’t have an account?{' '}
                <span className="signup-link" onClick={() => setShowUserRegister(true)}>Sign up</span>
              </span>
            </div>
          ) : (
            <div className="bottom-links-row spaced-links">
              <span className="signup-text">
                Don’t have an account?{' '}
                <span className="signup-link" onClick={() => setShowUserRegister(true)}>Sign up</span>
              </span>
              <span className="forgot-password" onClick={() => setShowForgotPassword(true)}>
                Forgot Password?
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

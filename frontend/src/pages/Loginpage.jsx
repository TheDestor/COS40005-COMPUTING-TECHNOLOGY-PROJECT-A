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
// import { auth } from '../../../backend/routes/firebaseConfig.js'; // Import auth from the firebaseConfig file
// import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'; // Import necessary Firebase auth methods

const LoginPage = ({ onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // States
  const [activeTab, setActiveTab] = useState('otp');
  const [otp, setOtp] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showUserRegister, setShowUserRegister] = useState(false);
  const [showBusinessRegister, setShowBusinessRegister] = useState(false);

  const { identifier, password } = formData;

  // Close the window when esc key is pressed
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Handle clicking for the two tabs
  const handleTabClick = (tab) => setActiveTab(tab);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle success toasts
  const handleSuccess = (msg) => {
    toast.success(msg, { position: 'bottom-right' });
  };

  // Handle error toasts
  const handleError = (msg) => {
    toast.error(msg, { position: 'bottom-right' });
  };

  const handleSendOtp = async (e) => {
    // e.preventDefault();

    // if (!identifier) {
    //   handleError('Please enter your phone number.');
    //   return;
    // }

    // if (!/^\+?\d{10,15}$/.test(identifier)) {
    //   handleError('Only valid phone numbers are supported. Include country code (e.g., +60).');
    //   return;
    // }

    // setLoadingOtp(true);

    // try {
    //   if (!window.recaptchaVerifier) {
    //     window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    //       size: 'invisible',
    //     }, auth);
    //     await window.recaptchaVerifier.render();
    //   }

    //   const result = await signInWithPhoneNumber(auth, identifier, window.recaptchaVerifier);
    //   setConfirmationResult(result);
    //   handleSuccess('OTP sent to phone.');
    //   setOtpSent(true);
    // } catch (error) {
    //   console.error('🔥 Firebase OTP Error:', error.message);
    //   handleError(`Error: ${error.message}`);
    // }

    // setLoadingOtp(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otp);
        handleSuccess('OTP Verified successfully!');
        navigate('/');
      } else {
        handleError('Please request an OTP first.');
      }
    } catch (error) {
      console.error(error);
      handleError('Invalid OTP. Please try again.');
    }
  };

  // Submission handler
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

    // Call the login method with the id and password the user entered
    const result = await login(identifier, password);

    // Process the returned values
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
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="input-field"
                placeholder="Phone Number"
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

            {/* reCAPTCHA container */}
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

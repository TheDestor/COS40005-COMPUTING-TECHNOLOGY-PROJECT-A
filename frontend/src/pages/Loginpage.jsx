import React, { useState } from 'react';
import '../styles/Loginpage.css';
import backgroundImg from '../assets/Kuching.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const LoginPage = () => {
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


    const userData = {
      identifier,
      password
    }

    try {
      const response = await axios.post(
        "http://localhost:5050/login",
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      const { success, message } = response.data;
      if (success) {
        handleSuccess(message);
        setFormData({
          identifier: '',
          password: '',
        })
      } else {
        handleError(message);
      }
    } catch (error) {
      handleError(error.response.data.message)
    }
  }

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

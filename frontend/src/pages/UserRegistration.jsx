import React, { useState } from 'react';
import '../styles/UserRegistration.css';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import RegisterImage from '../assets/Kuching.png';

const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      const formElements = Array.from(document.querySelectorAll('.registration-form input'));
      const index = formElements.indexOf(e.target);
      if (index !== -1 && index < formElements.length - 1) {
        formElements[index + 1].focus();
      }
    }
  };  

const UserRegistration = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="registration-overlay">
      <div className="registration-container">
        <div className="registration-left">
          <img src={RegisterImage} alt="Registration Art" />
        </div>

        <div className="registration-right">
          <div className="tabs">
            <span className="active-tab">User registration</span>
            <Link to="/business-register" className="inactive-tab">Business registration</Link>
            <span className="close-btn2" onClick={() => navigate('/')}>&times;</span>
          </div>

          <form className="registration-form">
            <div className="form-row">
              <input className='input-field' type="text" placeholder="First Name" onKeyDown={handleKeyDown} />
              <input className='input-field' type="text" placeholder="Last Name" onKeyDown={handleKeyDown} />
            </div>
            <div className="form-row">
              <input className='input-field' type="email" placeholder="Email" onKeyDown={handleKeyDown} required/>
            </div>
            <div className="form-row">
                <div className="phone-input-wrapper">
                    <select defaultValue="+60">
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    </select>
                    <input type="tel" placeholder="Phone Number" onKeyDown={handleKeyDown} />
                </div>
            </div>
            <div className="form-row">
              <div className="password-input">
                <input
                  className='input-field'
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" onKeyDown={handleKeyDown}
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <div className="form-row">
                <div className="password-input">
                    <input
                      className='input-field'
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password" onKeyDown={handleKeyDown}
                    />
                    <span onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
            </div>
            <button type="submit" className="register-btn">Register</button>
          </form>

          <p className="signin-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;

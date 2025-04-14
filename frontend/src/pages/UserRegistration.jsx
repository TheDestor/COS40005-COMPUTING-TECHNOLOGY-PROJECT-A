import React, { useState } from 'react';
import '../styles/UserRegistration.css';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import RegisterImage from '../assets/Kuching.png';
import axios from 'axios';

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

  // State to hold all the input values
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phonePrefix: '+60', // Default
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const { firstName, lastName, email, phonePrefix, phoneNumber, password, confirmPassword } = formData;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); // Prevent default submission
    
    // Client side validation
    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      console.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }

    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

    const userData = {
      firstName,
      lastName,
      email,
      phoneNumber: fullPhoneNumber,
      password,
    }

    try {
      const response = await axios.post(
        "http://localhost:5050/register",
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          // withCredentials: true
        }
      );
      const { success, message } = response.data;
      if (success) {
        console.log("Registration successful");
        setFormData({
          firstName: '', lastName: '', email: '',
          phoneCountryCode: '+60', phoneNumber: '',
          password: '', confirmPassword: '',
        });
      } else {
        console.log("test");
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  }

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

          <form className="registration-form" onSubmit={handleRegisterSubmit}>
            <div className="form-row">
              <input className='input-field' type="text" placeholder="First Name" name="firstName" value={firstName} onChange={handleInputChange} onKeyDown={handleKeyDown} required/>
              <input className='input-field' type="text" placeholder="Last Name" name="lastName" value={lastName} onChange={handleInputChange} onKeyDown={handleKeyDown} required/>
            </div>
            <div className="form-row">
              <input className='input-field' type="email" placeholder="Email" name="email" value={email} onChange={handleInputChange} onKeyDown={handleKeyDown} required/>
            </div>
            <div className="form-row">
                <div className="phone-input-wrapper">
                    <select 
                      // defaultValue="+60"
                      name="phonePrefix"
                      value={phonePrefix}
                      onChange={handleInputChange}
                    >
                      <option value="+60">🇲🇾 +60</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+91">🇮🇳 +91</option>
                    </select>
                    <input type="tel" placeholder="Phone Number" name="phoneNumber" value={phoneNumber} onChange={handleInputChange} onKeyDown={handleKeyDown} required/>
                </div>
            </div>
            <div className="form-row">
              <div className="password-input">
                <input
                  className='input-field'
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  name="password"
                  value={password}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  required
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
                      placeholder="Confirm password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      required
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

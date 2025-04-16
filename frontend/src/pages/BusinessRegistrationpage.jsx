import React, { useState } from 'react';
import '../styles/UserRegistration.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import RegisterImage from '../assets/Kuching.png';
import { toast } from 'react-toastify';
import axios from 'axios';

const BusinessRegistrationpage = ({ onClose, onSwitchToLogin, onSwitchToUser }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    companyRegistrationNo: '',
    email: '',
    phonePrefix: '+60',
    phoneNumber: '',
    companyAddress: '',
    password: '',
    confirmPassword: ''
  });

  const {
    firstName, lastName, companyName, companyRegistrationNo,
    email, phonePrefix, phoneNumber, companyAddress,
    password, confirmPassword
  } = formData;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const formElements = Array.from(
        e.currentTarget.closest('form')?.querySelectorAll('input, select') || []
      );
      const index = formElements.indexOf(e.target);
      if (index !== -1 && index < formElements.length - 1) {
        formElements[index + 1].focus();
      }
    }
  };

  const handleSuccess = (msg) => {
    toast.success(msg, { position: "bottom-right" });
  };

  const handleError = (msg) => {
    toast.error(msg, { position: "bottom-right" });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      handleError("Passwords do not match");
      return;
    }

    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
    const businessData = {
      firstName, lastName, companyName, companyRegistrationNo,
      email, phoneNumber: fullPhoneNumber, companyAddress, password
    };

    try {
      const response = await axios.post(
        "http://localhost:5050/auth/businessRegister",
        userData,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      const { success, message } = res.data;
      if (success) {
        handleSuccess(message);
        setFormData({
          firstName: '', lastName: '', companyName: '',
          companyRegistrationNo: '', email: '', phonePrefix: '+60',
          phoneNumber: '', companyAddress: '', password: '', confirmPassword: ''
        });
      } else {
        handleError(message);
      }
    } catch (error) {
      console.error(error);
      handleError(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="registration-overlay">
      <div className="registration-container">
        <div className="registration-left">
          <img src={RegisterImage} alt="Registration Art" />
        </div>

        <div className="registration-right">
          <div className="tabs2">
            <span className="inactive-tab2" onClick={onSwitchToUser}>User registration</span>
            <span className="active-tab">Business registration</span>
            <span className="close-btn2" onClick={onClose}>&times;</span>
          </div>

          <form className="registration-form" onSubmit={handleRegisterSubmit} onKeyDown={handleKeyDown}>
            <div className="form-row2">
              <input type="text" className="input-field" name="firstName" placeholder="First Name" value={firstName} onChange={handleInputChange} required />
              <input type="text" className="input-field" name="lastName" placeholder="Last Name" value={lastName} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
              <input type="text" className="input-field" name="companyName" placeholder="Company Name" value={companyName} onChange={handleInputChange} required />
              <input type="text" className="input-field" name="companyRegistrationNo" placeholder="Company Registration No." value={companyRegistrationNo} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
              <input type="email" className="input-field" name="email" placeholder="Company Email" value={email} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
              <div className="phone-input-wrapper">
                <select name="phonePrefix" value={phonePrefix} onChange={handleInputChange}>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+86">🇨🇳 +86</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+91">🇮🇳 +91</option>
                </select>
                <input type="tel" className="input-field" name="phoneNumber" placeholder="Contact Number" value={phoneNumber} onChange={handleInputChange} pattern="[0-9]*" required />
              </div>
            </div>

            <div className="form-row2">
              <input type="text" className="input-field" name="companyAddress" placeholder="Company Address" value={companyAddress} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field"
                  placeholder="Password"
                  value={password}
                  onChange={handleInputChange}
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="password-input">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className="input-field"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={handleInputChange}
                />
                <span onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <button type="submit" className="register-btn">Register</button>
          </form>

          <p className="signin-link">
            Already have an account?{" "}
            <span onClick={onSwitchToLogin}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegistrationpage;

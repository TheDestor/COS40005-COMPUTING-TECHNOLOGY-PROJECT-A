import React, { useState } from 'react';
import '../styles/UserRegistration.css';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import RegisterImage from '../assets/Kuching.png';
import { toast } from 'react-toastify';
import axios from 'axios';


const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission
    const formElements = Array.from(e.currentTarget.closest('form')?.querySelectorAll('input, select') || []);
    const index = formElements.indexOf(e.target);
    if (index !== -1 && index < formElements.length - 1) {
      formElements[index + 1].focus();
    }
  }
};

const BusinessRegistrationpage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

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
    confirmPassword:  ''
  })

  const { firstName, lastName, companyName, companyRegistrationNo, email, phonePrefix, phoneNumber, companyAddress, password, confirmPassword } = formData;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSuccess = (msg) => {
    toast.success(msg, {
      position: "bottom-right",
    });
  };
  
    // Toast error
  const handleError = (msg) => {
    toast.error(msg, {
      position: "bottom-right",
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

    const userData = {
      firstName,
      lastName,
      companyName,
      companyRegistrationNo,
      email,
      phoneNumber: fullPhoneNumber,
      companyAddress,
      password
    }

    try {
      const response = await axios.post(
        "http://localhost:5050/auth/businessRegister",
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
          firstName: '',
          lastName: '',
          companyName: '',
          companyRegistrationNo: '',
          email: '',
          phoneNumber: '',
          companyAddress: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        handleError(message);
      }
    } catch (error) {
      console.log(error);
      handleError(error.response.data.message);
    }
  }

  return (
    <div className="registration-overlay">
      <div className="registration-container">
        <div className="registration-left">
          <img src={RegisterImage} alt="Registration Art" />
        </div>

        <div className="registration-right">
          <div className="tabs2">
            <Link to="/register" className="inactive-tab2">User registration</Link>
            <span className="active-tab">Business registration</span>
            <span className="close-btn2" onClick={() => navigate('/')}>&times;</span>
          </div>

          <form className="registration-form" onSubmit={handleRegisterSubmit} onKeyDown={handleKeyDown}>
            <div className="form-row2">
              <input className='input-field' type="text" placeholder="First Name" name="firstName" value={firstName} onChange={handleInputChange}required/>
              <input className='input-field' type="text" placeholder="Last Name" name="lastName" value={lastName} onChange={handleInputChange} required/>
            </div>
            <div className="form-row2">
                <input className='input-field' type="text" placeholder="Company Name" name="companyName" value={companyName} onChange={handleInputChange} required/>
                <input className='input-field' type="text" placeholder="Company Registration No." name="companyRegistrationNo" value={companyRegistrationNo} onChange={handleInputChange} required/>
            </div>
            <div className="form-row2">
              <input className='input-field' type="email" placeholder="Company Email" name="email" value={email} onChange={handleInputChange} required/>
            </div>
            <div className="form-row2">
                <div className="phone-input-wrapper">
                    <select
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
                    <input className='input-field' type="tel" placeholder="Contact Number" name="phoneNumber" value={phoneNumber} onChange={handleInputChange} pattern="[0-9]*" title="Only numbers are allowed" required/>
                </div>
            </div>
            <div className="form-row2">
                <input className='input-field' type="text" placeholder="Company Address" name="companyAddress" value={companyAddress} onChange={handleInputChange} required/>
            </div>

            <div className="form-row2">
              <div className="password-input">
                <input
                  className='input-field'
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  name="password"
                  value={password}
                  onChange={handleInputChange}
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="password-input">
                    <input
                      className='input-field'
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                      name="confirmPassword"
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
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegistrationpage;

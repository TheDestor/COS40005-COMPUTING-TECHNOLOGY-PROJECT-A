import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import backgroundImg from '../assets/Kuching.png';
import '../styles/Loginpage.css';

const PhoneVerification = ({ onNext, setPhone, onCancel }) => {
  const [phone, setPhoneInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setPhone(phone);
    onNext();
  };

  return (
    <div className="overlay">
      <div className="login-wrapper2">
        <div className="login-image">
          <img src={backgroundImg} alt="Background" />
        </div>

        <div className="reset-container">
          <button onClick={onCancel} className="close-btn">✕</button>

          <h2>Forgot Password</h2>
          <p>Please enter your phone number to receive a verification code.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="tel"
                className="input-field"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhoneInput(e.target.value)}
                required
              />
            </div>

            <div className="reset-buttons">
              <button type="button" className="btn-back" onClick={onCancel}>Cancel</button>
              <button type="submit" className="btn-continue">Continue</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;

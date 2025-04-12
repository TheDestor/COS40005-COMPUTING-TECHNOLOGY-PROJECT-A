import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import backgroundImg from '../assets/Kuching.png';
import '../styles/Loginpage.css';

const EmailVerification = ({ onNext, setEmail }) => {
  const [email, setEmailInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmail(email);
    onNext();
  };

  return (
    <div className="overlay">
      <div className="login-wrapper">
        <div className="login-image">
          <img src={backgroundImg} alt="Background" />
        </div>

        <div className="reset-container">
          <Link to="/login" className="close-btn">✕</Link>

          <h2>Forgot Password</h2>
          <p>Please enter your email to receive a verification code.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                className="input-field"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>

            <div className="reset-buttons">
              <Link to="/login" className="btn-back">Cancel</Link>
              <button type="submit" className="btn-continue">Continue</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Loginpage.css'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import backgroundImg from '../assets/Kuching.png';

const ResetPassword = ({ email }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const isMatch = newPass && confirmPass && newPass === confirmPass;
  const isMismatch = confirmPass && newPass !== confirmPass;

  const getStrength = (password) => {
    if (!password) return '';
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
    const medium = /^.{6,}$/;
    return strong.test(password) ? 'strong' : medium.test(password) ? 'medium' : 'weak';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isMatch) {
      alert("✅ Password reset successful!");
      navigate('/login');
    } else {
      alert("❌ Passwords do not match.");
    }
  };

  return (
    <div className="overlay">
      <div className="login-wrapper">
        <div className="login-image">
          <img src={backgroundImg} alt="Background" />
        </div>
        <div className="login-container reset-container3">
          <h2>Reset Your Password</h2>
          <p>New password should at least 8 characters and contains at least 1 special symbol.</p>
          <form onSubmit={handleSubmit} className="reset-form">
            <div className="input-with-icon2">
              <input
                type={showNew ? "text" : "password"}
                placeholder="New Password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="input-field"
                required
              />
              <span className="eye-icon" onClick={() => setShowNew(!showNew)}>
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {newPass && (
              <div className={`strength-meter ${getStrength(newPass)}`}>
                {getStrength(newPass).toUpperCase()} PASSWORD
              </div>
            )}

            <div className="input-with-icon2">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="input-field"
                required
              />
              <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {isMismatch && (
              <div className="match-warning">❗Passwords do not match.</div>
            )}
            {isMatch && (
              <div className="match-success">✅ Passwords match.</div>
            )}

            <div className="reset-buttons">
            <button type="button" className="btn-back" onClick={() => navigate('/login')}>Cancel</button>
              <button type="submit" className="btn-continue">Reset Password</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

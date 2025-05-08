import React, { useState } from "react";
import "../styles/ChangeNewPassword.css";
import Switch from "react-switch";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import { useAuth } from "../context/AuthProvider.jsx";
import ky from "ky";

const getPasswordStrength = (password) => {
  if (password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)) return "strong";
  if (password.length >= 6) return "medium";
  return "weak";
};

const ChangeNewPassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { currentPassword, newPassword, confirmPassword } = formData;
  const [enableMFA, setEnableMFA] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(newPassword);
  const { accessToken } = useAuth();

  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid = currentPassword && newPassword && confirmPassword && passwordsMatch;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleClearForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }

  const handleUpdatePassword = async () => {
    if (!isFormValid) {
      console.log("Missing fields/passwords do not match");
      return;
    }

    try {
      const response = await ky.post(
        "/api/user/updatePassword",
        {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          json: { currentPassword, newPassword },
          credentials: 'include'
        }
      ).json();

      const { success, message } = response;

      if (success) {
        console.log(message);
        handleClearForm();
      } else {
        console.log(message);
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        const errorJson = await error.response.json();
        console.log(errorJson.message);
      }
    }
  }
  
  return (
    <div className="change-password-container">
      <h2><MdSecurity size={20} /> Sign in & security</h2>

      <div className="form-group2">
        <label htmlFor="currentPassword">Current password</label>
        <div className="input-with-icon4">
          <input
            type={showCurrent ? "text" : "password"}
            value={formData.currentPassword}
            id="currentPassword"
            name="currentPassword"
            onChange={handleInputChange}
            placeholder="Enter current password"
            className="input-field"
          />
          <button onClick={() => setShowCurrent(!showCurrent)}>
            {showCurrent ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
      </div>

      <div className="form-group2">
        <label htmlFor="newPassword">New password</label>
        <div className="input-with-icon4">
          <input
            type={showNew ? "text" : "password"}
            value={formData.newPassword}
            id="newPassword"
            name="newPassword"
            onChange={handleInputChange}
            placeholder="New password"
            className="input-field"
          />
          <button onClick={() => setShowNew(!showNew)}>
            {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
        {newPassword && (
          <div className={`strength-meter ${strength}`}>Strength: {strength}</div>
        )}
      </div>

      <div className="form-group2">
        <label htmlFor="confirmPassword">Confirm new password</label>
        <div className="input-with-icon4">
            <input
            type={showConfirm ? "text" : "password"}
            value={formData.confirmPassword}
            id="confirmPassword"
            name="confirmPassword"
            onChange={handleInputChange}
            placeholder="Confirm password"
            className="input-field"
            />
            <button onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
        </div>
        {confirmPassword && newPassword && (
          passwordsMatch ? (
            <div className="password-match">Passwords match</div>
          ) : (
            <div className="password-mismatch">Passwords do not match</div>
          )
        )}
        </div>


        <div className="mfa-toggle-wrapper">
        <div className="mfa-toggle">
            <label>Enable MFA via Google Authenticator</label>
            <Switch
            checked={enableMFA}
            onChange={setEnableMFA}
            onColor="#2563eb"
            offColor="#ccc"
            onHandleColor="#ffffff"
            offHandleColor="#ffffff"
            handleDiameter={22}
            uncheckedIcon={false}
            checkedIcon={false}
            height={26}
            width={48}
            className="mfa-react-switch"
            />
        </div>
        </div>


      {(currentPassword || newPassword || confirmPassword) && (
        <div className="action-buttons3 left-align">
          <button type="button" className="cancel-btn3" onClick={handleClearForm}>Cancel</button>
          <button type="button" className="update-btn3" onClick={handleUpdatePassword} disabled={!isFormValid}>Update</button>
        </div>
      )}
    </div>
  );
};

export default ChangeNewPassword;

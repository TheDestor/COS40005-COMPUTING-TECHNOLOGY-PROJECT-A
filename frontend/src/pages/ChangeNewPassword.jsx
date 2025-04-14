import React, { useState } from "react";
import "../styles/ChangeNewPassword.css";
import Switch from "react-switch";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";

const getPasswordStrength = (password) => {
  if (password.length >= 10 && /[A-Z]/.test(password) && /\d/.test(password)) return "strong";
  if (password.length >= 6) return "medium";
  return "weak";
};

const ChangeNewPassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enableMFA, setEnableMFA] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(newPassword);
  const confirmStrength = getPasswordStrength(confirmPassword);

  const isFormFilled = currentPassword && newPassword && confirmPassword;

  const handleUpdate = () => {
    console.log("Updated:", {
      currentPassword,
      newPassword,
      confirmPassword,
      enableMFA,
    });
  };

  return (
    <div className="change-password-container">
      <h2><MdSecurity size={20} /> Sign in & security</h2>

      <div className="form-group2">
        <label>Current password</label>
        <div className="input-with-icon">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
          <button onClick={() => setShowCurrent(!showCurrent)}>
            {showCurrent ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
      </div>

      <div className="form-group2">
        <label>New password</label>
        <div className="input-with-icon">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
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
        <label>Confirm new password</label>
        <div className="input-with-icon">
            <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            />
            <button onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
        </div>
        {confirmPassword && (
            confirmPassword === newPassword ? (
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


      {isFormFilled && (
        <div className="action-buttons3 left-align">
          <button className="cancel-btn3">Cancel</button>
          <button className="update-btn3" onClick={handleUpdate}>Update</button>
        </div>
      )}
    </div>
  );
};

export default ChangeNewPassword;

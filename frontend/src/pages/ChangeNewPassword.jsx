// ChangeNewPassword component
import React, { useState } from "react";
import ky from "ky";
import { useAuth } from "../context/AuthProvider.jsx";
import "../styles/ChangeNewPassword.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BiError } from "react-icons/bi";

const getPasswordStrength = (password) => {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const score = [hasLength, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (score === 4) return "strong";
  if (score >= 2) return "medium";
  return "weak";
};

// ChangeNewPassword component
function ChangeNewPassword({ showProviderNote }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const { currentPassword, newPassword, confirmPassword } = formData;
    const strength = getPasswordStrength(newPassword);
    const [enableMFA, setEnableMFA] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { accessToken, user, logout } = useAuth();
    const isGoogleUser = showProviderNote ?? !user?.phoneNumber;
    const navigate = useNavigate();
    const [isUpdating, setIsUpdating] = useState(false);

    const hasLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*]/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword;

    const isFormValid = !!currentPassword && passwordsMatch && hasLength && hasUpper && hasDigit && hasSpecial;

    // ADD: modal state for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    // ADD: confirmation modal state for password change
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // ADD: input/update helpers back in scope
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClearForm = () => {
        setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const handleUpdatePassword = async () => {
        if (!isFormValid) {
            toast.error("Please meet all password requirements before updating.", {
                description: "Minimum 8 chars, 1 uppercase, 1 number, 1 special (!@#$%^&*).",
            });
            return;
        }

        const toastId = toast.loading('Updating password...');
        setIsUpdating(true);
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
                toast.success('Password updated successfully!', { id: toastId, duration: 3000 });
                handleClearForm();
            } else {
                toast.error(message || 'Failed to update password', { id: toastId, duration: 3500 });
                console.log(message);
            }
        } catch (error) {
            let msg = 'Failed to update password';
            try {
                const errorJson = await error.response?.json();
                msg = errorJson?.message || msg;
            } catch {}
            toast.error(msg, { id: toastId, duration: 3500 });
            console.error(error);
        } finally {
            setShowPasswordConfirm(false);
            setIsUpdating(false);
        }
    };

    // ADD: delete account handler (invoked from modal confirm)
    const handleDeleteAccount = async () => {
        try {
            if (!user?.authProvider || user.authProvider === "password") {
                if (!formData?.currentPassword || formData.currentPassword.trim() === "") {
                    toast.error("Please enter your current password to delete your account.");
                    return;
                }
            }

            const payload = {
                password: user?.authProvider === "google" ? undefined : formData.currentPassword,
            };

            await ky
                .delete("/api/user/deleteAccount", {
                    json: payload,
                    headers: { Authorization: `Bearer ${accessToken}` },
                })
                .json();

            toast.success("Your account has been deleted.");
            setShowDeleteConfirm(false);
            await logout();
            navigate("/");
        } catch (err) {
            const msg = err?.response?.data?.message || "Failed to delete account.";
            toast.error(msg);
        }
    };

    return (
        <div className="change-password-container">
            {isGoogleUser && (
                <div className="auth-provider-note">
                    There is no password associated with this email address as you've signed up to Metaverse Trails 2.0 using another service (Google).
                </div>
            )}
            <h2><MdSecurity size={20} /> Sign In & Security</h2>
    
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
                        aria-describedby="password-requirements"
                        aria-invalid={!(hasLength && hasUpper && hasDigit && hasSpecial)}
                    />
                    <button onClick={() => setShowNew(!showNew)}>
                        {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                </div>
                {newPassword && (
                    <>
                        <div className={`strength-meter ${strength}`}>Strength: {strength}</div>
    
                        <ul id="password-requirements" className="password-requirements" aria-live="polite">
                            <li className={hasLength ? "ok" : "errors"}>At least 8 characters</li>
                            <li className={hasUpper ? "ok" : "errors"}>At least one uppercase letter</li>
                            <li className={hasDigit ? "ok" : "errors"}>At least one number</li>
                            <li className={hasSpecial ? "ok" : "errors"}>At least one special character (!@#$%^&*)</li>
                        </ul>
    
                        {/* {!(hasLength && hasUpper && hasDigit && hasSpecial) && (
                            <div className="password-error-msg">
                                Please include at least one special character and meet all requirements.
                            </div>
                        )} */}
                    </>
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
                        aria-invalid={!passwordsMatch}
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
    
            {(currentPassword || newPassword || confirmPassword) && (
                <div className="action-buttons3 left-align">
                    <button type="button" className="cancel-btn3" onClick={handleClearForm}>Cancel</button>
                    <button
                        type="button"
                        className="update-btn3"
                        onClick={() => setShowPasswordConfirm(true)}
                        disabled={!isFormValid}
                        aria-disabled={!isFormValid}
                    >
                        Update
                    </button>
                </div>
            )}
    
                <div className="mfa-toggle-wrapper">
                    <div className="delete-account-section">
                        <label><BiError size={25} className="delete-icon" /> Danger Zone</label>
                        <button type="button" onClick={() => setShowDeleteConfirm(true)}>
                            Delete Account
                        </button>
                    </div>
                </div>
    
                {showPasswordConfirm && (
                    <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="password-confirm-title">
                        <div className="confirm-modal">
                            <h4 id="password-confirm-title">Change your password?</h4>
                            <p>This action will update your account password.</p>
                            <div className="popup-actions">
                                <button className="modal-cancel-btn" onClick={() => setShowPasswordConfirm(false)}>Cancel</button>
                                <button
                                    className="modal-confirm-btn"
                                    onClick={handleUpdatePassword}
                                    disabled={!isFormValid || isUpdating}
                                    aria-disabled={!isFormValid || isUpdating}
                                    aria-busy={isUpdating}
                                >
                                    {isUpdating ? 'Updating...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
    
                {showDeleteConfirm && (
                    <div className="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
                        <div className="popup-content" style={{ maxWidth: "520px" }}>
                            <h3 id="delete-account-title">Confirm Account Deletion</h3>
                            <p>This will permanently remove your account and cannot be undone.</p>
                            <div className="action-buttons3" style={{ justifyContent: "center", marginTop: "1rem" }}>
                                <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                <button className="modal-delete-btn" onClick={handleDeleteAccount}>Confirm Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

export default ChangeNewPassword;

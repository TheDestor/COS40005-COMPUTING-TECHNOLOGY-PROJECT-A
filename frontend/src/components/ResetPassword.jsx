import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ky from 'ky';
import { toast } from 'sonner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import zxcvbn from 'zxcvbn';
import backgroundImg from '../assets/Kuching.png';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);

    const passwordsMatch = password && confirmPassword && password === confirmPassword;

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (newPassword) {
            const result = zxcvbn(newPassword);
            setPasswordStrength(result.score);
        } else {
            setPasswordStrength(null);
        }
    };

    const validatePassword = (password) => {
        const minLength = 8;
        const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;
        if (password.length < minLength) {
            return "Password must be at least 8 characters long.";
        }
        if (!regex.test(password)) {
            return "Password must include at least one uppercase letter, one number, and one special character.";
        }
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!passwordsMatch) {
            toast.error("Passwords do not match.");
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        if (passwordStrength < 2) { // Corresponds to "Fair", "Good", or "Strong"
            toast.error("Password is too weak. Please choose a stronger one.");
            return;
        }

        const promise = ky.post(`/api/auth/reset-password/${token}`, { json: { password } }).json();

        toast.promise(promise, {
            loading: 'Resetting your password...',
            success: (data) => {
                setTimeout(() => navigate('/login'), 3000);
                return data.message || "Password reset successfully! Redirecting to login...";
            },
            error: 'Failed to reset password. The link may have expired or is invalid.',
        });
    };

    return (
        <div className="overlay">
            <div className="login-wrapper2">
                <div className="login-image">
                    <img src={backgroundImg} alt="Background" />
                </div>
                <div className="login-container reset-container3">
                    <h2>Reset Your Password</h2>
                    <p>Your new password should meet the strength requirements below.</p>
                    <form onSubmit={handleSubmit} className="reset-form">
                        <div className="input-with-icon2">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={password}
                                onChange={handlePasswordChange}
                                className="input-field"
                                required
                            />
                            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        {password && (
                            <div className="password-strength">
                              Strength:{" "}
                              <span className={`strength-${passwordStrength}`}>
                                {["Very Weak", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
                              </span>
                            </div>
                        )}
                        <div className="input-with-icon2">
                            <input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                                required
                            />
                            <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                                {showConfirm ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        {password && confirmPassword && !passwordsMatch && (
                            <p className="error-message">Passwords do not match.</p>
                        )}
                        <div className="reset-buttons">
                            <button type="submit" className="btn-continue" disabled={!passwordsMatch}>
                                Reset Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
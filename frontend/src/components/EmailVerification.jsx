import { useState } from 'react';
import ky from 'ky';
import backgroundImg from '../assets/Kuching.png';
import '../styles/Loginpage.css';
import { toast } from 'sonner';

const EmailVerification = ({ onCancel }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        const promise = ky.post('/api/auth/forgot-password', { json: { email } }).json();

        toast.promise(promise, {
            loading: 'Sending password reset link...',
            success: (data) => {
                return data.message;
            },
            error: 'Failed to send password reset link.',
        });
    };

    return (
        <div className="overlay">
            <div className="login-wrapper">
                <div className="login-image">
                    <img src={backgroundImg} alt="Background" />
                </div>
                <div className="reset-container">
                    <button onClick={onCancel} className="close-btn95">✕</button>
                    <h2>Forgot Password</h2>
                    <p>Please enter your email address to receive a password reset link.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="reset-buttons">
                            <button type="button" className="btn-back" onClick={onCancel}>Cancel</button>
                            <button type="submit" className="btn-continue">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;
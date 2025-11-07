// LoginPage component (edits focus on imports, state, handlers, and JSX)
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/Loginpage.css';
import backgroundImg from '../assets/Kuching.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UserRegistration from './UserRegistration.jsx';
import BusinessRegistrationpage from './BusinessRegistrationpage.jsx';
import ForgotPasswordpage from './ForgetPasswordpage.jsx';
import { useAuth } from '../context/AuthProvider.jsx';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import ky from 'ky';

// LoginPage component
function LoginPage({ onClose }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [activeTab, setActiveTab] = useState('otp');
  const [otp, setOtp] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [confirmObj, setConfirmObj] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showUserRegister, setShowUserRegister] = useState(false);
  const [showBusinessRegister, setShowBusinessRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { identifier, password } = formData;
  const recaptchaRef = useRef(null);
  const captchaWidgetIdRef = useRef(null); // track rendered widget id
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState('');
  const captchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    const initRecaptcha = () => {
      if (!recaptchaRef.current || !window.grecaptcha || !captchaSiteKey) return;
      // Guard: do not render twice on the same element
      if (captchaWidgetIdRef.current !== null) return;

      const api = window.grecaptcha;
      const renderFn =
        typeof api.render === 'function'
          ? api.render
          : api.enterprise && typeof api.enterprise.render === 'function'
          ? api.enterprise.render
          : null;

      if (!renderFn) {
        setRecaptchaError('Verification unavailable. Please refresh or try again.');
        setRecaptchaToken(null);
        return;
      }

      // Capture widget id so we can guard or reset later
      const widgetId = renderFn(recaptchaRef.current, {
        sitekey: captchaSiteKey,
        size: window.innerWidth <= 420 ? 'compact' : 'normal',
        callback: (token) => {
          setRecaptchaToken(token);
          setRecaptchaError('');
        },
        'error-callback': () => {
          setRecaptchaError('reCAPTCHA failed, please try again.');
          setRecaptchaToken(null);
        },
        'expired-callback': () => {
          setRecaptchaError('reCAPTCHA expired, please verify again.');
          setRecaptchaToken(null);
        },
      });
      captchaWidgetIdRef.current = widgetId;
    };

    const hasRender =
      !!(
        window.grecaptcha &&
        (typeof window.grecaptcha.render === 'function' ||
          (window.grecaptcha.enterprise && typeof window.grecaptcha.enterprise.render === 'function'))
      );

    if (hasRender) {
      initRecaptcha();
      return;
    }

    if (!document.querySelector('script[src*="recaptcha/api.js"]')) {
      window.initRecaptcha = initRecaptcha;
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=initRecaptcha&render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else {
      window.initRecaptcha = initRecaptcha; // still idempotent because of the guard
    }

    return () => {
      // Optional cleanup: remove onload handler to avoid stray calls
      if (window.initRecaptcha === initRecaptcha) {
        window.initRecaptcha = undefined;
      }
    };
  }, [captchaSiteKey]);

  const handleTabClick = (tab) => setActiveTab(tab);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the reCAPTCHA verification.');
      toast.warning('Please verify you are not a robot.');
      return;
    }
    try {
      const result = await login(identifier, password, recaptchaToken);
      if (result.success) {
        let navigateTo = result.redirectTo;
        if (result.user?.role !== 'cbt_admin' && result.user?.role !== 'system_admin' && from !== '/') {
          navigateTo = from;
        }
        toast.success(result.message || 'Login successful!');
        setFormData({ identifier: '', password: '' });
        if (typeof onClose === 'function') onClose();
        navigate(navigateTo, { replace: true });
      } else {
        toast.error(result.message || 'Login failed. Please check credentials.');
      }
    } catch (error) {
      console.error('An error occured during login:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  // Google auth handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse || {};
      if (!credential) {
        toast.error('Google credential missing.');
        return;
      }
      const resp = await ky
        .post('/api/auth/google-login', { json: { credential }, credentials: 'include' })
        .json();

      if (resp?.success && resp?.accessToken) {
        try {
          localStorage.setItem(
            'postLoginToast',
            JSON.stringify({ type: 'success', message: 'Google login successful!' })
          );
        } catch {}
        window.location.reload();
        // toast after reload (handled globally)
      } else {
        toast.error(resp?.message || 'Google login failed.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      toast.error('Google authentication failed.');
    }
  };

  const handleGoogleError = () => toast.error('Google Sign-In was cancelled or failed.');

  // Read client id from Vite env
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Close button behavior: route-aware and state-preserving
  const handleClose = () => {
      // If used as an overlay/modal, just close it
      if (typeof onClose === 'function') {
          onClose();
          return;
      }
  
      const fromLocation = location.state?.from;
      const cameFromProtected = !!fromLocation; // ProtectedRoute passes state.from
  
      if (cameFromProtected) {
          // Requirement 1: protected page -> root
          navigate('/', { replace: true, state: { from: fromLocation } });
      } else {
          // Requirement 2/3/4: other pages -> go back (preserves state/params/query)
          if (window.history.length > 1) {
              navigate(-1);
          } else {
              // Fallback if no history
              navigate('/', { replace: true });
          }
      }
  };

  return (
    <div className="overlay">
      <div className="login-wrapper">
        <div className="login-image">
          <img src={backgroundImg} alt="login background" />
        </div>
        <div className="login-container">
          <div className="login-type-selector">
            <button className="close-btn95" onClick={handleClose} aria-label="Close login">✕</button>
          </div>

          {/* New welcoming header for better hierarchy */}
          <div className="lg-form-header">
            <h2>Sign in</h2>
            <p>Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-content">
            <div className="form-group100">
              <input
                id="identifier-input"
                type="text"
                className="input-field100"
                placeholder="Email/Phone Number"
                name="identifier"
                value={identifier}
                onChange={handleInputChange}
                aria-describedby="identifier-help"
                required
              />
              <small id="identifier-help" className="input-help">
                Include the country code +60 (e.g. +60123456789) for phone login.
              </small>
            </div>

            <div className="form-group100">
              <div className="input-with-icon">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="input-field100"
                  placeholder="Password"
                  name="password"
                  value={password}
                  onChange={handleInputChange}
                  required
                />
                <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="captcha-section">
              <div className="captcha-item">
                <div ref={recaptchaRef} className="g-recaptcha"></div>
              </div>
              {recaptchaError && <div className="captcha-error">{recaptchaError}</div>}
            </div>

            <button type="submit" className="login-button">Login</button>
          </form>

          {/* Divider for alternate sign-in */}
          <div className="section-divider"><span>Or continue with</span></div>

          <div className="google-login-container">
            {googleClientId ? (
              <GoogleOAuthProvider clientId={googleClientId}>
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
              </GoogleOAuthProvider>
            ) : (
              <span className="google-login-error">Google client ID not configured.</span>
            )}
          </div>

          <div className="bottom-links-row spaced-links">
            <span className="signup-text">
              Don’t have an account?{' '}
              <span className="signup-link" onClick={() => setShowUserRegister(true)}>Sign up</span>
            </span>
            <span className="forgot-password" onClick={() => setShowForgotPassword(true)}>
              Forgot Password?
            </span>
          </div>

          {showForgotPassword && (
            <ForgotPasswordpage onClose={() => setShowForgotPassword(false)} />
          )}
          {showUserRegister && (
            <UserRegistration
              onClose={() => setShowUserRegister(false)}
              onSwitchToLogin={() => setShowUserRegister(false)}
              onSwitchToBusiness={() => {
                setShowUserRegister(false);
                setShowBusinessRegister(true);
              }}
            />
          )}
          {showBusinessRegister && (
            <BusinessRegistrationpage
              onClose={() => setShowBusinessRegister(false)}
              onSwitchToLogin={() => setShowBusinessRegister(false)}
              onSwitchToUser={() => {
                setShowUserRegister(true);
                setShowBusinessRegister(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

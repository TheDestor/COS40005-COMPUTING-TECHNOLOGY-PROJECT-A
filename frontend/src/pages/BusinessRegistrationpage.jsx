import React, { useState, useEffect, useRef } from 'react';
import '../styles/UserRegistration.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import RegisterImage from '../assets/Kuching.png';
import { toast } from 'sonner';
import ky from 'ky';
import zxcvbn from 'zxcvbn';

const BusinessRegistrationpage = ({ onClose, onSwitchToLogin, onSwitchToUser }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaRef = useRef(null);
  const captchaWidgetIdRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState('');
  const captchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    const initRecaptcha = () => {
      if (!recaptchaRef.current || !window.grecaptcha || !captchaSiteKey) return;
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
      window.initRecaptcha = initRecaptcha;
    }

    return () => {
      if (window.initRecaptcha === initRecaptcha) {
        window.initRecaptcha = undefined;
      }
    };
  }, [captchaSiteKey]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    companyRegistrationNo: '',
    email: '',
    phonePrefix: '+60',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const { firstName, lastName, companyName, companyRegistrationNo, email, phonePrefix, phoneNumber, password, confirmPassword} = formData;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value.trimStart();

    if (name === 'phoneNumber') {
      nextValue = value.replace(/\D/g, '');
    } else if (name === 'companyRegistrationNo') {
      nextValue = value.replace(/\D/g, '').slice(0, 12);
    } else if (name === 'firstName' || name === 'lastName') {
      // allow only letters and '@', and limit to 20 characters
      nextValue = nextValue.replace(/[^A-Za-z@]/g, '').slice(0, 20);
    }

    setFormData(prev => ({
      ...prev,
      [name]: nextValue,
    }));

    if (name === 'password') {
      const result = zxcvbn(value);
      setPasswordStrength(result.score); // 0 (weakest) to 4 (strongest)
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const formElements = Array.from(
        e.currentTarget.closest('form')?.querySelectorAll('input, select') || []
      );
      const index = formElements.indexOf(e.target);
      if (index !== -1 && index < formElements.length - 1) {
        formElements[index + 1].focus();
      }
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;  // Example: At least 1 uppercase, 1 digit, and 1 special char
    if (password.length < minLength) {
      return "Password must be at least 8 characters long.";
    }
    if (!regex.test(password)) {
      return "Password must include at least one uppercase letter, one number, and one special character.";
    }
    return null;
  };

  const validateName = (name) => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > 20) return false; // enforce max 20
    const regex = /^(?=.*[A-Za-z])[A-Za-z@]+$/; // at least one letter; only letters and '@'
    return regex.test(trimmed);
  };  

  const validateCompanyRegistrationNo = (regNo) => {
    // Exactly 12 digits
    const regNoRegex = /^\d{12}$/;
    return regNoRegex.test(regNo);
  };  
  
  const isBusinessEmail = (email) => {
    const freeEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !freeEmailProviders.includes(domain);
  };

  const handleSuccess = (msg) => {
    toast.success(msg);
  };

  const handleError = (msg) => {
    toast.error(msg);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (isCooldown || isSubmitting) return;
         
    setIsSubmitting(true);

    if (!recaptchaToken) {
      setRecaptchaError('Please complete the reCAPTCHA verification.');
      resetSubmitState();
      return;
    }

    if (password !== confirmPassword) {
      handleError("Passwords do not match");
      resetSubmitState();
      return;
    }

    if (!validateName(firstName)) {
      handleError("First name cannot contain numbers. Use letters and special characters only.");
      resetSubmitState();
      return;
    }
    if (!validateName(lastName)) {
      handleError("Last name cannot contain numbers. Use letters and special characters only.");
      resetSubmitState();
      return;
    }
    if (!validateName(lastName)) {
      handleError("Last name must contain only letters (no spaces or special characters).");
      resetSubmitState();
      return;
    }   
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      handleError(passwordError);
      resetSubmitState();
      return;
    }

    if (passwordStrength < 2) {
      handleError("Password is too weak. Please choose a stronger one.");
      resetSubmitState();
      return;
    }
    
    if (!validateCompanyRegistrationNo(companyRegistrationNo)) {
      handleError("Invalid Company Registration Number! It must be numeric and exact 12 digits (no spaces or symbols).");
      resetSubmitState();
      return;
    }

    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

    const userData = {
      firstName, lastName, companyName, companyRegistrationNo,
      email, phoneNumber: fullPhoneNumber, password, recaptchaToken
    };

    try {
      const response = await ky.post(
        "/api/auth/businessRegister",
        {
          json: userData,
          credentials: 'include'
        }
      ).json();
      console.log(response);
      const { success, message } = response;
      
      if (success) {
        handleSuccess(message);
        setFormData({
          firstName: '', lastName: '', companyName: '',
          companyRegistrationNo: '', email: '', phonePrefix: '+60',
          phoneNumber: '', password: '', confirmPassword: ''
        });

        setFailedAttempts(0);
        onSwitchToLogin();
      } else {
        handleError(message);
        incrementFailedAttempts();
      }
    } catch (error) {
      console.error(error.response);
      if (error.response) {
        const errorJson = await error.response.json();
        handleError(errorJson.message);
        incrementFailedAttempts();
      }
    } finally {
      resetSubmitState();
    }
  };

  const incrementFailedAttempts = () => {
    setFailedAttempts(prev => {
      const updated = prev + 1;
      if (updated >= 3) {
        startCooldown();
      }
      return updated;
    });
  };
  
  const startCooldown = () => {
    setIsCooldown(true);
    setCooldownTimer(30); // 30 seconds lockout
  
    const interval = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCooldown(false);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetSubmitState = () => {
    setTimeout(() => {
      setIsSubmitting(false);
    }, 2000); // 2 seconds
  };   

  return (
    <div className="registration-overlay">
      <div className="registration-container">
        <div className="registration-left">
          <img src={RegisterImage} alt="Registration Art" />
        </div>

        <div className="registration-right">
          <div className="tabs2">
            <span className="inactive-tab3" onClick={ onSwitchToUser }>User Registration</span>
            <span className="active-tab">Business Registration</span>
            <span className="close-btn2" onClick={onClose}>&times;</span>
          </div>

          <form className="registration-form" onSubmit={handleRegisterSubmit} onKeyDown={handleKeyDown}>
            <div className="form-row-register2">
              <input
                type="text"
                className="input-field"
                name="firstName"
                title="Up to 20 characters; only letters and '@'."
                placeholder="First Name"
                value={firstName}
                onChange={handleInputChange}
                pattern="^(?=.*[A-Za-z])[A-Za-z@]+$"
                maxLength={20}
                required
              />
              <input
                type="text"
                className="input-field"
                name="lastName"
                title="Up to 20 characters; only letters and '@'."
                placeholder="Last Name"
                value={lastName}
                onChange={handleInputChange}
                pattern="^(?=.*[A-Za-z])[A-Za-z@]+$"
                maxLength={20}
                required
              />
            </div>

            <div className="form-row-register2">
              <input type="text" className="input-field" name="companyName" placeholder="Company Name" value={companyName} onChange={handleInputChange} required />
              <input
                type="text"
                className="input-field"
                name="companyRegistrationNo"
                placeholder="Company Registration No."
                value={companyRegistrationNo}
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="^[0-9]{12}$"
                maxLength={12}
                title="Exactly 12 digits, numbers only."
                required
              />
            </div>

            <div className="form-row-register2">
              <input type="email" className="input-field" name="email" title="Company email" placeholder="Company Email" value={email} onChange={handleInputChange} required />
            </div>

            <div className="form-row-register2">
              <div className="phone-input-wrapper">
                <select name="phonePrefix" value={phonePrefix} onChange={handleInputChange}>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+86">🇨🇳 +86</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+91">🇮🇳 +91</option>
                </select>
                <input type="tel" name="phoneNumber" placeholder="Contact Number" value={phoneNumber} onChange={handleInputChange} pattern="[0-9]*" title="Only numbers are allowed." required />
              </div>
            </div>

            <div className="form-row-register2">
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field"
                  title="Password at least 8 characters long"
                  placeholder="Password"
                  value={password}
                  onChange={handleInputChange}
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {password && (
              <div className="password-strength">
                Strength:{' '}
                <span className={`strength-${passwordStrength}`}>
                  {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]}
                </span>
              </div>
            )}

            <div className="form-row-register2">
             <div className="password-input">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className="input-field"
                  title="Confirm password at least 8 characters long"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={handleInputChange}
                />
                <span onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {confirmPassword && (
              <div
                className="password-match-register"
                role="status"
                aria-live="polite"
                style={{
                  marginTop: '-10px',
                  fontSize: '14px',
                  marginLeft: '8px',
                  color: password === confirmPassword ? '#16a34a' : '#dc2626'
                }}
              >
                {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}

            <div className="captcha-section">
              <div className="captcha-item">
                <div ref={recaptchaRef} className="g-recaptcha" aria-label="reCAPTCHA"></div>
              </div>
              {recaptchaError && (
                <div className="captcha-error" role="alert" aria-live="polite">{recaptchaError}</div>
              )}
            </div>

            <button
              type="submit"
              className="register-btn"
              disabled={isCooldown || isSubmitting}
              style={{
                opacity: isCooldown || isSubmitting ? 0.6 : 1,
                cursor: isCooldown || isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isCooldown ? `Try again in ${cooldownTimer}s` : isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="signin-link">
            Already have an account?{" "}
            <span onClick={onSwitchToLogin}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegistrationpage;

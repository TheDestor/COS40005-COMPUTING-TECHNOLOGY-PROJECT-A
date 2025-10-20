import React, { useState, useEffect, useRef } from 'react';
  import '../styles/UserRegistration.css';
  import { FaEye, FaEyeSlash } from 'react-icons/fa';
  import RegisterImage from '../assets/Kuching.png';
  import ky from 'ky';
  import { toast } from "sonner";
  import zxcvbn from 'zxcvbn';

  const UserRegistration = ({ onClose, onSwitchToLogin, onSwitchToBusiness }) => {
    // Password state
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

    // Form input values state
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phonePrefix: '+60', // Default
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    });

    // Destructure all the inputs into a single variable
    const { firstName, lastName, email, phonePrefix, phoneNumber, password, confirmPassword } = formData;

    // Handle input change
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      let nextValue = value.trimStart();

      if (name === 'firstName' || name === 'lastName') {
        // allow only letters and '@', and limit to 20 characters
        nextValue = nextValue.replace(/[^A-Za-z@]/g, '').slice(0, 20);
      } else if (name === 'phoneNumber') {
        // digits only for phone number
        nextValue = value.replace(/\D/g, '');
      }

      setFormData({
        ...formData,
        [name]: nextValue,
      });

      if (name === 'password') {
        const result = zxcvbn(nextValue);
        setPasswordStrength(result.score); // 0 (weakest) to 4 (strongest)
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        const formElements = Array.from(e.currentTarget.closest('form')?.querySelectorAll('input, select') || []);
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
      if (trimmed.length === 0 || trimmed.length > 20) return false; // enforce <= 20 chars
      const regex = /^(?=.*[A-Za-z])[A-Za-z@]+$/; // at least one letter; only letters and '@'
      return regex.test(trimmed);
    };  

    // Toast success
    const handleSuccess = (msg) => {
      toast.success(msg);
    };

    // Toast error
    const handleError = (msg) => {
      toast.error(msg);
    };

    // Registration API call
    const handleRegisterSubmit = async (e) => {
      e.preventDefault(); // Prevent default submission

      if (isCooldown || isSubmitting) return;

      setIsSubmitting(true);

      if (password !== confirmPassword) {
        handleError("Passwords do not match.");
        resetSubmitState();
        return;
      }

      if (!validateName(firstName)) {
        handleError("First name must contain only letters (no spaces or special characters).");
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
      
      if (!recaptchaToken) {
        setRecaptchaError('Please complete the reCAPTCHA verification.');
        resetSubmitState();
        return;
      }
    
      // Combine the prefix and phone number together
      const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
      
      // Pack all input values together
      const userData = {
        firstName,
        lastName,
        email,
        phoneNumber: fullPhoneNumber,
        password,
        recaptchaToken
      }

      // POST API call to backend for registration
      try {
        const response = await ky.post("/api/auth/register", {
          json: userData,
          credentials: 'include'
        }).json();
        const { success, message } = response;
        if (success) {
          handleSuccess(message);
          // Clear the form after a successful registration
          setFormData({
            firstName: '', lastName: '', email: '',
            phonePrefix: '+60', phoneNumber: '',
            password: '', confirmPassword: '',
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
          console.error(errorJson.message);
          handleError(errorJson.message)
          incrementFailedAttempts();
        }
      } finally {
        resetSubmitState();
      }
    }

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
            <div className="tabs">
              <span className="active-tab">User Registration</span>
              <span className="inactive-tab2" onClick={ onSwitchToBusiness }>Business Registration</span>
              <span className="close-btn2"  onClick={onClose}>&times;</span>
            </div>

            <form className="registration-form" onSubmit={handleRegisterSubmit} onKeyDown={handleKeyDown}>
              <div className="form-row-register">
                <input
                  className='input-field'
                  type="text"
                  title="Up to 20 characters; only letters and '@'."
                  placeholder="First Name"
                  name="firstName"
                  value={firstName}
                  onChange={handleInputChange}
                  pattern="^(?=.*[A-Za-z])[A-Za-z@]+$"
                  maxLength={20}
                  required
                />
                <input
                  className='input-field'
                  type="text"
                  title="Up to 20 characters; only letters and '@'."
                  placeholder="Last Name"
                  name="lastName"
                  value={lastName}
                  onChange={handleInputChange}
                  pattern="^(?=.*[A-Za-z])[A-Za-z@]+$"
                  maxLength={20}
                  required
                />
              </div>
              <div className="form-row-register">
                <input className='input-field' type="email" placeholder="Email" title="Email" name="email" value={email} onChange={handleInputChange} required/>
              </div>
              <div className="form-row-register">
                  <div className="phone-input-wrapper">
                      <select 
                        // defaultValue="+60"
                        name="phonePrefix"
                        value={phonePrefix}
                        onChange={handleInputChange}
                      >
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <input type="tel" placeholder="Phone Number" name="phoneNumber" value={phoneNumber} onChange={handleInputChange} pattern="[0-9]*" title="Only numbers are allowed." required/>
                  </div>
              </div>
              <div className="form-row-register">
                <div className="password-input">
                  <input
                    className='input-field'
                    type={showPassword ? 'text' : 'password'}
                    title="Password at least 8 characters long"
                    placeholder="Password"
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    required
                  />
                  <span onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              {password && (
                <div className="password-strength">
                  Strength:{" "}
                  <span className={`strength-${passwordStrength}`}>
                    {["Very Weak", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
                  </span>
                </div>
              )}
              <div className="form-row-register">
                  <div className="password-input">
                      <input
                        className='input-field'
                        type={showConfirm ? 'text' : 'password'}
                        title="Confirm password at least 8 characters long"
                        placeholder="Confirm password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={handleInputChange}
                        required
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
              Already have an account?{" "}  <span onClick={onSwitchToLogin}>Sign in</span>
            </p>
          </div>
        </div>  
      </div>
    );
  };

  export default UserRegistration;

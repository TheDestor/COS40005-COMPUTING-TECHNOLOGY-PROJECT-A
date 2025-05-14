  import React, { useState } from 'react';
  import '../styles/UserRegistration.css';
  import { FaEye, FaEyeSlash } from 'react-icons/fa';
  import RegisterImage from '../assets/Kuching.png';
  import ky from 'ky';
  import { toast } from "react-toastify";
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
      setFormData({
        ...formData,
        [name]: value.trimStart(),
      });

      if (name === 'password') {
        const result = zxcvbn(value);
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
      const nameRegex = /^[A-Za-z]+$/;
      return nameRegex.test(name);
    };  

    // Toast success
    const handleSuccess = (msg) => {
      toast.success(msg, {
        position: "bottom-right",
      });
    };

    // Toast error
    const handleError = (msg) => {
      toast.error(msg, {
        position: "bottom-right",
      });
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
    
      // Combine the prefix and phone number together
      const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
      
      // Pack all input values together
      const userData = {
        firstName,
        lastName,
        email,
        phoneNumber: fullPhoneNumber,
        password
      }

      // POST API call to backend for registration
      try {
        const response = await ky.post(
          "/api/auth/register",
          {
            json: userData ,
            credentials: 'include'
          }
        ).json();
        const { success, message } = response;
        if (success) {
          handleSuccess(message);
          // Clear the form after a successful registration
          setFormData({
            firstName: '', lastName: '', email: '',
            phoneCountryCode: '+60', phoneNumber: '',
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
              <div className="form-row">
                <input className='input-field' type="text" title="First Name" placeholder="First Name" name="firstName" value={firstName} onChange={handleInputChange} required/>
                <input className='input-field' type="text" title="Last Name" placeholder="Last Name" name="lastName" value={lastName} onChange={handleInputChange} required/>
              </div>
              <div className="form-row">
                <input className='input-field' type="email" placeholder="Email" title="Email" name="email" value={email} onChange={handleInputChange} required/>
              </div>
              <div className="form-row">
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
              <div className="form-row">
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
              <div className="form-row">
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

import React, { useState } from 'react';
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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    companyRegistrationNo: '',
    email: '',
    phonePrefix: '+60',
    phoneNumber: '',
    companyAddress: '',
    password: '',
    confirmPassword: ''
  });

  const { firstName, lastName, companyName, companyRegistrationNo, email, phonePrefix, phoneNumber, companyAddress, password, confirmPassword} = formData;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trimStart(),
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
    const nameRegex = /^[A-Za-z]+$/;
    return nameRegex.test(name);
  };  

  const validateCompanyRegistrationNo = (regNo) => {
    const regNoRegex = /^\d{4}\d{2}\d{6}$/;
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

    if (password !== confirmPassword) {
      handleError("Passwords do not match");
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
    

    if (!validateCompanyRegistrationNo(companyRegistrationNo)) {
      handleError("Invalid Company Registration Number! It must be numeric and exact 12 digits (no spaces or symbols).");
      resetSubmitState();
      return;
    }
    
    // if (!isBusinessEmail(email)) {
    //   handleError("Please use a business email address (e.g., not Gmail, Yahoo, etc.).");
    //   resetSubmitState();
    //   return;
    // }
    

    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

    const userData = {
      firstName, lastName, companyName, companyRegistrationNo,
      email, phoneNumber: fullPhoneNumber, companyAddress, password
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
          phoneNumber: '', companyAddress: '', password: '', confirmPassword: ''
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
            <div className="form-row2">
              <input type="text" className="input-field" name="firstName" title="First Name" placeholder="First Name" value={firstName} onChange={handleInputChange} required />
              <input type="text" className="input-field" name="lastName" title="Last Name" placeholder="Last Name" value={lastName} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
              <input type="text" className="input-field" name="companyName" title="Company name" placeholder="Company Name" value={companyName} onChange={handleInputChange} required />
              <input type="text" className="input-field" name="companyRegistrationNo" title="Registration number must exact 12 digits" placeholder="Company Registration No." maxLength="12" value={companyRegistrationNo} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
              <input type="email" className="input-field" name="email" title="Company email" placeholder="Company Email" value={email} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
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

            <div className="form-row2">
              <input type="text" className="input-field" name="companyAddress" placeholder="Company Address" value={companyAddress} onChange={handleInputChange} required />
            </div>

            <div className="form-row2">
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

            {password && (
              <div className="password-strength">
                Strength:{" "}
                <span className={`strength-${passwordStrength}`}>
                  {["Very Weak", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
                </span>
              </div>
            )}

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

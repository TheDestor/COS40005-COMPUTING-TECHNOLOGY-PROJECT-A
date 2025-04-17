import React, { useState, useEffect } from 'react';
import '../styles/Loginpage.css';
import backgroundImg from '../assets/Kuching.png';

const OTPVerification = ({ onNext, onBack, phone }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]*$/.test(value)) return; // Only allow digits
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    // Auto-focus next input
    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can add validation or API call here
    onNext();
  };

  const handleResend = () => {
    if (canResend) {
      // Trigger resend logic
      console.log('Resend OTP');
      setTimer(60);
      setCanResend(false);
    }
  };

  return (
    <div className="overlay">
      <div className="login-wrapper2">
        <div className="login-image">
          <img src={backgroundImg} alt="Background" />
        </div>
        <div className="login-container reset-container2">
          <h2>Enter Verification Code</h2>
          <p>We have sent a code to <strong>{phone}</strong></p>

          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-box-wrapper">
              {otp.map((digit, idx) => (
                <input
                  inputMode="numeric"
                  pattern="\d*"
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                />
              ))}
            </div>

            <div className="resend-section">
              Haven’t received any code?
              <a
                onClick={handleResend}
                style={{ cursor: canResend ? 'pointer' : 'not-allowed', opacity: canResend ? 1 : 0.5 }}
              >
                Resend code
              </a>
              {timer > 0 && `${timer}s`}
            </div>

            <div className="reset-buttons">
              <button type="button" className="btn-back" onClick={onBack}>Back</button>
              <button type="submit" className="btn-continue">Verify Now</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;

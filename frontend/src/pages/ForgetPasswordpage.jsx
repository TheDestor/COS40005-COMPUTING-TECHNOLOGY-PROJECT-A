import React, { useState } from 'react';
import EmailVerification from '../components/EmailVerification.jsx';
import OTPVerification from '../components/OTPVerification.jsx';
import ResetPassword from '../components/ResetPassword.jsx';
import '../styles/Loginpage.css'; // Reuse the same styling

const ForgotPasswordpage = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="overlay">
      <div className="login-wrapper">
        <div className="login-container">
          <button className="close-btn" onClick={onClose}>✕</button>
          {step === 1 && <EmailVerification onNext={nextStep} setEmail={setUserEmail} />}
          {step === 2 && <OTPVerification onNext={nextStep} onBack={prevStep} email={userEmail} />}
          {step === 3 && <ResetPassword email={userEmail} />}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordpage;

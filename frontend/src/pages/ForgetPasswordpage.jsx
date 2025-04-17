import React, { useState } from 'react';
import PhoneVerification from '../components/PhoneVerification.jsx';
import OTPVerification from '../components/OTPVerification.jsx';
import ResetPassword from '../components/ResetPassword.jsx';
import '../styles/Loginpage.css'; // Reuse the same styling

const ForgotPasswordpage = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [userPhone, setUserPhone] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="overlay">
      <div className="login-wrapper2">
        <div className="login-container">
          <button className="close-btn" onClick={onClose}>✕</button>
          {step === 1 && <PhoneVerification onNext={nextStep} setPhone={setUserPhone} onCancel={onClose} />}
          {step === 2 && <OTPVerification onNext={nextStep} onBack={prevStep} phone={userPhone} />}
          {step === 3 && <ResetPassword phone={userPhone} onCancel={onClose}/>}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordpage;

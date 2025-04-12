import React, { useState } from 'react';
import EmailVerification from '../components/EmailVerification.jsx';
import OTPVerification from '../components/OTPVerification.jsx';
import ResetPassword from '../components/ResetPassword.jsx';
import '../styles/Loginpage.css'; // Import your CSS file for styling

const ForgotPasswordpage = () => {
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <>
      {step === 1 && <EmailVerification onNext={nextStep} setEmail={setUserEmail} />}
      {step === 2 && <OTPVerification onNext={nextStep} onBack={prevStep} email={userEmail} />}
      {step === 3 && <ResetPassword email={userEmail} />}
    </>
  );
};

export default ForgotPasswordpage;

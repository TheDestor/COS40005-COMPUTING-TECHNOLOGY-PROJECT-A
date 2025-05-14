import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import animationData from '../assets/Animation - 1746770439690.json';
import '../styles/ErrorPage.css';

function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <Lottie animationData={animationData} loop={true} className="lottie-error" />
      <h1>Error 404</h1>
      <p>The page you are looking for doesn’t exist or an unexpected error occurred.</p>
      <button className="back-home" onClick={() => navigate('/')}>Return to Home</button>
    </div>
  );
}

export default ErrorPage;

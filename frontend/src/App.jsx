// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Homepage.jsx';
import UserRegistration from './pages/UserRegistration.jsx';
import LoginPage from './pages/Loginpage.jsx';
import BusinessRegistration from './pages/BusinessRegistrationpage.jsx';
import Footer from './components/Footer.jsx';

import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5050/api/test')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setMessage(data.message);
        setError('');
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError('Failed to fetch message from backend. Is the backend server running?');
        setMessage('');
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<UserRegistration />} />
        <Route path="/business-register" element={<BusinessRegistration />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/footer" element={<Footer />} />
      </Routes>
    </Router>
  );
}

export default App;
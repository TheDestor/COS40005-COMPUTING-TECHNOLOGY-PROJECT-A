// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Homepage.jsx';
import UserRegistration from './pages/UserRegistration.jsx';
import ContactUs from './pages/ContactUs.jsx';
import LoginPage from './pages/Loginpage.jsx';
import BusinessRegistration from './pages/BusinessRegistrationpage.jsx';
import Footer from './components/Footer.jsx';
import ForgetPassword from './pages/ForgetPasswordpage.jsx';
import SettingPage from './pages/Settingpage.jsx';
import ProfileSettingPage from './pages/ProfileSettingpage.jsx';
import SystemAdminpage from './pages/SystemAdminpage.jsx';
import BookmarkPage from './pages/Bookmarkpage.jsx';
import './App.css';
import ShowAllCategoryPage from './pages/ShowAllCategorypage.jsx';

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
        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route path="/settings" element={<SettingPage />} />
        <Route path="/system-admin" element={<SystemAdminpage />} />
        <Route path="/profile-settings" element={<ProfileSettingPage />} />
        <Route path="/bookmark" element={<BookmarkPage />} />
        <Route path="/showallcategory" element={<ShowAllCategoryPage />} />
        <Route path="/contact-us" element={<ContactUs />} /> 
      </Routes>
    </Router>
  );
}

export default App;
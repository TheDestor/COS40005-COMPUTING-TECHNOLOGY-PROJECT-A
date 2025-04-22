// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider.jsx';
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
import MajorTownPage from './pages/MajorTownPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import DashboardPage from './pages/DashboardPage';
import ViewAnalytics from './pages/ViewAnalytics.jsx';
import ViewInquiry from './pages/ViewInquiry.jsx';

function App() {

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<UserRegistration />} />
          <Route path="/business-register" element={<BusinessRegistration />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/footer" element={<Footer />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/system-admin" element={<SystemAdminpage />} />
          <Route path="/profile-settings" element={<ProfileSettingPage />} />
          <Route path="/bookmark" element={<BookmarkPage />} />
          <Route path="/major-town" element={<MajorTownPage />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/view-analytics" element={<ViewAnalytics />} />
          <Route path="/view-inquiry" element={<ViewInquiry />} />
          {/* <Route path="/write-review" element={<WriteReviewForm />} /> */}
          {/* Add more routes as needed */}

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
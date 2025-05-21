// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider.jsx';
import { BookmarkProvider } from './context/BookmarkProvider.jsx';
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
import AddEventPage from './pages/AddEventPage.jsx';
import BusinessManagementPage from './pages/BusinessManagementPage.jsx';
import BusinessSubmissionForm from './pages/BusinessSubmissionForm.jsx';
import AttractionsPage from './pages/AttractionsPage.jsx';
import MuseumPage from './pages/MuseumPage.jsx';
import NationalParkPage from './pages/NationalParkPage.jsx';
import AirportPage from './pages/AirportPage.jsx';
import BeachPage from './pages/BeachPage.jsx';
import CategoryDetailsPage from './pages/CategoryDetailsPage.jsx';
import Eventpage from './pages/EventPage.jsx'
import ManageLocation from './pages/ManageLocation.jsx';
import ManageReviews from './pages/ManageReviews.jsx';
import DiscoverPlaces from './pages/DiscoverPlaces.jsx';
import ProtectedRoute from './components/ProtectedRoutes.jsx';
import ErrorPage from './pages/ErrorPage.jsx';
import SharePlace from './components/SharePlace.jsx';
import TourGuides from './pages/TourGuidesPage.jsx';

function App() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <Router>
          <Routes>
            <Route path="/register" element={<UserRegistration />} />
            <Route path="/business-register" element={<BusinessRegistration />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/footer" element={<Footer />} />
            <Route path="/forget-password" element={<ForgetPassword />} />
            <Route path="/settings" element={<SettingPage />} />
            <Route path="/major-towns" element={<MajorTownPage />} />
            <Route path="/attractions" element={<AttractionsPage />} />
            <Route path="/museum" element={<MuseumPage />} />
            <Route path="/national-parks" element={<NationalParkPage />} />
            <Route path="/airport" element={<AirportPage />} />
            <Route path="/beach" element={<BeachPage />} />
            <Route path="/tourguides" element={<TourGuides />} />
            <Route path="/event" element={<Eventpage />} />
            <Route path="/towns/:slug" element={<CategoryDetailsPage />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/business-submission" element={<BusinessSubmissionForm />} />
            <Route path="/discover/:slug" element={<DiscoverPlaces />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/share" element={<SharePlace />} />
            {/* <Route path="/write-review" element={<WriteReviewForm />} /> */}
            {/* Add more routes as needed */}

            <Route element={<ProtectedRoute />}>
              <Route path="/profile-settings" element={<ProfileSettingPage />} />
              <Route path="/bookmark" element={<BookmarkPage />} />
            </Route>
  
            <Route element={<ProtectedRoute allowedRoles={["cbt_admin"]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/view-inquiry" element={<ViewInquiry />} />
              <Route path="/view-analytics" element={<ViewAnalytics />} />
              <Route path="/manage-reviews" element={<ManageReviews />} />
              <Route path="/add-event" element={<AddEventPage />} />
              <Route path="/business-management" element={<BusinessManagementPage />} />
              <Route path="/manage-location" element={<ManageLocation />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["system_admin"]} />}>
              <Route path="/system-admin" element={<SystemAdminpage />} />
            </Route>
          </Routes>
        </Router>
      </BookmarkProvider>
    </AuthProvider>
  );
}

export default App;
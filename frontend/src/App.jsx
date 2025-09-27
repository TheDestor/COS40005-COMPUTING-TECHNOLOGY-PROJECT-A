// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider.jsx';
import { BookmarkProvider } from './context/BookmarkProvider.jsx';

import './App.css';
import 'leaflet/dist/leaflet.css'; 
import ProtectedRoute from './components/ProtectedRoutes.jsx';

// Testing component
import  MapComponentTesting from './components/MapComponentTesting.jsx';

// Other Pages
import ErrorPage from './pages/ErrorPage.jsx';
import SharePlace from './components/SharePlace.jsx';
import Footer from './components/Footer.jsx';

// Login and Register Pages
import LoginPage from './pages/Loginpage.jsx';
import UserRegistration from './pages/UserRegistration.jsx';
import BusinessRegistration from './pages/BusinessRegistrationpage.jsx';
import ForgetPassword from './pages/ForgetPasswordpage.jsx';

// Map Components Pages
// import HomePage from './pages/Homepage.jsx';
import SettingPage from './pages/Settingpage.jsx';
import ProfileSettingPage from './pages/ProfileSettingpage.jsx';
import BookmarkPage from './pages/Bookmarkpage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import ContactUs from './pages/ContactUs.jsx';
import BusinessSubmissionForm from './pages/BusinessSubmissionForm.jsx';
import ManageBusiness from './pages/ManageBusiness.jsx';

// Place Information Pages
import MajorTownPage from './pages/MajorTownPage.jsx';
import TourGuides from './pages/TourGuidesPage.jsx';
import AttractionsPage from './pages/AttractionsPage.jsx';
import ShoppingsPage from './pages/ShoppingsPage.jsx';
import FoodPage from './pages/FoodPage.jsx';
import Transportation from './pages/TransportationPage.jsx';
import AccomodationPage from './pages/AccomodationPage.jsx';
import Eventpage from './pages/EventPage.jsx'
import CategoryDetailsPage from './pages/CategoryDetailsPage.jsx';
import DiscoverPlaces from './pages/DiscoverPlaces.jsx';

// CBT Admin Pages
import DashboardPage from './pages/DashboardPage';
import ViewAnalytics from './pages/ViewAnalytics.jsx';
import ViewInquiry from './pages/ViewInquiry.jsx';
import AddEventPage from './pages/AddEventPage.jsx';
import PastEventsPage from './pages/PastEventsPage.jsx';
import ScheduleEventsPage from './pages/ScheduleEventsPage.jsx';
import BusinessManagementPage from './pages/BusinessManagementPage.jsx';
import ManageLocation from './pages/ManageLocation.jsx';
//import ManageReviews from './pages/ManageReviews.jsx';

// System Admin Pages
import SystemAdminSidebar from './pages/SystemAdminSidebar.jsx';
import SystemAdminDashboard from './pages/SystemAdminDashboard.jsx';
import UserManagementPage from './pages/UserManagementpage.jsx';
import DataManagementPage from './pages/DataManagementpage.jsx';
import SystemMonitoringPage from './pages/SystemMonitoringpage.jsx';
import SecurityAdminPage from './pages/SecurityAdminpage.jsx';

function App() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MapComponentTesting />} />
            {/* <Route path="/testing" element={<MapComponentTesting />} /> */}

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<UserRegistration />} />
            <Route path="/business-register" element={<BusinessRegistration />} />
            
            <Route path="/footer" element={<Footer />} />
            <Route path="/forget-password" element={<ForgetPassword />} />
            <Route path="/settings" element={<SettingPage />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/business-submission" element={<BusinessSubmissionForm />} />
            <Route path="/manage-business" element={<ManageBusiness />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/share" element={<SharePlace />} />

            <Route path="/major-towns" element={<MajorTownPage />} />
            <Route path="/attractions" element={<AttractionsPage />} />
            <Route path="/shopping" element={<ShoppingsPage />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/transportation" element={<Transportation />} />
            <Route path="/accomodation" element={<AccomodationPage />} />
            <Route path="/tourguides" element={<TourGuides />} />
            <Route path="/event" element={<Eventpage />} />
            <Route path="/towns/:slug" element={<CategoryDetailsPage />} />
            <Route path="/discover/:slug" element={<DiscoverPlaces />} />

            {/* Login User routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile-settings" element={<ProfileSettingPage />} />
              <Route path="/bookmark" element={<BookmarkPage />} />
            </Route>

            {/* CBT Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={["cbt_admin"]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/view-inquiry" element={<ViewInquiry />} />
              <Route path="/view-analytics" element={<ViewAnalytics />} />
              {/*<Route path="/manage-reviews" element={<ManageReviews />} />*/}
              <Route path="/add-event" element={<AddEventPage />} />
              <Route path="/past-events" element={<PastEventsPage />} />
              <Route path="/schedule-events" element={<ScheduleEventsPage />} />
              <Route path="/business-management" element={<BusinessManagementPage />} />
              <Route path="/manage-location" element={<ManageLocation />} />
            </Route>

            {/* System Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={["system_admin"]} />}>
              <Route path="/system-admin" element={<SystemAdminSidebar />} />
              <Route path="/admin-dashboard" element={<SystemAdminDashboard />} />
              <Route path="/user-management" element={<UserManagementPage />} />
              <Route path="/data-management" element={<DataManagementPage />} />
              <Route path="/system-monitoring" element={<SystemMonitoringPage />} />
              <Route path="/security-admin" element={<SecurityAdminPage />} />
            </Route>
          </Routes>
        </Router>
      </BookmarkProvider>
    </AuthProvider>
  );
}

export default App;
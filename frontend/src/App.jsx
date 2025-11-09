// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider.jsx';
import { BookmarkProvider } from './context/BookmarkProvider.jsx';
import { SeniorModeProvider } from './context/SeniorModeProvider.jsx';

import './App.css';
import 'leaflet/dist/leaflet.css'; 
import ProtectedRoute from './components/ProtectedRoutes.jsx';

// Map component
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
import ResetPasswordPage from './components/ResetPassword.jsx';

// Map Components Pages
// import HomePage from './pages/Homepage.jsx';
import SettingPage from './pages/Settingpage.jsx';
import ProfileSettingPage from './pages/ProfileSettingpage.jsx';
import BookmarkPage from './pages/Bookmarkpage.jsx';
// import ReviewPage from './pages/ReviewPage.jsx';
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

// Helper: press Enter in an autocomplete input to pick the first suggestion
const AutocompleteEnterSelectFirst = () => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Enter') return;

      const activeEl = document.activeElement;
      if (!activeEl || activeEl.tagName.toLowerCase() !== 'input') return;

      // Find a dropdown that belongs to the active input
      const findDropdownNearInput = (input) => {
        let node = input.parentElement;
        while (node) {
          const photon = node.querySelector('.photon-autocomplete-dropdown');
          if (photon && photon.children && photon.children.length > 0) {
            return { type: 'photon', el: photon };
          }
          const recent = node.querySelector('.recent-dropdown5');
          if (recent && recent.children && recent.querySelector('.recent-item5')) {
            return { type: 'searchbar', el: recent };
          }
          node = node.parentElement;
        }
        return null;
      };

      const dropdown = findDropdownNearInput(activeEl);
      if (!dropdown) return;

      e.preventDefault();
      e.stopPropagation();

      if (dropdown.type === 'photon') {
        const firstItem = dropdown.el.children[0];
        if (firstItem && typeof firstItem.click === 'function') {
          firstItem.click();
        }
      } else if (dropdown.type === 'searchbar') {
        const firstItem = dropdown.el.querySelector('.recent-item5');
        if (firstItem) {
          // Component uses onMouseDown to select; dispatch that event
          const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          firstItem.dispatchEvent(event);
        }
      }
    };

    // Use capture to run before React synthetic handlers
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <SeniorModeProvider>
          <Router>
            {/* Skip to content link for screen readers and keyboard users */}
            <a
                href="#main-content"
                className="skip-link"
                aria-label="Skip to main content"
            >
                Main content
            </a>
            <SessionVisitorTracker />
            <KeyboardActivate />
            <AutocompleteEnterSelectFirst />
            <PageContentAnnouncer />
            {/* Landmark: Main content for NVDA/ARIA */}
            <div id="main-content" role="main" aria-label="Main content">
              <Routes>
                <Route path="/" element={<MapComponentTesting />} />
                {/* <Route path="/testing" element={<MapComponentTesting />} /> */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<UserRegistration />} />
                <Route path="/business-register" element={<BusinessRegistration />} />
            
                <Route path="/footer" element={<Footer />} />
                <Route path="/forget-password" element={<ForgetPassword />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/settings" element={<SettingPage />} />
                <Route path="/contact-us" element={<ContactUs />} />
                {/* <Route path="/review" element={<ReviewPage />} /> */}
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
            </div>
          </Router>
        </SeniorModeProvider>
      </BookmarkProvider>
    </AuthProvider>
  );
}

function SessionVisitorTracker() {
  useEffect(() => {
    if (sessionStorage.getItem('uvc:boot_recorded')) return;
    sessionStorage.setItem('uvc:boot_recorded', '1');

    fetch('/api/metrics/unique-visitor', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('postLoginToast');
      if (raw) {
        const { type, message } = JSON.parse(raw) || {};
        if (type === 'success') {
          toast.success(message || 'Login successful!');
        } else if (type === 'error') {
          toast.error(message || 'Login failed.');
        } else {
          toast.info(message || 'Action completed.');
        }
        localStorage.removeItem('postLoginToast');
      }
    } catch {
      localStorage.removeItem('postLoginToast');
    }
  }, []);
  return null;
}

// Add-on helper: trigger click on Enter/Space for role-based buttons/links
const KeyboardActivate = () => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      const el = document.activeElement;
      if (!el) return;

      // Skip native interactive elements; they already handle Enter/Space
      const tag = el.tagName.toLowerCase();
      const type = (el.type || '').toLowerCase();
      const isNative =
        tag === 'button' ||
        tag === 'a' ||
        tag === 'select' ||
        tag === 'textarea' ||
        (tag === 'input' && ['button', 'submit', 'checkbox', 'radio'].includes(type));

      if (isNative) return;

      const role = el.getAttribute('role');
      const isButtonLike = role === 'button' || role === 'link' || role === 'menuitem';
      const hasClickHandler = typeof el.onclick === 'function';

      if (isButtonLike || hasClickHandler) {
        e.preventDefault();
        el.click();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
};

// Add-on: reads full page content into an aria-live region when triggered
const PageContentAnnouncer = () => {
  const [queue, setQueue] = React.useState([]);
  const [index, setIndex] = React.useState(0);
  const [running, setRunning] = React.useState(false);

  const hiddenStyle = {
    position: 'absolute',
    left: '-10000px',
    top: 'auto',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: 0,
    padding: 0,
    margin: 0,
  };

  const collectReadableTexts = () => {
    const root =
      document.getElementById('main-content') ||
      document.querySelector('[role="main"]') ||
      document.body;

    // Select common content-bearing elements
    const nodes = root.querySelectorAll(
      [
        'h1,h2,h3,h4,h5,h6',
        'p',
        'li',
        '[role="heading"]',
        '[aria-label]',
        '[title]',
      ].join(',')
    );

    const seen = new Set();
    const lines = [];

    nodes.forEach((el) => {
      let text =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.textContent ||
        '';
      text = String(text).replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (seen.has(text)) return;
      seen.add(text);

      // Split into sentences for smoother announcements
      const parts = text
        .split(/(?<=[\.!\?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      parts.forEach((p) => {
        // Keep each announcement reasonable in size
        if (p.length > 400) {
          // Chunk long paragraphs
          const chunks = p.match(/.{1,300}(\s|$)/g) || [p];
          chunks.forEach((c) => lines.push(c.trim()));
        } else {
          lines.push(p);
        }
      });
    });

    return lines.length > 0 ? lines : ['No readable content found.'];
  };

  const startReading = () => {
    const lines = collectReadableTexts();
    setQueue(lines);
    setIndex(0);
    setRunning(true);
  };

  // Keyboard shortcut: Alt+R or Ctrl+Enter to start reading
  React.useEffect(() => {
    const onKey = (e) => {
      const altR = e.altKey && String(e.key).toLowerCase() === 'r';
      const ctrlEnter = e.ctrlKey && e.key === 'Enter';
      if (altR || ctrlEnter) {
        e.preventDefault();
        startReading();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // Sequenced announcements
  React.useEffect(() => {
    if (!running) return;
    if (index >= queue.length) {
      setRunning(false);
      return;
    }
    const current = queue[index];
    // Duration based on content length (min 1200ms, max ~5s)
    const duration = Math.min(5000, Math.max(1200, current.length * 18));
    const t = setTimeout(() => setIndex((i) => i + 1), duration);
    return () => clearTimeout(t);
  }, [running, index, queue]);

  return (
    <>
      {/* Hidden button so screen reader users can trigger without shortcut */}
      <button
        style={hiddenStyle}
        className="sr-read-page"
        onClick={startReading}
        aria-label="Read full page content"
      >
        Read page content
      </button>

      {/* Live region announces sentences one by one */}
      <div aria-live="polite" aria-atomic="false" style={hiddenStyle}>
        {running ? queue[index] : ''}
      </div>
    </>
  );
};
export default App;

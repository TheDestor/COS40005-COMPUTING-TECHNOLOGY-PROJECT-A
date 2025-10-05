import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { FaPhone } from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider.jsx';

const HERO_VIDEO_ID = 'VduPZPPIvHA'; 

const EventPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Events');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
  const savedTab = localStorage.getItem('eventPageActiveTab');
    return savedTab === 'ongoing' || savedTab === 'upcoming' ? savedTab : 'ongoing';
  });

  useEffect(() => {
    localStorage.setItem('eventPageActiveTab', activeTab);
  }, [activeTab]);
  
  // Add auth context
  const { user, isAuthenticated } = useAuth();

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/event/getAllEvents');
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response');
      }

      const { events: fetchedData } = await response.json();
      if (!fetchedData || !Array.isArray(fetchedData)) {
        throw new Error('Invalid data format from API');
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to beginning of today

      // Process the data to match our structure with the correct backend fields
      const processedData = fetchedData
        .filter(item => {
          // Filter out past events - only show events where endDate is today or in the future
          const eventEndDate = item.endDate ? new Date(item.endDate) : null;
          if (!eventEndDate) return false;
          
          eventEndDate.setHours(0, 0, 0, 0);
          return eventEndDate >= currentDate;
        })
        .filter(item => {
          // Filter by target audience based on user type
          const userType = user?.userType || 'tourist'; // Default to tourist if not logged in
          const userRole = user?.role; // Check for admin roles
          const eventAudiences = item.targetAudience || [];
          
          // System admin, CBT admin, and business users can see all events
          if (userRole === 'system_admin' || userRole === 'cbt_admin' || userRole === 'business') {
            return true;
          } else {
            // Tourist users (including non-logged in) can only see tourist events
            return eventAudiences.includes('Tourist');
          }
        })
        .map(item => ({
          id: item._id?.toString() || Math.random().toString(36).substr(2, 9),
          name: item.name || 'Unnamed Event',
          desc: item.description || 'Description not available',
          slug: (item.name || 'event').toLowerCase().replace(/\s+/g, '-'),
          image: item.imageUrl || defaultImage,
          type: item.eventType || 'Event',
          // Event specific fields from backend
          startDate: item.startDate ? new Date(item.startDate) : null,
          endDate: item.endDate ? new Date(item.endDate) : null,
          startTime: item.startTime || '',
          endTime: item.endTime || '',
          registrationRequired: item.registrationRequired || 'No',
          targetAudience: item.targetAudience || [],
          eventOrganizers: item.eventOrganizers || '',
          eventHashtags: item.eventHashtags || [],
          coordinates: item.coordinates || {},
          category: 'Events',
          source: 'event-api'
        }));

      setData(processedData);
    } catch (error) {
      console.error('Fetch Error:', error);
      setError(`Failed to load events: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]); // Refetch when user changes

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const highlightMatch = (name) => {
    const index = name.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (index === -1 || !searchQuery) return name;
    return (
      <>
        {name.substring(0, index)}
        <span style={{ backgroundColor: '#ffe066' }}>
          {name.substring(index, index + searchQuery.length)}
        </span>
        {name.substring(index + searchQuery.length)}
      </>
    );
  };

  // Format date to display like "October 1, 2025"
  const formatDate = (date) => {
    if (!date) return 'Date not specified';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date range like "October 1, 2025 - October 3, 2025"
  const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return 'Date not specified';
    if (!startDate) return `Until ${formatDate(endDate)}`;
    if (!endDate) return `From ${formatDate(startDate)}`;
    
    // If same date, show only one date
    if (formatDate(startDate) === formatDate(endDate)) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Format time period like "01:19 - 13:21"
  const formatTimePeriod = (startTime, endTime) => {
    if (!startTime && !endTime) return 'Time not specified';
    if (!startTime) return `Until ${endTime}`;
    if (!endTime) return `From ${startTime}`;
    return `${startTime} - ${endTime}`;
  };

  // Get user display name for the indicator
  const getUserDisplayName = () => {
    if (!user) return 'Tourist';
    
    if (user.role === 'system_admin') return 'System Admin';
    if (user.role === 'cbt_admin') return 'CBT Admin';
    if (user.userType === 'business') return 'Business User';
    
    return 'Tourist';
  };

  // Get viewing description for the indicator
  const getViewingDescription = () => {
    if (!user) return 'Tourist (showing tourist-focused events only)';
    
    if (user.role === 'system_admin' || user.role === 'cbt_admin' || user.userType === 'business') {
      return `${getUserDisplayName()} (viewing all upcoming events)`;
    }
    
    return 'Tourist (showing tourist-focused events only)';
  };

  // Categorize events into ongoing and upcoming
  const categorizeEvents = () => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const ongoingEvents = data.filter(item => {
      const startDate = item.startDate ? new Date(item.startDate) : null;
      const endDate = item.endDate ? new Date(item.endDate) : null;
      
      if (!startDate || !endDate) return false;
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return startDate <= currentDate && endDate >= currentDate;
    });

    const upcomingEvents = data.filter(item => {
      const startDate = item.startDate ? new Date(item.startDate) : null;
      
      if (!startDate) return false;
      
      startDate.setHours(0, 0, 0, 0);
      return startDate > currentDate;
    });

    return { ongoingEvents, upcomingEvents };
  };

  const { ongoingEvents, upcomingEvents } = categorizeEvents();

  // Get events based on active tab
  const getActiveTabEvents = () => {
    return activeTab === 'ongoing' ? ongoingEvents : upcomingEvents;
  };

  // Apply search and sort filters to the active tab events
  const filteredData = getActiveTabEvents().filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSort = sortOrder === 'all' || item.type === sortOrder;
    return matchesSearch && matchesSort;
  });

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading Events...</p>
      </div>
    );
  }

  return (
    <div className="category-page">
      <MenuNavbar onLoginClick={handleLoginClick} />

      <div className="hero-banner">
        <div className="hero-video-bg">
          <iframe
            src={`https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${HERO_VIDEO_ID}&modestbranding=1&showinfo=0&rel=0`}
            title="Sarawak Hero Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          ></iframe>
        </div>
      </div>

      <div className="hero-overlay-mt">
        <h1>{currentCategory.toUpperCase() || 'EVENTS'}</h1>
        <p className="hero-intro">
          Explore the vibrant pulse of Sarawak through its events. From cultural festivals and bustling markets to modern concerts and exhibitions, discover what's happening across Kuching, Miri, Sibu, and beyond.
        </p>
      </div>

      {error && (
        <div className="error-banner">
          Error loading events: {error}. Please try refreshing the page.
        </div>
      )}

      {/* Add user type indicator */}
      {/* <div className="user-type-indicator" style={{ 
        textAlign: 'center', 
        margin: '10px 0', 
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <span>{getViewingDescription()}</span>
      </div> */}

      {/* Tabs Section */}
      <div className="events-tabs-container" style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '20px 0',
        padding: '0 20px'
      }}>
        <div className="events-tabs" style={{
          display: 'flex',
          background: '#f8f9fa',
          borderRadius: '50px',
          padding: '5px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <button
            className={`tab-button ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ongoing');
              setVisibleItems(12);
            }}
            style={{
              padding: '12px 30px',
              border: 'none',
              borderRadius: '50px',
              background: activeTab === 'ongoing' ? 'linear-gradient(135deg, #007bff, #0056b3)' : 'transparent',
              color: activeTab === 'ongoing' ? 'white' : '#333',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '1rem'
            }}
          >
            On-going Events ({ongoingEvents.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('upcoming');
              setVisibleItems(12);
            }}
            style={{
              padding: '12px 30px',
              border: 'none',
              borderRadius: '50px',
              background: activeTab === 'upcoming' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'transparent',
              color: activeTab === 'upcoming' ? 'white' : '#333',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '1rem'
            }}
          >
            Upcoming Events ({upcomingEvents.length})
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-bar-mj">
            <input
              type="text"
              placeholder={`Search ${activeTab === 'ongoing' ? 'On-going' : 'Upcoming'} Events...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-mj"
            />
          </div>

          <div className="sort-dropdown">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="all">All Categories</option>
              <option value="Festival">Festival</option>
              <option value="Workshop">Workshop</option>
              <option value="Business Meetup">Business Meetup</option>
              <option value="Event">Event</option>
            </select>
          </div>
        </div>
      </div>

      <div className="cards-section">
        {filteredData.slice(0, visibleItems).map((item, index) => (
          <div
            className="card-wrapper"
            key={`${item.source}-${item.id}-${index}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`card ${index % 2 === 0 ? 'tall-card' : 'short-card'}`}>
              <img 
                src={item.image} 
                alt={item.name}
                onError={(e) => {
                  e.target.src = defaultImage;
                }}
              />
              <div className="card-content">
                <h3>{highlightMatch(item.name)}</h3>
                <div className="card-meta">
                  <span className="type-badge">{item.type}</span>
                  {/* Remove the date badge from here */}
                  {/* Add status badge */}
                  <span 
                    className="status-badge"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: activeTab === 'ongoing' 
                        ? 'linear-gradient(135deg, #28a745, #20c997)' 
                        : 'linear-gradient(135deg, #ffc107, #fd7e14)'
                    }}
                  >
                    {activeTab === 'ongoing' ? 'On-going' : 'Upcoming'}
                  </span>
                </div>
                
                {/* Description moved above event details */}
                <div className="description-area">
                  <p>{item.desc}</p>
                </div>

                {/* Event Details Section */}
                <div className="event-details">
                  <div className="event-detail-item">
                    <span className="event-detail-label">Date:</span>
                    <span className="event-detail-value">
                      {formatDateRange(item.startDate, item.endDate)}
                    </span>
                  </div>
                  <div className="event-detail-item">
                    <span className="event-detail-label">Time:</span>
                    <span className="event-detail-value">
                      {formatTimePeriod(item.startTime, item.endTime)}
                    </span>
                  </div>
                  <div className="event-detail-item">
                    <span className="event-detail-label">Event Type:</span>
                    <span className="event-detail-value">{item.type}</span>
                  </div>
                  <div className="event-detail-item">
                    <span className="event-detail-label">Registration:</span>
                    <span className="event-detail-value">{item.registrationRequired}</span>
                  </div>
                  {item.eventOrganizers && (
                    <div className="event-detail-item">
                      <span className="event-detail-label">Organizers:</span>
                      <span className="event-detail-value">{item.eventOrganizers}</span>
                    </div>
                  )}
                  {/* Remove audience section as requested */}
                </div>

                <div className="button-container">
                  <Link
                    to={`/discover/${item.slug}`}
                    state={{
                      name: item.name,
                      image: item.image,
                      description: item.desc,
                      latitude: item.coordinates?.lat,
                      longitude: item.coordinates?.lng,
                      category: item.category,
                      type: item.type,
                      startDate: item.startDate,
                      endDate: item.endDate,
                      startTime: item.startTime,
                      endTime: item.endTime,
                      registrationRequired: item.registrationRequired,
                      targetAudience: item.targetAudience,
                      eventOrganizers: item.eventOrganizers,
                      eventHashtags: item.eventHashtags
                    }}
                    className="explore-btn"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && !loading && !error && (
        <div className="no-results">
          <p>No {activeTab === 'ongoing' ? 'on-going' : 'upcoming'} events found. Try adjusting your search criteria.</p>
          <button onClick={() => {
            setSearchQuery('');
            setSortOrder('all');
          }} className="reset-filters-btn">
            Reset Filters
          </button>
        </div>
      )}

      {filteredData.length > visibleItems && (
        <div className="pagination-controls100">
          <button className="show-more-btn100" onClick={() => setVisibleItems(prev => prev + 12)}>
            Show More (+12)
          </button>
          <button className="show-all-btn100" onClick={() => setVisibleItems(filteredData.length)}>
            Show All
          </button>
        </div>
      )}

      {showLogin && <LoginPage onClose={closeLogin} />}

      {/* Ai Chatbot */}
      <AIChatbot />
      <Footer />
    </div>
  );
};

export default EventPage;
import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTimes, FaChevronRight, FaBell, FaChevronDown, FaChevronUp, FaExclamationCircle, FaHistory, FaAngleLeft, FaAngleRight, FaDotCircle } from 'react-icons/fa';
import { GoDotFill } from "react-icons/go";
import { useNavigate } from 'react-router-dom';
import '../styles/EventNotificationPanel.css';

function EventNotificationPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eventCategory, setEventCategory] = useState('all');
  const navigate = useNavigate();

  // Auto-minimize when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isProfileClick = event.target.closest('.profile-dropdown') || 
                            event.target.closest('.profile-container') ||
                            event.target.closest('[class*="profile"]') ||
                            event.target.closest('[class*="Profile"]') ||
                            event.target.closest('.modal') ||
                            event.target.closest('[class*="Modal"]');
      
      const isEventPanelClick = event.target.closest('[data-event-panel="true"]');
      
      if (isProfileClick && !isEventPanelClick && !isMinimized) {
        setIsMinimized(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMinimized]);

  // Fetch ALL events
  const fetchAllEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/event/getAllEvents');
      const data = await response.json();
      
      if (data.success && data.events) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const categorizedEvents = data.events
          .filter(event => event.endDate)
          .map(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            let category = 'past';
            if (startDate > currentDate) {
              category = 'upcoming';
            } else if (startDate <= currentDate && endDate >= currentDate) {
              category = 'ongoing';
            }

            return { ...event, category, startDate, endDate };
          })
          .sort((a, b) => {
            if (a.category === 'ongoing' && b.category !== 'ongoing') return -1;
            if (a.category !== 'ongoing' && b.category === 'ongoing') return 1;
            if (a.category === 'upcoming' && b.category !== 'upcoming') return -1;
            if (a.category !== 'upcoming' && b.category === 'upcoming') return 1;
            return new Date(b.startDate) - new Date(a.startDate);
          });

        setEvents(categorizedEvents);
        
        if (categorizedEvents.some(e => e.category === 'ongoing')) {
          setEventCategory('ongoing');
        } else if (categorizedEvents.some(e => e.category === 'upcoming')) {
          setEventCategory('upcoming');
        } else {
          setEventCategory('all');
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
    const interval = setInterval(fetchAllEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllEvents]);

  const getFilteredEvents = useCallback(() => {
    if (eventCategory === 'all') return events;
    return events.filter(e => e.category === eventCategory);
  }, [events, eventCategory]);

  const filteredEvents = getFilteredEvents();

  // Auto-rotate events every 10 seconds
  useEffect(() => {
    if (filteredEvents.length > 1 && isExpanded && !isMinimized) {
      const interval = setInterval(() => {
        setCurrentEventIndex(prev => (prev + 1) % filteredEvents.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [filteredEvents.length, isExpanded, isMinimized]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  };

  const getEventTiming = (event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(event.startDate);
    start.setHours(0, 0, 0, 0);

    if (event.category === 'ongoing') {
      return 'Happening Now';
    }

    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (event.category === 'upcoming') {
      if (diffDays === 0) return 'Starting Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `In ${diffDays} days`;
      return formatDate(start);
    }

    const daysSince = Math.abs(diffDays);
    if (daysSince === 0) return 'Ended Today';
    if (daysSince === 1) return 'Ended Yesterday';
    if (daysSince < 7) return `${daysSince} days ago`;
    return `Ended ${formatDate(event.endDate)}`;
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'ongoing': return { bg: '#10b981', light: '#d1fae5' };
      case 'upcoming': return { bg: '#3b82f6', light: '#dbeafe' };
      case 'past': return { bg: '#6b7280', light: '#f3f4f6' };
      default: return { bg: '#667eea', light: '#e0e7ff' };
    }
  };

  const eventCounts = {
    ongoing: events.filter(e => e.category === 'ongoing').length,
    upcoming: events.filter(e => e.category === 'upcoming').length,
    past: events.filter(e => e.category === 'past').length,
    all: events.length
  };

  // Navigate to previous/next event
  const goToPrevious = () => {
    setCurrentEventIndex(prev => prev === 0 ? filteredEvents.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentEventIndex(prev => (prev + 1) % filteredEvents.length);
  };

  // Enhanced navigation function to handle event details
  const handleViewEventDetails = useCallback((event) => {
    navigate(`/discover/${event.name.toLowerCase().replace(/\s+/g, '-')}`, {
      state: {
        name: event.name,
        description: event.description,
        image: event.imageUrl || defaultImage,
        latitude: event.coordinates?.latitude || 1.5533,
        longitude: event.coordinates?.longitude || 110.3592,
        eventType: event.eventType,
        eventOrganizers: event.eventOrganizers,
        eventHashtags: event.eventHashtags,
        dailySchedule: event.dailySchedule || [],
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        registrationRequired: event.registrationRequired,
        targetAudience: event.targetAudience,
        type: 'Event',
        category: 'Events',
        eventId: event._id,
        fromEventPanel: true
      }
    });
  }, [navigate]);

  if (loading) {
    return (
      <div data-event-panel="true" className="loading-container-enp">
        <div className="loading-spinner-enp" />
        Loading events...
      </div>
    );
  }

  const ErrorBanner = () => error && (
    <div className="error-banner-enp">
      <FaExclamationCircle />
      <div className="error-banner-content-enp">{error}</div>
      <button className="error-retry-btn-enp" onClick={fetchAllEvents}>
        Retry
      </button>
    </div>
  );

  if (isMinimized) {
    return (
      <div
        data-event-panel="true"
        onClick={() => setIsMinimized(false)}
        className={`minimized-container-enp ${eventCounts.ongoing > 0 ? 'pulse-animation-enp' : ''}`}
      >
        <FaBell className="minimized-bell-icon-enp" />
        <span className="minimized-text-enp">
          {eventCounts.ongoing > 0 && `${eventCounts.ongoing} Happening • `}
          {/* {events.length} Event{events.length !== 1 ? 's' : ''} */}
        </span>
      </div>
    );
  }

  return (
    <div 
      data-event-panel="true" 
      className={`main-panel-container-enp ${!isExpanded ? 'collapsed-enp' : ''}`}
    >
      {/* Header */}
      <div className="panel-header-enp">
        <div className="header-left-enp">
          <FaBell className="header-bell-icon-enp" />
          <div>
            <h3 className="header-title-enp">Events in Sarawak</h3>
            <p className="header-subtitle-enp">
              {eventCounts.ongoing > 0 && `${eventCounts.ongoing} happening now • `}
              {events.length} total event{events.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="header-controls-enp">
          {/* Removed collapse toggle button */}
          {/* <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="header-btn-enp"
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button> */}
          <button
            onClick={() => setIsMinimized(true)}
            className="header-btn-enp"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="panel-content-enp">
          <ErrorBanner />

          {/* Category Filter Tabs */}
          {events.length > 0 && (
            <div className="category-tabs-container-enp">
              {[
                // { id: 'all', label: 'All', count: eventCounts.all },
                { id: 'ongoing', label: 'Happening', count: eventCounts.ongoing },
                { id: 'upcoming', label: 'Upcoming', count: eventCounts.upcoming },
                // { id: 'past', label: 'Past', count: eventCounts.past }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setEventCategory(cat.id);
                    setCurrentEventIndex(0);
                  }}
                  disabled={cat.count === 0}
                  className={`category-tab-enp ${eventCategory === cat.id ? 'active-enp' : 'inactive-enp'}`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          )}

          {filteredEvents.length > 0 ? (
            <>
              {/* Featured Event with Navigation */}
              {(() => {
                const currentEvent = filteredEvents[currentEventIndex];
                const colors = getCategoryColor(currentEvent.category);
                
                return (
                  <div className="event-card-container-enp">
                    <div className="event-card-enp">
                      <div className={`event-status-badge-enp ${currentEvent.category}-enp`}>
                        {currentEvent.category === 'ongoing' ? (
                          <>
                            <GoDotFill className="status-icon-enp" /> Happening Now
                          </>
                        ) : currentEvent.category === 'upcoming' ? (
                          <>
                            <FaCalendarAlt className="status-icon-enp" /> Upcoming
                          </>
                        ) : (
                          <>
                            <FaHistory className="status-icon-enp" /> Past Event
                          </>
                        )}
                      </div>
                      
                      {currentEvent.imageUrl && (
                        <img
                          src={currentEvent.imageUrl}
                          alt={currentEvent.name}
                          className={`event-image-enp ${currentEvent.category === 'past' ? 'past-enp' : ''}`}
                        />
                      )}
                      
                      <h4 className="event-title-enp">{currentEvent.name}</h4>
                      
                      <p className="event-description-enp">{currentEvent.description}</p>
                      
                      <div className="event-details-enp">
                        <div className="event-detail-row-enp">
                          <FaCalendarAlt className="event-detail-icon-enp" />
                          <span className="event-detail-text-enp">
                            {formatDateRange(currentEvent.startDate, currentEvent.endDate)}
                          </span>
                        </div>
                        
                        {(() => {
                          const today = new Date();
                          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                          
                          const todaySchedule = currentEvent.dailySchedule?.find(schedule => {
                            if (!schedule.date) return false;
                            const scheduleDate = new Date(schedule.date);
                            const scheduleDateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`;
                            return scheduleDateStr === todayStr;
                          });
                          
                          const startTime = todaySchedule?.startTime || currentEvent.startTime;
                          const endTime = todaySchedule?.endTime || currentEvent.endTime;
                          
                          if (startTime) {
                            return (
                              <div className="event-detail-row-enp">
                                <FaClock className="event-detail-icon-enp" />
                                <span className="event-detail-text-enp">
                                  {startTime} - {endTime || 'End of day'}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      <div className="event-footer-enp">
                        <span className={`event-timing-badge-enp ${currentEvent.category}-enp`}>
                          {getEventTiming(currentEvent)}
                        </span>
                        
                        <button
                          onClick={() => handleViewEventDetails(currentEvent)}
                          className="view-details-btn-enp"
                        >
                          View Details
                          <FaChevronRight className="view-details-icon-enp" />
                        </button>
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {filteredEvents.length > 1 && (
                      <div className="navigation-container-enp">
                        <button onClick={goToPrevious} className="nav-btn-enp">
                          <FaAngleLeft /> Previous
                        </button>
                        
                        <span className="nav-counter-enp">
                          {currentEventIndex + 1} / {filteredEvents.length}
                        </span>
                        
                        <button onClick={goToNext} className="nav-btn-enp">
                          Next <FaAngleRight />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="no-events-container-enp">
              <FaHistory className="no-events-icon-enp" />
              <h4 className="no-events-title-enp">
                No {eventCategory !== 'all' ? eventCategory : ''} events
              </h4>
              <p className="no-events-text-enp">
                {eventCategory === 'all' 
                  ? "Check back later for exciting events in Sarawak!" 
                  : `Try viewing ${eventCategory === 'upcoming' ? 'past' : eventCategory === 'past' ? 'upcoming' : 'all'} events`}
              </p>
            </div>
          )}

          {/* View All Button */}
          <a href="/event" className="view-all-btn-enp">
            View All Events Page →
          </a>
        </div>
      )}
    </div>
  );
};

export default EventNotificationPanel;
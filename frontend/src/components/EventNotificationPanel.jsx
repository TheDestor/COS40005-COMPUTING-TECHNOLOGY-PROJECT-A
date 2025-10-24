import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTimes, FaChevronRight, FaBell, FaChevronDown, FaChevronUp, FaExclamationCircle, FaHistory, FaAngleLeft, FaAngleRight } from 'react-icons/fa';

const EventNotificationPanel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eventCategory, setEventCategory] = useState('all');

  // Auto-minimize when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on profile dropdown, login modal, or other UI elements
      const isProfileClick = event.target.closest('.profile-dropdown') || 
                            event.target.closest('.profile-container') ||
                            event.target.closest('[class*="profile"]') ||
                            event.target.closest('[class*="Profile"]') ||
                            event.target.closest('.modal') ||
                            event.target.closest('[class*="Modal"]');
      
      // Don't minimize if clicking on the event panel itself
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

  if (loading) {
    return (
      <div 
        data-event-panel="true"
        style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
          zIndex: 10,
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        Loading events...
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const ErrorBanner = () => error && (
    <div style={{
      background: '#fee2e2',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <FaExclamationCircle />
      <div style={{ flex: 1 }}>{error}</div>
      <button
        onClick={fetchAllEvents}
        style={{
          background: '#991b1b',
          color: 'white',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Retry
      </button>
    </div>
  );

  if (isMinimized) {
    return (
      <div
        data-event-panel="true"
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '50px',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          animation: eventCounts.ongoing > 0 ? 'pulse 2s infinite' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
        }}
      >
        <FaBell style={{ fontSize: '18px' }} />
        <span style={{ fontWeight: '600', fontSize: '14px' }}>
          {eventCounts.ongoing > 0 && `${eventCounts.ongoing} Happening • `}
          {events.length} Event{events.length !== 1 ? 's' : ''}
        </span>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      data-event-panel="true"
      style={{
        position: 'fixed',
        top: '100px',
        right: '20px',
        width: '360px',
        maxHeight: '85vh',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        zIndex: 10,
        overflow: 'hidden',
        animation: 'slideIn 0.4s ease-out'
      }}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @media (max-width: 768px) {
          .event-notification-panel {
            width: calc(100vw - 40px) !important;
            right: 20px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBell style={{ fontSize: '20px' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
              Events in Sarawak
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
              {eventCounts.ongoing > 0 && `${eventCounts.ongoing} happening now • `}
              {events.length} total event{events.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div style={{
          maxHeight: 'calc(85vh - 80px)',
          overflowY: 'auto',
          padding: '16px'
        }}>
          <ErrorBanner />

          {/* Category Filter Tabs */}
          {events.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              {[
                { id: 'all', label: 'All', count: eventCounts.all },
                { id: 'ongoing', label: 'Happening', count: eventCounts.ongoing },
                { id: 'upcoming', label: 'Upcoming', count: eventCounts.upcoming },
                { id: 'past', label: 'Past', count: eventCounts.past }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setEventCategory(cat.id);
                    setCurrentEventIndex(0);
                  }}
                  disabled={cat.count === 0}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: eventCategory === cat.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                    color: eventCategory === cat.id ? 'white' : '#6b7280',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: cat.count > 0 ? 'pointer' : 'not-allowed',
                    opacity: cat.count === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
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
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: colors.bg,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        animation: currentEvent.category === 'ongoing' ? 'pulse 2s infinite' : 'none',
                        zIndex: 2
                      }}>
                        {currentEvent.category === 'ongoing' ? '🔴 Happening Now' : 
                         currentEvent.category === 'upcoming' ? '📅 Upcoming' : 
                         '📜 Past Event'}
                      </div>
                      
                      {currentEvent.imageUrl && (
                        <img
                          src={currentEvent.imageUrl}
                          alt={currentEvent.name}
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            opacity: currentEvent.category === 'past' ? 0.7 : 1
                          }}
                        />
                      )}
                      
                      <h4 style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1f2937',
                        lineHeight: '1.4'
                      }}>
                        {currentEvent.name}
                      </h4>
                      
                      <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: '#4b5563',
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {currentEvent.description}
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaCalendarAlt style={{ color: '#667eea', fontSize: '14px' }} />
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                            {formatDateRange(currentEvent.startDate, currentEvent.endDate)}
                          </span>
                        </div>
                        
                        {currentEvent.startTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaClock style={{ color: '#667eea', fontSize: '14px' }} />
                            <span style={{ fontSize: '13px', color: '#374151' }}>
                              {currentEvent.startTime} - {currentEvent.endTime || 'End of day'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: colors.bg,
                          background: colors.light,
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>
                          {getEventTiming(currentEvent)}
                        </span>
                        
                        <a
                          href={`/discover/${currentEvent.name.toLowerCase().replace(/\s+/g, '-')}`}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          View Details
                          <FaChevronRight style={{ fontSize: '12px' }} />
                        </a>
                      </div>
                    </div>

                    {/* Simple Navigation Arrows - Only show if more than 1 event */}
                    {filteredEvents.length > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <button
                          onClick={goToPrevious}
                          style={{
                            background: '#f3f4f6',
                            border: 'none',
                            color: '#4b5563',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        >
                          <FaAngleLeft /> Previous
                        </button>
                        
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                          {currentEventIndex + 1} / {filteredEvents.length}
                        </span>
                        
                        <button
                          onClick={goToNext}
                          style={{
                            background: '#f3f4f6',
                            border: 'none',
                            color: '#4b5563',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        >
                          Next <FaAngleRight />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280'
            }}>
              <FaHistory style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                No {eventCategory !== 'all' ? eventCategory : ''} events
              </h4>
              <p style={{ margin: 0, fontSize: '13px' }}>
                {eventCategory === 'all' 
                  ? "Check back later for exciting events in Sarawak!" 
                  : `Try viewing ${eventCategory === 'upcoming' ? 'past' : eventCategory === 'past' ? 'upcoming' : 'all'} events`}
              </p>
            </div>
          )}

          {/* View All Button */}
          <a
            href="/event"
            style={{
              display: 'block',
              marginTop: '16px',
              padding: '12px',
              background: 'white',
              border: '2px solid #667eea',
              color: '#667eea',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }}
          >
            View All Events Page →
          </a>
        </div>
      )}
    </div>
  );
};

export default EventNotificationPanel;
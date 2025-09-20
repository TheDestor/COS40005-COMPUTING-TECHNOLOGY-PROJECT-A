import React, { useState, useEffect } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaCalendar, FaMapMarkerAlt, FaClock, FaTimes } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import ky from 'ky';
import '../styles/PastEventsPage.css';

const PastEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPastEvents();
  }, []);

  useEffect(() => {
    const filtered = events.filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const fetchPastEvents = async () => {
    try {
      setLoading(true);
      const response = await ky.get('/api/event/getAllEvents').json();
      
      const currentDate = new Date();
      const pastEvents = response.events.filter(event => 
        new Date(event.endDate) < currentDate
      );
      
      setEvents(pastEvents);
      setFilteredEvents(pastEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="past-events-container">
        <Sidebar />
        <div className="past-events-content">
          <div className="loading">Loading events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="past-events-container">
        <Sidebar />
        <div className="past-events-content">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="past-events-container">
      <Sidebar />
      <div className="past-events-content">
        <div className="past-events-header">
          <div className="heading">
            <h2>Past Events</h2>
            <p>View all past events and their details</p>
          </div>
          <div className="past-events-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search past events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="action-icons">
              <div className="icon-wrapper">
                <FaBell className="action-icon" />
                <span className="badge">5</span>
              </div>
              <div className="icon-wrapper">
                <FaEnvelope className="action-icon" />
                <span className="badge">3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <h3>No past events found</h3>
              <p>There are no past events to display.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div 
                key={event._id} 
                className="event-card"
                onClick={() => openEventModal(event)}
              >
                <div className="event-image">
                  <img src={event.imageUrl} alt={event.name} />
                  <div className="event-date-badge">
                    <FaCalendar className="date-icon" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                </div>
                <div className="event-content">
                  <h3 className="event-title">{event.name}</h3>
                  <p className="event-description">{event.description.substring(0, 100)}...</p>
                  <div className="event-details">
                    <div className="event-detail">
                      <FaMapMarkerAlt className="detail-icon" />
                      <span>{event.location}</span>
                    </div>
                    <div className="event-detail">
                      <FaClock className="detail-icon" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  </div>
                  <div className="event-tags">
                    <span className="event-tag">{event.eventType}</span>
                    {event.targetAudience.map((audience, index) => (
                      <span key={index} className="event-tag audience">{audience}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {isModalOpen && selectedEvent && (
          <div className="modal-overlay" onClick={closeEventModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeEventModal}>
                <FaTimes />
              </button>
              <div className="modal-header">
                <img src={selectedEvent.imageUrl} alt={selectedEvent.name} className="modal-image" />
                <div className="modal-title-section">
                  <h2>{selectedEvent.name}</h2>
                  <p className="modal-event-type">{selectedEvent.eventType}</p>
                </div>
              </div>
              <div className="modal-body">
                <div className="modal-section">
                  <h3>Description</h3>
                  <p>{selectedEvent.description}</p>
                </div>
                <div className="modal-details-grid">
                  <div className="modal-detail">
                    <FaMapMarkerAlt className="modal-detail-icon" />
                    <div>
                      <strong>Location</strong>
                      <p>{selectedEvent.location}</p>
                    </div>
                  </div>
                  <div className="modal-detail">
                    <FaCalendar className="modal-detail-icon" />
                    <div>
                      <strong>Date</strong>
                      <p>{formatDate(selectedEvent.startDate)} - {formatDate(selectedEvent.endDate)}</p>
                    </div>
                  </div>
                  <div className="modal-detail">
                    <FaClock className="modal-detail-icon" />
                    <div>
                      <strong>Time</strong>
                      <p>{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                    </div>
                  </div>
                  <div className="modal-detail">
                    <div>
                      <strong>Registration Required</strong>
                      <p>{selectedEvent.registrationRequired}</p>
                    </div>
                  </div>
                </div>
                <div className="modal-section">
                  <h3>Target Audience</h3>
                  <div className="modal-tags">
                    {selectedEvent.targetAudience.map((audience, index) => (
                      <span key={index} className="modal-tag">{audience}</span>
                    ))}
                  </div>
                </div>
                {selectedEvent.coordinates && (
                  <div className="modal-section">
                    <h3>Location Coordinates</h3>
                    <p>Latitude: {selectedEvent.coordinates.latitude}, Longitude: {selectedEvent.coordinates.longitude}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastEventsPage;
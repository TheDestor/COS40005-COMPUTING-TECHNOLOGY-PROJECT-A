import React, { useState, useEffect } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaCalendar, FaMapMarkerAlt, FaClock, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import ky from 'ky';
import '../styles/ScheduleEventsPage.css';
import { useAuth } from '../context/AuthProvider.jsx';

const ScheduleEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({});
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const { accessToken } = useAuth();

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    const filtered = events.filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const response = await ky.get('/api/event/getAllEvents').json();
      
      const currentDate = new Date();
      const upcomingEvents = response.events.filter(event => 
        new Date(event.startDate) >= currentDate
      );
      
      setEvents(upcomingEvents);
      setFilteredEvents(upcomingEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setEditForm({
      name: event.name,
      description: event.description,
      location: event.location,
      eventType: event.eventType,
      targetAudience: event.targetAudience.join(', '),
      registrationRequired: event.registrationRequired,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      latitude: event.coordinates?.latitude || 1.5533,
      longitude: event.coordinates?.longitude || 110.3592
    });
    setUploadedImage(event.imageUrl);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
    setEditForm({});
    setUploadedImage(null);
    setImageFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) { 
      const file = e.target.files[0];
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setUploadedImage(objectUrl);
    }
  };

  const updateEvent = async () => {
    try {
      const formData = new FormData();
      
      Object.keys(editForm).forEach(key => {
        if (key === 'targetAudience') {
          const audiences = editForm[key].split(',').map(a => a.trim()).filter(a => a);
          formData.append(key, JSON.stringify(audiences));
        } else {
          formData.append(key, editForm[key]);
        }
      });
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await ky.put(
        `/api/event/updateEvent/${selectedEvent._id}`,
        {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData
        }
      ).json();

      if (response.success) {
        // Update local state
        const updatedEvents = events.map(event => 
          event._id === selectedEvent._id ? response.event : event
        );
        setEvents(updatedEvents);
        setFilteredEvents(updatedEvents);
        closeEditModal();
        alert('Event updated successfully!');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await ky.delete(
        `/api/event/deleteEvent/${eventId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      ).json();

      if (response.success) {
        const updatedEvents = events.filter(event => event._id !== eventId);
        setEvents(updatedEvents);
        setFilteredEvents(updatedEvents);
        alert('Event deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="schedule-events-container">
        <Sidebar />
        <div className="schedule-events-content">
          <div className="loading">Loading events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-events-container">
        <Sidebar />
        <div className="schedule-events-content">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-events-container">
      <Sidebar />
      <div className="schedule-events-content">
        <div className="schedule-events-header">
          <div className="heading">
            <h2>Schedule Upcoming Events</h2>
            <p>Manage and edit upcoming events</p>
          </div>
          <div className="schedule-events-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search upcoming events..."
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
              <h3>No upcoming events found</h3>
              <p>There are no upcoming events to display.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event._id} className="event-card">
                <div className="event-image">
                  <img src={event.imageUrl} alt={event.name} />
                  <div className="event-date-badge">
                    <FaCalendar className="date-icon" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="event-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => openEditModal(event)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => deleteEvent(event._id)}
                    >
                      <FaTrash />
                    </button>
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

        {isEditModalOpen && selectedEvent && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeEditModal}>
                <FaTimes />
              </button>
              <div className="modal-header">
                <h2>Edit Event</h2>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Event Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={editForm.description || ''}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Event Type</label>
                  <input
                    type="text"
                    name="eventType"
                    value={editForm.eventType || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Target Audience (comma-separated)</label>
                  <input
                    type="text"
                    name="targetAudience"
                    value={editForm.targetAudience || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Tourist, Local Business, Other"
                  />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                        type="date"
                        name="startDate"
                        value={editForm.startDate || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                        type="date"
                        name="endDate"
                        value={editForm.endDate || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        />
                    </div>
                    </div>

                    // Keep the time inputs as they are:
                    <div className="form-row">
                    <div className="form-group">
                        <label>Start Time</label>
                        <input
                        type="time"
                        name="startTime"
                        value={editForm.startTime || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>End Time</label>
                        <input
                        type="time"
                        name="endTime"
                        value={editForm.endTime || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        />
                    </div>
                    </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      name="latitude"
                      value={editForm.latitude || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      step="any"
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      name="longitude"
                      value={editForm.longitude || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      step="any"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Registration Required</label>
                  <select
                    name="registrationRequired"
                    value={editForm.registrationRequired || 'No'}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Event Image</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="form-input"
                    />
                    {uploadedImage && (
                      <img src={uploadedImage} alt="Event" className="uploaded-preview" />
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="cancel-btn" onClick={closeEditModal}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={updateEvent}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleEventsPage;
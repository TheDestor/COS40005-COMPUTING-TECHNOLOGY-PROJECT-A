import { useState, useRef, useEffect } from 'react';
import { FaCamera, FaCalendar, FaMapMarkerAlt, FaClock, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import Sidebar from '../components/Sidebar';
import ky from 'ky';
import '../styles/AddEventPage.css';
import { useAuth } from '../context/AuthProvider.jsx';
import { toast } from 'sonner';
import { FaLocationArrow } from 'react-icons/fa6';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const SARAWAK_BOUNDS = L.latLngBounds([0.8, 108.8], [5.5, 115.5]);
const clampToBounds = (lat, lng) => {
  const sw = SARAWAK_BOUNDS.getSouthWest();
  const ne = SARAWAK_BOUNDS.getNorthEast();
  const clampedLat = Math.min(ne.lat, Math.max(sw.lat, lat));
  const clampedLng = Math.min(ne.lng, Math.max(sw.lng, lng));
  return [clampedLat, clampedLng];
};

// Map Preview Component (Leaflet)
const MapPreview = ({ latitude, longitude, onChange }) => {
  const [markerPos, setMarkerPos] = useState([latitude, longitude]);

  useEffect(() => {
    const [clat, clng] = clampToBounds(latitude, longitude);
    setMarkerPos([clat, clng]);
    if (clat !== latitude || clng !== longitude) {
      onChange?.(clat, clng);
    }
  }, [latitude, longitude]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const [clat, clng] = clampToBounds(lat, lng);
    setMarkerPos([clat, clng]);
    onChange?.(clat, clng);
  };

  const handleDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    const [clat, clng] = clampToBounds(lat, lng);
    setMarkerPos([clat, clng]);
    onChange?.(clat, clng);
  };

  const ClickHandler = () => {
    useMapEvents({ click: handleMapClick });
    return null;
  };

  const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      const [clat, clng] = clampToBounds(center[0], center[1]);
      map.setView([clat, clng]);
    }, [center, map]);
    return null;
  };

  return (
    <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
      <div style={{ marginBottom: '5px', fontSize: '14px', color: '#666' }}>
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        maxBounds={SARAWAK_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickHandler />
        <RecenterMap center={[latitude, longitude]} />
        <Marker
          position={markerPos}
          draggable={true}
          eventHandlers={{ dragend: handleDragEnd }}
          icon={defaultIcon}
        />
      </MapContainer>
    </div>
  );
};

// Event Card Component for Past and Upcoming Events
const EventCard = ({ event, type, onEdit, onDelete, onClick }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Time not specified';
    return `${startTime} - ${endTime}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Coordinates copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy coordinates');
    });
  };

  return (
    <div 
      className="event-card"
      onClick={onClick}
    >
      <div className="event-image">
        <img src={event.imageUrl} alt={event.name} />
        <div className="event-date-badge">
          <FaCalendar className="date-icon" />
          <span>{formatDate(event.startDate)}</span>
        </div>
        {(type === 'upcoming' || type === 'past') && (
          <div className="event-actions">
            <button 
              className="action-btn edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(event);
              }}
              title="Edit event"
            >
              <FaEdit />
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(event._id);
              }}
              title="Delete event"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
      
      <div className="event-content">
        <div className="event-header">
          <h3 className="event-title">{event.name}</h3>
          <span className="event-type-badge">{event.eventType}</span>
        </div>
        
        <p className="event-description">
          {event.description.substring(0, 120)}
          {event.description.length > 120 && '...'}
        </p>
        
        <div className="event-details">
          <div className="event-detail-item">
            <FaMapMarkerAlt className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Location</span>
              <span 
                className="detail-value coordinates"
                onClick={(e) => {
                  e.stopPropagation();
                  if (event.coordinates) {
                    copyToClipboard(`${event.coordinates.latitude.toFixed(4)}, ${event.coordinates.longitude.toFixed(4)}`);
                  }
                }}
                title={event.coordinates ? 'Click to copy coordinates' : ''}
              >
                {event.coordinates 
                  ? `${event.coordinates.latitude.toFixed(4)}, ${event.coordinates.longitude.toFixed(4)}`
                  : event.location || 'Location not specified'
                }
              </span>
            </div>
          </div>

          <div className="event-detail-item">
            <FaCalendar className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
            </div>
          </div>
          
          <div className="event-detail-item">
            <FaClock className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Time</span>
              <span className="detail-value">{formatTimeRange(event.startTime, event.endTime)}</span>
            </div>
          </div>
        </div>
        
        <div className="event-footer">
          <div className="event-tags">
            {event.targetAudience.slice(0, 3).map((audience, index) => (
              <span key={index} className="event-tag audience">
                {audience}
              </span>
            ))}
            {event.targetAudience.length > 3 && (
              <span className="event-tag-more">+{event.targetAudience.length - 3} more</span>
            )}
          </div>
          
          <div className="registration-badge">
            <span className={`registration-status ${event.registrationRequired === 'Yes' ? 'required' : 'not-required'}`}>
              {event.registrationRequired === 'Yes' ? 'Registration Required' : 'No Registration'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map Modal Component for showing coordinates
const MapModal = ({ latitude, longitude }) => {
  const [markerPos, setMarkerPos] = useState([latitude, longitude]);

  useEffect(() => {
    const [clat, clng] = clampToBounds(latitude, longitude);
    setMarkerPos([clat, clng]);
  }, [latitude, longitude]);

  const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      const [clat, clng] = clampToBounds(center[0], center[1]);
      map.setView([clat, clng]);
    }, [center, map]);
    return null;
  };

  return (
    <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
      <div style={{ marginBottom: '5px', fontSize: '14px', color: '#666' }}>
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        maxBounds={SARAWAK_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <RecenterMap center={[latitude, longitude]} />
        <Marker
          position={markerPos}
          icon={defaultIcon}
        />
      </MapContainer>
    </div>
  );
};

// Event Modal Component
const EventModal = ({ event, isOpen, onClose, type, onSave, editForm, setEditForm, uploadedImage, setUploadedImage, imageFile, setImageFile }) => {
  const [isEditMode, setIsEditMode] = useState(type === 'edit');
  const eventTypes = ['Festival', 'Workshop & Seminars', 'Community & Seasonal Bazaars', 'Music, Arts & Performance', 'Food & Culinary', 'Sporting', 'Art & Performance'];
  
  useEffect(() => {
    if (type === 'edit' && event) {
      setIsEditMode(true);
      
      // Check if this is a past event
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const eventEndDate = new Date(event.endDate);
      eventEndDate.setHours(0, 0, 0, 0);
      
      const isPastEvent = eventEndDate < currentDate;
      
      // Format date for input (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Get tomorrow's date for past events
      const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return formatDateForInput(tomorrow);
      };

      // Create initial form data object
      const initialFormData = {
        name: event.name,
        description: event.description,
        eventType: event.eventType,
        targetAudience: event.targetAudience.join(', '),
        registrationRequired: event.registrationRequired,
        // For past events, use tomorrow's date. For upcoming events, use existing dates
        startDate: isPastEvent ? getTomorrowDate() : formatDateForInput(event.startDate),
        endDate: isPastEvent ? getTomorrowDate() : formatDateForInput(event.endDate),
        startTime: event.startTime,
        endTime: event.endTime,
        latitude: event.coordinates?.latitude || 1.5533,
        longitude: event.coordinates?.longitude || 110.3592,
        eventOrganizers: event.eventOrganizers || '',
        eventHashtags: event.eventHashtags || ''
      };

      // For past events, store the original image URL
      if (isPastEvent) {
        initialFormData.originalImageUrl = event.imageUrl;
      }

      // Set the form data and uploaded image
      setEditForm(initialFormData);
      setUploadedImage(event.imageUrl);
    } else {
      setIsEditMode(false);
    }
  }, [event, type]);

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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const [clat, clng] = clampToBounds(pos.coords.latitude, pos.coords.longitude);
        setEditForm(prev => ({
          ...prev,
          latitude: clat,
          longitude: clng
        }));
      },
      (err) => {
        const msg = err?.message || 'Unable to retrieve your location';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Time not specified';
    return `${startTime} - ${endTime}`;
  };

  if (!isOpen || !event) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isEditMode ? 'edit-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        {isEditMode ? (
          <>
            <div className="modal-header">
              <h2>Edit Event</h2>
              {/* <button className="modal-close" onClick={onClose}>
                <FaTimes />
              </button> */}
            </div>
            <div className="modal-body edit-modal-body">
              <div className="event-form-container edit-event-form">
                <div className="event-form-left">
                  <div className="form-group">
                    <label>Event Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Sarawak Cultural Festival 2025"
                    />
                  </div>

                  <div className="form-group">
                    <label>Event Description</label>
                    <textarea
                      name="description"
                      value={editForm.description || ''}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="What is this event about?"
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label>Event Organizers</label>
                    <input
                      type="text"
                      name="eventOrganizers"
                      value={editForm.eventOrganizers || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Sarawak Tourism Board"
                    />
                  </div>

                  <div className="form-group">
                    <label>Event Hashtags</label>
                    <input
                      type="text"
                      name="eventHashtags"
                      value={editForm.eventHashtags || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., #Festival, #Sarawak, #Culture"
                    />
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Separate multiple hashtags with commas
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Event Location (Latitude, Longitude)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={`${editForm.latitude || ''}, ${editForm.longitude || ''}`}
                        onChange={(e) => {
                          const value = e.target.value;
                          const coords = value.split(',').map(coord => coord.trim());
                          if (coords.length === 2) {
                            const lat = parseFloat(coords[0]);
                            const lng = parseFloat(coords[1]);
                            if (!isNaN(lat) && !isNaN(lng)) {
                              setEditForm(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng
                              }));
                            }
                          }
                        }}
                        className="form-input"
                        placeholder="e.g., 1.5533, 110.3592"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        aria-label="Use current location"
                        style={{
                          position: 'absolute',
                          right: '0px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#8b5cf6'
                        }}
                      >
                        <FaLocationArrow size={18} />
                      </button>
                    </div>
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Enter coordinates for precise event location on the map
                    </small>

                    <MapPreview
                      latitude={parseFloat(editForm.latitude) || 1.5533}
                      longitude={parseFloat(editForm.longitude) || 110.3592}
                      onChange={(lat, lng) => {
                        setEditForm(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng
                        }));
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Audience</label>
                    <div className="checkbox-group-av">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editForm.targetAudience?.includes('Tourist') || false}
                          onChange={(e) => {
                            const audiences = editForm.targetAudience?.split(', ').filter(a => a) || [];
                            if (e.target.checked) {
                              if (!audiences.includes('Tourist')) {
                                audiences.push('Tourist');
                              }
                            } else {
                              const index = audiences.indexOf('Tourist');
                              if (index > -1) audiences.splice(index, 1);
                            }
                            setEditForm(prev => ({
                              ...prev,
                              targetAudience: audiences.join(', ')
                            }));
                          }}
                        />
                        <span className="custom-checkbox"></span>
                        Tourist
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editForm.targetAudience?.includes('Local Business') || false}
                          onChange={(e) => {
                            const audiences = editForm.targetAudience?.split(', ').filter(a => a) || [];
                            if (e.target.checked) {
                              if (!audiences.includes('Local Business')) {
                                audiences.push('Local Business');
                              }
                            } else {
                              const index = audiences.indexOf('Local Business');
                              if (index > -1) audiences.splice(index, 1);
                            }
                            setEditForm(prev => ({
                              ...prev,
                              targetAudience: audiences.join(', ')
                            }));
                          }}
                        />
                        <span className="custom-checkbox"></span>
                        Local Business
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={
                            editForm.targetAudience?.split(', ').some(a => 
                              a && !['Tourist', 'Local Business'].includes(a)
                            ) || false
                          }
                          onChange={(e) => {
                            const audiences = editForm.targetAudience?.split(', ').filter(a => a) || [];
                            const hasOther = audiences.some(a => !['Tourist', 'Local Business'].includes(a));
                            
                            if (e.target.checked && !hasOther) {
                              // Add a placeholder for other audiences
                              audiences.push('Other');
                            } else if (!e.target.checked && hasOther) {
                              // Remove all non-standard audiences
                              const filtered = audiences.filter(a => 
                                ['Tourist', 'Local Business'].includes(a)
                              );
                              setEditForm(prev => ({
                                ...prev,
                                targetAudience: filtered.join(', ')
                              }));
                              return;
                            }
                            setEditForm(prev => ({
                              ...prev,
                              targetAudience: audiences.join(', ')
                            }));
                          }}
                        />
                        <span className="custom-checkbox"></span>
                        Other
                      </label>
                    </div>
                    {editForm.targetAudience?.split(', ').some(a => 
                      a && !['Tourist', 'Local Business'].includes(a)
                    ) && (
                      <input
                        type="text"
                        placeholder="Specify other audiences (comma-separated)"
                        value={editForm.targetAudience?.split(', ').filter(a => 
                          a && !['Tourist', 'Local Business'].includes(a)
                        ).join(', ') || ''}
                        onChange={(e) => {
                          const otherAudiences = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                          const standardAudiences = (editForm.targetAudience || '').split(', ').filter(a => 
                            ['Tourist', 'Local Business'].includes(a)
                          );
                          setEditForm(prev => ({
                            ...prev,
                            targetAudience: [...standardAudiences, ...otherAudiences].join(', ')
                          }));
                        }}
                        className="other-input form-input"
                        style={{ marginTop: '10px' }}
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label>Registration Required?</label>
                    <div className="radio-group-av">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="registrationRequired"
                          value="Yes"
                          checked={editForm.registrationRequired === 'Yes'}
                          onChange={handleInputChange}
                        />
                        <span className="custom-radio"></span>
                        Yes
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="registrationRequired"
                          value="No"
                          checked={editForm.registrationRequired === 'No'}
                          onChange={handleInputChange}
                        />
                        <span className="custom-radio"></span>
                        No
                      </label>
                    </div>
                  </div>
                </div>

                <div className="event-form-right">
                  <div className="calendar-section">
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
                      <label>End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={editForm.endDate || ''}
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

                  <div className="form-group">
                    <label>Event Type</label>
                    <select
                      name="eventType"
                      value={editForm.eventType || ''}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">Select event type</option>
                      {eventTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Event Image</label>
                    <div 
                      className={`image-upload-container ${uploadedImage ? 'has-image' : ''}`}
                      onClick={() => document.getElementById('edit-image-upload').click()}
                    >
                      <input
                        id="edit-image-upload"
                        type="file"
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <div className="upload-placeholder">
                        {uploadedImage ? (
                          <img src={uploadedImage} alt="Event" className="uploaded-preview" />
                        ) : (
                          <>
                            <FaCamera className="upload-icon" />
                            <span>Upload Event Poster/Image</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="cancel-btn"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={() => {
                        if (type === 'edit' && event) {
                          // Check if this is a past event
                          const currentDate = new Date();
                          currentDate.setHours(0, 0, 0, 0);
                          const eventEndDate = new Date(event.endDate);
                          eventEndDate.setHours(0, 0, 0, 0);
                          
                          if (eventEndDate < currentDate) {
                            // This is a past event - create new event instead of updating
                            const newEventData = {
                              name: editForm.name,
                              description: editForm.description,
                              eventType: editForm.eventType,
                              targetAudience: editForm.targetAudience?.split(',').map(a => a.trim()).filter(a => a) || [],
                              registrationRequired: editForm.registrationRequired,
                              startDate: editForm.startDate,
                              endDate: editForm.endDate,
                              startTime: editForm.startTime,
                              endTime: editForm.endTime,
                              latitude: parseFloat(editForm.latitude) || 1.5533,
                              longitude: parseFloat(editForm.longitude) || 110.3592,
                              eventOrganizers: editForm.eventOrganizers,
                              // Fix: Handle both string and array formats for eventHashtags
                              eventHashtags: typeof editForm.eventHashtags === 'string' 
                                ? editForm.eventHashtags.split(',').map(tag => tag.trim()).filter(tag => tag)
                                : editForm.eventHashtags || [],
                              imageFile: imageFile,
                              originalImageUrl: editForm.originalImageUrl || event.imageUrl
                            };

                            // Check if we have an image (either new upload or existing)
                            if (!imageFile && !editForm.originalImageUrl && !event.imageUrl) {
                              toast.error('Event image is required');
                              return;
                            }

                            onSave(newEventData, true); // true indicates creating new event from past
                          } else {
                            // This is an upcoming event - update normally
                            onSave(event._id);
                          }
                        }
                      }}
                    >
                      {type === 'edit' && event && (() => {
                        const currentDate = new Date();
                        currentDate.setHours(0, 0, 0, 0);
                        const eventEndDate = new Date(event.endDate);
                        eventEndDate.setHours(0, 0, 0, 0);
                        return eventEndDate < currentDate ? 'Create New Event' : 'Save Changes';
                      })()}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // View mode code remains the same as before
          <>
            <div className="modal-header">
              <img src={event.imageUrl} alt={event.name} className="modal-image" />
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <div className="modal-event-header">
                  <h2 className="modal-event-name">{event.name}</h2>
                  <div className="modal-event-type-centered">
                    <span className="modal-event-type-badge">{event.eventType}</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <h3>Event Details</h3>
                <div className="modal-details-list">
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Date</span>
                    <span className="modal-detail-value">{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                  </div>
                  
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Time</span>
                    <span className="modal-detail-value">{formatTimeRange(event.startTime, event.endTime)}</span>
                  </div>
                  
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Location</span>
                    <span className="modal-detail-value">
                      {event.coordinates 
                        ? `${event.coordinates.latitude.toFixed(6)}, ${event.coordinates.longitude.toFixed(6)}`
                        : event.location || 'Location not specified'
                      }
                    </span>
                  </div>
                  
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Registration</span>
                    <span className="modal-detail-value">
                      {event.registrationRequired === 'Yes' ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Organizers Details</h3>
                <div className="modal-detail-list">
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Event Organizers</span>
                    <span className="modal-detail-value">
                      {event.eventOrganizers || 'Not specified'}
                    </span>
                  </div>
                  
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Event Hashtags</span>
                    <span className="modal-detail-value">
                      {event.eventHashtags || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <h3>Description</h3>
                <p className="modal-description">{event.description}</p>
              </div>
              
              {event.coordinates && (
                <div className="modal-section">
                  <h3>Location Map</h3>
                  <MapModal 
                    latitude={event.coordinates.latitude} 
                    longitude={event.coordinates.longitude} 
                  />
                </div>
              )}
              
              <div className="modal-section">
                <h3>Target Audience</h3>
                <div className="modal-tags-centered">
                  {event.targetAudience.map((audience, index) => (
                    <span key={index} className="modal-tag">{audience}</span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AddEventPage = () => {
  // State for Add Event Form
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('addEventPageActiveTab');
    return savedTab || 'Add Event';
  });
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [eventTypeDropdownOpen, setEventTypeDropdownOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [targetAudience, setTargetAudience] = useState({
    tourist: false,
    localBusiness: false,
    other: false
  });
  const [otherAudience, setOtherAudience] = useState('');
  const [registrationRequired, setRegistrationRequired] = useState('No');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  // Date and Time states
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Coordinates state
  const [latitude, setLatitude] = useState(1.5533);
  const [longitude, setLongitude] = useState(110.3592);
  const [coordinatesInput, setCoordinatesInput] = useState('1.5533, 110.3592');

  // New fields
  const [eventOrganizers, setEventOrganizers] = useState('');
  const [eventHashtags, setEventHashtags] = useState('');
  
  // State for Past/Upcoming Events
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view' or 'edit'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({});
  
  const fileInputRef = useRef(null);

  const tabs = ['Add Event', 'Past Events', 'Schedule Upcoming Events', 'On-going Events'];
  
  const locations = ['Sarawak Cultural Village', 'Damai Beach', 'Kuching Waterfront'];
  const eventTypes = ['Festival', 'Workshop & Seminars', 'Community & Seasonal Bazaars', 'Music, Arts & Performance', 'Food & Culinary', 'Sporting', 'Art & Performance'];

  const { accessToken } = useAuth();

  useEffect(() => {
    localStorage.setItem('addEventPageActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const currentImage = uploadedImage;
    return () => {
      if (currentImage && currentImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage);
      }
    }
  }, [uploadedImage]);

  useEffect(() => {
    if (activeTab === 'Past Events' || activeTab === 'Schedule Upcoming Events' || activeTab === 'On-going Events') {
      fetchEvents();
    }
  }, [activeTab]);

  useEffect(() => {
    const filtered = events.filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await ky.get('/api/event/getAllEvents').json();
      
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to beginning of today
      
      let filteredEvents;
      
      if (activeTab === 'Past Events') {
        filteredEvents = response.events.filter(event => 
          new Date(event.endDate) < currentDate
        );
      } else if (activeTab === 'On-going Events') {
        filteredEvents = response.events.filter(event => {
          const eventStartDate = new Date(event.startDate);
          const eventEndDate = new Date(event.endDate);
          eventStartDate.setHours(0, 0, 0, 0);
          eventEndDate.setHours(0, 0, 0, 0);
          
          // Event is ongoing if current date is between start date and end date (inclusive)
          return currentDate >= eventStartDate && currentDate <= eventEndDate;
        });
      } else if (activeTab === 'Schedule Upcoming Events') {
        filteredEvents = response.events.filter(event => {
          const eventStartDate = new Date(event.startDate);
          eventStartDate.setHours(0, 0, 0, 0);
          
          // Event is upcoming if start date is after current date (haven't started yet)
          return eventStartDate > currentDate;
        });
      }
      
      setEvents(filteredEvents);
      setFilteredEvents(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions for date validation
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const isDateDisabled = (date, calendarType) => {
    const today = getToday();
    
    // Disable past dates for both calendars
    if (date <= today) {
      return true;
    }
    
    // For end date calendar, disable dates before selected start date
    if (calendarType === 'end' && startDate && date < startDate) {
      return true;
    }
    
    return false;
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const toggleEventTypeDropdown = () => {
    setEventTypeDropdownOpen(!eventTypeDropdownOpen);
    setLocationDropdownOpen(false);
  };

  const selectEventType = (type) => {
    setSelectedEventType(type);
    setEventTypeDropdownOpen(false);
  };

  const handleTargetAudienceChange = (audience) => {
    setTargetAudience({
      ...targetAudience,
      [audience]: !targetAudience[audience]
    });
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) { 
      const file = e.target.files[0];
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setUploadedImage(objectUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleCoordinatesChange = (e) => {
    const value = e.target.value;
    setCoordinatesInput(value);
    
    const coords = value.split(',').map(coord => coord.trim());
    if (coords.length === 2) {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setLatitude(lat);
          setLongitude(lng);
        }
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const [clat, clng] = clampToBounds(pos.coords.latitude, pos.coords.longitude);
        setEditForm(prev => ({
          ...prev,
          latitude: clat,
          longitude: clng
        }));
      },
      (err) => {
        const msg = err?.message || 'Unable to retrieve your location';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  const clearForm = () => {
    setEventName('');
    setEventDescription('');
    setSelectedLocation('');
    setSelectedEventType('');
    setTargetAudience({
      tourist: false,
      localBusiness: false,
      other: false
    });
    setOtherAudience('');
    setRegistrationRequired('No');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setStartDate(tomorrow);
    setEndDate(tomorrow);
    setStartTime('09:00');
    setEndTime('17:00');

    setUploadedImage(null);
    setImageFile(null);
    setLatitude(1.5533);
    setLongitude(110.3592);
    setCoordinatesInput('1.5533, 110.3592');
    setEventOrganizers('');
    setEventHashtags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getPreviousMonthDays = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    
    return Array.from({ length: firstDayOfMonth }, (_, i) => ({
      day: daysInPreviousMonth - firstDayOfMonth + i + 1,
      currentMonth: false,
      date: new Date(year, month - 1, daysInPreviousMonth - firstDayOfMonth + i + 1)
    }));
  };

  const getCurrentMonthDays = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      currentMonth: true,
      date: new Date(year, month, i + 1)
    }));
  };

  const getNextMonthDays = (year, month, days) => {
    const totalDaysShown = 42;
    const remainingDays = totalDaysShown - days.length;
    
    return Array.from({ length: remainingDays }, (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(year, month + 1, i + 1)
    }));
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const previousMonthDays = getPreviousMonthDays(year, month);
    const currentMonthDays = getCurrentMonthDays(year, month);
    const allDays = [...previousMonthDays, ...currentMonthDays];
    const nextMonthDays = getNextMonthDays(year, month, allDays);
    
    return [...allDays, ...nextMonthDays];
  };

  const moveMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateClick = (date, calendarType) => {
    if (isDateDisabled(date, calendarType)) {
      return;
    }
    
    if (calendarType === 'start') {
      setStartDate(date);
      setShowStartCalendar(false);
      
      // If end date is before new start date, reset end date
      if (endDate && endDate < date) {
        setEndDate(null);
      }
    } else {
      setEndDate(date);
      setShowEndCalendar(false);
    }
  };

  const isDateSelected = (date, calendarType) => {
    const selectedDate = calendarType === 'start' ? startDate : endDate;
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };

  const formatSelectedDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  const days = getCalendarDays();

  // Check if end time should be disabled
  const isEndTimeDisabled = () => {
    if (!startDate || !endDate || !startTime) return false;
    
    // Only disable if dates are the same
    if (startDate.getTime() === endDate.getTime()) {
      return true;
    }
    
    return false;
  };

  // Get min time for end time when dates are the same
  const getMinEndTime = () => {
    if (!startTime || !startDate || !endDate) return '';
    
    // Only enforce min time if dates are the same
    if (startDate.getTime() === endDate.getTime()) {
      return startTime;
    }
    
    return '';
  };

  // Time change handler
  const handleTimeChange = (time, timeType) => {
    if (timeType === 'start') {
      setStartTime(time);
    } else {
      setEndTime(time);
    }
  };

  const Calendar = ({ calendarType, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="calendar">
        <div className="calendar-header">
          <button 
            className="calendar-nav-btn"
            onClick={() => moveMonth('prev')}
          >
            <BsChevronLeft />
          </button>
          <div className="calendar-title">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button 
            className="calendar-nav-btn"
            onClick={() => moveMonth('next')}
          >
            <BsChevronRight />
          </button>
        </div>
        <div className="calendar-weekdays">
          {weekdays.map((day, index) => (
            <div key={index} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((day, index) => {
            const isDisabled = isDateDisabled(day.date, calendarType);
            const isSelected = isDateSelected(day.date, calendarType);
            
            return (
              <div 
                key={index}
                className={`calendar-day ${day.currentMonth ? '' : 'other-month'} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleDateClick(day.date, calendarType)}
              >
                {day.day}
              </div>
            );
          })}
        </div>
        <div className="calendar-footer">
          <button 
            className="calendar-button cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="calendar-button done"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  const publishEvent = async () => {
    // Validation checks
    if (!startDate || !endDate || !startTime || !endTime) {
      toast.error('Please select all date and time fields');
      return;
    }
    if (!eventName || !eventDescription || !selectedEventType) {
      toast.error('Please fill in name, description and event type');
      return;
    }
    if (!imageFile) {
      toast.error('Please upload an event image (JPEG/PNG, max 4.5MB)');
      return;
    }

    // Check if end date is before start date
    if (endDate < startDate) {
      toast.error('End date cannot be before start date');
      return;
    }

    // Check if end time is before start time when dates are the same
    if (startDate.getTime() === endDate.getTime() && endTime < startTime) {
      toast.error('End time cannot be before start time on the same day');
      return;
    }

    const formData = new FormData();
    formData.append('name', eventName);
    formData.append('description', eventDescription);
    formData.append('eventType', selectedEventType);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('eventOrganizers', eventOrganizers);
    formData.append('eventHashtags', eventHashtags); // comma-separated string
    
    const selectedAudiences = [];
    if (targetAudience.tourist) {
      selectedAudiences.push('Tourist');
    }
    if (targetAudience.localBusiness) {
      selectedAudiences.push('Local Business');
    }
    if (targetAudience.other && otherAudience.trim() !== '') {
      selectedAudiences.push(otherAudience.trim());
    }
    formData.append('targetAudience', JSON.stringify(selectedAudiences));
    formData.append('registrationRequired', registrationRequired);
    formData.append('startDate', startDate.toISOString());
    formData.append('endDate', endDate.toISOString());
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('image', imageFile);
    
    try {
      const response = await ky.post(
        "/api/event/addEvent",
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: formData
        }
      ).json();

      console.log(response);
      clearForm();
      toast.success('Event published successfully!');
    } catch (error) {
      let msg = 'Error publishing event.';
      try {
        const data = await error.response.json();
        if (data?.message) msg = data.message;
      } catch {}
      console.error('Publish error:', error);
      toast.error(msg);
    }
  };

  const saveAsDraft = () => {
    console.log('Saving as draft');
    toast.info('Event saved as draft!');
  };

  const previewEvent = () => {
    console.log('Previewing event');
    toast.info('Event preview feature coming soon!');
  };

  const openEventModal = (event, type = 'view') => {
    setSelectedEvent(event);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setModalType('view');
    setEditForm({});
    setUploadedImage(null);
    setImageFile(null);
  };

  const updateEvent = async (eventId) => {
    try {
      const formData = new FormData();
      
      // Add all fields to formData
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('eventType', editForm.eventType);
      formData.append('latitude', editForm.latitude.toString());
      formData.append('longitude', editForm.longitude.toString());
      formData.append('eventOrganizers', editForm.eventOrganizers);
      formData.append('eventHashtags', editForm.eventHashtags);
      
      // Handle target audience correctly
      const audiences = editForm.targetAudience?editForm.targetAudience.split(',').map(a => a.trim()).filter(a => a) : [];
      formData.append('targetAudience', JSON.stringify(audiences));
      
      formData.append('registrationRequired', editForm.registrationRequired);
      
      // Format dates correctly for the backend
      if (editForm.startDate) {
        const startDateObj = new Date(editForm.startDate);
        formData.append('startDate', startDateObj.toISOString());
      }
      
      if (editForm.endDate) {
        const endDateObj = new Date(editForm.endDate);
        formData.append('endDate', endDateObj.toISOString());
      }
      
      formData.append('startTime', editForm.startTime);
      formData.append('endTime', editForm.endTime);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await ky.put(
        `/api/event/updateEvent/${eventId}`,
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
          event._id === eventId ? response.event : event
        );
        setEvents(updatedEvents);
        setFilteredEvents(updatedEvents);
        closeEventModal();
        toast.success('Event updated successfully!');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      let msg = 'Error updating event.';
      try {
        const data = await error.response?.json();
        if (data?.message) msg = data.message;
      } catch {}
      toast.error(msg);
    }
  };

  const createNewEventFromPast = async (eventData) => {
    try {
      const formData = new FormData();
      
      // Add all fields to formData from the past event data
      formData.append('name', eventData.name);
      formData.append('description', eventData.description);
      formData.append('eventType', eventData.eventType);
      formData.append('latitude', eventData.latitude.toString());
      formData.append('longitude', eventData.longitude.toString());
      formData.append('eventOrganizers', eventData.eventOrganizers);
      
      // Handle eventHashtags - convert array to comma-separated string
      formData.append('eventHashtags', 
        Array.isArray(eventData.eventHashtags) 
          ? eventData.eventHashtags.join(', ') 
          : eventData.eventHashtags || ''
      );
      
      // Handle target audience
      formData.append('targetAudience', JSON.stringify(eventData.targetAudience));
      
      formData.append('registrationRequired', eventData.registrationRequired);
      
      // Format dates correctly for the backend
      if (eventData.startDate) {
        const startDateObj = new Date(eventData.startDate);
        formData.append('startDate', startDateObj.toISOString());
      }
      
      if (eventData.endDate) {
        const endDateObj = new Date(eventData.endDate);
        formData.append('endDate', endDateObj.toISOString());
      }
      
      formData.append('startTime', eventData.startTime);
      formData.append('endTime', eventData.endTime);
      
      // Handle image - this is the key fix
      if (eventData.imageFile) {
        // User uploaded a new image
        formData.append('image', eventData.imageFile);
      } else if (eventData.originalImageUrl) {
        try {
          // Convert the original image URL to a File object
          const imageFile = await urlToFile(eventData.originalImageUrl, 'event-image.jpg');
          formData.append('image', imageFile);
        } catch (error) {
          console.error('Error converting image URL to file:', error);
          toast.error('Failed to use the previous event image. Please upload a new image.');
          return;
        }
      } else {
        toast.error('Event image is required');
        return;
      }

      const response = await ky.post(
        "/api/event/addEvent",
        {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData
        }
      ).json();

      if (response.success) {
        // Refresh events to show the new one
        fetchEvents();
        closeEventModal();
        toast.success('New event created successfully from past event!');
      }
    } catch (error) {
      console.error('Error creating new event from past:', error);
      let msg = 'Error creating new event.';
      try {
        const data = await error.response?.json();
        if (data?.message) msg = data.message;
      } catch {}
      toast.error(msg);
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
        toast.success('Event deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const urlToFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error converting image URL to file:', error);
      throw error;
    }
  };

  const renderContent = () => {
    if (activeTab === 'Add Event') {
      return (
        <div className="event-form-container">
          <div className="event-form-left">
            <div className="form-group">
              <label>Event Name</label>
              <input
                type="text"
                placeholder='e.g., Sarawak Cultural Festival 2025'
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Event Description</label>
              <textarea
                placeholder="What is this event about?"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Event Organizers</label>
              <input
                type="text"
                placeholder="e.g., Sarawak Tourism Board"
                value={eventOrganizers}
                onChange={(e) => setEventOrganizers(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Event Hashtags</label>
              <input
                type="text"
                placeholder="e.g., #Festival, #Sarawak, #Culture"
                value={eventHashtags}
                onChange={(e) => setEventHashtags(e.target.value)}
                className="form-input"
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Separate multiple hashtags with commas
              </small>
            </div>

            <div className="form-group">
              <label>Event Location (Latitude, Longitude)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g., 1.5533, 110.3592"
                  value={coordinatesInput}
                  onChange={handleCoordinatesChange}
                  className="form-input"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  aria-label="Use current location"
                  style={{
                    position: 'absolute',
                    right: '0px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8b5cf6'
                  }}
                >
                  <FaLocationArrow size={18} />
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Enter coordinates for precise event location on the map
              </small>

              <MapPreview
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                  setCoordinatesInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                }}
              />
            </div>

            <div className="form-group">
              <label>Target Audience</label>
              <div className="checkbox-group-av">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={targetAudience.tourist}
                    onChange={() => handleTargetAudienceChange('tourist')}
                  />
                  <span className="custom-checkbox"></span>
                  Tourist
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={targetAudience.localBusiness}
                    onChange={() => handleTargetAudienceChange('localBusiness')}
                  />
                  <span className="custom-checkbox"></span>
                  Local Business
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={targetAudience.other}
                    onChange={() => handleTargetAudienceChange('other')}
                  />
                  <span className="custom-checkbox"></span>
                  Other
                </label>
              </div>
              {targetAudience.other && (
                <input
                  type="text"
                  placeholder="Specify other audiences (comma-separated)"
                  value={otherAudience}
                  onChange={(e) => setOtherAudience(e.target.value)}
                  className="other-input form-input"
                />
              )}
            </div>

            <div className="form-group">
              <label>Registration Required?</label>
              <div className="radio-group-av">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="registration"
                    value="Yes"
                    checked={registrationRequired === 'Yes'}
                    onChange={() => setRegistrationRequired('Yes')}
                  />
                  <span className="custom-radio"></span>
                  Yes
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="registration"
                    value="No"
                    checked={registrationRequired === 'No'}
                    onChange={() => setRegistrationRequired('No')}
                  />
                  <span className="custom-radio"></span>
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="event-form-right">
            <div className="calendar-section">
              <div className="form-group">
                <label>Start Date</label>
                <div 
                  className="date-display" 
                  onClick={() => {
                    setShowStartCalendar(!showStartCalendar);
                    setShowEndCalendar(false);
                  }}
                >
                  {startDate ? formatSelectedDate(startDate) : 'Select start date'}
                  <span className={`dropdown-arrow ${showStartCalendar ? 'open' : ''}`}>▼</span>
                </div>
                {showStartCalendar && (
                  <Calendar 
                    calendarType="start" 
                    isOpen={showStartCalendar} 
                    onClose={() => setShowStartCalendar(false)} 
                  />
                )}
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleTimeChange(e.target.value, 'start')}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <div 
                  className="date-display" 
                  onClick={() => {
                    setShowEndCalendar(!showEndCalendar);
                    setShowStartCalendar(false);
                  }}
                >
                  {endDate ? formatSelectedDate(endDate) : 'Select end date'}
                  <span className={`dropdown-arrow ${showEndCalendar ? 'open' : ''}`}>▼</span>
                </div>
                {showEndCalendar && (
                  <Calendar 
                    calendarType="end" 
                    isOpen={showEndCalendar} 
                    onClose={() => setShowEndCalendar(false)} 
                  />
                )}
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange(e.target.value, 'end')}
                  className="form-input"
                  min={getMinEndTime()}
                  disabled={isEndTimeDisabled() && !startTime}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Event Type</label>
              <div className="custom-dropdown">
                <div 
                  className="dropdown-selected"
                  onClick={toggleEventTypeDropdown}
                >
                  {selectedEventType || "Select event type"}
                  <span className={`dropdown-arrow ${eventTypeDropdownOpen ? 'open' : ''}`}>▼</span>
                </div>
                {eventTypeDropdownOpen && (
                  <div className="dropdown-options">
                    {eventTypes.map((type) => (
                      <div 
                        key={type} 
                        className={`dropdown-option ${selectedEventType === type ? 'selected' : ''}`}
                        onClick={() => selectEventType(type)}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Upload Image</label>
              <div 
                className={`image-upload-container ${uploadedImage ? 'has-image' : ''}`}
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <div className="upload-placeholder">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Event" className="uploaded-preview" />
                  ) : (
                    <>
                      <FaCamera className="upload-icon" />
                      <span>Upload Event Poster/Image</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="preview-button"
                onClick={previewEvent}
              >
                Live Preview
              </button>
              <button 
                className="draft-button"
                onClick={saveAsDraft}
              >
                Save as draft
              </button>
              <button 
                className="clear-button"
                onClick={clearForm}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'Past Events' || activeTab === 'Schedule Upcoming Events' || activeTab === 'On-going Events') {
      if (loading) {
        return <div className="loading">Loading events...</div>;
      }
      
      if (error) {
        return <div className="error">{error}</div>;
      }
      
      return (
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <h3>No {activeTab.toLowerCase()} found</h3>
              <p>There are no {activeTab.toLowerCase()} to display.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                type={activeTab === 'Schedule Upcoming Events' ? 'upcoming' : 'past'}
                onEdit={(event) => openEventModal(event, 'edit')}
                onDelete={deleteEvent}
                onClick={() => openEventModal(event, 'view')}
              />
            ))
          )}
        </div>
      );
    }
  };

  return (
    <div className="add-event-container">
      <Sidebar />
      <div className="add-event-content">
        <div className="add-event-header">
          <div className="heading">
            <h2>Add Event</h2>
            <p>Create and publish new event</p>
          </div>
        </div>

        <div className="event-tabs">
          {tabs.map((tab) => (
            <div
              key={tab}
              className={`event-tab ${activeTab === tab ? 'active-tab' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        {renderContent()}

        {activeTab === 'Add Event' && (
          <button 
            className="publish-button"
            onClick={publishEvent}
          >
            Publish Now
          </button>
        )}

        {isModalOpen && selectedEvent && (
          <EventModal
            event={selectedEvent}
            isOpen={isModalOpen}
            onClose={closeEventModal}
            type={modalType}
            onSave={(eventIdOrData, isNewFromPast = false) => {
              if (isNewFromPast) {
                // Creating new event from past event
                createNewEventFromPast(eventIdOrData);
              } else {
                // Updating existing event
                updateEvent(eventIdOrData);
              }
            }}
            editForm={editForm}
            setEditForm={setEditForm}
            uploadedImage={uploadedImage}
            setUploadedImage={setUploadedImage}
            imageFile={imageFile}
            setImageFile={setImageFile}
          />
        )}
      </div>
    </div>
  );
};

export default AddEventPage;
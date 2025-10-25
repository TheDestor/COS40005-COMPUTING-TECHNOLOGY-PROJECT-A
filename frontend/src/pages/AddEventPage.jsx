import { useState, useRef, useEffect } from 'react';
import { FaCamera, FaCalendar, FaMapMarkerAlt, FaClock, FaTimes, FaEdit, FaTrash, FaSearch, FaChevronLeft, FaChevronRight, FaChevronUp, FaCircle } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import Sidebar from '../components/Sidebar';
import ky from 'ky';
import '../styles/AddEventPage.css';
import { useAuth } from '../context/AuthProvider.jsx';
import { toast } from 'sonner';
import { FaLocationArrow } from 'react-icons/fa6';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

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
    <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px', zIndex: '1' }}>
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
const EventCard = ({ event, type, onEdit, onDelete, onClick, isNew = false, onMarkAsSeen }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Prefer dailySchedule times if present; fallback to uniform start/end
  const formatTimeRange = () => {
    const ds = Array.isArray(event.dailySchedule)
      ? event.dailySchedule.filter(e => e?.startTime && e?.endTime)
      : [];

    if (ds.length > 0) {
      const earliest = ds.slice().sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      return `${earliest.startTime} - ${earliest.endTime}`;
    }

    if (!event.startTime || !event.endTime) return 'Time not specified';
    return `${event.startTime} - ${event.endTime}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Coordinates copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy coordinates');
    });
  };

  const handleCardClick = (e) => {
    // Mark event as seen if it's new
    if (isNew && onMarkAsSeen) {
      onMarkAsSeen(event._id);
    }
    onClick(e);
  };

  return (
    <div 
      className="event-card ae-event-card"
      onClick={handleCardClick}
    >
      <div className="event-image">
        <img src={event.imageUrl} alt={event.name} />
        {isNew && (
          <div className="event-new-indicator"></div>
        )}
        <div className="event-date-badge">
          <FaCalendar className="date-icon-ae" />
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
              className="action-btn delete-btn-av"
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
              <span className="detail-value">{formatTimeRange()}</span>
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

  // Per-day schedule helpers and state for edit modal
  const toYMDModal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fromYMDModal = (str) => {
    const [y, m, d] = (str || '').split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const getDbTimesForKeyModal = (keyYmd) => {
    const match = event?.dailySchedule?.find(ds => {
      const k = toYMDModal(new Date(ds.date));
      return k === keyYmd;
    });
    return match && match.startTime && match.endTime
      ? { startTime: match.startTime, endTime: match.endTime }
      : null;
  };

  const getDatesInRangeModal = (startStr, endStr) => {
    const s = fromYMDModal(startStr);
    const e = fromYMDModal(endStr);
    const out = [];
    if (!s || !e) return out;
    const d = new Date(s);
    d.setHours(0, 0, 0, 0);
    const e0 = new Date(e);
    e0.setHours(0, 0, 0, 0);
    while (d <= e0) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  };

  const formatTimeDisplayModal = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const [editTimeMode, setEditTimeMode] = useState('uniform'); // 'uniform' | 'advanced'
  const [modalDailyTimes, setModalDailyTimes] = useState({}); // { 'YYYY-MM-DD': { startTime, endTime } }
  const [selectedScheduleDateModal, setSelectedScheduleDateModal] = useState(null);
  const [perDayDropdownOpenModal, setPerDayDropdownOpenModal] = useState(false);

  // Add: summary toggle state and date formatter
  const [isModalScheduleSummaryOpen, setModalScheduleSummaryOpen] = useState(false);
  const formatSelectedDateModal = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper: min start time for today is current time + 1 minute
  const getMinStartTimeForDateModal = (dateStr) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (dateStr === todayStr) {
      let hh = now.getHours();
      let mm = now.getMinutes() + 1; // strictly later than now
      if (mm >= 60) { hh += 1; mm = 0; }
      if (hh >= 24) { hh = 23; mm = 59; } // clamp near day end
      return `${pad(hh)}:${pad(mm)}`;
    }
    return undefined;
  };

  useEffect(() => {
    if (editTimeMode === 'advanced' && editForm.startDate && editForm.endDate) {
        const dates = getDatesInRangeModal(editForm.startDate, editForm.endDate);
        if (!selectedScheduleDateModal && dates.length) {
            setSelectedScheduleDateModal(toYMDModal(dates[0]));
        }
    }
  }, [editTimeMode, editForm.startDate, editForm.endDate, selectedScheduleDateModal]);

  // Lock page scroll when modal summary overlay is open
  useEffect(() => {
    if (isModalScheduleSummaryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalScheduleSummaryOpen]);

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

      // Get today's date for past events
      const getTodayDate = () => {
        const today = new Date();
        return formatDateForInput(today);
      };

      // Create initial form data object
      const initialFormData = {
        name: event.name,
        description: event.description,
        eventType: event.eventType,
        targetAudience: event.targetAudience.join(', '),
        registrationRequired: event.registrationRequired,
        // For past events, use today's date. For upcoming events, use existing dates
        startDate: isPastEvent ? getTodayDate() : formatDateForInput(event.startDate),
        endDate: isPastEvent ? getTodayDate() : formatDateForInput(event.endDate),
        startTime: event.startTime,
        endTime: event.endTime,
        latitude: event.coordinates?.latitude || 1.5533,
        longitude: event.coordinates?.longitude || 110.3592,
        eventOrganizers: event.eventOrganizers || '',
        eventHashtags: event.eventHashtags || '',
        dailySchedule: event.dailySchedule || []
      };

      // For past events, store the original image URL
      if (isPastEvent) {
        initialFormData.originalImageUrl = event.imageUrl;
      }

      // Set the form data and uploaded image
      setEditForm(initialFormData);
      setUploadedImage(event.imageUrl);

      // Set time mode based on presence of per-day schedule in backend
      const hasDaily = Array.isArray(event.dailySchedule) && event.dailySchedule.length > 0;
      setEditTimeMode(hasDaily ? 'advanced' : 'uniform');

      // Seed per-day times directly from backend schedule (no defaults here)
      setModalDailyTimes(() => {
        const next = {};
        if (hasDaily) {
          event.dailySchedule.forEach((entry) => {
            const k = toYMDModal(new Date(entry.date));
            if (entry.startTime && entry.endTime) {
              next[k] = { startTime: entry.startTime, endTime: entry.endTime };
            }
          });
        } else if (isPastEvent) {
          // Past event without daily schedule: show uniform times across current range
          const rangeDates = getDatesInRangeModal(initialFormData.startDate, initialFormData.endDate);
          rangeDates.forEach((d) => {
            const k = toYMDModal(d);
            next[k] = {
              startTime: event.startTime || '',
              endTime: event.endTime || '',
            };
          });
        }
        return next;
      });

      const rangeDates = getDatesInRangeModal(editForm.startDate, editForm.endDate);
      setSelectedScheduleDateModal(rangeDates.length ? toYMDModal(rangeDates[0]) : null);
    } else {
      setIsEditMode(false);
    }
  }, [event, type]);

  // If advanced mode is enabled but state is empty, rehydrate from backend
  useEffect(() => {
    if (editTimeMode === 'advanced' && event?.dailySchedule?.length && Object.keys(modalDailyTimes || {}).length === 0) {
      const next = {};
      event.dailySchedule.forEach((entry) => {
        const k = toYMDModal(new Date(entry.date));
        if (entry.startTime && entry.endTime) {
          next[k] = { startTime: entry.startTime, endTime: entry.endTime };
        }
      });
      setModalDailyTimes(next);
    }
  }, [editTimeMode, event, modalDailyTimes]);

  // Keep editForm.dailySchedule in sync with modal edits
  useEffect(() => {
    if (editTimeMode === 'advanced') {
      const payload = Object.entries(modalDailyTimes).map(([k, t]) => ({
        date: new Date(fromYMDModal(k)).toISOString(),
        startTime: t.startTime,
        endTime: t.endTime,
      }));
      setEditForm((prev) => ({ ...prev, dailySchedule: payload }));
    } else {
      setEditForm((prev) => ({ ...prev, dailySchedule: [] }));
    }
  }, [editTimeMode, modalDailyTimes, setEditForm]);

  const togglePerDayDropdownModal = () => setPerDayDropdownOpenModal((o) => !o);
  const selectPerDayDayModal = (d) => {
    const k = toYMDModal(d);
    setSelectedScheduleDateModal(k);
    setPerDayDropdownOpenModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'eventHashtags') {
      // Allow letters, numbers, commas, spaces, and '#'
      const allowedChars = /^[A-Za-z0-9#,\s]*$/;
      if (value && !allowedChars.test(value)) {
        toast.error('Only letters, numbers, commas, spaces, and # are allowed.');
        return;
      }
      // Do not enforce per-tag format while typing
    }

    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));

    // If in advanced mode and date changes, update per-day schedule
    if (editTimeMode === 'advanced' && (name === 'startDate' || name === 'endDate')) {
      const updatedForm = { ...editForm, [name]: value };
      if (updatedForm.startDate && updatedForm.endDate) {
        const dates = getDatesInRangeModal(updatedForm.startDate, updatedForm.endDate);
        const newDailyTimes = {};
        dates.forEach((d) => {
          const k = toYMDModal(d);
          // Keep existing times if they exist, otherwise use default
          newDailyTimes[k] = modalDailyTimes[k] || {
            startTime: editForm.startTime || '09:00',
            endTime: editForm.endTime || '17:00',
          };
        });
        setModalDailyTimes(newDailyTimes);
      }
    }
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
    const s = formatTimeDisplayModal(startTime);
    const e = formatTimeDisplayModal(endTime);
    return s && e ? `${s} - ${e}` : (s || e || '');
  };

  // Always show a time range, even if event hasn't started or has ended
  const getTodaysTime = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventStartDate = new Date(event.startDate);
    eventStartDate.setHours(0, 0, 0, 0);
    const eventEndDate = new Date(event.endDate);
    eventEndDate.setHours(0, 0, 0, 0);

    const hasDaily = Array.isArray(event.dailySchedule) && event.dailySchedule.length > 0;
    const uniform = formatTimeRange(event.startTime, event.endTime);

    const findScheduleTimeForDate = (date) => {
      if (!hasDaily) return null;
      const entry = event.dailySchedule.find((d) => {
        if (!d?.date) return false;
        const dd = new Date(d.date);
        dd.setHours(0, 0, 0, 0);
        return dd.getTime() === date.getTime();
      });
      return entry?.startTime && entry?.endTime ? `${entry.startTime} - ${entry.endTime}` : null;
    };

    if (today < eventStartDate) {
      if (hasDaily) {
        const first = event.dailySchedule
          .slice()
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .find((d) => d.startTime && d.endTime);
        if (first) return `${first.startTime} - ${first.endTime}`;
      }
      return uniform;
    }

    if (today > eventEndDate) {
      if (hasDaily) {
        const last = event.dailySchedule
          .slice()
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .reverse()
          .find((d) => d.startTime && d.endTime);
        if (last) return `${last.startTime} - ${last.endTime}`;
      }
      return uniform;
    }

    return findScheduleTimeForDate(today) || uniform;
  };

  // State for view schedule modal
  const [isViewScheduleModalOpen, setViewScheduleModalOpen] = useState(false);

  // Lock page scroll when view schedule modal is open
  useEffect(() => {
    if (isViewScheduleModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isViewScheduleModalOpen]);

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
              <div className="event-form-container-ae edit-event-form">
                <div className="event-form-left ae-form-left">
                  <div className="form-group-ae">
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

                  <div className="form-group-ae">
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

                  <div className="form-group-ae">
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

                  <div className="form-group-ae">
                    <label>Event Hashtags</label>
                    <input
                    type="text"
                    name="eventHashtags"
                    value={editForm.eventHashtags || ''}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      const normalized = (e.target.value || '')
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean)
                        .map(t => `#${t.replace(/^#+/, '')}`)
                        .join(', ');
                      setEditForm(prev => ({ ...prev, eventHashtags: normalized }));
                    }}
                    className="form-input"
                    placeholder="e.g., #Festival, #Sarawak, #Culture"
                    pattern="^[A-Za-z0-9#,\s]+$"
                    title="Only alphanumeric characters, commas, spaces, and # allowed."
                  />
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Separate multiple hashtags with commas
                    </small>
                  </div>

                  <div className="form-group-ae">
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
                        className="use-current-location-btn"
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
                </div>

                <div className="event-form-right ae-form-right">
                  <div className="calendar-section">
                    <div className="form-group-ae">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={editForm.startDate || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      min={new Date().toLocaleDateString('en-CA')}
                    />
                  </div>

                    <div className="form-group-ae">
                      <label>Start Time {editTimeMode === 'advanced' && <span className="disabled-label">(Disabled - Using per-day schedule)</span>}</label>
                      <input
                        type="time"
                        name="startTime"
                        value={editForm.startTime || ''}
                        onChange={handleInputChange}
                        className={`form-input ${editTimeMode === 'advanced' ? 'disabled-input' : ''}`}
                        disabled={editTimeMode === 'advanced'}
                        lang="en-GB"
                        min={getMinStartTimeForDateModal(editForm.startDate)}
                      />
                    </div>

                    <div className="form-group-ae">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={editForm.endDate || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      min={editForm.startDate || new Date().toLocaleDateString('en-CA')}
                    />
                  </div>

                    <div className="form-group-ae">
                      <label>End Time {editTimeMode === 'advanced' && <span className="disabled-label">(Disabled - Using per-day schedule)</span>}</label>
                      <input
                        type="time"
                        name="endTime"
                        value={editForm.endTime || ''}
                        onChange={handleInputChange}
                        className={`form-input ${editTimeMode === 'advanced' ? 'disabled-input' : ''}`}
                        disabled={editTimeMode === 'advanced'}
                        lang="en-GB"
                      />
                    </div>

                    {/* Per-day schedule toggle + inputs */}
                    <div className="form-group-ae">
                      <div className="edit-per-day-group">
                        <div className="time-mode-toggle">
                          <label>
                            <input
                              type="checkbox"
                              checked={editTimeMode === 'advanced'}
                              onChange={(e) => {
                                const isAdvanced = e.target.checked;
                                setEditTimeMode(isAdvanced ? 'advanced' : 'uniform');
                                if (isAdvanced) {
                                  // Keep existing entries; only prefill if none
                                  if (Object.keys(modalDailyTimes || {}).length > 0) return;
                                  const dates = getDatesInRangeModal(editForm.startDate, editForm.endDate);
                                  const next = {};
                                  dates.forEach((d) => {
                                    const k = toYMDModal(d);
                                    next[k] = {
                                      startTime: event?.startTime || '09:00',
                                      endTime: event?.endTime || '17:00',
                                    };
                                  });
                                  setModalDailyTimes(next);
                                  setSelectedScheduleDateModal(toYMDModal(dates[0]));
                                } else {
                                  setModalDailyTimes({});
                                  setSelectedScheduleDateModal(null);
                                }
                              }}
                            />
                            Set different time per day
                          </label>
                        </div>

                        {editTimeMode === 'advanced' && (
                          <div className="per-day-schedule-compact">
                            <div className="per-day-selector">
                              <label className="per-day-selector-label">Select event day</label>
                              <div className="custom-dropdown">
                                <div
                                  className="dropdown-selected"
                                  onClick={togglePerDayDropdownModal}
                                >
                                  {selectedScheduleDateModal
                                    ? new Date(fromYMDModal(selectedScheduleDateModal)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : 'Select event day'}
                                  <span className={`dropdown-arrow ${perDayDropdownOpenModal ? 'open' : ''}`}>▼</span>
                                </div>
                                {perDayDropdownOpenModal && (
                                  <div className="dropdown-options">
                                    {getDatesInRangeModal(editForm.startDate, editForm.endDate).map((d) => {
                                      const k = toYMDModal(d);
                                      const isSelected = selectedScheduleDateModal === k;
                                      return (
                                        <div
                                          key={k}
                                          className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                                          onClick={() => selectPerDayDayModal(d)}
                                        >
                                          {d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="per-day-time-inputs">
                              <input
                                type="time"
                                className="per-day-time-input"
                                value={(modalDailyTimes[selectedScheduleDateModal]?.startTime) || ''}
                                onChange={(e) =>
                                  setModalDailyTimes(prev => ({
                                    ...prev,
                                    [selectedScheduleDateModal]: {
                                      ...(prev[selectedScheduleDateModal] || {}),
                                      startTime: e.target.value
                                    }
                                  }))
                                }
                                lang="en-GB"
                                min={getMinStartTimeForDateModal(selectedScheduleDateModal)}
                              />
                              <span className="time-separator">—</span>
                              <input
                                type="time"
                                className="per-day-time-input"
                                value={(modalDailyTimes[selectedScheduleDateModal]?.endTime) || ''}
                                min={(modalDailyTimes[selectedScheduleDateModal]?.startTime) || ''}
                                onChange={(e) =>
                                  setModalDailyTimes(prev => ({
                                    ...prev,
                                    [selectedScheduleDateModal]: {
                                      ...(prev[selectedScheduleDateModal] || {}),
                                      endTime: e.target.value
                                    }
                                  }))
                                }
                                lang="en-GB"
                              />
                            </div>
                            
                            <div className="admin-schedule-actions">
                              <button
                                type="button"
                                className="schedule-summary-btn"
                                onClick={() => setModalScheduleSummaryOpen(true)}
                                aria-expanded={isModalScheduleSummaryOpen}
                              >
                                View Per-Day Schedule
                              </button>
                            </div>

                            {isModalScheduleSummaryOpen && (
                              <div
                                className="ae-schedule-summary-overlay"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="aeScheduleSummaryTitle"
                                onClick={() => setModalScheduleSummaryOpen(false)}
                              >
                                <div className="ae-schedule-summary-modal" onClick={e => e.stopPropagation()}>
                                  <div className="ae-schedule-summary-header">
                                    <h3 id="aeScheduleSummaryTitle">Per-Day Schedule Summary</h3>
                                    <button
                                      type="button"
                                      className="ae-schedule-summary-close"
                                      onClick={() => setModalScheduleSummaryOpen(false)}
                                      aria-label="Close summary"
                                      title="Close"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <div className="ae-schedule-summary-list">
                                    {getDatesInRangeModal(editForm.startDate, editForm.endDate).map((d) => {
                                      const k = toYMDModal(d);
                                      const t = modalDailyTimes[k] || {};
                                      return (
                                        <div key={k} className="ae-summary-row">
                                          <div className="ae-summary-date">{formatSelectedDateModal(d)}</div>
                                          <div className="ae-summary-times">
                                            {(t.startTime ? formatTimeDisplayModal(t.startTime) : '—')}
                                            {' — '}
                                            {(t.endTime ? formatTimeDisplayModal(t.endTime) : '—')}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group-ae">
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

                  <div className="form-group-ae">
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

            // Add normalized dailySchedule if present
            if (Array.isArray(editForm.dailySchedule) && editForm.dailySchedule.length > 0) {
              newEventData.dailySchedule = editForm.dailySchedule.map(entry => ({
                date: new Date(entry.date).toISOString(),
                startTime: entry.startTime,
                endTime: entry.endTime
              }));
            }

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
                    <span className="modal-detail-value">
                      {(() => {
                        const hasDailyTimes =
                          Array.isArray(event.dailySchedule) &&
                          event.dailySchedule.some(ds => ds?.startTime && ds?.endTime);

                        const timeText = hasDailyTimes
                          ? getTodaysTime()
                          : formatTimeRange(event.startTime, event.endTime);

                        return (
                          <>
                            {timeText}
                            {!hasDailyTimes && ' (every date same time)'}
                            {hasDailyTimes && (
                              <button
                                className="ae-view-schedule-btn"
                                onClick={() => setViewScheduleModalOpen(true)}
                                title="View all daily schedule times"
                              >
                                View Schedule
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </span>
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

        {/* View Schedule Modal Overlay */}
        {isViewScheduleModalOpen && (
          <div
            className="ae-schedule-summary-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="viewScheduleModalTitle"
            onClick={() => setViewScheduleModalOpen(false)}
          >
            <div className="ae-schedule-summary-modal" onClick={e => e.stopPropagation()}>
              <div className="ae-schedule-summary-header">
                <h3 id="viewScheduleModalTitle">Daily Schedule</h3>
                <button
                  type="button"
                  className="ae-schedule-summary-close"
                  onClick={() => setViewScheduleModalOpen(false)}
                  aria-label="Close schedule summary"
                  title="Close"
                >
                  ×
                </button>
              </div>
              <div className="ae-schedule-summary-list">
                {event.dailySchedule && Array.isArray(event.dailySchedule) && event.dailySchedule.map((entry) => (
                  <div key={entry._id || entry.date} className="ae-summary-row">
                    <div className="ae-summary-date ae-summary-date-view">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="ae-summary-times">
                      {entry.startTime || '—'} — {entry.endTime || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

  // NEW: time mode and per-day schedule
  const [timeMode, setTimeMode] = useState('uniform'); // 'uniform' | 'advanced'
  const [dailyTimes, setDailyTimes] = useState({}); // { 'YYYY-MM-DD': { startTime, endTime } }

  // Must be declared BEFORE any useEffect that references them
  const [isScheduleSummaryOpen, setScheduleSummaryOpen] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
  const [perDayDropdownOpen, setPerDayDropdownOpen] = useState(false);

  // Prevent page scroll when modal is open
  useEffect(() => {
    if (isScheduleSummaryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isScheduleSummaryOpen]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'clear' | 'publish' | 'delete'
  const [pendingDeleteEventId, setPendingDeleteEventId] = useState(null);
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
  const contentRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);



  // Enable summary button only when all per-day times are configured
  const isAdvancedScheduleComplete = () => {
    if (timeMode !== 'advanced' || !startDate || !endDate) return false;
    const dates = getDatesInRange(startDate, endDate);
    return dates.every(d => {
      const k = toYMD(d);
      const t = dailyTimes[k] || {};
      return !!t.startTime && !!t.endTime;
    });
  };

  // NEW: helpers for per-day schedule
  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fromYMD = (str) => {
    const [y, m, d] = (str || '').split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const getDatesInRange = (start, end) => {
    if (!start || !end) return [];
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const list = [];
    for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
      list.push(new Date(dt));
    }
    return list;
  };

  // Date and Time states
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // NEW: sync per-day entries when date range changes
  useEffect(() => {
    if (!startDate || !endDate) return;
    const dates = getDatesInRange(startDate, endDate);
    setDailyTimes(prev => {
      const next = { ...prev };
      const keysInRange = new Set(dates.map(d => toYMD(d)));
      // add missing dates
      dates.forEach(d => {
        const k = toYMD(d);
        if (!next[k]) {
          next[k] = { startTime: startTime || '09:00', endTime: endTime || '17:00' };
        }
      });
      // remove dates outside range
      Object.keys(next).forEach(k => {
        if (!keysInRange.has(k)) delete next[k];
      });
      return next;
    });
  }, [startDate, endDate, startTime, endTime]);

  // Keep selected day within the current date range
  useEffect(() => {
    if (!startDate || !endDate) {
      setSelectedScheduleDate(null);
      return;
    }
    const dates = getDatesInRange(startDate, endDate);
    const firstKey = dates.length ? toYMD(dates[0]) : null;
    setSelectedScheduleDate(prev =>
      prev && dates.some(d => toYMD(d) === prev) ? prev : firstKey
    );
  }, [startDate, endDate]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 200);
    };

    el.addEventListener('scroll', onScroll);
    onScroll(); // initialize visibility
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  
  // State for tracking new events and seen status
  const [newEvents, setNewEvents] = useState({
    'Past Events': [],
    'Schedule Upcoming Events': [],
    'On-going Events': []
  });
  const [seenEvents, setSeenEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('addEventPageSeenEvents')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('addEventPageSeenEvents', JSON.stringify(seenEvents));
  }, [seenEvents]);

  // NEW: helper to normalize hashtags on blur/submit
  const normalizeHashtags = (raw) => {
    return (raw || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => `#${t.replace(/^#+/, '')}`)
      .join(', ');
  };

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  // Add indices for the "Showing X–Y of N" calculations
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length);
  
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setShowScrollTop(contentRef.current.scrollTop > 300);
      }
    };
    
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs = ['Add Event', 'Past Events', 'Schedule Upcoming Events', 'On-going Events'];
  
  const locations = ['Sarawak Cultural Village', 'Damai Beach', 'Kuching Waterfront'];
  const eventTypes = ['Festival', 'Workshop & Seminars', 'Community & Seasonal Bazaars', 'Music, Arts & Performance', 'Food & Culinary', 'Sporting', 'Art & Performance'];

  const { accessToken } = useAuth();

  useEffect(() => {
    localStorage.setItem('addEventPageActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (
      activeTab === 'Past Events' ||
      activeTab === 'Schedule Upcoming Events' ||
      activeTab === 'On-going Events'
    ) {
      fetchEvents();
    }
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
    const q = searchQuery.toLowerCase().trim();
    const filtered = events.filter(event =>
      ((event?.name ?? '').toLowerCase().includes(q)) ||
      ((event?.description ?? '').toLowerCase().includes(q)) ||
      ((event?.location ?? '').toLowerCase().includes(q))
    );
    // NEW: keep search results sorted by latest updated first
    const sorted = [...filtered].sort((a, b) => {
      const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (bUpdated !== aUpdated) return bUpdated - aUpdated;
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });
    setFilteredEvents(sorted);
    setCurrentPage(1);
  }, [searchQuery, events]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredEvents, totalPages]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const prevPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await ky.get('/api/event/getAllEvents').json();

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      let filteredEvents;

      if (activeTab === 'Past Events') {
        filteredEvents = response.events.filter(
          (event) => new Date(event.endDate) < currentDate
        );
      } else if (activeTab === 'On-going Events') {
        filteredEvents = response.events.filter((event) => {
          const eventStartDate = new Date(event.startDate);
          const eventEndDate = new Date(event.endDate);
          eventStartDate.setHours(0, 0, 0, 0);
          eventEndDate.setHours(0, 0, 0, 0);
          return currentDate >= eventStartDate && currentDate <= eventEndDate;
        });
      } else if (activeTab === 'Schedule Upcoming Events') {
        filteredEvents = response.events.filter((event) => {
          const eventStartDate = new Date(event.startDate);
          eventStartDate.setHours(0, 0, 0, 0);
          return eventStartDate > currentDate;
        });
      } else {
        // NEW: safe fallback for "Add Event" tab
        filteredEvents = [];
      }

      // NEW: sort by latest updated first, fallback to created
      filteredEvents = filteredEvents.sort((a, b) => {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (bUpdated !== aUpdated) return bUpdated - aUpdated;
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      });

      // Compute dots for all tabs based on unseen events
      setNewEvents((prev) => {
        const updatedNewEvents = { ...prev };
        ['Past Events', 'Schedule Upcoming Events', 'On-going Events'].forEach((tab) => {
          let tabEvents;
          if (tab === 'Past Events') {
            tabEvents = response.events.filter((event) => new Date(event.endDate) < currentDate);
          } else if (tab === 'On-going Events') {
            tabEvents = response.events.filter((event) => {
              const eventStartDate = new Date(event.startDate);
              const eventEndDate = new Date(event.endDate);
              eventStartDate.setHours(0, 0, 0, 0);
              eventEndDate.setHours(0, 0, 0, 0);
              return currentDate >= eventStartDate && currentDate <= eventEndDate;
            });
          } else {
            tabEvents = response.events.filter((event) => {
              const eventStartDate = new Date(event.startDate);
              eventStartDate.setHours(0, 0, 0, 0);
              return eventStartDate > currentDate;
            });
          }
          const newTabEvents = tabEvents.filter((event) => !seenEvents.includes(event._id));
          updatedNewEvents[tab] = newTabEvents.map((event) => event._id);
        });
        return updatedNewEvents;
      });

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
    
    // Disable past dates (strictly before today)
    if (date < today) {
      return true;
    }

    // For end date calendar, disable dates before selected start date
    if (calendarType === 'end' && startDate && date < startDate) {
      return true;
    }
    
    return false;
  };

  const handleTabClick = (tab) => {
    // Only switch tab; do not mark events as seen here
    setActiveTab(tab);
    // No automatic clearing of red dots on tab navigation
  };

  const toggleEventTypeDropdown = () => {
    setEventTypeDropdownOpen(!eventTypeDropdownOpen);
    setLocationDropdownOpen(false);
  };

  const togglePerDayDropdown = () => {
    setPerDayDropdownOpen(!perDayDropdownOpen);
  };

  const selectEventType = (type) => {
    setSelectedEventType(type);
    setEventTypeDropdownOpen(false);
  };

  const selectPerDayDay = (dateObj) => {
    const k = toYMD(dateObj);
    setSelectedScheduleDate(k);
    setPerDayDropdownOpen(false);
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
    
    let newStartDate = startDate;
    let newEndDate = endDate;
    
    if (calendarType === 'start') {
      newStartDate = date;
      setStartDate(date);
      setShowStartCalendar(false);
      
      // If end date is before new start date, reset end date
      if (endDate && endDate < date) {
        newEndDate = null;
        setEndDate(null);
      }
    } else {
      newEndDate = date;
      setEndDate(date);
      setShowEndCalendar(false);
    }

    // If in advanced mode and both dates are set, update per-day schedule
    if (timeMode === 'advanced' && newStartDate && newEndDate) {
      const dates = getDatesInRange(newStartDate, newEndDate);
      const newDailyTimes = {};
      dates.forEach((d) => {
        const k = toYMD(d);
        // Keep existing times if they exist, otherwise use current start/end times
        newDailyTimes[k] = dailyTimes[k] || {
          startTime: startTime || '09:00',
          endTime: endTime || '17:00',
        };
      });
      setDailyTimes(newDailyTimes);
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

  const generateTimeOptionsAe = (stepMinutes = 30) => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        options.push(`${hh}:${mm}`);
      }
    }
    return options;
  };

  const formatTimeDisplayAe = (time) => {
    if (!time) return '';
    const [hh, mm] = time.split(':').map(Number);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

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

// Helper: min start time for today is current time + 1 minute
const getMinStartTimeForDate = (dateOrYmd) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  let dateStr = '';
  if (dateOrYmd instanceof Date) {
    dateStr = `${dateOrYmd.getFullYear()}-${pad(dateOrYmd.getMonth() + 1)}-${pad(dateOrYmd.getDate())}`;
  } else if (typeof dateOrYmd === 'string') {
    dateStr = dateOrYmd;
  }

  if (dateStr === todayStr) {
    let hh = now.getHours();
    let mm = now.getMinutes() + 1; // strictly later than now
    if (mm >= 60) { hh += 1; mm = 0; }
    if (hh >= 24) { hh = 23; mm = 59; } // clamp at end of day
    return `${pad(hh)}:${pad(mm)}`;
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

  // Helper component in AddEventPage.jsx (place near Calendar component)
  const TimePickerAe = ({ timeType, isOpen, currentValue, onClose, startDate, endDate, startTime, handleTimeChange }) => {
    if (!isOpen) return null;

    const times = generateTimeOptionsAe(30);
    const [tempTime, setTempTime] = useState(currentValue || '');
    const isSameDay = startDate && endDate && startDate.getTime() === endDate.getTime();
    const isOptionDisabled = (value) => timeType === 'end' && isSameDay && startTime && value < startTime;

    return (
      <div className="time-picker-ae">
        <div className="time-picker-header-ae">
          <div className="time-picker-title-ae">
            {timeType === 'start' ? 'Select Start Time' : 'Select End Time'}
          </div>
        </div>

        <div className="time-picker-grid-ae">
          {times.map((t) => (
            <button
              key={t}
              type="button"
              className={`time-picker-option-ae ${tempTime === t ? 'selected' : ''} ${isOptionDisabled(t) ? 'disabled' : ''}`}
              onClick={() => !isOptionDisabled(t) && setTempTime(t)}
            >
              {formatTimeDisplayAe(t)}
            </button>
          ))}
        </div>

        <div className="time-picker-footer-ae">
          <button type="button" className="time-picker-button-ae cancel" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="time-picker-button-ae done"
            onClick={() => {
              handleTimeChange(tempTime, timeType);
              onClose();
            }}
            disabled={!tempTime}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  const validateEventForm = () => {
    const errors = [];

    if (!eventName?.trim()) errors.push('Event name is required.');
    if (!eventDescription?.trim()) errors.push('Event description is required.');
    if (!selectedEventType) errors.push('Event type is required.');

    if (!startDate || !(startDate instanceof Date)) errors.push('Start date is required.');
    if (!endDate || !(endDate instanceof Date)) errors.push('End date is required.');

    if (endDate && startDate && endDate < startDate) {
      errors.push('End date cannot be before start date.');
    }

    if (timeMode === 'uniform') {
      if (!startTime) errors.push('Start time is required.');
      if (!endTime) errors.push('End time is required.');
      const timeRegex = /^\d{2}:\d{2}$/;
      if (startTime && !timeRegex.test(startTime)) errors.push('Start time must be HH:MM.');
      if (endTime && !timeRegex.test(endTime)) errors.push('End time must be HH:MM.');
      if (
        startDate && endDate && startDate.getTime() === endDate.getTime() &&
        startTime && endTime && endTime < startTime
      ) {
        errors.push('End time cannot be before start time on the same day.');
      }
    } else {
      // Advanced mode: validate each day
      const dates = getDatesInRange(startDate, endDate);
      const timeRegex = /^\d{2}:\d{2}$/;
      dates.forEach(d => {
        const k = toYMD(d);
        const t = dailyTimes[k] || {};
        if (!t.startTime || !t.endTime) {
          errors.push(`Time is required for ${formatSelectedDate(d)}.`);
        } else {
          if (!timeRegex.test(t.startTime)) errors.push(`Start time for ${formatSelectedDate(d)} must be HH:MM.`);
          if (!timeRegex.test(t.endTime)) errors.push(`End time for ${formatSelectedDate(d)} must be HH:MM.`);
          if (t.endTime < t.startTime) errors.push(`End time before start time on ${formatSelectedDate(d)}.`);
        }
      });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      errors.push('Valid coordinates are required.');
    } else {
      const ll = L.latLng(latitude, longitude);
      if (!SARAWAK_BOUNDS.contains(ll)) {
        errors.push('Coordinates must be within Sarawak bounds.');
      }
    }

    if (eventHashtags) {
      // Allow letters, numbers, '#', commas, and spaces
      const allowedChars = /^[A-Za-z0-9#,\s]+$/;
      const tagFormat = /^#?[A-Za-z0-9]+$/;

      if (!allowedChars.test(eventHashtags)) {
        errors.push('Hashtags: only letters, numbers, commas, spaces, and #.');
      } else {
        const tags = eventHashtags.split(',').map(t => t.trim()).filter(Boolean);
        if (tags.some(t => !tagFormat.test(t))) {
          errors.push('Hashtags must be alphanumeric, optionally starting with #.');
        }
      }
    }

    const audienceSelected = (
      !!targetAudience.tourist ||
      !!targetAudience.localBusiness ||
      (!!targetAudience.other && !!otherAudience.trim())
    );
    if (!audienceSelected) errors.push('Select at least one target audience.');

    if (!['Yes', 'No'].includes(registrationRequired)) {
      errors.push('Registration required must be Yes or No.');
    }

    if (!imageFile) {
      errors.push('Event image is required.');
    } else {
      const maxSize = 4.5 * 1024 * 1024; // 4.5MB
      if (!imageFile.type?.startsWith('image/')) {
        errors.push('Event image must be an image file.');
      }
      if (imageFile.size > maxSize) {
        errors.push('Event image must be 4.5MB or less.');
      }
    }

    return errors;
  };

  const publishEvent = async () => {
    const errors = validateEventForm();
    if (errors.length) {
      toast.error(`Form not completed:\n- ${errors.join('\n- ')}`);
      return false;
    }

    // Today-only validation: start time must be strictly later than now
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (timeMode === 'uniform') {
      const startYmd = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
      if (startYmd === todayStr && startTime && startTime <= nowHHMM) {
        toast.error('For today, start time must be later than the current time.');
        return false;
      }
    } else {
      const dates = getDatesInRange(startDate, endDate);
      const invalidTodayStart = dates.some(d => {
        const k = toYMD(d);
        return k === todayStr && dailyTimes[k]?.startTime && dailyTimes[k].startTime <= nowHHMM;
      });
      if (invalidTodayStart) {
        toast.error('For today, start time must be later than the current time.');
        return false;
      }
    }

    const formData = new FormData();
    formData.append('name', eventName);
    formData.append('description', eventDescription);
    formData.append('eventType', selectedEventType);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('eventOrganizers', eventOrganizers);
    // Normalize hashtags before sending (covers any leftover raw input)
    formData.append('eventHashtags', normalizeHashtags(eventHashtags));

    const selectedAudiences = [];
    if (targetAudience.tourist) selectedAudiences.push('Tourist');
    if (targetAudience.localBusiness) selectedAudiences.push('Local Business');
    if (targetAudience.other && otherAudience.trim() !== '') selectedAudiences.push(otherAudience.trim());
    formData.append('targetAudience', JSON.stringify(selectedAudiences));

    formData.append('registrationRequired', registrationRequired);
    formData.append('startDate', toYMD(startDate));
    formData.append('endDate', toYMD(endDate));

    if (timeMode === 'uniform') {
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
    } else {
      const dates = getDatesInRange(startDate, endDate);
      const schedule = dates.map(d => {
        const k = toYMD(d);
        const t = dailyTimes[k] || {};
        return {
          date: d.toISOString(),
          startTime: t.startTime || '09:00',
          endTime: t.endTime || '17:00'
        };
      });
      formData.append('dailySchedule', JSON.stringify(schedule));
      // Add global times too in advanced mode
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
    }

    formData.append('image', imageFile);

    try {
      const response = await ky.post(
        '/api/event/addEvent',
        { headers: { Authorization: `Bearer ${accessToken}` }, body: formData }
      ).json();

      clearForm();
      return true;
    } catch (error) {
      let msg = 'Error publishing event.';
      try {
        const data = await error.response?.json();
        if (data?.message) msg = data.message;
      } catch {}
      toast.error(msg);
      return false;
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

  const openConfirm = (action) => {
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setConfirmAction(null);
  };

  const handleConfirm = async () => {
    const action = confirmAction;
    closeConfirm();
    if (action === 'clear') {
      await clearForm();
      toast.success('Form cleared successfully', { className: 'confirm-toast-success', duration: 2500 });
    } else if (action === 'publish') {
      const ok = await publishEvent();
      if (ok) {
        toast.success('Event published successfully', { className: 'confirm-toast-success', duration: 2500 });
      }
    } else if (action === 'delete') {
      try {
        const response = await ky
          .delete(`/api/event/deleteEvent/${pendingDeleteEventId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
          .json();

        if (response.success) {
          const updatedEvents = events.filter((e) => e._id !== pendingDeleteEventId);
          setEvents(updatedEvents);
          setFilteredEvents(updatedEvents);
          toast.success('Event deleted successfully', { className: 'confirm-toast-success', duration: 2500 });
        } else {
          toast.error(response?.message || 'Failed to delete event');
        }
      } catch (error) {
        toast.error('Failed to delete event');
      } finally {
        setPendingDeleteEventId(null);
      }
    }
  };

  const updateEvent = async (eventId) => {
    try {
      // Validation: today's start time must be strictly later than now
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const hasAdvancedSchedule = Array.isArray(editForm.dailySchedule) && editForm.dailySchedule.length > 0;

      if (hasAdvancedSchedule) {
        const invalidTodayStart = editForm.dailySchedule.some(entry => {
          const d = new Date(entry.date);
          const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          return ymd === todayStr && entry.startTime && entry.startTime <= nowHHMM;
        });
        if (invalidTodayStart) {
          toast.error('For today, start time must be later than the current time.');
          return;
        }
      } else {
        if (editForm.startDate === todayStr && editForm.startTime && editForm.startTime <= nowHHMM) {
          toast.error('For today, start time must be later than the current time.');
          return;
        }
      }

      const formData = new FormData();

      // Core fields
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('eventType', editForm.eventType);
      formData.append('latitude', editForm.latitude.toString());
      formData.append('longitude', editForm.longitude.toString());
      formData.append('eventOrganizers', editForm.eventOrganizers);
      // Normalize edit hashtags before sending
      let normalizedEditHashtags = '';
      if (Array.isArray(editForm.eventHashtags)) {
        // If it's already an array, join it and normalize
        normalizedEditHashtags = editForm.eventHashtags
          .map(t => t.trim())
          .filter(Boolean)
          .map(t => `#${t.replace(/^#+/, '')}`)
          .join(', ');
      } else if (typeof editForm.eventHashtags === 'string') {
        // If it's a string, split and normalize
        normalizedEditHashtags = (editForm.eventHashtags || '')
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
          .map(t => `#${t.replace(/^#+/, '')}`)
          .join(', ');
      } else {
        // Fallback for other types
        normalizedEditHashtags = '';
      }
      formData.append('eventHashtags', normalizedEditHashtags);

      // Audience
      const audiences = editForm.targetAudience ? editForm.targetAudience.split(',').map(a => a.trim()).filter(a => a) : [];
      formData.append('targetAudience', JSON.stringify(audiences));

      formData.append('registrationRequired', editForm.registrationRequired);

      // Dates
      if (editForm.startDate) {
        formData.append('startDate', editForm.startDate);
      }
      if (editForm.endDate) {
        formData.append('endDate', editForm.endDate);
      }

      // Advanced schedule
      if (hasAdvancedSchedule) {
        formData.append('dailySchedule', JSON.stringify(editForm.dailySchedule));
      }

      // Always include global times
      formData.append('startTime', editForm.startTime || '');
      formData.append('endTime', editForm.endTime || '');

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await ky.put(
        `/api/event/updateEvent/${eventId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: formData
        }
      ).json();

      if (response.success) {
        const updatedEvents = events.map(event => event._id === eventId ? response.event : event);
        // NEW: sort by latest updated first, fallback to created
        const sortedEvents = [...updatedEvents].sort((a, b) => {
          const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          if (bUpdated !== aUpdated) return bUpdated - aUpdated;
          const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bCreated - aCreated;
        });
        setEvents(sortedEvents);
        setFilteredEvents(sortedEvents);

        // Re-mark the edited event as "new" so the red dot shows again
        try {
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);
          const start = new Date(response.event.startDate);
          const end = new Date(response.event.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          let targetTab;
          if (end < currentDate) {
            targetTab = 'Past Events';
          } else if (currentDate >= start && currentDate <= end) {
            targetTab = 'On-going Events';
          } else {
            targetTab = 'Schedule Upcoming Events';
          }

          const updatedSeen = seenEvents.filter(id => id !== eventId);
          setSeenEvents(updatedSeen);
          localStorage.setItem('addEventPageSeenEvents', JSON.stringify(updatedSeen));

          setNewEvents(prev => ({
            ...prev,
            [targetTab]: Array.from(new Set([...(prev[targetTab] || []), eventId]))
          }));
        } catch (_) {}

        closeEventModal();
        toast.success('Event updated successfully', { duration: 2500 });
      } else {
        toast.error(response?.message || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleHashtagsChange = (e) => {
    const value = e.target.value;
    // Allow letters, numbers, commas, spaces, and '#'
    const allowedChars = /^[A-Za-z0-9#,\s]*$/;

    if (value && !allowedChars.test(value)) {
      toast.error('Only letters, numbers, commas, spaces, and # are allowed.');
      return;
    }

    // Update raw so typing comma isn't blocked
    setEventHashtags(value);
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

      if (Array.isArray(eventData.dailySchedule) && eventData.dailySchedule.length > 0) {
        formData.append('dailySchedule', JSON.stringify(eventData.dailySchedule));
      }
      
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

  const deleteEvent = (eventId) => {
    setPendingDeleteEventId(eventId);
    openConfirm('delete');
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
        <div className="event-form-container-ae">
          <div className="event-form-left">
            <div className="form-group-ae">
              <label>Event Name</label>
              <input
                type="text"
                placeholder='e.g., Sarawak Cultural Festival 2025'
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group-ae">
              <label>Event Description</label>
              <textarea
                placeholder="What is this event about?"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="form-group-ae">
              <label>Event Organizers</label>
              <input
                type="text"
                placeholder="e.g., Sarawak Tourism Board"
                value={eventOrganizers}
                onChange={(e) => setEventOrganizers(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group-ae">
              <label>Event Hashtags</label>
              <input
                    type="text"
                    placeholder="e.g., #Festival, #Sarawak, #Culture"
                    value={eventHashtags}
                    onChange={handleHashtagsChange}
                    onBlur={(e) => setEventHashtags(normalizeHashtags(e.target.value))}
                    className="form-input"
                    pattern="^[A-Za-z0-9#,\s]+$"
                    title="Only alphanumeric characters, commas, spaces, and # allowed."
                  />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Separate multiple hashtags with commas
              </small>
            </div>

            <div className="form-group-ae">
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
                  className="use-current-location-btn"
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

            <div className="form-group-ae">
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
                {/* <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={targetAudience.other}
                    onChange={() => handleTargetAudienceChange('other')}
                  />
                  <span className="custom-checkbox"></span>
                  Other
                </label> */}
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

            <div className="form-group-ae">
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
              <div className="date-time-row-ae date-time-row-start-ae">
            <div className="form-group-ae">
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

            <div className="form-group-ae time-selection-container-ae">
              <label>Start Time {timeMode === 'advanced' && <span className="disabled-label">(Disabled - Using per-day schedule)</span>}</label>
              <div className="time-display-ae">
                <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleTimeChange(e.target.value, 'start')}
                        className={`time-input-native-ae ${timeMode === 'advanced' ? 'disabled-input' : ''}`}
                        disabled={timeMode === 'advanced'}
                        lang="en-GB"
                        min={getMinStartTimeForDate(startDate)}
                      />
              </div>
            </div>
          </div>

              <div className="date-time-row-ae date-time-row-start-ae">
                <div className="form-group-ae">
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

                <div className="form-group-ae time-selection-container-ae">
              <label>End Time {timeMode === 'advanced' && <span className="disabled-label">(Disabled - Using per-day schedule)</span>}</label>
              <div className="time-display-ae">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange(e.target.value, 'end')}
                  className={`time-input-native-ae ${timeMode === 'advanced' ? 'disabled-input' : ''}`}
                  min={getMinEndTime()}
                  disabled={timeMode === 'advanced' || (isEndTimeDisabled() && !startTime)}
                  lang="en-GB"
                />
              </div>

              
                </div>

                <div className="ae-per-day-group">
                  <div className="time-mode-toggle">
                    <label>
                        <input
                          type="checkbox"
                          checked={timeMode === 'advanced'}
                          onChange={(e) => {
                            const isAdvanced = e.target.checked;
                            setTimeMode(isAdvanced ? 'advanced' : 'uniform');
                            
                            if (isAdvanced) {
                              // Keep existing entries; only prefill if none
                              if (Object.keys(dailyTimes || {}).length > 0) return;

                              const dates = getDatesInRange(startDate, endDate);
                              const newDailyTimes = {};
                              dates.forEach((d) => {
                                const k = toYMD(d);
                                // Prefer existing local state times; otherwise default to uniform times
                                newDailyTimes[k] = dailyTimes[k] || {
                                  startTime: startTime || '09:00',
                                  endTime: endTime || '17:00',
                                };
                              });
                              setDailyTimes(newDailyTimes);
                            } else {
                              setDailyTimes({});
                            }
                          }}
                        />
                        Set different time per day
                      </label>
                  </div>

                  {timeMode === 'advanced' && (
                    <div className="per-day-schedule-compact">
                      <div className="per-day-selector">
                        <label className="per-day-selector-label">Select event day</label>
                        <div className="custom-dropdown">
                          <div
                            className="dropdown-selected"
                            onClick={togglePerDayDropdown}
                          >
                            {selectedScheduleDate
                              ? formatSelectedDate(fromYMD(selectedScheduleDate))
                              : 'Select event day'}
                            <span className={`dropdown-arrow ${perDayDropdownOpen ? 'open' : ''}`}>▼</span>
                          </div>
                          {perDayDropdownOpen && (
                            <div className="dropdown-options">
                              {getDatesInRange(startDate, endDate).map((d) => {
                                const k = toYMD(d);
                                const isSelected = selectedScheduleDate === k;
                                return (
                                  <div
                                    key={k}
                                    className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                                    onClick={() => selectPerDayDay(d)}
                                  >
                                    {formatSelectedDate(d)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="per-day-time-inputs">
                        <input
                          type="time"
                          className="per-day-time-input"
                          value={(dailyTimes[selectedScheduleDate] || {}).startTime || ''}
                          onChange={(e) =>
                            setDailyTimes((prev) => ({
                              ...prev,
                              [selectedScheduleDate]: {
                                ...(prev[selectedScheduleDate] || {}),
                                startTime: e.target.value,
                              },
                            }))
                          }
                          lang="en-GB"
                          min={getMinStartTimeForDate(selectedScheduleDate)}
                        />
                        <span className="time-separator">—</span>
                        <input
                          type="time"
                          className="per-day-time-input"
                          value={(dailyTimes[selectedScheduleDate] || {}).endTime || ''}
                          onChange={(e) =>
                            setDailyTimes((prev) => ({
                              ...prev,
                              [selectedScheduleDate]: {
                                ...(prev[selectedScheduleDate] || {}),
                                endTime: e.target.value,
                              },
                            }))
                          }
                          lang="en-GB"
                        />
                      </div>
                    </div>
                  )}

                  {timeMode === 'advanced' && (
                    <div className="admin-schedule-actions">
                      <button
                        type="button"
                        className="schedule-summary-btn"
                        disabled={!isAdvancedScheduleComplete()}
                        onClick={() => setScheduleSummaryOpen(true)}
                      >
                        View Per-Day Schedule
                      </button>
                    </div>
                  )}

                  {isScheduleSummaryOpen && (
                    <div
                      className="ae-schedule-summary-overlay"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="aeScheduleSummaryTitle"
                      onClick={() => setScheduleSummaryOpen(false)}
                    >
                      <div className="ae-schedule-summary-modal" onClick={e => e.stopPropagation()}>
                        <div className="ae-schedule-summary-header">
                          <h3 id="aeScheduleSummaryTitle">Per-Day Schedule Summary</h3>
                          <button
                            type="button"
                            className="ae-schedule-summary-close"
                            onClick={() => setScheduleSummaryOpen(false)}
                            aria-label="Close summary"
                            title="Close"
                          >
                            ×
                          </button>
                        </div>
                        <div className="ae-schedule-summary-list">
                          {getDatesInRange(startDate, endDate).map((d) => {
                            const k = toYMD(d);
                            // For Add Event tab, only use the local state times
                            const stateTimes = dailyTimes[k];
                            const t = stateTimes || {};
                            return (
                              <div key={k} className="ae-summary-row">
                                <div className="ae-summary-date">{formatSelectedDate(d)}</div>
                                <div className="ae-summary-times">
                                  {(t.startTime ? formatTimeDisplayAe(t.startTime) : '—')}
                                  {' — '}
                                  {(t.endTime ? formatTimeDisplayAe(t.endTime) : '—')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </div>

          <div className="form-group-ae">
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

            <div className="form-group-ae">
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
                className="clear-button"
                onClick={() => openConfirm('clear')}
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
          paginatedEvents.map((event) => (
            <EventCard
                  key={event._id}
                  event={event}
                  type={activeTab === 'Schedule Upcoming Events' ? 'upcoming' : 'past'}
                  onEdit={(event) => openEventModal(event, 'edit')}
                  onDelete={deleteEvent}
                  onClick={() => openEventModal(event, 'view')}
                  isNew={newEvents[activeTab]?.includes(event._id) || false}
                  onMarkAsSeen={() => {
                    const updatedSeenEvents = [...seenEvents, event._id];
                    setSeenEvents(updatedSeenEvents);
                    localStorage.setItem('addEventPageSeenEvents', JSON.stringify(updatedSeenEvents));
                    setNewEvents(prev => ({
                      ...prev,
                      [activeTab]: prev[activeTab].filter(id => id !== event._id)
                    }));
                  }}
                />
          ))
        )}
      </div>
    );
  };
  };

  return (
    <div className="add-event-container ae-page">
      <Sidebar />
      <div className="add-event-content ae-content" ref={contentRef}>
        <div className="add-event-header">
          <div className="greeting">
            <h3>Add Event</h3>
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
              {newEvents[tab] && newEvents[tab].length > 0 && (
            <div className="tab-new-indicator"></div>
          )}
            </div>
          ))}
        </div>

        {(activeTab === 'Past Events' || activeTab === 'Schedule Upcoming Events' || activeTab === 'On-going Events') && (
        <div className="events-controls-ae">
          <div className="search-bar-ae">
            <FaSearch className="search-icon-av" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'Past Events' ? 'Past' : activeTab === 'Schedule Upcoming Events' ? 'Scheduled' : 'On-going'} events by name...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {totalPages > 1 && (
          <div className="pagination-controls-ae">
            <button
              className={`page-btn-ae ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={prevPage}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <FaChevronLeft />
            </button>

            {
              Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }
                return (
                  <button
                    key={pageNumber}
                    className={`page-number-ae ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => goToPage(pageNumber)}
                    aria-label={`Go to page ${pageNumber}`}
                  >
                    {pageNumber}
                  </button>
                );
              })
            }

            <button
              className={`page-btn-ae ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={nextPage}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
             <FaChevronRight />
            </button>
          </div>
        )}
        </div>
      )}

      {renderContent()}

        <button
          className={`scroll-to-top-btn ${showScrollTop ? 'visible' : ''}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <FaChevronUp className="scroll-to-top-icon" />
        </button>

        {activeTab === 'Add Event' && (
          <button 
            className="publish-button"
            onClick={() => openConfirm('publish')}
          >
            Publish Now
          </button>
        )}

        {isConfirmOpen && (
          <div
            className="confirm-modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={closeConfirm}
          >
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="confirm-modal-title">
                {confirmAction === 'publish'
                  ? 'Publish event?'
                  : confirmAction === 'delete'
                    ? 'Delete event?'
                    : 'Clear all fields?'}
              </h3>
              <p className="confirm-modal-body">
                {confirmAction === 'publish'
                  ? 'This will publish your event to the platform. Continue?'
                  : confirmAction === 'delete'
                    ? 'This will permanently delete the selected event. Continue?'
                    : 'This will remove all input from the form. Continue?'}
              </p>
              <div className="confirm-modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={closeConfirm}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={
                    confirmAction === 'publish'
                      ? 'modal-confirm-btn'
                      : confirmAction === 'delete'
                        ? 'modal-delete-btn-av'
                        : 'modal-confirm-btn'
                  }
                  onClick={handleConfirm}
                >
                  {confirmAction === 'publish'
                    ? 'Confirm'
                    : confirmAction === 'delete'
                      ? 'Delete'
                      : 'Clear'}
                </button>
              </div>
            </div>
          </div>
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
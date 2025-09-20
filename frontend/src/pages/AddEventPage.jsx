import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaCamera, FaCalendar, FaMapMarkerAlt, FaClock, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import Sidebar from '../components/Sidebar';
import ky from 'ky';
import '../styles/AddEventPage.css';
import { useAuth } from '../context/AuthProvider.jsx';
import { toast, Toaster } from 'sonner';
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

const AddEventPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Event');
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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Coordinates state
  const [latitude, setLatitude] = useState(1.5533);
  const [longitude, setLongitude] = useState(110.3592);
  const [coordinatesInput, setCoordinatesInput] = useState('1.5533, 110.3592');

  // New fields
  const [eventOrganizers, setEventOrganizers] = useState('');
  const [eventHashtags, setEventHashtags] = useState('');
  
  const fileInputRef = useRef(null);

  const tabs = ['All Event', 'Past Events', 'Schedule Upcoming Events'];
  
  const locations = ['Sarawak Cultural Village', 'Damai Beach', 'Kuching Waterfront'];
  const eventTypes = ['Festival', 'Workshop & Seminars', 'Community & Seasonal Bazaars', 'Music, Arts & Performance', 'Food & Culinary', 'Sporting', 'Art & Performance'];

  const { accessToken } = useAuth();

  useEffect(() => {
    const currentImage = uploadedImage;
    return () => {
      if (currentImage && currentImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage);
      }
    }
  }, [uploadedImage]);

  // Utility functions for date validation
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const isDateDisabled = (date, calendarType) => {
    const today = getToday();
    
    // Disable past dates for both calendars
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
    setActiveTab(tab);
    if (tab === 'Past Events') {
      window.location.href = '/past-events';
    } else if (tab === 'Schedule Upcoming Events') {
      window.location.href = '/schedule-events';
    }
  };

  // const toggleLocationDropdown = () => {
  //   setLocationDropdownOpen(!locationDropdownOpen);
  //   setEventTypeDropdownOpen(false);
  // };

  // const selectLocation = (location) => {
  //   setSelectedLocation(location);
  //   setLocationDropdownOpen(false);
  // };

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
        setLatitude(clat);
        setLongitude(clng);
        setCoordinatesInput(`${clat.toFixed(4)}, ${clng.toFixed(4)}`);
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
    setStartDate(null);
    setEndDate(null);
    setStartTime('');
    setEndTime('');
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
        setEndTime('');
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

  return (
    <div className="add-event-container">
      <Sidebar />
      <div className="add-event-content">
        <div className="add-event-header">
          <div className="heading">
            <h2>Add Event</h2>
            <p>Create and publish new event</p>
          </div>
          <div className="add-event-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
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

            {/* Location field removed */}

            {/* New fields: Event Organizers & Event Hashtags */}
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
                  placeholder="Others..."
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

        <button 
          className="publish-button"
          onClick={publishEvent}
        >
          Publish Now
        </button>
        <Toaster position="top-right" />
      </div>
    </div>
  );
};

export default AddEventPage;
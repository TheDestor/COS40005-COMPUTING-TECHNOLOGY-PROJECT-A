import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaCamera } from 'react-icons/fa';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import Sidebar from '../components/Sidebar';
import ky from 'ky';
import '../styles/AddEventPage.css';
import { useAuth } from '../context/AuthProvider.jsx';

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
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const fileInputRef = useRef(null);

  const tabs = ['All Event', 'Past Events', 'Schedule Upcoming Events'];
  
  const locations = ['Sarawak Cultural Village', 'Damai Beach', 'Kuching Waterfront'];
  const eventTypes = ['Festival', 'Workshop', 'Business Meetup'];

  const { user } = useAuth();

  useEffect(() => {
    const currentImage = uploadedImage;
    return () => {
      if (currentImage && currentImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage);
      }
    }
  }, [uploadedImage]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const toggleLocationDropdown = () => {
    setLocationDropdownOpen(!locationDropdownOpen);
    if (locationDropdownOpen) {
      setEventTypeDropdownOpen(false);
    }
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setLocationDropdownOpen(false);
  };

  const toggleEventTypeDropdown = () => {
    setEventTypeDropdownOpen(!eventTypeDropdownOpen);
    if (eventTypeDropdownOpen) {
      setLocationDropdownOpen(false);
    }
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
    setSelectedDate(null);
    setUploadedImage(null);
    setImageFile(null);
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
    const totalDaysShown = 42; // 6 rows x 7 days
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

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  const days = getCalendarDays();

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return selectedDate.toLocaleDateString('en-US', options);
  };

  const publishEvent = async () => {
    const formData = new FormData();

    formData.append('name', eventName);
    formData.append('description', eventDescription);
    formData.append('location', selectedLocation);
    formData.append('eventType', selectedEventType);
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
    formData.append('date', selectedDate);
    formData.append('image', imageFile);
    
    try {
      const response = await ky.post(
        "/api/event/addEvent",
        {
          headers: { 'Authorization': `Bearer ${user?.accessToken}` },
          body: formData
        }
      ).json();

      console.log(response);
      clearForm();
    } catch (error) {
      try {
        const errorData = await error.response.json();
        console.error(errorData);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const saveAsDraft = () => {
    // Saving the event as a draft
    console.log('Saving as draft');
  };

  const previewEvent = () => {
    // Event preview functionality
    console.log('Previewing event');
  };

  return (
    <div className="add-event-container">
      <Sidebar />
      <div className="add-event-content">
        <div className="add-event-header">
          <div className="heading">
            <h2>Add Event</h2>
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
                placeholder='e.g., "Sarawak Cultural Festival 2025"'
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
              <label>Location</label>
              <div className="custom-dropdown">
                <div 
                  className="dropdown-selected"
                  onClick={toggleLocationDropdown}
                >
                  {selectedLocation || "Select location"}
                  <span className={`dropdown-arrow ${locationDropdownOpen ? 'open' : ''}`}>▼</span>
                </div>
                {locationDropdownOpen && (
                  <div className="dropdown-options">
                    {locations.map((location) => (
                      <div 
                        key={location} 
                        className={`dropdown-option ${selectedLocation === location ? 'selected' : ''}`}
                        onClick={() => selectLocation(location)}
                      >
                        {location}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Target Audience</label>
              <div className="checkbox-group">
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
              <div className="radio-group">
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
                <label>Event Date</label>
                <div className="date-display" onClick={() => setShowCalendar(!showCalendar)}>
                  {selectedDate ? formatSelectedDate() : 'Select a date'}
                  <span className={`dropdown-arrow ${showCalendar ? 'open' : ''}`}>▼</span>
                </div>
              </div>
              
              {showCalendar && (
                <div className="calendar">
                  <div className="calendar-header">
                    <button 
                      className="calendar-nav-btn"
                      onClick={() => moveMonth('prev')}
                    >
                      <BsChevronLeft />
                    </button>
                    <div className="calendar-title">
                      {monthNames[currentMonth.getMonth()]}
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
                    {days.map((day, index) => (
                      <div 
                        key={index}
                        className={`calendar-day ${day.currentMonth ? '' : 'other-month'} ${isDateSelected(day.date) ? 'selected' : ''}`}
                        onClick={() => handleDateClick(day.date)}
                      >
                        {day.day}
                      </div>
                    ))}
                  </div>
                  <div className="calendar-footer">
                    <button 
                      className="calendar-button cancel"
                      onClick={() => setShowCalendar(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="calendar-button done"
                      onClick={() => setShowCalendar(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
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
      </div>
    </div>
  );
};

export default AddEventPage;
import React, { useState, useEffect } from 'react';
import { 
  FaBuilding, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaGlobe, 
  FaList, 
  FaClock,
  FaInfoCircle,
  FaImage,
  FaUpload,
  FaExclamationTriangle,
  FaArrowLeft,
  FaArrowRight,
} from 'react-icons/fa';
import '../styles/BusinessSubmissionForm.css';
import axios from 'axios'; // Make sure axios is installed
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const Recenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

const ClickToSet = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
};

const BusinessSubmissionForm = ({ isOpen, onClose, onSubmitSuccess }) => {
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    ownerEmail: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    website: '',
    openingHours: '',
    businessImage: null,
    ownerAvatar: null,
    agreement: false,
    latitude: '',
    longitude: ''
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Preview images
  const [businessImagePreview, setBusinessImagePreview] = useState(null);
  const [ownerAvatarPreview, setOwnerAvatarPreview] = useState(null);
  const [coordinatesInput, setCoordinatesInput] = useState('');

  // Business categories
  const businessCategories = [
    'Food & Beverage',
    'Transportation',
    'Accommodation',
    'Attraction',
    'Tour Guide',
    'Leisure',
    'Other'
  ];

  // Helpers
  const countNonSpace = (s) => (s || '').replace(/\s/g, '').length;
  const hasOverlongWord = (s, max = 30) => (s || '').split(/\s+/).some(w => w.length > max);

  // Calculate priority based on certain criteria (this will be used when submitting)
  const calculatePriority = () => {
    let score = 0;
    
    // Business categories that might be high priority
    const highPriorityCategories = ['Food & Beverage', 'Health & Fitness', 'Technology'];
    if (highPriorityCategories.includes(formData.category)) {
      score += 2;
    }
    
    // Website presence might indicate more established businesses
    if (formData.website && formData.website.trim() !== '') {
      score += 1;
    }
    
    // Longer descriptions might indicate more detail and effort
    if (formData.description && formData.description.length > 200) {
      score += 1;
    }
    
    // Both images provided shows completeness
    if (formData.businessImage && formData.ownerAvatar) {
      score += 1;
    }
    
    // Determine priority based on score
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  };

  // Handle form field changes with improved image handling
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      
      // Preview image with resizing control
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (name === 'businessImage') {
            // Using FileReader to get a preview, but controlling the display size with CSS
            setBusinessImagePreview(reader.result);
          } else if (name === 'ownerAvatar') {
            setOwnerAvatarPreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
      
      setFormData({
        ...formData,
        [name]: file
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleCoordinatesChange = (e) => {
    // Allow only digits, minus, dot, comma, and spaces
    const raw = e.target.value;
    const sanitized = raw.replace(/[^\d\-\.,\s]/g, '');
    setCoordinatesInput(sanitized);

    const parts = sanitized.split(',').map(s => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setFormData(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
      }
    }
  };

  const handleCoordinatesKeyDown = (e) => {
    const allowedKeys = [
      'Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '
    ];
    const allowedChars = ['-','.',','];
    if (
      allowedKeys.includes(e.key) ||
      (e.ctrlKey || e.metaKey) || // allow copy/paste/select all
      (e.key >= '0' && e.key <= '9') ||
      allowedChars.includes(e.key)
    ) {
      return;
    }
    e.preventDefault();
  };

  const handleCoordinatesPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const sanitized = text.replace(/[^\d\-\.,\s]/g, '');
    const next = (coordinatesInput + sanitized).trim();
    setCoordinatesInput(next);

    const parts = next.split(',').map(s => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setFormData(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
      }
    }
  };

  const getBestLocationFix = ({ desiredAccuracyMeters = 50, maxWaitMs = 15000 } = {}) =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));

      let best = null;
      const start = Date.now();
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const acc = pos.coords.accuracy ?? Infinity; // meters
          if (!best || acc < best.coords.accuracy) best = pos;
          const elapsed = Date.now() - start;
          if (acc <= desiredAccuracyMeters || elapsed >= maxWaitMs) {
            navigator.geolocation.clearWatch(watchId);
            resolve(best);
          }
        },
        (err) => {
          navigator.geolocation.clearWatch(watchId);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 }
      );
    });

  const handleTakeCurrentLocation = async () => {
    try {
      const pos = await getBestLocationFix({ desiredAccuracyMeters: 50, maxWaitMs: 15000 });
      const { latitude, longitude } = pos.coords;
      const value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setCoordinatesInput(value);
      setFormData(prev => ({ ...prev, latitude: String(latitude), longitude: String(longitude) }));
    } catch (e) {
      console.warn('Location error:', e?.message);
    }
  };

  // Validate the current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: // Basic Information
        if (!formData.name.trim()) newErrors.name = 'Business name is required';
        if (!formData.owner.trim()) newErrors.owner = 'Owner name is required';
        if (!formData.ownerEmail.trim()) {
          newErrors.ownerEmail = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
          newErrors.ownerEmail = 'Email is invalid';
        }
        break;
        
      case 2: // Business Details
        if (!formData.category) newErrors.category = 'Please select a category';
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else {
          const nonSpaceLen = countNonSpace(formData.description);
          if (nonSpaceLen < 50) {
            newErrors.description = 'Description should be at least 50 characters';
          } else if (hasOverlongWord(formData.description, 30)) {
            newErrors.description = 'Please avoid single words longer than 30 characters. Add spaces or hyphens.';
          }
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required';

        // NEW: require coordinate input
        if (!coordinatesInput.trim()) {
          newErrors.coordinates = 'Business coordinate is required';
        }

        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\d{3}-(\d{3}|\d{4})-\d{4}$/.test(formData.phone)) {
          newErrors.phone = 'Phone format should be XXX-XXX-XXXX or XXX-XXXX-XXXX';
        }
        break;
        
      case 3: // Media Upload
        if (!formData.businessImage) newErrors.businessImage = 'Business image is required';
        if (!formData.ownerAvatar) newErrors.ownerAvatar = 'Owner profile picture is required';
        break;
        
      case 4: // Review and Submit
        if (!formData.agreement) newErrors.agreement = 'You must agree to the terms';
        break;
        
      default:
        break;
    }
    
    return newErrors;
  };

  // Move to next step
  const handleNextStep = () => {
    const stepErrors = validateStep(currentStep);
    
    if (Object.keys(stepErrors).length === 0) {
      setCurrentStep(currentStep + 1);
    } else {
      setErrors(stepErrors);
    }
  };

  // Move to previous step
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    // Validate all steps before submitting
    let allErrors = {};
    for (let i = 1; i <= totalSteps; i++) {
      const stepErrors = validateStep(i);
      allErrors = { ...allErrors, ...stepErrors };
    }
    
    if (Object.keys(allErrors).length === 0) {
      setSubmitting(true);
      
      try {
        // Create form data for file uploads
        const formDataToSend = new FormData();
        
        // Add all form fields
        Object.keys(formData).forEach(key => {
          if (key === 'businessImage' || key === 'ownerAvatar') {
            if (formData[key]) {
              formDataToSend.append(key, formData[key]);
            }
          } else {
            formDataToSend.append(key, formData[key]);
          }
        });
        
        // Calculate and add priority
        const priority = calculatePriority();
        formDataToSend.append('priority', priority);
        
        // Add submission date
        formDataToSend.append('submissionDate', new Date().toISOString());
        
        // Set initial status
        formDataToSend.append('status', 'pending');
        
        // Main API call to backend endpoint
        const response = await axios.post('/api/businesses/addBusiness', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Submission successful:', response.data);
        setSubmitSuccess(true);
        
        // If a success callback was provided, call it
        if (onSubmitSuccess && typeof onSubmitSuccess === 'function') {
          onSubmitSuccess(response.data.data);
        }
        
      } catch (error) {
        console.error('Submission error:', error);
        setErrors({
          ...errors,
          submit: error.response?.data?.message || error.message || 'There was an error submitting your business. Please try again.'
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      setErrors(allErrors);
      
      // Move to the first step with an error
      for (let i = 1; i <= totalSteps; i++) {
        const stepErrors = validateStep(i);
        if (Object.keys(stepErrors).length > 0) {
          setCurrentStep(i);
          break;
        }
      }
    }
  };

  // Render progress bar
  const renderProgressBar = () => {
    return (
      <div className="form-progress">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div 
            key={i} 
            className={`progress-step ${currentStep >= i + 1 ? 'active' : ''} ${currentStep > i + 1 ? 'completed' : ''}`}
            onClick={() => currentStep > i + 1 && setCurrentStep(i + 1)}
          >
            <div className="step-number">{i + 1}</div>
            <div className="step-label">
              {i === 0 ? 'Basic Info' : 
               i === 1 ? 'Business Details' : 
               i === 2 ? 'Media' : 'Review'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render step 1: Basic Information
  const renderBasicInfoStep = () => {
    return (
      <div className="form-step">
        <h3>Basic Information</h3>
        <p className="step-description">
          Let's start with the basic information about your business and yourself as the owner.
        </p>
        
        <div className="form-group-bsf">
          <label htmlFor="name">
            <FaBuilding /> Business Name*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Sunrise Cafe"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <div className="error-message-business">{errors.name}</div>}
        </div>
        
        <div className="form-group-bsf">
          <label htmlFor="owner">
            <FaUser /> Owner Name*
          </label>
          <input
            type="text"
            id="owner"
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            placeholder="e.g., John Smith"
            className={errors.owner ? 'error' : ''}
          />
          {errors.owner && <div className="error-message-business">{errors.owner}</div>}
        </div>
        
        <div className="form-group-bsf">
          <label htmlFor="ownerEmail">
            <FaEnvelope /> Email Address*
          </label>
          <input
            type="email"
            id="ownerEmail"
            name="ownerEmail"
            value={formData.ownerEmail}
            onChange={handleChange}
            placeholder="e.g., john@example.com"
            className={errors.ownerEmail ? 'error' : ''}
          />
          {errors.ownerEmail && <div className="error-message-business">{errors.ownerEmail}</div>}
        </div>
        
        <div className="form-note">
          <FaInfoCircle /> Fields marked with an asterisk (*) are required.
        </div>
      </div>
    );
  };

  // Render step 2: Business Details
  const renderBusinessDetailsStep = () => {
    // derive coordinates for preview (no hooks here)
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    return (
      <div className="form-step">
        <h3>Business Details</h3>
        <p className="step-description">
          Please provide more detailed information about your business.
        </p>
        
        <div className="form-group-bsf">
          <label htmlFor="category">
            <FaList /> Business Category*
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={errors.category ? 'error' : ''}
          >
            <option value="">Select a category</option>
            {businessCategories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <div className="error-message-business">{errors.category}</div>}
        </div>
        
        <div className="form-group-bsf">
          <label htmlFor="description">
            <FaInfoCircle /> Business Description*
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your business, products, services, and what makes you unique (minimum 50 characters)..."
            rows="4"
            className={errors.description ? 'error' : ''}
          />
          <div className="character-count">
            {countNonSpace(formData.description)} / 500 characters
            {countNonSpace(formData.description) < 50 && " (minimum 50)"}
          </div>
          {errors.description && <div className="error-message-business">{errors.description}</div>}
        </div>
        
        <div className="form-group-bsf">
          <label htmlFor="address">
            <FaMapMarkerAlt /> Business Address*
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., 123 Main Street, Downtown"
            className={errors.address ? 'error' : ''}
          />
          {errors.address && <div className="error-message-business">{errors.address}</div>}
        </div>

        <div className="form-group-bsf">
          <label htmlFor="businessCoordinates">
            <FaMapMarkerAlt /> Business Coordinate (Latitude, Longitude)*
          </label>
          <div className="coord-input-wrapper">
            <input
              type="text"
              id="businessCoordinates"
              name="businessCoordinates"
              value={coordinatesInput}
              onChange={handleCoordinatesChange}
              onKeyDown={handleCoordinatesKeyDown}
              onPaste={handleCoordinatesPaste}
              placeholder="e.g., 1.5533, 110.3592"
              inputMode="decimal"
              autoComplete="off"
              className={errors.coordinates ? 'error' : ''}
              aria-invalid={!!errors.coordinates}
            />
            <button
              type="button"
              className="coord-action-btn"
              onClick={handleTakeCurrentLocation}
              title="Use my current location"
            >
              Take current location
            </button>
          </div>
          {errors.coordinates && <div className="error-message-business">{errors.coordinates}</div>}
        </div>

        <div className="form-group-bsf">
          <label>
            <FaMapMarkerAlt /> Location Preview
          </label>
          <div style={{ height: 220, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <MapContainer
              center={hasCoords ? [lat, lng] : [1.5533, 110.3592]}
              zoom={hasCoords ? 15 : 12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              key={`${hasCoords ? lat : 'def'}-${hasCoords ? lng : 'def'}`} // force remount if needed
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasCoords && (
                <>
                  <Marker
                    position={[lat, lng]}
                    icon={defaultIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const ll = e.target.getLatLng();
                        const value = `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
                        setCoordinatesInput(value);
                        setFormData(prev => ({ ...prev, latitude: String(ll.lat), longitude: String(ll.lng) }));
                      }
                    }}
                  />
                  <Recenter lat={lat} lng={lng} />
                </>
              )}
              <ClickToSet
                onPick={(ll) => {
                  const value = `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
                  setCoordinatesInput(value);
                  setFormData(prev => ({ ...prev, latitude: String(ll.lat), longitude: String(ll.lng) }));
                }}
              />
            </MapContainer>
          </div>
          <div className="form-text">Enter a valid "lat, lng" to update the map.</div>
        </div>
        
        <div className="form-row">
          <div className="form-group-bsf">
            <label htmlFor="phone">
              <FaPhone /> Phone Number*
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., 555-123-4567 or 555-1234-5678"
              pattern="^\d{3}-(\d{3}|\d{4})-\d{4}$"
              title="Use XXX-XXX-XXXX or XXX-XXXX-XXXX"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <div className="error-message-business">{errors.phone}</div>}
          </div>
          
          <div className="form-group-bsf">
            <label htmlFor="website">
              <FaGlobe /> Website (optional)
            </label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="e.g., www.example.com"
            />
          </div>
        </div>
        
        <div className="form-group-bsf">
          <label htmlFor="openingHours">
            <FaClock /> Opening Hours (optional)
          </label>
          <input
            type="text"
            id="openingHours"
            name="openingHours"
            value={formData.openingHours}
            onChange={handleChange}
            placeholder="e.g., Mon-Fri: 9AM-5PM, Sat: 10AM-3PM, Sun: Closed"
          />
        </div>
      </div>
    );
  };

  // Render step 3: Media Upload - Improved version
  const renderMediaUploadStep = () => {
    return (
      <div className="form-step">
        <h3>Upload Media</h3>
        <p className="step-description">
          Please upload images to showcase your business and yourself as the owner.
        </p>
        
        <div className="form-group-bsf upload-group">
          <label htmlFor="businessImage">
            <FaImage /> Business Image*
          </label>
          <div className={`file-upload-container ${errors.businessImage ? 'error' : ''}`}>
            <div className="file-preview">
              {businessImagePreview ? (
                <img src={businessImagePreview} alt="Business preview" />
              ) : (
                <div className="upload-placeholder">
                  <FaBuilding />
                  <span>Business Photo</span>
                </div>
              )}
            </div>
            <div className="file-input-container">
              <input
                type="file"
                id="businessImage"
                name="businessImage"
                onChange={handleChange}
                accept="image/*"
                className="file-input"
              />
              <label htmlFor="businessImage" className="file-button">
                <FaUpload /> {businessImagePreview ? 'Change Image' : 'Select Image'}
              </label>
              <p className="file-help-text">
                Upload a high-quality image showing your business storefront, interior, or products.
                Recommended size: 800x600px.
              </p>
            </div>
          </div>
          {errors.businessImage && <div className="error-message-business">{errors.businessImage}</div>}
        </div>
        
        <div className="form-group-bsf upload-group">
          <label htmlFor="ownerAvatar">
            <FaUser /> Owner Profile Picture*
          </label>
          <div className={`file-upload-container ${errors.ownerAvatar ? 'error' : ''}`}>
            <div className="file-preview avatar-preview">
              {ownerAvatarPreview ? (
                <img src={ownerAvatarPreview} alt="Owner avatar preview" />
              ) : (
                <div className="upload-placeholder">
                  <FaUser />
                  <span>Profile Photo</span>
                </div>
              )}
            </div>
            <div className="file-input-container">
              <input
                type="file"
                id="ownerAvatar"
                name="ownerAvatar"
                onChange={handleChange}
                accept="image/*"
                className="file-input"
              />
              <label htmlFor="ownerAvatar" className="file-button">
                <FaUpload /> {ownerAvatarPreview ? 'Change Image' : 'Select Image'}
              </label>
              <p className="file-help-text">
                Upload a professional profile picture of yourself as the business owner.
                Square images work best.
              </p>
            </div>
          </div>
          {errors.ownerAvatar && <div className="error-message-business">{errors.ownerAvatar}</div>}
        </div>
        
        <div className="form-note">
          <FaInfoCircle /> Supported file formats: JPG, PNG, GIF. Maximum size: 5MB per image.
        </div>
      </div>
    );
  };

  // Render step 4: Review and Submit with improved image section
  const renderReviewStep = () => {
    const priority = calculatePriority();
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    return (
      <div className="form-step">
        <h3>Review & Confirm</h3>
        <p className="step-description">Check all details. You can edit the details before submission.</p>

        {/* Basic Info */}
        <div className="review-card-business">
          <div className="review-header">
            <div className="review-title">Basic Information</div>
          </div>
          <div className="review-body">
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Business Name</span>
                  <span className="review-value">{formData.name || '-'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Owner Name</span>
                  <span className="review-value">{formData.owner || '-'}</span>
                </div>
                <div className="review-item full">
                  <span className="review-label">Owner Email</span>
                  <span className="review-value">{formData.ownerEmail || '-'}</span>
                </div>
              </div>
            </div>
        </div>

        {/* Business Details */}
        <div className="review-card-business">
          <div className="review-header">
            <div className="review-title">Business Details</div>
          </div>
          <div className="review-body">
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Category</span>
                  <span className="chip">{formData.category || '-'}</span>
                </div>

                <div className="review-item">
                  <span className="review-label">Priority</span>
                  <span className={`priority-indicator priority-${priority}`}>
                    <FaExclamationTriangle />
                    <span>{priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low'}</span>
                  </span>
                </div>

                <div className="review-item full">
                  <span className="review-label">Address</span>
                  <span className="review-value">{formData.address || '-'}</span>
                  {/* <button type="button" className="copy-btn" onClick={() => copyToClipboard(formData.address || '')}>
                    <FaCopy /> Copy
                  </button> */}
                </div>

                <div className="review-item">
                  <span className="review-label">Coordinate</span>
                  <span className="review-value">
                    {formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : '-'}
                  </span>
                  {/* <button
                    type="button"
                    className="copy-btn"
                    onClick={() => copyToClipboard(
                      formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''
                    )}
                  >
                    <FaCopy /> Copy
                  </button> */}
                </div>

                <div className="review-item">
                  <span className="review-label">Phone</span>
                  <span className="review-value">{formData.phone || '-'}</span>
                </div>

                {formData.website && (
                  <div className="review-item">
                    <span className="review-label">Website</span>
                    <a className="linkish" href={/^https?:\/\//.test(formData.website) ? formData.website : `https://${formData.website}`} target="_blank" rel="noreferrer">
                      {formData.website}
                    </a>
                  </div>
                )}

                {formData.openingHours && (
                  <div className="review-item full">
                    <span className="review-label">Opening Hours</span>
                    <span className="review-value">{formData.openingHours}</span>
                  </div>
                )}
              </div>

              {/* Map Preview Card */}
              <div className="map-card">
                <div className="map-card-header">
                  <FaMapMarkerAlt /> Location Preview
                </div>
                <div className="map-card-body">
                  <div style={{ height: 220, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <MapContainer
                      center={hasCoords ? [lat, lng] : [1.5533, 110.3592]}
                      zoom={hasCoords ? 15 : 12}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {hasCoords && <Marker position={[lat, lng]} icon={defaultIcon} />}
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Media */}
        <div className="review-card-business">
          <div className="review-header">
            <div className="review-title">Media</div>
          </div>
          <div className="review-body">
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Business Image</span>
                  <div className="review-image">{businessImagePreview ? <img src={businessImagePreview} alt="Business" /> : '-'}</div>
                </div>
                <div className="review-item">
                  <span className="review-label">Owner Avatar</span>
                  <div className="review-image avatar-image">{ownerAvatarPreview ? <img src={ownerAvatarPreview} alt="Owner" /> : '-'}</div>
                </div>
              </div>
            </div>
        </div>

        {/* Agreement */}
        <div className="review-card-business">
          <div className="review-header">
            <div className="review-title">Agreement</div>
          </div>
          <div className="review-body">
              <label className="agreement-inline">
                <input
                  type="checkbox"
                  id="agreement"
                  name="agreement"
                  checked={formData.agreement}
                  onChange={handleChange}
                  className={errors.agreement ? 'error' : ''}
                />
                I confirm that all the information provided is accurate and complete. I understand that my business submission will be reviewed before being published.
              </label>
              {errors.agreement && <div className="error-message-business">{errors.agreement}</div>}
            </div>
        </div>
      </div>
    );
  };

  // Render success message
  const renderSuccessMessage = () => {
    return (
      <div className="submission-success">
        <div className="success-icon">✓</div>
        <h3>Submission Successful!</h3>
        <p>
          Thank you for submitting your business information. Your submission has been received and is now pending review.
        </p>
        <p>
          You will receive a confirmation email shortly at <strong>{formData.ownerEmail}</strong> with further details.
        </p>
        <div className="success-actions">
          <button className="submit-another-btn" onClick={() => window.location.reload()}>
            Submit Another Business
          </button>
        </div>
      </div>
    );
  };

  // Render the form based on current step
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderBusinessDetailsStep();
      case 3:
        return renderMediaUploadStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Render form navigation buttons
  const renderFormNavigation = () => {
    return (
      <div className="form-navigation">
        {currentStep > 1 && (
          <button 
            type="button" 
            className="prev-btn" 
            onClick={handlePrevStep}
            disabled={submitting}
          >
            <FaArrowLeft /> Previous
          </button>
        )}
        
        {currentStep < totalSteps ? (
          <button 
            type="button" 
            className="next-btn" 
            onClick={handleNextStep}
          >
            Next <FaArrowRight />
          </button>
        ) : (
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Business'}
          </button>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="business-submission-overlay">
      <div className="business-submission-container">
        <div className="business-submission-form-wrapper">
          <div className="form-header">
            <h2>Business Submission Form</h2>
            <p>Complete the form below to add your business to our directory</p>
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
          </div>
          
          {submitSuccess ? (
            renderSuccessMessage()
          ) : (
            <>
              {renderProgressBar()}
              
              <form className="business-submission-form" onSubmit={handleSubmit}>
                {renderFormStep()}
                {renderFormNavigation()}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessSubmissionForm;
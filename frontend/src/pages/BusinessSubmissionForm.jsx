import React, { useState } from 'react';
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
  FaArrowRight
} from 'react-icons/fa';
import '../styles/BusinessSubmissionForm.css';

const BusinessSubmissionForm = () => {
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
    agreement: false
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Preview images
  const [businessImagePreview, setBusinessImagePreview] = useState(null);
  const [ownerAvatarPreview, setOwnerAvatarPreview] = useState(null);

  // Business categories
  const businessCategories = [
    'Food & Beverage',
    'Technology',
    'Health & Fitness',
    'Retail',
    'Hospitality',
    'Home & Garden',
    'Automotive',
    'Pet Services',
    'Education',
    'Professional Services',
    'Entertainment',
    'Beauty & Wellness',
    'Financial Services',
    'Real Estate',
    'Other'
  ];

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
        } else if (formData.description.trim().length < 50) {
          newErrors.description = 'Description should be at least 50 characters';
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\d{3}-\d{3}-\d{4}$/.test(formData.phone)) {
          newErrors.phone = 'Phone format should be XXX-XXX-XXXX';
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
        
        // Mock API call (for actual API endpoint will do it when we do backend)
        // await fetch('/api/business-submission', {
        //   method: 'POST',
        //   body: formDataToSend
        // });
        
        // Simulate API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSubmitSuccess(true);
        
        // Reset form after successful submission (or redirect)
        // setTimeout(() => {
        //   setFormData({
        //     name: '',
        //     owner: '',
        //     ownerEmail: '',
        //     description: '',
        //     category: '',
        //     address: '',
        //     phone: '',
        //     website: '',
        //     openingHours: '',
        //     businessImage: null,
        //     ownerAvatar: null,
        //     agreement: false
        //   });
        //   setCurrentStep(1);
        //   setSubmitSuccess(false);
        // }, 3000);
        
      } catch (error) {
        console.error('Submission error:', error);
        setErrors({
          ...errors,
          submit: 'There was an error submitting your business. Please try again.'
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
        
        <div className="form-group">
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
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>
        
        <div className="form-group">
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
          {errors.owner && <div className="error-message">{errors.owner}</div>}
        </div>
        
        <div className="form-group">
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
          {errors.ownerEmail && <div className="error-message">{errors.ownerEmail}</div>}
        </div>
        
        <div className="form-note">
          <FaInfoCircle /> Fields marked with an asterisk (*) are required.
        </div>
      </div>
    );
  };

  // Render step 2: Business Details
  const renderBusinessDetailsStep = () => {
    return (
      <div className="form-step">
        <h3>Business Details</h3>
        <p className="step-description">
          Please provide more detailed information about your business.
        </p>
        
        <div className="form-group">
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
          {errors.category && <div className="error-message">{errors.category}</div>}
        </div>
        
        <div className="form-group">
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
            {formData.description.length} / 500 characters
            {formData.description.length < 50 && " (minimum 50)"}
          </div>
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>
        
        <div className="form-group">
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
          {errors.address && <div className="error-message">{errors.address}</div>}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">
              <FaPhone /> Phone Number*
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., 555-123-4567"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>
          
          <div className="form-group">
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
        
        <div className="form-group">
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
        
        <div className="form-group upload-group">
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
          {errors.businessImage && <div className="error-message">{errors.businessImage}</div>}
        </div>
        
        <div className="form-group upload-group">
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
          {errors.ownerAvatar && <div className="error-message">{errors.ownerAvatar}</div>}
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
    
    return (
      <div className="form-step">
        <h3>Review Your Information</h3>
        <p className="step-description">
          Please review all the information you've provided before submitting.
        </p>
        
        <div className="review-container">
          <div className="review-section">
            <h4>Basic Information</h4>
            <div className="review-item">
              <span className="review-label">Business Name:</span>
              <span className="review-value">{formData.name}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Owner Name:</span>
              <span className="review-value">{formData.owner}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Email Address:</span>
              <span className="review-value">{formData.ownerEmail}</span>
            </div>
          </div>
          
          <div className="review-section">
            <h4>Business Details</h4>
            <div className="review-item">
              <span className="review-label">Category:</span>
              <span className="review-value">{formData.category}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Address:</span>
              <span className="review-value">{formData.address}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Phone:</span>
              <span className="review-value">{formData.phone}</span>
            </div>
            {formData.website && (
              <div className="review-item">
                <span className="review-label">Website:</span>
                <span className="review-value">{formData.website}</span>
              </div>
            )}
            {formData.openingHours && (
              <div className="review-item">
                <span className="review-label">Opening Hours:</span>
                <span className="review-value">{formData.openingHours}</span>
              </div>
            )}
          </div>
          
          <div className="review-section">
            <h4>Description</h4>
            <div className="review-item description-review">
              <div className="review-value">{formData.description}</div>
            </div>
          </div>
          
          {/* Updated Media/Images Section */}
          <div className="review-section">
            <h4>Media</h4>
            <div className="review-images">
              <div className="review-image-container">
                <span className="review-label">Business Image:</span>
                <div className="review-image">
                  {businessImagePreview ? (
                    <img src={businessImagePreview} alt="Business" />
                  ) : (
                    <div className="no-image">No image uploaded</div>
                  )}
                </div>
              </div>
              <div className="review-image-container">
                <span className="review-label">Profile Picture:</span>
                <div className="review-image avatar-image">
                  {ownerAvatarPreview ? (
                    <img src={ownerAvatarPreview} alt="Owner" />
                  ) : (
                    <div className="no-image">No image uploaded</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="review-section priority-section">
            <h4>Submission Priority</h4>
            <div className={`priority-indicator priority-${priority}`}>
              <FaExclamationTriangle />
              <span>
                {priority === 'high' 
                  ? 'High Priority' 
                  : priority === 'medium' 
                    ? 'Medium Priority' 
                    : 'Low Priority'}
              </span>
            </div>
            <div className="priority-note">
              Priority is calculated based on business category, completeness of information, and other factors.
            </div>
          </div>
        </div>
        
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="agreement"
            name="agreement"
            checked={formData.agreement}
            onChange={handleChange}
            className={errors.agreement ? 'error' : ''}
          />
          <label htmlFor="agreement">
            I confirm that all the information provided is accurate and complete. I understand that my 
            business submission will be reviewed before being published.
          </label>
          {errors.agreement && <div className="error-message">{errors.agreement}</div>}
        </div>
        
        {errors.submit && (
          <div className="form-error-message">
            <FaExclamationTriangle /> {errors.submit}
          </div>
        )}
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

  return (
    <div className="business-submission-container">
      <div className="business-submission-form-wrapper">
        <div className="form-header">
          <h2>Business Submission Form</h2>
          <p>Complete the form below to add your business to our directory</p>
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
  );
};

export default BusinessSubmissionForm;
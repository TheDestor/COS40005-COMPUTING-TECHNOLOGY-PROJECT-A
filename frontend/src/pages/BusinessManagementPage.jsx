import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaBell, 
  FaEnvelope, 
  FaFilter, 
  FaEllipsisV, 
  FaTrash, 
  FaCheck, 
  FaTimes,
  FaExclamationTriangle,
  FaStar,
  FaClock,
  FaBuilding
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/BusinessManagementPage.css';

// Import profile images
import profile1 from '../assets/profile1.png';
import profile2 from '../assets/profile2.png';
import profile3 from '../assets/profile3.png';
import profile4 from '../assets/profile4.png';
import profile5 from '../assets/profile5.png';
import profile6 from '../assets/profile6.png';
import profile7 from '../assets/profile7.png';
import profile8 from '../assets/profile8.png';

// Import business images
import business1 from '../assets/business1.jpg';
import business2 from '../assets/business2.jpg';
import business3 from '../assets/business3.jpg';
import business4 from '../assets/business4.jpg';
import business5 from '../assets/business5.jpg';
import business6 from '../assets/business6.jpg';
import business7 from '../assets/business7.jpg';
import business8 from '../assets/business8.jpg';

const BusinessManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Dummy data for businesses
  useEffect(() => {
    const dummyBusinesses = [
      {
        id: 1,
        name: 'Sunrise Cafe',
        owner: 'Gokul Kalla',
        ownerEmail: 'gokulkalla@gmail.com',
        description: 'A cozy cafe serving freshly brewed coffee and homemade pastries. Our atmosphere is perfect for both work meetings and casual get-togethers.',
        category: 'Food & Beverage',
        address: '123 Main Street, Downtown',
        phone: '555-123-4567',
        website: 'www.sunrisecafe.com',
        submissionDate: '2025-04-20T14:25:00',
        status: 'pending',
        rating: 4.5,
        openingHours: 'Mon-Fri: 7AM-7PM, Sat-Sun: 8AM-6PM',
        priority: 'medium',
        ownerAvatar: profile1,
        businessImage: business1
      },
      {
        id: 2,
        name: 'Tech Haven',
        owner: 'Carlos Sainz',
        ownerEmail: 'carlos.sainz@gmail.com',
        description: 'Premium tech repair and custom PC building services. We offer same-day repairs for most common issues and specialized builds for gaming and professional use.',
        category: 'Technology',
        address: '456 Tech Boulevard, Innovation District',
        phone: '555-987-6543',
        website: 'www.techhaven.com',
        submissionDate: '2025-04-19T09:12:00',
        status: 'in-review',
        rating: 4.8,
        openingHours: 'Mon-Sat: 9AM-8PM, Sun: 10AM-5PM',
        priority: 'high',
        ownerAvatar: profile2,
        businessImage: business2
      },
      {
        id: 3,
        name: 'Fitness First',
        owner: 'Kenneth',
        ownerEmail: 'kenneth@gmail.com',
        description: 'State-of-the-art fitness center with personal training, group classes, and premium equipment. Our certified trainers provide personalized fitness plans for all levels.',
        category: 'Health & Fitness',
        address: '789 Wellness Way, Uptown',
        phone: '555-789-0123',
        website: 'www.fitnessfirst.com',
        submissionDate: '2025-04-18T16:35:00',
        status: 'approved',
        rating: 4.2,
        openingHours: '24/7 access for members',
        priority: 'low',
        ownerAvatar: profile3,
        businessImage: business3
      },
      {
        id: 4,
        name: 'Bookworm Paradise',
        owner: 'Daniel',
        ownerEmail: 'daniel@gmail.com',
        description: 'Independent bookstore specializing in rare finds and local authors. We host weekly book clubs and author signings in our comfortable reading lounge.',
        category: 'Retail',
        address: '321 Literary Lane, Arts District',
        phone: '555-456-7890',
        website: 'www.bookwormparadise.com',
        submissionDate: '2025-04-17T11:20:00',
        status: 'pending',
        rating: 4.7,
        openingHours: 'Tue-Sun: 10AM-8PM, Closed on Mondays',
        priority: 'high',
        ownerAvatar: profile4,
        businessImage: business4
      },
      {
        id: 5,
        name: 'Coastal Inn',
        owner: 'Steph',
        ownerEmail: 'steph12@gmail.com',
        description: 'Boutique hotel with oceanfront views and luxury amenities. Each room features locally sourced furnishings and artwork from regional artists.',
        category: 'Hospitality',
        address: '555 Shoreline Drive, Beachfront',
        phone: '555-234-5678',
        website: 'www.coastalinn.com',
        submissionDate: '2025-04-16T14:50:00',
        status: 'in-review',
        rating: 4.9,
        openingHours: 'Check-in: 3PM, Check-out: 11AM',
        priority: 'medium',
        ownerAvatar: profile5,
        businessImage: business5
      },
      {
        id: 6,
        name: 'Green Thumb Garden Center',
        owner: 'Alvin',
        ownerEmail: 'alvin@gmail.com',
        description: 'Family-owned nursery and garden supply store specializing in native plants and organic gardening supplies. We offer landscaping consultations and seasonal workshops.',
        category: 'Home & Garden',
        address: '987 Botanical Way, Greenfield',
        phone: '555-345-6789',
        website: 'www.greenthumbgarden.com',
        submissionDate: '2025-04-15T08:05:00',
        status: 'rejected',
        rating: 4.0,
        openingHours: 'Mon-Sun: 8AM-6PM',
        priority: 'low',
        ownerAvatar: profile6,
        businessImage: business6
      },
      {
        id: 7,
        name: 'Auto Excellence',
        owner: 'Gary',
        ownerEmail: 'gary@gmail.com',
        description: 'Full-service auto repair and maintenance shop with certified mechanics. We specialize in domestic and foreign vehicles and offer courtesy shuttle service.',
        category: 'Automotive',
        address: '654 Mechanic Street, Industrial Park',
        phone: '555-876-5432',
        website: 'www.autoexcellence.com',
        submissionDate: '2025-04-14T13:15:00',
        status: 'pending',
        rating: 4.6,
        openingHours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-3PM',
        priority: 'high',
        ownerAvatar: profile7,
        businessImage: business7
      },
      {
        id: 8,
        name: 'Pawsome Pet Care',
        owner: 'Lara Wilson',
        ownerEmail: 'lauren.wilson@gmail.com',
        description: 'Professional pet grooming, daycare, and boarding facility. Our team of animal lovers provides personalized care for pets of all sizes and temperaments.',
        category: 'Pet Services',
        address: '123 Furry Friends Lane, Westside',
        phone: '555-789-4321',
        website: 'www.pawsomepetcare.com',
        submissionDate: '2025-04-13T15:40:00',
        status: 'in-review',
        rating: 4.3,
        openingHours: 'Mon-Sat: 7AM-7PM, Sun: 9AM-5PM',
        priority: 'medium',
        ownerAvatar: profile8,
        businessImage: business8
      }
    ];
    
    setBusinesses(dummyBusinesses);
    // first business selected by default
    setSelectedBusiness(dummyBusinesses[0]);
  }, []);

  // readable string format of date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to handle business selection
  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
    
    // If the business was pending, mark it as in-review
    if (business.status === 'pending') {
      const updatedBusinesses = businesses.map(item => {
        if (item.id === business.id) {
          return { ...item, status: 'in-review' };
        }
        return item;
      });
      
      setBusinesses(updatedBusinesses);
      setSelectedBusiness({ ...business, status: 'in-review' });
    }
  };

  // Handler for approving a business
  const handleApproveBusiness = (id) => {
    const updatedBusinesses = businesses.map(item => {
      if (item.id === id) {
        return { ...item, status: 'approved' };
      }
      return item;
    });
    
    setBusinesses(updatedBusinesses);
    
    if (selectedBusiness && selectedBusiness.id === id) {
      setSelectedBusiness({ ...selectedBusiness, status: 'approved' });
    }
    
    // Show success message (we might use a toast notification)
    alert("Business listing approved successfully!");
  };

  // Handler for rejecting a business
  const handleRejectBusiness = (id) => {
    const updatedBusinesses = businesses.map(item => {
      if (item.id === id) {
        return { ...item, status: 'rejected' };
      }
      return item;
    });
    
    setBusinesses(updatedBusinesses);
    
    if (selectedBusiness && selectedBusiness.id === id) {
      setSelectedBusiness({ ...selectedBusiness, status: 'rejected' });
    }
    
    // Show success message (we might use a toast notification)
    alert("Business listing rejected!");
  };

  // Handler for deleting a business
  const handleDeleteBusiness = (id) => {
    const updatedBusinesses = businesses.filter(item => item.id !== id);
    setBusinesses(updatedBusinesses);
    
    // If the deleted business was selected, select the first one from the updated list
    if (selectedBusiness && selectedBusiness.id === id) {
      setSelectedBusiness(updatedBusinesses.length > 0 ? updatedBusinesses[0] : null);
    }
  };

  // Handler for submitting admin notes
  const handleSubmitNotes = (e) => {
    e.preventDefault();
    if (!adminNotes.trim()) return;
    
    // WE CAN USE THIS FOR BACKEND PURPOSE
    console.log(`Admin notes for business #${selectedBusiness.id}:`, adminNotes);
    
    // Reset notes field
    setAdminNotes('');
    
    // Show success message (we might use a toast notification)
    alert("Notes saved successfully!");
  };

  // Filter businesses based on search query and filters
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = 
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || business.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || business.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique business categories for the filter dropdown
  const businessCategories = [...new Set(businesses.map(b => b.category))];

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge-pending';
      case 'in-review':
        return 'status-badge-progress';
      case 'approved':
        return 'status-badge-approved';
      case 'rejected':
        return 'status-badge-rejected';
      default:
        return '';
    }
  };

  // Helper function to get priority badge styling
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-badge-high';
      case 'medium':
        return 'priority-badge-medium';
      case 'low':
        return 'priority-badge-low';
      default:
        return '';
    }
  };

  // Helper function to display priority icon
  const renderPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <FaExclamationTriangle className="priority-icon priority-high" />;
      case 'medium':
        return <FaStar className="priority-icon priority-medium" />;
      case 'low':
        return <FaClock className="priority-icon priority-low" />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="greeting">
            <h3>Business Management</h3>
            <p>Review and manage business listings</p>
          </div>
          <div className="dashboard-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search businesses..."
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
        
        <div className="business-content">
          {/* Filters and options */}
          <div className="business-options">
            <div className="business-statistics">
              <div className="stat">
                <span className="stat-value">{businesses.filter(b => b.status === 'pending').length}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat">
                <span className="stat-value">{businesses.filter(b => b.status === 'in-review').length}</span>
                <span className="stat-label">In Review</span>
              </div>
              <div className="stat">
                <span className="stat-value">{businesses.filter(b => b.status === 'approved').length}</span>
                <span className="stat-label">Approved</span>
              </div>
              <div className="stat">
                <span className="stat-value">{businesses.filter(b => b.status === 'rejected').length}</span>
                <span className="stat-label">Rejected</span>
              </div>
              <div className="stat">
                <span className="stat-value">{businesses.length}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
            
            <div className="business-filters">
              <div className="filter-dropdown-container">
                <button 
                  className="filter-button"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <FaFilter /> Filter
                </button>
                
                {showFilterMenu && (
                  <div className="filter-dropdown">
                    <div className="filter-group">
                      <label>Status:</label>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="in-review">In Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Category:</label>
                      <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        {businessCategories.map((category, index) => (
                          <option key={index} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      className="clear-filters"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterCategory('all');
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="business-container">
            {/* Left panel - Business list */}
            <div className="business-list">
              {filteredBusinesses.length > 0 ? (
                filteredBusinesses.map(business => (
                  <div 
                    key={business.id}
                    className={`business-item ${selectedBusiness && selectedBusiness.id === business.id ? 'selected' : ''} ${business.status === 'pending' ? 'pending' : ''}`}
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <div className="business-avatar">
                      <img src={business.businessImage} alt={`${business.name} thumbnail`} />
                    </div>
                    <div className="business-brief">
                      <div className="business-header">
                        <h4 className="business-name">{business.name}</h4>
                        <span className="business-date">{formatDate(business.submissionDate)}</span>
                      </div>
                      <div className="business-owner">
                        <img src={business.ownerAvatar} alt={`${business.owner}'s avatar`} className="owner-avatar" />
                        <span>{business.owner}</span>
                      </div>
                      <div className="business-category">{business.category}</div>
                      <div className="business-description-preview">
                        {business.description.substring(0, 60)}...
                      </div>
                      <div className="business-status">
                        <span className={`status-badge ${getStatusBadgeClass(business.status)}`}>
                          {business.status === 'in-review' ? 'In Review' : business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                        </span>
                        <span className={`priority-badge ${getPriorityBadgeClass(business.priority)}`}>
                          {renderPriorityIcon(business.priority)}
                          {business.priority.charAt(0).toUpperCase() + business.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-businesses">
                  <p>No businesses match your criteria</p>
                </div>
              )}
            </div>
            
            {/* Right panel - Selected business detail */}
            {selectedBusiness ? (
              <div className="business-detail">
                <div className="business-detail-header">
                  <div className="business-info">
                    <div className="business-main-image">
                      <img src={selectedBusiness.businessImage} alt={`${selectedBusiness.name}`} className="detail-business-image" />
                    </div>
                    <div className="business-header-info">
                      <h3 className="detail-name">{selectedBusiness.name}</h3>
                      <span className={`status-badge ${getStatusBadgeClass(selectedBusiness.status)}`}>
                        {selectedBusiness.status === 'in-review' ? 'In Review' : selectedBusiness.status.charAt(0).toUpperCase() + selectedBusiness.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="business-actions">
                    <button 
                      className={`business-action-btn approve-btn ${selectedBusiness.status === 'approved' ? 'disabled' : ''}`}
                      onClick={() => handleApproveBusiness(selectedBusiness.id)}
                      disabled={selectedBusiness.status === 'approved'}
                    >
                      <FaCheck /> {selectedBusiness.status === 'approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button 
                      className={`business-action-btn reject-btn ${selectedBusiness.status === 'rejected' ? 'disabled' : ''}`}
                      onClick={() => handleRejectBusiness(selectedBusiness.id)}
                      disabled={selectedBusiness.status === 'rejected'}
                    >
                      <FaTimes /> {selectedBusiness.status === 'rejected' ? 'Rejected' : 'Reject'}
                    </button>
                    <button 
                      className="business-action-btn delete-btn"
                      onClick={() => handleDeleteBusiness(selectedBusiness.id)}
                    >
                      <FaTrash /> Delete
                    </button>
                    <div className="more-actions">
                      <FaEllipsisV />
                      <div className="more-dropdown">
                        <button>Message Owner</button>
                        <button>Export Details</button>
                        <button>Print Profile</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="business-detail-content">
                  <div className="business-owner-info">
                    <div className="owner-info-header">
                      <h4>Owner Information</h4>
                      <div className="owner-profile">
                        <img src={selectedBusiness.ownerAvatar} alt={`${selectedBusiness.owner}'s avatar`} className="detail-avatar" />
                        <div>
                          <p className="detail-owner-name">{selectedBusiness.owner}</p>
                          <p className="detail-email">{selectedBusiness.ownerEmail}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="business-meta">
                    <div className="meta-section">
                      <h4>Business Details</h4>
                      <div className="meta-grid">
                        <div className="meta-item">
                          <span className="meta-label">Category:</span>
                          <span className="meta-value">{selectedBusiness.category}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Submission Date:</span>
                          <span className="meta-value">{formatDate(selectedBusiness.submissionDate)}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Phone:</span>
                          <span className="meta-value">{selectedBusiness.phone}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Website:</span>
                          <span className="meta-value">{selectedBusiness.website}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Rating:</span>
                          <span className="meta-value">{selectedBusiness.rating}/5</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Hours:</span>
                          <span className="meta-value">{selectedBusiness.openingHours}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="meta-item address-item">
                      <span className="meta-label">Address:</span>
                      <span className="meta-value">{selectedBusiness.address}</span>
                    </div>
                  </div>
                  
                  <div className="business-description">
                    <h4>Description:</h4>
                    <div className="description-body">
                      {selectedBusiness.description}
                    </div>
                  </div>
                  
                  <div className="admin-notes">
                    <h4>Admin Notes:</h4>
                    <form onSubmit={handleSubmitNotes}>
                      <textarea
                        placeholder="Add notes or comments about this business listing..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      ></textarea>
                      <div className="notes-actions">
                        <button 
                          type="submit" 
                          className="save-notes-btn"
                          disabled={!adminNotes.trim()}
                        >
                          <FaCheck /> Save Notes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-business-selected">
                <p>Select a business to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessManagement;
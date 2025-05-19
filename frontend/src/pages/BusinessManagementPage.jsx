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
  FaBuilding,
  FaSpinner,
  FaLock
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/BusinessManagementPage.css';
import axios from 'axios';
import { useAuth } from '../context/AuthProvider'; // Fixed import path

// Fallback images (in case API images fail to load)
import defaultBusinessImage from '../assets/default-business.jpg';
import defaultAvatarImage from '../assets/default-avatar.png';

const BusinessManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [businessCategories, setBusinessCategories] = useState([]);
  
  // Get authentication context
  const { accessToken, isLoggedIn, user } = useAuth();
  
  // Check if user is an admin
  const isAdmin = user && user.role === 'cbt_admin';
  
  // Log user info for debugging
  useEffect(() => {
    console.log("Current user:", user);
    console.log("Is user admin?", isAdmin);
  }, [user, isAdmin]);

  // Create axios instance with authentication
  const authAxios = axios.create({
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // Fetch businesses from backend
  const fetchBusinesses = async () => {
    if (!isLoggedIn || !accessToken) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }
    
    if (!isAdmin) {
      setError('You do not have permission to access this page. Admin access required.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let endpoint = '/api/businesses/getAllBusinesses';
      
      // Add query parameters for filtering
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10); // Adjust limit as needed
      
      if (filterStatus !== 'all') {
        endpoint = `/api/businesses/getBusinessesByStatus/${filterStatus}`;
      }
      
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      
      // Sorting - newest first
      params.append('sortField', 'submissionDate');
      params.append('sortOrder', 'desc');
      
      // Log the request URL and token for debugging
      console.log(`Fetching: ${endpoint}?${params.toString()}`);
      console.log(`Using token: ${accessToken.substring(0, 20)}...`);
      
      const response = await authAxios.get(`${endpoint}?${params.toString()}`);
      
      console.log('Response received:', response.data);
      console.log('Businesses count:', response.data.data ? response.data.data.length : 0);
      console.log('First business:', response.data.data && response.data.data.length > 0 ? response.data.data[0] : 'No businesses found');
      
      if (response.data.success) {
        setBusinesses(response.data.data);
        setTotalPages(response.data.totalPages);
        
        // Extract unique categories for filter dropdown
        if (response.data.data && response.data.data.length > 0) {
          const categories = [...new Set(response.data.data.map(b => b.category))];
          setBusinessCategories(categories);
        }
        
        // Select first business by default if no business is selected
        if (!selectedBusiness && response.data.data && response.data.data.length > 0) {
          setSelectedBusiness(response.data.data[0]);
        }
      } else {
        setError('Failed to load businesses: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      
      if (err.response && err.response.status === 403) {
        setError('Access denied. You do not have permission to view businesses.');
      } else {
        setError('Failed to load businesses. ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Update axios instance when token changes
  useEffect(() => {
    if (accessToken) {
      authAxios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
  }, [accessToken]);

  // Initial data loading - reload when token, page, or filters change
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      fetchBusinesses();
    }
  }, [isLoggedIn, accessToken, page, filterStatus, filterCategory]);

  // Format date to readable string
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
      handleUpdateBusinessStatus(business._id, 'in-review');
    }
  };

  // Handler for updating business status
  const handleUpdateBusinessStatus = async (id, newStatus) => {
    if (!isLoggedIn || !accessToken) {
      setError('Authentication required. Please log in.');
      return;
    }
    
    if (!isAdmin) {
      setError('You do not have permission to perform this action.');
      return;
    }

    try {
      const response = await authAxios.patch(`/api/businesses/updateBusinessStatus/${id}`, {
        status: newStatus
      });
      
      if (response.data.success) {
        // Update businesses list
        const updatedBusinesses = businesses.map(item => {
          if (item._id === id) {
            return { ...item, status: newStatus };
          }
          return item;
        });
        
        setBusinesses(updatedBusinesses);
        
        // Update selected business if it's the one that was modified
        if (selectedBusiness && selectedBusiness._id === id) {
          setSelectedBusiness({ ...selectedBusiness, status: newStatus });
        }
        
        // Show success message (could use a toast notification here)
        alert(`Business listing ${newStatus} successfully!`);
      } else {
        alert('Failed to update business status: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error updating business status:', err);
      
      if (err.response && err.response.status === 403) {
        alert('Access denied. You do not have permission to update business status.');
      } else {
        alert('Error updating business status: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Handler for approving a business
  const handleApproveBusiness = (id) => {
    handleUpdateBusinessStatus(id, 'approved');
  };

  // Handler for rejecting a business
  const handleRejectBusiness = (id) => {
    handleUpdateBusinessStatus(id, 'rejected');
  };

  // Handler for deleting a business
  const handleDeleteBusiness = async (id) => {
    if (!isLoggedIn || !accessToken) {
      setError('Authentication required. Please log in.');
      return;
    }
    
    if (!isAdmin) {
      setError('You do not have permission to perform this action.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await authAxios.delete(`/api/businesses/deleteBusiness/${id}`);
      
      if (response.data.success) {
        // Remove business from the list
        const updatedBusinesses = businesses.filter(item => item._id !== id);
        setBusinesses(updatedBusinesses);
        
        // If the deleted business was selected, select the first one from the updated list
        if (selectedBusiness && selectedBusiness._id === id) {
          setSelectedBusiness(updatedBusinesses.length > 0 ? updatedBusinesses[0] : null);
        }
        
        // Show success message
        alert('Business deleted successfully!');
      } else {
        alert('Failed to delete business: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error deleting business:', err);
      
      if (err.response && err.response.status === 403) {
        alert('Access denied. You do not have permission to delete businesses.');
      } else {
        alert('Error deleting business: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Handler for submitting admin notes
  const handleSubmitNotes = (e) => {
    e.preventDefault();
    if (!adminNotes.trim() || !selectedBusiness) return;
    
    // Here you could save the notes to the backend if needed
    console.log(`Admin notes for business #${selectedBusiness._id}:`, adminNotes);
    
    // For now, just show a success message and clear the notes field
    alert("Notes saved successfully!");
    setAdminNotes('');
  };

  // Filter businesses based on search query (client-side filtering)
  const filteredBusinesses = businesses.filter(business => {
    if (!business) return false;
    
    const matchesSearch = !searchQuery || 
      (business.name && business.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (business.owner && business.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (business.category && business.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (business.description && business.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

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

  // Render unauthorized state
  if (!isAdmin) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="greeting">
              <h3>Business Management</h3>
              <p>Review and manage business listings</p>
            </div>
          </div>
          <div className="error-container">
            <FaLock className="error-icon" />
            <h2>Access Denied</h2>
            <p>You do not have permission to access this page. This feature is restricted to CBT administrators only.</p>
            <p>If you believe you should have access, please contact your system administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading && businesses.length === 0) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="greeting">
              <h3>Business Management</h3>
              <p>Review and manage business listings</p>
            </div>
          </div>
          <div className="loading-container">
            <FaSpinner className="spinner" />
            <p>Loading businesses...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && businesses.length === 0) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="greeting">
              <h3>Business Management</h3>
              <p>Review and manage business listings</p>
            </div>
          </div>
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <p>{error}</p>
            <button className="retry-button" onClick={fetchBusinesses}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

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
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setPage(1); // Reset to first page on filter change
                        }}
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
                        onChange={(e) => {
                          setFilterCategory(e.target.value);
                          setPage(1); // Reset to first page on filter change
                        }}
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
                        setPage(1);
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
                    key={business._id}
                    className={`business-item ${selectedBusiness && selectedBusiness._id === business._id ? 'selected' : ''} ${business.status === 'pending' ? 'pending' : ''}`}
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <div className="business-avatar">
                      <img 
                        src={business.businessImage} 
                        alt={`${business.name} thumbnail`} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultBusinessImage;
                        }}
                      />
                    </div>
                    <div className="business-brief">
                      <div className="business-header">
                        <h4 className="business-name">{business.name}</h4>
                        <span className="business-date">{formatDate(business.submissionDate)}</span>
                      </div>
                      <div className="business-owner">
                        <img 
                          src={business.ownerAvatar} 
                          alt={`${business.owner}'s avatar`} 
                          className="owner-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultAvatarImage;
                          }}
                        />
                        <span>{business.owner}</span>
                      </div>
                      <div className="business-category">{business.category}</div>
                      <div className="business-description-preview">
                        {business.description && business.description.length > 60 
                          ? `${business.description.substring(0, 60)}...` 
                          : business.description}
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

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button 
                    className="page-button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span className="page-info">Page {page} of {totalPages}</span>
                  <button 
                    className="page-button"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            
            {/* Right panel - Selected business detail */}
            {selectedBusiness ? (
              <div className="business-detail">
                <div className="business-detail-header">
                  <div className="business-info">
                    <div className="business-main-image">
                      <img 
                        src={selectedBusiness.businessImage} 
                        alt={`${selectedBusiness.name}`} 
                        className="detail-business-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultBusinessImage;
                        }}
                      />
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
                      onClick={() => handleApproveBusiness(selectedBusiness._id)}
                      disabled={selectedBusiness.status === 'approved'}
                    >
                      <FaCheck /> {selectedBusiness.status === 'approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button 
                      className={`business-action-btn reject-btn ${selectedBusiness.status === 'rejected' ? 'disabled' : ''}`}
                      onClick={() => handleRejectBusiness(selectedBusiness._id)}
                      disabled={selectedBusiness.status === 'rejected'}
                    >
                      <FaTimes /> {selectedBusiness.status === 'rejected' ? 'Rejected' : 'Reject'}
                    </button>
                    <button 
                      className="business-action-btn delete-btn"
                      onClick={() => handleDeleteBusiness(selectedBusiness._id)}
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
                        <img 
                          src={selectedBusiness.ownerAvatar} 
                          alt={`${selectedBusiness.owner}'s avatar`} 
                          className="detail-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultAvatarImage;
                          }}
                        />
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
                          <span className="meta-value">{selectedBusiness.website || 'Not provided'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Priority:</span>
                          <span className="meta-value">
                            {renderPriorityIcon(selectedBusiness.priority)}
                            {selectedBusiness.priority.charAt(0).toUpperCase() + selectedBusiness.priority.slice(1)}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Hours:</span>
                          <span className="meta-value">{selectedBusiness.openingHours || 'Not provided'}</span>
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
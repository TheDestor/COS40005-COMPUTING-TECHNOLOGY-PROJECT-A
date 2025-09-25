import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSearch, 
  FaBell, 
  FaEnvelope, 
  FaFilter, 
  FaPrint, 
  FaTrash, 
  FaCheck, 
  FaTimes,
  FaExclamationTriangle,
  FaStar,
  FaClock,
  FaBuilding,
  FaSpinner,
  FaLock,
  FaChevronLeft,
  FaChevronRight
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
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Changed from 10 to 5
  
  // Get authentication context
  const { accessToken, isLoggedIn, user } = useAuth();
  
  // Check if user is an admin
  const isAdmin = user && user.role === 'cbt_admin';
  
  const printOptionsRef = useRef(null);
  
  // Log user info for debugging
  useEffect(() => {
    console.log("Current user:", user);
    console.log("Is user admin?", isAdmin);
  }, [user, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (printOptionsRef.current && !printOptionsRef.current.contains(event.target)) {
        setShowPrintOptions(false);
      }
    };

    if (showPrintOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrintOptions]);

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
      // Always use the main endpoint for consistency
      const endpoint = '/api/businesses/getAllBusinesses';
      
      // Add query parameters for filtering
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 50); // Fetch more for client-side pagination
      
      // Add filters as parameters - let backend handle filtering if it supports it
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
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
        let businessData = response.data.data || [];

        // Client-side filtering as fallback (only if backend doesn't handle the filters properly)
        // Remove this section if your backend properly handles the status and category parameters
        if (filterStatus !== 'all') {
          businessData = businessData.filter(business => business.status === filterStatus);
        }
        
        if (filterCategory !== 'all') {
          businessData = businessData.filter(business => business.category === filterCategory);
        }

        setBusinesses(businessData);
        
        // Extract unique categories for filter dropdown
        // Note: This will only show categories from filtered results
        // Consider fetching categories separately for a complete list
        if (businessData.length > 0) {
          const categories = [...new Set(businessData.map(b => b.category).filter(Boolean))];
          setBusinessCategories(categories);
        } else {
          // Clear categories if no businesses match the filter
          setBusinessCategories([]);
        }
        
        // Select first business by default if no business is selected and we have data
        if (businessData.length > 0) {
          // Only set selected business if we don't have one or if current one is not in filtered results
          if (!selectedBusiness || !businessData.find(b => b._id === selectedBusiness._id)) {
            setSelectedBusiness(businessData[0]);
          }
        } else {
          // Clear selected business if no businesses match the filter
          setSelectedBusiness(null);
        }
        
        // Clear any previous errors on successful fetch
        setError(null);
      } else {
        setError('Failed to load businesses: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      
      if (err.response) {
        switch (err.response.status) {
          case 403:
            setError('Access denied. You do not have permission to view businesses.');
            break;
          case 401:
            setError('Authentication failed. Please log in again.');
            break;
          case 404:
            setError('Business data not found. The endpoint may have changed.');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError('Failed to load businesses: ' + (err.response.data?.message || 'Network error'));
        }
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred: ' + err.message);
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

  // Print functionality
  const handlePrintBusiness = () => {
    if (!selectedBusiness) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Business Listing Details</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .business-info { margin-bottom: 20px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            .section { margin-top: 30px; }
            .description-content { 
              background: #f9f9f9; 
              padding: 15px; 
              border-radius: 5px; 
              margin-top: 10px;
              line-height: 1.6;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-review { background: #dbeafe; color: #1e40af; }
            .status-approved { background: #d1fae5; color: #065f46; }
            .status-rejected { background: #fee2e2; color: #dc2626; }
            .business-image { max-width: 200px; margin: 10px 0; border-radius: 8px; }
            .owner-section { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Business Listing Details</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="business-info">
            <h2>${selectedBusiness.name}</h2>
            <img src="${selectedBusiness.businessImage.startsWith('/uploads') 
              ? `${window.location.origin}${selectedBusiness.businessImage}` 
              : selectedBusiness.businessImage}" 
              alt="Business Image" class="business-image" />
            
            <p><span class="label">Business ID:</span><span class="value">${selectedBusiness._id}</span></p>
            <p><span class="label">Category:</span><span class="value">${selectedBusiness.category}</span></p>
            <p><span class="label">Date Submitted:</span><span class="value">${formatDate(selectedBusiness.submissionDate)}</span></p>
            <p><span class="label">Status:</span><span class="value">
              <span class="status-badge status-${selectedBusiness.status.toLowerCase().replace('-', '')}">
                ${selectedBusiness.status === 'in-review' ? 'In Review' : selectedBusiness.status.charAt(0).toUpperCase() + selectedBusiness.status.slice(1)}
              </span>
            </span></p>
            <p><span class="label">Priority:</span><span class="value">${selectedBusiness.priority.charAt(0).toUpperCase() + selectedBusiness.priority.slice(1)}</span></p>
            <p><span class="label">Phone:</span><span class="value">${selectedBusiness.phone}</span></p>
            <p><span class="label">Website:</span><span class="value">${selectedBusiness.website || 'Not provided'}</span></p>
            <p><span class="label">Opening Hours:</span><span class="value">${selectedBusiness.openingHours || 'Not provided'}</span></p>
            <p><span class="label">Address:</span><span class="value">${selectedBusiness.address}</span></p>
            <p><span class="label">Coordinates:</span><span class="value">${selectedBusiness.latitude}, ${selectedBusiness.longitude}</span></p>
          </div>
          
          <div class="owner-section">
            <h3>Owner Information</h3>
            <p><span class="label">Owner Name:</span><span class="value">${selectedBusiness.owner}</span></p>
            <p><span class="label">Owner Email:</span><span class="value">${selectedBusiness.ownerEmail}</span></p>
          </div>
          
          <div class="section">
            <h3>Business Description:</h3>
            <div class="description-content">
              ${selectedBusiness.description}
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    
    setShowPrintOptions(false);
  };

  const handleSaveBusiness = () => {
    if (!selectedBusiness) return;

    const businessData = {
      id: selectedBusiness._id,
      name: selectedBusiness.name,
      owner: selectedBusiness.owner,
      ownerEmail: selectedBusiness.ownerEmail,
      category: selectedBusiness.category,
      description: selectedBusiness.description,
      address: selectedBusiness.address,
      phone: selectedBusiness.phone,
      website: selectedBusiness.website,
      openingHours: selectedBusiness.openingHours,
      latitude: selectedBusiness.latitude,
      longitude: selectedBusiness.longitude,
      status: selectedBusiness.status,
      priority: selectedBusiness.priority,
      submissionDate: selectedBusiness.submissionDate
    };

    const dataStr = JSON.stringify(businessData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `business_${selectedBusiness._id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowPrintOptions(false);
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

  // Pagination calculations
  const totalPaginationPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBusinesses = filteredBusinesses.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPaginationPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterCategory]);

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
        <div className="dashboard-header compact-header">
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
        
        <div className="business-content no-scroll-layout">
          {/* Filters and options */}
          <div className="business-options compact-options">
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
          
          <div className="business-container no-scroll-container">
            {/* Left panel - Business list */}
            <div className="business-list compact-list">
              {currentBusinesses.length > 0 ? (
                <>
                  {currentBusinesses.map(business => (
                    <div 
                      key={business._id}
                      className={`business-item compact-item ${selectedBusiness && selectedBusiness._id === business._id ? 'selected' : ''} ${business.status === 'pending' ? 'pending' : ''}`}
                      onClick={() => handleSelectBusiness(business)}
                    >
                      <div className="business-avatar compact-avatar">
                        <img 
                          src={business.businessImage.startsWith('/uploads') 
                            ? `${window.location.origin}${business.businessImage}` 
                            : business.businessImage} 
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
                          <span className="business-date compact-date">{formatDate(business.submissionDate)}</span>
                        </div>
                        <div className="business-owner compact-owner">
                          <img 
                            src={business.ownerAvatar.startsWith('/uploads') 
                              ? `${window.location.origin}${business.ownerAvatar}` 
                              : business.ownerAvatar} 
                            alt={`${business.owner}'s avatar`} 
                            className="owner-avatar"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = defaultAvatarImage;
                            }}
                          />
                          <span>{business.owner}</span>
                        </div>
                        <div className="business-category compact-category">{business.category}</div>
                        <div className="business-description-preview compact-preview">
                          {business.description && business.description.length > 40 
                            ? `${business.description.substring(0, 40)}...` 
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
                  ))}
                  
                  {/* Professional Pagination Controls */}
                  {totalPaginationPages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBusinesses.length)} of {filteredBusinesses.length} businesses
                      </div>
                      <div className="pagination-controls">
                        <button
                          className="pagination-btn"
                          onClick={handlePrevious}
                          disabled={currentPage === 1}
                        >
                          <FaChevronLeft /> Previous
                        </button>
                        
                        <div className="page-numbers">
                          {Array.from({ length: Math.min(5, totalPaginationPages) }, (_, index) => {
                            let pageNumber;
                            if (totalPaginationPages <= 5) {
                              pageNumber = index + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = index + 1;
                            } else if (currentPage >= totalPaginationPages - 2) {
                              pageNumber = totalPaginationPages - 4 + index;
                            } else {
                              pageNumber = currentPage - 2 + index;
                            }
                            
                            return (
                              <button
                                key={pageNumber}
                                className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
                                onClick={() => handlePageChange(pageNumber)}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          className="pagination-btn"
                          onClick={handleNext}
                          disabled={currentPage === totalPaginationPages}
                        >
                          Next <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-businesses">
                  <p>No businesses match your criteria</p>
                </div>
              )}
            </div>
            
            {/* Right panel - Selected business detail */}
            {selectedBusiness ? (
              <div className="business-detail compact-detail">
                <div className="business-detail-header compact-detail-header">
                  <div className="business-info compact-info">
                    <div className="business-main-image compact-main-image">
                      <img 
                        src={selectedBusiness.businessImage.startsWith('/uploads') 
                          ? `${window.location.origin}${selectedBusiness.businessImage}` 
                          : selectedBusiness.businessImage} 
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
                  
                  <div className="business-actions compact-actions">
                    <button 
                      className={`business-action-btn approve-btn ${selectedBusiness.status === 'approved' ? 'disabled' : ''}`}
                      onClick={() => handleApproveBusiness(selectedBusiness._id)}
                      disabled={selectedBusiness.status === 'approved'}
                    >
                      {selectedBusiness.status === 'approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button 
                      className={`business-action-btn reject-btn ${selectedBusiness.status === 'rejected' ? 'disabled' : ''}`}
                      onClick={() => handleRejectBusiness(selectedBusiness._id)}
                      disabled={selectedBusiness.status === 'rejected'}
                    >
                      {selectedBusiness.status === 'rejected' ? 'Rejected' : 'Reject'}
                    </button>
                    <button 
                      className="business-action-btn delete-btn"
                      onClick={() => handleDeleteBusiness(selectedBusiness._id)}
                    >
                      <FaTrash /> Delete
                    </button>
                    <div
                      className="print-actions"
                      ref={printOptionsRef}
                    >
                      <button
                        className="business-action-btn print-btn"
                        onClick={() => setShowPrintOptions(!showPrintOptions)}
                      >
                        <FaPrint />
                      </button>
                      <div className={`print-dropdown ${showPrintOptions ? 'active' : ''}`}>
                        <button onClick={handlePrintBusiness}>Print Business</button>
                        <button onClick={handleSaveBusiness}>Save as File</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="business-detail-content compact-detail-content">
                  <div className="business-owner-info compact-owner-info">
                    <div className="owner-info-header">
                      <h4>Owner Information</h4>
                      <div className="owner-profile compact-owner-profile">
                        <img 
                          src={selectedBusiness.ownerAvatar.startsWith('/uploads') 
                            ? `${window.location.origin}${selectedBusiness.ownerAvatar}` 
                            : selectedBusiness.ownerAvatar} 
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
                  
                  <div className="business-meta compact-meta">
                    <div className="meta-section">
                      <h4>Business Details</h4>
                      <div className="meta-grid compact-grid">
                        <div className="meta-item">
                          <span className="meta-label">Category:</span>
                          <span className="meta-value">{selectedBusiness.category}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Date:</span>
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
                    
                    <div className="meta-item address-item compact-address">
                      <span className="meta-label">Address:</span>
                      <span className="meta-value">{selectedBusiness.address}</span>
                    </div>

                    <div className="meta-item address-item compact-address">
                      <span className="meta-label">Coordinate:</span>
                      <span className="meta-value">{selectedBusiness.latitude}, {selectedBusiness.longitude}</span>
                    </div>
                  </div>
                  
                  <div className="business-description compact-description">
                    <h4>Description:</h4>
                    <div className="description-body compact-description-body">
                      {selectedBusiness.description}
                    </div>
                  </div>
                  
                  <div className="admin-notes compact-notes">
                    <h4>Admin Notes:</h4>
                    <form onSubmit={handleSubmitNotes}>
                      <textarea
                        className="compact-textarea"
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

      <style jsx>{`
        /* Compact Layout Styles for No-Scroll Business Management */
        .dashboard-content {
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .compact-header {
          padding: 10px 20px;
          min-height: 70px;
          flex-shrink: 0;
        }

        .compact-header h3 {
          font-size: 1.4rem;
          margin-bottom: 2px;
        }

        .compact-header p {
          font-size: 0.9rem;
          margin: 0;
        }

        .no-scroll-layout {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .compact-options {
          padding: 8px 20px;
          flex-shrink: 0;
        }

        .business-statistics {
          gap: 12px;
        }

        .stat {
          padding: 6px 10px;
        }

        .stat-value {
          font-size: 1.2rem;
        }

        .stat-label {
          font-size: 0.8rem;
        }

        .no-scroll-container {
          flex: 1;
          display: flex;
          overflow: hidden;
          margin: 0 20px 20px 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .compact-list {
          width: 40%;
          overflow-y: auto;
          max-height: none;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }

        .compact-item {
          padding: 8px;
          border-bottom: 1px solid #f3f4f6;
        }

        .compact-avatar img {
          width: 35px;
          height: 35px;
        }

        .business-brief {
          flex: 1;
          min-width: 0;
        }

        .business-name {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .compact-date {
          font-size: 0.75rem;
        }

        .compact-owner {
          margin: 2px 0;
        }

        .compact-owner .owner-avatar {
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }

        .compact-owner span {
          font-size: 0.8rem;
        }

        .compact-category {
          font-size: 0.8rem;
          margin: 2px 0;
          color: #6b7280;
        }

        .compact-preview {
          font-size: 0.8rem;
          line-height: 1.3;
          margin: 3px 0;
        }

        .business-status {
          gap: 6px;
          margin-top: 4px;
        }

        .status-badge, .priority-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
        }

        /* Professional Pagination Styles */
        .pagination-container {
          border-top: 1px solid #e5e7eb;
          padding: 15px;
          background: #f9fafb;
          margin-top: auto;
        }

        .pagination-info {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 10px;
          text-align: center;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 4px;
        }

        .page-number {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 35px;
          text-align: center;
        }

        .page-number:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .page-number.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .compact-detail {
          width: 60%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .compact-detail-header {
          padding: 10px 15px;
          flex-shrink: 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .compact-info {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .compact-main-image {
          flex-shrink: 0;
        }

        .compact-main-image .detail-business-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        .business-header-info h3 {
          font-size: 1.1rem;
          margin-bottom: 4px;
        }

        .compact-actions {
          gap: 6px;
          margin-top: 8px;
        }

        .business-action-btn {
          padding: 5px 10px;
          font-size: 0.8rem;
        }

        /* Print Actions Styles */
        .print-actions {
          position: relative;
        }

        .print-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 40px;
        }

        .print-btn:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .print-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          min-width: 140px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
        }

        .print-dropdown.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .print-dropdown button {
          display: block;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 0.85rem;
          color: #374151;
          transition: background-color 0.2s ease;
        }

        .print-dropdown button:first-child {
          border-radius: 8px 8px 0 0;
        }

        .print-dropdown button:last-child {
          border-radius: 0 0 8px 8px;
          border-bottom: none;
        }

        .print-dropdown button:hover {
          background: #f3f4f6;
        }

        .print-dropdown button:not(:last-child) {
          border-bottom: 1px solid #e5e7eb;
        }

        .compact-detail-content {
          flex: 1;
          padding: 12px 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .compact-owner-info {
          background: #f9fafb;
          border-radius: 6px;
          padding: 8px;
        }

        .owner-info-header h4 {
          font-size: 0.9rem;
          margin-bottom: 6px;
        }

        .compact-owner-profile {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .compact-owner-profile .detail-avatar {
          width: 30px;
          height: 30px;
        }

        .detail-owner-name {
          font-size: 0.9rem;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .detail-email {
          font-size: 0.8rem;
          margin: 0;
          color: #6b7280;
        }

        .compact-meta {
          background: #f9fafb;
          border-radius: 6px;
          padding: 8px;
        }

        .meta-section h4 {
          font-size: 0.9rem;
          margin-bottom: 6px;
        }

        .compact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .meta-value {
          font-size: 0.8rem;
          font-weight: 400;
        }

        .compact-address {
          grid-column: 1 / -1;
          margin-top: 4px;
        }

        .compact-address .meta-value {
          font-size: 0.8rem;
          line-height: 1.3;
        }

        .compact-description h4 {
          font-size: 0.9rem;
          margin-bottom: 6px;
        }

        .compact-description-body {
          background: #f9fafb;
          border-radius: 6px;
          padding: 8px;
          font-size: 0.85rem;
          line-height: 1.4;
          max-height: 80px;
          overflow-y: auto;
        }

        .compact-notes {
          margin-top: auto;
        }

        .compact-notes h4 {
          font-size: 0.9rem;
          margin-bottom: 6px;
        }

        .compact-textarea {
          width: 100%;
          height: 60px;
          padding: 6px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          resize: none;
          font-size: 0.85rem;
          font-family: inherit;
        }

        .save-notes-btn {
          padding: 6px 12px;
          font-size: 0.8rem;
          margin-top: 6px;
        }

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .compact-list {
            width: 100%;
          }
          
          .compact-detail {
            width: 100%;
          }
          
          .compact-grid {
            grid-template-columns: 1fr;
          }

          .pagination-controls {
            flex-direction: column;
            gap: 10px;
          }

          .page-numbers {
            order: -1;
          }

          .pagination-info {
            font-size: 0.75rem;
          }
        }

        /* Scrollbar styling for better appearance */
        .compact-list::-webkit-scrollbar,
        .compact-detail-content::-webkit-scrollbar,
        .compact-description-body::-webkit-scrollbar {
          width: 4px;
        }

        .compact-list::-webkit-scrollbar-track,
        .compact-detail-content::-webkit-scrollbar-track,
        .compact-description-body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .compact-list::-webkit-scrollbar-thumb,
        .compact-detail-content::-webkit-scrollbar-thumb,
        .compact-description-body::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }

        .compact-list::-webkit-scrollbar-thumb:hover,
        .compact-detail-content::-webkit-scrollbar-thumb:hover,
        .compact-description-body::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Loading and error states compact styling */
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
        }

        .loading-container p, .error-container p {
          font-size: 0.9rem;
          margin-top: 8px;
        }

        .error-icon {
          font-size: 2rem;
          color: #ef4444;
        }

        .spinner {
          animation: spin 1s linear infinite;
          font-size: 1.5rem;
          color: #3b82f6;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .retry-button {
          margin-top: 8px;
          padding: 6px 12px;
          font-size: 0.8rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .retry-button:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default BusinessManagement;
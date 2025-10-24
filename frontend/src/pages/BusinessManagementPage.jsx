import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSearch, 
  FaBell, 
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
  FaChevronRight,
  FaSync,
  FaArrowLeft
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [showBusinessDetail, setShowBusinessDetail] = useState(false);  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastBusinessCount, setLastBusinessCount] = useState(0);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Changed from 10 to 5
  
  // Get authentication context
  const { accessToken, isLoggedIn, user } = useAuth();
  
  // Check if user is an admin
  const isAdmin = user && user.role === 'cbt_admin';
  
  const printOptionsRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Log user info for debugging
  useEffect(() => {
    console.log("Current user:", user);
    console.log("Is user admin?", isAdmin);
  }, [user, isAdmin]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
      if (window.innerWidth > 600 && showBusinessDetail) {
        setShowBusinessDetail(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showBusinessDetail]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (printOptionsRef.current && !printOptionsRef.current.contains(event.target)) {
        setShowPrintOptions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showPrintOptions || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrintOptions, showNotifications]);

  // Create axios instance with authentication
  const authAxios = axios.create({
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // Add notification when new business is detected
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleString(),
      read: false,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50 notifications
  };

  // Mark notification as read
  const markNotificationRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllNotificationsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Get notification type styling
  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'success': return 'notification-success';
      case 'warning': return 'notification-warning';
      case 'error': return 'notification-error';
      default: return 'notification-info';
    }
  };

  // Fetch businesses from backend
  const fetchBusinesses = async (showRefreshNotification = false) => {
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

        // Check for new businesses (notifications)
        if (lastBusinessCount > 0 && businessData.length > lastBusinessCount) {
          const newBusinessCount = businessData.length - lastBusinessCount;
          const newBusinesses = businessData.slice(0, newBusinessCount);
          
          // Add notifications for new businesses
          newBusinesses.forEach(business => {
            addNotification(
              `New business submission: "${business.name}" by ${business.owner}`,
              'info'
            );
          });
          
          // Add summary notification if multiple new businesses
          if (newBusinessCount > 1) {
            addNotification(
              `${newBusinessCount} new business submissions received`,
              'info'
            );
          }
        }
        
        // Update business count for future notifications
        setLastBusinessCount(businessData.length);

        // Client-side filtering as fallback (only if backend doesn't handle the filters properly)
        if (filterStatus !== 'all') {
          businessData = businessData.filter(business => business.status === filterStatus);
        }
        
        if (filterCategory !== 'all') {
          businessData = businessData.filter(business => business.category === filterCategory);
        }

        setBusinesses(businessData);
        
        // Extract unique categories for filter dropdown
        if (businessData.length > 0) {
          const categories = [...new Set(businessData.map(b => b.category).filter(Boolean))];
          setBusinessCategories(categories);
        } else {
          setBusinessCategories([]);
        }
        
        // Select first business by default if no business is selected and we have data
        if (businessData.length > 0) {
          if (!selectedBusiness || !businessData.find(b => b._id === selectedBusiness._id)) {
            setSelectedBusiness(businessData[0]);
          }
        } else {
          setSelectedBusiness(null);
        }
        
        // Clear any previous errors on successful fetch
        setError(null);
        
        // Show refresh notification if manually refreshed
        if (showRefreshNotification) {
          addNotification('Business data refreshed successfully', 'success');
        }
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

  // Auto-refresh businesses every 30 seconds to check for new submissions
  useEffect(() => {
    if (!isLoggedIn || !accessToken || !isAdmin) return;

    const intervalId = setInterval(() => {
      fetchBusinesses(false); // Silent refresh without notification
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isLoggedIn, accessToken, isAdmin, page, filterStatus, filterCategory]);

  // Initialize notifications with some sample data
  useEffect(() => {
    if (isAdmin && notifications.length === 0) {
      setNotifications([
        {
          id: 1,
          message: "Welcome to Business Management Dashboard",
          type: "info",
          time: new Date().toLocaleString(),
          read: false,
          timestamp: Date.now()
        }
      ]);
    }
  }, [isAdmin]);

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
    if (isMobile) {
      setShowBusinessDetail(true);
    }
  
    // If the business was pending, mark it as in-review
    if (business.status === 'pending') {
      handleUpdateBusinessStatus(business._id, 'in-review');
    }
  };

  // Handler for going back to business list on mobile
  const handleBackToList = () => {
    setShowBusinessDetail(false);
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
        
        // Add notification for status update
        const business = businesses.find(b => b._id === id);
        if (business) {
          addNotification(
            `Business "${business.name}" status updated to ${newStatus}`,
            newStatus === 'approved' ? 'success' : newStatus === 'rejected' ? 'warning' : 'info'
          );
        }
        
      } else {
        addNotification('Failed to update business status: ' + response.data.message, 'error');
      }
    } catch (err) {
      console.error('Error updating business status:', err);
      
      if (err.response && err.response.status === 403) {
        addNotification('Access denied. You do not have permission to update business status.', 'error');
      } else {
        addNotification('Error updating business status: ' + (err.response?.data?.message || err.message), 'error');
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
        const businessName = businesses.find(b => b._id === id)?.name || 'Unknown';
        
        // Remove business from the list
        const updatedBusinesses = businesses.filter(item => item._id !== id);
        setBusinesses(updatedBusinesses);
        
        // If the deleted business was selected, select the first one from the updated list
        if (selectedBusiness && selectedBusiness._id === id) {
          setSelectedBusiness(updatedBusinesses.length > 0 ? updatedBusinesses[0] : null);
          if (isMobile && updatedBusinesses.length === 0) {
            setShowBusinessDetail(false);
          }
        }
        
        // Add notification for deletion
        addNotification(`Business "${businessName}" deleted successfully`, 'success');
        
      } else {
        addNotification('Failed to delete business: ' + response.data.message, 'error');
      }
    } catch (err) {
      console.error('Error deleting business:', err);
      
      if (err.response && err.response.status === 403) {
        addNotification('Access denied. You do not have permission to delete businesses.', 'error');
      } else {
        addNotification('Error deleting business: ' + (err.response?.data?.message || err.message), 'error');
      }
    }
  };

  // Handler for submitting admin notes
  const handleSubmitNotes = (e) => {
    e.preventDefault();
    if (!adminNotes.trim() || !selectedBusiness) return;
    
    // Here you could save the notes to the backend if needed
    console.log(`Admin notes for business #${selectedBusiness._id}:`, adminNotes);
    
    // Add notification for notes saved
    addNotification(`Notes saved for business "${selectedBusiness.name}"`, 'success');
    setAdminNotes('');
  };

  // Manual refresh handler
  const handleRefresh = () => {
    fetchBusinesses(true); // Show refresh notification
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

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

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
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                title="Refresh data"
                disabled={loading}
              >
                <FaSync className={loading ? 'spinning' : ''} />
              </button>
              <div className="notification-wrapper" ref={notificationRef}>
                <div 
                  className="icon-wrapper notification-icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell className="action-icon" />
                  {unreadCount > 0 && (
                    <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </div>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="dropdown-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllNotificationsRead}
                          className="mark-all-read"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`notification-item ${notification.read ? 'read' : 'unread'} ${getNotificationTypeClass(notification.type)}`}
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <div className="notification-content">
                              <p className="notification-message">{notification.message}</p>
                              <span className="notification-time">{notification.time}</span>
                            </div>
                            <div className="notification-type-indicator"></div>
                          </div>
                        ))
                      ) : (
                        <div className="no-notifications">
                          <p>No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
          
          <div className={`business-container no-scroll-container ${isMobile && showBusinessDetail ? 'mobile-detail-active' : ''}`}>
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
                {isMobile && (
                  <button 
                    className="back-button mobile-back-btn"
                    onClick={handleBackToList}
                  >
                    <FaArrowLeft /> Back to List
                  </button>
                )}
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
    </div>
  );
};

export default BusinessManagement;
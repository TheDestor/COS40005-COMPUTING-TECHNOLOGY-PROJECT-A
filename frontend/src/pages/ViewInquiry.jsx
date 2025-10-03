import React, { useState, useEffect, useRef } from 'react';
import {
  FaSearch,
  FaBell,
  FaFilter,
  FaPrint,
  FaTrash,
  FaCheck,
  FaReply,
  FaExclamationTriangle,
  FaStar,
  FaClock,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaSync
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/ViewInquiry.css';
import ky from 'ky';
import { toast } from 'sonner';

// Import profile images
import profile1 from '../assets/profile1.png';
import profile2 from '../assets/profile2.png';
import profile3 from '../assets/profile3.png';
import profile4 from '../assets/profile4.png';
import profile5 from '../assets/profile5.png';
import profile6 from '../assets/profile6.png';
import profile7 from '../assets/profile7.png';
import profile8 from '../assets/profile8.png';
import { useAuth } from '../context/AuthProvider';

const ViewInquiry = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { accessToken } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [showInquiryDetail, setShowInquiryDetail] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastInquiryCount, setLastInquiryCount] = useState(0);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const printOptionsRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
      if (window.innerWidth > 600 && showInquiryDetail) {
        setShowInquiryDetail(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showInquiryDetail]);

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

  // Add notification when new inquiry is detected
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleString(),
      read: false,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
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

  // This will consistently assign avatar based on email
  const getAvatarForEmail = (email) => {
    const avatars = [profile1, profile2, profile3, profile4, profile5, profile6, profile7, profile8];
    
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const avatarIndex = Math.abs(hash) % avatars.length;
    return avatars[avatarIndex];
  };

  // Function to assign priority based on category
  const getPriorityByCategory = (category) => {
    const priorityMap = {
      'billing': 'high',      
      'login': 'high',        
      'booking': 'medium',    
      'signup': 'low',        
      'general': 'medium',    
      'support': 'medium',    
    };
    
    return priorityMap[category?.toLowerCase()] || 'medium';
  };

  const fetchInquiries = async (showRefreshNotification = false) => {
    try {
      const response = await ky.get(
        "/api/inquiry/getAllInquiries",
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      ).json();

      if (response && response.success) {
        const fetchedInquiries = response.inquiries;

        const mappedInquiries = fetchedInquiries.map((inquiry) => ({
          id: inquiry._id,
          name: inquiry.name || inquiry.email.split('@')[0],
          email: inquiry.email,
          subject: inquiry.topic,
          message: inquiry.message,
          date: inquiry.createdAt,
          status: inquiry.status || "Unread",
          priority: getPriorityByCategory(inquiry.category),
          avatar: getAvatarForEmail(inquiry.email),
          category: inquiry.category
        }));

        mappedInquiries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Check for new inquiries (notifications)
        if (lastInquiryCount > 0 && mappedInquiries.length > lastInquiryCount) {
          const newInquiryCount = mappedInquiries.length - lastInquiryCount;
          const newInquiries = mappedInquiries.slice(0, newInquiryCount);
          
          // Add notifications for new inquiries
          newInquiries.forEach(inquiry => {
            addNotification(
              `New inquiry from "${inquiry.name}": ${inquiry.subject}`,
              'info'
            );
          });
          
          // Add summary notification if multiple new inquiries
          if (newInquiryCount > 1) {
            addNotification(
              `${newInquiryCount} new inquiries received`,
              'info'
            );
          }
        }
        
        // Update inquiry count for future notifications
        setLastInquiryCount(mappedInquiries.length);

        if (mappedInquiries.length > 0) {
          const firstInquiry = mappedInquiries[0];
          if (firstInquiry.status === "Unread") {
            firstInquiry.status = "in-progress";
            const updatedMappedInquiries = mappedInquiries.map(item => item.id === firstInquiry.id ? firstInquiry : item);
            setInquiries(updatedMappedInquiries);
            setSelectedInquiry(firstInquiry);
          } else {
            setInquiries(mappedInquiries);
            setSelectedInquiry(firstInquiry);
          }
          if (isMobile) {
            setShowInquiryDetail(false);
          }
        } else {
          setInquiries([]);
          setSelectedInquiry(null);
        }

        // Show refresh notification if manually refreshed
        if (showRefreshNotification) {
          addNotification('Inquiry data refreshed successfully', 'success');
        }
      } else {
        setInquiries([]);
      }
    } catch (error) {
      console.error(error);
      addNotification('Failed to load inquiries', 'error');
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [accessToken, isMobile]);

  // Auto-refresh inquiries every 30 seconds to check for new submissions
  useEffect(() => {
    if (!accessToken) return;

    const intervalId = setInterval(() => {
      fetchInquiries(false); // Silent refresh without notification
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [accessToken]);

  // Initialize notifications with welcome message
  useEffect(() => {
    if (notifications.length === 0) {
      setNotifications([
        {
          id: 1,
          message: "Welcome to Inquiries Management Dashboard",
          type: "info",
          time: new Date().toLocaleString(),
          read: false,
          timestamp: Date.now()
        }
      ]);
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchInquiries(true);
  };

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

  const handleSelectInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    if (isMobile) {
      setShowInquiryDetail(true);
    }

    if (inquiry.status === 'Unread') {
      const updatedInquiries = inquiries.map(item => {
        if (item.id === inquiry.id) {
          return { ...item, status: 'in-progress' };
        }
        return item;
      });

      setInquiries(updatedInquiries);
      setSelectedInquiry({ ...inquiry, status: 'in-progress' });
    }
  };

  const handleBackToList = () => {
    setShowInquiryDetail(false);
    setSelectedInquiry(null);
  };

  const handleMarkResolved = async (id) => {
    try {
      const payload = {
        inquiryId: id,
        action: "Resolve"
      }
      const response = await ky.post(
        "/api/inquiry/updateInquiry",
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          json: payload
        }
      ).json();

      if (response.success) {
        toast.success("Inquiry marked as resolved");
        const inquiry = inquiries.find(i => i.id === id);
        if (inquiry) {
          addNotification(`Inquiry from "${inquiry.name}" marked as resolved`, 'success');
        }
      } else {
        toast.error("An error occured while trying to mark inquiry as resolved");
      }
    } catch (error) {
      toast.error("Error updating inquiry status:", error);
    }
    const updatedInquiries = inquiries.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Resolved' };
      }
      return item;
    });

    setInquiries(updatedInquiries);

    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry({ ...selectedInquiry, status: 'Resolved' });
    }
  };

  const handleDeleteInquiry = async (id) => {
    const inquiry = inquiries.find(i => i.id === id);
    const updatedInquiries = inquiries.filter(item => item.id !== id);
    setInquiries(updatedInquiries);

    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry(updatedInquiries.length > 0 ? updatedInquiries[0] : null);
      if (isMobile && updatedInquiries.length === 0) {
        setShowInquiryDetail(false);
      }
    }

    try {
      const payload = {
        inquiryId: id
      }
      const response = await ky.post("/api/inquiry/deleteInquiry", {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        json: payload
      }).json();

      if (response.success) {
        toast.success("Inquiry deleted");
        if (inquiry) {
          addNotification(`Inquiry from "${inquiry.name}" deleted successfully`, 'success');
        }
      } else {
        toast.error("An error occured while trying to delete inquiry");
      }
    } catch (error) {
      toast.error(error);
    }
  };

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    console.log(`Reply to inquiry #${selectedInquiry.id}:`, replyText);

    handleMarkResolved(selectedInquiry.id);

    setReplyText('');

    alert("Reply sent successfully!");
  };

  // Print functionality
  const handlePrintInquiry = () => {
    if (!selectedInquiry) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inquiry Details</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .inquiry-info { margin-bottom: 20px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            .message-section { margin-top: 30px; }
            .message-content { 
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
            .status-unread { background: #fef3c7; color: #92400e; }
            .status-progress { background: #dbeafe; color: #1e40af; }
            .status-resolved { background: #d1fae5; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Customer Inquiry Details</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="inquiry-info">
            <p><span class="label">Inquiry ID:</span><span class="value">${selectedInquiry.id}</span></p>
            <p><span class="label">Customer Name:</span><span class="value">${selectedInquiry.name}</span></p>
            <p><span class="label">Email:</span><span class="value">${selectedInquiry.email}</span></p>
            <p><span class="label">Subject:</span><span class="value">${selectedInquiry.subject}</span></p>
            <p><span class="label">Date Submitted:</span><span class="value">${formatDate(selectedInquiry.date)}</span></p>
            <p><span class="label">Status:</span><span class="value">
              <span class="status-badge status-${selectedInquiry.status.toLowerCase().replace('-', '')}">
                ${selectedInquiry.status === 'in-progress' ? 'In Progress' : selectedInquiry.status}
              </span>
            </span></p>
            <p><span class="label">Priority:</span><span class="value">${selectedInquiry.priority.charAt(0).toUpperCase() + selectedInquiry.priority.slice(1)}</span></p>
          </div>
          
          <div class="message-section">
            <h3>Customer Message:</h3>
            <div class="message-content">
              ${selectedInquiry.message}
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

  const handleSaveInquiry = () => {
    if (!selectedInquiry) return;

    const inquiryData = {
      id: selectedInquiry.id,
      name: selectedInquiry.name,
      email: selectedInquiry.email,
      subject: selectedInquiry.subject,
      message: selectedInquiry.message,
      date: selectedInquiry.date,
      status: selectedInquiry.status,
      priority: selectedInquiry.priority
    };

    const dataStr = JSON.stringify(inquiryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `inquiry_${selectedInquiry.id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowPrintOptions(false);
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch =
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || inquiry.status.toLowerCase() === filterStatus;
    const matchesPriority = filterPriority === 'all' || inquiry.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInquiries = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPriority]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Unread':
        return 'status-badge-unread';
      case 'in-progress':
        return 'status-badge-progress';
      case 'Resolved':
        return 'status-badge-resolved';
      default:
        return '';
    }
  };

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

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header compact-header">
          <div className="greeting">
            <h3>Inquiries Management</h3>
            <p>View and respond to customer inquiries</p>
          </div>
          <div className="dashboard-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="action-icons">
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                title="Refresh data"
              >
                <FaSync />
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

        <div className="inquiry-content no-scroll-layout">
          <div className="inquiry-options compact-options">
            <div className="inquiry-statistics">
              <div className="stat">
                <span className="stat-value">{filteredInquiries.filter(i => i.status === 'Unread').length}</span>
                <span className="stat-label">Unread</span>
              </div>
              <div className="stat">
                <span className="stat-value">{filteredInquiries.filter(i => i.status === 'in-progress').length}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat">
                <span className="stat-value">{filteredInquiries.filter(i => i.status === 'Resolved').length}</span>
                <span className="stat-label">Resolved</span>
              </div>
              <div className="stat">
                <span className="stat-value">{filteredInquiries.length}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>

            <div className="inquiry-filters">
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
                        <option value="unread">Unread</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>Priority:</label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <button
                      className="clear-filters"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterPriority('all');
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`inquiry-container no-scroll-container ${isMobile && showInquiryDetail ? 'mobile-detail-active' : ''}`}>
            <div className="inquiry-list compact-list">
              {currentInquiries.length > 0 ? (
                <>
                  {currentInquiries.map(inquiry => (
                    <div
                      key={inquiry.id}
                      className={`inquiry-item compact-item ${selectedInquiry && selectedInquiry.id === inquiry.id ? 'selected' : ''} ${inquiry.status === 'Unread' ? 'unread' : ''}`}
                      onClick={() => handleSelectInquiry(inquiry)}
                    >
                      <div className="inquiry-avatar compact-avatar">
                        <img src={inquiry.avatar} alt={`${inquiry.name}'s avatar`} />
                      </div>
                      <div className="inquiry-brief">
                        <div className="inquiry-header">
                          <h4 className="inquiry-name">{inquiry.name}</h4>
                          <span className="inquiry-date compact-date">{formatDate(inquiry.date)}</span>
                        </div>
                        <div className="inquiry-subject compact-subject">{inquiry.subject}</div>
                        <div className="inquiry-message-preview compact-preview">
                          {inquiry.message.substring(0, 40)}...
                        </div>
                        <div className="inquiry-status">
                          <span className={`status-badge ${getStatusBadgeClass(inquiry.status)}`}>
                            {inquiry.status === 'in-progress' ? 'In Progress' : inquiry.status}
                          </span>
                          <span className={`priority-badge ${getPriorityBadgeClass(inquiry.priority)}`}>
                            {renderPriorityIcon(inquiry.priority)}
                            {inquiry.priority.charAt(0).toUpperCase() + inquiry.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredInquiries.length)} of {filteredInquiries.length} inquiries
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
                          {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
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
                          disabled={currentPage === totalPages}
                        >
                          Next <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-inquiries">
                  <p>No inquiries match your criteria</p>
                </div>
              )}
            </div>

            {selectedInquiry ? (
              <div className="inquiry-detail compact-detail">
                <div className="inquiry-detail-header compact-detail-header">
                  <div className="header-top-row">
                    {isMobile && (
                      <button className="back-button" onClick={handleBackToList}>
                        <FaArrowLeft /> Back
                      </button>
                    )}
                    <div className="inquiry-actions compact-actions">
                      <button
                        className={`inquiry-action-btn resolve-btn ${selectedInquiry.status === 'Resolved' ? 'disabled' : ''}`}
                        onClick={() => handleMarkResolved(selectedInquiry.id)}
                        disabled={selectedInquiry.status === 'Resolved'}
                      >
                        <FaCheck /> {selectedInquiry.status === 'Resolved' ? 'Resolved' : 'Mark Resolved'}
                      </button>
                      <button
                        className="inquiry-action-btn delete-btn"
                        onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                      <div
                        className="print-actions"
                        ref={printOptionsRef}
                      >
                        <button
                          className="inquiry-action-btn print-btn"
                          onClick={() => setShowPrintOptions(!showPrintOptions)}
                        >
                          <FaPrint />
                        </button>
                        <div className={`print-dropdown ${showPrintOptions ? 'active' : ''}`}>
                          <button onClick={handlePrintInquiry}>Print Inquiry</button>
                          <button onClick={handleSaveInquiry}>Save as File</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="inquiry-user-info compact-user-info">
                    <img src={selectedInquiry.avatar} alt={`${selectedInquiry.name}'s avatar`} className="detail-avatar" />
                    <div>
                      <h3 className="detail-name">{selectedInquiry.name}</h3>
                      <p className="detail-email">{selectedInquiry.email}</p>
                    </div>
                  </div>
                </div>

                <div className="inquiry-detail-content compact-detail-content">
                  <div className="inquiry-meta compact-meta">
                    <div className="meta-row">
                      <div className="meta-item">
                        <span className="meta-label">Date:</span>
                        <span className="meta-value">{formatDate(selectedInquiry.date)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Subject:</span>
                        <span className="meta-value">{selectedInquiry.subject}</span>
                      </div>
                    </div>
                    <div className="meta-row">
                      <div className="meta-item">
                        <span className="meta-label">Status:</span>
                        <span className={`meta-value status-badge ${getStatusBadgeClass(selectedInquiry.status)}`}>
                          {selectedInquiry.status === 'in-progress' ? 'In Progress' : selectedInquiry.status}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Priority:</span>
                        <span className={`meta-value priority-badge ${getPriorityBadgeClass(selectedInquiry.priority)}`}>
                          {renderPriorityIcon(selectedInquiry.priority)}
                          {selectedInquiry.priority.charAt(0).toUpperCase() + selectedInquiry.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="inquiry-message compact-message">
                    <h4>Message:</h4>
                    <div className="message-body compact-message-body">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  <div className="inquiry-reply compact-reply">
                    <h4>Reply:</h4>
                    <form onSubmit={handleSubmitReply}>
                      <textarea
                        className="compact-textarea"
                        placeholder="Type your reply here..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={selectedInquiry.status === 'Resolved'}
                      ></textarea>
                      <div className="reply-actions">
                        <button
                          type="submit"
                          className="send-reply-btn"
                          disabled={selectedInquiry.status === 'Resolved' || !replyText.trim()}
                        >
                          <FaReply /> Send Reply
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              !isMobile && (
                <div className="no-inquiry-selected">
                  <p>Select an inquiry to view details</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Notification Styles */
        .notification-wrapper {
          position: relative;
        }

        .notification-icon {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-icon:hover .action-icon {
          color: #3b82f6;
          transform: scale(1.1);
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 380px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1000;
          max-height: 500px;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px 12px 0 0;
        }

        .dropdown-header h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .mark-all-read:hover {
          color: #2563eb;
          background: #eff6ff;
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 14px 20px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background: #f9fafb;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
          border-left: 4px solid #3b82f6;
        }

        .notification-item.unread:hover {
          background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          margin: 0 0 6px 0;
          font-size: 0.9rem;
          line-height: 1.4;
          color: #374151;
          font-weight: 500;
        }

        .notification-time {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 400;
        }

        .notification-type-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: 12px;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .notification-info .notification-type-indicator {
          background: #3b82f6;
        }

        .notification-success .notification-type-indicator {
          background: #10b981;
        }

        .notification-warning .notification-type-indicator {
          background: #f59e0b;
        }

        .notification-error .notification-type-indicator {
          background: #ef4444;
        }

        .notification-item.read .notification-type-indicator {
          background: #d1d5db;
        }

        .no-notifications {
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
        }

        .no-notifications p {
          margin: 0;
          font-size: 0.9rem;
        }

        /* Refresh Button Styles */
        .refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #059669;
          font-size: 0.9rem;
          margin-right: 8px;
        }

        .refresh-btn:hover {
          background: #f0fdf4;
          border-color: #059669;
          transform: translateY(-1px);
        }

        /* Enhanced badge styles */
        .badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-radius: 12px;
          padding: 2px 6px;
          font-size: 0.7rem;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          }
          50% {
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
          }
          100% {
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          }
        }

        .icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .action-icon {
          font-size: 1.2rem;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        /* Compact Layout Styles for No-Scroll Design */
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

        .inquiry-statistics {
          gap: 15px;
        }

        .stat {
          padding: 8px 12px;
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
          padding: 10px;
          border-bottom: 1px solid #f3f4f6;
        }

        .compact-avatar img {
          width: 35px;
          height: 35px;
        }

        .inquiry-brief {
          flex: 1;
          min-width: 0;
        }

        .inquiry-name {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .compact-date {
          font-size: 0.75rem;
        }

        .compact-subject {
          font-size: 0.85rem;
          margin: 2px 0;
        }

        .compact-preview {
          font-size: 0.8rem;
          line-height: 1.3;
          margin: 3px 0;
        }

        .inquiry-status {
          gap: 6px;
          margin-top: 4px;
        }

        .status-badge, .priority-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
        }

        .compact-detail {
          width: 60%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .compact-detail-header {
          padding: 12px 15px;
          flex-shrink: 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .compact-actions {
          gap: 8px;
        }

        .inquiry-action-btn {
          padding: 6px 12px;
          font-size: 0.8rem;
        }

        .compact-user-info {
          margin-top: 8px;
        }

        .compact-user-info .detail-avatar {
          width: 35px;
          height: 35px;
        }

        .detail-name {
          font-size: 1.1rem;
          margin-bottom: 2px;
        }

        .detail-email {
          font-size: 0.85rem;
          margin: 0;
        }

        .compact-detail-content {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .compact-meta {
          background: #f9fafb;
          border-radius: 6px;
          padding: 10px;
        }

        .meta-row {
          display: flex;
          gap: 20px;
          margin-bottom: 6px;
        }

        .meta-row:last-child {
          margin-bottom: 0;
        }

        .meta-item {
          flex: 1;
          min-width: 0;
        }

        .meta-label {
          font-size: 0.8rem;
          color: #6b7280;
          display: block;
          margin-bottom: 2px;
        }

        .meta-value {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .compact-message h4 {
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .compact-message-body {
          background: #f9fafb;
          border-radius: 6px;
          padding: 10px;
          font-size: 0.9rem;
          line-height: 1.4;
          max-height: 120px;
          overflow-y: auto;
        }

        .compact-reply {
          margin-top: auto;
        }

        .compact-reply h4 {
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .compact-textarea {
          width: 100%;
          height: 80px;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          resize: none;
          font-size: 0.9rem;
          font-family: inherit;
        }

        .send-reply-btn {
          padding: 8px 16px;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        /* Pagination Styles */
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

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .compact-list {
            width: 100%;
          }
          
          .compact-detail {
            width: 100%;
          }
          
          .no-scroll-container.mobile-detail-active .compact-list {
            display: none;
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

          .notification-dropdown {
            width: 320px;
            left: -280px;
          }

          .action-icons {
            flex-direction: row;
            gap: 4px;
          }
        }

        /* Scrollbar styling for better appearance */
        .compact-list::-webkit-scrollbar,
        .compact-detail-content::-webkit-scrollbar,
        .compact-message-body::-webkit-scrollbar,
        .notification-list::-webkit-scrollbar {
          width: 4px;
        }

        .compact-list::-webkit-scrollbar-track,
        .compact-detail-content::-webkit-scrollbar-track,
        .compact-message-body::-webkit-scrollbar-track,
        .notification-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .compact-list::-webkit-scrollbar-thumb,
        .compact-detail-content::-webkit-scrollbar-thumb,
        .compact-message-body::-webkit-scrollbar-thumb,
        .notification-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }

        .compact-list::-webkit-scrollbar-thumb:hover,
        .compact-detail-content::-webkit-scrollbar-thumb:hover,
        .compact-message-body::-webkit-scrollbar-thumb:hover,
        .notification-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Enhanced notification animations */
        .notification-item.unread {
          position: relative;
          overflow: hidden;
        }

        .notification-item.unread::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        /* Better focus states for accessibility */
        .notification-item:focus,
        .refresh-btn:focus,
        .mark-all-read:focus,
        .pagination-btn:focus,
        .page-number:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Enhanced hover effects */
        .notification-item:hover .notification-message {
          color: #1f2937;
        }

        .inquiry-item.unread {
          animation: subtle-glow 2s ease-in-out infinite alternate;
        }

        @keyframes subtle-glow {
          from {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.1);
          }
          to {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default ViewInquiry;
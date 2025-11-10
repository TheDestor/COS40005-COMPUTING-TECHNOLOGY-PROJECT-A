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
  // Confirmation modal state
  const [confirmState, setConfirmState] = useState({ open: false, type: null, targetId: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const cancelBtnRef = useRef(null);

  const openConfirm = (type, targetId) => {
    setConfirmState({ open: true, type, targetId });
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmState({ open: false, type: null, targetId: null });
  };

  // Focus the cancel button and attach ESC handler when modal opens
  useEffect(() => {
    if (confirmState.open) {
      cancelBtnRef.current?.focus();
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          closeConfirm();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [confirmState.open]);

  // Dedicated reply action (no event)
  const performSendReply = async () => {
    if (!selectedInquiry) return;
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty.');
      return;
    }
    try {
      await handleMarkResolved(selectedInquiry.id);
      setReplyText('');
      toast.success('Reply sent successfully!');
    } catch (error) {
      toast.error('Failed to send reply. Please try again.');
    }
  };

  const confirmTitle = confirmState.type === 'resolve'
    ? 'Confirm Resolve'
    : confirmState.type === 'delete'
    ? 'Confirm Delete'
    : confirmState.type === 'reply'
    ? 'Confirm Send Reply'
    : 'Confirm';

  const confirmMessage = confirmState.type === 'resolve'
    ? 'Are you sure you want to mark this as resolved?'
    : confirmState.type === 'delete'
    ? 'Are you sure you want to delete this item?'
    : confirmState.type === 'reply'
    ? 'Are you sure you want to send this reply?'
    : '';

  const handleConfirmAction = async () => {
    if (!confirmState.type) return;
    setConfirmLoading(true);
    try {
      if (confirmState.type === 'resolve' && confirmState.targetId) {
        await handleMarkResolved(confirmState.targetId);
      } else if (confirmState.type === 'delete' && confirmState.targetId) {
        await handleDeleteInquiry(confirmState.targetId);
      } else if (confirmState.type === 'reply') {
        await performSendReply();
      }
      closeConfirm();
    } catch (err) {
      toast.error(err?.message || 'Action failed. Please try again.');
    } finally {
      setConfirmLoading(false);
    }
  };
  const { accessToken } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [showInquiryDetail, setShowInquiryDetail] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    console.log("=== Mark Resolved Debug ===");
    console.log("Inquiry ID:", id);
    console.log("Access Token exists:", !!accessToken);
    
    try {
      const payload = {
        inquiryId: id,
        action: "Resolve"
      };
      
      console.log("Payload:", payload);
      
      const response = await ky.post(
        "/api/inquiry/updateInquiry",
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          json: payload
        }
      ).json();
  
      console.log("API Response:", response);
  
      if (response.success) {
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
  
        const inquiry = inquiries.find(i => i.id === id);
        if (inquiry) {
          addNotification(`Inquiry from "${inquiry.name}" marked as resolved`, 'success');
        }
        
        toast.success("Inquiry marked as resolved");
      } else {
        console.log("Response not successful:", response);
        toast.error(response.message || "An error occurred while trying to mark inquiry as resolved");
      }
    } catch (error) {
      console.error("=== Error Details ===");
      console.error("Error object:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      // Try to get the response body if available
      if (error.response) {
        try {
          const errorBody = await error.response.json();
          console.error("Error response body:", errorBody);
          toast.error(errorBody.message || "Failed to update inquiry status");
        } catch (e) {
          console.error("Could not parse error response");
          toast.error("Failed to update inquiry status. Please try again.");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
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
    if (!selectedInquiry) return;
    openConfirm('reply', selectedInquiry.id);
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
            .message { margin-top: 30px; }
            .message-content { 
              background: #f5f5f5; 
              padding: 20px; 
              border-radius: 5px; 
              margin-top: 10px;
              line-height: 1.6;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inquiry Details</h1>
          </div>
          <div class="inquiry-info">
            <p><span class="label">From:</span><span class="value">${selectedInquiry.name}</span></p>
            <p><span class="label">Email:</span><span class="value">${selectedInquiry.email}</span></p>
            <p><span class="label">Subject:</span><span class="value">${selectedInquiry.subject}</span></p>
            <p><span class="label">Date:</span><span class="value">${formatDate(selectedInquiry.date)}</span></p>
            <p><span class="label">Status:</span><span class="value">${selectedInquiry.status}</span></p>
            <p><span class="label">Priority:</span><span class="value">${selectedInquiry.priority}</span></p>
          </div>
          <div class="message">
            <h3>Message:</h3>
            <div class="message-content">${selectedInquiry.message}</div>
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

  const handlePrintAll = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Inquiries Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .inquiry { 
              border: 1px solid #ddd; 
              padding: 15px; 
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .inquiry-header { 
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .label { font-weight: bold; color: #555; }
            .message { 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 10px;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>All Inquiries Report</h1>
            <p>Total Inquiries: ${filteredInquiries.length}</p>
          </div>
          ${filteredInquiries.map(inquiry => `
            <div class="inquiry">
              <div class="inquiry-header">
                <div>
                  <p><span class="label">From:</span> ${inquiry.name}</p>
                  <p><span class="label">Email:</span> ${inquiry.email}</p>
                  <p><span class="label">Subject:</span> ${inquiry.subject}</p>
                </div>
                <div>
                  <p><span class="label">Date:</span> ${formatDate(inquiry.date)}</p>
                  <p><span class="label">Status:</span> ${inquiry.status}</p>
                  <p><span class="label">Priority:</span> ${inquiry.priority}</p>
                </div>
              </div>
              <div class="message">
                ${inquiry.message}
              </div>
            </div>
          `).join('')}
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
      priority: selectedInquiry.priority,
      category: selectedInquiry.category
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

  // Filter and search inquiries
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || 
      inquiry.status.toLowerCase() === filterStatus;

    const matchesPriority = 
      filterPriority === 'all' || 
      inquiry.priority.toLowerCase() === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInquiries = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const getPriorityIcon = (priority) => {
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
            <div className="action-icons-vi">
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
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterPriority('all');
                        setShowFilterMenu(false);
                      }}
                      className="clear-filters"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`inquiry-container ${isMobile && showInquiryDetail ? 'mobile-detail-active' : ''}`}>
            <div className="inquiry-list compact-list">
              {currentInquiries.length > 0 ? (
                <>
                  {currentInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className={`inquiry-item ${selectedInquiry?.id === inquiry.id ? 'selected' : ''} ${inquiry.status === 'Unread' ? 'unread' : ''}`}
                      onClick={() => handleSelectInquiry(inquiry)}
                    >
                      <div className="inquiry-avatar">
                        <img src={inquiry.avatar} alt={inquiry.name} />
                      </div>
                      <div className="inquiry-brief">
                        <div className="inquiry-header">
                          <h4 className="inquiry-name">{inquiry.name}</h4>
                          <span className="inquiry-date">{formatDate(inquiry.date)}</span>
                        </div>
                        <div className="inquiry-subject">{inquiry.subject}</div>
                        <p className="inquiry-message-preview">{inquiry.message}</p>
                        <div className="inquiry-status">
                          <span className={`status-badge-vi status-badge-vi-${inquiry.status.toLowerCase().replace(' ', '')}`}>
                            {inquiry.status}
                          </span>
                          <span className={`priority-badge priority-badge-${inquiry.priority}`}>
                            {getPriorityIcon(inquiry.priority)}
                            {inquiry.priority.charAt(0).toUpperCase() + inquiry.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredInquiries.length)} of {filteredInquiries.length} inquiries
                      </div>
                      <div className="pagination-controls-vi">
                        <button
                          className="pagination-btn"
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <FaChevronLeft /> Prev
                        </button>
                        
                        <div className="page-numbers-vi">
                          {getPageNumbers().map((number, index) => (
                            <button
                              key={index}
                              className={`page-number ${currentPage === number ? 'active' : ''} ${number === '...' ? 'ellipsis' : ''}`}
                              onClick={() => number !== '...' && paginate(number)}
                              disabled={number === '...'}
                            >
                              {number}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          className="pagination-btn"
                          onClick={() => paginate(currentPage + 1)}
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
                  <p>No inquiries found</p>
                </div>
              )}
            </div>

            {selectedInquiry && (
              <div className="inquiry-detail compact-detail">
                <div className="inquiry-detail-header">
                  {isMobile && (
                    <div className="header-top-row">
                      <button 
                        className="back-button"
                        onClick={handleBackToList}
                      >
                        <FaArrowLeft /> Back
                      </button>
                      <div className="inquiry-actions">
                        <button 
                          className="inquiry-action-btn resolve-btn"
                          onClick={() => openConfirm('resolve', selectedInquiry.id)}
                          title="Mark as Resolved"
                        >
                          <FaCheck />
                        </button>
                        <div className="print-options-wrapper" ref={printOptionsRef}>
                          <button 
                            className="inquiry-action-btn print-btn more-actions"
                            onClick={() => setShowPrintOptions(!showPrintOptions)}
                            title="More actions"
                          >
                            <FaPrint />
                          </button>
                          <div className={`print-dropdown ${showPrintOptions ? 'active' : ''}`}>
                            <button onClick={handlePrintInquiry}>Print Inquiry</button>
                            <button onClick={handleSaveInquiry}>Save as File</button>
                          </div>
                        </div>
                        <button 
                          className="inquiry-action-btn delete-btn"
                          onClick={() => openConfirm('delete', selectedInquiry.id)}
                          title="Delete Inquiry"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="inquiry-user-info">
                    <img src={selectedInquiry.avatar} alt={selectedInquiry.name} className="detail-avatar" />
                    <div className="user-details">
                      <h3 className="detail-name">{selectedInquiry.name}</h3>
                      <p className="detail-email">{selectedInquiry.email}</p>
                    </div>
                  </div>

                  {!isMobile && (
                    <div className="inquiry-actions">
                      <button 
                        className="inquiry-action-btn resolve-btn"
                        onClick={() => openConfirm('resolve', selectedInquiry.id)}
                        title="Mark as Resolved"
                      >
                        <FaCheck /> Resolve
                      </button>
                      <div className="print-options-wrapper" ref={printOptionsRef}>
                        <button 
                          className="inquiry-action-btn print-btn"
                          onClick={() => setShowPrintOptions(!showPrintOptions)}
                          title="Print options"
                        >
                          <FaPrint /> Print
                        </button>
                        <div className={`print-dropdown ${showPrintOptions ? 'active' : ''}`}>
                          <button onClick={handlePrintInquiry}>Print Inquiry</button>
                          <button onClick={handleSaveInquiry}>Save as File</button>
                        </div>
                      </div>
                      <button 
                        className="inquiry-action-btn delete-btn"
                        onClick={() => openConfirm('delete', selectedInquiry.id)}
                        title="Delete Inquiry"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="inquiry-detail-content compact-detail-content">
                  <div className="inquiry-meta">
                    <div className="meta-item">
                      <span className="meta-label">Subject:</span>
                      <span className="meta-value">{selectedInquiry.subject}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Date:</span>
                      <span className="meta-value">{formatDate(selectedInquiry.date)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className={`status-badge-vi status-badge-vi-${selectedInquiry.status.toLowerCase().replace(' ', '')}`}>
                        {selectedInquiry.status}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Priority:</span>
                      <span className={`priority-badge priority-badge-${selectedInquiry.priority}`}>
                        {getPriorityIcon(selectedInquiry.priority)}
                        {selectedInquiry.priority.charAt(0).toUpperCase() + selectedInquiry.priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="inquiry-message compact-message">
                    <h4>Message</h4>
                    <div className="message-body compact-message-body">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  <div className="inquiry-reply">
                    <h4>Reply</h4>
                    <form onSubmit={handleSubmitReply}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply here..."
                        rows="6"
                      />
                      <button type="submit" className="reply-btn">
                        <FaReply /> Send Reply
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmState.open && (
        <div
          className="confirmation-overlay-vi"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
          onClick={closeConfirm}
        >
          <div
            className="confirmation-modal-vi"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirmation-modal-title" className="confirm-modal-title">
              {confirmTitle}
            </h3>
            <p className="confirm-modal-body">
              {confirmMessage}
            </p>
            <div className="confirm-modal-actions">
              <button
                ref={cancelBtnRef}
                className="modal-cancel-btn"
                onClick={closeConfirm}
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button
                className={
                  confirmState.type === 'delete'
                    ? 'modal-delete-btn'
                    : 'modal-confirm-btn'
                }
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                aria-busy={confirmLoading}
              >
                {confirmLoading ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded styles for mobile responsiveness */}
      <style>{`
        /* Mobile overflow prevention */
        * {
          box-sizing: border-box;
        }

        /* Confirmation modal styling */
        .confirmation-overlay-vi {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .confirmation-modal-vi {
          background: #fff;
          border-radius: 10px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.2);
          padding: 20px;
          outline: none;
        }
        .confirmation-title-vi {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }
        .confirmation-message-vi {
          margin: 0 0 18px 0;
          color: #444;
        }
        .confirmation-actions-vi {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .modal-cancel-btn-vi {
          background: #e5e7eb;
          border: none;
          color: #111827;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
        }
        .modal-confirm-btn-vi {
          background: #2563eb;
          border: none;
          color: #fff;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
        }
        .modal-delete-btn-vi {
          background: #dc2626;
          border: none;
          color: #fff;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
        }
        .modal-cancel-btn-vi:disabled,
        .modal-confirm-btn-vi:disabled,
        .modal-delete-btn-vi:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .dashboard-header {
          max-width: 100%;
          overflow-x: hidden;
        }

        .dashboard-actions {
          max-width: 100%;
          overflow: visible; /* Changed to allow dropdowns to show */
        }

        .search-bar {
          max-width: 100%;
          overflow-x: hidden;
        }

        /* Search bar and icon positioning for desktop */
        .search-bar {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 1rem;
          pointer-events: none;
          z-index: 1;
        }

        .search-bar input {
          padding-left: 40px;
        }

        .no-scroll-layout {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 180px);
          overflow: hidden;
        }

        .compact-header {
          min-height: 90px;
          padding: 15px 20px;
          overflow: visible; /* Changed to allow dropdowns to show */
        }

        .compact-options {
          flex-shrink: 0;
        }

        .inquiry-container {
          flex: 1;
          min-height: 0;
          overflow-y: hidden;
          overflow-x: visible; /* Allow dropdowns to show */
        }

        .compact-list, .compact-detail {
          height: 100%;
          overflow-y: auto;
          overflow-x: visible; /* Allow dropdowns to show outside */
        }

        .compact-detail-content {
          overflow-y: auto;
          flex: 1;
        }

        .compact-message-body {
          max-height: 200px;
          overflow-y: auto;
        }

        /* Pagination styling */
        .pagination-container {
          padding: 15px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .pagination-info {
          text-align: center;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .pagination-controls-vi {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          color: #374151;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #6c5dd3;
          color: #6c5dd3;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers-vi {
          display: flex;
          gap: 4px;
        }

        .page-number {
          padding: 8px 12px;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          color: #374151;
          min-width: 40px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .page-number:hover:not(:disabled):not(.active) {
          background-color: #f9fafb;
          border-color: #6c5dd3;
          color: #6c5dd3;
        }

        .page-number.active {
          background-color: #6c5dd3;
          color: white;
          border-color: #6c5dd3;
        }

        .page-number.ellipsis {
          border: none;
          cursor: default;
        }

        .page-number.ellipsis:hover {
          background-color: white;
          color: #374151;
        }

        /* Print dropdown styling */
        .print-options-wrapper {
          position: relative;
        }

        .print-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 8px;
          z-index: 9999; /* Increased to ensure it's above everything */
          min-width: 180px;
        }

        .print-dropdown button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #2c3345;
          text-align: left;
          transition: background-color 0.2s ease;
        }

        .print-dropdown button:hover {
          background-color: #f4f5f7;
        }

        /* Notification styling */
        .notification-wrapper {
          position: relative;
          z-index: 1000; /* Increased to ensure it's above other elements */
        }

        .icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .icon-wrapper:hover {
          background-color: #f4f5f7;
        }

        .action-icon {
          font-size: 1.2rem;
          color: #2c3345;
        }

        .badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px 5px;
        }

        .action-icons-vi {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: visible; /* Ensure dropdowns aren't clipped */
        }

        /* Ensure print dropdown isn't clipped */
        .inquiry-detail-header {
          overflow: visible !important;
        }

        .inquiry-actions {
          overflow: visible !important;
        }

        .print-options-wrapper {
          overflow: visible !important;
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 380px;
          max-height: 500px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 9999; /* Increased to ensure it's above everything */
          overflow: hidden;
        }

        .notification-dropdown::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 20px;
          width: 16px;
          height: 16px;
          background-color: white;
          transform: rotate(45deg);
          box-shadow: -2px -2px 5px rgba(0, 0, 0, 0.05);
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
          z-index: 2;
        }

        .dropdown-header h4 {
          margin: 0;
          font-size: 1.1rem;
          color: #2c3345;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: #6c5dd3;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .mark-all-read:hover {
          background-color: rgba(108, 93, 211, 0.1);
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
          position: relative;
          z-index: 2;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 20px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background-color 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background-color: #f9fafb;
        }

        .notification-item.unread {
          background-color: rgba(108, 93, 211, 0.05);
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          margin: 0 0 4px 0;
          font-size: 0.9rem;
          color: #2c3345;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .notification-type-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .notification-item.unread .notification-type-indicator {
          background-color: #6c5dd3;
        }

        .notification-info .notification-type-indicator {
          background-color: #3b82f6;
        }

        .notification-success .notification-type-indicator {
          background-color: #10b981;
        }

        .notification-warning .notification-type-indicator {
          background-color: #f59e0b;
        }

        .notification-error .notification-type-indicator {
          background-color: #ef4444;
        }

        .no-notifications {
          padding: 40px 20px;
          text-align: center;
          color: #9ca3af;
        }

        /* Refresh button styling */
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background-color: #f4f5f7;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          color: #2c3345;
          // transition: all 0.2s ease;
          margin-right: 10px;
        }

        .refresh-btn:hover {
          background-color: #e2e8f0;
        }

        .refresh-btn:active {
          transform: rotate(180deg);
        }

        /* Mobile responsive styles - FIXED VERSION */
        @media (max-width: 768px) {
          .dashboard-header {
            padding: 12px 15px !important;
            min-height: 100px !important;
          }

          .pagination-controls-vi {
            flex-direction: row;
            // flex-wrap: wrap;
            gap: 6px;
          }

          .page-numbers-vi {
            order: 0;
            // width: 100%;
            justify-content: center;
          }

          .pagination-info {
            font-size: 0.75rem;
          }

          .notification-dropdown {
            width: 320px;
            left: -280px;
          }

          .action-icons-vi {
            flex-direction: row;
            gap: 4px;
          }
        }

        @media (max-width: 600px) {
          .dashboard-header {
            flex-direction: column;
            gap: 12px;
            padding: 12px 15px !important;
            min-height: auto !important;
            overflow: hidden;
          }

          .greeting {
            width: 100%;
          }

          .greeting h3 {
            font-size: 1.2rem !important;
            margin-bottom: 2px !important;
          }

          .greeting p {
            font-size: 0.8rem !important;
          }

          .dashboard-actions {
            width: 100%;
            max-width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 6px;
            box-sizing: border-box;
          }

          .search-bar {
            flex: 1;
            min-width: 0;
            margin: 0;
            position: relative;
            max-width: calc(100% - 100px);
          }

          .search-bar input {
            width: 100%;
            font-size: 0.85rem;
            padding: 10px 10px 10px 36px;
            box-sizing: border-box;
          }

          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
            font-size: 0.9rem;
            pointer-events: none;
            z-index: 1;
          }

          .action-icons-vi {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            margin-left: auto;
          }

          .refresh-btn {
            padding: 10px;
            margin-right: 0;
            font-size: 0.9rem;
            min-width: 40px;
            width: 40px;
            height: 40px;
            justify-content: center;
            flex-shrink: 0;
          }

          .icon-wrapper {
            padding: 10px;
            width: 40px;
            height: 40px;
            flex-shrink: 0;
          }

          .notification-dropdown {
            position: fixed;
            top: 120px;
            right: 10px;
            left: 10px;
            width: auto;
            max-width: none;
            z-index: 9999;
          }

          .notification-dropdown::before {
            right: 30px;
          }

          // /* Filter dropdown mobile fix */
          // .filter-dropdown-container {
          //   position: relative;
          //   z-index: 100;
          // }

          // .filter-dropdown {
          //   position: fixed;
          //   top: 50%;
          //   left: 50%;
          //   transform: translate(-50%, -50%);
          //   width: 90%;
          //   max-width: 300px;
          //   z-index: 50;
          // }

          // .filter-dropdown::before {
          //   display: none;
          // }

          /* Print dropdown mobile fix */
          .print-dropdown {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 250px;
            z-index: 9999;
          }

          /* Filter group styling for mobile */
          .filter-group {
            margin-bottom: 12px;
          }

          .filter-group label {
            font-size: 0.85rem;
            margin-bottom: 6px;
          }

          .filter-group select {
            width: 100%;
            padding: 10px;
            font-size: 0.9rem;
          }

          .clear-filters {
            width: 100%;
            padding: 10px;
            font-size: 0.9rem;
          }

          .notification-list {
            max-height: 300px;
          }

          .dropdown-header h4 {
            font-size: 1rem;
          }

          .notification-item {
            padding: 10px 15px;
          }

          .notification-message {
            font-size: 0.85rem;
          }

          .notification-time {
            font-size: 0.75rem;
          }

          /* Ensure inquiry list can scroll properly */
          .compact-list {
            max-height: 100%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          /* Make sure pagination is visible and scrollable */
          .pagination-container {
            position: sticky;
            bottom: 0;
            background: white;
            z-index: 10;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          }
        }

        @media (max-width: 480px) {
          .dashboard-header {
            padding: 10px 12px !important;
            overflow: hidden;
          }

          .greeting h3 {
            font-size: 1.1rem !important;
          }

          .dashboard-actions {
            gap: 4px;
          }

          .search-bar {
            max-width: calc(100% - 90px);
          }

          .search-bar input {
            font-size: 0.8rem;
            padding: 8px 8px 8px 32px;
          }

          .search-icon {
            font-size: 0.85rem;
            left: 10px;
          }

          .refresh-btn {
            padding: 8px;
            font-size: 0.85rem;
            min-width: 36px;
            width: 36px;
            height: 36px;
          }

          .icon-wrapper {
            padding: 8px;
            width: 36px;
            height: 36px;
          }

          .action-icon {
            font-size: 1rem;
          }

          .badge {
            font-size: 0.65rem;
            min-width: 16px;
            height: 16px;
            padding: 1px 4px;
          }

          .notification-dropdown {
            width: calc(100vw - 20px);
            right: -10px;
          }

          .notification-dropdown {
            position: fixed;
            top: 100px;
            right: 10px;
            left: 10px;
            width: auto;
            max-width: none;
            z-index: 9999;
          }

          /* Filter dropdown mobile fix */
          .filter-dropdown-container {
            position: relative;
            z-index: 50;
          }

          .filter-dropdown {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 85%;
            max-width: 280px;
            z-index: 9999;
          }

          .filter-dropdown::before {
            display: none;
          }

          /* Print dropdown mobile fix */
          .print-dropdown {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 85%;
            max-width: 230px;
            z-index: 9999;
          }

          /* Filter group styling for mobile */
          .filter-group {
            margin-bottom: 10px;
          }

          .filter-group label {
            font-size: 0.8rem;
            margin-bottom: 5px;
          }

          .filter-group select {
            width: 100%;
            padding: 8px;
            font-size: 0.85rem;
          }

          .clear-filters {
            width: 100%;
            padding: 8px;
            font-size: 0.85rem;
          }

          .dropdown-header {
            padding: 12px 15px;
          }

          .dropdown-header h4 {
            font-size: 0.95rem;
          }

          .mark-all-read {
            font-size: 0.75rem;
          }

          .inquiry-statistics {
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 6px;
          }

          .stat {
            min-width: calc(50% - 6px);
            padding: 5px;
          }

          .pagination-btn {
            padding: 6px 10px;
            font-size: 0.7rem;
          }

          .page-number {
            padding: 6px 8px;
            font-size: 0.7rem;
            min-width: 30px;
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
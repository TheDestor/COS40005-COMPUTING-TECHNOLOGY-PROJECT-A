import React, { useState, useEffect, useRef } from 'react';
import {
  FaSearch,
  FaBell,
  FaEnvelope,
  FaFilter,
  FaEllipsisV,
  FaTrash,
  FaCheck,
  FaReply,
  FaExclamationTriangle,
  FaStar,
  FaClock,
  FaArrowLeft
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/ViewInquiry.css';
import ky from 'ky';

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
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const moreActionsRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target)) {
        setShowMoreDropdown(false);
      }
    };

    if (showMoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreDropdown]);

  useEffect(() => {
    const fetchInquiries = async () => {
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
            name: inquiry.email.split('@')[0],
            email: inquiry.email,
            subject: inquiry.topic,
            message: inquiry.message,
            date: inquiry.createdAt,
            status: inquiry.status || "Unread",
            priority: 'medium',
            avatar: profile1
          }));

          mappedInquiries.sort((a, b) => new Date(b.date) - new Date(a.date));

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
        } else {
          setInquiries([]);
        }
      } catch (error) {
        console.error(error);
      }
    }

    fetchInquiries();
  }, [accessToken, isMobile]);

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
        console.log("Inquiry marked as resolved on backend.");
      } else {
        console.log("Failed to mark inquiry as resolved on backend.");
      }
    } catch (error) {
      console.error("Error updating inquiry status:", error);
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

  const handleDeleteInquiry = (id) => {
    const updatedInquiries = inquiries.filter(item => item.id !== id);
    setInquiries(updatedInquiries);

    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry(updatedInquiries.length > 0 ? updatedInquiries[0] : null);
      if (isMobile && updatedInquiries.length === 0) {
        setShowInquiryDetail(false);
      }
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

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
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

        <div className="inquiry-content">
          <div className="inquiry-options">
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

          <div className={`inquiry-container ${isMobile && showInquiryDetail ? 'mobile-detail-active' : ''}`}>
            <div className="inquiry-list">
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map(inquiry => (
                  <div
                    key={inquiry.id}
                    className={`inquiry-item ${selectedInquiry && selectedInquiry.id === inquiry.id ? 'selected' : ''} ${inquiry.status === 'Unread' ? 'unread' : ''}`}
                    onClick={() => handleSelectInquiry(inquiry)}
                  >
                    <div className="inquiry-avatar">
                      <img src={inquiry.avatar} alt={`${inquiry.name}'s avatar`} />
                    </div>
                    <div className="inquiry-brief">
                      <div className="inquiry-header">
                        <h4 className="inquiry-name">{inquiry.name}</h4>
                        <span className="inquiry-date">{formatDate(inquiry.date)}</span>
                      </div>
                      <div className="inquiry-subject">{inquiry.subject}</div>
                      <div className="inquiry-message-preview">
                        {inquiry.message.substring(0, 60)}...
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
                ))
              ) : (
                <div className="no-inquiries">
                  <p>No inquiries match your criteria</p>
                </div>
              )}
            </div>

            {selectedInquiry ? (
              <div className="inquiry-detail">
                <div className="inquiry-detail-header">
                  <div className="header-top-row">
                    {isMobile && (
                      <button className="back-button" onClick={handleBackToList}>
                        <FaArrowLeft /> Back
                      </button>
                    )}
                    <div className="inquiry-actions">
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
                        className="more-actions"
                        ref={moreActionsRef}
                        onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                      >
                        <FaEllipsisV />
                        <div className={`more-dropdown ${showMoreDropdown ? 'active' : ''}`}>
                          <button>Forward</button>
                          <button>Print</button>
                          <button>Block Sender</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="inquiry-user-info">
                    <img src={selectedInquiry.avatar} alt={`${selectedInquiry.name}'s avatar`} className="detail-avatar" />
                    <div>
                      <h3 className="detail-name">{selectedInquiry.name}</h3>
                      <p className="detail-email">{selectedInquiry.email}</p>
                    </div>
                  </div>
                </div>

                <div className="inquiry-detail-content">
                  <div className="inquiry-meta">
                    <div className="meta-item">
                      <span className="meta-label">Date:</span>
                      <span className="meta-value">{formatDate(selectedInquiry.date)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Subject:</span>
                      <span className="meta-value">{selectedInquiry.subject}</span>
                    </div>
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

                  <div className="inquiry-message">
                    <h4>Message:</h4>
                    <div className="message-body">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  <div className="inquiry-reply">
                    <h4>Reply:</h4>
                    <form onSubmit={handleSubmitReply}>
                      <textarea
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
    </div>
  );
};

export default ViewInquiry;
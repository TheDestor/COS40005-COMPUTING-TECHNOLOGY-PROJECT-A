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
        toast.success("Inquiry marked as resolved");
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
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map(inquiry => (
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
                ))
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
        }

        /* Scrollbar styling for better appearance */
        .compact-list::-webkit-scrollbar,
        .compact-detail-content::-webkit-scrollbar,
        .compact-message-body::-webkit-scrollbar {
          width: 4px;
        }

        .compact-list::-webkit-scrollbar-track,
        .compact-detail-content::-webkit-scrollbar-track,
        .compact-message-body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .compact-list::-webkit-scrollbar-thumb,
        .compact-detail-content::-webkit-scrollbar-thumb,
        .compact-message-body::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }

        .compact-list::-webkit-scrollbar-thumb:hover,
        .compact-detail-content::-webkit-scrollbar-thumb:hover,
        .compact-message-body::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default ViewInquiry;
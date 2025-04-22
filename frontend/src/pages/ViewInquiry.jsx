import React, { useState, useEffect } from 'react';
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
  FaClock
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/ViewInquiry.css';

// Import profile images
import profile1 from '../assets/profile1.png';
import profile2 from '../assets/profile2.png';
import profile3 from '../assets/profile3.png';
import profile4 from '../assets/profile4.png';
import profile5 from '../assets/profile5.png';
import profile6 from '../assets/profile6.png';
import profile7 from '../assets/profile7.png';
import profile8 from '../assets/profile8.png';

const ViewInquiry = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Dummy data for inquiries
  useEffect(() => {
    const dummyInquiries = [
      {
        id: 1,
        name: 'Gokul Kalla',
        email: 'gokulkalla@gmail.com',
        subject: 'Information about business registration',
        message: 'Hello, I would like to know more about how to register my business on your platform. What are the requirements and associated costs? Do you have any special offers for new businesses?',
        date: '2025-04-20T14:25:00',
        status: 'unread',
        priority: 'medium',
        avatar: profile1
      },
      {
        id: 2,
        name: 'Carlos Sainz',
        email: 'carlos.sainz@gmail.com',
        subject: 'Technical support needed',
        message: 'I am experiencing issues with uploading photos to my business profile. The system keeps showing an error message. I have tried different browsers but the problem persists. Can you please help me resolve this issue as soon as possible? My business ID is BUS-2023-456.',
        date: '2025-04-19T09:12:00',
        status: 'in-progress',
        priority: 'high',
        avatar: profile2
      },
      {
        id: 3,
        name: 'Kenneth',
        email: 'kenneth@gmail.com',
        subject: 'Feedback on recent features',
        message: 'I wanted to share some feedback on the new booking feature. It has significantly improved my business workflow. However, I would suggest adding a calendar sync option to avoid double bookings with my existing systems. Overall, great work with the platform improvements!',
        date: '2025-04-18T16:35:00',
        status: 'resolved',
        priority: 'low',
        avatar: profile3
      },
      {
        id: 4,
        name: 'Daniel',
        email: 'daniel@gmail.com',
        subject: 'Complaint about review system',
        message: 'I believe there are some fake reviews on my business profile. I have noticed several 1-star reviews from accounts with no other activity. Could you please investigate this matter? This is severely affecting my business reputation. I can provide more details if needed.',
        date: '2025-04-17T11:20:00',
        status: 'unread',
        priority: 'high',
        avatar: profile4
      },
      {
        id: 5,
        name: 'Steph',
        email: 'steph12@gmail.com',
        subject: 'Partnership proposal',
        message: 'I represent a tourism board in the Sunshine Coast region. We are interested in forming a strategic partnership with your platform to promote local businesses. Could someone from your business development team contact me to discuss potential collaboration opportunities?',
        date: '2025-04-16T14:50:00',
        status: 'in-progress',
        priority: 'medium',
        avatar: profile5
      },
      {
        id: 6,
        name: 'Alvin',
        email: 'alvin@gmail.com',
        subject: 'Account deletion request',
        message: 'I would like to request the deletion of my business account. I have closed my business and no longer need the listing. Please confirm when this has been completed. My business ID is BUS-2021-789.',
        date: '2025-04-15T08:05:00',
        status: 'resolved',
        priority: 'low',
        avatar: profile6
      },
      {
        id: 7,
        name: 'Gary',
        email: 'gary@gmail.com',
        subject: 'Issue with payment processing',
        message: 'I attempted to pay for the premium subscription but the transaction failed multiple times. My card has sufficient funds and works on other platforms. Can you please check if there are any issues with your payment gateway? I would like to upgrade as soon as possible.',
        date: '2025-04-14T13:15:00',
        status: 'unread',
        priority: 'high',
        avatar: profile7
      },
      {
        id: 8,
        name: 'Lara Wilson',
        email: 'lauren.wilson@gmail.com',
        subject: 'Question about analytics feature',
        message: 'I recently upgraded to your premium plan but I am having trouble understanding some of the analytics data. Specifically, the conversion metrics seem confusing. Could you provide some guidance or documentation on how to interpret these numbers?',
        date: '2025-04-13T15:40:00',
        status: 'in-progress',
        priority: 'medium',
        avatar: profile8
      }
    ];
    
    setInquiries(dummyInquiries);
    // first inquiry selected by default
    setSelectedInquiry(dummyInquiries[0]);
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

  // Function to handle inquiry selection
  const handleSelectInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    
    // If the inquiry was unread, mark it as in-progress
    if (inquiry.status === 'unread') {
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

  // Handler for marking an inquiry as resolved
  const handleMarkResolved = (id) => {
    const updatedInquiries = inquiries.map(item => {
      if (item.id === id) {
        return { ...item, status: 'resolved' };
      }
      return item;
    });
    
    setInquiries(updatedInquiries);
    
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry({ ...selectedInquiry, status: 'resolved' });
    }
  };

  // Handler for deleting an inquiry
  const handleDeleteInquiry = (id) => {
    const updatedInquiries = inquiries.filter(item => item.id !== id);
    setInquiries(updatedInquiries);
    
    // If the deleted inquiry was selected, select the first one from the updated list
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry(updatedInquiries.length > 0 ? updatedInquiries[0] : null);
    }
  };

  // Handler for submitting a reply
  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    // WE CAN USE THIS FOR BACKEND PURPOSE
    console.log(`Reply to inquiry #${selectedInquiry.id}:`, replyText);
    
    // Mark as resolved
    handleMarkResolved(selectedInquiry.id);
    
    // Reset reply field
    setReplyText('');
    
    // Show success message (we might use a toast notification)
    alert("Reply sent successfully!");
  };

  // Filter inquiries based on search query and filters
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || inquiry.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || inquiry.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'unread':
        return 'status-badge-unread';
      case 'in-progress':
        return 'status-badge-progress';
      case 'resolved':
        return 'status-badge-resolved';
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
          {/* Filters and options */}
          <div className="inquiry-options">
            <div className="inquiry-statistics">
              <div className="stat">
                <span className="stat-value">{inquiries.filter(i => i.status === 'unread').length}</span>
                <span className="stat-label">Unread</span>
              </div>
              <div className="stat">
                <span className="stat-value">{inquiries.filter(i => i.status === 'in-progress').length}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat">
                <span className="stat-value">{inquiries.filter(i => i.status === 'resolved').length}</span>
                <span className="stat-label">Resolved</span>
              </div>
              <div className="stat">
                <span className="stat-value">{inquiries.length}</span>
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
          
          <div className="inquiry-container">
            {/* Left panel - Inquiry list */}
            <div className="inquiry-list">
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map(inquiry => (
                  <div 
                    key={inquiry.id}
                    className={`inquiry-item ${selectedInquiry && selectedInquiry.id === inquiry.id ? 'selected' : ''} ${inquiry.status === 'unread' ? 'unread' : ''}`}
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
                          {inquiry.status === 'in-progress' ? 'In Progress' : inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
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
            
            {/* Right panel - Selected inquiry detail */}
            {selectedInquiry ? (
              <div className="inquiry-detail">
                <div className="inquiry-detail-header">
                  <div className="inquiry-user-info">
                    <img src={selectedInquiry.avatar} alt={`${selectedInquiry.name}'s avatar`} className="detail-avatar" />
                    <div>
                      <h3 className="detail-name">{selectedInquiry.name}</h3>
                      <p className="detail-email">{selectedInquiry.email}</p>
                    </div>
                  </div>
                  
                  <div className="inquiry-actions">
                    <button 
                      className={`inquiry-action-btn resolve-btn ${selectedInquiry.status === 'resolved' ? 'disabled' : ''}`}
                      onClick={() => handleMarkResolved(selectedInquiry.id)}
                      disabled={selectedInquiry.status === 'resolved'}
                    >
                      <FaCheck /> {selectedInquiry.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                    </button>
                    <button 
                      className="inquiry-action-btn delete-btn"
                      onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                    >
                      <FaTrash /> Delete
                    </button>
                    <div className="more-actions">
                      <FaEllipsisV />
                      <div className="more-dropdown">
                        <button>Forward</button>
                        <button>Print</button>
                        <button>Block Sender</button>
                      </div>
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
                        {selectedInquiry.status === 'in-progress' ? 'In Progress' : selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1)}
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
                        disabled={selectedInquiry.status === 'resolved'}
                      ></textarea>
                      <div className="reply-actions">
                        <button 
                          type="submit" 
                          className="send-reply-btn"
                          disabled={selectedInquiry.status === 'resolved' || !replyText.trim()}
                        >
                          <FaReply /> Send Reply
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-inquiry-selected">
                <p>Select an inquiry to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInquiry;
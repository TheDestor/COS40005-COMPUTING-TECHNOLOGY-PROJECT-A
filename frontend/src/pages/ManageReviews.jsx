import React, { useState } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaDownload } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCheck, FaTimes, FaBan } from 'react-icons/fa';
import '../styles/ManageReviews.css';

const ManageReviews = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // ✅ Reviews stored in state
  const [reviews, setReviews] = useState([
    {
      id: '#ID2358976',
      destination: 'Bako National Park',
      userName: 'Gokul',
      content: 'Amazing experience! The wildlife was incredible',
      status: 'Pending',
      date: '2025-03-12 14:30:00',
    },
    {
      id: '#ID2358975',
      destination: 'Rainforest Lodge',
      userName: 'Alvin',
      content: 'I hate this place - terrible service!',
      status: 'Flagged',
      date: '2025-03-13 09:45:00',
    },
    {
      id: '#ID2358974',
      destination: 'Cultural Village',
      userName: 'Sophia',
      content: 'Authentic cultural experience, highly recommended!fgzdfbzfdbzfdndzbbvm kvslvszvj sfkv sdjkvjlsdjk',
      status: 'Approved',
      date: '2025-04-14 10:00:00',
    },
    {
      id: '#ID2358973',
      destination: 'Damai Beach Resort',
      userName: 'Daniel',
      content: 'Breathtaking views from our private villa',
      status: 'Pending',
      date: '2025-04-15 11:30:00',
    },
  ]);

  const getStatusStyle = (status) => {
    const styles = {
      Pending: 'status-pending',
      Approved: 'status-approved',
      Flagged: 'status-flagged',
    };
    return styles[status];
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = (id, newStatus) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === id ? { ...review, status: newStatus } : review
      )
    );
  };

  const filteredReviews = reviews.filter((review) => {
    const formattedDateTime = new Date(review.date).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    
    const matchesSearchQuery =
      review.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formattedDateTime.toLowerCase().includes(searchQuery.toLowerCase());
    

    const matchesStatusFilter = statusFilter ? review.status === statusFilter : true;

    const reviewDate = new Date(review.date);
    let matchesDateRange = true;
    if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      matchesDateRange = reviewDate >= startDate && reviewDate <= adjustedEndDate;
    }

    return matchesSearchQuery && matchesStatusFilter && matchesDateRange;
  });

  const downloadCSV = () => {
    if (filteredReviews.length === 0) {
      alert('No data available to download.');
      return;
    }

    const header = ['Destination/ID', 'User Name', 'Review Content', 'Date & Time', 'Status'];
    const rows = filteredReviews.map(review => [
      `"${review.destination} (${review.id})"`,
      `"${review.userName}"`,
      `"${review.content.replace(/"/g, '""')}"`,
      `"${new Date(review.date).toLocaleDateString('en-GB')}, ${new Date(review.date).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      })}"`,
      `"${review.status}"`
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'reviews_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const handleStatusChange = (id, newStatus) => {
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === id ? { ...review, status: newStatus } : review
        )
      );
    };    
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="MRdashboard-content">
        <div className="dashboard-header">
          <div className="TitleMR">
            <h3>Manage Reviews</h3>
            <p>Approve or Flag on users reivews</p>
          </div>
          <div className="dashboard-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by ID, destination, username, content, or status..."
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

        {/* Filters and Download */}
        <div className="filters-actions-row">
          <div className="mr-search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, destination, username, content, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-dropdown-mr">
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>

          <div className="date-picker">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Start Date"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="End Date"
            />
          </div>

          <button className="download-button" onClick={downloadCSV}>
            <FaDownload /> Download
          </button>
        </div>

        {/* Reviews Table */}
          <div className="reviews-table-container">
            <div className="table-header">
              <div className="header-cell destination-id">Destination/ID</div>
              <div className="header-cell">User Name</div>
              <div className="header-cell review-content">Review Content</div>
              <div className="header-cell">Date & Time</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Action</div>
            </div>

            {filteredReviews.map((review) => (
              <div key={review.id} className="table-row">
                <div className="table-cell destination-cell">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(review.id)}
                    onChange={() => toggleSelection(review.id)}
                  />
                  <div>
                    <div className="destination-name">{review.destination}</div>
                    <div className="destination-id">{review.id}</div>
                  </div>
                </div>

                <div className="table-cell">{review.userName}</div>

                <div className="table-cell review-content">{review.content}</div>

                <div className="table-cell">
                {new Date(review.date).toLocaleDateString('en-GB')}, {new Date(review.date).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: true 
                })}
                </div>


                <div className="table-cell">
                  <span className={`status-badge ${getStatusStyle(review.status)}`}>
                    {review.status}
                  </span>
                </div>

                <div className="table-cell action-cell">
                {/* Approve Button */}
                <button
                  className={`action-button approve-btn ${review.status === 'Approved' ? 'approved' : ''}`}
                  disabled={review.status === 'Approved'}
                  onClick={() => handleStatusChange(review.id, 'Approved')}
                  title={review.status === 'Approved' ? 'Approved - Cannot click' : 'Approve'}
                >
                  <FaCheck />
                </button>

                {/* Flagged Button */}
                <button
                  className={`action-button flagged-btn ${review.status === 'Flagged' ? 'flagged' : ''}`}
                  disabled={review.status === 'Flagged'}
                  onClick={() => handleStatusChange(review.id, 'Flagged')}
                  title={review.status === 'Flagged' ? 'Flagged - Cannot click' : 'Flagged'}
                >
                  <FaTimes />
                </button>
              </div>

              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ManageReviews;

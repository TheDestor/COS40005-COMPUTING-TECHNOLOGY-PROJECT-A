import React, { useState } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaDownload } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import '../styles/ManageLocation.css';
import ky from 'ky';

const MapPreview = ({ coordinates }) => {
  const [lat, lng] = coordinates.split(',').map(Number);

  return (
    <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
      <APIProvider apiKey="AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI">
        <Map
          center={{ lat, lng }}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="none"
          disableDefaultUI
        />
      </APIProvider>
    </div>
  );
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 604800);
  if (interval >= 1) {
    return interval === 1 ? '1 week ago' : `${interval} weeks ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return 'Just now';
};


const ManageLocation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingLocation, setEditingLocation] = useState(null);

  const [locations, setLocations] = useState([
    {
      id: '#LOC301',
      name: 'Bako National Park',
      status: 'Active',
      coordinates: '1.7136, 110.4583',
      description: 'Rainforest and wildlife exploration',
      externalLink: '',
      lastUpdated: '2025-03-12 14:30:00',
    },
    {
      id: '#LOC302',
      name: 'Rainforest Lodge',
      status: 'Active',
      coordinates: '1.5532, 110.3608',
      description: 'Eco-friendly jungle lodge',
      externalLink: '',
      lastUpdated: '2025-03-13 09:45:00',
    },
    {
      id: '#LOC303',
      name: 'Cultural Village',
      status: 'Inactive',
      coordinates: '1.5592, 110.3472',
      description: 'Cultural shows and heritage',
      externalLink: '',
      lastUpdated: '2025-04-14 10:00:00',
    },
    {
      id: '#LOC304',
      name: 'Sunset Beach',
      status: 'Active',
      coordinates: '1.4356, 110.4583',
      description: 'Guided wildlife tours with expert naturalists',
      externalLink: '',
      lastUpdated: '2025-04-15 11:30:00',
    },

    {
      id: '#LOC345',
      name: 'Sin Chong Choon',
      status: 'Active',
      coordinates: '1.5026362248161327, 110.34716280284839',
      description: 'Nice breakfast and lunch place',
      externalLink: '',
      lastUpdated: '2025-05-08 11:35:00',
    },
  ]);

  const getAllLocations = async () => {
    try {
      const response = await ky.get("/api/locations/").json();

      console.log(response);
    } catch (error) {
      console.error("An error occured while trying to get all locations:", error);
    }
  }

  getAllLocations();

  const getStatusClass = (status) => status === 'Active' ? 'status-active' : 'status-inactive';

  const filteredLocations = locations.filter((location) => {
    const matchesSearchQuery =
      location.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTimeAgo(location.lastUpdated).toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.status.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatusFilter = statusFilter ? location.status === statusFilter : true;

      const locationDate = new Date(location.lastUpdated);
      let matchesDateRange = true;
      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999);
        matchesDateRange = locationDate >= startDate && locationDate <= adjustedEndDate;
      }
    
      return matchesSearchQuery && matchesStatusFilter && matchesDateRange;
    });
    

  const handleDelete = (id) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  };

  const handleEdit = (location) => {
    setEditingLocation({ ...location });
  };

  const handleSaveEdit = () => {
    const finalLocation = {...editingLocation};
    
    // If it's a new location (has temp ID), generate a real ID
    if (finalLocation.id.startsWith('temp-')) {
      finalLocation.id = `#LOC${300 + locations.length + 1}`;
      finalLocation.lastUpdated = new Date().toISOString();
    }

    setLocations(prev => {
      // If editing existing, map through array
      if (!editingLocation.id.startsWith('temp-')) {
        return prev.map(loc => (loc.id === editingLocation.id ? finalLocation : loc));
      }
      // If new, add to array
      return [...prev, finalLocation];
    });
    
    setEditingLocation(null);
  };

  const downloadCSV = () => {
    if (filteredLocations.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = ['Location ID', 'Name', 'Status', 'Last Updated'];
    const rows = filteredLocations.map(loc => [
      `"${loc.id}"`,
      `"${loc.name}"`,
      `"${loc.status}"`,
      `"${new Date(loc.lastUpdated).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'locations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="MLdashboard-container">
      <Sidebar />
      <div className="MLdashboard-content">
        {/* Header */}
        <div className="MLdashboard-header">
          <div className="TitleML">
            <h3>Manage Locations</h3>
            <p>Manage and monitor locations' status</p>
          </div>
          <div className="dashboard-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by ID, name, or status..."
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

        {/* Filters */}
        <div className="filters-actions-row">
          <div className="ml-search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, name, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            className="add-location-button"
            onClick={() => setEditingLocation({
              id: 'temp-' + Date.now(),
              name: '',
              status: 'Active',
              coordinates: '0,0',
              description: '',
              externalLink: '',
              lastUpdated: new Date().toISOString()
            })}
          >
            Add New Location +
          </button>

          <div className="filter-dropdown-ml">
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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

        {/* Table */}
        <div className="reviews-table-container">
          <div className="MLtable-header">
            <div className="header-cell">Location ID</div>
            <div className="header-cell">Name</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Last Updated</div>
            <div className="header-cell">Action</div>
          </div>

          {filteredLocations.map((location) => (
            <div key={location.id} className="MLtable-row">
              <div className="table-cell">{location.id}</div>
              <div className="table-cell">{location.name}</div>
              <div className="table-cell">
                <span className={`MLstatus-badge ${getStatusClass(location.status)}`}>
                  {location.status}
                </span>
              </div>
              <div className="table-cell">
              {getTimeAgo(location.lastUpdated)}
            </div>
              <div className="table-cell">
                <button className="edit-button" onClick={() => handleEdit(location)}>Edit</button>
                <button className="delete-button" onClick={() => handleDelete(location.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editingLocation && (
          <div className="modal-overlay">
            <div className="MLmodal-content">
              <h3>{editingLocation.id.startsWith('temp-') ? 'Add New Location' : 'Edit Location'}</h3>

              <label>Location Name</label>
              <input
                name="name"
                value={editingLocation.name}
                onChange={(e) =>
                  setEditingLocation({ ...editingLocation, name: e.target.value })
                }
              />

              <label>Coordinates</label>
              <input
                name="coordinates"
                value={editingLocation.coordinates}
                onChange={(e) =>
                  setEditingLocation({ ...editingLocation, coordinates: e.target.value })
                }
              />

              <label>Description</label>
              <textarea
                name="description"
                value={editingLocation.description}
                onChange={(e) =>
                  setEditingLocation({ ...editingLocation, description: e.target.value })
                }
              />

              <label>Upload Images/Videos</label>
              <input type="file" />

              <label>External Links</label>
              <input
                name="externalLink"
                value={editingLocation.externalLink || ''}
                onChange={(e) =>
                  setEditingLocation({ ...editingLocation, externalLink: e.target.value })
                }
              />

              <label>Status</label>
              <select className="status-select" 
                value={editingLocation.status}
                onChange={(e) =>
                  setEditingLocation({ ...editingLocation, status: e.target.value })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <label>Map Preview</label>
              <MapPreview coordinates={editingLocation.coordinates} />

              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setEditingLocation(null)}>Cancel</button>
                <button className="save-button" onClick={handleSaveEdit}>Save Location</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLocation;
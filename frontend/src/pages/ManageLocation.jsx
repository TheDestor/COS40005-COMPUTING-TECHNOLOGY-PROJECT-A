import React, { useEffect, useState, useRef } from "react";
import { FaSearch, FaBell, FaEnvelope, FaDownload } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import "../styles/ManageLocation.css";
import ky from "ky";
import { useAuth } from "../context/AuthProvider";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MapPreview = ({ latitude, longitude }) => {
  return (
    <div
      style={{
        height: "200px",
        borderRadius: "8px",
        overflow: "hidden",
        marginTop: "10px",
      }}
    >
      <div style={{ marginBottom: "5px", fontSize: "14px", color: "#666" }}>
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>

      <MapContainer
        key={`${latitude}-${longitude}`} // 🔑 force remount when coords change
        center={[latitude, longitude]}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? "1 year ago" : `${interval} years ago`;
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? "1 month ago" : `${interval} months ago`;
  }

  interval = Math.floor(seconds / 604800);
  if (interval >= 1) {
    return interval === 1 ? "1 week ago" : `${interval} weeks ago`;
  }

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? "1 day ago" : `${interval} days ago`;
  }

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
  }

  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
  }

  return "Just now";
};

const ManageLocation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await ky.get("/api/locations").json();
        setLocations(response);
      } catch (error) {
        console.error(
          "An error occured while trying to get all locations:",
          error
        );
      }
    };

    fetchLocations();
  }, []);

  const clearValidationError = (fieldName) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const categoryOptions = [
    "Attraction",
    "Shopping & Leisure",
    "Food & Beverages",
    "Transportation",
    "Accommodation",
    "Tour Guide",
  ];

  const typeOptions = {
    Attraction: [
      "National Park",
      "Museum",
      "Beach",
      "Cultural Site",
      "Adventure Park",
      "Others",
    ],
    "Shopping & Leisure": ["Test"],
    "Food & Beverages": [
      "Restaurant",
      "Cafe",
      "Street Food",
      "Bar",
      "Fine Dining",
      "Others",
    ],
    Transportation: ["Test"],
    Accommodation: ["Hotel", "Resort", "Homestay", "Hostel", "Villa", "Others"],
    "Tour Guide": ["Test"],
  };

  const getCurrentTypeOptions = () => {
    if (!editingLocation?.category) return [];
    return typeOptions[editingLocation.category] || [];
  };

  const getStatusClass = (status) =>
    status === "Active" ? "status-active" : "status-inactive";

  const filteredLocations = locations.filter((location) => {
    const matchesSearchQuery =
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTimeAgo(location.updatedAt)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatusFilter = statusFilter
      ? location.status === statusFilter
      : true;

    const locationDate = new Date(location.updatedAt);
    let matchesDateRange = true;
    if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      matchesDateRange =
        locationDate >= startDate && locationDate <= adjustedEndDate;
    }

    return matchesSearchQuery && matchesStatusFilter && matchesDateRange;
  });

  const handleOpenModalForNew = () => {
    setEditingLocation({
      _id: "temp-" + Date.now(),
      category: "",
      type: "",
      division: "",
      name: "",
      status: "",
      latitude: 0,
      longitude: 0,
      description: "",
      url: "",
      image: null,
      updatedAt: "",
    });
    setValidationErrors({});
  };

  const handleDelete = async (locationId) => {
    try {
      console.log(locationId);
      const response = await ky
        .post("/api/locations/removeLocation", {
          headers: { Authorization: `Bearer ${accessToken}` },
          json: { id: locationId },
        })
        .json();

      console.log(response);
      setLocations((prev) => prev.filter((loc) => loc._id !== locationId));
    } catch (error) {
      console.error(
        "An error occured while trying to delete this location",
        error
      );
    }
  };

  const handleEdit = (location) => {
    setEditingLocation({ ...location });
  };

  const handleSaveEdit = async () => {
    const errors = {};
    if (!editingLocation.category) errors.category = "Category is required";
    if (!editingLocation.type) errors.type = "Type is required";
    if (!editingLocation.division) errors.division = "Division is required";
    if (!editingLocation.name) errors.name = "Location name is required";
    if (!editingLocation.description)
      errors.description = "Description is required";
    if (!editingLocation.status) errors.status = "Status is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const isNewLocation = editingLocation?._id?.startsWith("temp-");

    const locationData = {
      id: editingLocation._id,
      category: editingLocation.category,
      type: editingLocation.type,
      division: editingLocation.division,
      name: editingLocation.name,
      status: editingLocation.status,
      latitude: editingLocation.latitude,
      longitude: editingLocation.longitude,
      description: editingLocation.description,
      url: editingLocation.url,
      image: editingLocation.image,
    };
    console.log(locationData);
    try {
      if (isNewLocation) {
        const response = await ky
          .post("/api/locations/addLocation", {
            headers: { Authorization: `Bearer ${accessToken}` },
            json: locationData,
          })
          .json();

        const newLocation = response.newLocation;

        if (newLocation) {
          setLocations((prevLocations) => [...prevLocations, newLocation]);
          closeModal();
        } else {
          console.error(
            "Failed to add location: Invalid response from server",
            response
          );
        }
      } else {
        const response = await ky
          .post("/api/locations/updateLocation", {
            headers: { Authorization: `Bearer ${accessToken}` },
            json: locationData,
          })
          .json();

        const updatedLocation = response.updatedLocation;

        if (updatedLocation) {
          setLocations((prevLocations) =>
            prevLocations.map((loc) =>
              loc._id === updatedLocation._id ? updatedLocation : loc
            )
          );
          closeModal();
        } else {
          console.error(
            "Failed to update location: Invalid response from server",
            response
          );
        }
      }
      setValidationErrors({});
    } catch (error) {
      console.error("An error occured while adding new location:", error);
    }
  };

  const downloadCSV = () => {
    if (filteredLocations.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = [
      "Location ID",
      "Name",
      "Category",
      "Type",
      "Division",
      "Status",
      "Last Updated",
    ];
    const rows = filteredLocations.map((loc) => [
      `"${loc._id}"`,
      `"${loc.name}"`,
      `"${loc.category}"`,
      `"${loc.type}"`,
      `"${loc.division}"`,
      `"${loc.status}"`,
      `"${new Date(loc.updatedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "locations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const closeModal = () => {
    setEditingLocation(null);
    setValidationErrors({});
  };

  return (
    <div className="MLdashboard-container">
      <Sidebar />
      <div className="MLdashboard-content">
        {/* Header */}
        <div className="MLdashboard-header">
          <div className="TitleML">
            <h2>Manage Locations</h2>
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
            onClick={handleOpenModalForNew}
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
            <div className="header-cell">Category</div>
            <div className="header-cell">Type</div>
            <div className="header-cell">Division</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Last Updated</div>
            <div className="header-cell">Action</div>
          </div>

          {filteredLocations.map((location) => (
            <div key={location._id} className="MLtable-row">
              <div className="table-cell">{location._id}</div>
              <div className="table-cell">{location.name}</div>
              <div className="table-cell">{location.category}</div>
              <div className="table-cell">{location.type}</div>
              <div className="table-cell">{location.division}</div>
              <div className="table-cell">
                <span
                  className={`MLstatus-badge ${getStatusClass(
                    location.status
                  )}`}
                >
                  {location.status}
                </span>
              </div>
              <div className="table-cell">{getTimeAgo(location.updatedAt)}</div>
              <div className="table-cell">
                <button
                  className="edit-button"
                  onClick={() => handleEdit(location)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(location._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editingLocation && (
          <div className="modal-overlay">
            <div className="MLmodal-content">
              <h3>
                {editingLocation?._id?.startsWith("temp-")
                  ? "Add New Location"
                  : "Edit Location"}
              </h3>

              <label>Category *</label>
              <select
                name="category"
                value={editingLocation.category}
                onChange={(e) => {
                  setEditingLocation({
                    ...editingLocation,
                    category: e.target.value,
                    type: "",
                  });
                  clearValidationError("category");
                }}
                className={`form-select ${
                  validationErrors.category ? "error-border" : ""
                }`}
              >
                <option value="">Select a category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {validationErrors.category && (
                <div className="error-message">{validationErrors.category}</div>
              )}

              <label>Type *</label>
              <select
                name="type"
                value={editingLocation.type}
                onChange={(e) => {
                  setEditingLocation({
                    ...editingLocation,
                    type: e.target.value,
                  });
                  clearValidationError("type");
                }}
                className={`form-select ${
                  validationErrors.type ? "error-border" : ""
                }`}
                disabled={!editingLocation.category}
              >
                <option value="">Select a type</option>
                {getCurrentTypeOptions().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {validationErrors.type && (
                <div className="error-message">{validationErrors.type}</div>
              )}

              <label>Division *</label>
              <input
                name="division"
                value={editingLocation.division}
                onChange={(e) => {
                  setEditingLocation({
                    ...editingLocation,
                    division: e.target.value,
                  });
                  clearValidationError("division");
                }}
                className={validationErrors.division ? "error-border" : ""}
              />
              {validationErrors.division && (
                <div className="error-message">{validationErrors.division}</div>
              )}

              <label>Location Name *</label>
              <input
                name="name"
                value={editingLocation.name}
                onChange={(e) => {
                  setEditingLocation({
                    ...editingLocation,
                    name: e.target.value,
                  });
                  clearValidationError("name");
                }}
                className={validationErrors.name ? "error-border" : ""}
              />
              {validationErrors.name && (
                <div className="error-message">{validationErrors.name}</div>
              )}

              <label>Coordinates</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={
                    editingLocation.latitude === 0
                      ? ""
                      : editingLocation.latitude
                  }
                  onChange={(e) =>
                    setEditingLocation({
                      ...editingLocation,
                      latitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Latitude (e.g. 1.697763)"
                />
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={
                    editingLocation.longitude === 0
                      ? ""
                      : editingLocation.longitude
                  }
                  onChange={(e) =>
                    setEditingLocation({
                      ...editingLocation,
                      longitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Longitude (e.g. 110.407775)"
                />
              </div>

              <label>Description *</label>
              <textarea
                name="description"
                value={editingLocation.description}
                onChange={(e) => {
                  setEditingLocation({
                    ...editingLocation,
                    description: e.target.value,
                  });
                  clearValidationError("description");
                }}
                className={validationErrors.description ? "error-border" : ""}
              />
              {validationErrors.description && (
                <div className="error-message">
                  {validationErrors.description}
                </div>
              )}

              <label>Website URL</label>
              <input
                name="url"
                value={editingLocation.url || ""}
                onChange={(e) =>
                  setEditingLocation({
                    ...editingLocation,
                    url: e.target.value,
                  })
                }
              />

              <label>Image URL</label>
              <input
                name="image"
                value={editingLocation.image || ""}
                onChange={(e) =>
                  setEditingLocation({
                    ...editingLocation,
                    image: e.target.value,
                  })
                }
              />

              <label>Status *</label>
              <select
                className={`status-select ${
                  validationErrors.status ? "error-border" : ""
                }`}
                value={editingLocation.status}
                onChange={(e) => {
                  setEditingLocation({
                    ...editingLocation,
                    status: e.target.value,
                  });
                  clearValidationError("status");
                }}
              >
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {validationErrors.status && (
                <div className="error-message">{validationErrors.status}</div>
              )}

              <label>Map Preview</label>
              <MapPreview
                latitude={editingLocation.latitude}
                longitude={editingLocation.longitude}
              />

              <div className="modal-actions">
                <button className="cancel-button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleSaveEdit}>
                  Save Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLocation;

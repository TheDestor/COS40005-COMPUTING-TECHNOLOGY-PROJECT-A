import React, { useEffect, useState, useRef } from "react";
import {
  FaSearch,
  FaBell,
  FaEnvelope,
  FaDownload,
  FaUpload,
  FaTimes,
  FaExclamationTriangle,
  FaSave,
  FaPlus,
  FaMinus,
  FaCheckCircle,
  FaExclamationCircle,
  FaFilter, // ADD THIS for status filter
  FaCalendarAlt, // ADD THIS for date picker
  FaChevronDown, // ADD THIS for dropdown arrow
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/ManageLocation.css";
import ky from "ky";
import { useMap } from "react-leaflet";
import { useAuth } from "../context/AuthProvider";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMapEvents } from "react-leaflet";

const buildPageList = (total, current) => {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  if (current <= 2) {
    return [1, 2, 3, "ellipsis", total];
  }

  if (current === 3) {
    return [2, 3, 4, "ellipsis", total];
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
};
const paginate = (pageNumber) => {
  if (pageNumber < 1 || pageNumber > totalPages) return;
  setCurrentPage(pageNumber);
};
const MapPreview = ({ latitude, longitude, onChange }) => {
  const mapRef = useRef();

  const MapEventsHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        onChange(lat, lng);
      },
    });
    return null;
  };

  const MapCenterUpdater = () => {
    const map = useMap();

    useEffect(() => {
      mapRef.current = map;
    }, [map]);

    useEffect(() => {
      if (map) {
        map.setView([latitude, longitude], map.getZoom());
      }
    }, [latitude, longitude, map]);

    return null;
  };

  const handleMarkerDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    onChange(lat, lng);
  };

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
        center={[latitude, longitude]}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <MapEventsHandler />
        <MapCenterUpdater />
        <Marker
          position={[latitude, longitude]}
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDragEnd,
          }}
        >
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
  if (interval >= 1)
    return interval === 1 ? "1 year ago" : `${interval} years ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1)
    return interval === 1 ? "1 month ago" : `${interval} months ago`;

  interval = Math.floor(seconds / 604800);
  if (interval >= 1)
    return interval === 1 ? "1 week ago" : `${interval} weeks ago`;

  interval = Math.floor(seconds / 86400);
  if (interval >= 1)
    return interval === 1 ? "1 day ago" : `${interval} days ago`;

  interval = Math.floor(seconds / 3600);
  if (interval >= 1)
    return interval === 1 ? "1 hour ago" : `${interval} hours ago`;

  interval = Math.floor(seconds / 60);
  if (interval >= 1)
    return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;

  return "Just now";
};
// Toast Notification Component
const ToastNotification = ({
  message,
  type = "success",
  onClose,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`toast-notification toast-${type} ${
        isVisible ? "toast-visible" : ""
      }`}
    >
      <div className="toast-content">
        {/* UPDATE: Add icon logic based on type */}
        {type === "success" ? (
          <FaCheckCircle className="toast-icon" />
        ) : (
          <FaExclamationCircle className="toast-icon" />
        )}
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        <FaTimes />
      </button>
    </div>
  );
};

const ValidationToastNotification = ({ messages, onClose, isVisible }) => {
  if (!isVisible || !messages || messages.length === 0) return null;

  return (
    <div
      className={`toast-notification toast-warning ${
        isVisible ? "toast-visible" : ""
      }`}
    >
      <div className="toast-content">
        <FaExclamationCircle className="toast-icon" />
        <div className="validation-messages">
          <strong>Please fill in the following required fields:</strong>
          <ul>
            {messages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
      <button className="toast-close" onClick={onClose}>
        <FaTimes />
      </button>
    </div>
  );
};
// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "delete",
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal-ml">
        <div className="confirmation-header">
          <FaExclamationTriangle className={`confirmation-icon ${type}-icon`} />
          <h3>{title}</h3>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-actions">
          <button className="cancel-confirm-btn" onClick={onClose}>
            {cancelText || "Cancel"}
          </button>
          <button className={`confirm-btn ${type}-btn`} onClick={onConfirm}>
            {confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Save Confirmation Modal Component
const SaveConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  locationCount = 1,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal-ml">
        <div className="confirmation-header">
          <FaSave className="confirmation-icon save-icon" />
          <h3>Save Locations</h3>
        </div>
        <div className="confirmation-body">
          <p>
            {locationCount > 1
              ? `Are you sure you want to save all ${locationCount} locations?`
              : "Are you sure you want to save this location?"}
          </p>
        </div>
        <div className="confirmation-actions">
          <button className="cancel-confirm-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-btn save-btn" onClick={onConfirm}>
            Save {locationCount > 1 ? `All (${locationCount})` : "Location"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Cancel Confirmation Modal Component
const CancelConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  hasChanges,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal-ml">
        <div className="confirmation-header">
          <FaExclamationTriangle className="confirmation-icon warning-icon" />
          <h3>Unsaved Changes</h3>
        </div>
        <div className="confirmation-body">
          <p>
            {hasChanges
              ? "You have unsaved changes. Are you sure you want to cancel? All changes will be lost."
              : "Are you sure you want to cancel?"}
          </p>
        </div>
        <div className="confirmation-actions">
          <button className="cancel-confirm-btn" onClick={onClose}>
            Continue Editing
          </button>
          <button className="confirm-btn cancel-btn" onClick={onConfirm}>
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ManageLocation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingLocations, setEditingLocations] = useState([]);
  const [originalEditingLocations, setOriginalEditingLocations] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const { accessToken } = useAuth();

  const [locationImages, setLocationImages] = useState({}); // { locationId: { file: null, preview: null } }
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);

  const [validationToast, setValidationToast] = useState({
    isVisible: false,
    messages: [],
  });

  // ADD: Function to show validation toast
  const showValidationToast = (validationResults) => {
    const errorMessages = [];

    validationResults.forEach((result) => {
      if (Object.keys(result.errors).length > 0) {
        const locationPrefix =
          validationResults.length > 1 ? `Location ${result.index + 1}: ` : "";

        Object.keys(result.errors).forEach((field) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          errorMessages.push(`${locationPrefix}${fieldName} is required`);
        });
      }
    });

    if (errorMessages.length > 0) {
      setValidationToast({
        isVisible: true,
        messages: errorMessages,
      });

      // Auto hide after 8 seconds
      setTimeout(() => {
        setValidationToast((prev) => ({ ...prev, isVisible: false }));
      }, 8000);
    }
  };

  // ADD: Function to close validation toast
  const closeValidationToast = () => {
    setValidationToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Validation Toast Notification Component
  const ValidationToastNotification = ({ messages, onClose, isVisible }) => {
    if (!isVisible || !messages || messages.length === 0) return null;

    return (
      <div
        className={`toast-notification toast-warning ${
          isVisible ? "toast-visible" : ""
        }`}
      >
        <div className="toast-content">
          <FaExclamationCircle className="toast-icon" />
          <div className="validation-messages">
            <strong>Please fill in the following required fields:</strong>
            <ul>
              {messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
        <button className="toast-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
    );
  };

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  // Confirmation modal states
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    locationId: null,
    locationName: "",
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    location: null,
  });
  const [saveModal, setSaveModal] = useState({
    isOpen: false,
  });
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
  });

  const handleCoordinatesChange = (lat, lng) => {
    setEditingLocation((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await ky.get("/api/locations").json();
        // Make sure the response includes image URLs
        setLocations(response);
      } catch (error) {
        console.error("Error fetching locations:", error);
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
    "Major Town",
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
    "Shopping & Leisure": ["Mall"],
    "Food & Beverages": [
      "Restaurant",
      "Cafe",
      "Street Food",
      "Bar",
      "Fine Dining",
      "Others",
    ],
    Accommodation: ["Hotel", "Resort", "Homestay", "Hostel", "Villa", "Others"],
    "Tour Guide": ["Test"],
  };

  const getCurrentTypeOptions = () =>
    editingLocation?.category
      ? typeOptions[editingLocation.category] || []
      : [];

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

  // Check if there are any changes in the form
  const hasChanges = () => {
    if (editingLocations.length !== originalEditingLocations.length) {
      return true;
    }

    return editingLocations.some((location, index) => {
      const originalLocation = originalEditingLocations[index];
      if (!originalLocation) return true;

      return (
        location.category !== originalLocation.category ||
        location.type !== originalLocation.type ||
        location.division !== originalLocation.division ||
        location.name !== originalLocation.name ||
        location.status !== originalLocation.status ||
        location.latitude !== originalLocation.latitude ||
        location.longitude !== originalLocation.longitude ||
        location.description !== originalLocation.description ||
        location.url !== originalLocation.url
      );
    });
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredLocations.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(filteredLocations.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleOpenModalForNew = () => {
    const newLocation = {
      _id: `temp-${Date.now()}-0`,
      category: "",
      type: "",
      division: "",
      name: "",
      status: "",
      latitude: 1.560313,
      longitude: 110.345285,
      description: "",
      url: "",
      image: null,
      updatedAt: "",
    };
    setEditingLocations([newLocation]);
    setOriginalEditingLocations([newLocation]);
    setValidationErrors({});
    setCurrentLocationIndex(0); // Reset to first location
  };

  const handleAddLocation = () => {
    const newLocation = {
      _id: `temp-${Date.now()}-${editingLocations.length}`,
      category: "",
      type: "",
      division: "",
      name: "",
      status: "",
      latitude: 1.560313,
      longitude: 110.345285,
      description: "",
      url: "",
      image: null,
      updatedAt: "",
    };
    setEditingLocations([...editingLocations, newLocation]);
    // Automatically navigate to the new location
    setCurrentLocationIndex(editingLocations.length);
  };
  // Navigation functions for location forms
  const goToNextLocation = () => {
    if (currentLocationIndex < editingLocations.length - 1) {
      setCurrentLocationIndex(currentLocationIndex + 1);
    }
  };

  const goToPrevLocation = () => {
    if (currentLocationIndex > 0) {
      setCurrentLocationIndex(currentLocationIndex - 1);
    }
  };

  const goToLocation = (index) => {
    setCurrentLocationIndex(index);
  };

  const handleRemoveLocation = (index) => {
    // Prevent removing the first location
    if (index === 0) {
      return;
    }

    if (editingLocations.length > 1) {
      const updatedLocations = editingLocations.filter((_, i) => i !== index);
      setEditingLocations(updatedLocations);

      // Adjust current index if needed
      if (currentLocationIndex >= updatedLocations.length) {
        setCurrentLocationIndex(updatedLocations.length - 1);
      } else if (currentLocationIndex >= index) {
        setCurrentLocationIndex(currentLocationIndex - 1);
      }

      // Also remove validation errors for the removed location
      const newErrors = { ...validationErrors };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`locations[${index}]`)) {
          delete newErrors[key];
        }
      });
      setValidationErrors(newErrors);
    }
  };

  const handleLocationChange = (index, updatedLocation) => {
    const updatedLocations = [...editingLocations];
    updatedLocations[index] = updatedLocation;
    setEditingLocations(updatedLocations);
  };
  const handleSaveAllLocations = async () => {
    try {
      // Validate all locations before sending
      const validationResults = editingLocations.map((location, index) => {
        const errors = {};

        if (!location.category?.trim())
          errors.category = "Category is required";
        if (!location.type?.trim()) errors.type = "Type is required";
        if (!location.division?.trim())
          errors.division = "Division is required";
        if (!location.name?.trim()) errors.name = "Name is required";
        if (!location.status?.trim()) errors.status = "Status is required";
        if (!location.description?.trim())
          errors.description = "Description is required";

        return { index, errors };
      });

      // Check if any location has validation errors
      const hasErrors = validationResults.some(
        (result) => Object.keys(result.errors).length > 0
      );

      if (hasErrors) {
        // Combine all errors into validationErrors state
        const allErrors = {};
        validationResults.forEach((result) => {
          Object.keys(result.errors).forEach((field) => {
            allErrors[`locations[${result.index}].${field}`] =
              result.errors[field];
          });
        });

        setValidationErrors(allErrors);
        showValidationToast(validationResults);
        return;
      }

      console.log("Starting to save locations:", editingLocations);

      const savePromises = editingLocations.map(async (location, index) => {
        try {
          const locationData = {
            id: location._id,
            category: location.category,
            type: location.type,
            division: location.division,
            name: location.name,
            status: location.status,
            latitude: parseFloat(location.latitude) || 0,
            longitude: parseFloat(location.longitude) || 0,
            description: location.description,
            url: location.url || "",
            image:
              locationImages[location._id]?.preview || location.image || "", // Use the correct image
          };

          const isNewLocation = location._id.startsWith("temp-");
          const endpoint = isNewLocation
            ? "/api/locations/addLocation"
            : "/api/locations/updateLocation";

          console.log(
            `Saving location ${index + 1} to ${endpoint}:`,
            locationData
          );

          const response = await ky
            .post(endpoint, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              json: locationData,
              timeout: 30000, // 30 second timeout
            })
            .json();

          console.log(`Location ${index + 1} saved successfully:`, response);
          return { success: true, data: response };
        } catch (err) {
          console.error(`Error saving location ${index + 1}:`, err);

          let errorMessage = err.message;

          // Try to extract more detailed error information
          if (err.response) {
            try {
              const errorBody = await err.response.json();
              errorMessage =
                errorBody.message || errorBody.error || errorMessage;
              console.error(
                `Server error details for location ${index + 1}:`,
                errorBody
              );
            } catch (parseError) {
              try {
                const errorText = await err.response.text();
                console.error(
                  `Raw server response for location ${index + 1}:`,
                  errorText
                );
                errorMessage = `Server error: ${errorText.substring(
                  0,
                  100
                )}...`;
              } catch (textError) {
                console.error(
                  `Could not read error response for location ${index + 1}`
                );
              }
            }
          }

          return {
            success: false,
            error: errorMessage,
            locationIndex: index,
            locationName: location.name,
          };
        }
      });

      console.log("Waiting for all save promises to complete...");
      const results = await Promise.all(savePromises);
      console.log("All save results:", results);

      const successfulSaves = results.filter((result) => result.success);
      const failedSaves = results.filter((result) => !result.success);

      if (failedSaves.length === 0) {
        // All locations saved successfully
        closeModal();

        // Refresh the locations list
        try {
          const refreshed = await ky.get("/api/locations").json();
          setLocations(refreshed);
          alert(`${successfulSaves.length} location(s) saved successfully!`);
        } catch (refreshError) {
          console.error("Error refreshing locations:", refreshError);
          alert(
            `${successfulSaves.length} location(s) saved successfully, but could not refresh the list.`
          );
        }
      } else {
        // Some saves failed
        const errorDetails = failedSaves
          .map(
            (failed) =>
              `Location "${failed.locationName}" (${
                failed.locationIndex + 1
              }): ${failed.error}`
          )
          .join("\n");

        alert(
          `${successfulSaves.length} location(s) saved successfully, but ${failedSaves.length} failed:\n\n${errorDetails}`
        );

        // You might want to keep the modal open for retry, or close it
        if (successfulSaves.length > 0) {
          // Optionally close modal if some succeeded, or keep open for retry
          closeModal();
          const refreshed = await ky.get("/api/locations").json();
          setLocations(refreshed);
        }
      }
    } catch (err) {
      console.error("Unexpected error in handleSaveAllLocations:", err);
      alert(
        `Unexpected error: ${err.message}. Please check the console for details.`
      );
    }
  };

  // Delete confirmation handlers
  const handleDeleteClick = (locationId, locationName) => {
    setDeleteModal({
      isOpen: true,
      locationId,
      locationName,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await ky.post("/api/locations/removeLocation", {
        headers: { Authorization: `Bearer ${accessToken}` },
        json: { id: deleteModal.locationId },
      });
      setLocations((prev) =>
        prev.filter((loc) => loc._id !== deleteModal.locationId)
      );
      setDeleteModal({ isOpen: false, locationId: null, locationName: "" });

      // Show success toast notification - ADD THIS LINE
      showToast(
        `Location "${deleteModal.locationName}" has been deleted successfully!`
      );
    } catch (error) {
      console.error("Error deleting location:", error);
      showToast("Failed to delete location. Please try again.", "error"); // ADD THIS LINE
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, locationId: null, locationName: "" });
  };

  const handleEditClick = (location) => {
    console.log("Location image URL:", location.image);

    // Go directly to edit mode, no confirmation needed
    setEditingLocation({ ...location });

    // Set image preview using the new locationImages state
    if (location.image) {
      setLocationImages((prev) => ({
        ...prev,
        [location._id]: {
          file: null,
          preview: location.image,
        },
      }));
    } else {
      // Clear any existing image for this location
      setLocationImages((prev) => {
        const newImages = { ...prev };
        delete newImages[location._id];
        return newImages;
      });
    }

    // Close any confirmation modal
    setEditModal({ isOpen: false, location: null });
  };

  // Remove the edit confirmation modal entirely, or keep it only for specific cases

  const handleEditCancel = () => {
    setEditModal({ isOpen: false, location: null });
  };

  // Save confirmation handlers
  const handleSaveClick = () => {
    setSaveModal({ isOpen: true });
  };

  const handleSaveConfirm = () => {
    setSaveModal({ isOpen: false });
    handleSaveAllLocations();
  };

  const handleSaveCancel = () => {
    setSaveModal({ isOpen: false });
  };

  // Cancel confirmation handlers
  const handleCancelClick = () => {
    setCancelModal({ isOpen: true });
  };

  const handleCancelConfirm = () => {
    setCancelModal({ isOpen: false });
    closeModal();
  };

  const handleCancelClose = () => {
    setCancelModal({ isOpen: false });
  };

  const handleSaveEdit = async () => {
    try {
      // Validate single location
      const errors = {};

      if (!editingLocation.category?.trim())
        errors.category = "Category is required";
      if (!editingLocation.type?.trim()) errors.type = "Type is required";
      if (!editingLocation.division?.trim())
        errors.division = "Division is required";
      if (!editingLocation.name?.trim()) errors.name = "Name is required";
      if (!editingLocation.status?.trim()) errors.status = "Status is required";
      if (!editingLocation.description?.trim())
        errors.description = "Description is required";

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);

        // FIX: Create validationResults array properly
        const validationResults = [{ index: 0, errors }];
        showValidationToast(validationResults);
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
        latitude: parseFloat(editingLocation.latitude) || 0,
        longitude: parseFloat(editingLocation.longitude) || 0,
        description: editingLocation.description,
        url: editingLocation.url || "",
        image:
          locationImages[editingLocation._id]?.preview ||
          editingLocation.image ||
          "", // Use the correct image
      };

      console.log("Saving single location:", locationData);

      const response = await ky
        .post(
          isNewLocation
            ? "/api/locations/addLocation"
            : "/api/locations/updateLocation",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            json: locationData,
            timeout: 30000,
          }
        )
        .json();

      console.log("Save success:", response);

      if (response.success) {
        closeModal();
        const refreshed = await ky.get("/api/locations").json();
        setLocations(refreshed);
        alert("Location saved successfully!");
      } else {
        alert(`Save failed: ${response.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save failed:", err);

      let errorMessage = err.message;

      if (err.response) {
        try {
          const errorBody = await err.response.json();
          errorMessage = errorBody.message || errorBody.error || errorMessage;
          console.error("Server error details:", errorBody);
        } catch (parseError) {
          try {
            const errorText = await err.response.text();
            console.error("Raw server response:", errorText);
            errorMessage = `Server error: ${errorText.substring(0, 100)}...`;
          } catch (textError) {
            console.error("Could not read error response");
          }
        }
      }

      alert(`Save failed: ${errorMessage}`);
    }
  };

  const handleImageUpload = (e, locationId) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.match("image.*")) {
        alert("Please select an image file (jpg, png, gif, etc.)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB");
        return;
      }

      setIsUploading(true);

      const reader = new FileReader();
      reader.onload = (ev) => {
        setLocationImages((prev) => ({
          ...prev,
          [locationId]: {
            file: file,
            preview: ev.target.result,
          },
        }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (locationId) => {
    setLocationImages((prev) => {
      const newImages = { ...prev };
      delete newImages[locationId];
      return newImages;
    });
  };

  const closeModal = () => {
    setEditingLocation(null);
    setEditingLocations([]);
    setOriginalEditingLocations([]);
    setValidationErrors({});
    setLocationImages({}); // Clear all images
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
    link.href = url;
    link.setAttribute("download", "locations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({
      isVisible: true,
      message,
      type,
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  // Close toast manually
  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
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
        {/* Filters */}
        <div className="filters-actions-row">
          <button
            className="add-location-button"
            onClick={handleOpenModalForNew}
          >
            Add New Location +
          </button>

          {/* Updated Status Filter with Icon */}
          <div className="filter-dropdown-ml">
            <div className="custom-select-wrapper">
              <FaFilter className="filter-icon" />
              <select
                className="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <FaChevronDown className="dropdown-arrow" />
            </div>
          </div>

          {/* Updated Date Picker with Icons */}
          <div className="date-picker">
            <div className="date-picker-wrapper">
              <FaCalendarAlt className="date-icon" />
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
                className="date-input"
                maxDate={endDate}
                popperPlacement="bottom"
                popperModifiers={{
                  offset: {
                    enabled: true,
                    offset: "0px, 10px",
                  },
                  preventOverflow: {
                    enabled: true,
                    escapeWithReference: false,
                    boundariesElement: "viewport",
                  },
                }}
              />
            </div>
            <div className="date-picker-wrapper">
              <FaCalendarAlt className="date-icon" />
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
                className="date-input"
                popperPlacement="bottom"
                popperModifiers={{
                  offset: {
                    enabled: true,
                    offset: "0px, 10px",
                  },
                  preventOverflow: {
                    enabled: true,
                    escapeWithReference: false,
                    boundariesElement: "viewport",
                  },
                }}
              />
            </div>
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

          {currentRows.map((location) => (
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
                  onClick={() => handleEditClick(location)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteClick(location._id, location.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {/* Pagination Controls */}
        <div
          className="pagination"
          role="navigation"
          aria-label="Location pages"
        >
          <button
            onClick={() => paginate(1)}
            aria-label="First page"
            disabled={currentPage === 1}
          >
            «
          </button>
          <button
            onClick={() => paginate(currentPage - 1)}
            aria-label="Previous page"
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {buildPageList(totalPages, currentPage).map((item, idx) =>
            item === "ellipsis" ? (
              <button
                key={`el-${idx}`}
                className="ellipsis"
                aria-hidden="true"
                disabled
              >
                ...
              </button>
            ) : (
              <button
                key={item}
                className={currentPage === item ? "active" : ""}
                onClick={() => paginate(item)}
                aria-label={`Go to page ${item}`}
                aria-current={currentPage === item ? "page" : undefined}
              >
                {item}
              </button>
            )
          )}

          <button
            onClick={() => paginate(currentPage + 1)}
            aria-label="Next page"
            disabled={currentPage === totalPages}
          >
            ›
          </button>
          <button
            onClick={() => paginate(totalPages)}
            aria-label="Last page"
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>

        {/* Edit Modal (Single Location) */}
        {editingLocation && (
          <div className="modal-overlay">
            <div className="MLmodal-content">
              <h3>
                {editingLocation?._id?.startsWith("temp-")
                  ? "Add New Location"
                  : "Edit Location"}
              </h3>

              <div className="event-form-container">
                {/* LEFT COLUMN */}
                <div className="event-form-left">
                  {/* Category Field */}
                  <div className="form-group">
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
                      <div className="error-message">
                        {validationErrors.category}
                      </div>
                    )}
                  </div>

                  {/* Type Field */}
                  <div className="form-group">
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
                      <option
                        value=""
                        className={
                          editingLocation.category ? "" : "red-text-option"
                        }
                      >
                        {editingLocation.category
                          ? "Select a type"
                          : "*Please select a category first"}
                      </option>
                      {editingLocation.category &&
                        getCurrentTypeOptions().map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                    </select>
                    {validationErrors.type && (
                      <div className="error-message">
                        {validationErrors.type}
                      </div>
                    )}
                  </div>

                  {/* Division Field */}
                  <div className="form-group">
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
                      className={`form-input ${
                        validationErrors.division ? "error-border" : ""
                      }`}
                    />
                    {validationErrors.division && (
                      <div className="error-message">
                        {validationErrors.division}
                      </div>
                    )}
                  </div>

                  {/* Location Name Field */}
                  <div className="form-group">
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
                      className={`form-input ${
                        validationErrors.name ? "error-border" : ""
                      }`}
                    />
                    {validationErrors.name && (
                      <div className="error-message">
                        {validationErrors.name}
                      </div>
                    )}
                  </div>

                  {/* Description Field */}
                  <div className="form-group">
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
                      className={`form-textarea ${
                        validationErrors.description ? "error-border" : ""
                      }`}
                    />
                    {validationErrors.description && (
                      <div className="error-message">
                        {validationErrors.description}
                      </div>
                    )}
                  </div>

                  {/* Website URL Field */}
                  <div className="form-group">
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
                      className="form-input"
                    />
                  </div>

                  {/* Status Field */}
                  <div className="form-group">
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
                      <div className="error-message">
                        {validationErrors.status}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="event-form-right">
                  {/* Image Upload */}
                  <div className="form-group">
                    <label>Image</label>
                    <div className="image-upload-container">
                      <div className="image-upload-area">
                        <input
                          type="file"
                          id={`image-upload-${editingLocation._id}`}
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, editingLocation._id)
                          }
                          className="image-file-input"
                        />
                        {locationImages[editingLocation._id]?.preview ? (
                          <div className="image-preview-wrapper">
                            <img
                              src={locationImages[editingLocation._id].preview}
                              alt="Preview"
                              className="image-preview"
                            />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={() => removeImage(editingLocation._id)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`image-upload-${editingLocation._id}`}
                            className="image-upload-label"
                          >
                            <div className="image-upload-placeholder">
                              <FaUpload className="upload-icon" />
                              <span>
                                {isUploading
                                  ? "Uploading..."
                                  : "Click to upload or drag and drop"}
                              </span>
                              <p className="image-upload-hint">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coordinates Row */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude</label>
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
                        placeholder="Latitude"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Longitude</label>
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
                        placeholder="Longitude"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Map Preview - Inside the columns layout */}
                  <div className="event-form-container">
                    <div className="event-form-left">
                      <div className="form-group">
                        <label>Map Preview</label>
                        <MapPreview
                          latitude={editingLocation.latitude}
                          longitude={editingLocation.longitude}
                          onChange={handleCoordinatesChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-button" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleSaveEdit}>
                  Save Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Multiple Locations Modal */}
        {editingLocations.length > 0 && (
          <div className="modal-overlay">
            <div className="MLmodal-content multiple-locations-modal">
              <div className="modal-header-with-navigation">
                <div className="navigation-header">
                  <h3>Add Multiple Locations</h3>
                  <div className="header-controls-row">
                    <div className="location-counter">
                      Location {currentLocationIndex + 1} of{" "}
                      {editingLocations.length}
                    </div>
                    <button
                      type="button"
                      className="add-another-btn"
                      onClick={() => {
                        handleAddLocation();
                        setTimeout(() => {
                          goToNextLocation();
                        }, 100);
                      }}
                    >
                      <FaPlus /> Add Another Location
                    </button>
                  </div>
                </div>
              </div>

              <div className="locations-form-container">
                {editingLocations.map((location, index) => (
                  <div
                    key={location._id}
                    className={`location-form-section ${
                      currentLocationIndex === index ? "active" : "hidden"
                    }`}
                  >
                    <div className="location-form-header">
                      <h4>Location #{index + 1}</h4>
                      {editingLocations.length > 1 && index > 0 && (
                        <button
                          type="button"
                          className="remove-location-btn"
                          onClick={() => handleRemoveLocation(index)}
                        >
                          <FaMinus /> Remove
                        </button>
                      )}
                    </div>

                    {/* Use the same two-column layout as single location modal */}
                    <div className="event-form-container">
                      {/* LEFT COLUMN */}
                      <div className="event-form-left">
                        {/* Category Field */}
                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            name="category"
                            value={location.category}
                            onChange={(e) => {
                              handleLocationChange(index, {
                                ...location,
                                category: e.target.value,
                                type: "",
                              });
                              clearValidationError(
                                `locations[${index}].category`
                              );
                            }}
                            className={`form-select ${
                              validationErrors[`locations[${index}].category`]
                                ? "error-border"
                                : ""
                            }`}
                          >
                            <option value="">Select a category</option>
                            {categoryOptions.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          {validationErrors[`locations[${index}].category`] && (
                            <div className="error-message">
                              {validationErrors[`locations[${index}].category`]}
                            </div>
                          )}
                        </div>

                        {/* Type Field */}
                        <div className="form-group">
                          <label>Type *</label>
                          <select
                            name="type"
                            value={location.type}
                            onChange={(e) => {
                              handleLocationChange(index, {
                                ...location,
                                type: e.target.value,
                              });
                              clearValidationError(`locations[${index}].type`);
                            }}
                            className={`form-select ${
                              validationErrors[`locations[${index}].type`]
                                ? "error-border"
                                : ""
                            }`}
                            disabled={!location.category}
                          >
                            <option
                              value=""
                              className={
                                location.category ? "" : "red-text-option"
                              }
                            >
                              {location.category
                                ? "Select a type"
                                : "*Please select a category first"}
                            </option>
                            {location.category &&
                              typeOptions[location.category]?.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                          </select>
                          {validationErrors[`locations[${index}].type`] && (
                            <div className="error-message">
                              {validationErrors[`locations[${index}].type`]}
                            </div>
                          )}
                        </div>

                        {/* Division Field */}
                        <div className="form-group">
                          <label>Division *</label>
                          <input
                            name="division"
                            value={location.division}
                            onChange={(e) => {
                              handleLocationChange(index, {
                                ...location,
                                division: e.target.value,
                              });
                              clearValidationError(
                                `locations[${index}].division`
                              );
                            }}
                            className={`form-input ${
                              validationErrors[`locations[${index}].division`]
                                ? "error-border"
                                : ""
                            }`}
                          />
                          {validationErrors[`locations[${index}].division`] && (
                            <div className="error-message">
                              {validationErrors[`locations[${index}].division`]}
                            </div>
                          )}
                        </div>

                        {/* Location Name Field */}
                        <div className="form-group">
                          <label>Location Name *</label>
                          <input
                            name="name"
                            value={location.name}
                            onChange={(e) => {
                              handleLocationChange(index, {
                                ...location,
                                name: e.target.value,
                              });
                              clearValidationError(`locations[${index}].name`);
                            }}
                            className={`form-input ${
                              validationErrors[`locations[${index}].name`]
                                ? "error-border"
                                : ""
                            }`}
                          />
                          {validationErrors[`locations[${index}].name`] && (
                            <div className="error-message">
                              {validationErrors[`locations[${index}].name`]}
                            </div>
                          )}
                        </div>

                        {/* Description Field */}
                        <div className="form-group">
                          <label>Description *</label>
                          <textarea
                            name="description"
                            value={location.description}
                            onChange={(e) => {
                              handleLocationChange(index, {
                                ...location,
                                description: e.target.value,
                              });
                              clearValidationError(
                                `locations[${index}].description`
                              );
                            }}
                            className={`form-textarea ${
                              validationErrors[
                                `locations[${index}].description`
                              ]
                                ? "error-border"
                                : ""
                            }`}
                          />
                          {validationErrors[
                            `locations[${index}].description`
                          ] && (
                            <div className="error-message">
                              {
                                validationErrors[
                                  `locations[${index}].description`
                                ]
                              }
                            </div>
                          )}
                        </div>

                        {/* Website URL Field */}
                        <div className="form-group">
                          <label>Website URL</label>
                          <input
                            name="url"
                            value={location.url || ""}
                            onChange={(e) =>
                              handleLocationChange(index, {
                                ...location,
                                url: e.target.value,
                              })
                            }
                            className="form-input"
                          />
                        </div>

                        {/* Status Field */}
                        <div className="form-group">
                          <label>Status *</label>
                          <select
                            className={`status-select ${
                              validationErrors[`locations[${index}].status`]
                                ? "error-border"
                                : ""
                            }`}
                            value={location.status}
                            onChange={(e) => {
                              handleLocationChange(index, {
                                ...location,
                                status: e.target.value,
                              });
                              clearValidationError(
                                `locations[${index}].status`
                              );
                            }}
                          >
                            <option value="">Select status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                          {validationErrors[`locations[${index}].status`] && (
                            <div className="error-message">
                              {validationErrors[`locations[${index}].status`]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="event-form-right">
                        {/* Image Upload */}
                        <div className="form-group">
                          <label>Image</label>
                          <div className="image-upload-container">
                            <div className="image-upload-area">
                              <input
                                type="file"
                                id={`image-upload-${location._id}`}
                                accept="image/*"
                                onChange={(e) =>
                                  handleImageUpload(e, location._id)
                                }
                                className="image-file-input"
                              />
                              {locationImages[location._id]?.preview ? (
                                <div className="image-preview-wrapper">
                                  <img
                                    src={locationImages[location._id].preview}
                                    alt="Preview"
                                    className="image-preview"
                                  />
                                  <button
                                    type="button"
                                    className="remove-image-btn"
                                    onClick={() => removeImage(location._id)}
                                  >
                                    <FaTimes />
                                  </button>
                                </div>
                              ) : (
                                <label
                                  htmlFor={`image-upload-${location._id}`}
                                  className="image-upload-label"
                                >
                                  <div className="image-upload-placeholder">
                                    <FaUpload className="upload-icon" />
                                    <span>
                                      {isUploading
                                        ? "Uploading..."
                                        : "Click to upload or drag and drop"}
                                    </span>
                                    <p className="image-upload-hint">
                                      PNG, JPG up to 5MB
                                    </p>
                                  </div>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Coordinates Row */}
                        <div className="form-row">
                          <div className="form-group">
                            <label>Latitude</label>
                            <input
                              type="number"
                              step="any"
                              name="latitude"
                              value={
                                location.latitude === 0 ? "" : location.latitude
                              }
                              onChange={(e) =>
                                handleLocationChange(index, {
                                  ...location,
                                  latitude: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="Latitude"
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label>Longitude</label>
                            <input
                              type="number"
                              step="any"
                              name="longitude"
                              value={
                                location.longitude === 0
                                  ? ""
                                  : location.longitude
                              }
                              onChange={(e) =>
                                handleLocationChange(index, {
                                  ...location,
                                  longitude: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="Longitude"
                              className="form-input"
                            />
                          </div>
                        </div>

                        {/* Map Preview */}

                        <div className="event-form-container">
                          <div className="event-form-left">
                            <div className="form-group">
                              <label>Map Preview</label>
                              <MapPreview
                                latitude={location.latitude}
                                longitude={location.longitude}
                                onChange={(lat, lng) =>
                                  handleLocationChange(index, {
                                    ...location,
                                    latitude: lat,
                                    longitude: lng,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Controls */}
              <div className="location-navigation-controls">
                {/* Side arrows for navigation */}
                {editingLocations.length > 1 && (
                  <div className="side-navigation-arrows">
                    <button
                      type="button"
                      className="side-nav-arrow left-arrow"
                      onClick={goToPrevLocation}
                      disabled={currentLocationIndex === 0}
                      aria-label="Previous location"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      className="side-nav-arrow right-arrow"
                      onClick={goToNextLocation}
                      disabled={
                        currentLocationIndex === editingLocations.length - 1
                      }
                      aria-label="Next location"
                    >
                      ›
                    </button>
                  </div>
                )}

                <div className="modal-actions">
                  <button className="cancel-button" onClick={handleCancelClick}>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleSaveClick}>
                    Save All Locations ({editingLocations.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Location"
          message={`Are you sure you want to delete "${deleteModal.locationName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="delete"
        />

        <SaveConfirmationModal
          isOpen={saveModal.isOpen}
          onClose={handleSaveCancel}
          onConfirm={handleSaveConfirm}
          onCancel={handleSaveCancel}
          locationCount={editingLocations.length}
        />

        <CancelConfirmationModal
          isOpen={cancelModal.isOpen}
          onClose={handleCancelClose}
          onConfirm={handleCancelConfirm}
          hasChanges={hasChanges()}
        />

        <ToastNotification
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />

        {/* ADD THIS VALIDATION TOAST */}
        <ValidationToastNotification
          messages={validationToast.messages}
          isVisible={validationToast.isVisible}
          onClose={closeValidationToast}
        />
      </div>
    </div>
  );
};

export default ManageLocation;

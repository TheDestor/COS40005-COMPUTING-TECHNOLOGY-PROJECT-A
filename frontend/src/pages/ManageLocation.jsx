import React, { useEffect, useState, useRef } from "react";
import {
  FaSearch,
  FaChevronUp,
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
  FaFilter,
  FaCalendarAlt,
  FaChevronDown,
  FaEdit,
  FaIdCard,
  FaInfoCircle,
  FaTag,
  FaList,
  FaMapMarkerAlt,
  FaClock,
  FaCamera,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import Sidebar from "../components/Sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/ManageLocation.css";
import ky from "ky";
import { useMap } from "react-leaflet";
import { useAuth } from "../context/AuthProvider";
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMapEvents } from "react-leaflet";
import { toast } from "sonner";

// Define Sarawak geographic boundaries and helpers
const SARAWAK_BOUNDS = {
  minLat: 0.85,
  maxLat: 5.45,
  minLng: 109.5,
  maxLng: 115.6,
};

const SARAWAK_RECT_BOUNDS = [
  [SARAWAK_BOUNDS.minLat, SARAWAK_BOUNDS.minLng],
  [SARAWAK_BOUNDS.maxLat, SARAWAK_BOUNDS.maxLng],
];

const isWithinSarawak = (lat, lng) => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= SARAWAK_BOUNDS.minLat &&
    lat <= SARAWAK_BOUNDS.maxLat &&
    lng >= SARAWAK_BOUNDS.minLng &&
    lng <= SARAWAK_BOUNDS.maxLng
  );
};

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

const LocationImageUploader = ({
  locationId,
  locationImages,
  setLocationImages,
  existingUrl = "", // 👈 new
}) => {
  const handleImageChange = (e) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image too large. Please use a file under 5 MB.");
      return;
    }

    // create instant preview
    const objectUrl = URL.createObjectURL(file);

    setLocationImages((prev) => ({
      ...prev,
      [locationId]: {
        file, // store actual File object
        preview: objectUrl, // temporary local preview
      },
    }));
  };

  // either user-picked preview or nothing
  const previewSrc = locationImages[locationId]?.preview || existingUrl || "";

  return (
    <div className="ml-image-upload-wrapper">
      <label className="ml-image-label">Location Image</label>

      <div
        className={`ml-image-dropzone ${previewSrc ? "has-image" : ""}`}
        onClick={() =>
          document.getElementById(`ml-image-input-${locationId}`).click()
        }
      >
        <input
          id={`ml-image-input-${locationId}`}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        <div className="ml-upload-inner">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Location"
              className="ml-upload-preview"
            />
          ) : (
            <>
              <FaCamera className="ml-upload-icon" />
              <span className="ml-upload-text">Upload location photo</span>
              <small className="ml-upload-hint">
                Click to choose image (JPG/PNG)
              </small>
            </>
          )}
        </div>
      </div>

      {previewSrc && (
        <button
          type="button"
          className="ml-remove-image-btn"
          onClick={(e) => {
            e.stopPropagation();
            setLocationImages((prev) => {
              const next = { ...prev };
              next[locationId] = { file: null, preview: "" };
              return next;
            });
          }}
        >
          <FaTimes style={{ marginRight: "4px" }} />
          Remove image
        </button>
      )}
    </div>
  );
};
const MapPreview = ({ latitude, longitude, onChange }) => {
  const mapRef = useRef();

  const MapEventsHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        if (!isWithinSarawak(lat, lng)) {
          toast.error("Selected coordinates are outside Sarawak.", {
            description:
              `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}. ` +
              `Valid lat ${SARAWAK_BOUNDS.latMin}–${SARAWAK_BOUNDS.latMax}, ` +
              `lng ${SARAWAK_BOUNDS.lngMin}–${SARAWAK_BOUNDS.lngMax}.`,
          });
          return; // do not update marker outside bounds
        }
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
    if (!isWithinSarawak(lat, lng)) {
      toast.error("Selected coordinates are outside Sarawak.", {
        description:
          `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}. ` +
          `Valid lat ${SARAWAK_BOUNDS.latMin}–${SARAWAK_BOUNDS.latMax}, ` +
          `lng ${SARAWAK_BOUNDS.lngMin}–${SARAWAK_BOUNDS.lngMax}.`,
      });
      return; // keep marker at last valid position
    }
    onChange(lat, lng);
  };

  const coordValid = isWithinSarawak(latitude, longitude);

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
      <div
        style={{
          marginBottom: "6px",
          fontSize: "13px",
          color: coordValid ? "#059669" : "#dc2626",
        }}
      >
        {coordValid ? "Within Sarawak" : "Outside Sarawak — adjust pin or input"}
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
        <Rectangle
          bounds={SARAWAK_RECT_BOUNDS}
          pathOptions={{ color: "#10b981", weight: 2, fillOpacity: 0.08 }}
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
    <div className="modal-overlay-ml">
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
    <div className="modal-overlay-ml">
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
    <div className="modal-overlay-ml">
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
          <button className="confirm-btn cancel-btn" onClick={onClose}>
            Continue Editing
          </button>
          <button className="confirm-btn save-btn" onClick={onConfirm}>
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mlContentRef = useRef(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  const scrollToTop = () => {
    if (mlContentRef.current) {
      mlContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = mlContentRef.current;
    if (!el) return;

    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 200);
    };

    el.addEventListener("scroll", onScroll);
    onScroll(); // initialize visibility
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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
    // keep state in sync; map handlers already prevent invalid changes
    setEditingLocation((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    const valid = isWithinSarawak(lat, lng);
    setValidationErrors((prev) => {
      const next = { ...prev };
      const key = "editing.coordinates";
      if (!valid) {
        next[key] =
          `Coordinates (${lat.toFixed(6)}, ${lng.toFixed(6)}) are outside Sarawak. ` +
          `Valid lat ${SARAWAK_BOUNDS.latMin}–${SARAWAK_BOUNDS.latMax}, ` +
          `lng ${SARAWAK_BOUNDS.lngMin}–${SARAWAK_BOUNDS.lngMax}.`;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const response = await ky.get("/api/locations").json();
        setLocations(response);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setLocations([]); // ensure array
      } finally {
        setIsLoadingLocations(false);
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
      "Zoo",
      "Aquarium",
      "Waterfall",
      "Theme Park",
      "Business Attraction",
    ],
    "Shopping & Leisure": [
      "Shopping Mall",
      "Supermarket",
      "Department Store",
      "Market",
      "Fitness Center",
      "Sport Center",
      "Park",
      "Business",
      "Others",
    ],
    "Food & Beverages": [
      "Traditional Sarawak",
      "Chinese Cuisine",
      "Malay Cuisine",
      "International Cuisine",
      "Cafe",
      "Street Food",
      "Seafood",
      "Dessert",
      "Bar",
      "Restaurant",
      "Fast Food",
      "Food Court",
      "Business",
      "Others",
    ],
    Transportation: [
      "Airport",
      "Bus Station",
      "Ferry Terminal",
      "Taxi & Ride Services",
      "Car Rental",
      "Motorcycle Rental",
      "Long Distance Transport",
      "Business",
      "Others",
    ],
    Accommodation: [
      "Hotel",
      "Resort",
      "Homestay",
      "Hostel",
      "Guest ",
      "Apartment",
      "Chalet",
      "Camp Site",
      "Business",
      "Others",
    ],
    "Tour Guide": [
      "Cultural Tours",
      "Adventure Tours",
      "Nature Tours",
      "City Tours",
      "Food Tours",
      "Photography Tours",
      "Eco Tours",
      "Specialized Tours",
      "Tour Information",
      "Tour Service",
      "Business",
      "General Tours",
    ],
  };

  const getCurrentTypeOptions = () =>
    editingLocation?.category
      ? typeOptions[editingLocation.category] || []
      : [];

  const getStatusClass = (status) =>
    status === "Active" ? "status-active" : "status-inactive";

  const getEffectiveCreatedDate = (loc) => {
    // Prefer createdAt if present, otherwise fallback to updatedAt
    return new Date(loc.updatedAt || loc.createdAt);
  };

  const isNewLocationIndicator = (loc) => {
    const created = getEffectiveCreatedDate(loc);
    if (isNaN(created.getTime())) return false;
    const minutes = (Date.now() - created.getTime()) / 60000;
    return minutes <= 10; // consider new if created within last 10 minutes
  };

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
  // Ensure sorting by newest first (backend already sorts; this is a safe client-side fallback)
  const sortedLocations = [...filteredLocations].sort((a, b) => {
    const aDate = getEffectiveCreatedDate(a).getTime();
    const bDate = getEffectiveCreatedDate(b).getTime();
    return bDate - aDate;
  });
  const currentRows = sortedLocations.slice(indexOfFirstRow, indexOfLastRow);

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

    // Manual entry validation
    if (
      typeof updatedLocation.latitude === "number" &&
      typeof updatedLocation.longitude === "number"
    ) {
      const valid = isWithinSarawak(
        updatedLocation.latitude,
        updatedLocation.longitude
      );
      setValidationErrors((prev) => {
        const next = { ...prev };
        const key = `locations[${index}].coordinates`;
        if (!valid) {
          next[key] =
            "Coordinates are outside Sarawak. " +
            `Valid lat ${SARAWAK_BOUNDS.latMin}–${SARAWAK_BOUNDS.latMax}, ` +
            `lng ${SARAWAK_BOUNDS.lngMin}–${SARAWAK_BOUNDS.lngMax}.`;
        } else {
          delete next[key];
        }
        return next;
      });
    }
  };
  const handleSaveAllLocations = async () => {
    try {
      // 1. Validate all locations before sending
      const validationResults = editingLocations.map((location, index) => {
        const errors = {};

        if (!location.category?.trim())
          errors.category = "Category is required";
        if (!location.type?.trim()) errors.type = "Type is required";
        if (!location.division?.trim())
          errors.division = "Division is required";
        if (!location.name?.trim()) errors.name = "Name is required";
        if (!location.status?.trim()) errors.status = "Status is required";

        // Description rules
        if (hasWordLongerThan(location.description || "", 30)) {
          errors.description = "No single word may exceed 30 characters.";
        } else if (!location.description?.trim()) {
          errors.description = "Description is required";
        }

        // URL rule: no spaces
        if (/\s/.test(location.url || "")) {
          errors.url = "URL cannot contain spaces.";
        }

        // Coordinates must be within Sarawak bounds
        const lat = parseFloat(location.latitude);
        const lon = parseFloat(location.longitude);
        if (!isWithinSarawak(lat, lon)) {
          errors.coordinates =
            `Coordinates must be within Sarawak. ` +
            `Lat ${SARAWAK_BOUNDS.latMin}–${SARAWAK_BOUNDS.latMax}, ` +
            `Lng ${SARAWAK_BOUNDS.lngMin}–${SARAWAK_BOUNDS.lngMax}.`;
        }

        return { index, errors };
      });

      // Prevent submission if any coordinates are invalid
      const hasErrors = validationResults.some(
        (r) => Object.keys(r.errors).length > 0
      );
      if (hasErrors) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          validationResults.forEach(({ index, errors }) => {
            Object.entries(errors).forEach(([k, v]) => {
              next[`locations[${index}].${k}`] = v;
            });
          });
          return next;
        });
        toast.error("Please fix validation errors before saving.", {
          description:
            "One or more locations have coordinates outside Sarawak.",
        });
        return; // stop submission
      }

      // 3. Start saving
      const t = toast.loading("Saving locations...");
      console.log("Starting to save locations:", editingLocations);

      // 4. Build an array of async save calls, one per location
      const savePromises = editingLocations.map(async (location, index) => {
        try {
          // Decide if this is a new location or update
          const isNewLocation = location._id.startsWith("temp-");
          const endpoint = isNewLocation
            ? "/api/locations/addLocation"
            : "/api/locations/updateLocation";

          // Check if this location has a new uploaded file in state
          const imgState = locationImages[location._id];
          const hasNewFile = imgState && imgState.file;

          if (hasNewFile) {
            // Case A: send multipart/form-data with the actual File
            const formData = new FormData();
            formData.append("id", location._id);
            formData.append("category", location.category);
            formData.append("type", location.type);
            formData.append("division", location.division);
            formData.append("name", location.name);
            formData.append("status", location.status);
            formData.append("latitude", parseFloat(location.latitude) || 0);
            formData.append("longitude", parseFloat(location.longitude) || 0);
            formData.append("description", location.description);
            formData.append("url", location.url || "");
            formData.append("image", imgState.file); // the real file

            const response = await ky
              .post(endpoint, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
                timeout: 30000,
              })
              .json();

            return {
              success: true,
              data: response,
              locationIndex: index,
              locationName: location.name,
            };
          } else {
            // Case B: no new image picked -> send JSON, keep old URL
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
              image: location.image || "", // keep existing
            };

            const response = await ky
              .post(endpoint, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                json: locationData,
                timeout: 30000,
              })
              .json();

            return {
              success: true,
              data: response,
              locationIndex: index,
              locationName: location.name,
            };
          }
        } catch (error) {
          console.error(
            `Error saving location ${index + 1} (${location.name}):`,
            error
          );
          return {
            success: false,
            error: error.message || "Unknown error",
            locationIndex: index,
            locationName: location.name,
          };
        }
      });

      // 5. Wait for all API calls to finish
      console.log("Waiting for all save promises to complete...");
      const results = await Promise.all(savePromises);
      console.log("All save results:", results);

      const successfulSaves = results.filter((r) => r.success);
      const failedSaves = results.filter((r) => !r.success);

      // 6. Handle result summary
      if (failedSaves.length === 0) {
        // all good
        closeModal();

        try {
          const refreshed = await ky.get("/api/locations").json();

          console.log("refreshed locations:", refreshed); // 👈 ADD THIS HERE
          setLocations(refreshed);
          toast.success(
            `${successfulSaves.length} location(s) saved successfully!`,
            { id: t }
          );
        } catch (refreshError) {
          console.error("Error refreshing locations:", refreshError);
          toast.error(
            `${successfulSaves.length} location(s) saved successfully, but could not refresh the list.`,
            { id: t }
          );
        }
      } else {
        // some failed
        const errorDetails = failedSaves
          .map(
            (item) =>
              `Location "${item.locationName}" (${item.locationIndex + 1}): ${
                item.error
              }`
          )
          .join("\n");

        toast.error(
          `${successfulSaves.length} location(s) saved successfully, but ${failedSaves.length} failed:\n\n${errorDetails}`,
          { id: t }
        );

        // still try partial refresh if at least one success
        if (successfulSaves.length > 0) {
          closeModal();
          const refreshed = await ky.get("/api/locations").json();
          setLocations(refreshed);
        }
      }
    } catch (err) {
      console.error("Unexpected error in handleSaveAllLocations:", err);
      toast.error(
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
      toast.success(
        `Location "${deleteModal.locationName}" has been deleted successfully!`
      );
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, locationId: null, locationName: "" });
  };

  const didLocationChange = () => {
    if (!editingLocation) return false;

    // 1. get the 'before' version
    const original = getOriginalForEditingLocation();
    if (!original) {
      // we couldn't find a snapshot. safest choice is assume changed so we DO save.
      return true;
    }

    // 2. fields to compare
    const fieldsToCheck = [
      "name",
      "category",
      "type",
      "division",
      "status",
      "latitude",
      "longitude",
      "description",
      "url",
      "image",
    ];

    for (const field of fieldsToCheck) {
      const beforeVal = original[field] ?? "";
      const afterVal = editingLocation[field] ?? "";

      if (String(beforeVal) !== String(afterVal)) {
        return true; // found a difference, so yes it's changed
      }
    }

    // 3. also consider if user picked a new file
    const imgState = locationImages?.[editingLocation._id];
    const hasNewFile = imgState && imgState.file;
    if (hasNewFile) return true;

    // 4. if we got here, nothing changed
    return false;
  };

  const handleEditClick = (location) => {
    // what user is editing right now
    setEditingLocation({ ...location });

    // snapshot BEFORE any edits, wrapped in an array
    setOriginalEditingLocations([{ ...location }]);

    let previewUrl = "";

    if (location.image) {
      // now everything should already be a full URL from Vercel Blob
      previewUrl = location.image;
    }

    console.log("Edit clicked location:", location);
    console.log("location.image from DB:", location.image);
    console.log("Resolved previewUrl for ManageLocation:", previewUrl);

    setLocationImages((prev) => ({
      ...prev,
      [location._id]: {
        file: null,
        preview: previewUrl,
      },
    }));
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

  const getOriginalForEditingLocation = () => {
    if (!editingLocation || !originalEditingLocations) return null;

    // if it's somehow not an array, wrap it
    const list = Array.isArray(originalEditingLocations)
      ? originalEditingLocations
      : [originalEditingLocations];

    return list.find((loc) => loc._id === editingLocation._id) || null;
  };

  const handleSaveEdit = async () => {
    try {
      // 0. If there's no real change, don't hit the API at all.
      const changed = didLocationChange();
      if (!changed) {
        // nothing changed -> don't bump updatedAt in DB
        setEditingLocation(null); // close modal
        toast.success("No changes to save.");
        return;
      }

      // 1. Detect whether it's a brand new temp row or existing DB row
      const isNewLocation = editingLocation._id.startsWith("temp-");
      const endpoint = isNewLocation
        ? "/api/locations/addLocation"
        : "/api/locations/updateLocation";

      // 2. Check for new image file this session
      const imgState = locationImages[editingLocation._id];
      const hasNewFile = imgState && imgState.file;

      let response;

      if (hasNewFile) {
        // multipart/form-data path
        const formData = new FormData();
        formData.append("id", editingLocation._id);
        formData.append("category", editingLocation.category);
        formData.append("type", editingLocation.type);
        formData.append("division", editingLocation.division);
        formData.append("name", editingLocation.name);
        formData.append("status", editingLocation.status);
        formData.append("latitude", parseFloat(editingLocation.latitude) || 0);
        formData.append(
          "longitude",
          parseFloat(editingLocation.longitude) || 0
        );
        formData.append("description", editingLocation.description);
        formData.append("url", editingLocation.url || "");
        formData.append("image", imgState.file);

        response = await ky
          .post(endpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
            timeout: 30000,
          })
          .json();
      } else {
        // JSON path (no new file)
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
          image: editingLocation.image || "",
        };

        response = await ky
          .post(endpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            json: locationData,
            timeout: 30000,
          })
          .json();
      }

      console.log("saveEdit response:", response);
      toast.success("Location saved.");

      // 3. Refetch fresh locations and update your UI
      const refreshed = await ky
        .get("/api/locations", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 30000,
        })
        .json();

      setLocations(refreshed);

      // 4. Close the modal
      setEditingLocation(null);
    } catch (err) {
      console.error("Failed to save location:", err);
      toast.error("Failed to save location. Check console.");
    }
  };

  const handleImageUpload = (e, locationId) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.match("image.*")) {
        toast.error("Please select an image file (jpg, png, gif, etc.)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Please select an image smaller than 5MB");
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
      toast.info("No data available to download.");
      return;
    }

    if (filteredLocations.length > 0) {
      toast.success("Location data download successfully.");
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

  const multiModalRef = useRef(null);

  useEffect(() => {
    if (editingLocations.length > 0 && multiModalRef.current) {
      // wait until layout paints, then scroll
      requestAnimationFrame(() => {
        multiModalRef.current.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }, [currentLocationIndex, editingLocations.length]);

  // Add near other constants
  const divisionOptions = [
    "Kuching",
    "Sibu",
    "Miri",
    "Bintulu",
    "Mukah",
    "Betong",
    "Samarahan",
    "Limbang",
    "Kapit",
    "Sri Aman",
    "Sarikei",
    "Serian",
  ];

  // Rough Sarawak bounding box (tweak if you have exact polygon)
  const isWithinSarawak = (lat, lon) => {
    if (lat == null || lon == null) return false;
    return lat >= 0.8 && lat <= 5.5 && lon >= 109.5 && lon <= 115.5;
  };

  const hasWordLongerThan = (text, limit) => {
    if (!text) return false;
    return text.split(/\s+/).some((w) => w.length > limit);
  };

  return (
    <div className="MLdashboard-container">
      <Sidebar />
      <div className="MLdashboard-content" ref={mlContentRef}>
        {/* Header */}
        <div className="dashboard-header">
          <div className="greeting">
            <h3>Manage Location</h3>
            <p>Manage and monitor locations' status</p>
          </div>
          <div className="dashboard-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-actions-row">
          <button
            className="add-location-button"
            onClick={handleOpenModalForNew}
          >
            + Add New Location
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
          {isLoadingLocations ? (
            <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
              Loading locations...
            </div>
          ) : locations.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
              No location found, please try refresh again.
            </div>
          ) : (
            <>
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
                  <div className="table-cell">
                    {isNewLocationIndicator(location) && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 18,
                          backgroundColor: "#ef4444",
                          borderRadius: "9999px",
                          marginRight: 6,
                          verticalAlign: "middle",
                        }}
                        aria-label="New"
                        title="New"
                      />
                    )}
                    {location._id}
                  </div>
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
                  <div className="table-cell">
                    {getTimeAgo(getEffectiveCreatedDate(location))}
                  </div>
                  <div className="table-cell">
                    <button
                      className="edit-button"
                      onClick={() => handleEditClick(location)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDeleteClick(location._id, location.name)
                      }
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
              ))}
              {/* Card view for very small screens */}
              <div className="MLcards-container">
                {currentRows.map((location) => (
                  <div key={`${location._id}-card`} className="MLcard">
                    <div className="MLcard-status">
                      <span
                        className={`MLstatus-badge ${getStatusClass(
                          location.status
                        )}`}
                      >
                        {location.status}
                      </span>
                      {isNewLocationIndicator(location) && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            backgroundColor: "#ef4444",
                            borderRadius: "9999px",
                            marginLeft: 6,
                            verticalAlign: "middle",
                          }}
                          aria-label="New"
                          title="New"
                        />
                      )}
                    </div>
                    <div className="MLcard-actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(location)}
                        aria-label="Edit location"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDeleteClick(location._id, location.name)
                        }
                        aria-label="Delete location"
                      >
                        <MdDelete />
                      </button>
                    </div>
                    <div className="MLcard-content">
                      <div className="MLcard-item">
                        <span className="MLcard-icon">
                          <FaIdCard />
                        </span>
                        <div className="MLcard-text">
                          <span className="MLcard-label">Location ID</span>
                          <span className="MLcard-value">{location._id}</span>
                        </div>
                      </div>
                      <div className="MLcard-item">
                        <span className="MLcard-icon">
                          <FaInfoCircle />
                        </span>
                        <div className="MLcard-text">
                          <span className="MLcard-label">Name</span>
                          <span className="MLcard-value">{location.name}</span>
                        </div>
                      </div>
                      <div className="MLcard-item">
                        <span className="MLcard-icon">
                          <FaTag />
                        </span>
                        <div className="MLcard-text">
                          <span className="MLcard-label">Category</span>
                          <span className="MLcard-value">
                            {location.category}
                          </span>
                        </div>
                      </div>
                      <div className="MLcard-item">
                        <span className="MLcard-icon">
                          <FaList />
                        </span>
                        <div className="MLcard-text">
                          <span className="MLcard-label">Type</span>
                          <span className="MLcard-value">{location.type}</span>
                        </div>
                      </div>
                      <div className="MLcard-item">
                        <span className="MLcard-icon">
                          <FaMapMarkerAlt />
                        </span>
                        <div className="MLcard-text">
                          <span className="MLcard-label">Division</span>
                          <span className="MLcard-value">
                            {location.division}
                          </span>
                        </div>
                      </div>
                      <div className="MLcard-item">
                        <span className="MLcard-icon">
                          <FaClock />
                        </span>
                        <div className="MLcard-text">
                          <span className="MLcard-label">Last Updated</span>
                          <span className="MLcard-value">
                            {getTimeAgo(getEffectiveCreatedDate(location))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

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
          <div className="modal-overlay-ml">
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
                      <div className="error-message-ml">
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
                      <div className="error-message-ml">
                        {validationErrors.type}
                      </div>
                    )}
                  </div>

                  {/* Division Field */}
                  <div className="form-group">
                    <label>Division *</label>
                    <select
                      name="division"
                      value={editingLocation.division}
                      onChange={(e) => {
                        setEditingLocation({
                          ...editingLocation,
                          division: e.target.value,
                        });
                        clearValidationError("division");
                      }}
                      className={`form-select ${
                        validationErrors.division ? "error-border" : ""
                      }`}
                    >
                      <option value="">Select division</option>
                      {divisionOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {validationErrors.division && (
                      <div className="error-message-ml">
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
                      <div className="error-message-ml">
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
                        const val = e.target.value;
                        setEditingLocation({
                          ...editingLocation,
                          description: val,
                        });
                        if (hasWordLongerThan(val, 30)) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            description:
                              "No single word may exceed 30 characters.",
                          }));
                        } else {
                          clearValidationError("description");
                        }
                      }}
                      className={`form-textarea ${
                        validationErrors.description ? "error-border" : ""
                      }`}
                    />
                    {validationErrors.description && (
                      <div className="error-message-ml">
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingLocation({
                          ...editingLocation,
                          url: val,
                        });
                        if (/\s/.test(val)) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            url: "URL cannot contain spaces.",
                          }));
                        } else {
                          clearValidationError("url");
                        }
                      }}
                      className={`form-input ${
                        validationErrors.url ? "error-border" : ""
                      }`}
                    />
                    {validationErrors.url && (
                      <div className="error-message-ml">
                        {validationErrors.url}
                      </div>
                    )}
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
                      <div className="error-message-ml">
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
                    <LocationImageUploader
                      locationId={editingLocation._id}
                      locationImages={locationImages}
                      setLocationImages={setLocationImages}
                    />
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
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value) || 0;
                          const lon = editingLocation.longitude ?? 0;
                          setEditingLocation({
                            ...editingLocation,
                            latitude: lat,
                          });
                          if (!isWithinSarawakBounds(lat, lon)) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              latitude: "Location is outside Sarawak boundary.",
                            }));
                          } else {
                            clearValidationError("latitude");
                            clearValidationError("longitude");
                          }
                        }}
                        placeholder="Latitude"
                        className={`form-input ${
                          validationErrors.latitude ? "error-border" : ""
                        }`}
                      />
                      {validationErrors.latitude && (
                        <div className="error-message-ml">
                          {validationErrors.latitude}
                        </div>
                      )}
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
                        onChange={(e) => {
                          const lon = parseFloat(e.target.value) || 0;
                          const lat = editingLocation.latitude ?? 0;
                          setEditingLocation({
                            ...editingLocation,
                            longitude: lon,
                          });
                          if (!isWithinSarawakBounds(lat, lon)) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              longitude:
                                "Location is outside Sarawak boundary.",
                            }));
                          } else {
                            clearValidationError("longitude");
                            clearValidationError("latitude");
                          }
                        }}
                        placeholder="Longitude"
                        className={`form-input ${
                          validationErrors.longitude ? "error-border" : ""
                        }`}
                      />
                      {validationErrors.longitude && (
                        <div className="error-message-ml">
                          {validationErrors.longitude}
                        </div>
                      )}
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

              <div className="modal-actions-ml">
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
          <div className="modal-overlay-ml">
            <div
              className="MLmodal-content multiple-locations-modal"
              ref={multiModalRef}
            >
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
                            <div className="error-message-ml">
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
                            <div className="error-message-ml">
                              {validationErrors[`locations[${index}].type`]}
                            </div>
                          )}
                        </div>

                        {/* Division Field */}
                        <div className="form-group">
                          <label>Division *</label>
                          <select
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
                            className={`form-select ${
                              validationErrors[`locations[${index}].division`]
                                ? "error-border"
                                : ""
                            }`}
                          >
                            <option value="">Select division</option>
                            {divisionOptions.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          {validationErrors[`locations[${index}].division`] && (
                            <div className="error-message-ml">
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
                            <div className="error-message-ml">
                              {validationErrors[`locations[${index}].name`]}
                            </div>
                          )}
                        </div>

                        {/* Description Field */}
                        <label>Description *</label>
                        <textarea
                          name="description"
                          value={location.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleLocationChange(index, {
                              ...location,
                              description: val,
                            });
                            // live-validate: no single word > 30 chars
                            if (hasWordLongerThan(val, 30)) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                [`locations[${index}].description`]:
                                  "No single word may exceed 30 characters.",
                              }));
                            } else {
                              clearValidationError(
                                `locations[${index}].description`
                              );
                            }
                          }}
                          className={`form-textarea ${
                            validationErrors[`locations[${index}].description`]
                              ? "error-border"
                              : ""
                          }`}
                        />
                        {validationErrors[
                          `locations[${index}].description`
                        ] && (
                          <div className="error-message-ml">
                            {
                              validationErrors[
                                `locations[${index}].description`
                              ]
                            }
                          </div>
                        )}

                        {/* Website URL Field */}
                        <div className="form-group">
                          <label>Website URL</label>
                          <input
                            name="url"
                            value={location.url || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleLocationChange(index, {
                                ...location,
                                url: val,
                              });
                              if (/\s/.test(val)) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  [`locations[${index}].url`]:
                                    "URL cannot contain spaces.",
                                }));
                              } else {
                                clearValidationError(`locations[${index}].url`);
                              }
                            }}
                            className={`form-input ${
                              validationErrors[`locations[${index}].url`]
                                ? "error-border"
                                : ""
                            }`}
                          />
                          {validationErrors[`locations[${index}].url`] && (
                            <div className="error-message-ml">
                              {validationErrors[`locations[${index}].url`]}
                            </div>
                          )}
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
                            <div className="error-message-ml">
                              {validationErrors[`locations[${index}].status`]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="event-form-right">
                        <LocationImageUploader
                          locationId={location._id}
                          locationImages={locationImages}
                          setLocationImages={setLocationImages}
                        />

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
                              onChange={(e) => {
                                const lat = parseFloat(e.target.value) || 0;
                                const lon = location.longitude ?? 0;
                                handleLocationChange(index, {
                                  ...location,
                                  latitude: lat,
                                });
                                if (!isWithinSarawakBounds(lat, lon)) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    [`locations[${index}].latitude`]:
                                      "Location is outside Sarawak boundary.",
                                  }));
                                } else {
                                  clearValidationError(
                                    `locations[${index}].latitude`
                                  );
                                  clearValidationError(
                                    `locations[${index}].longitude`
                                  );
                                }
                              }}
                              placeholder="Latitude"
                              className={`form-input ${
                                validationErrors[`locations[${index}].latitude`]
                                  ? "error-border"
                                  : ""
                              }`}
                            />
                            {validationErrors[
                              `locations[${index}].latitude`
                            ] && (
                              <div className="error-message-ml">
                                {
                                  validationErrors[
                                    `locations[${index}].latitude`
                                  ]
                                }
                              </div>
                            )}
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
                              onChange={(e) => {
                                const lon = parseFloat(e.target.value) || 0;
                                const lat = location.latitude ?? 0;
                                handleLocationChange(index, {
                                  ...location,
                                  longitude: lon,
                                });
                                if (!isWithinSarawakBounds(lat, lon)) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    [`locations[${index}].longitude`]:
                                      "Location is outside Sarawak boundary.",
                                  }));
                                } else {
                                  clearValidationError(
                                    `locations[${index}].longitude`
                                  );
                                  clearValidationError(
                                    `locations[${index}].latitude`
                                  );
                                }
                              }}
                              placeholder="Longitude"
                              className={`form-input ${
                                validationErrors[
                                  `locations[${index}].longitude`
                                ]
                                  ? "error-border"
                                  : ""
                              }`}
                            />
                            {validationErrors[
                              `locations[${index}].longitude`
                            ] && (
                              <div className="error-message-ml">
                                {
                                  validationErrors[
                                    `locations[${index}].longitude`
                                  ]
                                }
                              </div>
                            )}
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
                      onClick={() => {
                        goToPrevLocation();
                      }}
                      disabled={currentLocationIndex === 0}
                      aria-label="Previous location"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      className="side-nav-arrow right-arrow"
                      onClick={() => {
                        goToNextLocation();
                      }}
                      disabled={
                        currentLocationIndex === editingLocations.length - 1
                      }
                      aria-label="Next location"
                    >
                      ›
                    </button>
                  </div>
                )}

                <div className="modal-actions-ml">
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

        <button
          className={`scroll-to-top-btn ${showScrollTop ? "visible" : ""}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <FaChevronUp className="scroll-to-top-icon" />
        </button>

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
      </div>
    </div>
  );
};

export default ManageLocation;

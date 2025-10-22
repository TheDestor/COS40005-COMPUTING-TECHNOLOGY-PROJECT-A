import React, { useEffect, useMemo, useState } from 'react';
import '../styles/ManageBusiness.css';
import { useAuth } from '../context/AuthProvider';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { FaSearch, FaCamera, FaUpload, FaTimes, FaEye, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { RiArrowGoBackLine } from 'react-icons/ri';
import { FaBuilding, FaMapMarkerAlt, FaTags, FaUser } from 'react-icons/fa';
import { MdEmail } from "react-icons/md";
import { toast, Toaster } from 'sonner';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

const Recenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
};

const statusBadge = (s) => {
  const st = (s || '').toLowerCase();
  if (st === 'approved') return { text: 'Approved', className: 'mb-badge approved' };
  if (st === 'pending') return { text: 'Pending', className: 'mb-badge pending' };
  if (st === 'rejected' || st === 're-amend') return { text: 'Re-amend', className: 'mb-badge rejected' };
  return { text: s || 'Unknown', className: 'mb-badge' };
};

// Small helpers
const StatPill = ({ label, value, tone }) => (
  <div className={`mb-stat ${tone || ''}`}>
    <div className="mb-stat-value">{value}</div>
    <div className="mb-stat-label">{label}</div>
  </div>
);

const SectionCard = ({ title, children, right }) => (
  <div className="mb-card-block">
    <div className="mb-card-head">
      <div className="mb-card-title">{title}</div>
      {right}
    </div>
    <div className="mb-card-body">{children}</div>
  </div>
);

const Tabs = ({ active, setActive }) => (
  <div className="mb-tabs">
    {['Overview','Edit'].map(t => (
      <button
        key={t}
        className={`mb-tab ${active === t ? 'active' : ''}`}
        onClick={() => setActive(t)}
      >
        {t}
      </button>
    ))}
  </div>
);

// Image Preview Modal Component
const ImagePreviewModal = ({ isOpen, onClose, businessImage, ownerAvatar, businessName, ownerName }) => {
  if (!isOpen) return null;

  return (
    <div className="mb-modal-overlay" onClick={onClose}>
      <div className="mb-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mb-modal-header">
          <h3>Image Preview</h3>
          <button className="mb-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="mb-modal-body">
          <div className="mb-image-preview-grid">
            <div className="mb-preview-item">
              <h4>Business Image</h4>
              <div className="mb-preview-image-container">
                {businessImage ? (
                  <img src={businessImage} alt={`${businessName} preview`} />
                ) : (
                  <div className="mb-preview-placeholder">
                    <FaBuilding />
                    <span>No Business Image</span>
                  </div>
                )}
              </div>
              <p>{businessName}</p>
            </div>
            <div className="mb-preview-item">
              <h4>Owner Avatar</h4>
              <div className="mb-preview-image-container">
                {ownerAvatar ? (
                  <img src={ownerAvatar} alt={`${ownerName} avatar`} />
                ) : (
                  <div className="mb-preview-placeholder">
                    <FaUser />
                    <span>No Owner Avatar</span>
                  </div>
                )}
              </div>
              <p>{ownerName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, businessData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="mb-modal-overlay" onClick={onClose}>
      <div className="mb-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mb-modal-header">
          <h3>Confirm Submission</h3>
          <button className="mb-modal-close" onClick={onClose} disabled={loading}>
            <FaTimes />
          </button>
        </div>
        <div className="mb-modal-body">
          <div className="mb-confirmation-content">
            <div className="mb-confirmation-icon">
              <FaExclamationTriangle />
            </div>
            <h4>Please review your changes before submitting</h4>
            <p>Your business details will be sent to administrators for review. Once submitted, the status will change to "Pending" until approved.</p>
            
            <div className="mb-changes-summary">
              <h5>Changes Summary:</h5>
              <div className="mb-changes-list">
                {businessData.name && (
                  <div className="mb-change-item">
                    <strong>Business Name:</strong> {businessData.name}
                  </div>
                )}
                {businessData.address && (
                  <div className="mb-change-item">
                    <strong>Address:</strong> {businessData.address}
                  </div>
                )}
                {businessData.phone && (
                  <div className="mb-change-item">
                    <strong>Phone:</strong> {businessData.phone}
                  </div>
                )}
                {businessData.website && (
                  <div className="mb-change-item">
                    <strong>Website:</strong> {businessData.website}
                  </div>
                )}
                {businessData.latitude && businessData.longitude && (
                  <div className="mb-change-item">
                    <strong>Location:</strong> {businessData.latitude}, {businessData.longitude}
                  </div>
                )}
                {(businessData.businessImageFile || businessData.ownerAvatarFile) && (
                  <div className="mb-change-item">
                    <strong>Images Updated:</strong> 
                    {businessData.businessImageFile && " Business Image"}
                    {businessData.businessImageFile && businessData.ownerAvatarFile && " and "}
                    {businessData.ownerAvatarFile && " Owner Avatar"}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-confirmation-actions">
              <button 
                className="mb-confirm-btn mb-confirm-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="mb-confirm-btn mb-confirm-submit"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="mb-btn-spinner" /> Submitting...
                  </>
                ) : (
                  <>
                    <FaCheck /> Confirm & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function ManageBusiness() {
  const { user, accessToken, isLoggedIn } = useAuth();

  // Check if user has business role
  if (!isLoggedIn || user?.role !== 'business') {
    return (
      <div className="mb-page">
        <div className="mb-headerbar">
          <div>
            <div className="mb-title">Access Denied</div>
            <p className="mb-subtitle">This page is restricted to business users only.</p>
          </div>
        </div>
        <div className="mb-content">
          <div className="mb-card-block">
            <div className="mb-card-body">
              <div className="mb-empty">
                You need to be logged in as a business user to access this page.
                <br />
                <br />
                <button 
                  className="mb-btn"
                  onClick={() => window.location.href = '/'}
                >
                  Go Back to Map
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [businesses, setBusinesses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dirtyFields, setDirtyFields] = useState({});
  const [baseForm, setBaseForm] = useState(null);
  const [businessImageFile, setBusinessImageFile] = useState(null);
  const [ownerAvatarFile, setOwnerAvatarFile] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const LIMIT = 500;
  const countNonSpace = (s) => (s || '').replace(/\s/g, '').length;
  const trimToLimitByNonSpace = (s, limit = LIMIT) => {
    let n = 0, out = '';
    for (const ch of String(s ?? '')) {
      if (!/\s/.test(ch)) n++;
      if (n > limit) break;
      out += ch;
    }
    return out;
  };

  // Add: detect any run of 30 or more non-space characters
  const hasConsecutiveNonSpaceRun = (s, max = 30) => /\S{30,}/.test(String(s || ''));

  const sanitizeInput = (val, type = 'text') => {
    let v = String(val ?? '');
    v = v.replace(/\s+/g, ' ').trimStart();
    switch (type) {
      case 'phone':
        v = v.replace(/[^0-9-]/g, ''); // digits and dashes only
        break;
      case 'url':
        v = v.replace(/[^\w\-.:/?#%&=+@~!*'();,]+/gi, '');
        break;
      case 'coord':
        v = v.replace(/[^0-9.\-\s]/g, '')
             .replace(/(?!^)-/g, '')
             .replace(/(\..*)\./g, '$1');
        break;
      default:
        v = v.replace(/[\u0000-\u001F\u007F]/g, '');
    }
    return trimToLimitByNonSpace(v, LIMIT);
  };

  const validators = {
    name: (v) => countNonSpace(v) < 1 ? 'Name is required.' : '',
    description: (_) => '',
    address: (v) => countNonSpace(v) < 1 ? 'Address is required.' : '',
    description: (v) => {
      if (!v) return '';
      return hasConsecutiveNonSpaceRun(v, 30)
        ? 'Description must not contain a sequence of 30+ non-space characters.'
        : '';
    },
    phone: (v) => {
      if (!v) return '';
      return /^(\d{3}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4})$/.test(v) ? '' : 'Phone must be XXX-XXX-XXXX or XXX-XXXX-XXXX.';
    },
    openingHours: (_) => '',
    latitude: (v) => {
      if (!v) return 'Latitude is required.';
      const num = Number(v);
      if (isNaN(num)) return 'Latitude must be a number.';
      if (num < -90 || num > 90) return 'Latitude must be between -90 and 90.';
      return '';
    },
    longitude: (v) => {
      if (!v) return 'Longitude is required.';
      const num = Number(v);
      if (isNaN(num)) return 'Longitude must be a number.';
      if (num < -180 || num > 180) return 'Longitude must be between -180 and 180.';
      return '';
    }
  };
  const handleChange = (name, value) => {
    const type =
      name === 'phone' ? 'phone' :
      name === 'website' ? 'url' :
      (name === 'latitude' || name === 'longitude') ? 'coord' : 'text';
    const nextVal = sanitizeInput(value, type);
    setForm(prev => ({ ...prev, [name]: nextVal }));
    setFormErrors(prev => ({ ...prev, [name]: validators[name]?.(nextVal) || '' }));
    setDirtyFields(prev => ({ ...prev, [name]: true }));
  };

  const canSubmit = useMemo(() => {
    if (!form || !baseForm) return false;
    const keys = ['name','description','address','phone','website','openingHours','latitude','longitude'];
    const hasDirtyErrors = Object.entries(formErrors).some(([k, v]) => dirtyFields[k] && v);
    const requiredValid =
      !validators.name(form.name || '') &&
      !validators.address(form.address || '') &&
      !validators.latitude(form.latitude || '') &&
      !validators.longitude(form.longitude || '');
    const hasChanges = keys.some(k => (baseForm[k] || '') !== (form[k] || '')) || businessImageFile || ownerAvatarFile;
    return !!selected && isLoggedIn && !saving && requiredValid && !hasDirtyErrors && hasChanges;
  }, [selected, isLoggedIn, saving, form, baseForm, formErrors, dirtyFields, businessImageFile, ownerAvatarFile]);

  const authAxios = useMemo(() => {
    const inst = axios.create({
      baseURL: 'http://localhost:5050',
      withCredentials: true,
    });
    if (accessToken) inst.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    return inst;
  }, [accessToken]);

  useEffect(() => {
    document.body.classList.add('manage-business-body');
    return () => document.body.classList.remove('manage-business-body');
  }, []);

  const fetchUserBusinesses = async () => {
    if (!isLoggedIn || !accessToken) {
      setBusinesses([]);
      setSelected(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await authAxios.get('/api/businesses/my-submissions');
      const list = (r.data?.data || []).filter(Boolean);
      setBusinesses(list);
      if (list.length) {
        const b = list[0];
        setSelected(b);
        const nextForm = {
          name: b.name || '',
          description: b.description || '',
          address: b.address || '',
          phone: b.phone || '',
          website: b.website || '',
          openingHours: b.openingHours || '',
          latitude: b.latitude ?? '',
          longitude: b.longitude ?? '',
          businessImage: b.businessImage || '',
          ownerAvatar: b.ownerAvatar || ''
        };
        setForm(nextForm);
        setBaseForm(nextForm);
        setDirtyFields({});
      } else {
        setSelected(null);
        setForm(null);
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load your business submissions.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBusinesses();
  }, [isLoggedIn, accessToken]);

  const filtered = businesses.filter(b => {
    const passStatus = statusFilter === 'all' ? true : (b.status || '').toLowerCase() === statusFilter;
    const s = `${b.name} ${b.address} ${b.category}`.toLowerCase();
    return passStatus && s.includes(query.toLowerCase());
  });

  const onSelect = (b) => {
    setSelected(b);
    const nextForm = {
      name: b.name || '',
      description: b.description || '',
      address: b.address || '',
      phone: b.phone || '',
      website: b.website || '',
      openingHours: b.openingHours || '',
      latitude: b.latitude ?? '',
      longitude: b.longitude ?? '',
      businessImage: b.businessImage || '',
      ownerAvatar: b.ownerAvatar || ''
    };
    setForm(nextForm);
    setBaseForm(nextForm);
    setBusinessImageFile(null);
    setOwnerAvatarFile(null);
    setDirtyFields({});
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (type === 'businessImage') {
        setBusinessImageFile(file);
      } else if (type === 'ownerAvatar') {
        setOwnerAvatarFile(file);
      }
    }
  };

  const triggerFileInput = (type) => {
    if (type === 'businessImage') {
      document.getElementById('business-image-upload').click();
    } else if (type === 'ownerAvatar') {
      document.getElementById('owner-avatar-upload').click();
    }
  };

  const getFileName = (file, currentUrl) => {
    let fileName = 'No file selected';
    
    if (file) {
      fileName = file.name;
    } else if (currentUrl) {
      fileName = currentUrl.split('/').pop() || 'Current Image';
    }
    
    // Limit filename length to 25 characters
    if (fileName.length > 5) {
      const extension = fileName.split('.').pop();
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const truncatedName = nameWithoutExt.substring(0, 5);
      fileName = `${truncatedName}...${extension ? '.' + extension : ''}`;
    }
    
    return fileName;
  };

  const validateForm = () => {
    const all = ['name','description','address','phone','website','openingHours','latitude','longitude'];
    const errObj = {};
    all.forEach(k => { errObj[k] = validators[k]?.(form[k]) || ''; });
    
    if (Object.values(errObj).some(Boolean)) {
      setFormErrors(errObj);
      const msg = 'Please fix the highlighted errors before submitting.';
      setError(msg);
      toast.error(msg);
      return false;
    }
    return true;
  };

  const handleSubmitRequest = async () => {
    if (!selected || !isLoggedIn || !accessToken) return;

    // Validate form first
    if (!validateForm()) {
      setShowConfirmationModal(false);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('address', form.address);
      formData.append('phone', form.phone);
      formData.append('website', form.website);
      formData.append('openingHours', form.openingHours);
      formData.append('latitude', form.latitude);
      formData.append('longitude', form.longitude);
      
      // Append images if changed
      if (businessImageFile) {
        formData.append('businessImage', businessImageFile);
      }
      if (ownerAvatarFile) {
        formData.append('ownerAvatar', ownerAvatarFile);
      }

      const upd = await authAxios.put(`/api/businesses/updateMyBusiness/${selected._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const stat = await authAxios.patch(`/api/businesses/updateMyBusinessStatus/${selected._id}`, { status: 'pending' });
      
      if (upd.data?.success) {
        const updated = { ...upd.data.data, status: stat.data?.data?.status || 'pending' };
        setBusinesses(prev => prev.map(x => (x._id === updated._id ? updated : x)));
        setSelected(updated);
        setBusinessImageFile(null);
        setOwnerAvatarFile(null);
        setBaseForm(form);
        setShowConfirmationModal(false);
        toast.success('Changes submitted successfully! Your business is now pending admin review.');
      } else {
        const msg = upd.data?.message || 'Failed to submit update.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit update.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const stats = {
    total: businesses.length,
    pending: businesses.filter(b => (b.status || '').toLowerCase() === 'pending').length,
    approved: businesses.filter(b => (b.status || '').toLowerCase() === 'approved').length,
    reamend: businesses.filter(b => ['re-amend','rejected'].includes((b.status||'').toLowerCase())).length
  };

  return (
    <div className="mb-page">
      {/* HEADER */}
      <div className="mb-headerbar">
        <div className="mb-header-content">
          <div className="mb-title">Manage Your Business</div>
          <p className="mb-subtitle">Review your submissions, update details, and request admin review.</p>
        </div>
        <div className="mb-header-right">
          <button
            className="mb-back"
            onClick={() => (window.location.href = '/')}
            title="Back to map"
          >
            <RiArrowGoBackLine />
          </button>
        </div>
      </div>

      {/* CHIPS + INLINE SEARCH */}
      <div className="mb-chiprow">
        <div className="mb-chips">
          {['all','pending','approved','re-amend'].map(s => {
            const count = s === 'all' ? stats.total
              : s === 'pending' ? stats.pending
              : s === 'approved' ? stats.approved
              : stats.reamend;
            const text = s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1);
            return (
              <button
                key={s}
                className={`mb-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                <span className="mb-chip-count">{count}</span> {text}
              </button>
            );
          })}
        </div>
        <div className="mb-search-wrap mb-search-inline">
          <FaSearch className="mb-search-ico" />
          <input
            className="mb-search"
            placeholder="Search by name, address or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="mb-loading">Loading...</div>
      ) : (
        <div className="mb-content">
          {/* LEFT LIST */}
          <SectionCard title="Submitted Forms">
            <div className="mb-list">
              {filtered.length === 0 ? (
                <div className="mb-empty">No business submissions found for your account.</div>
              ) : (
                filtered.map((b, i) => {
                  const badge = statusBadge(b.status);
                  return (
                    <div
                      key={b._id}
                      className={`mb-item ${selected?._id === b._id ? 'selected' : ''}`}
                      onClick={() => onSelect(b)}
                    >
                      <div className="mb-item-top">
                        <div className="mb-item-name">Submitted Form {i + 1}</div>
                        <span className={badge.className}>{badge.text}</span>
                      </div>
                      <div className="mb-item-name-strong"><FaBuilding className="mb-ico" />{b.name}</div>
                      <div className="mb-item-addr"><FaMapMarkerAlt className="mb-ico" />{b.address}</div>
                      <div className="mb-item-meta"><MdEmail className="mb-ico" />{b.ownerEmail}</div>
                      <div className="mb-item-meta"><FaTags className="mb-ico" />{b.category}</div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>

          {/* RIGHT DETAIL */}
          <div className="mb-rightstack">
            {selected ? (
              <SectionCard 
                title="Business Details"
                right={
                  <button 
                    className="mb-preview-btn"
                    onClick={() => setShowImageModal(true)}
                    title="Preview Images"
                  >
                    <FaEye /> Preview Images
                  </button>
                }
              >
                <div className="mb-compact-layout">
                  <div className="mb-compact-grid">
                    {/* Map Section */}
                    <div className="mb-map-section">
                      <div className="mb-map-body">
                        {(() => {
                          const lat = Number(form.latitude);
                          const lng = Number(form.longitude);
                          const has = Number.isFinite(lat) && Number.isFinite(lng);
                          const center = has ? [lat, lng] : [1.5533, 110.3592];
                          return (
                            <MapContainer center={center} zoom={has ? 15 : 12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                              {has && (
                                <>
                                  <Marker
                                    position={[lat, lng]}
                                    icon={defaultIcon}
                                    draggable={true}
                                    eventHandlers={{
                                      dragend: (e) => {
                                        const ll = e.target.getLatLng();
                                        setForm(prev => ({ 
                                          ...prev, 
                                          latitude: String(ll.lat), 
                                          longitude: String(ll.lng) 
                                        }));
                                      }
                                    }}
                                  />
                                  <Recenter lat={lat} lng={lng} />
                                </>
                              )}
                            </MapContainer>
                          );
                        })()}
                      </div>
                      {/* Editable Coordinates under the map */}
                      <div className="mb-coord-inputs">
                        <div className="mb-field">
                          <input
                            type="text"
                            className={`mb-input ${formErrors.latitude ? 'invalid' : ''}`}
                            value={form.latitude || ''}
                            onChange={(e) => handleChange('latitude', e.target.value)}
                            placeholder="e.g., 1.5533"
                            disabled={saving}
                          />
                          <label>Latitude</label>
                          {formErrors.latitude && <div className="mb-coord-error">{formErrors.latitude}</div>}
                        </div>
                        <div className="mb-field">
                          <input
                            type="text"
                            className={`mb-input ${formErrors.longitude ? 'invalid' : ''}`}
                            value={form.longitude || ''}
                            onChange={(e) => handleChange('longitude', e.target.value)}
                            placeholder="e.g., 110.3592"
                            disabled={saving}
                          />
                          <label>Longitude</label>
                          {formErrors.longitude && <div className="mb-coord-error">{formErrors.longitude}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Form Section */}
                    <form id="mb-edit-form" onSubmit={handleSubmitClick} className="mb-form-section">
                      {/* Image Upload Section */}
                      <div className="mb-image-upload-section">
                        <div className="mb-image-upload-row">
                          <div className="mb-upload-group">
                            <label className="mb-upload-label">
                              <FaBuilding /> Business Image
                            </label>
                            <div className="mb-upload-controls">
                              <input
                                type="file"
                                id="business-image-upload"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'businessImage')}
                                style={{ display: 'none' }}
                              />
                              <button
                                type="button"
                                className="mb-upload-btn"
                                onClick={() => triggerFileInput('businessImage')}
                              >
                                <FaUpload /> Upload
                              </button>
                              <span className="mb-file-name" title={businessImageFile ? businessImageFile.name : (form.businessImage || 'No file selected')}>
                                {getFileName(businessImageFile, form.businessImage)}
                              </span>
                            </div>
                          </div>

                          <div className="mb-upload-group">
                            <label className="mb-upload-label">
                              <FaUser /> Owner Avatar
                            </label>
                            <div className="mb-upload-controls">
                              <input
                                type="file"
                                id="owner-avatar-upload"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'ownerAvatar')}
                                style={{ display: 'none' }}
                              />
                              <button
                                type="button"
                                className="mb-upload-btn"
                                onClick={() => triggerFileInput('ownerAvatar')}
                              >
                                <FaUpload /> Upload
                              </button>
                              <span className="mb-file-name" title={ownerAvatarFile ? ownerAvatarFile.name : (form.ownerAvatar || 'No file selected')}>
                                {getFileName(ownerAvatarFile, form.ownerAvatar)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="mb-form-fields">
                        <div className="mb-field-row">
                          <div className="mb-field">
                            <input 
                              className={`mb-input ${formErrors.name ? 'invalid' : ''}`} 
                              name="name" 
                              value={form.name} 
                              onChange={(e) => handleChange('name', e.target.value)} 
                              required 
                              disabled={saving} 
                            />
                            <label>Business Name</label>
                            {formErrors.name && <div className="mb-field-error">{formErrors.name}</div>}
                          </div>
                          
                          <div className="mb-field">
                            <input 
                              className={`mb-input ${formErrors.phone ? 'invalid' : ''}`} 
                              name="phone" 
                              value={form.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              placeholder="XXX-XXX-XXXX or XXX-XXXX-XXXX" 
                              disabled={saving} 
                              pattern="\d{3}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4}" 
                              title="Format: XXX-XXX-XXXX or XXX-XXXX-XXXX" 
                            />
                            <label>Phone</label>
                            {formErrors.phone && <div className="mb-field-error">{formErrors.phone}</div>}
                          </div>
                        </div>

                        <div className="mb-field">
                          <textarea 
                            className={`mb-input ${formErrors.description ? 'invalid' : ''}`} 
                            name="description" 
                            rows={3} 
                            value={form.description} 
                            onChange={(e) => handleChange('description', e.target.value)} 
                            disabled={saving} 
                          />
                          <label>Description</label>
                          <div className="mb-hint">{countNonSpace(form.description)} / 500</div>
                          {formErrors.description && <div className="mb-field-error">{formErrors.description}</div>}
                        </div>
                        
                        <div className="mb-field">
                          <input 
                              className={`mb-input ${formErrors.address ? 'invalid' : ''}`} 
                              name="address" 
                              value={form.address} 
                              onChange={(e) => handleChange('address', e.target.value)} 
                              disabled={saving} 
                            />
                            <label>Address</label>
                            {formErrors.address && <div className="mb-field-error">{formErrors.address}</div>}
                        </div>

                        <div className="mb-field-row">
                          <div className="mb-field">
                            <input 
                              className={`mb-input ${formErrors.website ? 'invalid' : ''}`} 
                              name="website" 
                              value={form.website} 
                              onChange={(e) => handleChange('website', e.target.value)} 
                              placeholder="https://..." 
                              disabled={saving} 
                            />
                            <label>Website</label>
                            {formErrors.website && <div className="mb-field-error">{formErrors.website}</div>}
                          </div>
                          
                          <div className="mb-field">
                            <input 
                              className={`mb-input ${formErrors.openingHours ? 'invalid' : ''}`} 
                              name="openingHours" 
                              value={form.openingHours} 
                              onChange={(e) => handleChange('openingHours', e.target.value)} 
                              disabled={saving} 
                            />
                            <label>Opening Hours</label>
                            {formErrors.openingHours && <div className="mb-field-error">{formErrors.openingHours}</div>}
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                  
                  {/* Submit button placed at the bottom middle */}
                  <div className="mb-submit-section">
                    <div className="mb-actions">
                      <button type="submit" form="mb-edit-form" disabled={saving || !canSubmit}>
                        {saving ? <span className="mb-btn-spinner" /> : 'Submit Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard title="Details"><div className="mb-empty">Select a business on the left to view details.</div></SectionCard>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        businessImage={form?.businessImage}
        ownerAvatar={form?.ownerAvatar}
        businessName={form?.name}
        ownerName={selected?.owner}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleSubmitRequest}
        businessData={{
          name: form?.name,
          address: form?.address,
          phone: form?.phone,
          website: form?.website,
          latitude: form?.latitude,
          longitude: form?.longitude,
          businessImageFile: businessImageFile,
          ownerAvatarFile: ownerAvatarFile
        }}
        loading={saving}
      />
    </div>
  );
};

export default ManageBusiness;
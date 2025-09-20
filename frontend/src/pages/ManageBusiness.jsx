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
import { FaSearch } from 'react-icons/fa';
import { RiArrowGoBackLine } from 'react-icons/ri';
import { FaXmark } from 'react-icons/fa6';
import { FaBuilding, FaMapMarkerAlt, FaTags } from 'react-icons/fa';
import { RiMailAddLine } from 'react-icons/ri';
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

const ManageBusiness = () => {
  const { user, accessToken, isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [linking, setLinking] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [businesses, setBusinesses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dirtyFields, setDirtyFields] = useState({});
  const [baseForm, setBaseForm] = useState(null);

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
    phone: (v) => {
      if (!v) return '';
      return /^(\d{3}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4})$/.test(v) ? '' : 'Phone must be XXX-XXX-XXXX or XXX-XXXX-XXXX.';
    },
    website: (v) => v && !/^https?:\/\/[^\s]+$/i.test(v) ? 'Invalid URL. Include http(s)://' : '',
    openingHours: (_) => '',
    latitude: (v) => v && isNaN(Number(v)) ? 'Latitude must be a number.' : '',
    longitude: (v) => v && isNaN(Number(v)) ? 'Longitude must be a number.' : ''
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
      !validators.address(form.address || '');
    const hasChanges = keys.some(k => (baseForm[k] || '') !== (form[k] || ''));
    return !!selected && isLoggedIn && !saving && requiredValid && !hasDirtyErrors && hasChanges;
  }, [selected, isLoggedIn, saving, form, baseForm, formErrors, dirtyFields]);
 
  const [linkedEmails, setLinkedEmails] = useState(() => {
    const fromLS = JSON.parse(localStorage.getItem('mb_linked_emails') || '[]');
    if (user?.email && !fromLS.includes(user.email)) fromLS.unshift(user.email);
    return fromLS.slice(0, 10);
  });
  const [emailInput, setEmailInput] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(() => (user?.email ? user.email : (JSON.parse(localStorage.getItem('mb_linked_emails') || '[]')[0] || '')));

  const authAxios = useMemo(() => {
    const inst = axios.create();
    if (accessToken) inst.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    return inst;
  }, [accessToken]);

  useEffect(() => {
    document.body.classList.add('manage-business-body');
    return () => document.body.classList.remove('manage-business-body');
  }, []);

  const fetchByEmail = async (email) => {
    if (!email || !isLoggedIn || !accessToken) {
      setBusinesses([]);
      setSelected(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await authAxios.get('/api/businesses/mine', { params: { email } });
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
          longitude: b.longitude ?? ''
        };
        setForm(nextForm);
        setBaseForm(nextForm);
        setDirtyFields({});
      } else {
        setSelected(null);
        setForm(null);
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load businesses for this email.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchByEmail(selectedEmail);
  }, [selectedEmail, isLoggedIn, accessToken]);

  const addLinkedEmail = async () => {
    const e = (emailInput || '').trim().toLowerCase();
    if (!e) return;
    const valid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e);
    if (!valid) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (linkedEmails.includes(e)) {
      setSelectedEmail(e);
      setEmailInput('');
      toast.success('Email selected.');
      return;
    }
    try {
      setLinking(true);
      setError(null);
      const r = await authAxios.get('/api/businesses/mine', { params: { email: e } });
      const list = (r.data?.data || []).filter(Boolean);
      if (!list.length) {
        const msg = 'No submissions found for this email.';
        setError(msg);
        toast.error(msg);
        return;
      }
      const next = [e, ...linkedEmails].slice(0, 10);
      setLinkedEmails(next);
      setSelectedEmail(e);
      setEmailInput('');
      localStorage.setItem('mb_linked_emails', JSON.stringify(next));
      toast.success('Email linked.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to link email.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLinking(false);
    }
  };

  const removeLinkedEmail = (e) => {
    const next = linkedEmails.filter(x => x !== e);
    setLinkedEmails(next);
    localStorage.setItem('mb_linked_emails', JSON.stringify(next));
    if (selectedEmail === e) setSelectedEmail(next[0] || '');
  };

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
      longitude: b.longitude ?? ''
    };
    setForm(nextForm);
    setBaseForm(nextForm);
    setDirtyFields({});
  };

  const requestAdminReview = async (e) => {
    e.preventDefault();
    if (!selected || !isLoggedIn || !accessToken) return;

    const all = ['name','description','address','phone','website','openingHours','latitude','longitude'];
    const errObj = {};
    all.forEach(k => { errObj[k] = validators[k]?.(form[k]) || ''; });
    if (Object.values(errObj).some(Boolean)) {
      setFormErrors(errObj);
      const msg = 'Please fix the highlighted errors before submitting.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: form.name,
        description: form.description,
        address: form.address,
        phone: form.phone,
        website: form.website,
        openingHours: form.openingHours,
        latitude: form.latitude,
        longitude: form.longitude
      };
      const upd = await authAxios.put(`/api/businesses/updateBusinessDetails/${selected._id}`, payload);
      const stat = await authAxios.patch(`/api/businesses/updateBusinessStatus/${selected._id}`, { status: 'pending' });
      if (upd.data?.success) {
        const updated = { ...upd.data.data, status: stat.data?.data?.status || 'pending' };
        setBusinesses(prev => prev.map(x => (x._id === updated._id ? updated : x)));
        setSelected(updated);
        toast.success('Changes submitted for review.');
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

  const stats = {
    total: businesses.length,
    pending: businesses.filter(b => (b.status || '').toLowerCase() === 'pending').length,
    approved: businesses.filter(b => (b.status || '').toLowerCase() === 'approved').length,
    reamend: businesses.filter(b => ['re-amend','rejected'].includes((b.status||'').toLowerCase())).length
  };

  return (
    <div className="mb-page">
      {/* <ToastContainer position="top-right" autoClose={4000} newestOnTop /> */}
      {/* HEADER */}
      <div className="mb-headerbar">
        <div>
          <div className="mb-title">Manage Your Business</div>
          <p className="mb-subtitle">Review your submissions, update details, and request admin review.</p>
        </div>
        <div className="mb-header-right">
          <button
            className="mb-back"
            onClick={() => (window.location.href = '/testing')}
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

      {/* LINKED EMAILS + INLINE ADD */}
      <div className="mb-email-row">
        <div className="mb-email-chips">
          {linkedEmails.map(e => (
            <span
              key={e}
              className={`mb-chip email ${selectedEmail === e ? 'active' : ''}`}
              onClick={() => setSelectedEmail(e)}
              title={e}
            >
              {e}
              <button
                className="mb-chip-x"
                onClick={(ev) => { ev.stopPropagation(); removeLinkedEmail(e); }}
                aria-label="Remove linked email"
              >
                <FaXmark />
              </button>
            </span>
          ))}
        </div>
        <div className="mb-emailbar">
          <input
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mb-email-input"
            placeholder="Enter business email to view submissions"
            value={emailInput}
            onChange={(e) => setEmailInput((e.target.value || '').toLowerCase())}
          />
          <button className="mb-email-btn" onClick={addLinkedEmail} disabled={linking}>
            <RiMailAddLine className="mb-ico" /> {linking ? 'Linking...' : 'Link email'}
          </button>
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
                <div className="mb-empty">No submissions found for {selectedEmail || 'this account'}.</div>
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
              <SectionCard title="Business Details">
                <div className="mb-two-col">
                  <div>
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
                                      setForm(prev => ({ ...prev, latitude: String(ll.lat), longitude: String(ll.lng) }));
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
                    <div className="mb-coord-bar">
                      <div>Lat: {form.latitude || '-'}</div>
                      <div>Lng: {form.longitude || '-'}</div>
                    </div>
                  </div>

                  <form id="mb-edit-form" onSubmit={requestAdminReview}>
                    <div className="mb-field"><input className={`mb-input ${formErrors.name ? 'invalid' : ''}`} name="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required disabled={saving} /><label>Name</label>{formErrors.name && <div className="mb-field-error">{formErrors.name}</div>}</div>
                    <div className="mb-field">
                        <textarea className={`mb-input ${formErrors.description ? 'invalid' : ''}`} name="description" rows={4} value={form.description} onChange={(e) => handleChange('description', e.target.value)} disabled={saving} />
                        <label>Description</label>
                        <div className="mb-hint">{countNonSpace(form.description)} / 500</div>
                        {formErrors.description && <div className="mb-field-error">{formErrors.description}</div>}
                    </div>
                    <div className="mb-field"><input className={`mb-input ${formErrors.address ? 'invalid' : ''}`} name="address" value={form.address} onChange={(e) => handleChange('address', e.target.value)} disabled={saving} /><label>Address</label>{formErrors.address && <div className="mb-field-error">{formErrors.address}</div>}</div>

                    <div className="mb-form-grid">
                        <div className="mb-field">
                        <input className={`mb-input ${formErrors.phone ? 'invalid' : ''}`} name="phone" value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="XXX-XXX-XXXX or XXX-XXXX-XXXX" disabled={saving} pattern="\d{3}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4}" title="Format: XXX-XXX-XXXX or XXX-XXXX-XXXX" />
                        <label>Phone</label>
                        {formErrors.phone && <div className="mb-field-error">{formErrors.phone}</div>}
                        </div>
                        <div className="mb-field"><input className={`mb-input ${formErrors.website ? 'invalid' : ''}`} name="website" value={form.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://..." disabled={saving} /><label>Website</label>{formErrors.website && <div className="mb-field-error">{formErrors.website}</div>}</div>
                    </div>

                    <div className="mb-form-grid">
                        <div className="mb-field"><input className={`mb-input ${formErrors.openingHours ? 'invalid' : ''}`} name="openingHours" value={form.openingHours} onChange={(e) => handleChange('openingHours', e.target.value)} disabled={saving} /><label>Opening Hours</label>{formErrors.openingHours && <div className="mb-field-error">{formErrors.openingHours}</div>}</div>
                        <div className="mb-coords">
                        <div className="mb-field"><input className={`mb-input ${formErrors.latitude ? 'invalid' : ''}`} name="latitude" value={form.latitude} onChange={(e) => handleChange('latitude', e.target.value)} disabled={saving} /><label>Latitude</label>{formErrors.latitude && <div className="mb-field-error">{formErrors.latitude}</div>}</div>
                        <div className="mb-field"><input className={`mb-input ${formErrors.longitude ? 'invalid' : ''}`} name="longitude" value={form.longitude} onChange={(e) => handleChange('longitude', e.target.value)} disabled={saving} /><label>Longitude</label>{formErrors.longitude && <div className="mb-field-error">{formErrors.longitude}</div>}</div>
                        </div>
                    </div>
                  </form>

                  <div className="mb-actions mb-center-actions">
                    <button type="submit" form="mb-edit-form" disabled={saving || !canSubmit}>{saving ? <span className="mb-btn-spinner" /> : 'Submit Changes'}</button>
                    <span className="mb-note">Changes will be sent to admins. Status becomes Pending until verified.</span>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard title="Details"><div className="mb-empty">Select a business on the left to view details.</div></SectionCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBusiness;
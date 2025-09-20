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

  const [linkedEmails, setLinkedEmails] = useState(() => {
    const fromLS = JSON.parse(localStorage.getItem('mb_linked_emails') || '[]');
    if (user?.email && !fromLS.includes(user.email)) fromLS.unshift(user.email);
    return fromLS.slice(0, 10);
  });
  const [emailInput, setEmailInput] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(() => (user?.email ? user.email : (JSON.parse(localStorage.getItem('mb_linked_emails') || '[]')[0] || '')));

  const [businesses, setBusinesses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
//   const [activeTab, setActiveTab] = useState('Overview');

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
        setForm({
          name: b.name || '',
          description: b.description || '',
          address: b.address || '',
          phone: b.phone || '',
          website: b.website || '',
          openingHours: b.openingHours || '',
          latitude: b.latitude ?? '',
          longitude: b.longitude ?? ''
        });
      } else {
        setSelected(null);
        setForm(null);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load businesses for this email.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchByEmail(selectedEmail);
  }, [selectedEmail, isLoggedIn, accessToken]);

  const addLinkedEmail = () => {
    const e = (emailInput || '').trim();
    if (!e) return;
    if (linkedEmails.includes(e)) {
      setSelectedEmail(e);
      setEmailInput('');
      return;
    }
    const next = [e, ...linkedEmails].slice(0, 10);
    setLinkedEmails(next);
    setSelectedEmail(e);
    setEmailInput('');
    localStorage.setItem('mb_linked_emails', JSON.stringify(next));
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
    setForm({
      name: b.name || '',
      description: b.description || '',
      address: b.address || '',
      phone: b.phone || '',
      website: b.website || '',
      openingHours: b.openingHours || '',
      latitude: b.latitude ?? '',
      longitude: b.longitude ?? ''
    });
  };

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const requestAdminReview = async (e) => {
    e.preventDefault();
    if (!selected || !isLoggedIn || !accessToken) return;
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
      } else {
        setError(upd.data?.message || 'Failed to submit update.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit update.');
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
      {/* HEADER */}
      <div className="mb-headerbar">
        <div className="mb-title">Manage Your Business</div>
        <div className="mb-header-right">
          <button
            className="mb-back"
            onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/'))}
            title="Back to map"
          >
            ×
          </button>
        </div>
      </div>

      {/* CHIPS */}
      <div className="mb-chiprow">
        <div className="mb-chips">
          {['all','pending','approved','re-amend'].map(s => (
            <button
              key={s}
              className={`mb-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="mb-emailbar">
            <input
              className="mb-email-input"
              placeholder="Enter business email to view submissions"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button className="mb-email-btn" onClick={addLinkedEmail}>Link email</button>
          </div>
          <div className="mb-search-wrap">
        `  <FaSearch className="mb-search-ico" />
            <input
                className="mb-search"
                placeholder="Search by name, address or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            </div>`
      </div>

      {/* LINKED EMAILS */}
      {linkedEmails.length > 0 && (
        <div className="mb-email-chips">
          {linkedEmails.map(e => (
            <span
              key={e}
              className={`mb-chip email ${selectedEmail === e ? 'active' : ''}`}
              onClick={() => setSelectedEmail(e)}
              title={e}
            >
              {e}
              <button className="mb-chip-x" onClick={(ev) => { ev.stopPropagation(); removeLinkedEmail(e); }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* STATS */}
      <div className="mb-stats">
        <StatPill label="Total" value={stats.total} />
        <StatPill label="Pending" value={stats.pending} tone="warn" />
        <StatPill label="Approved" value={stats.approved} tone="good" />
        <StatPill label="Re‑amend" value={stats.reamend} tone="bad" />
      </div>

      {loading ? (
        <div className="mb-loading">Loading...</div>
      ) : error ? (
        <div className="mb-error">{error}</div>
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
                      <div className="mb-item-name-strong">{b.name}</div>
                      <div className="mb-item-addr">{b.address}</div>
                      <div className="mb-item-meta">{b.category}</div>
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
                    <div className="mb-field"><input className="mb-input" name="name" value={form.name} onChange={onChange} required disabled={saving} /><label>Name</label></div>
                    <div className="mb-field">
                        <textarea className="mb-input" name="description" rows={4} value={form.description} onChange={onChange} disabled={saving} />
                        <label>Description</label>
                        <div className="mb-hint">{(form.description || '').length} characters</div>
                    </div>
                    <div className="mb-field"><input className="mb-input" name="address" value={form.address} onChange={onChange} disabled={saving} /><label>Address</label></div>

                    <div className="mb-form-grid">
                        <div className="mb-field">
                        <input className="mb-input" name="phone" value={form.phone}
                            onChange={(e) => setForm(p => ({ ...p, phone: (e.target.value || '').replace(/[^\d-]/g, '') }))}
                            placeholder="555-123-4567 or 555-1234-5678" disabled={saving} />
                        <label>Phone</label>
                        </div>
                        <div className="mb-field"><input className="mb-input" name="website" value={form.website} onChange={onChange} placeholder="https://..." disabled={saving} /><label>Website</label></div>
                    </div>

                    <div className="mb-form-grid">
                        <div className="mb-field"><input className="mb-input" name="openingHours" value={form.openingHours} onChange={onChange} disabled={saving} /><label>Opening Hours</label></div>
                        <div className="mb-coords">
                        <div className="mb-field"><input className="mb-input" name="latitude" value={form.latitude} onChange={onChange} disabled={saving} /><label>Latitude</label></div>
                        <div className="mb-field"><input className="mb-input" name="longitude" value={form.longitude} onChange={onChange} disabled={saving} /><label>Longitude</label></div>
                        </div>
                    </div>
                    </form>

                    <div className="mb-actions mb-center-actions">
                    <button type="submit" form="mb-edit-form" disabled={saving}>{saving ? <span className="mb-btn-spinner" /> : 'Submit Changes'}</button>
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
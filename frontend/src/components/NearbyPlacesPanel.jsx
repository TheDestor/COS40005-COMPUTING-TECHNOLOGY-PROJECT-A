import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FaMapPin, FaClock } from 'react-icons/fa';
import '../styles/NearbyPlacesPanel.css';
import DefaultImage from '../assets/default.png';

function haversineDistance(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

// NearbyPlacesPanel component
export default function NearbyPlacesPanel({
  title = 'Nearby Places',
  places = [],
  anchorCoords,                // {lat, lng}
  isLoading = false,
  error = null,
  onRetry,
  onItemClick,
  selectedPlaceId,
}) {
  const viewportRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(360);
  const [expandedId, setExpandedId] = useState(null);

  const itemHeight = 76;
  const overscan = 6;

  // Helper: resolve a thumbnail URL from diverse place shapes
  const getPlaceThumbnail = (place) => {
    const normalizeUrl = (u) => {
      if (!u) return null;
      if (/^https?:\/\//i.test(u)) return u;
      const base = import.meta.env.VITE_DEPLOYMENT_BACKEND || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';
      return base ? `${base.replace(/\/$/, '')}/${String(u).replace(/^\//, '')}` : u;
    };

    // Explicit backend fields - prioritize business and location images
    const businessImg = normalizeUrl(place?.businessImage);
    const locationImg = normalizeUrl(place?.image);

    // If it's a business entry with an image
    if (businessImg) return businessImg;

    // If it's a location entry with an image
    if (locationImg) return locationImg;

    // Other potential fields across sources
    const candidates = [
      normalizeUrl(place?.imageUrl),
      normalizeUrl(place?.photoUrl),
      normalizeUrl(place?.thumbnail),
      normalizeUrl(place?.photoURL),
      normalizeUrl(place?.coverImage),
      normalizeUrl(place?.properties?.image),
      normalizeUrl(place?.properties?.photo_url),
    ];

    // Google Places photo object support
    const gpPhoto = Array.isArray(place?.photos) && place.photos[0] ? place.photos[0] : undefined;
    if (gpPhoto && typeof gpPhoto.getUrl === 'function') {
      try {
        return gpPhoto.getUrl({ maxWidth: 200, maxHeight: 200 });
      } catch {
        // ignore errors from SDK
      }
    }
    if (gpPhoto?.url) return normalizeUrl(gpPhoto.url);

    // First non-empty candidate or null
    const found = candidates.find((u) => typeof u === 'string' && u.length > 0);
    return found || null;
  };

  const enrichedPlaces = useMemo(() => {
    if (!anchorCoords) return places;
    return places.map((p) => {
      const lat =
        typeof p?.geometry?.location?.lat === 'function'
          ? p.geometry.location.lat()
          : p?.geometry?.location?.lat ?? p.latitude;
      const lng =
        typeof p?.geometry?.location?.lng === 'function'
          ? p.geometry.location.lng()
          : p?.geometry?.location?.lng ?? p.longitude;
      const dist = Number.isFinite(lat) && Number.isFinite(lng)
        ? haversineDistance(anchorCoords, { lat, lng })
        : undefined;
      return { ...p, _distance: dist };
    });
  }, [places, anchorCoords]);

  const totalHeight = itemHeight * enrichedPlaces.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(enrichedPlaces.length, startIndex + visibleCount);
  const slice = enrichedPlaces.slice(startIndex, endIndex);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      setViewportHeight(height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="nearby-panel">
      {/* header remains commented */}
      {isLoading ? (
        <div className="nearby-panel-loading">
          <div className="nearby-skeleton" />
          <div className="nearby-skeleton" />
          <div className="nearby-skeleton" />
        </div>
      ) : error ? (
        <div className="nearby-panel-error">
          <span>{error}</span>
          {onRetry && (
            <button className="nearby-retry-btn" onClick={onRetry}>Retry</button>
          )}
        </div>
      ) : enrichedPlaces.length === 0 ? (
        <div className="nearby-panel-empty">No nearby places found.</div>
      ) : (
        <div
          className="nearby-list-viewport"
          ref={viewportRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <div className="nearby-list-inner" style={{ height: `${totalHeight}px` }}>
            {slice.map((place, i) => {
              const index = startIndex + i;
              const top = index * itemHeight;
              const isActive = selectedPlaceId && selectedPlaceId === place.place_id;
              const isExpanded = expandedId === place.place_id;

              const lat =
                typeof place?.geometry?.location?.lat === 'function'
                  ? place.geometry.location.lat()
                  : place?.geometry?.location?.lat ?? place.latitude;
              const lng =
                typeof place?.geometry?.location?.lng === 'function'
                  ? place.geometry.location.lng()
                  : place?.geometry?.location?.lng ?? place.longitude;

              const thumbUrl = getPlaceThumbnail(place);
              const initial = (place?.name || '?').charAt(0).toUpperCase();

              return (
                <div
                  key={place.place_id ?? `${place.name}-${index}`}
                  className={`nearby-item ${isActive ? 'active' : ''}`}
                  style={{ transform: `translateY(${top}px)` }}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedId(isExpanded ? null : place.place_id);
                    onItemClick?.(place);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : place.place_id);
                      onItemClick?.(place);
                    }
                  }}
                >
                  <div className="nearby-item-main">
                    <div className="nearby-item-media" aria-hidden="true">
                      <img
                        src={thumbUrl || DefaultImage}
                        alt={place?.name || 'Place'}
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to default image if the URL fails to load
                          if (e.target.src !== DefaultImage) {
                            e.target.src = DefaultImage;
                          }
                        }}
                      />
                    </div>

                    <div className="nearby-item-body">
                      <div className="nearby-item-title">{place.name}</div>
                      <div className="nearby-item-meta">
                        <span className="nearby-item-type">
                          {String(place.type || '').replace(/_/g, ' ')}
                        </span>
                        {Number.isFinite(place._distance) && (
                          <span className="nearby-item-distance">
                            • {formatDistance(place._distance)}
                          </span>
                        )}
                      </div>
                      {place.vicinity && (
                        <div className="nearby-item-address">{place.vicinity}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
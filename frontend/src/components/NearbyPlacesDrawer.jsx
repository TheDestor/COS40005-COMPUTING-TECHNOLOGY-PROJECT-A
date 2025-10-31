import React, { useEffect, useRef, useState } from 'react';
import '../styles/NearbyPlacesDrawer.css';
import { FaUtensils, FaToilet, FaCapsules, FaListUl, FaHotel, FaArrowLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function NearbyPlacesDrawer({
  isOpen,
  onToggle,
  headerTitle = 'Nearby Places',
  children,
  selectedCategory = 'restaurant',
  onCategoryChange,
}) {
  const drawerRef = useRef(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const CATEGORY_OPTIONS = [
    { key: 'all', label: 'All', Icon: <FaListUl /> },
    { key: 'restaurant', label: 'Restaurants', Icon: <FaUtensils /> },
    { key: 'toilet', label: 'Toilets', Icon: <FaToilet /> },
    { key: 'pharmacy', label: 'Pharmacies', Icon: <FaCapsules /> },
    { key: 'hotel', label: 'Hotels', Icon: <FaHotel /> },
  ];

  // Click-to-expand on mobile (30vh → 50vh)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [panelHeight, setPanelHeight] = useState(() => (isMobile ? 30 : undefined));

  useEffect(() => {
    if (isOpen && isMobile) setPanelHeight(30);
  }, [isOpen]);

  const handleHeaderClick = (e) => {
    if (!isMobile) return;
    if (e.target.closest('.nearby-drawer-toggle')) return;
    setPanelHeight((h) => ((h ?? 30) >= 50 ? 30 : 50));
  };

  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(null);
  const dragStartHeightRef = useRef(null);

  const startDrag = (e) => {
    if (!isMobile) return;
    const target = e.target;
    if (target instanceof Element && (target.closest('button') || target.closest('a'))) return;
    setIsDragging(true);
    dragStartYRef.current = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    dragStartHeightRef.current = panelHeight ?? 30;
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
  };

  const onDragMove = (e) => {
    if (!isDragging) return;
    const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    const deltaPx = dragStartYRef.current - clientY;
    const deltaVh = (deltaPx / window.innerHeight) * 100;
    const minVh = 30;
    const maxVh = 50;
    const next = Math.max(minVh, Math.min(maxVh, (dragStartHeightRef.current ?? minVh) + deltaVh));
    setPanelHeight(next);
    e.preventDefault();
  };

  const endDrag = () => {
    setIsDragging(false);
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', endDrag);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isMobile) setPanelHeight(30);
  }, [isOpen]);

  // Escape to close behavior
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isFilterOpen) {
          setIsFilterOpen(false);
        } else if (isOpen) {
          onToggle && onToggle(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isFilterOpen, onToggle]);

  const currentLabel =
    CATEGORY_OPTIONS.find((c) => c.key === selectedCategory)?.label || 'Restaurants';

  return (
    <div
      className={`nearby-drawer-overlay ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen}
    >
      <aside
        ref={drawerRef}
        className={`nearby-drawer ${isOpen ? 'open' : ''} ${isDragging ? 'dragging' : ''}`}
        role="dialog"
        aria-label="Nearby places panel"
        aria-modal="false"
        tabIndex={isOpen ? 0 : -1}
        data-state={isOpen ? 'open' : 'closed'}
        style={isMobile ? { height: `${panelHeight ?? 30}vh` } : undefined}
      >
        <div
          className="nearby-drawer-header recent-like-header"
          onClick={handleHeaderClick}
        >
          <h3 className="nearby-drawer-title">
            <svg
              className="nearby-drawer-title-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C8.4 2 5.5 4.9 5.5 8.5c0 5.1 6.5 12.2 6.5 12.2s6.5-7.1 6.5-12.2C18.5 4.9 15.6 2 12 2zm0 9.0a3.0 3.0 0 1 1 0-6.0 3.0 3.0 0 0 1 0 6.0z" />
            </svg>
            {headerTitle}
          </h3>
          {isMobile ? (
            <button
              type="button"
              className="nearby-drawer-toggle recent-like-button"
              onClick={() =>
                setPanelHeight((h) => ((h ?? 30) >= 50 ? 30 : 50))
              }
              aria-label="Expand/collapse panel"
              title="Expand/collapse panel"
              tabIndex={0}
            >
              {panelHeight >= 50 ? (
                <FaChevronDown className="nearby-drawer-toggle-react-icon" />
              ) : (
                <FaChevronUp className="nearby-drawer-toggle-react-icon" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="nearby-drawer-toggle recent-like-button"
              onClick={() => onToggle && onToggle(false)}
              aria-label="Close nearby places panel"
              title="Close nearby places"
            >
              <FaArrowLeft className="nearby-drawer-toggle-react-icon" />
            </button>
          )}
        </div>

        <div className="nearby-drawer-toolbar" role="region" aria-label="Nearby filters">
          <button
            type="button"
            className="nearby-filter-btn"
            onClick={() => setIsFilterOpen((v) => !v)}
            aria-expanded={isFilterOpen}
            aria-controls="nearby-filter-menu"
          >
            <svg
              className="nearby-filter-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            <span>Filter</span>
            <span className="nearby-filter-chip" aria-label={`Current filter: ${currentLabel}`}>
              {currentLabel}
            </span>
          </button>

          {isFilterOpen && (
            <div className="nearby-filter-menu" role="menu">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  role="menuitemradio"
                  aria-checked={selectedCategory === opt.key}
                  className={`nearby-filter-item ${selectedCategory === opt.key ? 'active' : ''}`}
                  onClick={() => {
                    onCategoryChange && onCategoryChange(opt.key);
                    setIsFilterOpen(false);
                  }}
                >
                  <span className="nearby-filter-emoji" aria-hidden="true">{opt.Icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="nearby-drawer-content">
          {children}
        </div>
      </aside>
    </div>
  );
}
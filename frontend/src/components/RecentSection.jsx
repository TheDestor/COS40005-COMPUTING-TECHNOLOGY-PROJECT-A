import React, {useState} from "react";
import "../styles/RecentSection.css";
import { FaArrowLeft, FaMap, FaClock, FaTrashAlt } from "react-icons/fa";
import fallbackImage from "../assets/default.png";
import { toast } from "sonner";

function RecentSection({ isOpen, onClose, history = [], onItemClick, onDeleteItems, onClearAll }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, kind: null });

  const toggleSelectItem = (item) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems([...history]);
    } else {
      setSelectedItems([]);
    }
  };

  const handleDelete = () => {
    if (!onDeleteItems || selectedItems.length === 0) return;
    setConfirmState({ open: true, kind: 'delete' });
  };

  const handleClearAll = () => {
    if (!onClearAll) return;
    setConfirmState({ open: true, kind: 'clear' });
  };

  const closeConfirm = () => setConfirmState({ open: false, kind: null });

  const confirmAction = () => {
    if (confirmState.kind === 'delete' && onDeleteItems) {
      onDeleteItems(selectedItems);
      setSelectedItems([]);
      toast.success("Selected recent locations removed.");
    }
    if (confirmState.kind === 'clear' && onClearAll) {
      onClearAll();
      setSelectedItems([]);
      toast.success("All recent locations cleared.");
    }
    closeConfirm();
  };

  return (
    <div className={`recent-slide-container ${isOpen ? "show" : ""}`}>
      {/* Header */}
      <div className="recent-header">
        <FaClock className="recent-icon" />
        <span>Recent Locations</span>
        <FaArrowLeft
          className="back-icon3"
          onClick={onClose}
          aria-label="Close recent locations"
          role="button"
          tabIndex={0}
        />
      </div>

      {/* Actions Bar - shown when items selected */}
      {selectedItems.length > 0 && (
        <div className="recent-actions">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selectedItems.length === history.length && history.length > 0}
              onChange={handleSelectAll}
            />
            Select All
          </label>
          <button type="button" className="recent-delete-btn" onClick={handleDelete}>
            <FaTrashAlt /> Delete
          </button>
          <button type="button" className="clear-all-button" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="recent-list-container">
        {history.length > 0 ? (
          <div className="recent-list">
            {history.map((item, index) => (
              <div
                  key={index}
                  className="recent-item"
                  onClick={() => {
                      onItemClick(item);
                      toast.success(`Plotted "${item.name}" on the map`);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleSelectItem(item)}
                  className="recent-checkbox"
                />
                <img 
                  src={(item && item.image) ? item.image : fallbackImage} 
                  alt={item.name} 
                  className="recent-item-image"
                  onError={(e) => {
                    e.target.src = fallbackImage;
                  }}
                />
                <div className="recent-item-info">
                  <span className="recent-item-name">{item.name}</span>
                  <span className="recent-item-type">{item.type || 'Location'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="recent-empty-state">
            <div className="recent-empty-message">
              You have no recent locations yet.
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmState.open && (
        <div className="recent-modal-overlay" onClick={closeConfirm}>
          <div className="recent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bookmark-modal-title">
              {confirmState.kind === 'delete' ? 'Delete selected locations?' : 'Clear all recent locations?'}
            </div>
            <div className="bookmark-modal-body">
              {confirmState.kind === 'delete'
                ? `This will remove ${selectedItems.length} selected location(s) from your recent history.`
                : 'This will remove all locations from your recent history.'}
            </div>
            <div className="recent-modal-actions">
              <button className="btn-secondary" onClick={closeConfirm}>Cancel</button>
              <button className="btn-danger" onClick={confirmAction}>
                {confirmState.kind === 'delete' ? 'Delete' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecentSection;
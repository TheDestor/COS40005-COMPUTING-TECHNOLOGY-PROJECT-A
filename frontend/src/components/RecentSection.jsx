import React, {useState} from "react";
import "../styles/RecentSection.css";
import { FaArrowLeft, FaMap, FaClock } from "react-icons/fa";
import fallbackImage from "../assets/Kuching.png";
import { toast } from "sonner";

const RecentSection = ({ isOpen, onClose, history = [], onItemClick, onDeleteItems, onClearAll }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, kind: null });

  const toggleSelectItem = (item) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
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
      <div className="recent-header">
        <FaClock className="recent-icon"/>
        <span>Recents</span>
        <FaArrowLeft className="back-icon3" onClick={onClose} />
      </div>

      <div className="recent-filters">
        <button className="filter-button2 active"><FaMap /> All</button>
        {selectedItems.length > 0 && (
          <button className="delete-button33" onClick={handleDelete}>
            Delete Selected
          </button>
        )}
        {history.length > 0 && (
          <button className="clear-all-button" onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="recent-group">
          <p className="group-title">Recent Searches</p>
          {history.map((item, index) => (
            <div
              key={index}
              className="recent-item"
              onClick={() => onItemClick(item)} // Click on item to trigger search
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSelectItem(item)}
              />
              <img src={(item && item.image) ? item.image : fallbackImage} alt={item.name} />
              <div className="item-info">
                <span className="title">{item.name}</span>
                <span className="category">{item.type || 'Search'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-recent">No recent searches yet.</p>
      )}

      {confirmState.open && (
        <div className="recent-modal-overlay" onClick={closeConfirm}>
          <div className="recent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recent-modal-title">
              {confirmState.kind === 'delete' ? 'Delete selected?' : 'Clear all recents?'}
            </div>
            <div className="recent-modal-body">
              {confirmState.kind === 'delete'
                ? `This will remove ${selectedItems.length} selected item(s) from your recent history.`
                : 'This will remove all items from your recent history.'}
            </div>
            <div className="recent-modal-actions">
              <button className="btn-secondary" onClick={closeConfirm}>Cancel</button>
              <button className="btn-danger" onClick={confirmAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentSection;

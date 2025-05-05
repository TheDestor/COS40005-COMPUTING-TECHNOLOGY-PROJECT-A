import React, {useState} from "react";
import "../styles/RecentSection.css";
import { FaArrowLeft, FaMap, FaClock } from "react-icons/fa";
import images from "../assets/Kuching.png";

const RecentSection = ({ isOpen, onClose, history = [], onItemClick, onDeleteItems }) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleSelectItem = (item) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };
  
  const handleDelete = () => {
    if (onDeleteItems && selectedItems.length > 0) {
      onDeleteItems(selectedItems);
      setSelectedItems([]);
    }
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
            Delete
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
              <img src={images} alt={item} />
              <div className="item-info">
                <span className="title">{item}</span>
                <span className="category">Search</span>
              </div>
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => toggleSelectItem(item)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="no-recent">No recent searches yet.</p>
      )}
    </div>
  );
};

export default RecentSection;

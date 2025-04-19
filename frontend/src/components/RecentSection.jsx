import React from "react";
import "../styles/RecentSection.css";
import { FaArrowLeft, FaMap, FaClock } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import images from "../assets/Kuching.png";

const RecentSection = ({ isOpen, onClose }) => {
  return (
    <div className={`recent-slide-container ${isOpen ? "show" : ""}`}>
      <div className="recent-header">
        <FaClock className="recent-icon"/>
        <span>Recents</span>
        <FaArrowLeft className="back-icon3" onClick={onClose} />
      </div>

      <div className="recent-filters">
        <button className="filter-button2 active"><FaMap /> All</button>
        <button className="filter-button2"><FaLocationDot /> Kuching</button>
      </div>

      <div className="recent-group">
        <p className="group-title">Last xx days (2)</p>
        <div className="recent-item">
          <img src={images} alt="Borneo Cultural Museum" />
          <div className="item-info">
            <span className="title">Borneo Cultural Museum</span>
            <span className="category">Museum</span>
          </div>
          <input type="checkbox" />
        </div>
        <div className="recent-item">
          <img src={images} alt="Swinburne University" />
          <div className="item-info">
            <span className="title">Swinburne University</span>
            <span className="category">School</span>
          </div>
          <input type="checkbox" />
        </div>
      </div>

      <div className="recent-group">
        <p className="group-title">More than xx days ago (2)</p>
        <div className="recent-item">
          <img src={images} alt="Borneo Cultural Museum" />
          <div className="item-info">
            <span className="title">Borneo Cultural Museum</span>
            <span className="category">Museum</span>
          </div>
          <input type="checkbox" />
        </div>
        <div className="recent-item">
          <img src={images} alt="Borneo Cultural Museum" />
          <div className="item-info">
            <span className="title">Borneo Cultural Museum</span>
            <span className="category">School</span>
          </div>
          <input type="checkbox" />
        </div>
      </div>
    </div>
  );
};

export default RecentSection;

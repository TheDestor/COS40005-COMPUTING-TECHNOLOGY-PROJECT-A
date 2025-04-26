import React, { useState } from "react";
import "../styles/BackupConfigmodal.css";

const BackupConfigurationModal = ({ onClose, onSave }) => {
  const [frequency, setFrequency] = useState("Daily");
  const [time, setTime] = useState("02:00");
  const [retention, setRetention] = useState(30);

  const handleSave = () => {
    onSave({ frequency, time, retention });
    onClose();
  };

  return (
    <div className="backup-config-overlay">
      <div className="backup-config-modal">
        <h3>Backup configuration</h3>

        <label>Backup frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>

        <label>Scheduled Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <label>Retention Period (days)</label>
        <input
          type="number"
          min="1"
          value={retention}
          onChange={(e) => setRetention(e.target.value)}
        />

        <div className="buttons">
          <button className="cancel" onClick={onClose}>Cancel</button>
          <button className="save" onClick={handleSave}>Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default BackupConfigurationModal;

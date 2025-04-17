import React, { useState } from "react";
import Switch from "react-switch";
import { MdNotificationsNone } from "react-icons/md";
import "../styles/PushNotificationPage.css";

const PushNotificationPage = () => {
  const [notifications, setNotifications] = useState({
    push: true,
    location: true,
    price: true,
    event: true,
  });

  const [showModal, setShowModal] = useState(false);
  const [pendingKey, setPendingKey] = useState(null);

  const handleSwitchChange = (key) => {
    if (notifications[key]) {
      // Trying to turn OFF
      setPendingKey(key);
      setShowModal(true);
    } else {
      // Turn ON directly
      toggleNotification(key);
    }
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setShowModal(false);
    setPendingKey(null);
  };

  const handleConfirm = () => {
    if (pendingKey) {
      toggleNotification(pendingKey);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingKey(null);
  };

  return (
    <div className="push-notification-container">
      <h2><MdNotificationsNone size={22} /> Notifications</h2>

      {Object.entries(notifications).map(([key, value]) => (
        <div className="notification-item" key={key}>
          <span>{{
            push: "Push notifications",
            location: "Location-based notifications",
            price: "Price offer notifications",
            event: "Event notifications"
          }[key]}</span>
          <Switch
            checked={value}
            onChange={() => handleSwitchChange(key)}
            onColor="#2563eb"
            offColor="#ccc"
            uncheckedIcon={false}
            checkedIcon={false}
            height={22}
            width={44}
            handleDiameter={20}
          />
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <p>If you turn this off, you will no longer receive notifications.</p>
            <div className="modal-buttons">
              <button className="cancel-btn7" onClick={handleCancel}>Cancel</button>
              <button className="confirm-btn" onClick={handleConfirm}>Turn Off</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PushNotificationPage;

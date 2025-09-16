import React, { useState } from "react";
import Switch from "react-switch";
import { MdNotificationsNone } from "react-icons/md";
import { toast } from "sonner";
import "../styles/PushNotificationpage.css";

const PushNotificationPage = () => {
  const [notifications, setNotifications] = useState({
    push: true,
    location: true,
    price: true,
    event: true,
  });

  const [disabledSwitches, setDisabledSwitches] = useState({}); // 🔒 Track disabled switches

  const notificationLabels = {
    push: "Push notifications",
    location: "Location-based notifications",
    price: "Price offer notifications",
    event: "Event notifications",
  };

  const handleSwitchChange = (key) => {
    if (disabledSwitches[key]) return; // Prevent interaction during cooldown

    // Disable switch for 1 second
    setDisabledSwitches((prev) => ({ ...prev, [key]: true }));

    // Toggle the value
    const newStatus = !notifications[key];
    setNotifications((prev) => ({
      ...prev,
      [key]: newStatus,
    }));

    // Re-enable after 1s
    setTimeout(() => {
      setDisabledSwitches((prev) => ({ ...prev, [key]: false }));
    }, 1000);
  };

  return (
    <div className="push-notification-container">
      <h2><MdNotificationsNone size={22} /> Notifications</h2>

      {Object.entries(notifications).map(([key, value]) => (
        <div className="notification-item" key={key}>
          <span>{notificationLabels[key]}</span>
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
            disabled={disabledSwitches[key] || false}
          />
        </div>
      ))}
      
    </div>
  );
};

export default PushNotificationPage;

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

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="push-notification-container">
      <h2><MdNotificationsNone size={22} /> Notifications</h2>

      <div className="notification-item">
        <span>Push notifications</span>
        <Switch
          checked={notifications.push}
          onChange={() => toggleNotification("push")}
          onColor="#2563eb"
          offColor="#ccc"
          uncheckedIcon={false}
          checkedIcon={false}
          height={22}
          width={44}
          handleDiameter={20}
        />
      </div>

      <div className="notification-item">
        <span>Location-based notifications</span>
        <Switch
          checked={notifications.location}
          onChange={() => toggleNotification("location")}
          onColor="#2563eb"
          offColor="#ccc"
          uncheckedIcon={false}
          checkedIcon={false}
          height={22}
          width={44}
          handleDiameter={20}
        />
      </div>

      <div className="notification-item">
        <span>Price offer notifications</span>
        <Switch
          checked={notifications.price}
          onChange={() => toggleNotification("price")}
          onColor="#2563eb"
          offColor="#ccc"
          uncheckedIcon={false}
          checkedIcon={false}
          height={22}
          width={44}
          handleDiameter={20}
        />
      </div>

      <div className="notification-item">
        <span>Event notifications</span>
        <Switch
          checked={notifications.event}
          onChange={() => toggleNotification("event")}
          onColor="#2563eb"
          offColor="#ccc"
          uncheckedIcon={false}
          checkedIcon={false}
          height={22}
          width={44}
          handleDiameter={20}
        />
      </div>
    </div>
  );
};

export default PushNotificationPage;

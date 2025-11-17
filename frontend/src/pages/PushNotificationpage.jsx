import { useState, useEffect } from "react";
import Switch from "react-switch";
import { MdNotificationsNone } from "react-icons/md";
import "../styles/PushNotificationpage.css";
import api from "../utils/api.js"
import { useAuth } from "../context/AuthProvider.jsx";

const PushNotificationPage = () => {
  const { user, updateUserContext } = useAuth();
  const [notifications, setNotifications] = useState(user.notifications);
  const [disabledSwitches, setDisabledSwitches] = useState({});

  useEffect(() => {
    setNotifications(user.notifications);
  }, [user.notifications]);

  const notificationLabels = {
    location: "Location-based notifications",
    event: "Event notifications",
  };

  const handleSwitchChange = async (key) => {
    if (disabledSwitches[key]) return;

    setDisabledSwitches((prev) => ({ ...prev, [key]: true }));

    const originalNotifications = notifications;
    const newNotifications = {
      ...originalNotifications,
      [key]: !originalNotifications[key],
    };

    setNotifications(newNotifications);

    try {
      await api.post('api/user/notifications', { json: { notifications: newNotifications } });
      updateUserContext({ notifications: newNotifications });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      setNotifications(originalNotifications);
    } finally {
      setTimeout(() => {
        setDisabledSwitches((prev) => ({ ...prev, [key]: false }));
      }, 1000);
    }
  };

  return (
    <div className="push-notification-container">
      <h2>
        <MdNotificationsNone size={22} /> Notifications
      </h2>

      {Object.entries(notifications).map(([key, value]) => (
        <div className="notification-item-pn" key={key}>
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
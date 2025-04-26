import React, { useState } from "react";
import Switch from "react-switch";
import { MdSubscriptions } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/PushNotificationpage.css";

const PushSubscriptionPage = () => {
  const [subscriptions, setSubscriptions] = useState({
    push: true,
    newsletter: true,
    blog: true,
    event: true,
  });

  const [disabledSwitches, setDisabledSwitches] = useState({}); // ⛔ track disabled state per switch

  const labels = {
    push: "Push subscriptions",
    newsletter: "Newsletter updates",
    blog: "Blog and post updates",
    event: "Event updates",
  };

  const toggleSubscriptions = (key) => {
    if (disabledSwitches[key]) return; // If switch is temporarily disabled, do nothing

    // Disable this switch
    setDisabledSwitches((prev) => ({ ...prev, [key]: true }));

    // Update toggle state
    const newStatus = !subscriptions[key];
    setSubscriptions((prev) => ({
      ...prev,
      [key]: newStatus,
    }));

    // Toast notification
    toast[newStatus ? "success" : "error"](
      `${labels[key]} ${newStatus ? "enabled" : "disabled"}`,
      {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      }
    );

    // Re-enable switch after 1 second
    setTimeout(() => {
      setDisabledSwitches((prev) => ({ ...prev, [key]: false }));
    }, 1000);
  };

  return (
    <div className="push-notification-container">
      <h2><MdSubscriptions size={22} /> Subscriptions</h2>

      {Object.entries(subscriptions).map(([key, value]) => (
        <div className="notification-item" key={key}>
          <span>{labels[key]}</span>
          <Switch
            checked={value}
            onChange={() => toggleSubscriptions(key)}
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

      <ToastContainer />
    </div>
  );
};

export default PushSubscriptionPage;

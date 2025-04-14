import React, { useState } from "react";
import Switch from "react-switch";
import { MdSubscriptions } from "react-icons/md";
import "../styles/PushNotificationPage.css";

const PushSubscriptionPage = () => {
  const [subscriptions, setSubscriptions] = useState({
    push: true,
    newsletter: true,
    blog: true,
    event: true,
  });

  const toggleSubscriptions = (key) => {
    setSubscriptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="push-notification-container">
      <h2><MdSubscriptions size={22} /> Subscriptions</h2>

      <div className="notification-item">
        <span>Push subscriptions</span>
        <Switch
          checked={subscriptions.push}
          onChange={() => toggleSubscriptions("push")}
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
        <span>LNewsletter updates</span>
        <Switch
          checked={subscriptions.newsletter}
          onChange={() => toggleSubscriptions("newsletter")}
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
        <span>Blog and post updates</span>
        <Switch
          checked={subscriptions.blog}
          onChange={() => toggleSubscriptions("blog")}
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
        <span>Event updates</span>
        <Switch
          checked={subscriptions.event}
          onChange={() => toggleSubscriptions("event")}
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

export default PushSubscriptionPage;

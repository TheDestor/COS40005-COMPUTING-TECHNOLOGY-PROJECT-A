// Import and helpers
import React, { useState, useEffect } from "react";
import { FaClock } from "react-icons/fa";
import "../styles/BackupConfigmodal.css";
import { toast } from "sonner";

// Scheduling helpers (client-side)
function getAccessToken() {
  try {
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      null
    );
  } catch {
    return null;
  }
}

async function runBackupNow() {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  try {
    await fetch("/api/admin/backup/run", { method: "POST", headers });
  } catch (e) {
    // Swallow errors to avoid breaking UI; emit an event for listeners
  }
  window.dispatchEvent(
    new CustomEvent("backup:run", { detail: { source: "schedule" } })
  );
}

function computeNextRunDate(frequency, timeStr) {
  const [hh, mm] = (timeStr || "02:00").split(":").map((v) => parseInt(v, 10));
  const now = new Date();
  const next = new Date(now);
  next.setHours(hh, mm, 0, 0);

  if (frequency === "Daily") {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === "Weekly") {
    // Next occurrence in 7 days at the same time
    if (next <= now) next.setDate(next.getDate() + 7);
  } else if (frequency === "Monthly") {
    // Next month at the same day/time
    const day = next.getDate();
    next.setMonth(next.getMonth() + (next <= now ? 1 : 0));
    // Attempt same day; if overflow, set to last day of month
    if (next.getDate() !== day) {
      next.setDate(0); // Last day of previous month
      next.setHours(hh, mm, 0, 0);
    }
  }
  return next;
}

function setupScheduler(config) {
  // Clear previous schedule if any
  if (window.__backupScheduler?.clear) {
    window.__backupScheduler.clear();
  }
  const state = {
    timers: [],
    clear() {
      this.timers.forEach((t) => clearTimeout(t));
      this.timers = [];
    },
  };
  window.__backupScheduler = state;

  const scheduleNext = () => {
    const next = computeNextRunDate(config.frequency, config.time);
    const delay = Math.max(1000, next.getTime() - Date.now());
    const id = setTimeout(async () => {
      await runBackupNow();
      scheduleNext(); // Reschedule after run
    }, delay);
    state.timers.push(id);
  };

  scheduleNext();
}

// BackupConfigurationModal component
const BackupConfigurationModal = ({ onClose, onSave }) => {
  const [frequency, setFrequency] = useState("Daily");
  const [time, setTime] = useState("02:00");
  const [retention, setRetention] = useState(30);
  const [nextRun, setNextRun] = useState(() => computeNextRunDate("Daily", "02:00"));

  useEffect(() => {
    // Recompute next run when inputs change
    setNextRun(computeNextRunDate(frequency, time));
  }, [frequency, time]);

  useEffect(() => {
    // Load saved schedule to preview when modal opens
    try {
      const saved = localStorage.getItem("backup:schedule");
      if (saved) {
        const parsed = JSON.parse(saved);
        setNextRun(computeNextRunDate(parsed.frequency || frequency, parsed.time || time));
      }
    } catch {}
  }, []);

  const handleSave = () => {
    const config = { frequency, time, retention: Number(retention) };
    // Persist schedule and start client-side scheduler
    try {
      localStorage.setItem("backup:schedule", JSON.stringify(config));
    } catch {}
    setupScheduler(config);

    onSave(config);
    onClose();
    // Notify success on configuration save
    toast.success("Backup configuration saved.");
  };

  return (
    <div className="backup-config-overlay" role="dialog" aria-modal="true" aria-labelledby="backup-config-title">
      <div className="backup-config-modal">
        <h3 id="backup-config-title">Backup configuration</h3>
        {/* Next scheduled run preview */}
        <div className="schedule-info" aria-live="polite">
          <span className="schedule-icon" aria-hidden>
            <FaClock />
          </span>
          <span className="schedule-text">
            Next run: {nextRun ? nextRun.toLocaleString() : "—"}
          </span>
        </div>

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

        {/* Retention indicator */}
        <div className="retention-info" aria-label="Retention period">
          Retention: <strong>{Number(retention)}</strong> days
        </div>

        <div className="buttons">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-confirm-btn" onClick={handleSave}>Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default BackupConfigurationModal;

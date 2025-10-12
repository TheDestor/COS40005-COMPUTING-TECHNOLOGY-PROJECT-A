// Import and helpers
import React, { useState, useEffect } from "react";
import { FaClock } from "react-icons/fa";
import "../styles/BackupConfigmodal.css";
import { toast } from "sonner";

// Scheduling helpers (client-side)
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const LEADER_KEY = "backup:scheduler:leader";
const HEARTBEAT_KEY = "backup:scheduler:heartbeat";
const SCHEDULE_KEY = "backup:schedule";
const NEXT_RUN_KEY = "backup:nextRun";
const LAST_RUN_KEY = "backup:lastRun";

function nowTs() {
  return Date.now();
}

function isValidTimeStr(str) {
  if (typeof str !== "string") return false;
  const m = str.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return !!m;
}

function isValidFrequency(f) {
  return ["Daily", "Weekly", "Monthly"].includes(f);
}

function isValidSchedule(c) {
  if (!c) return false;
  const r = Number(c.retention);
  return isValidFrequency(c.frequency) && isValidTimeStr(c.time) && r > 0;
}

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
    const res = await fetch("/api/admin/backup/run", { method: "POST", headers });
    const ok = !!res && res.ok;
    window.dispatchEvent(
      new CustomEvent("backup:run", { detail: { source: "schedule", ok } })
    );
    if (!ok) throw new Error(`HTTP ${res ? res.status : "ERR"}`);
  } catch (e) {
    console.error("Backup run error:", e);
    window.dispatchEvent(
      new CustomEvent("backup:error", { detail: { source: "schedule", error: String(e) } })
    );
  }
}

function computeNextRunDate(frequency, timeStr) {
  const [hh, mm] = (timeStr || "02:00").split(":").map((v) => parseInt(v, 10));
  const now = new Date();
  const next = new Date(now);
  next.setHours(hh, mm, 0, 0);
  if (frequency === "Daily") {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === "Weekly") {
    if (next <= now) next.setDate(next.getDate() + 7);
  } else if (frequency === "Monthly") {
    const day = next.getDate();
    next.setMonth(next.getMonth() + (next <= now ? 1 : 0));
    if (next.getDate() !== day) {
      next.setDate(0);
      next.setHours(hh, mm, 0, 0);
    }
  }
  return next;
}

function getLeader() {
  try {
    return localStorage.getItem(LEADER_KEY);
  } catch {
    return null;
  }
}

function setLeader(id) {
  try {
    localStorage.setItem(LEADER_KEY, id);
    localStorage.setItem(HEARTBEAT_KEY, String(nowTs()));
  } catch {}
}

function isHeartbeatStale() {
  try {
    const ts = parseInt(localStorage.getItem(HEARTBEAT_KEY) || "0", 10);
    return nowTs() - ts > 60000;
  } catch {
    return true;
  }
}

function tryBecomeLeader() {
  const current = getLeader();
  if (!current || isHeartbeatStale()) {
    setLeader(TAB_ID);
    return true;
  }
  return current === TAB_ID;
}

function isLeader() {
  return getLeader() === TAB_ID;
}

function setupScheduler(config) {
  if (window.__backupScheduler?.clear) {
    window.__backupScheduler.clear();
  }
  const state = {
    timers: [],
    intervals: [],
    paused: false,
    clear() {
      this.timers.forEach((t) => clearTimeout(t));
      this.intervals.forEach((i) => clearInterval(i));
      this.timers = [];
      this.intervals = [];
      try {
        if (isLeader()) localStorage.removeItem(LEADER_KEY);
      } catch {}
    },
    pause() {
      this.paused = true;
    },
    resume() {
      this.paused = false;
    },
  };
  window.__backupScheduler = state;

  tryBecomeLeader();

  const heartbeat = () => {
    try {
      if (isLeader()) localStorage.setItem(HEARTBEAT_KEY, String(nowTs()));
    } catch {}
  };

  const scheduleNext = () => {
    const next = computeNextRunDate(config.frequency, config.time);
    try { localStorage.setItem(NEXT_RUN_KEY, String(next.getTime())); } catch {}
    const delay = Math.max(1000, next.getTime() - Date.now());
    const id = setTimeout(async () => {
      if (!isLeader() || state.paused) { scheduleNext(); return; }
      await runBackupNow();
      try { localStorage.setItem(LAST_RUN_KEY, String(nowTs())); } catch {}
      scheduleNext();
    }, delay);
    state.timers.push(id);
  };

  const checkLoop = setInterval(async () => {
    heartbeat();
    tryBecomeLeader();
    if (!isLeader() || state.paused) return;
    const nextTs = parseInt(localStorage.getItem(NEXT_RUN_KEY) || "0", 10);
    const lastTs = parseInt(localStorage.getItem(LAST_RUN_KEY) || "0", 10);
    if (nextTs && nowTs() >= nextTs && lastTs < nextTs) {
      await runBackupNow();
      try { localStorage.setItem(LAST_RUN_KEY, String(nowTs())); } catch {}
      const next = computeNextRunDate(config.frequency, config.time);
      try { localStorage.setItem(NEXT_RUN_KEY, String(next.getTime())); } catch {}
    }
  }, 30000);
  state.intervals.push(checkLoop);

  const vis = () => {
    if (document.visibilityState === "visible") {
      tryBecomeLeader();
    }
  };
  document.addEventListener("visibilitychange", vis);

  const beforeUnload = () => {
    try {
      if (isLeader()) localStorage.removeItem(LEADER_KEY);
    } catch {}
    state.clear();
  };
  window.addEventListener("beforeunload", beforeUnload);

  window.addEventListener("storage", (e) => {
    if (e.key === LEADER_KEY) {
      if (e.newValue !== TAB_ID) state.pause();
      else state.resume();
    }
  });

  scheduleNext();
}

// BackupConfigurationModal component
const BackupConfigurationModal = ({ onClose, onSave }) => {
  const [frequency, setFrequency] = useState("Daily");
  const [time, setTime] = useState("02:00");
  const [retention, setRetention] = useState(30);
  const [nextRun, setNextRun] = useState(() => computeNextRunDate("Daily", "02:00"));

  useEffect(() => {
    setNextRun(computeNextRunDate(frequency, time));
  }, [frequency, time]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCHEDULE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNextRun(computeNextRunDate(parsed.frequency || frequency, parsed.time || time));
        if (isValidSchedule(parsed)) setupScheduler(parsed);
      }
    } catch {}
  }, []);

  const handleSave = () => {
    const config = { frequency, time, retention: Number(retention) };
    if (!isValidSchedule(config)) {
      toast.error("Invalid backup configuration.");
      return;
    }
    try {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(config));
    } catch {}
    setupScheduler(config);
    onSave(config);
    onClose();
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

export const initBackupScheduler = () => {
  try {
    const saved = localStorage.getItem(SCHEDULE_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      if (isValidSchedule(config)) setupScheduler(config);
    }
  } catch {}
};

export default BackupConfigurationModal;

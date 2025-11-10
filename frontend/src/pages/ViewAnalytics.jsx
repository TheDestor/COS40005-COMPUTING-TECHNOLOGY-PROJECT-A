import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import Sidebar from "../components/Sidebar";
import {
  FaSyncAlt,
  FaMapMarkerAlt,
  FaChartLine,
  FaFileAlt,
} from "react-icons/fa";
import html2canvas from "html2canvas"; // install this package if not already
import "../styles/ViewAnalytics.css";
import { FaRegEye, FaFileExport, FaTrash } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAuth } from "../context/AuthProvider";

// Auth fetch helper function
const authFetch = async (url, options = {}) => {
  // Try multiple possible token storage locations
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token) {
    console.error("No authentication token found");
    throw new Error("Authentication required");
  }

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    console.log("Token expired or invalid");
    throw new Error("Authentication expired");
  }

  return response;
};

// Add this new component at the top level of your file (but not inside another component)
function RestoreChartsModal({ visibleCharts, onRestore, onClose }) {
  const hiddenCharts = Object.entries(visibleCharts)
    .filter(([_, visible]) => !visible)
    .map(([name]) => name);

  const [selectedCharts, setSelectedCharts] = useState([]);

  const toggleChartSelection = (chartName) => {
    setSelectedCharts((prev) =>
      prev.includes(chartName)
        ? prev.filter((name) => name !== chartName)
        : [...prev, chartName]
    );
  };

  const handleRestore = () => {
    onRestore(selectedCharts);
    onClose();
  };

  if (hiddenCharts.length === 0) return null;

  return (
    <div className="restore-modal-overlay" onClick={onClose}>
      <div
        className="restore-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Restore Charts</h3>
        <p>Select charts to restore:</p>

        <div className="chart-selection-list">
          {hiddenCharts.map((chartName) => (
            <div
              key={chartName}
              className={`chart-selection-item ${
                selectedCharts.includes(chartName) ? "selected" : ""
              }`}
              onClick={() => toggleChartSelection(chartName)}
            >
              {getChartDisplayName(chartName)}
            </div>
          ))}
        </div>

        <div className="restore-modal-actions">
          <button className="restore-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="restore-confirm-btn"
            onClick={handleRestore}
            disabled={selectedCharts.length === 0}
          >
            Restore Selected
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format chart names for display
function getChartDisplayName(chartKey) {
  const names = {
    eventOverview: "Event Overview", // Updated
    businessParticipation: "Business Participation",
    organicTraffic: "Organic Traffic",
    sessionDevice: "Session Device",
    browserUsage: "Browser Usage",
    usersOverview: "Users Overview",
    businessStatus: "Business Status", // Add this line
  };
  return names[chartKey] || chartKey;
}

export default function ViewAnalyticsOverview() {
  const [visibleCharts, setVisibleCharts] = useState({
    eventOverview: true,
    businessStatus: true,
    organicTraffic: true,
    sessionDevice: true,
    browserUsage: true,
    usersOverview: true,
  });
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // NEW: Track which menu is open

  // NEW: Function to handle menu toggle
  const handleMenuToggle = (chartName) => {
    setActiveMenu(activeMenu === chartName ? null : chartName);
  };

  // NEW: Function to close all menus
  const closeAllMenus = () => {
    setActiveMenu(null);
  };

  // NEW: Handle clicks outside menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu && !event.target.closest(".ue-menu-container")) {
        closeAllMenus();
      }
    };

    if (activeMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeMenu]);

  // Function to restore specific charts
  const restoreCharts = (chartsToRestore) => {
    setVisibleCharts((prev) => {
      const newState = { ...prev };
      chartsToRestore.forEach((chart) => {
        newState[chart] = true;
      });
      return newState;
    });
  };

  // Function to handle chart removal
  const handleRemoveChart = (chartName) => {
    setVisibleCharts((prev) => ({
      ...prev,
      [chartName]: false,
    }));
    closeAllMenus(); // NEW: Close menu when removing chart
  };

  // Check if any charts are hidden
  const anyChartHidden = Object.values(visibleCharts).some(
    (visible) => !visible
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        {/* Dashboard Header Section */}
        <div className="dashboard-header">
          <div className="greeting">
            <h3>Analytics</h3>
            <p>View different interactive analytics chart</p>
          </div>
        </div>

        {/* Your existing charts container */}
        <div className="viewanalytics-container">
          {visibleCharts.eventOverview && (
            <EventOverviewChart
              onRemove={() => handleRemoveChart("eventOverview")}
              isMenuOpen={activeMenu === "eventOverview"}
              onMenuToggle={() => handleMenuToggle("eventOverview")}
              onMenuClose={closeAllMenus}
            />
          )}
          {visibleCharts.businessStatus && (
            <BusinessStatusChart
              onRemove={() => handleRemoveChart("businessStatus")}
              isMenuOpen={activeMenu === "businessStatus"}
              onMenuToggle={() => handleMenuToggle("businessStatus")}
              onMenuClose={closeAllMenus}
            />
          )}
          {visibleCharts.usersOverview && (
            <UsersOverviewChart
              onRemove={() => handleRemoveChart("usersOverview")}
              isMenuOpen={activeMenu === "usersOverview"} // NEW: Pass menu state
              onMenuToggle={() => handleMenuToggle("usersOverview")} // NEW: Pass toggle function
              onMenuClose={closeAllMenus} // NEW: Pass close function
            />
          )}
          {visibleCharts.sessionDevice && (
            <SessionDeviceChart
              onRemove={() => handleRemoveChart("sessionDevice")}
              isMenuOpen={activeMenu === "sessionDevice"}
              onMenuToggle={() => handleMenuToggle("sessionDevice")}
              onMenuClose={closeAllMenus}
            />
          )}
          {visibleCharts.browserUsage && (
            <SystemUsageChart
              onRemove={() => handleRemoveChart("browserUsage")}
              isMenuOpen={activeMenu === "browserUsage"}
              onMenuToggle={() => handleMenuToggle("browserUsage")}
              onMenuClose={closeAllMenus}
            />
          )}
        </div>

        {/* Modified restore button */}
        {anyChartHidden && (
          <button
            className="restore-charts-btn"
            onClick={() => setShowRestoreModal(true)}
            title="Restore charts"
          >
            +
          </button>
        )}

        {/* Add the restore modal */}
        {showRestoreModal && (
          <RestoreChartsModal
            visibleCharts={visibleCharts}
            onRestore={restoreCharts}
            onClose={() => setShowRestoreModal(false)}
          />
        )}
      </div>
    </div>
  );
}

function OrganicTrafficChart({ onRemove }) {
  const mapRef = useRef();
  const barRef = useRef();
  const modalMapRef = useRef();
  const modalBarRef = useRef();
  const chartContainerRef = useRef();

  const [timeRange, setTimeRange] = useState("week");
  const [showModal, setShowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  const countries = [
    { name: "China", value: 92, type: "registered" },
    { name: "Italy", value: 88, type: "new" },
    { name: "Spain", value: 75, type: "visitor" },
    { name: "UK", value: 63, type: "registered" },
    { name: "India", value: 57, type: "new" },
    { name: "Canada", value: 50, type: "visitor" },
    { name: "USA", value: 44, type: "registered" },
    { name: "Germany", value: 38, type: "new" },
    { name: "Japan", value: 78, type: "new" },
    { name: "Denmark", value: 56, type: "visitor" },
    { name: "Thailand", value: 64, type: "registered" },
    { name: "Korean", value: 74, type: "registered" },
    { name: "Russia", value: 84, type: "new" },
    { name: "Mexico", value: 34, type: "new" },
    { name: "Malaysia", value: 71, type: "visitor" },
    { name: "Agentina", value: 84, type: "registered" },
    { name: "France", value: 97, type: "visitor" },
  ];

  const typeColor = {
    registered: "#4F46E5",
    new: "#10B981",
    visitor: "#EF4444",
  };

  const drawChart = (svgNode) => {
    const svg = d3.select(svgNode);
    svg.selectAll("*").remove();

    // Increased dimensions for larger chart
    const width = 500; // Increased from 300
    const height = 300; // Increased from 200
    const margin = { top: 30, right: 30, bottom: 50, left: 60 }; // Increased margins

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Empty state
    if (approvalData.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .style("font-size", "16px") // Larger font
        .text(
          loading ? "Loading approval data..." : "No approval data available"
        );
      return;
    }

    const x = d3
      .scaleBand()
      .domain(approvalData.map((d) => (timeRange === "week" ? d.day : d.month)))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    // FIXED: Consistent y-scale domain
    const maxValue = d3.max(approvalData, (d) => d.count);
    const consistentMax = Math.max(maxValue * 1.15, 10); // Minimum of 10, or 15% above max

    const y = d3
      .scaleLinear()
      .domain([0, consistentMax])
      .range([height - margin.bottom, margin.top]);

    // Create tooltip group FIRST - consistent with other charts
    const tooltip = svg
      .append("g")
      .attr("class", "chart-tooltip")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const tooltipRect = tooltip
      .append("rect")
      .attr("class", "tooltip-bg")
      .attr("rx", 6)
      .attr("ry", 6)
      .style("fill", "rgba(0, 0, 0, 0.85)");

    const tooltipText = tooltip
      .append("text")
      .attr("class", "tooltip-text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("fill", "white")
      .style("font-size", "16px") // Larger tooltip text
      .style("font-weight", "500")
      .style("font-family", "sans-serif");

    // Draw bars - larger bars
    const bars = svg
      .selectAll(".bar")
      .data(approvalData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(timeRange === "week" ? d.day : d.month))
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.count))
      .attr("fill", "#10B981")
      .attr("rx", 6) // More rounded corners
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("fill", "#34D399");

        const tooltipContent = `${d.count} approval${d.count !== 1 ? "s" : ""}`;

        const [xPos, yPos] = d3.pointer(event);
        tooltipText.text(tooltipContent);

        const bbox = tooltipText.node().getBBox();
        tooltipRect
          .attr("x", bbox.x - 15) // Larger padding
          .attr("y", bbox.y - 10)
          .attr("width", bbox.width + 30)
          .attr("height", bbox.height + 20);

        tooltip
          .raise()
          .attr("transform", `translate(${xPos},${yPos - 45})`)
          .style("opacity", 1);
      })
      .on("mousemove", function (event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip.raise().attr("transform", `translate(${xPos},${yPos - 45})`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "#10B981");
        tooltip.style("opacity", 0);
      });

    // Add count labels on bars - larger font
    svg
      .selectAll(".bar-label")
      .data(approvalData)
      .join("text")
      .attr("class", "bar-label")
      .attr(
        "x",
        (d) => x(timeRange === "week" ? d.day : d.month) + x.bandwidth() / 2
      )
      .attr("y", (d) => y(d.count) - 8) // Adjusted position
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .style("font-size", "14px") // Larger font
      .style("font-weight", "bold")
      .text((d) => d.count);

    // Add time labels - larger font
    svg
      .selectAll(".time-label")
      .data(approvalData)
      .join("text")
      .attr("class", "time-label")
      .attr(
        "x",
        (d) => x(timeRange === "week" ? d.day : d.month) + x.bandwidth() / 2
      )
      .attr("y", height - 15) // Adjusted position
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "13px") // Larger font
      .text((d) => (timeRange === "week" ? d.day : d.month));

    // Add Y-axis with larger labels
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .selectAll("text")
      .style("font-size", "12px") // Larger axis labels
      .style("fill", "#6b7280");
  };

  // Add this useEffect for handling outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest(".ue-menu-container")) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  // Modify your menu button to stop propagation
  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  useEffect(() => {
    if (mapRef.current && barRef.current) {
      drawCharts(mapRef.current, barRef.current);
    }
  }, []);

  useEffect(() => {
    if (showModal && modalMapRef.current && modalBarRef.current) {
      drawCharts(modalMapRef.current, modalBarRef.current);
    }
  }, [showModal]);

  const handleExport = () => {
    if (!chartContainerRef.current) return;

    html2canvas(chartContainerRef.current, {
      backgroundColor: "#fff",
      scale: 3, // Higher scale for better quality
      useCORS: true,
      logging: false, // Disable logging for better performance
      width: chartContainerRef.current.scrollWidth,
      height: chartContainerRef.current.scrollHeight,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = `users-overview-${period.toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const handleRemove = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="traffic-card" ref={chartContainerRef}>
        <div className="traffic-header">
          <h2>Organic Traffic</h2>
          <div className="traffic-controls">
            <select
              className="time-dropdown"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            <div className="ue-menu-container">
              <button
                className="ue-menu-btn"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <BsThreeDotsVertical />
              </button>
              {menuOpen && (
                <div
                  className="ue-menu-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="ue-menu-item"
                    onClick={() => setShowModal(true)}
                  >
                    <FaRegEye /> View
                  </div>
                  <div className="ue-menu-item" onClick={handleExport}>
                    <FaFileExport /> Export
                  </div>
                  <div
                    className="ue-menu-item ue-menu-item--danger"
                    onClick={onRemove}
                  >
                    <FaTrash /> Remove
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="traffic-chart-wrapper">
          <svg
            ref={mapRef}
            className="traffic-mapchart"
            viewBox="0 0 800 600"
          />
        </div>

        <div className="bar-chart-container">
          <img
            src="https://media0.giphy.com/media/gkDfaAbpXc571zByYZ/giphy.gif"
            alt="plane"
            className="floating-plane"
          />
          <div className="traffic-chart-wrapper bar-margin with-title">
            <div className="bar-chart-title">Traffic by Country</div>
            <svg
              ref={barRef}
              className="traffic-barchart"
              viewBox="0 0 600 400"
            />
          </div>
        </div>

        <div className="traffic-legend">
          <div className="legend-item">
            <span className="legend-color legend-color--registered" />{" "}
            Registered Users
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--new-users" /> New Users
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--visitors" /> Visitors
          </div>
        </div>
      </div>

      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ue-modal-window" onClick={(e) => e.stopPropagation()}>
            <button
              className="ue-modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <div className="ue-header">
              <h1 className="ue-title">Organic Traffic</h1>
            </div>
            <svg
              ref={modalMapRef}
              className="traffic-mapchart"
              viewBox="0 0 800 600"
            />
            <div className="traffic-chart-wrapper bar-margin with-title">
              <div className="bar-chart-title">Traffic by Country</div>
              <svg
                ref={modalBarRef}
                className="traffic-barchart"
                viewBox="0 0 600 400"
              />
            </div>

            <div className="traffic-legend">
              <div className="legend-item">
                <span className="legend-color legend-color--registered" />{" "}
                Registered Users
              </div>
              <div className="legend-item">
                <span className="legend-color legend-color--new-users" /> New
                Users
              </div>
              <div className="legend-item">
                <span className="legend-color legend-color--visitors" />{" "}
                Visitors
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Event Overview Chart */
/* Event Overview Chart */
function EventOverviewChart({
  onRemove,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
}) {
  const { token } = useAuth();
  const ref = useRef(null);
  const modalRef = useRef(null);
  const chartContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState("weekly");
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // NEW: Menu toggle function
  const toggleMenu = (e) => {
    e.stopPropagation();
    onMenuToggle();
  };

  // NEW: Menu item handlers
  const handleViewClick = () => {
    onMenuClose();
    setShowModal(true);
  };

  const handleRemoveClick = () => {
    onMenuClose();
    onRemove();
  };

  // Fetch events from API
  const fetchEventsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/event/getAllEvents");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      if (result.success) {
        const events = result.events || result.data || [];
        setEventsData(events);
      } else {
        throw new Error(result.message || "Failed to fetch events from server");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
      setEventsData([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventDate = (event) => {
    if (event?.eventDate) {
      return new Date(event.eventDate);
    } else if (event?.startDate) {
      return new Date(event.startDate);
    }
    return null;
  };

  const parseValidDates = (events) =>
    events.map((e) => getEventDate(e)).filter((d) => d && !isNaN(d.valueOf()));

  const formatWeekRange = (start, end) => {
    const format = d3.timeFormat("%b %d");
    return `${format(start)} - ${format(end)}`;
  };

  const formatMonthLabel = d3.timeFormat("%b %Y");

  function bucketWeekly(dates) {
    const weekFloor = d3.timeMonday.floor;
    const roll = d3.rollup(
      dates,
      (v) => v.length,
      (d) => +weekFloor(d)
    );

    return Array.from(roll, ([ts, count]) => {
      const start = new Date(Number(ts));
      const end = d3.timeDay.offset(d3.timeSunday.ceil(start), -1);
      const weekNumber = getISOWeek(start);

      return {
        keyDate: start,
        label: `Week ${weekNumber}`,
        weekRange: formatWeekRange(start, end),
        weekNumber: weekNumber,
        year: start.getFullYear(),
        count,
      };
    }).sort((a, b) => a.keyDate - b.keyDate);
  }

  function getISOWeek(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }

  function bucketMonthly(dates) {
    const monthFloor = d3.timeMonth.floor;
    const roll = d3.rollup(
      dates,
      (v) => v.length,
      (d) => +monthFloor(d)
    );
    return Array.from(roll, ([ts, count]) => {
      const start = new Date(Number(ts));
      return {
        keyDate: start,
        label: formatMonthLabel(start),
        count,
      };
    }).sort((a, b) => a.keyDate - b.keyDate);
  }

  // Chart renderer with larger dimensions
  function drawChart(svgNode, isModal = false) {
    const svg = d3.select(svgNode);
    svg.selectAll("*").remove();

    const dates = parseValidDates(eventsData);

    // Larger dimensions for the chart
    const width = isModal ? 800 : 1000; // Wider chart
    const height = isModal ? 350 : 350; // Taller chart
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMin meet");

    if (!dates.length) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .style("font-size", "14px")
        .text("No events to display");
      return;
    }

    const buckets =
      period === "weekly" ? bucketWeekly(dates) : bucketMonthly(dates);

    const x = d3
      .scaleBand()
      .domain(buckets.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(buckets, (d) => d.count) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Tooltip setup
    const tooltip = svg
      .append("g")
      .attr("class", "chart-tooltip")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const tooltipRect = tooltip
      .append("rect")
      .attr("class", "tooltip-bg")
      .attr("rx", 6)
      .attr("ry", 6)
      .style("fill", "rgba(0, 0, 0, 0.85)");

    const tooltipText = tooltip
      .append("text")
      .attr("class", "tooltip-text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("fill", "white")
      .style("font-size", "15px")
      .style("font-weight", "500")
      .style("font-family", "sans-serif");

    // X-axis
    const xAxis = d3.axisBottom(x).tickSize(0);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6b7280")
      .style("text-anchor", "middle")
      .style("font-family", "sans-serif");

    // Y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6b7280");

    // Bars - larger and more prominent
    const bars = svg
      .append("g")
      .selectAll("rect")
      .data(buckets)
      .join("rect")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.count))
      .attr("fill", "#9333ea")
      .attr("rx", 8)
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("fill", "#b57af0");

        let tooltipContent = `${d.count} events`;
        if (period === "weekly" && d.weekRange) {
          tooltipContent = `${d.year} ${d.weekRange}\n${d.count} events`;
        }

        const [xPos, yPos] = d3.pointer(event);
        tooltipText.text(tooltipContent);

        const bbox = tooltipText.node().getBBox();
        tooltipRect
          .attr("x", bbox.x - 10)
          .attr("y", bbox.y - 8)
          .attr("width", bbox.width + 20)
          .attr("height", bbox.height + 16);

        tooltip
          .raise()
          .attr("transform", `translate(${xPos},${yPos - 35})`)
          .style("opacity", 1);
      })
      .on("mousemove", function (event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip.raise().attr("transform", `translate(${xPos},${yPos - 35})`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "#9333ea");
        tooltip.style("opacity", 0);
      });

    // Values on bars - larger font
    svg
      .append("g")
      .selectAll("text.bar-val")
      .data(buckets)
      .join("text")
      .attr("class", "bar-val")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.count) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .text((d) => d.count);
  }

  // Event Overview Chart - Update export functions
  const handleExport = () => {
    onMenuClose();
    setTimeout(() => {
      try {
        const node = chartContainerRef.current;
        if (!node) return;
        html2canvas(node, {
          backgroundColor: "#fff",
          scale: 2,
          useCORS: true,
        }).then((canvas) => {
          const link = document.createElement("a");
          link.download = `event-overview-${period}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        });
      } catch (e) {
        console.error("Export failed:", e);
      }
    }, 100);
  };

  // Add modal export function
  const handleModalExport = () => {
    const modalElement = document.querySelector(".ue-modal-window.large-modal");
    if (modalElement) {
      html2canvas(modalElement, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `event-overview-modal-${period}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };
  useEffect(() => {
    fetchEventsData();
  }, []);

  useEffect(() => {
    if (ref.current) drawChart(ref.current);
  }, [eventsData, period]);

  useEffect(() => {
    if (showModal && modalRef.current) drawChart(modalRef.current, true);
  }, [showModal, eventsData, period]);

  return (
    <>
      <div className="ue-card" ref={chartContainerRef}>
        <div className="ue-header">
          <div>
            <h1 className="ue-title">Event Overview</h1>
            <p className="ue-total">
              Total Events: {eventsData.length}
              {error && " - " + error}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="modal-period-select"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            <button
              onClick={fetchEventsData}
              disabled={loading}
              style={{
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid #E2E7EB",
                backgroundColor: "white",
                cursor: "pointer",
                color: "rgb(107, 114, 128)",
                fontSize: "14px",
              }}
              title="Refresh data"
            >
              <FaSyncAlt className={loading ? "spinning" : ""} />
            </button>

            <div className="ue-menu-container">
              <button className="ue-menu-btn" onClick={toggleMenu}>
                <BsThreeDotsVertical />
              </button>
              {isMenuOpen && (
                <div
                  className="ue-menu-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="ue-menu-item" onClick={handleViewClick}>
                    <FaRegEye /> View
                  </div>
                  <div className="ue-menu-item" onClick={handleExport}>
                    <FaFileExport /> Export
                  </div>
                  <div
                    className="ue-menu-item ue-menu-item--danger"
                    onClick={handleRemoveClick}
                  >
                    <FaTrash /> Remove
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Chart Container */}
        <div className="ue-chart-scroll-container">
          <div ref={scrollContainerRef} className="ue-chart-scroll-content">
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px",
                  color: "#6b7280",
                  minWidth: "1000px",
                }}
              >
                Loading events data...
              </div>
            ) : (
              <svg
                ref={ref}
                className="ue-chart-scrollable"
                viewBox="0 0 1000 400"
                preserveAspectRatio="xMidYMin meet"
              />
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ue-modal-window large-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="ue-modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <div className="ue-header">
              <div>
                <h1 className="ue-title">Event Overview</h1>
                <p className="ue-total">Total Events: {eventsData.length}</p>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="modal-period-select"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {/* ADD Export Button */}
                <button
                  className="modal-export-btn"
                  onClick={handleModalExport}
                  title="Export modal as image"
                >
                  <FaFileExport /> Export
                </button>
              </div>
            </div>
            <svg
              ref={modalRef}
              className="ue-chart-large"
              viewBox="0 0 1200 500"
              preserveAspectRatio="xMidYMin meet"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

// Business Participation Chart Component
function BusinessParticipationChart({ onRemove }) {
  const ref = useRef();
  const chartContainerRef = useRef();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);

  // Add this useEffect for handling outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest(".ue-menu-container")) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  // Modify your menu button to stop propagation
  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  useEffect(() => {
    drawChart(ref.current);
  }, []);

  const drawChart = (svgNode) => {
    const width = 250;
    const height = 250;
    const thickness = 40;

    const data = [
      { label: "Active", value: 82.3, color: "#8DD96C" },
      { label: "Inactive", value: 17.7, color: "#A78BFA" },
    ];

    const radius = Math.min(width, height) / 2;
    const svg = d3.select(svgNode).attr("width", width).attr("height", height);

    svg.selectAll("*").remove(); // Clear previous render

    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arc = d3
      .arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius);

    const pie = d3
      .pie()
      .value((d) => d.value)
      .sort(null);

    chartGroup
      .selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#fff")
      .style("stroke-width", "2px");
  };

  const handleExport = () => {
    const chartEl = chartContainerRef.current;
    if (!chartEl) return;

    html2canvas(chartEl, {
      backgroundColor: "#fff",
      scale: 3,
      useCORS: true,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "business-participation-chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const handleRemove = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="business-chart-wrapper" ref={chartContainerRef}>
        <div className="bp-header">
          <div>
            <h1 className="bp-title">Business Participation</h1>
            <p className="bp-total">
              Percentage of Active vs. Inactive Businesses
            </p>
          </div>
          <div className="ue-menu-container">
            <button
              className="ue-menu-btn"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <BsThreeDotsVertical />
            </button>
            {menuOpen && (
              <div
                className="ue-menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="ue-menu-item"
                  onClick={() => setShowModal(true)}
                >
                  <FaRegEye /> View
                </div>
                <div className="ue-menu-item" onClick={handleExport}>
                  <FaFileExport /> Export
                </div>
                <div
                  className="ue-menu-item ue-menu-item--danger"
                  onClick={onRemove}
                >
                  <FaTrash /> Remove
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="chart-and-stats">
          <div className="BPchart-container">
            <svg ref={ref}></svg>
            <div className="chart-center-text">
              <div className="percentage">82.3%</div>
              <div className="label">Active Business</div>
            </div>
          </div>

          <div className="stats">
            <div className="stat-box">
              <div className="stat-icon">📈</div>
              <div className="stat-text">
                <div className="value">+18%</div>
                <div className="label">Daily Business Interaction</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🗓️</div>
              <div className="stat-text">
                <div className="value">+14%</div>
                <div className="label">Weekly New Listings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ue-modal-window" onClick={(e) => e.stopPropagation()}>
            <button
              className="ue-modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <div className="bp-header">
              <div>
                <h1 className="bp-title">Business Participation</h1>
                <p className="bp-total">
                  Percentage of Active vs. inactive Businesses
                </p>
              </div>
            </div>
            <div className="chart-and-stats modal-expanded">
              <div className="chart-container">
                <svg ref={(node) => node && drawChart(node)}></svg>
                <div className="chart-center-text">
                  <div className="percentage">82.3%</div>
                  <div className="label">Active Business</div>
                </div>
              </div>

              <div className="stats">
                <div className="stat-box">
                  <div className="stat-icon">📈</div>
                  <div className="stat-text">
                    <div className="value">+18%</div>
                    <div className="label">Daily Business Interaction</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">🗓️</div>
                  <div className="stat-text">
                    <div className="value">+14%</div>
                    <div className="label">Weekly New Listings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
/*Session Device Chart*/
function SessionDeviceChart({
  onRemove,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deviceData, setDeviceData] = useState([]);
  const chartContainerRef = useRef();

  // Fetch real device data
  useEffect(() => {
    fetchDeviceData();
  }, []);

  const fetchDeviceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/geoapify/analytics/device-usage?timeRange=7d&dataType=device`
      );
      const result = await response.json();

      if (result.success && result.data) {
        // Transform device data for session device chart
        const transformedData = transformDeviceData(result.data);
        setDeviceData(transformedData);
      } else {
        setDeviceData([]);
      }
    } catch (error) {
      console.error("Failed to fetch device data:", error);
      setDeviceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform API response to chart format
  const transformDeviceData = (apiData) => {
    // API returns data in format: [{ deviceType: "Mobile", count: 47, percentage: 47 }, ...]
    return apiData.map((item) => ({
      label: item.deviceType,
      value: item.percentage,
      color: getColorForDevice(item.deviceType),
      count: item.count,
    }));
  };

  // Get color based on device type
  const getColorForDevice = (deviceType) => {
    const colors = {
      Desktop: "#22C55E",
      Mobile: "#A855F7",
      Tablet: "#3B82F6",
    };
    return colors[deviceType] || "#6B7280";
  };

  // gauge geometry
  const GAUGE_WIDTH = 360; // total SVG width
  const GAUGE_HEIGHT = 180; // total SVG height
  const GAUGE_CX = 180; // horizontal center
  const GAUGE_CY = 160; // push arc toward bottom so it's not cut off
  const GAUGE_R = 100; // radius
  const STROKE_W = 24; // thickness of the arc

  // total percentage (should be ~100 but we compute anyway)
  const total = deviceData.reduce((acc, d) => acc + d.value, 0);

  // each segment gets a slice of 180 degrees
  const degrees = deviceData.map((d) => (d.value / total) * 180);

  // start from -180deg (left) and sweep to 0deg (right) so it's horizontal
  let startAngle = -180;

  const arcs = deviceData.map((d, i) => {
    const endAngle = startAngle + degrees[i];

    const path = describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, startAngle, endAngle);

    const isHovered = hoveredIndex === i;

    // because the gauge is horizontal we scale from the gauge center
    const transformOrigin = `${GAUGE_CX}px ${GAUGE_CY}px`;

    startAngle = endAngle;

    return (
      <g
        key={i}
        onMouseEnter={() => setHoveredIndex(i)}
        onMouseLeave={() => setHoveredIndex(null)}
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        style={{
          transformOrigin,
          transform: isHovered ? "scale(1.03)" : "scale(1)",
          transition: "transform 0.2s ease",
        }}
      >
        <path
          d={path}
          fill="none"
          stroke={d.color}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
        />

        <path
        //  d={path}
        //  fill="none"
        //  stroke={d.color}
        //  strokeWidth={STROKE_W}
        //  strokeLinecap="butt" // <-- was "round"
        //  style={{
        //    transition: "transform 0.2s ease",
        //  }}
        />
      </g>
    );
  });

  // Calculate total active users from real data
  const totalActiveUsers = deviceData.reduce(
    (acc, d) => acc + (d.count || 0),
    0
  );

  // NEW: Menu toggle function
  const toggleMenu = (e) => {
    e.stopPropagation();
    onMenuToggle();
  };

  const handleViewClick = () => {
    onMenuClose();
    setShowModal(true);
  };

  const handleRemoveClick = () => {
    onMenuClose();
    onRemove();
  };

  // Session Device Chart - Add export functions
  const handleExport = () => {
    onMenuClose();
    setTimeout(() => {
      if (!chartContainerRef.current) return;
      html2canvas(chartContainerRef.current, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = "session-device-chart.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }, 100);
  };

  const handleModalExport = () => {
    const modalElement = document.querySelector(".ue-modal-window");
    if (modalElement) {
      html2canvas(modalElement, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = "session-device-modal.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  const handleRemove = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="device-chart-card"
      style={{ position: "relative" }}
      ref={chartContainerRef}
    >
      {/* Header */}
      <div className="session-device-header">
        <h2 className="device-title">Session Device</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {loading && (
            <span style={{ color: "#6B7280", fontSize: "14px" }}>
              Loading...
            </span>
          )}
          {/* Refresh button with React icon */}
          <button
            onClick={fetchDeviceData}
            disabled={loading}
            style={{
              background: "transparent",
              color: "#6B7280",
              border: "1px solid #E5E7EB",
              padding: "6px 8px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Refresh device data"
          >
            <FaSyncAlt />
          </button>
          <div className="ue-menu-container">
            <button className="ue-menu-btn" onClick={toggleMenu}>
              <BsThreeDotsVertical />
            </button>
            {isMenuOpen && (
              <div
                className="ue-menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="ue-menu-item" onClick={handleViewClick}>
                  <FaRegEye /> View
                </div>
                <div className="ue-menu-item" onClick={handleExport}>
                  <FaFileExport /> Export
                </div>
                <div
                  className="ue-menu-item ue-menu-item--danger"
                  onClick={handleRemoveClick}
                >
                  <FaTrash /> Remove
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart + Stats */}
      <div className="device-chart-body">
        {deviceData.length > 0 ? (
          <>
            <svg
              viewBox={`0 0 ${GAUGE_WIDTH} ${GAUGE_HEIGHT}`}
              width="100%"
              height={GAUGE_HEIGHT}
              className="device-chart"
            >
              {arcs}
            </svg>

            <div className="device-stats">
              <div className="device-number">
                {totalActiveUsers >= 1000
                  ? `${(totalActiveUsers / 1000).toFixed(1)}k`
                  : totalActiveUsers}
              </div>
              <div className="device-label">Total sessions</div>
              <div className="device-legend">
                {deviceData.map((d, i) => (
                  <div key={i} className="legend-item">
                    <span
                      className="dot"
                      style={{ background: d.color }}
                    ></span>
                    {d.label} <strong>{d.value}%</strong>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        marginLeft: "4px",
                      }}
                    >
                      ({d.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#6B7280",
            }}
          >
            {loading ? "Loading device data..." : "No device data available"}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && deviceData[hoveredIndex] && (
        <div
          className="tooltip"
          style={{
            position: "fixed",
            top: mousePos.y + 15,
            left: mousePos.x + 15,
            background: "#fff",
            padding: "8px 12px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            fontSize: "18px",
            zIndex: 999,
            color: "#374151",
          }}
        >
          <strong>{deviceData[hoveredIndex].label}</strong>:{" "}
          {deviceData[hoveredIndex].value}%<br />
          <small>{deviceData[hoveredIndex].count} sessions</small>
        </div>
      )}

      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ue-modal-window" onClick={(e) => e.stopPropagation()}>
            <button
              className="ue-modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <div className="session-device-header">
              <h2 className="device-title">Session Device</h2>
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                {/* ADD Export Button with proper spacing */}
                <button
                  className="modal-export-btn1"
                  onClick={handleModalExport}
                  title="Export modal as image"
                >
                  <FaFileExport /> Export
                </button>
              </div>
            </div>

            {deviceData.length > 0 ? (
              <>
                <svg
                  width={350}
                  height={250}
                  viewBox="0 0 350 250"
                  className="device-chart"
                >
                  {arcs}
                </svg>

                <div className="device-stats">
                  <div className="device-number">
                    {totalActiveUsers >= 1000
                      ? `${(totalActiveUsers / 1000).toFixed(1)}k`
                      : totalActiveUsers}
                  </div>
                  <div className="device-label">Active sessions</div>
                  <div className="device-legend">
                    {deviceData.map((d, i) => (
                      <div key={i} className="legend-item">
                        <span
                          className="dot"
                          style={{ background: d.color }}
                        ></span>
                        {d.label} <strong>{d.value}%</strong>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginLeft: "4px",
                          }}
                        >
                          ({d.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6B7280",
                }}
              >
                No device data available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Arc drawing helpers (keep these the same)
function polarToCartesian(cx, cy, r, angle) {
  const rad = (Math.PI / 180) * angle;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

/* System Usage Chart */
function SystemUsageChart({ onRemove, isMenuOpen, onMenuToggle, onMenuClose }) {
  const [selectedRange, setSelectedRange] = useState("Today");
  const modalContainerRef = useRef();
  const chartContainerRef = useRef(); // ADD THIS for main chart export
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    value: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [systemData, setSystemData] = useState([]);

  // Fetch real system usage data from API
  useEffect(() => {
    fetchSystemData();
  }, [selectedRange]);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      // Convert frontend time range to backend format
      const timeRangeMap = {
        Today: "24h",
        Weekly: "7d",
        Monthly: "30d",
      };

      const response = await fetch(
        `/api/geoapify/analytics/system-usage?timeRange=${timeRangeMap[selectedRange]}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setSystemData(result.data);
      } else {
        setSystemData([]);
        console.error("API returned error:", result.error);
      }
    } catch (error) {
      console.error("Failed to fetch system data:", error);
      setSystemData([]);
    } finally {
      setLoading(false);
    }
  };

  const currentData = systemData;

  const toggleMenu = (e) => {
    e.stopPropagation();
    onMenuToggle();
  };

  const handleViewClick = () => {
    onMenuClose();
    setShowModal(true);
  };

  const handleRemoveClick = () => {
    onMenuClose();
    onRemove();
  };

  // FIXED: Main chart export function
  const handleExport = () => {
    onMenuClose();
    setTimeout(() => {
      if (!chartContainerRef.current) {
        console.error("Chart container not found");
        return;
      }

      html2canvas(chartContainerRef.current, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
        logging: true,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `system-usage-${selectedRange.toLowerCase()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
        .catch((error) => {
          console.error("Export failed:", error);
        });
    }, 100);
  };

  // FIXED: Modal export function
  const handleModalExport = () => {
    if (!modalContainerRef.current) {
      console.error("Modal container not found");
      return;
    }

    html2canvas(modalContainerRef.current, {
      backgroundColor: "#fff",
      scale: 2,
      useCORS: true,
      logging: true,
    })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = `system-usage-modal-${selectedRange.toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      })
      .catch((error) => {
        console.error("Modal export failed:", error);
      });
  };

  if (!visible) return null;

  return (
    <>
      {/* Main chart - using original browser-card class */}
      <div className="browser-card" ref={chartContainerRef}>
        {" "}
        {/* ADDED ref here */}
        <div className="browser-header">
          {/* Only title changed to "System Usage" */}
          <h3>System Usage</h3>

          <div
            className="BU-dropdown-container"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <select
              className="BU-modal-dropdown"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>

            {loading && (
              <span style={{ color: "#6B7280", fontSize: "14px" }}>
                Loading...
              </span>
            )}

            {/* Refresh button */}
            <button
              onClick={fetchSystemData}
              disabled={loading}
              style={{
                background: "transparent",
                color: "#6B7280",
                border: "1px solid #E5E7EB",
                padding: "6px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Refresh system data"
            >
              <FaSyncAlt className={loading ? "spinning" : ""} />
            </button>

            <div className="ue-menu-container" style={{ position: "relative" }}>
              <button className="ue-menu-btn" onClick={toggleMenu}>
                <BsThreeDotsVertical />
              </button>
              {isMenuOpen && (
                <div
                  className="ue-menu-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="ue-menu-item" onClick={handleViewClick}>
                    <FaRegEye /> View
                  </div>
                  <div className="ue-menu-item" onClick={handleExport}>
                    <FaFileExport /> Export
                  </div>
                  <div
                    className="ue-menu-item ue-menu-item--danger"
                    onClick={handleRemoveClick}
                  >
                    <FaTrash /> Remove
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}
          >
            Loading system data...
          </div>
        ) : currentData.length > 0 ? (
          <>
            {/* Using original browser-bars class */}
            <div className="browser-bars">
              {currentData.map((system, index) => (
                <div key={index} className="browser-row">
                  <span className="browser-icon">{system.icon}</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{ width: `${system.percent}%` }}
                      onMouseEnter={(e) =>
                        setTooltip({
                          visible: true,
                          x: e.clientX,
                          y: e.clientY,
                          name: system.name,
                          value: system.percent,
                        })
                      }
                      onMouseMove={(e) =>
                        setTooltip((prev) => ({
                          ...prev,
                          x: e.clientX,
                          y: e.clientY,
                        }))
                      }
                      onMouseLeave={() =>
                        setTooltip({ visible: false, x: 0, y: 0, value: 0 })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="percent-labels">
              {[0, 20, 40, 60, 80, 100].map((p) => (
                <span key={p} className="percent-label">
                  {p}%
                </span>
              ))}
            </div>
          </>
        ) : (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}
          >
            No system data available
          </div>
        )}
        <div className="browser-legend">
          {currentData.map((system, i) => (
            <div key={i} className="legend-item">
              <div className="browser-main">
                <span className="browser-icon">{system.icon}</span>
                <span>{system.name}</span>
              </div>

              <div className="legend-stats">
                <strong>{system.percent}%</strong>
                <span>({system.count} sessions)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip - using original BU_tooltip class */}
      {tooltip.visible && (
        <svg
          className="BU_tooltip"
          style={{
            position: "fixed",
            left: tooltip.x + 10,
            top: tooltip.y - 30,
            pointerEvents: "none",
            zIndex: 9999,
          }}
          width="140"
          height="35"
        >
          <rect
            className="BU_tooltip-bg"
            x="0"
            y="0"
            rx="4"
            ry="4"
            width="140"
            height="35"
            fill="#fff"
            stroke="#ccc"
          />
          <text
            className="BU_tooltip-text"
            x="70"
            y="25"
            textAnchor="middle"
            fill="#333"
            fontSize="17"
          >
            {tooltip.name}: {tooltip.value}%
          </text>
        </svg>
      )}

      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ue-modal-window system-usage-modal"
            ref={modalContainerRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="browser-modal-header">
              <h3>System Usage ({selectedRange})</h3>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <select
                  className="BU-modal-dropdown"
                  value={selectedRange}
                  onChange={(e) => setSelectedRange(e.target.value)}
                >
                  <option value="Today">Today</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>

                {/* UPDATE Export Button to use new function */}
                <button
                  className="modal-export-btn"
                  onClick={handleModalExport}
                  title="Export modal as image"
                >
                  <FaFileExport /> Export
                </button>
              </div>
              <button
                className="ue-modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            {currentData.length > 0 ? (
              <>
                <div className="browser-bars">
                  {currentData.map((system, index) => (
                    <div key={index} className="browser-row">
                      <span className="browser-icon">{system.icon}</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${system.percent}%` }}
                          onMouseEnter={(e) =>
                            setTooltip({
                              visible: true,
                              x: e.clientX,
                              y: e.clientY,
                              name: system.name,
                              value: system.percent,
                            })
                          }
                          onMouseMove={(e) =>
                            setTooltip((prev) => ({
                              ...prev,
                              x: e.clientX,
                              y: e.clientY,
                            }))
                          }
                          onMouseLeave={() =>
                            setTooltip({ visible: false, x: 0, y: 0, value: 0 })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="percent-labels">
                  {[0, 20, 40, 60, 80, 100].map((p) => (
                    <span key={p} className="percent-label">
                      {p}%
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6B7280",
                }}
              >
                No system data available
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

/* Users Overview Chart */
function UsersOverviewChart({
  onRemove,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
}) {
  const chartRef = useRef();
  const { accessToken } = useAuth();
  const chartContainerRef = useRef();
  const modalRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState("Weekly");
  const [isMounted, setIsMounted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const modalContainerRef = useRef(); // ADD THIS for modal export

  const handleExport = () => {
    onMenuClose();
    setTimeout(() => {
      if (!chartContainerRef.current) {
        console.error("Chart container not found");
        return;
      }

      // Use the actual DOM element instead of querySelector
      html2canvas(chartContainerRef.current, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
        logging: true, // Enable logging to see what's happening
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `users-overview-${period.toLowerCase()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
        .catch((error) => {
          console.error("Export failed:", error);
        });
    }, 100);
  };
  const handleModalExport = () => {
    onMenuClose();

    setTimeout(() => {
      const svgElement = document.querySelector(
        ".ue-modal-window .UO_chart-svg"
      );
      if (!svgElement) return;

      // Serialize SVG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create image from SVG
      const img = new Image();
      img.onload = function () {
        // Create canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set dimensions (slightly larger for better quality)
        canvas.width = 1000;
        canvas.height = 600;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw SVG
        ctx.drawImage(img, 50, 50, 900, 500);

        // Add title text
        ctx.fillStyle = "#111827";
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI"';
        ctx.fillText(`Users Overview (${period})`, 50, 40);

        // Create download
        const link = document.createElement("a");
        link.download = `users-overview-${period.toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        // Clean up
        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    }, 300);
  };

  // NEW: Simplified toggle menu function
  const toggleMenu = (e) => {
    e.stopPropagation();
    onMenuToggle();
  };
  const handleViewClick = () => {
    onMenuClose();
    setShowModal(true);
  };

  const handleRemoveClick = () => {
    onMenuClose();
    onRemove();
  };
  // Fetch real user registration data
  useEffect(() => {
    fetchUserData();
  }, [period]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching user data for period:", period);

      const response = await fetch(
        `/api/dashboard/user-registrations?period=${period.toLowerCase()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("📊 API Response Data:", result);

      if (result.success && result.data) {
        console.log("✅ User data received:", result.data);
        setUserData(result.data);
      } else {
        throw new Error(result.message || "No data received");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      // For demo purposes, create sample data if API fails
      if (period === "Monthly") {
        setUserData(generateMonthlySampleData());
      } else {
        setUserData([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate sample monthly data for 6 months
  const generateMonthlySampleData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month) => ({
      month,
      count: Math.floor(Math.random() * 100) + 20,
    }));
  };

  // Transform data based on period - SIMPLIFIED
  const transformData = (apiData, period) => {
    if (!apiData || apiData.length === 0) return [];

    if (period === "Weekly") {
      return apiData.map((item) => ({
        day: item.day,
        value: item.count,
      }));
    } else {
      // Monthly data - use month names directly
      return apiData.map((item) => ({
        day: item.month, // Using 'day' field for consistent chart usage
        value: item.count,
      }));
    }
  };

  const currentData = transformData(userData, period);

  // Draw chart - UPDATED FOR CONSISTENT PURPLE COLORS
  const drawChart = (svgElement, isModal = false) => {
    const data = currentData;
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    // If no data or loading, show message
    if (data.length === 0) {
      svg
        .append("text")
        .attr("x", 300)
        .attr("y", 150)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .text(loading ? "Loading user data..." : "No user data available");
      return;
    }

    // Fixed dimensions for 6 bars
    const width = 600;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.day))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value * 1.15)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Y-axis
    const yAxis = d3
      .axisLeft(y)
      .ticks(5)
      .tickFormat((d) => `${d}`);

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("x1", 5)
          .attr("x2", -width + margin.left + margin.right)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("x", -15)
          .attr("dy", 2)
          .style("font-size", "12px")
          .style("fill", "#6b7280")
      );

    // Gradient for area chart - CONSISTENT PURPLE FOR BOTH WEEKLY AND MONTHLY
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "areaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#c084fc") // Purple color
      .attr("stop-opacity", 0.6);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#c084fc") // Purple color
      .attr("stop-opacity", 0.1);

    // Area chart for both weekly and monthly - CONSISTENT PURPLE
    const xArea = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([x(data[0].day), x(data[data.length - 1].day) + x.bandwidth()]);

    const area = d3
      .area()
      .x((d, i) => xArea(i))
      .y0(y(0))
      .y1((d) => y(d.value) * 0.7)
      .curve(d3.curveNatural);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "url(#areaGradient)")
      .attr("d", area)
      .attr("opacity", 0.7)
      .attr("stroke", "#9333ea") // Consistent purple stroke
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.3);

    // Bars - CONSISTENT PURPLE FOR BOTH WEEKLY AND MONTHLY
    const bars = svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "UO_bar")
      .attr("x", (d) => x(d.day))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", "#9333ea") // Consistent purple bars
      .attr("rx", 6);

    // Tooltip - consistent styling
    const tooltip = svg
      .append("g")
      .attr("class", "chart-tooltip")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const tooltipBg = tooltip
      .append("rect")
      .attr("class", "tooltip-bg")
      .attr("rx", 6)
      .attr("ry", 6)
      .style("fill", "rgba(0, 0, 0, 0.85)");

    const tooltipText = tooltip
      .append("text")
      .attr("class", "tooltip-text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("fill", "white")
      .style("font-size", "19px")
      .style("font-weight", "300")
      .style("font-family", "sans-serif");

    bars
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("fill", "#b57af0"); // Consistent purple hover

        tooltip.style("opacity", 1);
      })
      .on("mousemove", function (event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip.attr("transform", `translate(${xPos},${yPos - 35})`);
        tooltipText.text(`${d.value} users`);

        const bbox = tooltipText.node().getBBox();
        tooltipBg
          .attr("x", bbox.x - 10)
          .attr("y", bbox.y - 8)
          .attr("width", bbox.width + 20)
          .attr("height", bbox.height + 16);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "#9333ea"); // Consistent purple
        tooltip.style("opacity", 0);
      });

    // X-axis labels
    svg
      .selectAll(".day-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "day-label")
      .attr("x", (d) => x(d.day) + x.bandwidth() / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", period === "Weekly" ? "11px" : "12px")
      .style("fill", "#6b7280")
      .text((d) => d.day);

    // Value labels on bars - CONSISTENT COLOR
    svg
      .selectAll(".value-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", (d) => x(d.day) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#4C1D95") // Consistent dark purple
      .text((d) => d.value);
  };

  useEffect(() => {
    if (chartRef.current) drawChart(chartRef.current);
  }, [period, userData, loading]);

  useEffect(() => {
    if (showModal && modalRef.current) drawChart(modalRef.current, true);
  }, [showModal, period, userData, loading]);

  if (!isMounted) return null;

  const totalUsers = currentData.reduce((sum, item) => sum + item.value, 0);
  const isMonthly = period === "Monthly";

  return (
    <div className="UO_chart-container" ref={chartContainerRef}>
      <div className="UO_chart-header">
        <h3 className="UO_chart-title">Users Overview</h3>
        <div
          className="UO_dropdown-container"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <select
            className="custom-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>

          {loading && (
            <span style={{ color: "#6B7280", fontSize: "14px" }}>
              Loading...
            </span>
          )}
          {/* ADD REFRESH BUTTON HERE */}
          <button
            onClick={fetchUserData}
            disabled={loading}
            style={{
              background: "transparent",
              color: "#6B7280",
              border: "1px solid #E5E7EB",
              padding: "6px 8px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Refresh user data"
          >
            <FaSyncAlt className={loading ? "spinning" : ""} />
          </button>

          <div className="ue-menu-container" style={{ position: "relative" }}>
            <button
              className="ue-menu-btn"
              onClick={toggleMenu} // UPDATED: Use new toggle function
            >
              <BsThreeDotsVertical />
            </button>
            {isMenuOpen && ( // UPDATED: Use prop instead of local state
              <div
                className="ue-menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="ue-menu-item"
                  onClick={handleViewClick} // UPDATED: Use new handler
                >
                  <FaRegEye /> View
                </div>
                <div
                  className="ue-menu-item"
                  onClick={handleExport} // UPDATED: Use export function directly
                >
                  <FaFileExport /> Export
                </div>
                <div
                  className="ue-menu-item ue-menu-item--danger"
                  onClick={handleRemoveClick} // UPDATED: Use new handler
                >
                  <FaTrash /> Remove
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Summary */}
      {currentData.length > 0 && (
        <div className="data-summary">
          <div className="summary-item">
            <span className="summary-label">Total Registrations:</span>
            <span className="summary-value">{totalUsers} users</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Time Period:</span>
            <span className="summary-value">
              {period === "Weekly" ? "Last 7 days" : "Last 6 months"}
            </span>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="chart-wrapper">
        <svg
          ref={chartRef}
          className="UO_chart-svg"
          viewBox="0 0 600 300"
          preserveAspectRatio="xMidYMin meet"
        />
      </div>

      {/* Modal - keep this part unchanged */}
      {showModal && (
        <div
          className="ue-modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="ue-modal-window"
            ref={modalContainerRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "16px",
              maxWidth: "900px",
              width: "90%",
              height: "90%",
              position: "relative",
              margin: "auto",
            }}
          >
            <div className="UO_chart-header">
              <h3 className="UO_chart-title">Users Overview ({period})</h3>
              <div
                className="UO-viewUI_dropdown-container"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <select
                  className="custom-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>

                {loading && (
                  <span style={{ color: "#6B7280", fontSize: "14px" }}>
                    Loading...
                  </span>
                )}

                {/* ADD Export Button */}
                <button
                  className="modal-export-btn"
                  onClick={handleModalExport}
                  title="Export modal as image"
                >
                  <FaFileExport /> Export
                </button>
              </div>
              <button
                className="ue-modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="chart-wrapper">
              <svg
                ref={modalRef}
                className="UO_chart-svg"
                viewBox="0 0 600 300"
                preserveAspectRatio="xMidYMin meet"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Add this new chart component to your ViewAnalytics.jsx file
function BusinessStatusChart({
  onRemove,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
}) {
  const chartRef = useRef();
  const modalRef = useRef();
  const chartContainerRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("week"); // "week" or "month"
  const [approvalData, setApprovalData] = useState([]);

  const fetchApprovalData = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/businesses/approved", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const raw = await response.json(); // <-- only once
      console.log("raw approval data from server:", raw);

      if (!response.ok) {
        console.error("Failed to fetch approval data:", response.status);
        setApprovalData([]);
        return;
      }

      // take the array from raw.data
      const businesses = Array.isArray(raw.data) ? raw.data : [];
      if (businesses.length === 0) {
        console.warn("No approved businesses in response");
        setApprovalData([]);
        return;
      }

      const transformed = transformApprovalData(businesses, timeRange);
      setApprovalData(Array.isArray(transformed) ? transformed : []);
    } catch (err) {
      console.error("Error fetching approval data:", err);
      setApprovalData([]);
    } finally {
      setLoading(false);
    }
  };

  const transformApprovalData = (data, range) => {
    if (!Array.isArray(data) || data.length === 0) return [];

    // take all submissionDate values and convert to Date objects
    const dates = data
      .map((item) => {
        // some older records might use submissionDate or createdAt
        const ts = item.submissionDate || item.createdAt;
        return ts ? new Date(ts) : null;
      })
      .filter(Boolean); // remove nulls

    if (range === "week") {
      // [{ day: "Sun", count: N }, ... "Sat"]
      return groupByWeek(dates).map((d) => ({
        day: d.day,
        count: d.count,
      }));
    } else {
      // [{ month: "Oct", count: N, year: 2025, monthIndex: 9 }, ...]
      return groupByMonth(dates).map((d) => ({
        month: d.month,
        year: d.year,
        monthIndex: d.monthIndex,
        count: d.count,
      }));
    }
  };

  // Group dates by week
  const groupByWeek = (dates) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = days.map((day) => ({ day, count: 0 }));

    dates.forEach((date) => {
      if (date >= weekAgo) {
        const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        result[dayIndex].count++;
      }
    });

    return result;
  };

  // Group dates by month
  const groupByMonth = (dates) => {
    const now = new Date();
    console.log("🕐 CURRENT DATE:", now);
    console.log(
      "🕐 Current year:",
      now.getFullYear(),
      "Current month:",
      now.getMonth()
    );
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    console.log("📅 Six months ago:", sixMonthsAgo);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const result = [];

    // Create last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: monthNames[date.getMonth()],
        count: 0,
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      });
    }

    console.log(
      "📊 Expected months in result:",
      result.map((r) => `${r.month} ${r.year}`)
    );

    // Debug each date to see where it gets placed
    dates.forEach((date, index) => {
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const monthName = monthNames[monthIndex];

      console.log(
        `📅 Processing date ${index}: ${date} (${monthName} ${year})`
      );

      const resultIndex = result.findIndex((item) => {
        const matches = item.monthIndex === monthIndex && item.year === year;
        console.log(
          `   Comparing to: ${item.month} ${item.year} -> ${matches}`
        );
        return matches;
      });

      if (resultIndex !== -1) {
        result[resultIndex].count++;
        console.log(`   ✅ ADDED to ${result[resultIndex].month}`);
      } else {
        console.log(`   ❌ NOT IN RANGE: ${monthName} ${year}`);
      }
    });

    console.log("📈 Final monthly result:", result);
    return result;
  };

  console.log("Approval Data:", approvalData);
  console.log(
    "Tuesday data:",
    approvalData.find((d) => d.day === "Tue")
  );

  const drawChart = (svgNode) => {
    const svg = d3.select(svgNode);
    svg.selectAll("*").remove();

    const width = 300;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Empty state
    if (approvalData.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .style("font-size", "14px")
        .text(
          loading ? "Loading approval data..." : "No approval data available"
        );
      return;
    }

    const x = d3
      .scaleBand()
      .domain(approvalData.map((d) => (timeRange === "week" ? d.day : d.month)))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    // FIXED: Consistent y-scale domain
    const maxValue = d3.max(approvalData, (d) => d.count);
    const consistentMax = Math.max(maxValue * 1.15, 10); // Minimum of 10, or 15% above max

    const y = d3
      .scaleLinear()
      .domain([0, consistentMax])
      .range([height - margin.bottom, margin.top]);

    // Create tooltip group FIRST - consistent with other charts
    const tooltip = svg
      .append("g")
      .attr("class", "chart-tooltip")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const tooltipRect = tooltip
      .append("rect")
      .attr("class", "tooltip-bg")
      .attr("rx", 6)
      .attr("ry", 6)
      .style("fill", "rgba(0, 0, 0, 0.85)");

    const tooltipText = tooltip
      .append("text")
      .attr("class", "tooltip-text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("fill", "white")
      .style("font-size", "11px")
      .style("font-weight", "300")
      .style("font-family", "sans-serif");

    // Draw bars
    const bars = svg
      .selectAll(".bar")
      .data(approvalData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(timeRange === "week" ? d.day : d.month))
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.count))
      .attr("fill", "#10B981")
      .attr("rx", 4)
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("fill", "#34D399");

        const tooltipContent = `${d.count} approval${d.count !== 1 ? "s" : ""}`;

        const [xPos, yPos] = d3.pointer(event);
        tooltipText.text(tooltipContent);

        const bbox = tooltipText.node().getBBox();
        tooltipRect
          .attr("x", bbox.x - 10)
          .attr("y", bbox.y - 8)
          .attr("width", bbox.width + 20)
          .attr("height", bbox.height + 16);

        tooltip
          .raise()
          .attr("transform", `translate(${xPos},${yPos - 35})`)
          .style("opacity", 1);
      })
      .on("mousemove", function (event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip.raise().attr("transform", `translate(${xPos},${yPos - 35})`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "#10B981");
        tooltip.style("opacity", 0);
      });

    // Add count labels on bars
    svg
      .selectAll(".bar-label")
      .data(approvalData)
      .join("text")
      .attr("class", "bar-label")
      .attr(
        "x",
        (d) => x(timeRange === "week" ? d.day : d.month) + x.bandwidth() / 2
      )
      .attr("y", (d) => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text((d) => d.count);

    // Add time labels
    svg
      .selectAll(".time-label")
      .data(approvalData)
      .join("text")
      .attr("class", "time-label")
      .attr(
        "x",
        (d) => x(timeRange === "week" ? d.day : d.month) + x.bandwidth() / 2
      )
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "11px")
      .text((d) => (timeRange === "week" ? d.day : d.month));
  };

  // Business Status Chart - Add export functions
  const handleExport = () => {
    onMenuClose();
    setTimeout(() => {
      if (!chartContainerRef.current) return;
      html2canvas(chartContainerRef.current, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `business-approvals-${timeRange}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }, 100);
  };

  const handleModalExport = () => {
    const modalElement = document.querySelector(".ue-modal-window");
    if (modalElement) {
      html2canvas(modalElement, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `business-approvals-modal-${timeRange}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  // NEW: Menu toggle function
  const toggleMenu = (e) => {
    e.stopPropagation();
    onMenuToggle();
  };

  // NEW: Menu item handlers
  const handleViewClick = () => {
    onMenuClose();
    setShowModal(true);
  };

  const handleRemoveClick = () => {
    onMenuClose();
    onRemove();
  };
  // Fetch data on mount and when timeRange changes
  useEffect(() => {
    fetchApprovalData();
  }, [timeRange]);

  // Draw chart when data changes
  useEffect(() => {
    if (chartRef.current) drawChart(chartRef.current);
  }, [approvalData, loading, timeRange]);

  useEffect(() => {
    if (showModal && modalRef.current) drawChart(modalRef.current);
  }, [showModal, approvalData, loading, timeRange]);

  if (!visible) return null;

  const totalApprovals = approvalData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <>
      <div className="business-chart-wrapper" ref={chartContainerRef}>
        <div className="bp-header">
          <div>
            <h1 className="bp-title">Business Approvals</h1>
            <p className="bp-total">
              {timeRange === "week"
                ? "Weekly Approval Trends"
                : "Monthly Approval Trends"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="custom-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>

            {loading && (
              <span style={{ color: "#6B7280", fontSize: "14px" }}>
                Loading...
              </span>
            )}

            <button
              onClick={fetchApprovalData}
              disabled={loading}
              style={{
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid #E2E7EB",
                backgroundColor: "white",
                cursor: "pointer",
                color: "rgb(107, 114, 128)",
                fontSize: "14px",
              }}
              title="Refresh data"
            >
              <FaSyncAlt className={loading ? "spinning" : ""} />
            </button>

            <div className="ue-menu-container">
              <button className="ue-menu-btn" onClick={toggleMenu}>
                <BsThreeDotsVertical />
              </button>
              {isMenuOpen && (
                <div
                  className="ue-menu-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="ue-menu-item" onClick={handleViewClick}>
                    <FaRegEye /> View
                  </div>
                  <div className="ue-menu-item" onClick={handleExport}>
                    <FaFileExport /> Export
                  </div>
                  <div
                    className="ue-menu-item ue-menu-item--danger"
                    onClick={handleRemoveClick}
                  >
                    <FaTrash /> Remove
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="chart-and-stats">
          <div className="BPchart-container">
            <svg
              ref={chartRef}
              className="business-status-svg"
              viewBox="0 0 300 200"
              preserveAspectRatio="xMidYMin meet"
            />
          </div>

          <div className="stats">
            <div className="stat-box">
              <div className="stat-icon">📈</div>
              <div className="stat-text">
                <div className="value">{totalApprovals}</div>
                <div className="label">Total Approved</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">⚡</div>
              <div className="stat-text">
                <div className="value">
                  {approvalData.length > 0
                    ? Math.max(...approvalData.map((d) => d.count))
                    : 0}
                </div>
                <div className="label">Peak in Period</div>

                <div className="label">Peak Approvals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ue-modal-window" onClick={(e) => e.stopPropagation()}>
            <button
              className="ue-modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <div className="bp-header">
              <div>
                <h1 className="bp-title">Business Approvals</h1>
                <p className="bp-total">
                  {timeRange === "week"
                    ? "Weekly Approval Trends"
                    : "Monthly Approval Trends"}
                </p>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="modal-period-select"
              >
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
              {/* ADD Export Button */}
              <button
                className="modal-export-btn2"
                onClick={handleModalExport}
                title="Export modal as image"
              >
                <FaFileExport /> Export
              </button>
            </div>
            <div className="chart-and-stats modal-expanded">
              <div className="BPchart-container">
                <svg
                  ref={modalRef}
                  className="business-status-svg"
                  viewBox="0 0 300 200"
                  preserveAspectRatio="xMidYMin meet"
                />
              </div>

              <div className="stats">
                <div className="stat-box">
                  <div className="stat-icon">📈</div>
                  <div className="stat-text">
                    <div className="value">{totalApprovals}</div>
                    <div className="label">Total Approved</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-text">
                    <div className="value">
                      {Math.max(...approvalData.map((d) => d.count))}
                    </div>
                    <div className="label">Peak Approvals</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed breakdown in modal */}
            <div className="approval-breakdown">
              <h4>Detailed Breakdown</h4>
              <div className="breakdown-list">
                {approvalData.map((item, index) => (
                  <div key={index} className="breakdown-item">
                    <span className="period">
                      {timeRange === "week" ? item.day : item.month}
                    </span>
                    <span className="count">{item.count} approvals</span>
                    <span className="percentage">
                      ({Math.round((item.count / totalApprovals) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .approval-breakdown {
          margin-top: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .approval-breakdown h4 {
          margin: 0 0 12px 0;
          color: #1e293b;
        }

        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .period {
          font-weight: 500;
          color: #374151;
        }

        .count {
          color: #10b981;
          font-weight: 500;
        }

        .percentage {
          color: #6b7280;
          font-size: 12px;
        }
      `}</style>
    </>
  );
}

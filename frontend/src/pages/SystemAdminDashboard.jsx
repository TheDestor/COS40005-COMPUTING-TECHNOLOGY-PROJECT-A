// Top imports
import React, { useEffect, useRef } from "react";
import {
  FaTachometerAlt,
  FaRegSave,
  FaUser,
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { AiOutlineFundView } from "react-icons/ai";
import * as d3 from "d3";
import SystemAdminSidebar from "../pages/SystemAdminSidebar";
import { useAuth } from "../context/AuthProvider";
import ky from "ky";
import { Link, useNavigate } from "react-router-dom";
import defaultImage from "../assets/Kuching.png";
import EditUserForm from "../components/EditUserForm";
import "../styles/SystemAdminDashboard.css"; // Add this line with your other imports

import { useState } from "react";

function SystemAdminDashboard() {
  const chartRef = useRef(null);
  const pageViewSectionRef = useRef(null);
  const usersSectionRef = useRef(null);
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const { accessToken } = useAuth();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);

  // KPI stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    recaptchaBlocked: 0,
    dbStoragePercent: 0,
    totalUniqueVisitors: 0,
    statusBreakdown: { active: 0, inactive: 0, suspended: 0 },
    // New
    newUsersToday: 0,
    uniqueVisitorsToday: 0,
  });
  const [backupStatus, setBackupStatus] = useState("Unknown");
  const [backupTime, setBackupTime] = useState("—");
  const backupPrimaryText = `${backupStatus}`;
  const userPrimaryText = `${dashboardStats.totalUsers.toLocaleString()}`;
  const viewsPrimaryText = `${dashboardStats.totalUniqueVisitors.toLocaleString()}`;

  // ADD AFTER YOUR EXISTING STATES (around line 40):
  const [timeframe, setTimeframe] = useState("monthly"); // 'weekly', 'monthly'
  const [pageViewsData, setPageViewsData] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await ky
          .get("/api/admin/metrics/stats", {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .json();
        if (res?.success) {
          console.log("Full API response:", res.data); // 👈 Add this to see all available data
          const d = res.data;
          setDashboardStats({
            totalUsers: d.totalUsers || 0,
            recaptchaBlocked: d.recaptchaBlocked || 0,
            dbStoragePercent: d.dbStoragePercent || 0,
            totalUniqueVisitors: d.totalUniqueVisitors ?? d.totalPageViews ?? 0,
            statusBreakdown: d.statusBreakdown || {
              active: 0,
              inactive: 0,
              suspended: 0,
            },
            newUsersToday: d.newUsersToday || 0,
            uniqueVisitorsToday: d.uniqueVisitorsToday || 0,
          });
        }
      } catch (e) {
        console.error("Failed to fetch admin metrics:", e);
      }
    };
    fetchMetrics();
    const t = setInterval(fetchMetrics, 30000);
    return () => clearInterval(t);
  }, [accessToken]);

  // Fetch backup status/time
  useEffect(() => {
    const fetchBackupStatus = async () => {
      try {
        const res = await ky
          .get("/api/admin/backup/status", {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .json();
        const isOutdated = Boolean(res?.isOutdated);
        setBackupStatus(isOutdated ? "Unhealthy" : "Healthy");
        setBackupTime(res?.lastBackupAtMYT || "No backups yet");
      } catch (e) {
        console.error("Failed to fetch backup status:", e);
        setBackupStatus("Unknown");
        setBackupTime("—");
      }
    };
    fetchBackupStatus();
  }, [accessToken]);

  // Summary cards
  const summaryData = [
    {
      title: "Backup Last Run",
      value: backupTime,
      icon: <FaRegSave />,
      cardClass: backupStatus === "Healthy" ? "green-theme" : "purple-theme",
      iconBgClass: backupStatus === "Healthy" ? "green-bg" : "purple-bg",
    },
    {
      title: "Users Registered Today",
      value: dashboardStats.newUsersToday.toLocaleString(),
      icon: <FaUser />,
      cardClass: "blue-theme",
      iconBgClass: "blue-bg",
    },
    {
      title: "Unique Visitors Today",
      value: dashboardStats.uniqueVisitorsToday.toLocaleString(),
      icon: <AiOutlineFundView />,
      cardClass: "teal-theme",
      iconBgClass: "teal-bg",
    },
  ];

  // Fetch data from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await ky
          .get("/api/userManagement/users?sort=createdAt_desc&limit=5", {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .json();

        if (response.success) {
          const formattedUsers = response.users.map((user) => {
            const createdAt = user.createdAt ? new Date(user.createdAt) : null;
            const isNew = createdAt
              ? Date.now() - createdAt.getTime() <= 24 * 60 * 60 * 1000
              : false;
            return {
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              role: user.role,
              lastLogin: user.lastLogin || "N/A",
              image:
                user.avatarUrl && user.avatarUrl.trim()
                  ? user.avatarUrl
                  : defaultImage,
              isNew,
            };
          });
          setUsersList(formattedUsers);
        } else {
          console.error(response.message);
        }
      } catch (error) {
        console.error("Failed to fetch users: ", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Add a small delay to ensure the container is fully rendered with correct dimensions
    const timer = setTimeout(() => {
      if (chartRef.current) {
        // Clear any existing chart
        d3.select(chartRef.current).selectAll("*").remove();

        createBarChart();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // ADD AFTER YOUR EXISTING USE EFFECTS:

  // Update chart data when timeframe or stats change
  // UPDATE THIS useEffect in SystemAdminDashboard.jsx
  // UPDATE your fetchPageViewsTimeline useEffect:
  // ADD this new useEffect for timeline data:
  useEffect(() => {
    const fetchPageViewsTimeline = async () => {
      try {
        const res = await ky
          .get(
            `/api/metrics/admin/page-views-timeline?timeframe=${timeframe}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          )
          .json();

        if (res?.success) {
          setPageViewsData(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch page views timeline:", e);
      }
    };

    if (accessToken) {
      fetchPageViewsTimeline();
    }
  }, [timeframe, accessToken]);

  // Update chart when data changes
  useEffect(() => {
    if (pageViewsData.length > 0) {
      createBarChart();
    }
  }, [pageViewsData]);

  const createBarChart = () => {
    if (!chartRef.current || pageViewsData.length === 0) return;

    // Clear any existing chart
    d3.select(chartRef.current).selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    const containerWidth = chartRef.current.clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", height + margin.top + margin.bottom)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale - use dynamic data
    const x = d3
      .scaleBand()
      .domain(pageViewsData.map((d) => d.period))
      .range([0, width])
      .padding(0.3);

    // Y scale
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(pageViewsData, (d) => d.views) * 1.1])
      .range([height, 0]);

    // Format for Y axis labels
    const formatK = (value) =>
      value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value;

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("text-anchor", "middle");

    // Add Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y).tickFormat(formatK).ticks(8))
      .selectAll("text")
      .style("font-size", "12px")
      .style("text-anchor", "end");

    // Add Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#555")
      .text("Page Views");

    // Color scale
    const color = d3
      .scaleLinear()
      .domain([0, d3.max(pageViewsData, (d) => d.views)])
      .range(["#92caff", "#007bff"]);

    // Tooltip
    // REPLACE the tooltip creation code in createBarChart function:
    const tooltip = d3
      .select(chartRef.current)
      .append("div")
      .attr("class", "chart-tooltip")
      .style("position", "fixed") // Changed from absolute to fixed
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.85)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.3)")
      .style("border", "1px solid rgba(255, 255, 255, 0.1)")
      .style("max-width", "200px")
      .style("white-space", "nowrap");

    // REPLACE the mouseover and mouseout event handlers:
    svg
      .selectAll(".bar")
      .data(pageViewsData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.period))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("rx", 3)
      .attr("fill", (d) => color(d.views))
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "#0056b3")
          .attr("opacity", 1);

        // Use d.tooltipDate if available, otherwise use d.period
        const displayDate = d.tooltipDate || d.period;

        tooltip.style("visibility", "visible").html(
          `<div style="text-align: center;">
           <strong>${displayDate}</strong><br/>
           ${d.views.toLocaleString()} views
         </div>`
        );

        // Update tooltip position to follow mouse
        updateTooltipPosition(event);
      })
      .on("mousemove", function (event) {
        // Update position as mouse moves
        updateTooltipPosition(event);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", color(d.views))
          .attr("opacity", 0.9);

        tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("y", (d) => y(d.views))
      .attr("height", (d) => height - y(d.views));

    // ADD this helper function for tooltip positioning:
    function updateTooltipPosition(event) {
      const tooltipNode = tooltip.node();
      if (!tooltipNode) return;

      const tooltipRect = tooltipNode.getBoundingClientRect();
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;

      let xPos = event.pageX + 10;
      let yPos = event.pageY - 40;

      // Prevent tooltip from going off-screen on the right
      if (xPos + tooltipRect.width > window.innerWidth + scrollX) {
        xPos = event.pageX - tooltipRect.width - 10;
      }

      // Prevent tooltip from going off-screen on the top
      if (yPos < scrollY) {
        yPos = event.pageY + 20;
      }

      tooltip.style("left", xPos + "px").style("top", yPos + "px");
    }

    // Add chart title
    // In your createBarChart function, update the title:
    // Update the chart title in createBarChart function:
    const timeframeTitles = {
      daily: "Daily Page Views (Last 30 Days)",
      weekly: "Weekly Page Views (Last 52 Weeks)",
      monthly: "Monthly Page Views (Last 12 Months)",
    };

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#333")
      .style("dominant-baseline", "middle")
      .text(timeframeTitles[timeframe]);
  };
  const handleEditClick = (user) => {
    setCurrentUserToEdit(user);
    setIsEditFormOpen(true);
  };

  // Closes the form
  const handleCloseForm = () => {
    setIsEditFormOpen(false);
    setCurrentUserToEdit(null);
  };

  const handleUserUpdate = (updatedUserId, updatedUserData) => {
    setUsersList((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUserId ? { ...user, ...updatedUserData } : user
      )
    );
  };

  // Smooth-scroll helper
  const scrollTo = (ref) => {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="admin-container">
      <SystemAdminSidebar />
      <div className="content-section2">
        <div className="page-title">
          <h2>
            <FaTachometerAlt /> Dashboard
          </h2>
          <p>Welcome back to your dashboard!</p>
        </div>

        {/* Summary cards rendered explicitly to avoid mapping errors */}
        <div className="summary-container">
          {/* Page Views */}
          <div
            className="summary-box teal-theme"
            role="button"
            tabIndex={0}
            onClick={() => scrollTo(pageViewSectionRef)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                scrollTo(pageViewSectionRef);
            }}
          >
            <div className="summary-header">
              <div className="summary-icon-wrapper teal-bg">
                <div className="summary-icon">
                  <AiOutlineFundView />
                </div>
              </div>
              <h3>Page Views</h3>
            </div>
            <div className="summary-value-row">
              <p className="value">{viewsPrimaryText}</p>
              <small className="summary-note note-green">
                +{dashboardStats.uniqueVisitorsToday.toLocaleString()} new views
                today
              </small>
            </div>
          </div>

          {/* User Registered */}
          <div
            className="summary-box blue-theme"
            role="button"
            tabIndex={0}
            onClick={() => scrollTo(usersSectionRef)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") scrollTo(usersSectionRef);
            }}
          >
            <div className="summary-header">
              <div className="summary-icon-wrapper blue-bg">
                <div className="summary-icon">
                  <FaUser />
                </div>
              </div>
              <h3>User Registered</h3>
            </div>
            <div className="summary-value-row">
              <p className="value">{userPrimaryText}</p>
              <small className="summary-note note-green">
                +{dashboardStats.newUsersToday.toLocaleString()} new users today
              </small>
            </div>
          </div>

          {/* Backup Status (note stacked below value) */}
          <div
            className={`summary-box backup-card ${
              backupStatus === "Healthy" ? "green-theme" : "purple-theme"
            }`}
            role="button"
            tabIndex={0}
            onClick={() => navigate("/data-management")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                navigate("/data-management");
            }}
          >
            <div className="summary-header">
              <div
                className={`summary-icon-wrapper ${
                  backupStatus === "Healthy" ? "green-bg" : "purple-bg"
                }`}
              >
                <div className="summary-icon">
                  <FaRegSave />
                </div>
              </div>
              <h3>Backup Status</h3>
            </div>
            <div className="summary-value-row">
              <p className="backup-value">{backupPrimaryText}</p>
              <small className="summary-note note-green">
                Last backup: {backupTime}
              </small>
            </div>
          </div>
        </div>

        {/* User Usage Chart Section */}
        <div className="table-section" ref={pageViewSectionRef}>
          <div className="table-header-admin">
            <h3>
              <span className="header-icon-admin">
                <FaChartBar />
              </span>
              Page Views Analytics
            </h3>
            <div className="timeframe-selector">
              <button
                className={`timeframe-btn ${
                  timeframe === "daily" ? "active" : ""
                }`}
                onClick={() => setTimeframe("daily")}
              >
                Daily
              </button>
              <button
                className={`timeframe-btn ${
                  timeframe === "weekly" ? "active" : ""
                }`}
                onClick={() => setTimeframe("weekly")}
              >
                Weekly
              </button>
              <button
                className={`timeframe-btn ${
                  timeframe === "monthly" ? "active" : ""
                }`}
                onClick={() => setTimeframe("monthly")}
              >
                Monthly
              </button>
            </div>
            <button className="view-all-sa">Export Data</button>
          </div>
          <div
            ref={chartRef}
            className="chart-container"
            style={{
              height: "450px",
              width: "100%",
              padding: "20px 0",
              boxSizing: "border-box",
              color: "#333",
            }}
          ></div>
        </div>

        {/* Users List Section - System Admin Table */}
        <div className="dashboard-section-sa" ref={usersSectionRef}>
          <div className="table-section-sa">
            <div className="table-header-sa">
              <h3>
                <span className="header-icon-sa">
                  <FaUser />
                </span>
                New Recent Users
              </h3>
              <Link to="/user-management" className="view-all-sa">
                View All
              </Link>
            </div>
            <div className="users-list-container-sa">
              <table className="users-table-sa data-table-sa">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr
                      key={user.id}
                      className={user.isNew ? "new-user-row-sa" : ""}
                    >
                      <td className="user-cell-sa">
                        <img
                          src={user.image}
                          alt={user.name}
                          className="user-avatar-sa"
                          onError={(e) => {
                            e.currentTarget.onerror = null; // prevent infinite loop
                            e.currentTarget.src = defaultImage;
                          }}
                        />
                        <span>{user.name}</span>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`status-badge-sa ${user.role.toLowerCase()}-sa`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="actions-cell-sa">
                        <button
                          className="action-btn-sa edit-btn-sa"
                          onClick={() => handleEditClick(user)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isEditFormOpen && (
        <EditUserForm
          user={currentUserToEdit}
          onClose={handleCloseForm}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}

export default SystemAdminDashboard;

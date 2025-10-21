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

import { useState } from "react";

// AnimatedNumber helper: configurable duration and easing
const easeFns = {
  linear: (t) => t,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t) => (t === 0 ? 0 : 1 - Math.pow(2, -10 * t)),
};

function AnimatedNumber({
  value = 0,
  duration = 1200,
  easing = "easeOutCubic",
  className = "value countup-value",
  ...rest
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const end = Number(value) || 0;
    const start = 0; // per requirement: always animate from zero
    const d = Math.max(0, Number(duration) || 0);
    const ease =
      typeof easing === "function" ? easing : easeFns[easing] || easeFns.easeOutCubic;

    let rafId = null;
    const startTime = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / d);
      const eased = ease(t);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, duration, easing]);

  return (
    <p className={className} {...rest}>
      {display.toLocaleString()}
    </p>
  );
}

function SystemAdminDashboard() {
  const chartRef = useRef(null);
  const pageViewSectionRef = useRef(null);
  const usersSectionRef = useRef(null);
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const { accessToken } = useAuth();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
  const [dailyPageViews, setDailyPageViews] = useState([]);
  const [viewPeriod, setViewPeriod] = useState("daily");
  const [chartData, setChartData] = useState([]);
  const [chartTitle, setChartTitle] = useState("Daily Page Views");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (chartRef.current) {
        d3.select(chartRef.current).selectAll("*").remove();
        createBarChart();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [chartData, viewPeriod]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        let url = "";
        let title = "";
        const now = new Date();
        const currentYear = now.getFullYear();
        switch (viewPeriod) {
          case "daily":
            url = "/api/admin/metrics/pageviews-dow?weekOffset=0";
            title = "Daily Page Views (Current Week)";
            break;
          case "weekly":
            url = "/api/admin/metrics/pageviews-weekly-month";
            title = "Weekly Page Views (Current Month)";
            break;
          case "monthly":
            url = "/api/admin/metrics/pageviews-monthly?months=24";
            title = `Monthly Page Views (Jan–Dec ${currentYear})`;
            break;
          case "yearly":
            url = "/api/admin/metrics/pageviews-yearly?years=10";
            title = "Yearly Page Views (2021–2025)";
            break;
          default:
            url = "/api/admin/metrics/pageviews-dow?weekOffset=0";
            title = "Daily Page Views (Current Week)";
        }
        const res = await ky.get(url, { headers }).json();
        if (res?.success && Array.isArray(res.data)) {
          setChartData(res.data);
          setChartTitle(title);
        } else {
          setChartData([]);
          setChartTitle(title);
        }
      } catch (e) {
        console.error("Failed to fetch page views:", e);
      }
    };
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [accessToken, viewPeriod]);

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

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await ky
          .get("/api/admin/metrics/stats", {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .json();
        if (res?.success) {
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

  // Track extra-small screens (<= 400px) to switch from chart to table
  const [isXsScreen, setIsXsScreen] = useState(false);
  useEffect(() => {
    const update = () => setIsXsScreen(window.innerWidth <= 400);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const createBarChart = () => {
    const svgRoot = d3.select(chartRef.current);
    svgRoot.selectAll("*").remove();

    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = chartRef.current.clientHeight || 450; // use actual vertical space

    // Chart height now fills available container height with a sensible minimum
    let chartHeight = Math.max(260, containerHeight);

    // Responsive font sizes
    const tickFontSize =
      containerWidth <= 400 ? 10 :
      containerWidth <= 480 ? 11 :
      containerWidth <= 768 ? 12 : 13;
    const axisLabelSize =
      containerWidth <= 400 ? 11 :
      containerWidth <= 480 ? 12 :
      containerWidth <= 768 ? 13 : 14;
    const titleFontSize =
      containerWidth <= 400 ? 14 :
      containerWidth <= 480 ? 15 :
      containerWidth <= 768 ? 16 : 16;

    const now = new Date();
    const currentYear = now.getFullYear();
    const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let data = [];
    if (viewPeriod === "weekly") {
      data = [1,2,3,4].map((w) => {
        const found = chartData.find((d) => d.week === w);
        return { label: `Week ${w}`, total: found ? found.total : 0 };
      });
    } else if (viewPeriod === "monthly") {
      data = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const found = chartData.find((d) => d.month === m && d.year === currentYear);
        return { label: MONTH_NAMES[i], total: found ? found.total : 0 };
      });
    } else if (viewPeriod === "yearly") {
      const years = [2025,2026,2027,2028,2029];
      data = years.map((y) => {
        const found = chartData.find((d) => d.year === y);
        return { label: String(y), total: found ? found.total : 0 };
      });
    } else {
      data = chartData.length ? chartData : [];
    }

    // Orientation: horizontal for < 480px, vertical otherwise
    const isHorizontal = containerWidth < 480;

    // Dynamic margins to preserve proportions and free up plot height
    const longestLabelLen = data.reduce((m, d) => Math.max(m, (d.label || "").length), 0);
    const estimatedLabelWidth = longestLabelLen * (tickFontSize * 0.6);
    const margin = {
      top: isHorizontal ? 36 : 40,
      right: 30,
      bottom: isHorizontal ? 72 : 64,
      left: isHorizontal ? Math.max(84, estimatedLabelWidth + 24) : 80,
    };

    // NEW: Expand chart height to fit all y-axis labels (months/days) on small screens
    const labels = data.map((d) => d.label);
    if (isHorizontal) {
      const perRow = Math.max(26, tickFontSize + 14); // line height per category
      const requiredPlotHeight = labels.length * perRow;
      const computedHeight = requiredPlotHeight + margin.top + margin.bottom;
      chartHeight = Math.max(chartHeight, computedHeight);
      // Ensure container grows to avoid clipping
      chartRef.current.style.height = `${chartHeight}px`;
    }

    const width = containerWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    const svg = svgRoot
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", chartHeight)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const yMax = Math.max(1, d3.max(data, (d) => d.total) || 0) * 1.1;

    // Scales
    const xLinear = d3.scaleLinear().domain([0, yMax]).range([0, width]);
    const xBand = d3.scaleBand().domain(data.map((d) => d.label)).range([0, width]).padding(0.3);
    const yLinear = d3.scaleLinear().domain([0, yMax]).range([height, 0]);
    const yBand = d3.scaleBand().domain(labels).range([0, height]).padding(0.3);

    const xAxisLabel =
      viewPeriod === "weekly" ? "Week" :
      viewPeriod === "monthly" ? "Month" :
      viewPeriod === "yearly" ? "Year" : "Day of Week";

    const baseColor = "#007bff";
    const hoverColor = "#0056b3";

    // Axes and labels
    if (isHorizontal) {
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xLinear).ticks(8).tickPadding(6))
        .selectAll("text")
        .style("font-size", `${tickFontSize}px`)
        .style("text-anchor", "middle");

      // UPDATED: Show full y-axis labels (no sampling)
      svg
        .append("g")
        .call(d3.axisLeft(yBand).tickPadding(6))
        .selectAll("text")
        .style("font-size", `${tickFontSize}px`)
        .style("text-anchor", "end");

      // Bottom axis label
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 56)
        .attr("text-anchor", "middle")
        .style("font-size", `${axisLabelSize}px`)
        .style("fill", "#555")
        .text("Total Page Views");

      // Left axis label
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 28)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", `${axisLabelSize}px`)
        .style("fill", "#555")
        .text(xAxisLabel);
    } else {
      // Vertical layout axes
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xBand).tickPadding(6))
        .selectAll("text")
        .style("font-size", `${tickFontSize}px`)
        .style("text-anchor", "middle");

      svg
        .append("g")
        .call(d3.axisLeft(yLinear).ticks(10).tickPadding(6))
        .selectAll("text")
        .style("font-size", `${tickFontSize}px`)
        .style("text-anchor", "end");

      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 28)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", `${axisLabelSize}px`)
        .style("fill", "#555")
        .text("Total Page Views");

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 44)
        .attr("text-anchor", "middle")
        .style("font-size", `${axisLabelSize}px`)
        .style("fill", "#555")
        .text(xAxisLabel);
    }

    const tooltip = svgRoot
      .append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.85)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("z-index", "100");

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    // Bars
    if (isHorizontal) {
      const bars = svg
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", (d) => yBand(d.label))
        .attr("width", 0)
        .attr("height", yBand.bandwidth())
        .attr("rx", 3)
        .attr("fill", baseColor)
        .style("pointer-events", "none");

      bars
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("width", (d) => xLinear(d.total))
        .on("end", function () {
          d3.select(this).style("pointer-events", "all");
        });

      bars
        .on("mouseover", function () {
          d3.select(this).attr("fill", hoverColor).attr("opacity", 1);
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
          tooltip.html(`<strong>${d.label}:</strong> ${d.total.toLocaleString()} views`);
          const containerRect = chartRef.current.getBoundingClientRect();
          const tooltipNode = tooltip.node();
          const tooltipRect = tooltipNode.getBoundingClientRect();
          let left = event.clientX - containerRect.left - tooltipRect.width / 2;
          let top = event.clientY - containerRect.top - tooltipRect.height - 12;
          left = clamp(left, 8, containerRect.width - tooltipRect.width - 8);
          top = clamp(top, 8, containerRect.height - tooltipRect.height - 8);
          tooltip.style("left", `${left}px`).style("top", `${top}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill", baseColor).attr("opacity", 0.9);
          tooltip.style("visibility", "hidden");
        });
    } else {
      const bars = svg
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xBand(d.label))
        .attr("width", xBand.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("rx", 3)
        .attr("fill", baseColor)
        .style("pointer-events", "none");

      bars
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("y", (d) => yLinear(d.total))
        .attr("height", (d) => height - yLinear(d.total))
        .on("end", function () {
          d3.select(this).style("pointer-events", "all");
        });

      bars
        .on("mouseover", function () {
          d3.select(this).attr("fill", hoverColor).attr("opacity", 1);
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
          tooltip.html(`<strong>${d.label}:</strong> ${d.total.toLocaleString()} views`);
          const containerRect = chartRef.current.getBoundingClientRect();
          const tooltipNode = tooltip.node();
          const tooltipRect = tooltipNode.getBoundingClientRect();
          let left = event.clientX - containerRect.left - tooltipRect.width / 2;
          let top = event.clientY - containerRect.top - tooltipRect.height - 12;
          left = clamp(left, 8, containerRect.width - tooltipRect.width - 8);
          top = clamp(top, 8, containerRect.height - tooltipRect.height - 8);
          tooltip.style("left", `${left}px`).style("top", `${top}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill", baseColor).attr("opacity", 0.9);
          tooltip.style("visibility", "hidden");
        });
    }

    // Centered title (always centered; explicitly emphasized for < 480px)
    svg
      .append("text")
      .attr("x", width / 2) // centered inside the chart area
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", `${titleFontSize}px`)
      .style("font-weight", "600")
      .style("fill", "#333")
      .style("dominant-baseline", "middle")
      .text(chartTitle);

    // Light gridline styling
    svg.selectAll(".tick line").style("stroke", "#ccc").style("stroke-dasharray", "2,2");
  };

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        createBarChart();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dailyPageViews]);

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
              {/* Animated count-up from 0 to totalUniqueVisitors */}
              <AnimatedNumber
                value={dashboardStats.totalUniqueVisitors || 0}
                duration={1500}
                easing="easeOutQuart"
                className="value countup-value"
                aria-label="Total unique visitors"
              />
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
              {/* Animated count-up from 0 to totalUsers */}
              <AnimatedNumber
                value={dashboardStats.totalUsers || 0}
                duration={3000}
                easing="easeOutQuart"
                className="value countup-value"
                aria-label="Total users"
              />
              <small className="summary-note note-green">
                +{dashboardStats.newUsersToday.toLocaleString()} new users today
              </small>
            </div>
          </div>

          {/* Backup Status (text, not animated) */}
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
            {/* Replace Export Data button with period filter */}
            <select
              className="view-all-sa"
              value={viewPeriod}
              onChange={(e) => setViewPeriod(e.target.value)}
              aria-label="Select period"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
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

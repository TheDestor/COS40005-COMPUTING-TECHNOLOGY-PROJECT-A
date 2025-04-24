import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import Sidebar from '../components/Sidebar';
import { FaSearch, FaBell, FaEnvelope, FaMapMarkerAlt, FaChartLine, FaEnvelopeOpen, FaFileAlt } from 'react-icons/fa';
import '../styles/ViewAnalytics.css';

export default function ViewAnalyticsOverview() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        {/* Dashboard Header Section */}
        <div className="dashboard-header">
          <div className="Title">
            <h3>Analytics</h3>
          </div>
          <div className="dashboard-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="action-icons">
              <div className="icon-wrapper">
                <FaBell className="action-icon" />
                <span className="badge">5</span>
              </div>
              <div className="icon-wrapper">
                <FaEnvelope className="action-icon" />
                <span className="badge">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your existing charts container */}
        <div className="viewanalytics-container">
          <UserEngagementChart />
          <BusinessParticipationChart />
          <OrganicTrafficChart />
          <SessionDeviceChart />
          <BrowserUsageChart />
          <UsersOverviewChart />
        </div>
      </div>
    </div>
  );
}
  
  function OrganicTrafficChart() {
    const mapRef = useRef();
    const barRef = useRef();
  
    useEffect(() => {
      const width = 800;
      const height = 400;
  
      const countries = [
        { name: "China", value: 92, type: "registered" },
        { name: "Italy", value: 88, type: "new" },
        { name: "Spain", value: 75, type: "visitor" },
        { name: "UK", value: 63, type: "registered" },
        { name: "India", value: 57, type: "new" },
        { name: "Canada", value: 50, type: "visitor" },
        { name: "USA", value: 44, type: "registered" },
        { name: "Germany", value: 38, type: "new" },
        { name: "France", value: 27, type: "visitor" }
      ];
  
      const typeColor = {
        registered: "#4F46E5", // Purple
        new: "#10B981",        // Green
        visitor: "#EF4444"     // Red
      };
  
      // --- Map ---
      const projection = d3.geoMercator().scale(120).translate([width / 2, height / 1.5]);
      const path = d3.geoPath().projection(projection);
  
      const svgMap = d3.select(mapRef.current);
      svgMap.selectAll("*").remove();
  
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(worldData => {
        const countriesGeo = topojson.feature(worldData, worldData.objects.countries);
  
        svgMap.append("g")
          .selectAll("path")
          .data(countriesGeo.features)
          .join("path")
          .attr("fill", d => {
            const countryName = d.properties.name;
            const match = countries.find(c => c.name === countryName);
            return match ? typeColor[match.type] : "#E5E7EB"; // Light gray fallback
          })
          .attr("d", path)
          .attr("stroke", "#fff");
      });
  
      // --- Bar Chart ---
      const svgBar = d3.select(barRef.current);
      svgBar.selectAll("*").remove();
  
      const barWidth = 600;
      const barHeight = 400;
      const margin = { top: 40, right: 30, bottom: 30, left: 100 };

  
      const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, barWidth - margin.left - margin.right]);
  
      const y = d3.scaleBand()
        .domain(countries.map(d => d.name))
        .range([0, barHeight - margin.top - margin.bottom])
        .padding(0.4);
  
      const g = svgBar.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
        g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .attr("class", "axis-text1");
    
      
      g.selectAll("rect")
        .data(countries)
        .join("rect")
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", "#c4f5e7") // Uniform color for bar chart
        .attr("rx", 10);
  
      g.selectAll("text.value")
        .data(countries)
        .join("text")
        .attr("class", "value")
        .attr("x", d => x(d.value)+ 10)
        .attr("y", d => y(d.name) + y.bandwidth() / 2 + 5)
        .text(d => `${d.value}%`)
    }, []);

    const [timeRange, setTimeRange] = useState("week");
    return (
        
        <div className="traffic-card">
        <div className="traffic-header">
          <h2>Organic Traffic</h2>
          <div className="time-selector">
            <select
              className="time-dropdown"
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>
      
      
        {/* MAP */}
        <div className="traffic-chart-wrapper">
          <svg ref={mapRef} className="traffic-mapchart" viewBox="0 0 800 400" />
        </div>
      
        {/* BAR CHART */}
        <div className="traffic-chart-wrapper bar-margin"  style={{ position: 'relative' }}>
          <svg ref={barRef} className="traffic-barchart" viewBox="0 0 650 400" />
          <img
            src="https://media0.giphy.com/media/gkDfaAbpXc571zByYZ/giphy.gif"
            alt="plane"
            className="floating-plane"
          />
        </div>
      
        <div className="traffic-legend">
          <div className="legend-item">
            <span className="legend-color legend-color--registered"></span>
            Registered Users
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--new-users"></span>
            New Users
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--visitors"></span>
            Visitors
          </div>
        </div>
      </div>
      
    );
  }
// User Engagement Chart Component
function UserEngagementChart() {
  const ref = useRef();
  const [menuOpen, setMenuOpen] = useState(false);

  const data = [
    { month: "Jan", value: 100 },
    { month: "Feb", value: 120 },
    { month: "Mar", value: 60, type: "Active" },
    { month: "Apr", value: 90 },
    { month: "May", value: 100 },
    { month: "Jun", value: 150, type: "Inactive" },
    { month: "Jul", value: 80 },
    { month: "Aug", value: 90 },
    { month: "Sep", value: 40 },
    { month: "Oct", value: 80, type: "New" },
    { month: "Nov", value: 70 },
    { month: "Dec", value: 75 },
  ];

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 250;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) + 20])
      .range([height - margin.bottom, margin.top]);

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("font-family", "sans-serif");

    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.month))
      .attr("y", d => y(d.value))
      .attr("height", d => y(0) - y(d.value))
      .attr("width", x.bandwidth())
      .attr("rx", 6)
      .attr("fill", d => {
        if (d.type === "Active") return "#48BB78";
        if (d.type === "Inactive") return "#9F7AEA";
        if (d.type === "New") return "#ED64A6";
        return "#E2E8F0";
      });

    svg.append("g")
      .selectAll("text")
      .data(data.filter(d => d.type))
      .join("text")
      .text(d => d.value)
      .attr("x", d => x(d.month) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", "12px");

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
      .style("font-size", "12px");
  }, []);

  return (
    <div className="ue-card">
      <div className="ue-header">
        <div>
          <h1 className="ue-title">User Engagement</h1>
          <p className="ue-total">1500</p>
        </div>
        <div className="ue-menu-container">
          <button
            className="ue-menu-btn"
            onClick={() => setMenuOpen(open => !open)}
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="ue-menu-dropdown">
              <div className="ue-menu-item">👁 View</div>
              <div className="ue-menu-item">📤 Export</div>
              <div className="ue-menu-item ue-menu-item--danger">🗑 Remove</div>
            </div>
          )}
        </div>
      </div>

      <svg ref={ref} className="ue-chart"></svg>

      <div className="ue-legend">
        <div><span className="legend-dot legend-dot--inactive" /> Inactive Users</div>
        <div><span className="legend-dot legend-dot--active" /> Active Users</div>
        <div><span className="legend-dot legend-dot--new" /> New Signups</div>
      </div>
    </div>
  );
}

// Business Participation Chart Component
function BusinessParticipationChart() {
  const ref = useRef();

  useEffect(() => {
    const width = 250;
    const height = 250;
    const thickness = 40;

    const data = [
      { label: 'Active', value: 82.3, color: '#8DD96C' },
      { label: 'Inactive', value: 17.7, color: '#A78BFA' }
    ];

    const radius = Math.min(width, height) / 2;
    const svg = d3.select(ref.current)
      .attr('width', width)
      .attr('height', height);

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const arc = d3.arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius);

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    chartGroup.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#fff')
      .style('stroke-width', '2px');
  }, []);

  return (
    <div className="business-chart-wrapper">
  <div className="bp-header">
    <div>
      <h1 className="bp-title">Business Participation</h1>
      <p className="bp-total">Percentage of Active vs. inactive Businessess</p>
    </div>
  </div>

  <div className="chart-and-stats">
    <div className="chart-container">
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

  );
}

/*Session Device Chart*/
function SessionDeviceChart() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const data = [
    { label: 'Mobile', value: 47, color: '#A855F7' },
    { label: 'PC', value: 35, color: '#22C55E' },
    { label: 'Others', value: 18, color: '#6B7280' }
  ];

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const degrees = data.map(d => (d.value / total) * 180);

  let startAngle = -90;

  const arcs = data.map((d, i) => {
    const endAngle = startAngle + degrees[i];
    const path = describeArc(175, 100, 80, startAngle, endAngle);
    const transform = hoveredIndex === i ? 'scale(1.05)' : 'scale(1)';
    const transition = 'transform 0.2s ease';
    const isHovered = hoveredIndex === i;

    const el = (
      <g
        key={i}
        onMouseEnter={() => setHoveredIndex(i)}
        onMouseLeave={() => setHoveredIndex(null)}
        onMouseMove={e => {
          setMousePos({ x: e.clientX, y: e.clientY });
        }}
        style={{
          transformOrigin: '175px 100px',
          transform,
          transition,
        }}
      >
        <path
          d={path}
          fill="none"
          stroke={d.color}
          strokeWidth="25"
          strokeLinecap="round"
        />
      </g>
    );

    startAngle = endAngle;
    return el;
  });

  return (
    <div className="device-chart-card" style={{ position: 'relative' }}>
      <h2 className="device-title">Session device</h2>
      <svg viewBox="0 0 350 200" className="device-chart">
        {arcs}
      </svg>

      {hoveredIndex !== null && (
        <div
          className="tooltip"
          style={{
            position: 'fixed',
            top: mousePos.y + 15,
            left: mousePos.x + 15,
            background: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            fontSize: '14px',
            zIndex: 999
          }}
        >
          <strong>{data[hoveredIndex].label}</strong>: {data[hoveredIndex].value}%
        </div>
      )}

      <div className="device-stats">
        <div className="device-number">5k</div>
        <div className="device-label">Active users</div>
        <div className="device-legend">
          {data.map((d, i) => (
            <div key={i} className="legend-item">
              <span className="dot" style={{ background: d.color }}></span>
              {d.label} <strong>{d.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Arc generation utilities
function polarToCartesian(cx, cy, r, angle) {
  const rad = (Math.PI / 180) * angle;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

/*Browser Usage Chart*/
  function BrowserUsageChart() {
    const [selectedRange, setSelectedRange] = useState("Today");
    const [tooltip, setTooltip] = useState({
      visible: false,
      x: 0,
      y: 0,
      name: "",
      value: 0,
    });

    const browserData = {
      Today: [
        { name: "Chrome", icon: "🌐", percent: 90 },
        { name: "Firefox", icon: "🦊", percent: 65 },
        { name: "Edge", icon: "🧿", percent: 55 },
        { name: "Brave", icon: "🦁", percent: 25 },
      ],
      Weekly: [
        { name: "Chrome", icon: "🌐", percent: 80 },
        { name: "Firefox", icon: "🦊", percent: 60 },
        { name: "Edge", icon: "🧿", percent: 40 },
        { name: "Brave", icon: "🦁", percent: 30 },
      ],
      Monthly: [
        { name: "Chrome", icon: "🌐", percent: 70 },
        { name: "Firefox", icon: "🦊", percent: 55 },
        { name: "Edge", icon: "🧿", percent: 45 },
        { name: "Brave", icon: "🦁", percent: 20 },
      ],
    };

    const currentData = browserData[selectedRange];

    return (
      <div className="browser-card">
        <div className="browser-header">
          <h3>Browser used</h3>
          <div className="dropdown-container">
            <select
              className="dropdown"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="browser-bars">
          {currentData.map((browser, index) => (
            <div key={index} className="browser-row">
              <span className="browser-icon">{browser.icon}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${browser.percent}%` }}
                  onMouseEnter={(e) =>
                    setTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      name: browser.name,           // Add name
                      value: browser.percent, 
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
            <span key={p} className="percent-label">{p}%</span>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip.visible && (
          <svg
            className="BU_tooltip"
            style={{
              position: "fixed",
              left: tooltip.x + 10, // slight offset so it's not directly under the cursor
              top: tooltip.y - 30,
              pointerEvents: "none",
            }}
            width="40"
            height="24"
          >
            <rect
              className="BU_tooltip-bg"
              x="0"
              y="0"
              rx="4"
              ry="4"
              width="110"
              height="28"
            />
            <text
              className="BU_tooltip-text"
              x="55"
              y="20"
              textAnchor="middle"
            >
              {tooltip.name}: {tooltip.value}%
            </text>
          </svg>
        )}
      </div>
    );
  }
/* Users Overview Chart */
  function UsersOverviewChart() {
    const ref = useRef();
    const [period, setPeriod] = useState("Weekly");
  
    const dataSets = {
      Weekly: [
        { day: "Sun", value: 550 },
        { day: "Mon", value: 350 },
        { day: "Tue", value: 950 },
        { day: "Wed", value: 450 },
        { day: "Thu", value: 700 },
        { day: "Fri", value: 950 },
        { day: "Sat", value: 850 },
      ],
      Monthly: [
        { day: "Jan", value: 1200 },
        { day: "Feb", value: 1100 },
        { day: "Mar", value: 1300 },
        { day: "Apr", value: 1400 },
        { day: "May", value: 1250 },
        { day: "Jun", value: 1600 },
        { day: "Jul", value: 1500 },
        { day: "Aug", value: 1700 },
        { day: "Sep", value: 1450 },
        { day: "Oct", value: 1800 },
        { day: "Nov", value: 1550 },
        { day: "Dec", value: 1650 },
      ],
    };
  
    useEffect(() => {
      const data = dataSets[period];
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();
  
      const width = 600;
      const height = 300;
      const margin = { top: 30, right: 30, bottom: 40, left: 60 };
  
      svg.attr("viewBox", `0 0 ${width} ${height}`);
  
      // Main x-scale for bars
      const x = d3.scaleBand()
        .domain(data.map(d => d.day))
        .range([margin.left, width - margin.right])
        .padding(0.4);
  
      // Extended x-scale for area chart
      const xArea = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([x(data[0].day), x(data[data.length - 1].day) + x.bandwidth()]);
  
      // Y-scale with 15% buffer
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value * 1.15)])
        .nice()
        .range([height - margin.bottom, margin.top]);
  
      // Y-axis configuration
      const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d => `${d}`);
  
      svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
          .attr("x1", 5)
          .attr("x2", -width + margin.left + margin.right)
          .attr("stroke-opacity", 0.1))
        .call(g => g.selectAll(".tick text")
          .attr("x", -15)
          .attr("dy", 2)
          .style("font-size", "12px")
          .style("fill", "#6b7280"));
  
      // Gradient definition
      const defs = svg.append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", "areaGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
  
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#c084fc")
        .attr("stop-opacity", 0.6);
  
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#c084fc")
        .attr("stop-opacity", 0.1);
  
      // Enhanced area chart
      const area = d3.area()
        .x((d, i) => xArea(i))
        .y0(y(0))
        .y1(d => y(d.value) * 0.7)
        .curve(d3.curveNatural);
  
      svg.append("path")
        .datum(data)
        .attr("fill", "url(#areaGradient)")
        .attr("d", area)
        .attr("opacity", 0.7)
        .attr("stroke", "#9333ea")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.3);
  
      // Bars
        const bars = svg.selectAll(".bar")
          .data(data)
          .enter()
          .append("rect")
          .attr("class", "UO_bar")
          .attr("x", d => x(d.day))
          .attr("y", d => y(d.value))
          .attr("width", x.bandwidth())
          .attr("height", d => y(0) - y(d.value))
          .attr("fill", "#9333ea")
          .attr("rx", 6);
  
      // Tooltip
      const tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("pointer-events", "none")
        .style("opacity", 0);
  
      const tooltipBg = tooltip.append("rect")
        .attr("class", "tooltip-bg")
        .attr("rx", 4);
  
      const tooltipText = tooltip.append("text")
        .attr("class", "tooltip-text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em");
  
      // Interactions
      bars
        .on("mouseover", function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", "#b57af0");
          tooltip.style("opacity", 1);
        })
        .on("mousemove", function(event, d) {
          const [xPos, yPos] = d3.pointer(event);
          tooltip.attr("transform", `translate(${xPos + 15},${yPos - 25})`);
          tooltipText.text(`${d.value} users`);
          const bbox = tooltipText.node().getBBox();
          tooltipBg
            .attr("x", bbox.x - 8)
            .attr("y", bbox.y - 4)
            .attr("width", bbox.width + 16)
            .attr("height", bbox.height + 8);
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", "#9333ea");
          tooltip.style("opacity", 0);
        });
  
      // Day labels
      svg.selectAll(".day-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "day-label")
        .attr("x", d => x(d.day) + x.bandwidth() / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text(d => d.day);
  
    }, [period]);
  
    return (
      <div className="UO_chart-container">
        <div className="UO_chart-header">
          <h3 className="UO_chart-title">Users Overview</h3>
          <select
            className="custom-select"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        <div className="chart-wrapper">
          <svg 
            ref={ref} 
            className="UO_chart-svg" 
            viewBox="0 0 600 300"
            preserveAspectRatio="xMidYMin meet"
          />
        </div>
      </div>
    );
  }
  
    
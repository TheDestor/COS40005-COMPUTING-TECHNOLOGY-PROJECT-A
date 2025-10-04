import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import Sidebar from '../components/Sidebar';
import { FaMapMarkerAlt, FaChartLine, FaFileAlt } from 'react-icons/fa';
import html2canvas from 'html2canvas'; // install this package if not already
import '../styles/ViewAnalytics.css';
import { FaRegEye, FaFileExport, FaTrash } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";

// Add this new component at the top level of your file (but not inside another component)
function RestoreChartsModal({ visibleCharts, onRestore, onClose }) {
  const hiddenCharts = Object.entries(visibleCharts)
    .filter(([_, visible]) => !visible)
    .map(([name]) => name);

  const [selectedCharts, setSelectedCharts] = useState([]);

  const toggleChartSelection = (chartName) => {
    setSelectedCharts(prev => 
      prev.includes(chartName) 
        ? prev.filter(name => name !== chartName)
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
      <div className="restore-modal-content" onClick={e => e.stopPropagation()}>
        <h3>Restore Charts</h3>
        <p>Select charts to restore:</p>
        
        <div className="chart-selection-list">
          {hiddenCharts.map(chartName => (
            <div 
              key={chartName} 
              className={`chart-selection-item ${selectedCharts.includes(chartName) ? 'selected' : ''}`}
              onClick={() => toggleChartSelection(chartName)}
            >
              {getChartDisplayName(chartName)}
            </div>
          ))}
        </div>

        <div className="restore-modal-actions">
          <button className="restore-cancel-btn" onClick={onClose}>Cancel</button>
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
    userEngagement: "User Engagement",
    businessParticipation: "Business Participation",
    organicTraffic: "Organic Traffic",
    sessionDevice: "Session Device",
    browserUsage: "Browser Usage",
    usersOverview: "Users Overview"
  };
  return names[chartKey] || chartKey;
}

export default function ViewAnalyticsOverview() {
  const [visibleCharts, setVisibleCharts] = useState({
    userEngagement: true,
    businessParticipation: true,
    organicTraffic: true,
    sessionDevice: true,
    browserUsage: true,
    usersOverview: true
  });
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Function to restore specific charts
  const restoreCharts = (chartsToRestore) => {
    setVisibleCharts(prev => {
      const newState = {...prev};
      chartsToRestore.forEach(chart => {
        newState[chart] = true;
      });
      return newState;
    });
  };

  // Function to handle chart removal
  const handleRemoveChart = (chartName) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: false
    }));
  };

  // Check if any charts are hidden
  const anyChartHidden = Object.values(visibleCharts).some(visible => !visible);

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
          {visibleCharts.userEngagement && (
            <UserEngagementChart onRemove={() => handleRemoveChart('userEngagement')} />
          )}
          {visibleCharts.businessParticipation && (
            <BusinessParticipationChart onRemove={() => handleRemoveChart('businessParticipation')} />
          )}
          {visibleCharts.organicTraffic && (
            <OrganicTrafficChart onRemove={() => handleRemoveChart('organicTraffic')} />
          )}
          {visibleCharts.sessionDevice && (
            <SessionDeviceChart onRemove={() => handleRemoveChart('sessionDevice')} />
          )}
          {visibleCharts.browserUsage && (
            <BrowserUsageChart onRemove={() => handleRemoveChart('browserUsage')} />
          )}
          {visibleCharts.usersOverview && (
            <UsersOverviewChart onRemove={() => handleRemoveChart('usersOverview')} />
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
  
    const drawCharts = (mapNode, barNode) => {
      const width = 800;
      const height = 400;
  
      const projection = d3.geoMercator().scale(120).translate([width / 2, height / 1.5]);
      const path = d3.geoPath().projection(projection);
  
      const svgMap = d3.select(mapNode);
      svgMap.selectAll("*").remove();
  
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((worldData) => {
        const countriesGeo = topojson.feature(worldData, worldData.objects.countries);
        svgMap.append("g")
          .selectAll("path")
          .data(countriesGeo.features)
          .join("path")
          .attr("fill", (d) => {
            const countryName = d.properties.name;
            const match = countries.find((c) => c.name === countryName);
            return match ? typeColor[match.type] : "#E5E7EB";
          })
          .attr("d", path)
          .attr("stroke", "#fff");
      });
  
      const svgBar = d3.select(barNode);
      svgBar.selectAll("*").remove();
  
      const barWidth = 600;
      const barHeight = 400;
      const margin = { top: 40, right: 30, bottom: 30, left: 100 };
  
      const x = d3.scaleLinear().domain([0, 100]).range([0, barWidth - margin.left - margin.right]);
      const y = d3.scaleBand()
        .domain(countries.map((d) => d.name))
        .range([0, barHeight - margin.top - margin.bottom])
        .padding(0.4);
  
      const g = svgBar.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .attr("fill", "white")
        .style("font-size", "14px")
        .style("font-family", "sans-serif");

  
      g.selectAll("rect")
        .data(countries)
        .join("rect")
        .attr("y", (d) => y(d.name))
        .attr("width", (d) => x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", "#c4f5e7")
        .attr("rx", 10);
  
      g.selectAll("text.value")
        .data(countries)
        .join("text")
        .attr("class", "value")
        .attr("x", (d) => x(d.value) + 10)
        .attr("y", (d) => y(d.name) + y.bandwidth() / 2 + 5)
        .text((d) => `${d.value}%`);
    };

      // Add this useEffect for handling outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.ue-menu-container')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
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
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = "organic-traffic-chart.png";
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
              <select className="time-dropdown" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>  
              </select>
              <div className="ue-menu-container">
                <button className="ue-menu-btn" onClick={() => setMenuOpen((open) => !open)}><BsThreeDotsVertical /></button>
                {menuOpen && (
                  <div className="ue-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="ue-menu-item" onClick={() => setShowModal(true)}><FaRegEye /> View</div>
                    <div className="ue-menu-item" onClick={handleExport}><FaFileExport /> Export</div>
                    <div className="ue-menu-item ue-menu-item--danger" onClick={onRemove}><FaTrash /> Remove</div>
                  </div>
                )}
              </div>
            </div>
          </div>
  
          <div className="traffic-chart-wrapper">
            <svg ref={mapRef} className="traffic-mapchart" viewBox="0 0 800 600" />
          </div>
  
          <div className="bar-chart-container">
            <img
              src="https://media0.giphy.com/media/gkDfaAbpXc571zByYZ/giphy.gif"
              alt="plane"
              className="floating-plane"
            />
            <div className="traffic-chart-wrapper bar-margin with-title">
              <div className="bar-chart-title">Traffic by Country</div>
              <svg ref={barRef} className="traffic-barchart" viewBox="0 0 600 400" />
            </div>
          </div>
  
          <div className="traffic-legend">
            <div className="legend-item"><span className="legend-color legend-color--registered" /> Registered Users</div>
            <div className="legend-item"><span className="legend-color legend-color--new-users" /> New Users</div>
            <div className="legend-item"><span className="legend-color legend-color--visitors" /> Visitors</div>
          </div>
        </div>
  
        {showModal && (
          <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ue-modal-window" onClick={(e) => e.stopPropagation()}>
              <button className="ue-modal-close" onClick={() => setShowModal(false)}>×</button>
              <div className="ue-header">
                <h1 className="ue-title">Organic Traffic</h1>
              </div>
              <svg ref={modalMapRef} className="traffic-mapchart" viewBox="0 0 800 600" />
              <div className="traffic-chart-wrapper bar-margin with-title">
  <div className="bar-chart-title">Traffic by Country</div>
  <svg ref={modalBarRef} className="traffic-barchart" viewBox="0 0 600 400" />
</div>

              <div className="traffic-legend">
                <div className="legend-item"><span className="legend-color legend-color--registered" /> Registered Users</div>
                <div className="legend-item"><span className="legend-color legend-color--new-users" /> New Users</div>
                <div className="legend-item"><span className="legend-color legend-color--visitors" /> Visitors</div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

/*User Engagement Chart*/
function UserEngagementChart({ onRemove }) {
  const ref = useRef();
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const chartContainerRef = useRef();

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

  const drawChart = (container) => {
    const svg = d3.select(container);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 250;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) + 20])
      .range([height - margin.bottom, margin.top]);

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("font-family", "sans-serif");

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.month))
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value))
      .attr("width", x.bandwidth())
      .attr("rx", 6)
      .attr("fill", (d) => {
        if (d.type === "Active") return "#48BB78";
        if (d.type === "Inactive") return "#9F7AEA";
        if (d.type === "New") return "#ED64A6";
        return "#E2E8F0";
      });

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
      .style("font-size", "12px");

    // Tooltip (optional)
    const tooltip = svg
      .append("g")
      .attr("class", "tooltip")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const tooltipBg = tooltip
      .append("rect")
      .attr("rx", 4)
      .attr("fill", "#333");

    const tooltipText = tooltip
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", "#fff");

    svg
      .selectAll("rect")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("fill", "#b57af0");
        tooltip.style("opacity", 1);
      })
      .on("mousemove", function (event, d) {
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
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", (d) => {
            if (d.type === "Active") return "#48BB78";
            if (d.type === "Inactive") return "#9F7AEA";
            if (d.type === "New") return "#ED64A6";
            return "#E2E8F0";
          });
        tooltip.style("opacity", 0);
      });
  };

    // Add this useEffect for handling outside clicks
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuOpen && !event.target.closest('.ue-menu-container')) {
          setMenuOpen(false);
        }
      };
  
      if (menuOpen) {
        document.addEventListener('click', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [menuOpen]);
  
    // Modify your menu button to stop propagation
    const toggleMenu = (e) => {
      e.stopPropagation();
      setMenuOpen((open) => !open);
    };

  useEffect(() => {
    if (ref.current) {
      drawChart(ref.current);
    }
  }, []);

  const handleExport = () => {
    const chartEl = chartContainerRef.current;
    if (!chartEl) return;

    html2canvas(chartEl, {
      backgroundColor: "#fff",
      scale: 2,
      useCORS: true,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "user-engagement-chart.png";
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
      <div className="ue-card" ref={chartContainerRef}>
        <div className="ue-header">
          <div>
            <h1 className="ue-title">User Engagement</h1>
            <p className="ue-total">Total User: 1500</p>
          </div>
          <div className="ue-menu-container">
            <button
              className="ue-menu-btn"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <BsThreeDotsVertical />
            </button>
            {menuOpen && (
              <div className="ue-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="ue-menu-item" onClick={() => setShowModal(true)}>
                  <FaRegEye /> View
                </div>
                <div className="ue-menu-item" onClick={handleExport}>
                  <FaFileExport /> Export
                </div>
                <div className="ue-menu-item ue-menu-item--danger" onClick={onRemove}><FaTrash /> Remove</div>
              </div>
            )}
          </div>
        </div>

        <svg ref={ref} className="ue-chart"></svg>

        <div className="ue-legend">
          <div>
            <span className="legend-dot legend-dot--inactive" /> Inactive Users
          </div>
          <div>
            <span className="legend-dot legend-dot--active" /> Active Users
          </div>
          <div>
            <span className="legend-dot legend-dot--new" /> New Signups
          </div>
        </div>
      </div>

      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ue-modal-window"
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
                <h1 className="ue-title">User Engagement</h1>
                <p className="ue-total">1500</p>
              </div>
            </div>
            <svg ref={(node) => node && drawChart(node)} className="ue-chart" />
            <div className="ue-legend">
              <div>
                <span className="legend-dot legend-dot--inactive" /> Inactive Users
              </div>
              <div>
                <span className="legend-dot legend-dot--active" /> Active Users
              </div>
              <div>
                <span className="legend-dot legend-dot--new" /> New Signups
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// Business Participation Chart Component
function BusinessParticipationChart({onRemove}) {
  const ref = useRef();
  const chartContainerRef = useRef();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);

    // Add this useEffect for handling outside clicks
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuOpen && !event.target.closest('.ue-menu-container')) {
          setMenuOpen(false);
        }
      };
  
      if (menuOpen) {
        document.addEventListener('click', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('click', handleClickOutside);
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
      { label: 'Active', value: 82.3, color: '#8DD96C' },
      { label: 'Inactive', value: 17.7, color: '#A78BFA' }
    ];

    const radius = Math.min(width, height) / 2;
    const svg = d3.select(svgNode)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll("*").remove(); // Clear previous render

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
            <p className="bp-total">Percentage of Active vs. Inactive Businesses</p>
          </div>
          <div className="ue-menu-container">
            <button
              className="ue-menu-btn"
              onClick={() => setMenuOpen(open => !open)}
            >
              <BsThreeDotsVertical />
            </button>
            {menuOpen && (
              <div className="ue-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="ue-menu-item" onClick={() => setShowModal(true)}>
                <FaRegEye /> View
                </div>
                <div className="ue-menu-item" onClick={handleExport}>
                <FaFileExport /> Export
                </div>
                <div className="ue-menu-item ue-menu-item--danger" onClick={onRemove}><FaTrash /> Remove</div>
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
            <button className="ue-modal-close" onClick={() => setShowModal(false)}>×</button>
            <div className="bp-header">
              <div>
                <h1 className="bp-title">Business Participation</h1>
                <p className="bp-total">Percentage of Active vs. inactive Businesses</p>
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
function SessionDeviceChart({onRemove}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);
  const chartContainerRef = useRef();

    // Add this useEffect for handling outside clicks
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuOpen && !event.target.closest('.ue-menu-container')) {
          setMenuOpen(false);
        }
      };
  
      if (menuOpen) {
        document.addEventListener('click', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [menuOpen]);
  
    // Modify your menu button to stop propagation
    const toggleMenu = (e) => {
      e.stopPropagation();
      setMenuOpen((open) => !open);
    };

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
    const path = describeArc(175, 125, 80, startAngle, endAngle); // center y changed from 100 to 125
    const transform = hoveredIndex === i ? 'scale(1.05)' : 'scale(1)';
    const transition = 'transform 0.2s ease';

    startAngle = endAngle;
    return (
      <g
        key={i}
        onMouseEnter={() => setHoveredIndex(i)}
        onMouseLeave={() => setHoveredIndex(null)}
        onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
        style={{
          transformOrigin: '150px 125px',
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
  });

  const handleExport = () => {
    if (!chartContainerRef.current) return;
    html2canvas(chartContainerRef.current, {
      backgroundColor: "#fff",
      scale: 2,
      useCORS: true,
    }).then(canvas => {
      const link = document.createElement("a");
      link.download = "session-device-chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const handleRemove = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="device-chart-card" style={{ position: 'relative' }} ref={chartContainerRef}>
      {/* Header */}
      <div className="session-device-header">
        <h2 className="device-title">Session Device</h2>
        <div className="ue-menu-container">
          <button className="ue-menu-btn" onClick={() => setMenuOpen(!menuOpen)}><BsThreeDotsVertical /></button>
          {menuOpen && (
            <div className="ue-menu-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="ue-menu-item" onClick={() => setShowModal(true)}><FaRegEye /> View</div>
              <div className="ue-menu-item" onClick={handleExport}><FaFileExport /> Export</div>
              <div className="ue-menu-item ue-menu-item--danger" onClick={onRemove}><FaTrash /> Remove</div>
            </div>
          )}
        </div>
      </div>

      {/* Chart + Stats */}
      <div className="device-chart-body">
        <svg viewBox="0 0 350 250" width="100%" height="250" className="device-chart">
          {arcs}
        </svg>

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

      {/* Tooltip */}
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

      {/* Modal */}
      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ue-modal-window" onClick={(e) => e.stopPropagation()}>
            <button className="ue-modal-close" onClick={() => setShowModal(false)}>×</button>
            <div className="session-device-header">
              <h2 className="device-title">Session Device</h2>
            </div>

            <svg width={350} height={250} viewBox="0 0 350 250" className="device-chart">
              {arcs}
            </svg>

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
          {/* Tooltip */}
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
        </div>
        
      )}
    </div>
  );
}

// Arc drawing helpers
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
function BrowserUsageChart({onRemove}) {
  const [selectedRange, setSelectedRange] = useState("Today");
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    value: 0,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);
  const chartRef = useRef(null);

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

    // Add this useEffect for handling outside clicks
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuOpen && !event.target.closest('.ue-menu-container')) {
          setMenuOpen(false);
        }
      };
  
      if (menuOpen) {
        document.addEventListener('click', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [menuOpen]);
  
    // Modify your menu button to stop propagation
    const toggleMenu = (e) => {
      e.stopPropagation();
      setMenuOpen((open) => !open);
    };

  const handleRemove = () => {
    setVisible(false);
  };

  const handleExport = () => {
    if (!chartRef.current) return;
    html2canvas(chartRef.current, {
      backgroundColor: "#fff",
      scale: 2,
      useCORS: true,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "browser-usage-chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  if (!visible) return null;

  return (
    <>
      {/* Main chart */}
      <div className="browser-card" ref={chartRef}>
        <div
          className="browser-header">
          <h3>Browser Usage</h3>

          <div className="BU-dropdown-container" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="dropdown"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>

            <div className="ue-menu-container" style={{ position: "relative" }}>
              <button className="ue-menu-btn" onClick={() => setMenuOpen((open) => !open)}><BsThreeDotsVertical /></button>
              {menuOpen && (
                <div className="ue-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="ue-menu-item" onClick={() => { setShowModal(true); setMenuOpen(false); }}><FaRegEye /> View</div>
                  <div className="ue-menu-item" onClick={() => { handleExport(); setMenuOpen(false); }}><FaFileExport /> Export</div>
                  <div className="ue-menu-item ue-menu-item--danger" onClick={onRemove}><FaTrash /> Remove</div>
                </div>
              )}
            </div>
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
                      name: browser.name,
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
      </div>

      {/* Tooltip for both chart and modal */}
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
          width="120"
          height="28"
        >
          <rect
            className="BU_tooltip-bg"
            x="0"
            y="0"
            rx="4"
            ry="4"
            width="120"
            height="28"
            fill="#fff"
            stroke="#ccc"
          />
          <text
            className="BU_tooltip-text"
            x="60"
            y="20"
            textAnchor="middle"
            fill="#333"
            fontSize="14"
          >
            {tooltip.name}: {tooltip.value}%
          </text>
        </svg>
      )}

      {/* Modal View UI */}
      {showModal && (
        <div className="ue-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ue-modal-window" onClick={(e) => e.stopPropagation()}>
          <div className="browser-modal-header">
            <h3>Browser usage</h3>

            <select
              className="BU-view-dropdown"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>

            <button className="ue-modal-close" onClick={() => setShowModal(false)}>×</button>
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
                          name: browser.name,
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
          </div>
        </div>
      )}
    </>
  );
}


/* Users Overview Chart */
function UsersOverviewChart({ onRemove }) {
const chartRef = useRef();
const modalRef = useRef();
const [menuOpen, setMenuOpen] = useState(false);
const [showModal, setShowModal] = useState(false);
const [period, setPeriod] = useState("Weekly");
const [isMounted, setIsMounted] = useState(true);

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

  // Add this useEffect for handling outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.ue-menu-container')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  // Modify your menu button to stop propagation
  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

const handleExport = () => {
  const svg = chartRef.current;
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const png = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "users-overview-chart.png";
    link.href = png;
    link.click();
  };

  img.src = url;
};

const handleRemove = () => {
  setIsMounted(false);
  if (onRemove) onRemove();
  setMenuOpen(false);
};

useEffect(() => {
  document.body.style.overflow = showModal ? "hidden" : "";
  return () => {
    document.body.style.overflow = "";
  };
}, [showModal]);

const drawChart = (svgElement) => {
  const data = dataSets[period];
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const width = 600;
  const height = 300;
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.day))
    .range([margin.left, width - margin.right])
    .padding(0.4);

  const xArea = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([x(data[0].day), x(data[data.length - 1].day) + x.bandwidth()]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value * 1.15)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d => `${d}`);

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

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
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

  const tooltip = svg.append("g")
    .attr("class", "tooltip")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const tooltipBg = tooltip.append("rect").attr("class", "tooltip-bg").attr("rx", 4);
  const tooltipText = tooltip.append("text").attr("class", "tooltip-text").attr("text-anchor", "middle").attr("dy", "0.3em");

  bars
    .on("mouseover", function (event, d) {
      d3.select(this).transition().duration(200).attr("fill", "#b57af0");
      tooltip.style("opacity", 1);
    })
    .on("mousemove", function (event, d) {
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
    .on("mouseout", function () {
      d3.select(this).transition().duration(200).attr("fill", "#9333ea");
      tooltip.style("opacity", 0);
    });

  svg.selectAll(".day-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "day-label")
    .attr("x", d => x(d.day) + x.bandwidth() / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .text(d => d.day);
};

useEffect(() => {
  if (chartRef.current) drawChart(chartRef.current);
}, [period]);

useEffect(() => {
  if (showModal && modalRef.current) drawChart(modalRef.current);
}, [showModal, period]);

if (!isMounted) return null;

return (
  <div className="UO_chart-container">
    <div className="UO_chart-header">
      <h3 className="UO_chart-title">Users Overview</h3>
      <div className="UO_dropdown-container" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <select
          className="custom-select"
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
        <div className="ue-menu-container" style={{ position: "relative" }}>
          <button className="ue-menu-btn" onClick={() => setMenuOpen(prev => !prev)}><BsThreeDotsVertical /></button>
          {menuOpen && (
            <div className="ue-menu-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="ue-menu-item" onClick={() => { setShowModal(true); setMenuOpen(false); }}><FaRegEye /> View</div>
              <div className="ue-menu-item" onClick={() => { handleExport(); setMenuOpen(false); }}><FaFileExport /> Export</div>
              <div className="ue-menu-item ue-menu-item--danger" onClick={onRemove}><FaTrash /> Remove</div>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="chart-wrapper">
      <svg
        ref={chartRef}
        className="UO_chart-svg"
        viewBox="0 0 600 300"
        preserveAspectRatio="xMidYMin meet"
      />
    </div>

    {showModal && (
      <div 
        className="ue-modal-overlay" 
        onClick={() => setShowModal(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div 
          className="ue-modal-window" 
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          <div className="UO_chart-header">
            <h3 className="UO_chart-title">Users Overview ({period})</h3>
            <div className="UO-viewUI_dropdown-container" style={{ display: "relative", alignItems: "center", gap: "10px" }}>
              <select
                className="custom-select"
                value={period}
                onChange={e => setPeriod(e.target.value)}
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <button className="ue-modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          <svg
            ref={modalRef}
            className="UO_chart-svg"
            viewBox="0 0 600 300"
            preserveAspectRatio="xMidYMin meet"
          />
        </div>
      </div>
    )}
  </div>
);
}
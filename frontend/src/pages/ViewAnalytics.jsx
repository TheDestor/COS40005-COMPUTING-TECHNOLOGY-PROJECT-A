import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ViewAnalytics.css';

export default function DashboardOverview() {
    return (
      <div className="dashboard-container">
        <UserEngagementChart />
        <BusinessParticipationChart />
        <OrganicTrafficChart />
        <SessionDeviceChart />
        <BrowserUsageChart />
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
          <h2 className="ue-title">User Engagement</h2>
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
    const width = 200;
    const height = 200;
    const thickness = 20;

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
  );
}

/*Session Device Chart*/
function SessionDeviceChart() {
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
        const path = describeArc(140, 110, 80, startAngle, endAngle);
        const el = (
          <path
            key={i}
            d={path}
            fill="none"
            stroke={d.color}
            strokeWidth="25"
            strokeLinecap="round"
          />
        );
        startAngle = endAngle;
        return el;
      });
    
      return (
        <div className="device-chart-card">
          <h2 className="device-title">Session device</h2>
          <svg viewBox="0 0 350 350" className="device-chart">
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
      );
    }
    
    // Function to create arc path for semi-donut
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
      ]
    };
  
    const currentData = browserData[selectedRange];
  
    return (
      <div className="browser-card">
        <div className="browser-header">
          <h3>Browser used</h3>
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
  
        <div className="browser-bars">
          {currentData.map((browser, index) => (
            <div key={index} className="browser-row">
              <span className="browser-icon">{browser.icon}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${browser.percent}%` }}
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
    );
  }  
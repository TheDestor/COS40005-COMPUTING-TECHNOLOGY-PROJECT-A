import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/SecurityAdminpage.css';
import { FaShieldAlt } from 'react-icons/fa';
import { AiOutlineReload } from 'react-icons/ai';
import { FaCheckCircle, FaBan } from "react-icons/fa";

const SecurityAdminPage = () => {
  const [policies, setPolicies] = useState({
    twoFA: true,
    autoLock: true,
    passwordComplexity: true,
  });

  const chartRef = useRef();

  const togglePolicy = (policy) => {
    setPolicies({ ...policies, [policy]: !policies[policy] });
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Sample data
    const data = [
      { date: '2023-01-01', threats: 5, firewallBlocks: 12 },
      { date: '2023-01-02', threats: 8, firewallBlocks: 15 },
      { date: '2023-01-03', threats: 12, firewallBlocks: 20 },
      { date: '2023-01-04', threats: 6, firewallBlocks: 18 },
      { date: '2023-01-05', threats: 9, firewallBlocks: 22 },
      { date: '2023-01-06', threats: 15, firewallBlocks: 25 },
      { date: '2023-01-07', threats: 10, firewallBlocks: 30 },
      { date: '2023-01-08', threats: 7, firewallBlocks: 15 },
      { date: '2023-01-09', threats: 11, firewallBlocks: 20 },
      { date: '2023-01-10', threats: 14, firewallBlocks: 28 },
    ];

    // Set up chart dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    // Create SVG element
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    data.forEach(d => {
      d.date = parseDate(d.date);
    });

    // Set up scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.threats, d.firewallBlocks)) * 1.1])
      .range([height, 0]);

    // Add X axis with grid lines
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b %d')))
      .call(g => g.selectAll(".tick line")
        .clone()
        .attr("y2", -height)
        .attr("stroke-opacity", 0.1)
        .attr("stroke", "#999"));

    // Add Y axis with grid lines
    svg.append('g')
      .call(d3.axisLeft(y))
      .call(g => g.selectAll(".tick line")
        .clone()
        .attr("x2", width)
        .attr("stroke-opacity", 0.1)
        .attr("stroke", "#999"));

    // Create line generators
    const lineThreats = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.threats))
      .curve(d3.curveMonotoneX);

    const lineFirewall = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.firewallBlocks))
      .curve(d3.curveMonotoneX);

    // Add area under the lines
    const areaThreats = d3.area()
      .x(d => x(d.date))
      .y0(y(0))
      .y1(d => y(d.threats))
      .curve(d3.curveMonotoneX);

    const areaFirewall = d3.area()
      .x(d => x(d.date))
      .y0(y(0))
      .y1(d => y(d.firewallBlocks))
      .curve(d3.curveMonotoneX);

    // Add areas
    svg.append('path')
      .datum(data)
      .attr('fill', 'rgba(255, 99, 132, 0.2)')
      .attr('stroke', 'none')
      .attr('d', areaThreats);

    svg.append('path')
      .datum(data)
      .attr('fill', 'rgba(54, 162, 235, 0.2)')
      .attr('stroke', 'none')
      .attr('d', areaFirewall);

    // Add lines
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ff6384')
      .attr('stroke-width', 2)
      .attr('d', lineThreats);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#36a2eb')
      .attr('stroke-width', 2)
      .attr('d', lineFirewall);

    // Add dots for visual reference
    svg.selectAll(".dot-threats")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot-threats")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.threats))
      .attr("r", 4)
      .attr("fill", "#ff6384")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    svg.selectAll(".dot-firewall")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot-firewall")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.firewallBlocks))
      .attr("r", 4)
      .attr("fill", "#36a2eb")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Create a tooltip div
    const tooltip = d3.select(chartRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "black")
      .style("border", "1px solidrgb(14, 13, 13)")
      .style("border-radius", "6px")
      .style("padding", "12px")
      .style("pointer-events", "none")
      .style("font-size", "13px")
      .style("box-shadow", "0 3px 10px rgba(223, 223, 223, 0.1)")
      .style("min-width", "180px")
      .style("transition", "left 0.1s, top 0.1s")
      .style("backdrop-filter", "blur(2px)")
      .style("z-index", "100");

    // Mouse move event for the entire chart area
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", function(event) {
        // Find the nearest data point
        const x0 = x.invert(d3.pointer(event, this)[0]);
        const bisectDate = d3.bisector(d => d.date).left;
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        
        // Update tooltip position and content
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 40) + "px")
          .html(`
            <div class="tooltip-date">
              ${d3.timeFormat("%b %d, %Y")(d.date)}
            </div>
            <div class="tooltip-metric">
              <div class="tooltip-color" style="background: #ff6384"></div>
              <div>Threats: <strong>${d.threats}</strong></div>
            </div>
            <div class="tooltip-metric">
              <div class="tooltip-color" style="background: #36a2eb"></div>
              <div>Firewall Blocks: <strong>${d.firewallBlocks}</strong></div>
            </div>
          `);
      })
      .on("mouseover", function() {
        tooltip.transition().duration(100).style("opacity", 0.9);
      })
      .on("mouseout", function() {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', '#ff6384');

    legend.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .text('Threats Detected')
      .style('font-size', '12px');

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 20)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', '#36a2eb');

    legend.append('text')
      .attr('x', 20)
      .attr('y', 30)
      .text('Firewall Blocks')
      .style('font-size', '12px');

    // Handle window resize
    const handleResize = () => {
      // You might want to add resize logic here if needed
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="content-section2">
      {/* Header */}
      <div className="security-header">
        <h2><FaShieldAlt /> Security</h2>
        <button className="refresh-btn"><AiOutlineReload /> Refresh</button>
      </div>

      {/* Dashboard Cards */}
      <div className="security-dashboard">
        <div className="card2">
          <p>Threats Detected</p>
          <h3>12</h3>
          <span>+3 new today</span>
        </div>
        <div className="card2">
          <p>Failed Logins</p>
          <h3>24</h3>
          <span>▲ 40% decrease</span>
        </div>
        <div className="card2">
          <p>Security Updates</p>
          <h3>5</h3>
          <span>All systems patched</span>
        </div>
        <div className="card2">
          <p>Firewall Blocks</p>
          <h3>87</h3>
          <span>▲ 15% increase</span>
        </div>
      </div>

      {/* Security Policies */}
      <div className="security-policies">
        <label>
          <input
            type="checkbox"
            checked={policies.twoFA}
            onChange={() => togglePolicy('twoFA')}
          />
          Require 2FA
        </label>
        <label>
          <input
            type="checkbox"
            checked={policies.autoLock}
            onChange={() => togglePolicy('autoLock')}
          />
          Auto-lock inactive sessions
        </label>
        <label>
          <input
            type="checkbox"
            checked={policies.passwordComplexity}
            onChange={() => togglePolicy('passwordComplexity')}
          />
          Password complexity
        </label>
      </div>

      {/* Threat Chart */}
      <div className="chart-section">
        <h3>Security Threats Over Time</h3>
        <p>Last 30 days of threat activity</p>
        <div ref={chartRef} className="security-chart"></div>
      </div>

      {/* Alerts */}
      <div className="alerts-section">
        <h3>Recent Security Alerts</h3>

        {[
          {
            message: 'Multiple failed login attempts from suspicious IP (192.168.1.45)',
            severity: 'High',
            time: '2 hours ago'
          },
          {
            message: 'Database firewall triggered unusual query pattern',
            severity: 'Medium',
            time: '3 hours ago'
          },
          {
            message: 'New admin user created without 2FA',
            severity: 'Critical',
            time: '5 hours ago'
          },
          {
            message: 'Multiple failed login attempts from suspicious IP (192.168.1.45)',
            severity: 'High',
            time: '1 day ago'
          },
        ].map((alert, index) => (
          <div key={index} className="alert-card">
            <div>
              <strong>{alert.message}</strong>
              <p>{alert.severity} Severity · {alert.time}</p>
            </div>
            <div className="actions">
              <button className="actions-white"><FaCheckCircle /> Investigate</button>
              <button className="actions-red"><FaBan /> Block</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityAdminPage;
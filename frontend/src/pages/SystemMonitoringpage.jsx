import React, { useEffect, useRef } from 'react';
import '../styles/SystemMonitoringpage.css';
import { FaExclamationTriangle, FaDatabase, FaLock, FaGlobe, FaServer, FaCog } from 'react-icons/fa';
import * as d3 from 'd3';

// D3.js version of the donut chart using hooks and useEffect
const D3PerformanceDonutChart = () => {
  // Performance data
  const performanceValue = 82.3;
  const remainingValue = 17.7;
  
  // Additional metrics that can be displayed
  const detailMetrics = [
    { name: 'CPU Efficiency', value: 88.2, unit: '%' },
    { name: 'Memory Optimization', value: 76.5, unit: '%' },
    { name: 'Disk I/O', value: 92.0, unit: '%' },
    { name: 'Network Throughput', value: 72.7, unit: '%' }
  ];

  const getStatusColor = (value) => {
    if (value >= 80) return '#4ade80'; // Green for good
    if (value >= 60) return '#facc15'; // Yellow for warning
    return '#f87171'; // Red for poor
  };

  const getStatusText = (value) => {
    if (value >= 80) return 'Good';
    if (value >= 60) return 'Average';
    return 'Poor';
  };

  const statusColor = getStatusColor(performanceValue);
  const statusText = getStatusText(performanceValue);

  // Create a reference for the SVG container
  const svgRef = useRef(null);
  
  // D3 chart rendering using useEffect
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Chart dimensions
    const width = 180;
    const height = 180;
    const margin = 10;
    const thickness = 18;
    
    // Radius calculations
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius);
    
    // Create pie generator
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI * 1.5);
    
    // Data for the donut
    const data = [
      { name: 'Performance', value: performanceValue },
      { name: 'Remaining', value: remainingValue }
    ];
    
    // Create donut chart
    const path = svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => i === 0 ? statusColor : '#f0f0f0');
    
    // Add animation
    path.transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });
    
    // Add text in the center
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', statusColor)
      .text(`${performanceValue}%`);
    
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('font-size', '16px')
      .attr('font-weight', 'medium')
      .attr('fill', statusColor)
      .text(statusText);
      
  }, [performanceValue, statusColor, statusText]); // Dependencies for the effect

  return (
    <div className="flex flex-col items-center bg-white rounded-lg shadow-md p-4 h-full">
      <div className="w-full flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Overall Performance</h3>
        <FaCog className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" />
      </div>
      
      {/* New layout with flex row for chart and metrics side by side */}
      <div className="flex flex-row w-full">
        {/* Left side: Chart */}
        <div className="flex items-center justify-center" style={{ flex: '0 0 50%' }}>
          <svg ref={svgRef}></svg>
        </div>
        
        {/* Right side: Metrics */}
        <div className="flex-1 pl-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Breakdown</h4>
          <div className="space-y-2">
            {detailMetrics.map((metric, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{metric.name}</span>
                  <span className="text-sm font-medium" style={{ color: getStatusColor(metric.value) }}>
                    {metric.value}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${metric.value}%`, 
                      backgroundColor: getStatusColor(metric.value) 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// D3 Resource Usage Trends Bar Chart Component
const D3ResourceTrendsChart = () => {
  const svgRef = useRef(null);
  
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  // Generate some random data
  const data = months.map(month => ({
    month,
    value: Math.random() * 50 + 10, // Random value for demo
    highlight: month === 'MAR'
  }));
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Chart dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // X scale
    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.3);
    
    // Y scale
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);
    
    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", "12px");
    
    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text")
      .style("font-size", "12px");
    
    // Add bars
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.month))
      .attr("width", x.bandwidth())
      .attr("y", height) // Start from bottom for animation
      .attr("height", 0) // Start with height 0 for animation
      .attr("fill", d => d.highlight ? "#3b82f6" : "#60a5fa")
      .attr("rx", 4) // Rounded corners
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value));
    
  }, [data]);
  
  return (
    <div className="resource-trends">
      <div className="header">
        <h3>Resource Usage Trends</h3>
        <span className="tag">Last 12 months</span>
      </div>
      <div className="w-full h-64">
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </div>
    </div>
  );
};

const SystemMonitoringPage = () => {
  return (
    <div className="content-section2">
      <h2><FaServer /> System Monitoring</h2>

      <div className="system-cards">
        <div className="card2 cpu">
            <h3>CPU Usage</h3>
            <div className="value">70%</div>
            <div className="change positive">+5% over the last day</div>
        </div>
        <div className="card2 memory">
            <h3>Memory Usage</h3>
            <div className="value">64%</div>
            <div className="change positive">+10% over the last day</div>
        </div>
        <div className="card2 storage">
            <h3>Storage</h3>
            <div className="value">1.2TB / 2TB</div>
            <div className="change positive">51% used</div>
        </div>
        <div className="card2 network">
            <h3>Network</h3>
            <div className="value">124 Mbps</div>
            <div className="change">12ms latency</div>
        </div>
        <div className="card2 performance">
          <D3PerformanceDonutChart />
        </div>
      </div>

      <div className="recent-events">
        <div className="header">
          <h3>Recent System Events</h3>
          <button>View All</button>
        </div>
        <ul className="events-list">
          <li>
            <FaExclamationTriangle className="icon" />
            <div>
              <p>CPU usage exceeded threshold (85%) on production-server-01</p>
              <span>2 minutes ago · Server Monitoring</span>
            </div>
          </li>
          <li>
            <FaDatabase className="icon" />
            <div>
              <p>Nightly database backup completed successfully</p>
              <span>32 minutes ago · Backup System</span>
            </div>
          </li>
          <li>
            <FaLock className="icon" />
            <div>
              <p>Security patches installed (v2.4.1) across all servers</p>
              <span>1 hour ago · Update Service</span>
            </div>
          </li>
          <li>
            <FaGlobe className="icon" />
            <div>
              <p>Unusual network traffic pattern detected from region EU-West</p>
              <span>2 hours ago · Network Security</span>
            </div>
          </li>
        </ul>
      </div>

      <D3ResourceTrendsChart />
    </div>
  );
};

export default SystemMonitoringPage;
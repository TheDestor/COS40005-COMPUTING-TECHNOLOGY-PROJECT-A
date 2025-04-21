import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaMapMarkerAlt, FaChartLine, FaEnvelopeOpen, FaFileAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import * as d3 from 'd3';

const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const userEngagementChartRef = useRef(null);
  const businessParticipationChartRef = useRef(null);
  
  // Dummy data for user engagement
  const userEngagementData = [
    { month: 'Jan', inactive: 65, active: 0, signup: 0 },
    { month: 'Feb', inactive: 120, active: 0, signup: 0 },
    { month: 'Mar', inactive: 0, active: 180, signup: 0 },
    { month: 'Apr', inactive: 75, active: 0, signup: 0 },
    { month: 'May', inactive: 95, active: 0, signup: 0 },
    { month: 'Jun', inactive: 350, active: 0, signup: 0 },
    { month: 'Jul', inactive: 80, active: 0, signup: 0 },
    { month: 'Aug', inactive: 110, active: 0, signup: 0 },
    { month: 'Sep', inactive: 55, active: 0, signup: 0 },
    { month: 'Oct', inactive: 0, active: 0, signup: 250 },
    { month: 'Nov', inactive: 85, active: 0, signup: 0 },
    { month: 'Dec', inactive: 100, active: 0, signup: 0 }
  ];

  // Dummy data for business participation
  const businessParticipationData = {
    activePercentage: 82.3,
    inactivePercentage: 17.7,
    dailyInteractionGrowth: 18,
    weeklyListingsGrowth: 14
  };
  
  // Handler for card clicks that can be connected to navigation later
  const handleCardClick = (cardType) => {
    console.log(`${cardType} card clicked`);
    // Later we can add navigation or modal functionality here
  };

  // Initialize D3 charts after component mounts and window resize
  useEffect(() => {
    const renderCharts = () => {
      if (userEngagementChartRef.current) {
        createUserEngagementChart();
      }
      
      if (businessParticipationChartRef.current) {
        createBusinessParticipationChart();
      }
    };

    // Initial render
    renderCharts();
    
    // Add resize event listener
    window.addEventListener('resize', renderCharts);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', renderCharts);
    };
  }, []);

  // Create User Engagement chart using D3
  const createUserEngagementChart = () => {
    const container = d3.select(userEngagementChartRef.current);
    container.selectAll("*").remove(); // Clear previous chart if any
    
    const containerWidth = userEngagementChartRef.current.clientWidth;
    const margin = { top: 30, right: 20, bottom: 60, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;
    
    const svg = container
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleBand()
      .domain(userEngagementData.map(d => d.month))
      .range([0, width])
      .padding(0.4);
    
    const y = d3.scaleLinear()
      .domain([0, 400])
      .range([height, 0]);
    
    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#6b7280");
    
    // Create tooltip
    const tooltip = container
      .append("div")
      .attr("class", "chart-tooltip")
      .style("opacity", 0);

    // Helper function to determine bar color
    const getBarColor = (d) => {
      if (d.active > 0) return "#4ade80"; // Active Users - Green
      if (d.signup > 0) return "#ec4899"; // New Signups - Pink
      return "#a78bfa";  // Inactive Users - Purple
    };

    // Helper function to determine value
    const getBarValue = (d) => {
      if (d.active > 0) return d.active;
      if (d.signup > 0) return d.signup;
      return d.inactive;
    };

    // Helper function to determine label for tooltip
    const getBarLabel = (d) => {
      if (d.active > 0) return "Active Users";
      if (d.signup > 0) return "New Signups";
      return "Inactive Users";
    };

    // Create bars
    svg.selectAll(".bar")
      .data(userEngagementData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.month))
      .attr("width", x.bandwidth())
      .attr("y", d => y(getBarValue(d)))
      .attr("height", d => height - y(getBarValue(d)))
      .attr("rx", 4) // Rounded corners
      .attr("ry", 4)
      .attr("fill", d => getBarColor(d))
      .on("mouseover", function(event, d) {
        d3.select(this).transition().duration(200).attr("opacity", 0.8);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`${getBarLabel(d)}: ${getBarValue(d)}`)
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        d3.select(this).transition().duration(500).attr("opacity", 1);
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Add data point indicators for special months
    const dataPoints = [
      { month: "Mar", value: 180, label: "60" },
      { month: "Jun", value: 350, label: "150" },
      { month: "Oct", value: 250, label: "80" }
    ];

    dataPoints.forEach(point => {
      // Add circle
      svg.append("circle")
        .attr("cx", x(point.month) + x.bandwidth() / 2)
        .attr("cy", y(point.value) - 15)
        .attr("r", 5)
        .attr("fill", "#fff")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2);

      // Add label
      svg.append("rect")
        .attr("x", x(point.month) + x.bandwidth() / 2 - 25)
        .attr("y", y(point.value) - 40)
        .attr("width", 50)
        .attr("height", 24)
        .attr("rx", 12)
        .attr("ry", 12)
        .attr("fill", "#1e293b");

      svg.append("text")
        .attr("x", x(point.month) + x.bandwidth() / 2)
        .attr("y", y(point.value) - 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#fff")
        .text(point.label);
    });

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text("1500");

    // Add legend
    const legendData = [
      { label: "Inactive Users", color: "#a78bfa" },
      { label: "Active Users", color: "#4ade80" },
      { label: "New Signups", color: "#ec4899" }
    ];

    const legend = svg.append("g")
      .attr("transform", `translate(0, ${height + 30})`);

    legendData.forEach((item, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(${i * Math.floor(width/3)}, 0)`);

      legendItem.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", item.color);

      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("font-size", "12px")
        .attr("fill", "#6b7280")
        .text(item.label);
    });
  };

  // Create Business Participation chart (donut chart)
  const createBusinessParticipationChart = () => {
    const container = d3.select(businessParticipationChartRef.current);
    container.selectAll("*").remove(); // Clear previous chart if any
    
    const containerWidth = businessParticipationChartRef.current.clientWidth;
    const containerHeight = businessParticipationChartRef.current.clientHeight;
    const chartSize = Math.min(containerWidth * 0.6, containerHeight * 0.8);
    const radius = chartSize / 2;
    
    // Create SVG
    const svg = container
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr("transform", `translate(${containerWidth * 0.3},${containerHeight / 2})`);
    
    // Data for pie chart
    const data = [
      { name: "Active", value: businessParticipationData.activePercentage, color: "#818cf8" },
      { name: "Inactive", value: businessParticipationData.inactivePercentage, color: "#e4e4e7" }
    ];
    
    // Create pie chart
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
    
    const arc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);
    
    // Add arcs
    const arcs = svg.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");
    
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => d.data.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0.8)
      .on("mouseover", function() {
        d3.select(this).transition().duration(200).style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this).transition().duration(200).style("opacity", 0.8);
      });
    
    // Add center text
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "32px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text(`${businessParticipationData.activePercentage}%`);
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 30)
      .attr("font-size", "14px")
      .attr("fill", "#6b7280")
      .text("Active");
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 50)
      .attr("font-size", "14px")
      .attr("fill", "#6b7280")
      .text("Business");
    
    // Create indicators container
    const indicatorsContainer = container.append("div")
      .attr("class", "business-indicators")
      .style("position", "absolute")
      .style("top", "40px")
      .style("right", "20px")
      .style("width", "40%")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "20px");
    
    // Add stats indicators
    const statsData = [
      { label: "Daily Business Interaction", value: `+${businessParticipationData.dailyInteractionGrowth}%`, color: "#818cf8" },
      { label: "Weekly New Listings", value: `+${businessParticipationData.weeklyListingsGrowth}%`, color: "#a3e635" }
    ];

    // Helper function to create indicator element
    const createIndicator = (data, parent) => {
      const indicator = parent.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "10px");
      
      // Circle indicator
      const circle = indicator.append("div")
        .style("width", "40px")
        .style("height", "40px")
        .style("border-radius", "50%")
        .style("background-color", `${data.color}20`)
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center");
      
      circle.append("span")
        .style("color", data.color)
        .style("font-size", "20px")
        .html("↗");
      
      // Text content
      const textContent = indicator.append("div")
        .style("display", "flex")
        .style("flex-direction", "column");
      
      textContent.append("div")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("color", "#1e293b")
        .text(data.value);
      
      textContent.append("div")
        .style("font-size", "12px")
        .style("color", "#6b7280")
        .text(data.label);
    };
    
    // Create indicators
    statsData.forEach(stat => {
      createIndicator(stat, indicatorsContainer);
    });
    
    // Add legend at the bottom
    const legendContainer = container.append("div")
      .attr("class", "business-legend")
      .style("position", "absolute")
      .style("bottom", "20px")
      .style("left", "0")
      .style("width", "100%")
      .style("display", "flex")
      .style("justify-content", "space-around")
      .style("flex-wrap", "wrap");
    
    const legendItems = [
      { label: "Businesses registered but not engaging.", color: "#818cf8" },
      { label: "Businesses that have updated listings, responded to inquiries, or received bookings.", color: "#a3e635" }
    ];
    
    legendItems.forEach(item => {
      const legendItem = legendContainer.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "8px")
        .style("margin", "0 10px")
        .style("flex-basis", "45%");
      
      legendItem.append("div")
        .style("width", "10px")
        .style("height", "10px")
        .style("border-radius", "50%")
        .style("background-color", item.color);
      
      legendItem.append("div")
        .style("font-size", "11px")
        .style("color", "#6b7280")
        .text(item.label);
    });
  };
  
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="greeting">
            <h3>Hi, CBT Admin!</h3>
            <p>Welcome back to your dashboard</p>
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
        
        {/* Enhanced Interactive Stat Cards Section */}
        <div className="stat-cards-container">
          <div 
            className="stat-card" 
            onClick={() => handleCardClick('Active Destinations')}
            aria-label="View Active Destinations"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('Active Destinations')}
          >
            <div className="stat-icon-wrapper">
              <FaMapMarkerAlt className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Active Destinations</p>
              <h2 className="stat-value">45</h2>
            </div>
          </div>
          
          <div 
            className="stat-card"
            onClick={() => handleCardClick('Reviews Pending Approval')}
            aria-label="View Reviews Pending Approval"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('Reviews Pending Approval')}
          >
            <div className="stat-icon-wrapper">
              <FaChartLine className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Reviews Pending Approval</p>
              <h2 className="stat-value">12</h2>
            </div>
          </div>
          
          <div 
            className="stat-card"
            onClick={() => handleCardClick('New Inquiries')}
            aria-label="View New Inquiries"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('New Inquiries')}
          >
            <div className="stat-icon-wrapper">
              <FaEnvelopeOpen className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">New Inquiries</p>
              <h2 className="stat-value">5</h2>
            </div>
          </div>
          
          <div 
            className="stat-card"
            onClick={() => handleCardClick('Reported Content')}
            aria-label="View Reported Content"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('Reported Content')}
          >
            <div className="stat-icon-wrapper">
              <FaFileAlt className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Reported Content</p>
              <h2 className="stat-value">3</h2>
            </div>
          </div>
        </div>
        
        {/* Data Visualisation Section */}
        <div className="dashboard-visualizations">
          <div className="visualization-card">
            <div className="viz-header">
              <h3>User Engagement</h3>
            </div>
            <div className="viz-content" ref={userEngagementChartRef}></div>
          </div>
          
          <div className="visualization-card">
            <div className="viz-header">
              <h3>Business Participation</h3>
              <p>Percentage of Active vs. Inactive Businesses</p>
            </div>
            <div className="viz-content" ref={businessParticipationChartRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
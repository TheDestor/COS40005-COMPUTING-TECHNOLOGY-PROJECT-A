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
  const margin = { top: 40, right: 40, bottom: 70, left: 50 };
  const width = containerWidth - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;
  
  // Create SVG element with proper dimensions and margin handling
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
    .domain([0, d3.max(userEngagementData, d => Math.max(d.inactive, d.active, d.signup))])
    .range([height, 0]);
  
  // Add x-axis with styling
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#6b7280");
  
  // Add subtle y-axis gridlines
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    )
    .style("stroke-opacity", 0.1);
  
  // Add y-axis with styling
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(5))
    .selectAll("text")
    .style("font-size", "12px")
    .style("fill", "#6b7280");
  
  // Create tooltip with fixed positioning
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "chart-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(30, 41, 59, 0.9)")
    .style("color", "#fff")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", 999)
    .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)");

  // Helper function to determine bar color
  const getBarColor = (d) => {
    if (d.active > 0) return "#4ade80"; // Active Users - Green
    if (d.signup > 0) return "#ec4899"; // New Signups - Pink
    return "#a78bfa";  // Inactive Users - Purple
  };

  // Helper function to determine value
  const getBarValue = (d) => {
    let value;
    if (d.active > 0) value = d.active;
    else if (d.signup > 0) value = d.signup;
    else value = d.inactive;
    
    console.log(`Month: ${d.month}, Value: ${value}`);
    return value;
  };

  // Helper function to determine label for tooltip
  const getBarLabel = (d) => {
    if (d.active > 0) return "Active Users";
    if (d.signup > 0) return "New Signups";
    return "Inactive Users";
  };

  // Add bar animation transition duration
  const transitionDuration = 800;

  // Create bars with animations and improved interactions
  svg.selectAll(".bar")
    .data(userEngagementData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.month))
    .attr("width", x.bandwidth())
    .attr("y", height) // Start from bottom for animation
    .attr("height", 0) // Start with zero height for animation
    .attr("rx", 4) // Rounded corners
    .attr("ry", 4)
    .attr("fill", d => getBarColor(d))
    // Add hover interaction
    .on("mouseover", function(event, d) {
      // Highlight the bar
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.8)
        .attr("stroke", "#2c3345")
        .attr("stroke-width", 2);
      
      // Show tooltip with fixed positioning relative to mouse
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      
      tooltip.html(`
        <div style="font-weight: bold; margin-bottom: 5px;">${d.month}</div>
        <div>${getBarLabel(d)}: ${getBarValue(d)}</div>
      `)
      .style("left", `${event.pageX + 15}px`)
      .style("top", `${event.pageY - 40}px`);
    })
    .on("mouseout", function() {
      // Reset bar styling
      d3.select(this)
        .transition()
        .duration(500)
        .attr("opacity", 1)
        .attr("stroke-width", 0);
      
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    // Animate the bars on load
    .transition()
    .duration(transitionDuration)
    .delay((d, i) => i * 50)
    .attr("y", d => y(getBarValue(d)))
    .attr("height", d => height - y(getBarValue(d)));

  // Add data point indicators for special months with animations
  const dataPoints = [
    { month: "Mar", value: 180, label: "180" },
    { month: "Jun", value: 350, label: "350" },
    { month: "Oct", value: 250, label: "250" }
  ];

  // Add markers with animations
  dataPoints.forEach((point, i) => {
    // Add circle indicators
    svg.append("circle")
      .attr("cx", x(point.month) + x.bandwidth() / 2)
      .attr("cy", y(point.value) - 15)
      .attr("r", 0) // Start with radius 0 for animation
      .attr("fill", "#fff")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .transition()
      .duration(transitionDuration)
      .delay(transitionDuration + i * 100)
      .attr("r", 5); // Grow to final radius

    // Add label background
    svg.append("rect")
      .attr("x", x(point.month) + x.bandwidth() / 2 - 25)
      .attr("y", y(point.value) - 40)
      .attr("width", 50)
      .attr("height", 24)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", "#1e293b")
      .attr("opacity", 0) // Start invisible
      .transition()
      .duration(transitionDuration)
      .delay(transitionDuration + i * 100)
      .attr("opacity", 1); // Fade in

    // Add label text
    svg.append("text")
      .attr("x", x(point.month) + x.bandwidth() / 2)
      .attr("y", y(point.value) - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#fff")
      .attr("opacity", 0) // Start invisible
      .text(point.label)
      .transition()
      .duration(transitionDuration)
      .delay(transitionDuration + i * 100 + 200)
      .attr("opacity", 1); // Fade in
  });

  // Add title with animation
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .attr("fill", "#1e293b")
    .attr("opacity", 0) // Start invisible
    .text("1500")
    .transition()
    .duration(transitionDuration)
    .attr("opacity", 1); // Fade in
    
  // Add subtitle
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2 + 25)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#6b7280")
    .attr("opacity", 0) // Start invisible
    .text("Total Users")
    .transition()
    .duration(transitionDuration)
    .delay(200)
    .attr("opacity", 1); // Fade in

  // Add legend with better positioning and layout
  const legendData = [
    { label: "Inactive Users", color: "#a78bfa" },
    { label: "Active Users", color: "#4ade80" },
    { label: "New Signups", color: "#ec4899" }
  ];

  const legendWidth = width / legendData.length;
  
  const legend = svg.append("g")
    .attr("transform", `translate(0, ${height + 30})`);

  legendData.forEach((item, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${i * legendWidth}, 0)`)
      .style("cursor", "pointer")
      .on("mouseover", function() {
        // Highlight bars of this type
        svg.selectAll(".bar")
          .transition()
          .duration(200)
          .attr("opacity", d => {
            if ((item.label === "Inactive Users" && d.inactive > 0) ||
                (item.label === "Active Users" && d.active > 0) ||
                (item.label === "New Signups" && d.signup > 0)) {
              return 1;
            }
            return 0.2;
          });
        
        // Highlight legend item
        d3.select(this).select("rect")
          .transition()
          .duration(200)
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 2);
      })
      .on("mouseout", function() {
        // Reset all bars
        svg.selectAll(".bar")
          .transition()
          .duration(500)
          .attr("opacity", 1);
        
        // Reset legend item
        d3.select(this).select("rect")
          .transition()
          .duration(200)
          .attr("stroke", "none");
      });

    // Legend color box
    legendItem.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("fill", item.color)
      .attr("opacity", 0) // Start invisible
      .transition()
      .duration(transitionDuration)
      .delay(transitionDuration + i * 100)
      .attr("opacity", 1); // Fade in

    // Legend text
    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .attr("font-size", "12px")
      .attr("fill", "#6b7280")
      .text(item.label)
      .attr("opacity", 0) // Start invisible
      .transition()
      .duration(transitionDuration)
      .delay(transitionDuration + i * 100 + 100)
      .attr("opacity", 1); // Fade in
  });
  
  // Add event listener to remove tooltip when component unmounts
  return () => {
    tooltip.remove();
  };
};

  // Create Business Participation chart (donut chart)
  const createBusinessParticipationChart = () => {
    const container = d3.select(businessParticipationChartRef.current);
    container.selectAll("*").remove(); // Clear previous chart if any
    
    const containerWidth = businessParticipationChartRef.current.clientWidth;
    const containerHeight = 340; // Fixed height for consistency
    
    // Create a proper wrapper element to hold both SVG and indicators
    const chartWrapper = container
      .append("div")
      .attr("class", "chart-wrapper")
      .style("position", "relative")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex");
    
    // Create left section for donut chart (60% width)
    const donutSection = chartWrapper
      .append("div")
      .attr("class", "donut-section")
      .style("width", "60%")
      .style("height", "100%")
      .style("position", "relative");
    
    // Create right section for indicators (40% width)
    const indicatorsSection = chartWrapper
      .append("div")
      .attr("class", "indicators-section")
      .style("width", "40%")
      .style("height", "100%")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("justify-content", "center")
      .style("padding-left", "20px");
    
    // Set up the donut chart dimensions
    const chartSize = Math.min(donutSection.node().clientWidth * 0.8, containerHeight * 0.8);
    const radius = chartSize / 2;
    
    // Create SVG for donut chart
    const svg = donutSection
      .append("svg")
      .attr("width", donutSection.node().clientWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr("transform", `translate(${donutSection.node().clientWidth/2},${containerHeight/2})`);
    
    // Data for pie chart
    const data = [
      { name: "Active", value: businessParticipationData.activePercentage, color: "#818cf8" },
      { name: "Inactive", value: businessParticipationData.inactivePercentage, color: "#e4e4e7" }
    ];
    
    // Create pie chart with animation
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.03);
    
    // Define arcs with animation settings
    const arc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);
    
    // Create tooltip for donut chart
    const tooltip = container
      .append("div")
      .attr("class", "chart-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("padding", "10px")
      .style("background", "rgba(30, 41, 59, 0.9)")
      .style("color", "#fff")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", 10)
      .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)");
    
    // Add animation transition duration
    const transitionDuration = 1000;
    
    // Create donut chart arcs with animations
    const arcs = svg.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");
    
    // Add path with animation
    arcs.append("path")
      .attr("d", d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6) // Start with outer radius = inner radius
      )
      .attr("fill", d => d.data.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0.8)
      .transition()
      .duration(transitionDuration)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate(
          {startAngle: d.startAngle, endAngle: d.startAngle},
          {startAngle: d.startAngle, endAngle: d.endAngle}
        );
        return function(t) {
          return arc(interpolate(t));
        };
      });
    
    // Add interactive hover effects
    arcs.selectAll("path")
      .on("mouseover", function(event, d) {
        // Highlight segment
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", d3.arc()
            .innerRadius(radius * 0.58)
            .outerRadius(radius * 1.05)
          )
          .style("opacity", 1);
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 5px;">${d.data.name} Businesses</div>
          <div>${d.data.value}% of total</div>
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 40}px`);
      })
      .on("mouseout", function() {
        // Reset segment
        d3.select(this)
          .transition()
          .duration(500)
          .attr("d", arc)
          .style("opacity", 0.8);
        
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
    
    // Add center text with animation
    const centerText = svg.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "32px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .attr("opacity", 0)
      .text("0%");
    
    centerText.transition()
      .duration(transitionDuration)
      .tween("text", function() {
        const i = d3.interpolate(0, businessParticipationData.activePercentage);
        return function(t) {
          this.textContent = `${Math.round(i(t) * 10) / 10}%`;
        };
      })
      .attr("opacity", 1);
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 30)
      .attr("font-size", "14px")
      .attr("fill", "#6b7280")
      .attr("opacity", 0)
      .text("Active")
      .transition()
      .duration(transitionDuration)
      .delay(300)
      .attr("opacity", 1);
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 50)
      .attr("font-size", "14px")
      .attr("fill", "#6b7280")
      .attr("opacity", 0)
      .text("Business")
      .transition()
      .duration(transitionDuration)
      .delay(400)
      .attr("opacity", 1);
    
    // Helper function to create indicator elements
    const createIndicator = (data, index) => {
      const indicator = indicatorsSection.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "12px")
        .style("margin-bottom", "20px")
        .style("opacity", "0") // Start invisible for animation
        .style("transform", "translateY(20px)"); // Start with offset for animation
      
      // Run animation
      indicator.transition()
        .duration(800)
        .delay(transitionDuration + index * 200)
        .style("opacity", "1")
        .style("transform", "translateY(0)");
      
      // Circle indicator
      const circle = indicator.append("div")
        .style("width", "40px")
        .style("height", "40px")
        .style("border-radius", "50%")
        .style("background-color", `${data.color}20`)
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("flex-shrink", "0")
        .style("box-shadow", "0 2px 8px rgba(0, 0, 0, 0.1)");
      
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
    
    // Create indicators with staggered animations
    const statsData = [
      { label: "Daily Business Interaction", value: `+${businessParticipationData.dailyInteractionGrowth}%`, color: "#818cf8" },
      { label: "Weekly New Listings", value: `+${businessParticipationData.weeklyListingsGrowth}%`, color: "#a3e635" }
    ];
    
    statsData.forEach((stat, i) => {
      createIndicator(stat, i);
    });
    
    // Add legend at the bottom
    const legendContainer = container.append("div")
      .attr("class", "business-legend")
      .style("position", "absolute")
      .style("bottom", "10px")
      .style("left", "0")
      .style("width", "100%")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("flex-wrap", "wrap")
      .style("gap", "20px")
      .style("padding", "0 20px")
      .style("opacity", "0") // Start invisible for animation
      .style("transform", "translateY(20px)"); // Start with offset for animation
    
    // Run animation
    legendContainer.transition()
      .duration(800)
      .delay(transitionDuration + 600)
      .style("opacity", "1")
      .style("transform", "translateY(0)");
    
    const legendItems = [
      { label: "Businesses registered but not engaging.", color: "#e4e4e7" },
      { label: "Businesses that have updated listings, responded to inquiries, or received bookings.", color: "#818cf8" }
    ];
    
    legendItems.forEach(item => {
      const legendItem = legendContainer.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "8px")
        .style("max-width", "45%");
      
      legendItem.append("div")
        .style("width", "10px")
        .style("height", "10px")
        .style("border-radius", "50%")
        .style("background-color", item.color)
        .style("flex-shrink", "0");
      
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
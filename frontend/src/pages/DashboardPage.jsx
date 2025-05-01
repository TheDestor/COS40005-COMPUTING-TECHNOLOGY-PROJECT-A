import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaMapMarkerAlt, FaChartLine, FaEnvelopeOpen, FaFileAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import * as d3 from 'd3';
import profile1 from '../assets/profile1.png';
import profile2 from '../assets/profile2.png';
import profile3 from '../assets/profile3.png';
import profile4 from '../assets/profile4.png';
import profile5 from '../assets/profile5.png';

const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const businessParticipationChartRef = useRef(null);
  const userEngagementChartRef = useRef(null);
  
  // Dummy data for business participation
  const businessParticipationData = {
    activePercentage: 82.3,
    inactivePercentage: 17.7,
    dailyInteractionGrowth: 18,
    weeklyListingsGrowth: 14
  };
  
  // Dummy data for user engagement bar chart
  const userEngagementData = {
    totalUsers: 1500,
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
      {
        name: 'Active Users',
        values: [800, 1000, 1100, 1200, 1300, 1400],
        color: '#4f46e5' // Indigo
      },
      {
        name: 'Inactive Users',
        values: [300, 280, 260, 240, 200, 180],
        color: '#9ca3af' // Gray
      },
      {
        name: 'New Signups',
        values: [120, 180, 210, 240, 280, 350],
        color: '#10b981' // Emerald
      }
    ],
    growthRate: 25.2,
    activeRate: '78%',
    retentionRate: '92%'
  };
  
  // Handler for card clicks that can be connected to navigation later
  const handleCardClick = (cardType) => {
    console.log(`${cardType} card clicked`);
    // Later we can add navigation or modal functionality here
  };

  // Initialize D3 charts after component mounts and window resize
  useEffect(() => {
    const renderCharts = () => {
      if (businessParticipationChartRef.current) {
        createBusinessParticipationChart();
      }
      if (userEngagementChartRef.current) {
        createUserEngagementBarChart();
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
    
    // Create pie chart with animation
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.03);
    
    // Define arcs with animation settings
    const arc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);
    
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

  // Create User Engagement Bar Chart
const createUserEngagementBarChart = () => {
  const container = d3.select(userEngagementChartRef.current);
  container.selectAll("*").remove(); // Clear previous chart if any
  
  const containerWidth = userEngagementChartRef.current.clientWidth;
  const containerHeight = 340; // Fixed height for consistency
  
  // Create a proper wrapper element to hold both SVG and indicators
  const chartWrapper = container
    .append("div")
    .attr("class", "chart-wrapper")
    .style("position", "relative")
    .style("width", "100%")
    .style("height", "100%")
    .style("display", "flex");
  
  // Create left section for bar chart (70% width)
  const chartSection = chartWrapper
    .append("div")
    .attr("class", "chart-section")
    .style("width", "70%")
    .style("height", "100%")
    .style("position", "relative");
  
  // Create right section for indicators (30% width)
  const indicatorsSection = chartWrapper
    .append("div")
    .attr("class", "indicators-section")
    .style("width", "30%")
    .style("height", "100%")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("justify-content", "center")
    .style("padding-left", "20px");
  
  // Create tooltip for bar chart
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
  
  // Set margins and dimensions
  const margin = { top: 50, right: 20, bottom: 40, left: 50 };
  const width = chartSection.node().clientWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  // Add animation transition duration
  const transitionDuration = 1000;
  
  // Create SVG for bar chart
  const svg = chartSection
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Create scales
  const x = d3.scaleBand()
    .domain(userEngagementData.months)
    .range([0, width])
    .padding(0.2);
  
  // Calculate the max value summing all series values for each month
  const maxStackedValue = userEngagementData.months.map((month, i) => {
    return userEngagementData.series.reduce((sum, series) => sum + series.values[i], 0);
  });
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(maxStackedValue) * 1.1])
    .range([height, 0]);
  
  // Add X axis with animation
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "x-axis")
    .style("font-size", "12px")
    .style("color", "#6b7280")
    .call(d3.axisBottom(x))
    .attr("opacity", 0)
    .transition()
    .duration(transitionDuration)
    .attr("opacity", 1);
  
  // Add Y axis with animation
  svg.append("g")
    .attr("class", "y-axis")
    .style("font-size", "12px")
    .style("color", "#6b7280")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
      if (d >= 1000) {
        return `${d/1000}k`;
      }
      return d;
    }))
    .attr("opacity", 0)
    .transition()
    .duration(transitionDuration)
    .attr("opacity", 1);
  
  // Add grid lines with animation
  svg.append("g")
    .attr("class", "grid")
    .attr("opacity", 0)
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
      .ticks(5))
    .selectAll("line")
    .style("stroke", "#e5e7eb")
    .style("stroke-opacity", "0.5")
    .style("stroke-dasharray", "5,5");
  
  svg.select(".grid")
    .transition()
    .duration(transitionDuration)
    .attr("opacity", 0.5);
  
  // Total user count text at the top - REPOSITIONED
  const chartTitle = svg.append("g")
    .attr("class", "chart-title")
    .attr("transform", `translate(${width/2}, -30)`)
    .style("text-anchor", "middle");
  
  chartTitle.append("text")
    .attr("class", "total-users-text")
    .attr("y", 0)
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .attr("fill", "#1e293b")
    .attr("opacity", 0)
    .text(`${userEngagementData.totalUsers}`)
    .transition()
    .duration(transitionDuration)
    .attr("opacity", 1);
  
  chartTitle.append("text")
    .attr("class", "total-users-label")
    .attr("y", 20)
    .attr("font-size", "14px")
    .attr("fill", "#6b7280")
    .attr("opacity", 0)
    .text("Total Users")
    .transition()
    .duration(transitionDuration)
    .delay(200)
    .attr("opacity", 1);
  
  // Group the data to create stacked bars
  const stackedData = [];
  
  userEngagementData.months.forEach((month, i) => {
    let y0 = 0; // Starting y position for each stack
    
    const monthData = { month };
    
    userEngagementData.series.forEach(series => {
      const value = series.values[i];
      monthData[series.name] = value;
      monthData[`${series.name}_y0`] = y0;
      monthData[`${series.name}_y1`] = y0 + value;
      y0 += value;
    });
    
    stackedData.push(monthData);
  });
  
  // Create stacked bars with animation
  userEngagementData.series.forEach(series => {
    svg.selectAll(`.bar-${series.name.replace(/\s+/g, '-').toLowerCase()}`)
      .data(stackedData)
      .enter()
      .append("rect")
      .attr("class", `bar-${series.name.replace(/\s+/g, '-').toLowerCase()}`)
      .attr("x", d => x(d.month))
      .attr("width", x.bandwidth())
      .attr("y", height) // Start from the bottom
      .attr("height", 0) // Start with height 0
      .attr("fill", series.color)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        // Highlight bar segment
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8);
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 5px;">${d.month}</div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${series.color}; margin-right: 8px;"></div>
            <div>${series.name}: <b>${d[series.name].toLocaleString()}</b></div>
          </div>
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 40}px`);
      })
      .on("mouseout", function() {
        // Reset bar segment
        d3.select(this)
          .transition()
          .duration(500)
          .attr("opacity", 1);
        
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .transition()
      .duration(transitionDuration)
      .delay((d, i) => i * 100)
      .attr("y", d => y(d[`${series.name}_y1`]))
      .attr("height", d => y(d[`${series.name}_y0`]) - y(d[`${series.name}_y1`]));
  });
  
  // Create legend - MOVED TO TOP-RIGHT CORNER
  const legendContainer = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 320}, -90)`)
    .style("opacity", 0);
  
  // Add legend items with animation
  userEngagementData.series.forEach((series, i) => {
    const legend = legendContainer.append("g")
      .attr("transform", `translate(0, ${i * 20})`);
    
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("fill", series.color);
    
    legend.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .style("font-size", "11px")
      .style("fill", "#6b7280")
      .text(series.name);
  });
  
  // Animate legend
  legendContainer.transition()
    .duration(800)
    .delay(transitionDuration)
    .style("opacity", 1);
  
  // Helper function to create stat indicator elements
  const createStatIndicator = (data, index) => {
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
      .style("font-size", data.icon === "↗" ? "20px" : "18px")
      .html(data.icon);
    
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
  
  // Create stat indicators with staggered animations
  const statsData = [
    { label: "Monthly Growth", value: `+${userEngagementData.growthRate}%`, color: "#818cf8", icon: "↗" },
    { label: "Active Rate", value: userEngagementData.activeRate, color: "#4f46e5", icon: "👤" },
    { label: "Retention Rate", value: userEngagementData.retentionRate, color: "#10b981", icon: "↩" }
  ];
  
  statsData.forEach((stat, i) => {
    createStatIndicator(stat, i);
  });
};

// Add this after your userEngagementData object
const usersList = [
  { id: 1, name: "Goku", email: "gokul@gmail.com", status: "Active", lastLogin: "2 hours ago", image: profile1 },
  { id: 2, name: "Kenneth", email: "kenneth@gmail.com", status: "Inactive", lastLogin: "2 days ago", image: profile2 },
  { id: 3, name: "Alvin", email: "alvin@gmail.com", status: "Active", lastLogin: "5 minutes ago", image: profile3 },
  { id: 4, name: "Gary", email: "gary@gmail.com", status: "Active", lastLogin: "1 day ago", image: profile4 },
  { id: 5, name: "Daniel", email: "daniel@gmail.com", status: "Inactive", lastLogin: "1 week ago", image: profile5 },
];

  
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
        
        {/* Data Visualisation Section - Business Participation + User Engagement Charts */}
        <div className="dashboard-visualizations">          
          <div className="visualization-card">
            <div className="viz-header">
              <h3>Business Participation</h3>
              <p>Percentage of Active vs. Inactive Businesses</p>
            </div>
            <div className="viz-content" ref={businessParticipationChartRef}></div>
          </div>
          
          <div className="visualization-card">
            <div className="viz-header">
              <h3>User Engagement Trends</h3>
              <p>Monthly metrics showing platform engagement</p>
            </div>
            <div className="viz-content" ref={userEngagementChartRef}></div>
          </div>
        </div>
        
        {/* Add the Users List Section right HERE, before the closing div of dashboard-content */}
        {/* Users List Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Recent Users</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="users-list-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(user => (
                  <tr key={user.id}>
                    <td className="user-cell">
                      <img src={user.image} alt={user.name} className="user-avatar" />
                      <span>{user.name}</span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td className="actions-cell">
                      <button className="action-btn view-btn">View</button>
                      <button className="action-btn edit-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
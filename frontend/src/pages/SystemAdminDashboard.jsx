import React, { useEffect, useRef } from 'react';
import { FaTachometerAlt, FaRegSave, FaUserCog, FaExclamationTriangle, FaChartBar, FaArrowUp, FaArrowDown, FaUser, FaStar } from 'react-icons/fa';
import { MdSpeed } from 'react-icons/md';
import { AiOutlineFundView } from "react-icons/ai";
import { IoIosTrendingUp } from "react-icons/io";
import * as d3 from 'd3';
import SystemAdminSidebar from '../pages/SystemAdminSidebar';

// Import profile images - you'll need to add these to your assets folder
import profile1 from '../assets/profile1.png';
import profile2 from '../assets/profile2.png';
import profile3 from '../assets/profile3.png';
import profile4 from '../assets/profile4.png';
import profile5 from '../assets/profile5.png';

const SystemAdminDashboard = () => {
  const chartRef = useRef(null);

  const summaryData = [
    {
      title: 'Today Page Views',
      value: '45',
      icon: <AiOutlineFundView />,
      cardClass: 'purple-theme',
      iconBgClass: 'purple-bg',
      trend: '15.8%',
      trendType: 'positive'
    },
    {
      title: 'Destination Trending',
      value: '12',
      icon: <IoIosTrendingUp />,
      cardClass: 'blue-theme',
      iconBgClass: 'blue-bg',
      trend: '5.2%',
      trendType: 'positive'
    },
    {
      title: 'System Performance',
      value: '98%',
      icon: <MdSpeed />,
      cardClass: 'green-theme',
      iconBgClass: 'green-bg',
      trend: '1%',
      trendType: 'negative'
    },
    {
      title: 'Data Integrity',
      value: 'Backup up to date',
      icon: <FaRegSave />,
      cardClass: 'teal-theme',
      iconBgClass: 'teal-bg',
      trend: 'Today 2am',
      trendType: 'positive'
    },
  ];

  const adminActivities = [
    { admin: 'aty@outlook.com', action: 'Delete user account', date: '31/3/2025', status: 'Completed' },
    { admin: 'kkys@outlook.com', action: 'Add user account', date: '31/3/2025', status: 'Incomplete' },
  ];

  const systemAlerts = [
    { alert: 'Security', message: 'Unauthorized access attempt', date: '31/3/2025', status: 'Investigated' },
    { alert: 'Performance', message: 'High server load', date: '31/3/2025', status: 'Monitoring' },
  ];

  // User usage data for the bar chart
  const monthlyUsageData = [
    { month: 'Jan', users: 2500 },
    { month: 'Feb', users: 3200 },
    { month: 'Mar', users: 4100 },
    { month: 'Apr', users: 5300 },
    { month: 'May', users: 4800 },
    { month: 'Jun', users: 6200 },
    { month: 'Jul', users: 7100 },
    { month: 'Aug', users: 8500 },
    { month: 'Sep', users: 7800 },
    { month: 'Oct', users: 6500 },
    { month: 'Nov', users: 5900 },
    { month: 'Dec', users: 7200 }
  ];

  // Dummy Data for Users List (moved from CBT Dashboard)
  const usersList = [
    { id: 1, name: "Goku", email: "gokul@gmail.com", status: "Active", lastLogin: "2 hours ago", image: profile1 },
    { id: 2, name: "Kenneth", email: "kenneth@gmail.com", status: "Inactive", lastLogin: "2 days ago", image: profile2 },
    { id: 3, name: "Alvin", email: "alvin@gmail.com", status: "Active", lastLogin: "5 minutes ago", image: profile3 },
    { id: 4, name: "Gary", email: "gary@gmail.com", status: "Active", lastLogin: "1 day ago", image: profile4 },
    { id: 5, name: "Daniel", email: "daniel@gmail.com", status: "Inactive", lastLogin: "1 week ago", image: profile5 },
  ];

  // Sample data for reviews pending approval (moved from CBT Dashboard)
  const pendingReviews = [
    {
      id: 1,
      author: "Gokul",
      business: "Damai Beach Resort",
      rating: 4,
      content: "Beautiful location and friendly staff. The rooms were clean but a little outdated. Would recommend for a peaceful getaway.",
      date: "2025-04-30",
      userImage: profile3
    },
    {
      id: 2,
      author: "Kenneth",
      business: "Bangoh Dam",
      rating: 5,
      content: "Absolutely incredible experience! Our guide was knowledgeable and safety-conscious. The views were breathtaking and the equipment was top-notch.",
      date: "2025-05-01",
      userImage: profile1
    },
    {
      id: 3, 
      author: "Alvin",
      business: "Korean Cafe",
      rating: 2,
      content: "Disappointing experience. Long wait times and food was served cold. The ambiance was nice but doesn't make up for poor service.",
      date: "2025-05-01",
      userImage: profile4
    },
    {
      id: 4,
      author: "Daniel",
      business: "Meditation Center",
      rating: 5,
      content: "Transformative experience! The instructor was attentive and provided great modifications for all skill levels. Studio was clean and peaceful.",
      date: "2025-05-02",
      userImage: profile2
    }
  ];

  // Review management functions (moved from CBT Dashboard)
  const handleReviewAction = (reviewId, action) => {
    console.log(`Review ${reviewId} ${action}`);
    // This Part can use to handle the API call to approve/reject the review
    // For now, we'll just log the action
  };

  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else {
        stars.push(<span key={i} className="star">☆</span>);
      }
    }
    return <div className="star-rating">{stars}</div>;
  };

  useEffect(() => {
    // Add a small delay to ensure the container is fully rendered with correct dimensions
    const timer = setTimeout(() => {
      if (chartRef.current) {
        // Clear any existing chart
        d3.select(chartRef.current).selectAll('*').remove();
        
        createBarChart();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const createBarChart = () => {
    // Chart dimensions with increased left margin for axis labels
    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    // Get the full width of the container
    const containerWidth = chartRef.current.clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Clear any existing SVG
    d3.select(chartRef.current).select('svg').remove();
    
    // Create SVG with proper dimensions - setting explicit width to 100% to match .table-section
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', containerWidth)  // Match the full width of the container
      .attr('height', height + margin.top + margin.bottom)
      .attr('preserveAspectRatio', 'xMidYMid meet')  // Center alignment
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scaleBand()
      .domain(monthlyUsageData.map(d => d.month))
      .range([0, width])
      .padding(0.3);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyUsageData, d => d.users) * 1.1])
      .range([height, 0]);

    // Format for Y axis labels (K = thousands)
    const formatK = value => {
      return value >= 1000 ? `${value / 1000}K` : value;
    };

    // Add X axis with rotated labels to prevent overlap
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('text-anchor', 'middle');

    // Add Y axis with proper formatting
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(formatK).ticks(10))
      .selectAll('text')
      .style('font-size', '12px')
      .style('text-anchor', 'end');

    // Add Y axis label with proper positioning
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 20) // Adjust position
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#555')
      .text('Page Views Count');

    // Color scale - adjusted to use a more defined blue range
    const color = d3.scaleLinear()
      .domain([0, d3.max(monthlyUsageData, d => d.users)])
      .range(['#92caff', '#007bff']); // A lighter blue to primary blue gradient

    // Add tooltip
    const tooltip = d3.select(chartRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '10');

    // Add bars with animation
    svg.selectAll('.bar')
      .data(monthlyUsageData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.month))
      .attr('width', x.bandwidth())
      .attr('y', height) // Start from bottom
      .attr('height', 0) // Initially height is 0
      .attr('rx', 3) // Rounded corners
      .attr('fill', d => color(d.users))
      .on('mouseover', function(event, d) {
        // Highlight bar on hover with a consistent hover blue
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#0056b3') // A darker, more prominent blue on hover
          .attr('opacity', 1);
        
        // Show tooltip
        tooltip
          .style('visibility', 'visible')
          .html(`<strong>${d.month}:</strong> ${d.users.toLocaleString()} views`)
          .style('left', `${event.pageX - chartRef.current.offsetLeft}px`)
          .style('top', `${event.pageY - chartRef.current.offsetTop - 40}px`);
      })
      .on('mouseout', function(event, d) {
        // Reset bar on mouseout to its original gradient color
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', color(d.users))
          .attr('opacity', 0.9);
        
        // Hide tooltip
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('y', d => y(d.users))
      .attr('height', d => height - y(d.users));

    // Add a properly positioned title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#333') // Keep text dark for readability
      .style('dominant-baseline', 'middle')
      .text('Monthly Page Views Analytics');

    // Add hover effect to grid lines (if desired, currently this is just stroke/dasharray)
    svg.selectAll('.tick line')
      .style('stroke', '#ccc') // Lighter grid lines
      .style('stroke-dasharray', '2,2');
  };

  // Add resize event listener for responsive chart
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        createBarChart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="admin-container">
    <SystemAdminSidebar />
    <div className="content-section2">
      <h2><FaTachometerAlt /> Dashboard</h2>

      <div className="summary-container">
        {summaryData.map((item, idx) => (
          <div className={`summary-box ${item.cardClass}`} key={idx}>
            <div className={`summary-icon-wrapper ${item.iconBgClass}`}>
              <div className='summary-icon'>{item.icon}</div>
            </div>
            <h3>{item.title}</h3>
            <p className="value">{item.value}</p>
            {item.trend && (
              <div className={`summary-trend ${item.trendType}`}>
                {item.trend} {item.trendType === 'positive' ? <FaArrowUp /> : <FaArrowDown />}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Usage Chart Section */}
      <div className="table-section">
        <div className="table-header-admin">
          <h3>
            <span className="header-icon-admin"><FaChartBar /></span>
            Page Views Analytics
          </h3>
          <button className="view-all">Export Data</button>
        </div>
        <div 
          ref={chartRef} 
          className="chart-container" 
          style={{ 
            height: '450px', 
            width: '100%', 
            padding: '20px 0', 
            boxSizing: 'border-box',
            color: '#333',
          }}
        ></div>
      </div>

      {/* Users List Section - Moved from CBT Dashboard */}
      <div className="dashboard-section">
        <div className="table-section">
          <div className="table-header-admin">
            <h3>
              <span className="header-icon-admin"><FaUser /></span>
              Recent Users
            </h3>
            <button className="view-all">View All</button>
          </div>
          <div className="users-list-container">
            <table className="users-table data-table">
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
    </div>
  );
};

export default SystemAdminDashboard;
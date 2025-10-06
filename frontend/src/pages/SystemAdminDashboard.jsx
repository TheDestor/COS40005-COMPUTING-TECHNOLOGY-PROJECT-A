import React, { useEffect, useRef } from 'react';
import { FaTachometerAlt, FaRegSave, FaUserCog, FaExclamationTriangle, FaChartBar, FaArrowUp, FaArrowDown, FaUser, FaStar } from 'react-icons/fa';
import { MdSpeed } from 'react-icons/md';
import { AiOutlineFundView } from "react-icons/ai";
import { IoIosTrendingUp } from "react-icons/io";
import * as d3 from 'd3';
import SystemAdminSidebar from '../pages/SystemAdminSidebar';
import { useAuth } from '../context/AuthProvider';
import ky from 'ky';

// Import profile images - you'll need to add these to your assets folder
import profile1 from '../assets/profile1.png';
import profile2 from '../assets/profile2.png';
import profile3 from '../assets/profile3.png';
import profile4 from '../assets/profile4.png';
import profile5 from '../assets/profile5.png';
import { useState } from 'react';

function SystemAdminDashboard() {
  const chartRef = useRef(null);
  const [usersList, setUsersList] = useState([]);
  const { accessToken } = useAuth();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);

  // New: dashboard KPI stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    recaptchaBlocked: 0,
    dbStoragePercent: 0,
    totalPageViews: 0,
    statusBreakdown: { active: 0, inactive: 0, suspended: 0 },
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await ky.get('/api/admin/metrics/stats', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).json();
        if (res?.success) {
          const d = res.data;
          setDashboardStats({
            totalUsers: d.totalUsers || 0,
            recaptchaBlocked: d.recaptchaBlocked || 0,
            dbStoragePercent: d.dbStoragePercent || 0,
            totalPageViews: d.totalPageViews || 0,
            statusBreakdown: d.statusBreakdown || { active: 0, inactive: 0, suspended: 0 },
          });
        }
      } catch (e) {
        console.error('Failed to fetch admin metrics:', e);
      }
    };
    fetchMetrics();

    // Light real-time polling (30s)
    const t = setInterval(fetchMetrics, 30000);
    return () => clearInterval(t);
  }, [accessToken]);

  // New: derive summary boxes from real stats
  const summaryData = [
    {
      title: 'Total Page Views',
      value: dashboardStats.totalPageViews.toLocaleString(),
      icon: <AiOutlineFundView />,
      cardClass: 'teal-theme',
      iconBgClass: 'teal-bg',
    },
    {
      title: 'Total Users',
      value: dashboardStats.totalUsers.toLocaleString(),
      icon: <FaUser />,
      cardClass: 'blue-theme',
      iconBgClass: 'blue-bg',
    },
    {
      title: 'Database Storage',
      value: `${Math.round(dashboardStats.dbStoragePercent)}%`,
      icon: <FaRegSave />,
      cardClass: 'green-theme',
      iconBgClass: 'green-bg',
    },
    {
      title: 'reCAPTCHA Blocked',
      value: dashboardStats.recaptchaBlocked.toLocaleString(),
      icon: <FaExclamationTriangle />,
      cardClass: 'purple-theme',
      iconBgClass: 'purple-bg',
    },
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

  // Fetch data from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await ky.get('/api/userManagement/users?sort=createdAt_desc&limit=5', { headers: { 'Authorization': `Bearer ${accessToken}` } }).json();

        if (response.success) {
          const formattedUsers = response.users.map((user) => {
            const createdAt = user.createdAt ? new Date(user.createdAt) : null;
            const isNew = createdAt ? (Date.now() - createdAt.getTime()) <= 24 * 60 * 60 * 1000 : false;
            return {
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              role: user.role,
              lastLogin: user.lastLogin || 'N/A',
              image: user.avatarUrl && user.avatarUrl.trim() ? user.avatarUrl : defaultImage,
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
    setUsersList(prevUsers =>
      prevUsers.map(user =>
        user.id === updatedUserId ? { ...user, ...updatedUserData } : user
      )
    );
  };

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

      {/* Users List Section - System Admin Table */}
      <div className="dashboard-section-sa">
        <div className="table-section-sa">
          <div className="table-header-sa">
            <h3>
              <span className="header-icon-sa"><FaUser /></span>
              New Recent Users
            </h3>
            <Link to="/user-management" className="view-all-sa">View All</Link>
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
                {usersList.map(user => (
                  <tr key={user.id} className={user.isNew ? 'new-user-row-sa' : ''}>
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
                      <span className={`status-badge-sa ${user.role.toLowerCase()}-sa`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="actions-cell-sa">
                      <button className="action-btn-sa edit-btn-sa" onClick={() => handleEditClick(user)}>Edit</button>
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
};

export default SystemAdminDashboard;
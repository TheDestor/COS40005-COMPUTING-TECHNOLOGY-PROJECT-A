import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ky from "ky";
import { toast } from "sonner";
import {
  FaMapMarkerAlt,
  FaChartLine,
  FaEnvelopeOpen,
  FaFileAlt,
  FaTimes,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";
import * as d3 from "d3";
import { useAuth } from '../context/AuthProvider';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  
  // Added mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const businessParticipationChartRef = useRef(null);
  const userEngagementChartRef = useRef(null);

  // State for dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    newBusinessSubmissions: 0,
    totalInquiries: 0,
    newsletterSubscribers: 0,
    activeDestinations: 0
  });
  const [loading, setLoading] = useState(true);

  // State for visualizations
  const [locationData, setLocationData] = useState(null);
  const [monthlyTrendsData, setMonthlyTrendsData] = useState(null);
  
  // State for newsletter modal
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    // Wait for auth to be ready
    const timer = setTimeout(() => {
      if (accessToken) {
        fetchDashboardStats();
        fetchLocationBreakdown();
        fetchMonthlyTrends();
      }
    }, 500);
  
    return () => clearTimeout(timer);
  }, [accessToken]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await ky.get("/api/dashboard/stats", {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).json();
      
      if (response.success) {
        setDashboardStats(response.data);
      } else {
        toast.error("Failed to load dashboard statistics");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationBreakdown = async () => {
    try {
      const response = await ky.get("/api/dashboard/location-breakdown", {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).json();
      
      if (response.success) {
        setLocationData(response.data);
      }
    } catch (error) {
      console.error("Error fetching location breakdown:", error);
    }
  };

  const fetchMonthlyTrends = async () => {
    try {
      const response = await ky.get("/api/dashboard/monthly-trends", {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).json();
      
      if (response.success) {
        setMonthlyTrendsData(response.data);
      }
    } catch (error) {
      console.error("Error fetching monthly trends:", error);
    }
  };

  const fetchNewsletterSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const response = await ky.get("/api/dashboard/newsletter-subscribers", {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).json();
      
      if (response.success) {
        setNewsletterSubscribers(response.data);
      }
    } catch (error) {
      console.error("Error fetching newsletter subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // Handler for card clicks with navigation
  const handleCardClick = (cardType) => {
    switch(cardType) {
      case "Active Destinations":
        navigate('/manage-location');
        break;
      case "New Business Submissions":
        navigate('/business-management');
        break;
      case "Newsletter Subscribers":
        setShowNewsletterModal(true);
        fetchNewsletterSubscribers();
        break;
      case "Total Inquiries":
        navigate('/view-inquiry');
        break;
      default:
        console.log(`${cardType} clicked`);
    }
  };

  // Initialize D3 charts after data is loaded
  useEffect(() => {
    if (locationData && businessParticipationChartRef.current) {
      createLocationBreakdownChart();
    }
  }, [locationData]);

  useEffect(() => {
    if (monthlyTrendsData && userEngagementChartRef.current) {
      createMonthlyTrendsChart();
    }
  }, [monthlyTrendsData]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (locationData && businessParticipationChartRef.current) {
        createLocationBreakdownChart();
      }
      if (monthlyTrendsData && userEngagementChartRef.current) {
        createMonthlyTrendsChart();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [locationData, monthlyTrendsData]);

  // Location Breakdown Chart (Donut Chart)
  const createLocationBreakdownChart = () => {
    const container = d3.select(businessParticipationChartRef.current);
    container.selectAll("*").remove();

    const containerWidth = businessParticipationChartRef.current.clientWidth;
    const containerHeight = isMobile ? 280 : 340;

    const chartWrapper = container
      .append("div")
      .attr("class", "chart-wrapper")
      .style("position", "relative")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex");

    const donutSection = chartWrapper
      .append("div")
      .attr("class", "donut-section")
      .style("width", "60%")
      .style("height", "100%")
      .style("position", "relative");

    const indicatorsSection = chartWrapper
      .append("div")
      .attr("class", "indicators-section")
      .style("width", "40%")
      .style("height", "100%")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("justify-content", "center")
      .style("padding-left", "20px");

    const chartSize = Math.min(
      donutSection.node().clientWidth * 0.8,
      containerHeight * 0.8
    );
    const radius = chartSize / 2;

    const svg = donutSection
      .append("svg")
      .attr("width", donutSection.node().clientWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr(
        "transform",
        `translate(${donutSection.node().clientWidth / 2},${containerHeight / 2})`
      );

    // Use real data
    const data = [
      {
        name: "Active",
        value: locationData.byStatus.activePercentage,
        color: "#818cf8",
      },
      {
        name: "Inactive",
        value: locationData.byStatus.inactivePercentage,
        color: "#e4e4e7",
      },
    ];

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

    const pie = d3
      .pie()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.03);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const transitionDuration = 1000;

    const arcs = svg
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr(
        "d",
        d3
          .arc()
          .innerRadius(radius * 0.6)
          .outerRadius(radius * 0.6)
      )
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0.8)
      .transition()
      .duration(transitionDuration)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          { startAngle: d.startAngle, endAngle: d.endAngle }
        );
        return function (t) {
          return arc(interpolate(t));
        };
      });

    arcs
      .selectAll("path")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr(
            "d",
            d3
              .arc()
              .innerRadius(radius * 0.58)
              .outerRadius(radius * 1.05)
          )
          .style("opacity", 1);
      
        tooltip.transition().duration(200).style("opacity", 0.9);
        
        const tooltipNode = tooltip.node();
        tooltip
          .html(
            `<div style="font-weight: bold; margin-bottom: 5px;">${d.data.name} Locations</div>
             <div>${d.data.value}% of total</div>`
          );
        
        // Get tooltip dimensions
        const tooltipWidth = tooltipNode.offsetWidth;
        const tooltipHeight = tooltipNode.offsetHeight;
        
        // Calculate position to keep tooltip on screen
        let left = event.pageX + 10;
        let top = event.pageY - 40;
        
        // Check if tooltip goes off right edge
        if (left + tooltipWidth > window.innerWidth) {
          left = event.pageX - tooltipWidth - 10;
        }
        
        // Check if tooltip goes off bottom edge
        if (top + tooltipHeight > window.innerHeight) {
          top = event.pageY - tooltipHeight - 10;
        }
        
        // Check if tooltip goes off top edge
        if (top < 0) {
          top = event.pageY + 10;
        }
        
        tooltip
          .style("left", `${left}px`)
          .style("top", `${top}px`);
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(500)
          .attr("d", arc)
          .style("opacity", 0.8);
        tooltip.transition().duration(500).style("opacity", 0);
      });

    const centerText = svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "32px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .attr("opacity", 0)
      .text("0%");

    centerText
      .transition()
      .duration(transitionDuration)
      .tween("text", function () {
        const i = d3.interpolate(0, locationData.byStatus.activePercentage);
        return function (t) {
          this.textContent = `${Math.round(i(t) * 10) / 10}%`;
        };
      })
      .attr("opacity", 1);

    svg
      .append("text")
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

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 50)
      .attr("font-size", "14px")
      .attr("fill", "#6b7280")
      .attr("opacity", 0)
      .text("Locations")
      .transition()
      .duration(transitionDuration)
      .delay(400)
      .attr("opacity", 1);

    // Indicators
    const createIndicator = (data, index) => {
      const indicator = indicatorsSection
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "12px")
        .style("margin-bottom", "20px")
        .style("opacity", "0")
        .style("transform", "translateY(20px)");

      indicator
        .transition()
        .duration(800)
        .delay(transitionDuration + index * 200)
        .style("opacity", "1")
        .style("transform", "translateY(0)");

      const circle = indicator
        .append("div")
        .style("width", isMobile ? "35px" : "40px")
        .style("height", isMobile ? "35px" : "40px")
        .style("border-radius", "50%")
        .style("background-color", `${data.color}20`)
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("flex-shrink", "0")
        .style("box-shadow", "0 2px 8px rgba(0, 0, 0, 0.1)");

      circle
        .append("span")
        .style("color", data.color)
        .style("font-size", "20px")
        .html("📍");

      const textContent = indicator
        .append("div")
        .style("display", "flex")
        .style("flex-direction", "column");

      textContent
        .append("div")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("color", "#1e293b")
        .text(data.value);

      textContent
        .append("div")
        .style("font-size", "12px")
        .style("color", "#6b7280")
        .text(data.label);
    };

    const statsData = [
      {
        label: "Total Active Locations",
        value: `${locationData.byStatus.activeCount}`,
        color: "#818cf8",
      },
      {
        label: "Total Locations",
        value: `${locationData.totalLocations}`,
        color: "#a3e635",
      },
    ];

    statsData.forEach((stat, i) => {
      createIndicator(stat, i);
    });

    // Legend
    const legendContainer = container
      .append("div")
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
      .style("opacity", "0")
      .style("transform", "translateY(20px)");

    legendContainer
      .transition()
      .duration(800)
      .delay(transitionDuration + 600)
      .style("opacity", "1")
      .style("transform", "translateY(0)");

    const legendItems = [
      { label: "Locations not currently marked as active", color: "#e4e4e7" },
      { label: "Active locations visible on the map", color: "#818cf8" },
    ];

    legendItems.forEach((item) => {
      const legendItem = legendContainer
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "8px")
        .style("max-width", "45%");

      legendItem
        .append("div")
        .style("width", "10px")
        .style("height", "10px")
        .style("border-radius", "50%")
        .style("background-color", item.color)
        .style("flex-shrink", "0");

      legendItem
        .append("div")
        .style("font-size", "11px")
        .style("color", "#6b7280")
        .text(item.label);
    });
  };

  // Monthly Trends Bar Chart
  const createMonthlyTrendsChart = () => {
    const container = d3.select(userEngagementChartRef.current);
    container.selectAll("*").remove();

    const containerWidth = userEngagementChartRef.current.clientWidth;
    const containerHeight = isMobile ? 300 : 340;

    const chartWrapper = container
      .append("div")
      .attr("class", "chart-wrapper")
      .style("position", "relative")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex");

    const chartSection = chartWrapper
      .append("div")
      .attr("class", "chart-section")
      .style("width", "70%")
      .style("height", "100%")
      .style("position", "relative");

    const indicatorsSection = chartWrapper
      .append("div")
      .attr("class", "indicators-section")
      .style("width", "30%")
      .style("height", "100%")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("justify-content", "center")
      .style("padding-left", "20px");

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

    const margin = { top: 50, right: 20, bottom: 40, left: 50 };
    const width = chartSection.node().clientWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    const transitionDuration = 1000;

    const svg = chartSection
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(monthlyTrendsData.months)
      .range([0, width])
      .padding(0.2);

    const maxStackedValue = monthlyTrendsData.months.map((month, i) => {
      return monthlyTrendsData.series.reduce(
        (sum, series) => sum + series.values[i],
        0
      );
    });

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(maxStackedValue) * 1.1])
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x-axis")
      .style("font-size", "12px")
      .style("color", "#6b7280")
      .call(d3.axisBottom(x))
      .attr("opacity", 0)
      .transition()
      .duration(transitionDuration)
      .attr("opacity", 1);

    svg
      .append("g")
      .attr("class", "y-axis")
      .style("font-size", "12px")
      .style("color", "#6b7280")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => {
            if (d >= 1000) {
              return `${d / 1000}k`;
            }
            return d;
          })
      )
      .attr("opacity", 0)
      .transition()
      .duration(transitionDuration)
      .attr("opacity", 1);

    svg
      .append("g")
      .attr("class", "grid")
      .attr("opacity", 0)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat("").ticks(5))
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-opacity", "0.5")
      .style("stroke-dasharray", "5,5");

    svg
      .select(".grid")
      .transition()
      .duration(transitionDuration)
      .attr("opacity", 0.5);

    const chartTitle = svg
      .append("g")
      .attr("class", "chart-title")
      .attr("transform", `translate(${width / 2}, -30)`)
      .style("text-anchor", "middle");

    chartTitle
      .append("text")
      .attr("class", "total-users-text")
      .attr("y", 0)
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .attr("opacity", 0)
      .text(`${monthlyTrendsData.totalEvents}`)
      .transition()
      .duration(transitionDuration)
      .attr("opacity", 1);

    chartTitle
      .append("text")
      .attr("class", "total-users-label")
      .attr("y", 20)
      .attr("font-size", "14px")
      .attr("fill", "#6b7280")
      .attr("opacity", 0)
      .text("Total Events")
      .transition()
      .duration(transitionDuration)
      .delay(200)
      .attr("opacity", 1);

    const stackedData = [];

    monthlyTrendsData.months.forEach((month, i) => {
      let y0 = 0;
      const monthData = { month };

      monthlyTrendsData.series.forEach((series) => {
        const value = series.values[i];
        monthData[series.name] = value;
        monthData[`${series.name}_y0`] = y0;
        monthData[`${series.name}_y1`] = y0 + value;
        y0 += value;
      });

      stackedData.push(monthData);
    });

    monthlyTrendsData.series.forEach((series) => {
      svg
        .selectAll(`.bar-${series.name.replace(/\s+/g, "-").toLowerCase()}`)
        .data(stackedData)
        .enter()
        .append("rect")
        .attr("class", `bar-${series.name.replace(/\s+/g, "-").toLowerCase()}`)
        .attr("x", (d) => x(d.month))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("fill", series.color)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
          d3.select(this).transition().duration(200).attr("opacity", 0.8);
          tooltip.transition().duration(200).style("opacity", 0.9);
          
          const tooltipNode = tooltip.node();
          tooltip
            .html(
              `<div style="font-weight: bold; margin-bottom: 5px;">${d.month}</div>
               <div style="display: flex; align-items: center; margin-bottom: 5px;">
                 <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${series.color}; margin-right: 8px;"></div>
                 <div>${series.name}: <b>${d[series.name].toLocaleString()}</b></div>
               </div>`
            );
          
          // Get tooltip dimensions
          const tooltipWidth = tooltipNode.offsetWidth;
          const tooltipHeight = tooltipNode.offsetHeight;
          
          // Calculate position to keep tooltip on screen
          let left = event.pageX + 10;
          let top = event.pageY - 40;
          
          // Check if tooltip goes off right edge
          if (left + tooltipWidth > window.innerWidth) {
            left = event.pageX - tooltipWidth - 10;
          }
          
          // Check if tooltip goes off bottom edge
          if (top + tooltipHeight > window.innerHeight) {
            top = event.pageY - tooltipHeight - 10;
          }
          
          // Check if tooltip goes off top edge
          if (top < 0) {
            top = event.pageY + 10;
          }
          
          tooltip
            .style("left", `${left}px`)
            .style("top", `${top}px`);
        })
        .on("mouseout", function () {
          d3.select(this).transition().duration(500).attr("opacity", 1);
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .transition()
        .duration(transitionDuration)
        .delay((d, i) => i * 100)
        .attr("y", (d) => y(d[`${series.name}_y1`]))
        .attr("height", (d) => y(d[`${series.name}_y0`]) - y(d[`${series.name}_y1`]));
    });

    const legendContainer = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 320}, -90)`)
      .style("opacity", 0);

    monthlyTrendsData.series.forEach((series, i) => {
      const legend = legendContainer
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legend
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", series.color);

      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 10)
        .style("font-size", "11px")
        .style("fill", "#6b7280")
        .text(series.name);
    });

    legendContainer
      .transition()
      .duration(800)
      .delay(transitionDuration)
      .style("opacity", 1);

    const createStatIndicator = (data, index) => {
      const indicator = indicatorsSection
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "12px")
        .style("margin-bottom", "20px")
        .style("opacity", "0")
        .style("transform", "translateY(20px)");

      indicator
        .transition()
        .duration(800)
        .delay(transitionDuration + index * 200)
        .style("opacity", "1")
        .style("transform", "translateY(0)");

      const circle = indicator
        .append("div")
        .style("width", isMobile ? "35px" : "40px")
        .style("height", isMobile ? "35px" : "40px")
        .style("border-radius", "50%")
        .style("background-color", `${data.color}20`)
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("flex-shrink", "0")
        .style("box-shadow", "0 2px 8px rgba(0, 0, 0, 0.1)");

      circle
        .append("span")
        .style("color", data.color)
        .style("font-size", data.icon === "↗" ? "20px" : "18px")
        .html(data.icon);

      const textContent = indicator
        .append("div")
        .style("display", "flex")
        .style("flex-direction", "column");

      textContent
        .append("div")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("color", "#1e293b")
        .text(data.value);

      textContent
        .append("div")
        .style("font-size", "12px")
        .style("color", "#6b7280")
        .text(data.label);
    };

    const statsData = [
      {
        label: "Monthly Growth",
        value: `${monthlyTrendsData.growthRate >= 0 ? '+' : ''}${monthlyTrendsData.growthRate}%`,
        color: "#818cf8",
        icon: "↗",
      },
      {
        label: "Total Events",
        value: monthlyTrendsData.totalEvents,
        color: "#10b981",
        icon: "📅",
      },
      {
        label: "Total Users",
        value: monthlyTrendsData.totalUsers,
        color: "#f59e0b",
        icon: "👤",
      },
    ];

    statsData.forEach((stat, i) => {
      createStatIndicator(stat, i);
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
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
            Loading dashboard statistics...
          </div>
        ) : (
          <div className="stat-cards-container">
            <div
              className="stat-card"
              onClick={() => handleCardClick("Active Destinations")}
              aria-label="View Active Destinations"
              role="button"
              tabIndex="0"
              onKeyDown={(e) =>
                e.key === "Enter" && handleCardClick("Active Destinations")
              }
            >
              <div className="stat-icon-wrapper">
                <FaMapMarkerAlt className="stat-icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Active Destinations</p>
                <h2 className="stat-value">{dashboardStats.activeDestinations}</h2>
              </div>
            </div>

            <div
              className="stat-card"
              onClick={() => handleCardClick("Newsletter Subscribers")}
              aria-label="View Newsletter Subscribers"
              role="button"
              tabIndex="0"
              onKeyDown={(e) =>
                e.key === "Enter" && handleCardClick("Newsletter Subscribers")
              }
            >
              <div className="stat-icon-wrapper">
                <FaChartLine className="stat-icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Newsletter Subscribers</p>
                <h2 className="stat-value">{dashboardStats.newsletterSubscribers}</h2>
              </div>
            </div>

            <div
              className="stat-card"
              onClick={() => handleCardClick("New Business Submissions")}
              aria-label="View New Business Submissions"
              role="button"
              tabIndex="0"
              onKeyDown={(e) =>
                e.key === "Enter" && handleCardClick("New Business Submissions")
              }
            >
              <div className="stat-icon-wrapper">
                <FaChartLine className="stat-icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">New Business Submissions</p>
                <h2 className="stat-value">{dashboardStats.newBusinessSubmissions}</h2>
              </div>
            </div>

            <div
              className="stat-card"
              onClick={() => handleCardClick("Total Inquiries")}
              aria-label="View Total Inquiries"
              role="button"
              tabIndex="0"
              onKeyDown={(e) =>
                e.key === "Enter" && handleCardClick("Total Inquiries")
              }
            >
              <div className="stat-icon-wrapper">
                <FaFileAlt className="stat-icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Inquiries</p>
                <h2 className="stat-value">{dashboardStats.totalInquiries}</h2>
              </div>
            </div>
          </div>
        )}

        {/* Data Visualisation Section */}
        <div className="dashboard-visualizations">
          <div className="visualization-card">
            <div className="viz-header">
              <h3>Location Status Breakdown</h3>
              <p>Distribution of active and inactive locations</p>
            </div>
            <div
              className="viz-content"
              ref={businessParticipationChartRef}
            ></div>
          </div>

          <div className="visualization-card">
            <div className="viz-header">
              <h3>Monthly Activity Trends</h3>
              <p>Events, inquiries, locations, and subscribers over time</p>
            </div>
            <div className="viz-content" ref={userEngagementChartRef}></div>
          </div>
        </div>
      </div>

      {/* Newsletter Subscribers Modal */}
      {showNewsletterModal && (
        <div className="modal-overlay-dh" onClick={() => setShowNewsletterModal(false)}>
          <div className="modal-content-dh" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-dh">
              <h2>Newsletter Subscribers</h2>
              <button className="modal-close-dh" onClick={() => setShowNewsletterModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body-dh">
              {loadingSubscribers ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  Loading subscribers...
                </div>
              ) : newsletterSubscribers.length > 0 ? (
                <div className="subscribers-list">
                  <div className="subscribers-header">
                    <span>Total Subscribers: {newsletterSubscribers.length}</span>
                  </div>
                  <table className="subscribers-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Email</th>
                        <th>Subscribed Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newsletterSubscribers.map((subscriber, index) => (
                        <tr key={subscriber._id}>
                          <td>{index + 1}</td>
                          <td>{subscriber.email}</td>
                          <td>{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No subscribers yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Modal Styles */
        .modal-overlay-dh {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content-dh {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header-dh {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header-dh h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1f2937;
        }

        .modal-close-dh {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modal-close-dh:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .modal-body-dh {
          padding: 20px 30px;
          overflow-y: auto;
          flex: 1;
        }

        .subscribers-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .subscribers-header {
          font-weight: 600;
          color: #374151;
          padding: 10px 0;
          border-bottom: 2px solid #e5e7eb;
        }

        .subscribers-table {
          width: 100%;
          border-collapse: collapse;
        }

        .subscribers-table thead {
          background: #f9fafb;
        }

        .subscribers-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .subscribers-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .subscribers-table tbody tr:hover {
          background: #f9fafb;
        }

        .subscribers-table th:first-child,
        .subscribers-table td:first-child {
          width: 60px;
          text-align: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .modal-content-dh {
            width: 95%;
            max-height: 90vh;
          }

          .modal-header-dh {
            padding: 15px 20px;
          }

          .modal-body-dh {
            padding: 15px 20px;
          }

          .subscribers-table th,
          .subscribers-table td {
            padding: 8px;
            font-size: 0.9rem;
          }
        }

        /* Cursor pointer for clickable cards */
        .stat-card {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
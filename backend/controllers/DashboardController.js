import { contactUsModel } from "../models/ContactUsModel.js";
import Newsletter from "../models/Newsletter.js";
import { locationModel } from "../models/LocationModel.js";
import { eventModel } from "../models/EventModel.js";
import { userModel } from "../models/UserModel.js";
import { businessModel } from "../models/BusinessModel.js";

// Get basic dashboard stats (existing)
export const getDashboardStats = async (req, res) => {
  try {
    // Get date for start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Count new business submissions this month
    const newBusinessSubmissions = await businessModel.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // 2. Count total inquiries
    const totalInquiries = await contactUsModel.countDocuments();

    // 3. Count newsletter subscribers
    const newsletterSubscribers = await Newsletter.countDocuments({
      isActive: true,
    });

    // 4. Count active destinations/locations
    const activeDestinations = await locationModel.countDocuments({
      $or: [
        { status: "Active" },
        { status: { $exists: false } },
        { status: null },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        newBusinessSubmissions,
        totalInquiries,
        newsletterSubscribers,
        activeDestinations,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching dashboard stats",
    });
  }
};

// Get location type breakdown for donut chart
export const getLocationBreakdown = async (req, res) => {
  try {
    // Get all locations grouped by type
    const locationsByType = await locationModel.aggregate([
      {
        $match: { status: "Active" },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get active vs inactive breakdown
    // Treat missing status as Active (default behavior)
    const activeCount = await locationModel.countDocuments({
      $or: [
        { status: "Active" },
        { status: { $exists: false } },
        { status: null },
      ],
    });
    const inactiveCount = await locationModel.countDocuments({
      status: { $exists: true, $ne: "Active", $ne: null },
    });

    // Calculate percentages
    const total = activeCount + inactiveCount;
    const activePercentage =
      total > 0 ? ((activeCount / total) * 100).toFixed(1) : 0;
    const inactivePercentage =
      total > 0 ? ((inactiveCount / total) * 100).toFixed(1) : 0;

    // Format data for frontend
    const typeBreakdown = locationsByType.map((item) => ({
      name: item._id || "Unknown",
      value: item.count,
    }));

    return res.status(200).json({
      success: true,
      message: "Location breakdown fetched successfully",
      data: {
        byType: typeBreakdown,
        byStatus: {
          activeCount,
          inactiveCount,
          activePercentage: parseFloat(activePercentage),
          inactivePercentage: parseFloat(inactivePercentage),
        },
        totalLocations: total,
      },
    });
  } catch (error) {
    console.error("Error fetching location breakdown:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching location breakdown",
    });
  }
};

// Get monthly trends data for bar chart
export const getMonthlyTrends = async (req, res) => {
  try {
    // Get date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get monthly events
    const monthlyEvents = await eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get monthly inquiries
    const monthlyInquiries = await contactUsModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get monthly locations
    const monthlyLocations = await locationModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get monthly newsletter subscribers
    const monthlySubscribers = await Newsletter.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Create array of last 6 months
    const months = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        name: monthNames[date.getMonth()],
      });
    }

    // Helper function to get count for a specific month
    const getCountForMonth = (data, year, month) => {
      const found = data.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return found ? found.count : 0;
    };

    // Format data for frontend
    const formattedData = {
      months: months.map((m) => m.name),
      series: [
        {
          name: "Events Created",
          values: months.map((m) =>
            getCountForMonth(monthlyEvents, m.year, m.month)
          ),
          color: "#10b981", // Green
        },
        {
          name: "Inquiries",
          values: months.map((m) =>
            getCountForMonth(monthlyInquiries, m.year, m.month)
          ),
          color: "#3b82f6", // Blue
        },
        {
          name: "Locations Added",
          values: months.map((m) =>
            getCountForMonth(monthlyLocations, m.year, m.month)
          ),
          color: "#8b5cf6", // Purple
        },
        {
          name: "New Subscribers",
          values: months.map((m) =>
            getCountForMonth(monthlySubscribers, m.year, m.month)
          ),
          color: "#f59e0b", // Orange
        },
      ],
    };

    // Calculate total counts
    const totalEvents = await eventModel.countDocuments();
    const totalUsers = await userModel.countDocuments();

    // Calculate growth rate (comparing last month to previous month)
    const lastMonthTotal = formattedData.series.reduce(
      (sum, series) => sum + series.values[series.values.length - 1],
      0
    );
    const previousMonthTotal = formattedData.series.reduce(
      (sum, series) => sum + series.values[series.values.length - 2],
      0
    );

    const growthRate =
      previousMonthTotal > 0
        ? (
            ((lastMonthTotal - previousMonthTotal) / previousMonthTotal) *
            100
          ).toFixed(1)
        : 0;

    return res.status(200).json({
      success: true,
      message: "Monthly trends fetched successfully",
      data: {
        ...formattedData,
        totalEvents,
        totalUsers,
        growthRate: parseFloat(growthRate),
      },
    });
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching monthly trends",
    });
  }
};

// Get recent inquiries for dashboard (last 5)
export const getRecentInquiries = async (req, res) => {
  try {
    const recentInquiries = await contactUsModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email category topic status createdAt");

    return res.status(200).json({
      success: true,
      message: "Recent inquiries fetched successfully",
      data: recentInquiries,
    });
  } catch (error) {
    console.error("Error fetching recent inquiries:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching recent inquiries",
    });
  }
};

// Get all newsletter subscribers (for modal display)
export const getNewsletterSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select("email subscribedAt createdAt");

    return res.status(200).json({
      success: true,
      message: "Newsletter subscribers fetched successfully",
      data: subscribers,
      count: subscribers.length,
    });
  } catch (error) {
    console.error("Error fetching newsletter subscribers:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching newsletter subscribers",
    });
  }
};

// In DashboardController.js - IMPROVED VERSION
export const getUserRegistrations = async (req, res) => {
  try {
    console.log("✅ getUserRegistrations endpoint hit");
    const { period = "weekly" } = req.query;

    if (period === "weekly") {
      // Get last 7 days of user registrations
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyData = await userModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfWeek: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.day": 1 },
        },
      ]);

      // Map day numbers to names and ensure all days are present
      const dayMap = {
        1: "Sun",
        2: "Mon",
        3: "Tue",
        4: "Wed",
        5: "Thu",
        6: "Fri",
        7: "Sat",
      };

      const completeData = [1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
        const found = weeklyData.find((item) => item._id.day === dayNum);
        return {
          day: dayMap[dayNum],
          count: found ? found.count : 0,
        };
      });

      return res.status(200).json({
        success: true,
        message: "Weekly user data fetched successfully",
        data: completeData,
      });
    } else {
      // Monthly data - last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = await userModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ]);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Create array of last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          month: monthNames[date.getMonth()],
          count: 0, // Initialize with 0
        });
      }

      // Fill in actual data
      monthlyData.forEach((item) => {
        const monthName = monthNames[item._id.month - 1];
        const foundMonth = months.find((m) => m.month === monthName);
        if (foundMonth) {
          foundMonth.count = item.count;
        }
      });

      return res.status(200).json({
        success: true,
        message: "Monthly user data fetched successfully",
        data: months,
      });
    }
  } catch (error) {
    console.error("❌ Error in getUserRegistrations:", error);
    return res.status(500).json({
      success: false,
      message: "Backend error",
      error: error.message,
    });
  }
};

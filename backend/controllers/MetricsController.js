// MetricsController.js
import { PageViewCounter } from "../models/PageViewCounter.js";
import crypto from "crypto";
import { UniqueVisitor } from "../models/UniqueVisitor.js";

export const recordUniqueVisitor = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = "visitor_id";
    let visitorId = req.cookies?.[cookieName];

    // If missing, mint a new ID and set a long-lived, privacy-safe cookie
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      res.cookie(cookieName, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        path: "/",
      });
    }

    // First-time vs returning logic
    const existing = await UniqueVisitor.findOne({ visitorId });
    let firstVisit = false;

    if (!existing) {
      const rawIp = (req.headers["x-forwarded-for"] || req.ip || "")
        .toString()
        .split(",")[0]
        .trim();
      const userAgent = req.get("user-agent") || "";
      const ipHash = rawIp
        ? crypto.createHash("sha256").update(rawIp).digest("hex")
        : "";
      const userId = req.user || null; // set by attachUserIfPresent when available

      await UniqueVisitor.create({ visitorId, userId, userAgent, ipHash });

      const doc = await PageViewCounter.findOneAndUpdate(
        { key: "unique_visitors" },
        { $inc: { totalCount: 1 } },
        { new: true, upsert: true }
      );

      firstVisit = true;
      return res.status(200).json({
        success: true,
        firstVisit,
        visitorId,
        totalUniqueVisitors: doc.totalCount,
      });
    }

    const pv = await PageViewCounter.findOne({ key: "unique_visitors" });
    return res.status(200).json({
      success: true,
      firstVisit,
      visitorId,
      totalUniqueVisitors: pv?.totalCount || 0,
    });
  } catch (error) {
    console.error("recordUniqueVisitor error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to record unique visitor" });
  }
};

// MetricsController.js - ADD THESE FUNCTIONS AT THE BOTTOM

export const getPageViewsTimeline = async (req, res) => {
  try {
    const { timeframe = "monthly" } = req.query;

    const endDate = new Date();
    const startDate = new Date();

    // Set start date based on timeframe
    if (timeframe === "daily") {
      startDate.setDate(endDate.getDate() - 30); // Last 30 days
    } else if (timeframe === "weekly") {
      startDate.setDate(endDate.getDate() - 52 * 7); // Last 52 weeks
    } else {
      startDate.setMonth(endDate.getMonth() - 12); // Last 12 months
    }

    let aggregationPipeline = [];

    if (timeframe === "daily") {
      aggregationPipeline = [
        {
          $match: {
            firstSeen: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$firstSeen" },
            },
            views: { $sum: 1 },
            date: { $first: "$firstSeen" },
          },
        },
        {
          $project: {
            period: {
              $dateToString: { format: "%b %d", date: "$date" },
            },
            tooltipDate: {
              $dateToString: { format: "%B %d, %Y", date: "$date" },
            },
            views: 1,
            date: 1,
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ];
    } else if (timeframe === "weekly") {
      aggregationPipeline = [
        {
          $match: {
            firstSeen: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$firstSeen" },
              week: { $week: "$firstSeen" },
            },
            views: { $sum: 1 },
            startDate: { $min: "$firstSeen" },
            endDate: { $max: "$firstSeen" },
          },
        },
        {
          $project: {
            period: { $concat: ["Week ", { $toString: "$_id.week" }] },
            weekNumber: "$_id.week",
            views: 1,
            tooltipDate: {
              $concat: [
                { $dateToString: { format: "%b %d", date: "$startDate" } },
                " - ",
                { $dateToString: { format: "%b %d", date: "$endDate" } },
                " (Week ",
                { $toString: "$_id.week" },
                ")",
              ],
            },
            startDate: 1,
            _id: 0,
          },
        },
        { $sort: { startDate: 1 } },
      ];
    } else {
      // monthly
      aggregationPipeline = [
        {
          $match: {
            firstSeen: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$firstSeen" },
              month: { $month: "$firstSeen" },
            },
            views: { $sum: 1 },
            monthDate: { $first: "$firstSeen" },
          },
        },
        {
          $project: {
            period: {
              $let: {
                vars: {
                  months: [
                    "",
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
                  ],
                },
                in: {
                  $arrayElemAt: ["$$months", "$_id.month"],
                },
              },
            },
            views: 1,
            tooltipDate: {
              $dateToString: { format: "%B %Y", date: "$monthDate" },
            },
            monthDate: 1,
            _id: 0,
          },
        },
        { $sort: { monthDate: 1 } },
      ];
    }

    const timelineData = await UniqueVisitor.aggregate(aggregationPipeline);

    res.json({
      success: true,
      data: timelineData,
      timeframe,
      total: timelineData.reduce((sum, item) => sum + item.views, 0),
    });
  } catch (error) {
    console.error("Error fetching page views timeline:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch page views timeline",
    });
  }
};

// Add admin metrics stats function
export const getAdminMetrics = async (req, res) => {
  try {
    // Get total unique visitors
    const totalUniqueVisitors = await UniqueVisitor.countDocuments();

    // Get today's unique visitors
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueVisitorsToday = await UniqueVisitor.countDocuments({
      createdAt: { $gte: today },
    });

    // Get total page views from PageViewCounter
    const pageViewDoc = await PageViewCounter.findOne({
      key: "unique_visitors",
    });
    const totalPageViews = pageViewDoc?.totalCount || 0;

    res.json({
      success: true,
      data: {
        totalUniqueVisitors,
        uniqueVisitorsToday,
        totalPageViews,
        // Add any other metrics you need
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin metrics",
    });
  }
};

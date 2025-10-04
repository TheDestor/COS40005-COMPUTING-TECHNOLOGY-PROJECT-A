import { contactUsModel } from "../models/ContactUsModel.js";
import Newsletter from "../models/Newsletter.js";
import { locationModel } from "../models/LocationModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Count new/unread inquiries
    const newInquiries = await contactUsModel.countDocuments({ 
      status: 'Unread' 
    });

    // 2. Count total inquiries
    const totalInquiries = await contactUsModel.countDocuments();

    // 3. Count newsletter subscribers
    const newsletterSubscribers = await Newsletter.countDocuments({ 
      isActive: true 
    });

    // 4. Count active destinations/locations
    const activeDestinations = await locationModel.countDocuments({ 
      status: 'Active' 
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        newInquiries,
        totalInquiries,
        newsletterSubscribers,
        activeDestinations
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching dashboard stats"
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
      .select('name email category topic status createdAt');

    return res.status(200).json({
      success: true,
      message: "Recent inquiries fetched successfully",
      data: recentInquiries
    });

  } catch (error) {
    console.error("Error fetching recent inquiries:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching recent inquiries"
    });
  }
};
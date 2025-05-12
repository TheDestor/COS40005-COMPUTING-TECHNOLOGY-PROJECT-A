import { contactUsModel } from "../models/ContactUsModel.js";

// @desc Get all inquiries from the database
// @route /getAllInquiries
// @access private
export const getAllInquiries = async (req, res) => {
    try {
        const inquiries = await contactUsModel.find();

        if (inquiries) {
            return res.status(200).json({ message: "Inquiries fetched successfully", success: true, inquiries });
            
        } else {
            return res.status(401).json({ message: "Failed to fetch inquiries", success: false })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An internal server error has occured while trying to fetch all inquiries", success: false });
    }
}

export const updateInquiry = async (req, res) => {
    try {
        const { inquiryId, action } = req.body;
        const inquiry = await contactUsModel.findById(inquiryId);
        
        if (action === "Resolve") {
            inquiry.status = "Resolved"
            await inquiry.save();

            return res.status(200).json({ message: "Successfully marked inquiry as resolved", success: true });
        } else if (action === "Delete") {
            return res.status(200).json({ message: "Test" });
        } else {
            return res.status(404).json({ message: "Test" });
        }
        
    }
    catch (error) {
        console.error("Error updating inquiry:", error);
        return res.status(500).json({ message: "An error occured while updating inquiry", success: false });
    }
}
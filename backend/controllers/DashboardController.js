import { contactUsModel } from "../models/ContactUsModel.js";

// @desc Get all inquiries from the database
// @route /getAllInquiries
// @access private
export const getAllInquiries = async (req, res) => {
    try {
        const inquiries = await contactUsModel.find();

        if (!inquiries) {
            return res.status(401).json({ message: "Failed to fetch inquiries", success: false })
        } else {
            return res.status(200).json({ message: "Inquiries fetched successfully", success: true, inquiries });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An internal server error has occured while trying to fetch all inquiries", success: false });
    }
}
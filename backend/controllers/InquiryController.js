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
        
        if (!inquiryId || !action) {
            return res.status(400).json({ 
                message: "Missing required fields: inquiryId and action", 
                success: false 
            });
        }
        
        if (action === "Resolve") {
            // Use findByIdAndUpdate to bypass validation on other fields
            const inquiry = await contactUsModel.findByIdAndUpdate(
                inquiryId,
                { status: "Resolved" },
                { new: true, runValidators: false } // Don't run validators on unchanged fields
            );

            if (!inquiry) {
                return res.status(404).json({ 
                    message: "Inquiry not found", 
                    success: false 
                });
            }

            return res.status(200).json({ 
                message: "Successfully marked inquiry as resolved", 
                success: true 
            });
        } else if (action === "Delete") {
            const inquiry = await contactUsModel.findByIdAndDelete(inquiryId);
            
            if (!inquiry) {
                return res.status(404).json({ 
                    message: "Inquiry not found", 
                    success: false 
                });
            }
            
            return res.status(200).json({ 
                message: "Inquiry deleted successfully", 
                success: true 
            });
        } else {
            return res.status(400).json({ 
                message: "Invalid action. Must be 'Resolve' or 'Delete'", 
                success: false 
            });
        }
        
    } catch (error) {
        console.error("Error updating inquiry:", error);
        console.error("Inquiry ID:", req.body.inquiryId);
        console.error("Error details:", error.message);
        
        return res.status(500).json({ 
            message: "An error occurred while updating inquiry", 
            success: false 
        });
    }
}

export const deleteInquiry = async (req, res) => {
    try {
        const { inquiryId } = req.body;
        await contactUsModel.findByIdAndDelete(inquiryId);

        return res.status(200).json({ message: "Inquiry deleted successfully", success: true });
    } catch (error) {
        console.error("An error occured while trying to delete this inquiry");
        return res.status(500).json({ message: "An error occured while trying to delete this inquiry", success: true });
    }
}
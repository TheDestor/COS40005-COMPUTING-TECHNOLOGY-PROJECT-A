import { businessModel } from '../models/BusinessModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure upload directory
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to save uploaded file
const saveFile = (file) => {
    if (!file) return null;
    
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.mimetype.split('/')[1];
    const filename = `${file.fieldname}-${uniqueSuffix}.${extension}`;
    
    // Save file to uploads directory
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);
    
    // Return relative path for storage in database
    return `/uploads/${filename}`;
};

// Add a new business
export const addBusiness = async (req, res) => {
    try {
        const businessData = req.body;
        
        // Validate required fields
        if (!businessData.name || !businessData.owner || !businessData.description) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }
        
        // Check if business already exists with the same name and owner
        const existingBusiness = await businessModel.findOne({
            name: businessData.name,
            owner: businessData.owner
        });
        
        if (existingBusiness) {
            return res.status(409).json({
                success: false,
                message: "A business with this name and owner already exists"
            });
        }
        
        // Handle file uploads
        if (!req.files || !req.files.businessImage || !req.files.ownerAvatar) {
            return res.status(400).json({
                success: false,
                message: "Business image and owner avatar are required"
            });
        }
        
        // Save files and get paths
        const businessImagePath = saveFile(req.files.businessImage[0]);
        const ownerAvatarPath = saveFile(req.files.ownerAvatar[0]);
        
        // Create new business with file paths
        const newBusiness = new businessModel({
            ...businessData,
            businessImage: businessImagePath,
            ownerAvatar: ownerAvatarPath,
            agreement: businessData.agreement === 'true' || businessData.agreement === true
        });
        
        await newBusiness.save();
        
        res.status(201).json({
            success: true,
            message: "Business added successfully and pending approval",
            data: newBusiness
        });
    } catch (error) {
        console.error("Error adding business:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add business",
            error: error.message
        });
    }
};

// Get all businesses (with optional filtering)
export const getAllBusinesses = async (req, res) => {
    try {
        // Check if request is from admin or public
        const isAdmin = req.role === 'cbt_admin'; // FIXED: Using req.role instead of req.user.role
        
        // Log debugging info
        console.log('getAllBusinesses called by:', isAdmin ? 'admin' : 'public');
        console.log('User ID:', req.user);
        console.log('User role:', req.role);
        
        // Build query - public users only see approved businesses
        const query = isAdmin ? {} : { status: 'approved' };
        console.log('Query filter:', query);
        
        // Count all businesses in the collection (no filters)
        const allBusinessesCount = await businessModel.countDocuments({});
        console.log('Total businesses in DB (no filter):', allBusinessesCount);
        
        // Apply any filters from query parameters
        if (req.query.category) {
            query.category = req.query.category;
        }
        
        // Apply pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Apply sorting - newest first by default
        const sortField = req.query.sortField || 'submissionDate';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sortField] = sortOrder;
        
        // Execute query with pagination and sorting
        const businesses = await businessModel
            .find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
        
        // Get total count for pagination info
        const total = await businessModel.countDocuments(query);
        
        console.log('Filtered businesses count:', total);
        console.log('Returning businesses:', businesses.length);
        
        res.status(200).json({
            success: true,
            count: businesses.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: businesses
        });
    } catch (error) {
        console.error("Error getting businesses:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get businesses",
            error: error.message
        });
    }
};

// Get a specific business by ID
export const getBusinessById = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid business ID format"
            });
        }
        
        const business = await businessModel.findById(id);
        
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: business
        });
    } catch (error) {
        console.error("Error getting business by ID:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get business",
            error: error.message
        });
    }
};

// Get businesses filtered by status
export const getBusinessesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: pending, approved, rejected"
            });
        }
        
        // Apply pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Execute query with pagination
        const businesses = await businessModel
            .find({ status })
            .sort({ submissionDate: -1 })
            .skip(skip)
            .limit(limit);
        
        // Get total count for pagination info
        const total = await businessModel.countDocuments({ status });
        
        res.status(200).json({
            success: true,
            count: businesses.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: businesses
        });
    } catch (error) {
        console.error("Error getting businesses by status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get businesses by status",
            error: error.message
        });
    }
};

// Update business status (admin only)
export const updateBusinessStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid business ID format"
            });
        }
        
        // Validate status if provided
        if (status) {
            const validStatuses = ['pending', 'approved', 'rejected'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be one of: pending, approved, rejected"
                });
            }
        }
        
        // Validate priority if provided
        if (priority) {
            const validPriorities = ['high', 'medium', 'low'];
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid priority. Must be one of: high, medium, low"
                });
            }
        }
        
        // Find and update the business
        const updateData = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        
        const updatedBusiness = await businessModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedBusiness) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Business status updated successfully",
            data: updatedBusiness
        });
    } catch (error) {
        console.error("Error updating business status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update business status",
            error: error.message
        });
    }
};

// Update business details (admin only)
export const updateBusinessDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid business ID format"
            });
        }
        
        // Find business first to check if it exists
        const business = await businessModel.findById(id);
        
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }
        
        // Handle file uploads if provided
        if (req.files) {
            // Handle business image update
            if (req.files.businessImage) {
                // Delete old image if it exists
                if (business.businessImage) {
                    const oldImagePath = path.join(__dirname, '..', business.businessImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                
                // Save new image
                updateData.businessImage = saveFile(req.files.businessImage[0]);
            }
            
            // Handle owner avatar update
            if (req.files.ownerAvatar) {
                // Delete old avatar if it exists
                if (business.ownerAvatar) {
                    const oldAvatarPath = path.join(__dirname, '..', business.ownerAvatar);
                    if (fs.existsSync(oldAvatarPath)) {
                        fs.unlinkSync(oldAvatarPath);
                    }
                }
                
                // Save new avatar
                updateData.ownerAvatar = saveFile(req.files.ownerAvatar[0]);
            }
        }
        
        // Update business with new data
        const updatedBusiness = await businessModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Business details updated successfully",
            data: updatedBusiness
        });
    } catch (error) {
        console.error("Error updating business details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update business details",
            error: error.message
        });
    }
};

// Delete business (admin only)
export const deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid business ID format"
            });
        }
        
        // Find business first to get image paths
        const business = await businessModel.findById(id);
        
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }
        
        // Delete associated image files
        if (business.businessImage) {
            const businessImagePath = path.join(__dirname, '..', business.businessImage);
            if (fs.existsSync(businessImagePath)) {
                fs.unlinkSync(businessImagePath);
            }
        }
        
        if (business.ownerAvatar) {
            const ownerAvatarPath = path.join(__dirname, '..', business.ownerAvatar);
            if (fs.existsSync(ownerAvatarPath)) {
                fs.unlinkSync(ownerAvatarPath);
            }
        }
        
        // Delete the business document
        await businessModel.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Business deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting business:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete business",
            error: error.message
        });
    }
};
import { businessModel } from '../models/BusinessModel.js';
import mongoose from 'mongoose';
import { put, del } from '@vercel/blob';
import path from 'path';

// Helper function to save uploaded file to Vercel Blob
const saveFileToBlob = async (file) => {
    if (!file) return null;

    const cleanOriginalName = path.basename(file.originalname);
    const pathname = `businesses/${file.fieldname}-${cleanOriginalName}`;

    const blob = await put(pathname, file.buffer, {
        access: 'public',
        addRandomSuffix: true,
    });

    return blob.url;
};

// Add a new business
export const addBusiness = async (req, res) => {
    try {
        const businessData = req.body;

        // Validate required fields per schema
        const requiredStringFields = ['name', 'owner', 'ownerEmail', 'description', 'category', 'address', 'phone'];
        for (const f of requiredStringFields) {
            if (!businessData[f] || String(businessData[f]).trim() === '') {
                return res.status(400).json({ success: false, message: `Missing required field: ${f}` });
            }
        }

        // Validate coordinates (required, numbers)
        if (businessData.latitude == null || businessData.longitude == null) {
            return res.status(400).json({ success: false, message: 'Missing required fields: latitude, longitude' });
        }
        const latitude = Number(businessData.latitude);
        const longitude = Number(businessData.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return res.status(400).json({ success: false, message: 'latitude and longitude must be valid numbers' });
        }

        // Check if business already exists with the same name and owner
        const existingBusiness = await businessModel.findOne({
            name: businessData.name,
            owner: businessData.owner
        });
        if (existingBusiness) {
            return res.status(409).json({ success: false, message: 'A business with this name and owner already exists' });
        }

        // Handle file uploads
        if (!req.files || !req.files.businessImage || !req.files.ownerAvatar) {
            return res.status(400).json({ success: false, message: 'Business image and owner avatar are required' });
        }

        // Save files to Vercel Blob and get URLs
        const businessImageUrl = await saveFileToBlob(req.files.businessImage[0]);
        const ownerAvatarUrl = await saveFileToBlob(req.files.ownerAvatar[0]);

        // Create new business with file paths (match model field names)
        // Debug logging for business creation
        console.log('=== BUSINESS CREATION DEBUG ===');
        console.log('req.user:', req.user);
        console.log('req.userEmail:', req.userEmail);
        console.log('req.role:', req.role);
        console.log('businessData.submitterEmail:', businessData.submitterEmail);
        
        const newBusiness = new businessModel({
            name: String(businessData.name).trim(),
            owner: String(businessData.owner).trim(),
            ownerEmail: String(businessData.ownerEmail).trim(),
            description: String(businessData.description).trim(),
            category: String(businessData.category).trim(),
            address: String(businessData.address).trim(),
            phone: String(businessData.phone).trim(),
            website: businessData.website ?? null,
            openingHours: businessData.openingHours ?? null,
            latitude,
            longitude,
            businessImage: businessImageUrl,
            ownerAvatar: ownerAvatarUrl,
            priority: ['high', 'medium', 'low'].includes(businessData.priority) ? businessData.priority : 'low',
            agreement: businessData.agreement === 'true' || businessData.agreement === true,
            // Create new business with file paths
            submitterUserId: req.user ? new mongoose.Types.ObjectId(req.user) : null,
            submitterEmail: req.userEmail || businessData.submitterEmail || null
        });
        
        console.log('Final submitterUserId:', newBusiness.submitterUserId);
        console.log('Final submitterEmail:', newBusiness.submitterEmail);
        console.log('Business Image URL:', businessImageUrl);
        console.log('Owner Avatar URL:', ownerAvatarUrl);
        console.log('=== END BUSINESS CREATION DEBUG ===');

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
        const isAdmin = req.role === 'cbt_admin';
        
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
        
        // Find business first to check authorization
        const business = await businessModel.findById(id);
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        // Authorization check: Only business owner or admin can update status
        const isAdmin = req.role === 'cbt_admin';
        const isOwner = business.submitterUserId && business.submitterUserId.toString() === req.user;
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only the business owner or admin can update business status."
            });
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

// Get all businesses by owner (authenticated user), any status
export const getBusinessesByOwner = async (req, res) => {
  try {
    const emailQ = (req.query.email || '').trim();
    const ors = [];

    if (req.user) ors.push({ submitterUserId: new mongoose.Types.ObjectId(req.user) });
    if (req.userEmail) ors.push({ submitterEmail: req.userEmail }, { ownerEmail: req.userEmail });
    if (emailQ) ors.push({ ownerEmail: emailQ }, { submitterEmail: emailQ });

    if (ors.length === 0) {
      return res.status(400).json({ success: false, message: 'Owner email is required' });
    }

    const businesses = await businessModel
      .find({ $or: ors })
      .sort({ submissionDate: -1 });

    res.status(200).json({ success: true, count: businesses.length, data: businesses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get businesses by owner', error: error.message });
  }
};
  
// Update business details (admin only)
export const updateBusinessDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
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

        // Authorization check: Only business owner or admin can edit
        const isAdmin = req.role === 'cbt_admin';
        const isOwner = business.submitterUserId && business.submitterUserId.toString() === req.user;
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only the business owner or admin can edit business details."
            });
        }

        // Normalize types to match model
        if (updateData.latitude != null) {
            const lat = Number(updateData.latitude);
            if (!Number.isFinite(lat)) return res.status(400).json({ success: false, message: 'latitude must be a number' });
            updateData.latitude = lat;
        }
        if (updateData.longitude != null) {
            const lng = Number(updateData.longitude);
            if (!Number.isFinite(lng)) return res.status(400).json({ success: false, message: 'longitude must be a number' });
            updateData.longitude = lng;
        }
        if (updateData.priority && !['high', 'medium', 'low'].includes(updateData.priority)) {
            return res.status(400).json({ success: false, message: 'Invalid priority. Must be one of: high, medium, low' });
        }
        if (updateData.status && !['pending', 'approved', 'rejected'].includes(updateData.status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be one of: pending, approved, rejected' });
        }
        if (updateData.agreement != null) {
            updateData.agreement = updateData.agreement === 'true' || updateData.agreement === true;
        }
        
        // Handle file uploads if provided
        if (req.files) {
            // Check for and handle new business image
            if (req.files.businessImage) {
                // If an old image exists, delete it from Vercel Blob
                if (business.businessImage) {
                    try {
                        await del(business.businessImage);
                    } catch (error) {
                        console.error("Failed to delete old business image from blob storage:", error);
                    }
                }
                // Upload the new image and get its URL
                updateData.businessImage = await saveFileToBlob(req.files.businessImage[0]);
            }

            // Check for and handle new owner avatar
            if (req.files.ownerAvatar) {
                // If an old avatar exists, delete it from Vercel Blob
                if (business.ownerAvatar) {
                    try {
                        await del(business.ownerAvatar);
                    } catch (error) {
                        console.error("Failed to delete old owner avatar from blob storage:", error);
                    }
                }
                // Upload the new avatar and get its URL
                updateData.ownerAvatar = await saveFileToBlob(req.files.ownerAvatar[0]);
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
        
        // Delete associated image files from Vercel Blob
        if (business.businessImage) {
            await del(business.businessImage);
        }
        
        if (business.ownerAvatar) {
            await del(business.ownerAvatar);
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

// Get all approved businesses (public)
export const getAllApprovedBusinesses = async (req, res) => {
    try {
        const { category } = req.query;
        const query = { status: 'approved' };
        if (category) query.category = category;

        // Return all fields; frontend uses name, category, latitude, longitude to plot
        const businesses = await businessModel
            .find(query)
            .sort({ submissionDate: -1 });

        res.status(200).json({
            success: true,
            count: businesses.length,
            data: businesses
        });
    } catch (error) {
        console.error("Error getting approved businesses:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get approved businesses",
            error: error.message
        });
    }
};

// Get all submissions created by the authenticated user (any status)
export const getMySubmissions = async (req, res) => {
    try {
      console.log('getMySubmissions: req.user =', req.user);
      const submitterUserId = req.user;
      if (!submitterUserId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      
      // Convert string ID to ObjectId for database query
      const businesses = await businessModel
        .find({ submitterUserId: new mongoose.Types.ObjectId(submitterUserId) })
        .sort({ submissionDate: -1 });
      
      console.log('getMySubmissions: businesses found =', businesses.length);
      
      // If no businesses found by submitterUserId, try to find by email as fallback
      if (businesses.length === 0 && req.userEmail) {
        console.log('No businesses found by submitterUserId, trying email fallback...');
        console.log('Looking for businesses with email:', req.userEmail);
        const emailBusinesses = await businessModel
          .find({ 
            $or: [
              { submitterEmail: req.userEmail },
              { ownerEmail: req.userEmail }
            ]
          })
          .sort({ submissionDate: -1 });
        
        console.log('getMySubmissions: businesses found by email =', emailBusinesses.length);
        
        // Update these businesses with the correct submitterUserId
        if (emailBusinesses.length > 0) {
          await businessModel.updateMany(
            { 
              $or: [
                { submitterEmail: req.userEmail },
                { ownerEmail: req.userEmail }
              ]
            },
            { 
              submitterUserId: new mongoose.Types.ObjectId(req.user),
              submitterEmail: req.userEmail 
            }
          );
          console.log('Updated businesses with correct submitterUserId and submitterEmail');
        }
        
        res.status(200).json({
          success: true,
          count: emailBusinesses.length,
          data: emailBusinesses
        });
      } else {
        res.status(200).json({
          success: true,
          count: businesses.length,
          data: businesses
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get my submissions',
        error: error.message
      });
    }
  };

  // Get approved businesses by category (Public route)
export const getApprovedBusinessesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Category parameter is required"
            });
        }

        // Find businesses that are approved and match the category
        const businesses = await businessModel.find({
            status: 'approved',
            category: { $regex: new RegExp(category, 'i') } // Case-insensitive search
        }).select('-__v -createdAt -updatedAt'); // Exclude unnecessary fields

        return res.status(200).json({
            success: true,
            data: businesses,
            count: businesses.length,
            message: `Found ${businesses.length} approved businesses in category: ${category}`
        });

    } catch (error) {
        console.error('Error fetching approved businesses by category:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
import { userModel } from "../models/UserModel.js"

export const getAllUsers = async (req, res) => {
    try {
        const { limit, sort } = req.query;

        let query = userModel.find().select("firstName lastName email role avatarUrl");

        if (sort) {
            const [sortField, sortOrder] = sort.split('_');
            const order = sortOrder === 'desc' ? -1 : 1;
            query = query.sort({ [sortField]: order });
        } else {
            query = query.sort({ lastName: 1 });
        }

        if (limit) {
            query = query.limit(parseInt(limit, 10));
        }

        const users = await query;

        return res.status(200).json({ message: "Users fetched successfully", success: true, users });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An internal server error has occured while trying to fetch all users", success: false });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await userModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        return res.status(200).json({ message: "User deleted successfully", success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An internal server error has occured while trying to delete the user", success: false });
    }
}

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log(updateData);

        // Find the user to check their current role
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const isRoleChanging = updateData.role && user.role !== updateData.role;

        // If the role is NOT changing, perform a simple update
        if (!isRoleChanging) {
            const updatedUser = await userModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select("-password");
            return res.status(200).json({ message: "User updated successfully", success: true, user: updatedUser });
        }
        
        const updatePayload = { ...user.toObject(), ...updateData };

        // Clean up: If changing roles from business user, remove business-specific fields
        if (user.role === 'business' && updateData.role !== 'business') {
            delete updatePayload.companyName;
            delete updatePayload.companyRegistrationNo;
            delete updatePayload.companyAddress;
        }

        const updatedUser = await userModel.findByIdAndUpdate(id, updatePayload, {
            new: true,
            overwrite: true, // Replace document
            overwriteDiscriminatorKey: true, // Flag to allow role change
            runValidators: true
        }).select("-password");
        
        return res.status(200).json({
            message: "User role and details updated successfully",
            success: true,
            user: updatedUser
        });

    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Validation Error: ${error.message}`, success: false });
        }
        return res.status(500).json({ message: "An internal server error occurred while trying to update the user", success: false });
    }
};
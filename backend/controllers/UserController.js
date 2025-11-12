import { contactUsModel } from "../models/ContactUsModel.js";
import { userModel } from "../models/UserModel.js";
import { del, put } from "@vercel/blob"
import { notificationModel } from "../models/NotificationModel.js";

// @desc Update user profile information
// @route POST /updateUserProfile
// @access private
export const updateUserProfile = async (req, res) => {
    try {
        const { firstName, lastName, nationality } = req.body;
        const _id = req.user;
        
        // Find the user using the id
        const currentUser = await userModel.findById(_id);

        // Dynamically fill in updateData based on what actually needs to be updated
        const updateData = {};
        let needsUpdate = false;

        if (firstName !== undefined && firstName !== currentUser.firstName) {
            updateData.firstName = firstName;
            needsUpdate = true;
        }
        if (lastName !== undefined && lastName !== currentUser.lastName) {
            updateData.lastName = lastName;
            needsUpdate = true;
        }

        if (nationality !== undefined && nationality !== currentUser.nationality) {
            updateData.nationality = nationality;
            needsUpdate = true;
        }

        if (needsUpdate) {
            // Update the user
            const updatedUser = await userModel.findByIdAndUpdate(
                _id,
                updateData,
                { new: true, runValidators: true } // Run schema validators
            ).select("-createdAt -updatedAt -__v -password"); // Exclude these from the response

            return res.status(200).json({
                message: "User profile updated successfully.",
                success: true,
                updatedUser
            });
        } else {
            return res.status(200).json({
                message: "No changes detected in user profile.",
                success: true
            })
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation failed.", success: false, errors: error.errors });
        }

        res.status(500).json({ message: "An internal server error occurred.", success: false });
    }
}

// @desc Update user password
// @route POST /updatePassword
// @access private
export const updatePassword = async (req, res) => {
    try {
        const _id = req.user;
        
        const { currentPassword, newPassword } = req.body;

        if ( !currentPassword || !newPassword ) {
            return res.status(400).json({ message: "Please provide current and new password", success: false });
        }

        if (currentPassword == newPassword) {
            return res.status(400).json({ message: "New password cannot be the same as the current password.", success: false });
        }

        const user = await userModel.findById(_id);
        const isMatch = await user.isValidPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password", success: false });
        } else {
            user.password = newPassword;
            await user.save();
            
            res.status(200).json({ message: "Password updated successfully", success: true });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "An internal server error occurred while updating the password.", success: false });
    }
}

export const updateAvatar = async (req, res) => {
    const userId = req.user;
    const file = req.file;
    try {
        const user = await userModel.findById(userId).select('avatarUrl');
        if (user && user.avatarUrl) {
            try {
                await del(user.avatarUrl);
            } catch (error) {
                console.warn(`Failed to delete old blob: ${user.avatarUrl}`, error);
            }
        }

        const blob = await put(file.originalname, file.buffer, {
            access: 'public',
            addRandomSuffix: true,
            token: process.env.BLOB_READ_WRITE_TOKEN
        })
            
        console.log(blob);
        await userModel.findByIdAndUpdate(
            userId,
            { avatarUrl: blob.url },
        )
        res.status(200).json({ message: "Avatar uploaded successfully", url: blob.url, success: true });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occured while uploading the file", success: false });
    }
}

export const removeAvatar = async (req, res) => {
    const userId = req.user;
    try {
        const user = await userModel.findById(userId).select('avatarUrl');
        if (user && user.avatarUrl) {
            try {
                await del(user.avatarUrl);
                await userModel.findByIdAndUpdate(
                    userId,
                    { avatarUrl: null },
                )
                res.status(200).json({ message: "Avatar deleted successfully", success: true });
            } catch (error) {
                console.warn(`Failed to delete old blob: ${user.avatarUrl}`, error);
                res.status(500).json({ message: "An error occured while deleting the file", success: false });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occured while deleting the file", success: false });
    }
}

// @desc Contact form submission
// @route POST /contactUs
// @access public
export const contactUs = async (req, res) => {
    try {
        const { name, email, category, topic, message } = req.body;

        const contactUs = await contactUsModel.create({
            name: name,
            email: email,
            category: category,
            topic: topic,
            message: message
        });

        // CREATE NOTIFICATION FOR NEW INQUIRY ⬇️
        try {
            await notificationModel.create({
                type: 'inquiry_submission',
                message: `New inquiry from "${name}": ${topic}`,
                inquiryId: contactUs._id,
                inquiryName: name,
                inquiryTopic: topic,
                targetRole: 'cbt_admin',
                targetUserId: null,
                read: false,
                priority: 'medium',
                metadata: {
                    category: category,
                    email: email,
                    submissionDate: new Date()
                }
            });
            console.log('✅ Notification created for new inquiry submission');
        } catch (notifError) {
            console.error('❌ Failed to create notification:', notifError);
        }

        res.status(201).json({ message: "Contact form submission successful.", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during contact form submission.", success: false });
    }
}

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent deletion of protected admin accounts
        if (["system_admin","cbt_admin"].includes(user.role)) {
            return res.status(403).json({ success: false, message: "Deleting admin accounts is not allowed" });
        }

        // Require password confirmation for password-auth users
        if (user.authProvider === 'password') {
            const { password } = req.body || {};
            if (!password) {
                return res.status(400).json({ success: false, message: "Current password is required to delete account" });
            }
            const isValid = await user.isValidPassword(password);
            if (!isValid) {
                return res.status(401).json({ success: false, message: "Incorrect current password" });
            }
        }

        await userModel.findByIdAndDelete(userId);

        // Clear refresh cookies similar to logout
        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/api/auth/refresh',
        });
        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        });

        return res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "An internal server error occurred while deleting account" });
    }
};
import transporter from "../config/emailConfig.js";
import { locationModel } from "../models/LocationModel.js";
import { userModel } from "../models/UserModel.js";
import { getNewLocationEmailTemplate } from "../utils/emailTemplates.js";
import { put, del } from '@vercel/blob';

export const getAllLocations = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {};
    if (type && type !== "All") {
      filter.type = new RegExp(`^${type}$`, "i");
    }

    const locations = await locationModel
      .find(filter)
      .sort({ createdAt: -1, updatedAt: -1 });
    return res.status(200).json(locations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while loading locations.",
      success: false,
    });
  }
};

export const addLocation = async (req, res) => {
  try {
    const {
      category,
      type,
      division,
      name,
      status,
      latitude,
      longitude,
      description,
      url,
      image,
    } = req.body;

    if (!category || !type || !division || !name || !status || !description) {
      return res
        .status(400)
        .json({ message: "Missing required fields.", success: false });
    }

    let finalImage = image || "";
    if (req.file) {
      const { url: blobUrl } = await put(req.file.originalname, req.file.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      finalImage = blobUrl;
    }

    const locationData = {
      category,
      type,
      division,
      name,
      latitude,
      longitude,
      url,
      description,
      image: finalImage,
      status,
    };

    const newLocation = await locationModel.create(locationData);
    console.log(newLocation);

    res.status(201).json({
      message: "Location added successfully",
      success: true,
      newLocation,
    });

    // async email notifications
    (async () => {
      try {
        const usersToNotify = await userModel
          .find({ "notifications.location": true })
          .select("email firstName lastName");

        if (usersToNotify.length > 0) {
          let sendingLimitReached = false; // Flag to track if the limit is hit

          for (const user of usersToNotify) {
            // If the limit was reached in a previous iteration, stop sending
            if (sendingLimitReached) {
              break;
            }

            const fullName = `${user.firstName} ${user.lastName}`;
            const emailTemplate = getNewLocationEmailTemplate(
              locationData.name,
              fullName,
              locationData.description,
              locationData.category,
              locationData.type
            );

            const mailOptions = {
              to: user.email,
              from: `"Sarawak Tourism 🌴" <${process.env.EMAIL_USER}>`,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
            };

            try {
              await transporter.sendMail(mailOptions);
            } catch (mailErr) {
              // Check if the error is specifically the daily sending limit error
              if (mailErr.responseCode === 550 && mailErr.command === 'DATA') {
                console.error("Gmail daily sending limit exceeded. Halting email notifications for this batch.");
                sendingLimitReached = true;
              } else {
                // Log other email errors but don't stop the loop
                console.error(`Email send failed for: ${user.email}`, mailErr);
              }
            }
          }
        }
      } catch (notifyErr) {
        console.error("Error fetching users for notification dispatch:", notifyErr);
      }
    })();

    return; // response already sent
  } catch (error) {
    console.error(
      "An error occured while trying to create new location:",
      error
    );

    return res.status(500).json({
      message: "An error occured while trying to create new location",
      success: false,
    });
  }
};

export const removeLocation = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Location ID is required.", success: false });
    }

    // Find the location first to get its image URL
    const locationToDelete = await locationModel.findById(id);

    if (!locationToDelete) {
      return res.status(404).json({ message: "Location not found.", success: false });
    }

    // If an image URL exists, delete it from Vercel Blob
    if (locationToDelete.image) {
      try {
        await del(locationToDelete.image);
      } catch (blobDelError) {
        // Log the error but don't prevent the DB record from being deleted
        console.error("Failed to delete blob, but continuing with DB deletion:", blobDelError);
      }
    }

    // Finally, delete the location from the database
    await locationModel.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ message: "Location removed successfully", success: true });
  } catch (error) {
    console.error(
      "An error occured while trying to delete this location:",
      error
    );
    return res.status(500).json({
      message: "An error occured while trying to delete this location",
      success: false,
    });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const {
      id,
      category,
      type,
      division,
      name,
      status,
      latitude,
      longitude,
      description,
      url,
      image,
    } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({
          message: "Location ID is required for update.",
          success: false,
        });
    }

    const updateFields = {};
    if (category !== undefined) updateFields.category = category;
    if (type !== undefined) updateFields.type = type;
    if (division !== undefined) updateFields.division = division;
    if (name !== undefined) updateFields.name = name;
    if (status !== undefined) updateFields.status = status;
    if (latitude !== undefined) updateFields.latitude = latitude;
    if (longitude !== undefined) updateFields.longitude = longitude;
    if (description !== undefined) updateFields.description = description;
    if (url !== undefined) updateFields.url = url;

    // If a NEW file was uploaded, handle deleting the old one and uploading the new one
    if (req.file) {
      // Find the existing location to get the old image URL
      const existingLocation = await locationModel.findById(id);
      if (existingLocation && existingLocation.image) {
        // If an old image exists, delete it from Vercel Blob
        try {
          await del(existingLocation.image);
        } catch (blobDelError) {
          console.error("Failed to delete old blob, but continuing with update:", blobDelError);
        }
      }

      // Upload the new image to Vercel Blob
      const { url: blobUrl } = await put(req.file.originalname, req.file.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      updateFields.image = blobUrl; // Set the new image URL for the update
    } else if (image !== undefined) {
      // This handles cases where the image URL is being set manually or cleared
      updateFields.image = image;
    }

    if (Object.keys(updateFields).length === 0 && !req.file) {
      return res
        .status(400)
        .json({ message: "No fields to update provided.", success: false });
    }

    const updatedLocation = await locationModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({ message: "Location not found to update.", success: false });
    }

    console.log("Location updated:", updatedLocation);
    return res.status(200).json({
      message: "Location updated successfully",
      success: true,
      updatedLocation,
    });
  } catch (error) {
    console.error("FULL ERROR DETAILS:", error);

    return res.status(500).json({
      message: "An error occured while trying to create new location",
      success: false,
    });
  }
};
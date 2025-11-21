import transporter from "../config/emailConfig.js";
import { locationModel } from "../models/LocationModel.js";
import { userModel } from "../models/UserModel.js";
import { getNewLocationEmailTemplate } from "../utils/emailTemplates.js";
import { put, del } from "@vercel/blob";

export const getAllLocations = async (req, res) => {
  try {
    const { type } = req.query;
    const { excludeTerms } = req.query;

    const filter = {};
    if (type && type !== "All") {
      // case-insensitive exact match
      filter.type = new RegExp(`^${type}$`, "i");
    }

    // Optional: exclude specific terms in name (case-insensitive)
    // Used by CategoryDetailsPage to filter out "Pharmacy" and "Toilet"
    if (excludeTerms) {
      try {
        const terms = String(excludeTerms)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

        // For requested terms, match simple variations with \w*
        // We expand known stems for better coverage: "pharm" and "toilet"
        const expandedStems = terms
          .map((t) => (t.startsWith("pharm") ? "pharm\\w*" : t.startsWith("toilet") ? "toilet\\w*" : `${t}\\w*`))
          .join("|");

        const regex = new RegExp(`\\b(?:${expandedStems})\\b`, "i");
        filter.name = { $not: regex };
      } catch (regexErr) {
        console.error("excludeTerms regex build failed:", regexErr);
        // If filter construction fails, skip server-side exclusion gracefully
      }
    }

    const locations = await locationModel
      .find(filter)
      .sort({ createdAt: -1, updatedAt: -1 });

    return res.status(200).json(locations);
  } catch (error) {
    console.error("getAllLocations error:", error);
    return res.status(500).json({
      message: "An error occurred while loading locations.",
      error: error.message,
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

    // basic validation
    if (!category || !type || !division || !name || !status || !description) {
      return res.status(400).json({
        message: "Missing required fields.",
        success: false,
      });
    }

    // start with whatever the client sent
    let finalImage = image || "";

    // if client uploaded a file (multer.memoryStorage), push to Vercel Blob
    if (req.file) {
      const blob = await put(
        `locations/${Date.now()}-${req.file.originalname}`,
        req.file.buffer,
        {
          access: "public",
        }
      );
      finalImage = blob.url;
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

    // send response right away
    res.status(201).json({
      message: "Location added successfully",
      success: true,
      newLocation,
    });

    (async () => {
      try {
        const usersToNotify = await userModel
          .find({ "notifications.location": true })
          .select("email firstName lastName");

        if (!usersToNotify.length) return;

        let sendingLimitReached = false;

        for (const user of usersToNotify) {
          if (sendingLimitReached) break;

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
            // if gmail daily limit hit, stop sending to others
            if (mailErr.responseCode === 550 && mailErr.command === "DATA") {
              console.error(
                "Gmail daily sending limit exceeded. Halting email notifications for this batch."
              );
              sendingLimitReached = true;
            } else {
              console.error(`Email send failed for: ${user.email}`, mailErr);
            }
          }
        }
      } catch (notifyErr) {
        console.error(
          "Error fetching users for notification dispatch:",
          notifyErr
        );
      }
    })();

    return; // we already sent the response
  } catch (error) {
    console.error(
      "An error occurred while trying to create new location:",
      error
    );
    return res.status(500).json({
      message: "An error occurred while trying to create new location",
      error: error.message,
      success: false,
    });
  }
};

export const removeLocation = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Location ID is required.",
        success: false,
      });
    }

    // fetch the doc first to get its image
    const locationToDelete = await locationModel.findById(id);
    if (!locationToDelete) {
      return res.status(404).json({
        message: "Location not found.",
        success: false,
      });
    }

    // try deleting blob (non-fatal)
    if (locationToDelete.image) {
      try {
        await del(locationToDelete.image);
      } catch (blobDelError) {
        console.error(
          "Failed to delete blob, but continuing with DB deletion:",
          blobDelError
        );
      }
    }

    await locationModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Location removed successfully",
      success: true,
    });
  } catch (error) {
    console.error(
      "An error occurred while trying to delete this location:",
      error
    );
    return res.status(500).json({
      message: "An error occurred while trying to delete this location",
      error: error.message,
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
      return res.status(400).json({
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

    // if a NEW file was uploaded
    if (req.file) {
      // get current doc so we can delete old image
      const existingLocation = await locationModel.findById(id);

      if (existingLocation && existingLocation.image) {
        try {
          await del(existingLocation.image);
        } catch (blobDelError) {
          console.error(
            "Failed to delete old blob, but continuing with update:",
            blobDelError
          );
        }
      }

      const blob = await put(
        `locations/${Date.now()}-${req.file.originalname}`,
        req.file.buffer,
        {
          access: "public",
        }
      );
      updateFields.image = blob.url;
    } else if (image !== undefined) {
      updateFields.image = image;
    }

    if (Object.keys(updateFields).length === 0 && !req.file) {
      return res.status(400).json({
        message: "No fields to update provided.",
        success: false,
      });
    }

    const updatedLocation = await locationModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({
        message: "Location not found to update.",
        success: false,
      });
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
      message: "An error occurred while trying to update this location",
      error: error.message,
      success: false,
    });
  }
};

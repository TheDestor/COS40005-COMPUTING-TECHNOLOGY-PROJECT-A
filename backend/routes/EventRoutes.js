import { Router } from "express";
import { addEvent, getAllEvents, updateEvent, getEventById, deleteEvent } from "../controllers/EventController.js";
import multer from "multer";
import { checkRole, verifyJWT } from "../middleware/AuthMiddleware.js";
import { eventsLimiter } from "../middleware/rateLimiter.js";

const eventRouter = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4.5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
    }
});

eventRouter.post("/addEvent", upload.single('image'), verifyJWT, checkRole(['cbt_admin']), addEvent);
eventRouter.get("/getAllEvents", eventsLimiter, getAllEvents);
eventRouter.get("/getEvent/:id", getEventById);
eventRouter.put("/updateEvent/:id", upload.single('image'), verifyJWT, checkRole(['cbt_admin']), updateEvent);
eventRouter.delete("/deleteEvent/:id", verifyJWT, checkRole(['cbt_admin']), deleteEvent);

export default eventRouter;
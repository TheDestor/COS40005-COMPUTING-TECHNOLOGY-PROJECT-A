import express from "express";
import { subscribeToNewsletter } from "../controllers/newsletterController.js";
import { newsletterSubscribeLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post('/subscribe', newsletterSubscribeLimiter, subscribeToNewsletter);

export default router;
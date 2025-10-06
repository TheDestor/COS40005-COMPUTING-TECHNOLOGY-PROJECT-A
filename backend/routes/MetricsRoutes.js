import { Router } from 'express';
import { recordUniqueVisitorSession } from '../controllers/MetricsController.js';
import { uniqueVisitorLimiter } from '../middleware/rateLimiter.js';

const metricsRouter = Router();

// Removed: metricsRouter.post('/page-view', pageViewLimiter, incrementPageView);
// Removed: metricsRouter.post('/unique-page-view', uniqueViewLimiter, recordUniquePageView);
metricsRouter.post('/unique-visitor-session', uniqueVisitorLimiter, recordUniqueVisitorSession);

export default metricsRouter;
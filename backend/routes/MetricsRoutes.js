import { Router } from 'express';
import { recordUniqueVisitor } from '../controllers/MetricsController.js';
import { uniqueVisitorLimiter } from '../middleware/rateLimiter.js';
import { attachUserIfPresent } from '../middleware/AuthMiddleware.js';

const metricsRouter = Router();

metricsRouter.post('/unique-visitor', attachUserIfPresent, uniqueVisitorLimiter, recordUniqueVisitor);

export default metricsRouter;
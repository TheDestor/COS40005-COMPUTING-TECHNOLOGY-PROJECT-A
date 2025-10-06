import { Router } from 'express';
import { verifyJWT, checkRole } from '../middleware/AuthMiddleware.js';
import { getAdminMetrics } from '../controllers/AdminMetricsController.js';

const adminMetricsRouter = Router();

adminMetricsRouter.get('/stats', verifyJWT, checkRole(['system_admin']), getAdminMetrics);

export default adminMetricsRouter;
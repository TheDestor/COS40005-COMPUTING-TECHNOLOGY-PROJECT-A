import { Router } from 'express';
import { verifyJWT, checkRole } from '../middleware/AuthMiddleware.js';
import { getAdminMetrics, getSecurityMetrics, getSecuritySessions } from '../controllers/AdminMetricsController.js';

const adminMetricsRouter = Router();

adminMetricsRouter.get('/stats', verifyJWT, checkRole(['system_admin']), getAdminMetrics);
adminMetricsRouter.get('/security-stats', verifyJWT, checkRole(['system_admin']), getSecurityMetrics);
adminMetricsRouter.get('/security-sessions', verifyJWT, checkRole(['system_admin']), getSecuritySessions);

export default adminMetricsRouter;
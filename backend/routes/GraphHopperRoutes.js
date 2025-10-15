import express from 'express';
import { getRoute, getRouteAlternatives } from '../controllers/GraphHopperController.js';
import { graphHopperRouteLimiter, graphHopperAlternativesLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Get single route
router.post('/route', graphHopperRouteLimiter, getRoute);

// Get route alternatives
router.post('/alternatives', graphHopperAlternativesLimiter, getRouteAlternatives);

export default router;

import express from 'express';
import { getRoute, getRouteAlternatives } from '../controllers/GraphHopperController.js';

const router = express.Router();

// Get single route
router.post('/route', getRoute);

// Get route alternatives
router.post('/alternatives', getRouteAlternatives);

export default router;

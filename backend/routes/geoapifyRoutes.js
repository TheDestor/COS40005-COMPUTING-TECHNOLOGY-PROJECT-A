import { Router } from 'express';
import { getNearbyPlaces, refreshCache, getApiUsageStats, clearOldCache } from '../controllers/geoapifyController.js';

const router = Router();
// Get nearby places with caching
router.get('/nearby-places', getNearbyPlaces);

// Manually refresh cache
router.get('/refresh-cache', refreshCache);

// Get API usage statistics
router.get('/usage-stats', getApiUsageStats);

// Clear old cache entries (admin)
router.delete('/clear-cache', clearOldCache);

export default router;
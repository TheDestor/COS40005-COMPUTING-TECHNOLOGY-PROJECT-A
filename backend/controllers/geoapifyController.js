import axios from 'axios';
import NodeCache from 'node-cache';
import Place from '../models/Place.js';
import ApiUsage from '../models/ApiUsage.js';

// In-memory cache for ultra-fast responses (TTL: 1 hour)
const memoryCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Generate cache key based on location and radius
const generateCacheKey = (lat, lng, radius) => {
  return `places_${lat.toFixed(4)}_${lng.toFixed(4)}_${radius}`;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Check if we have cached data in database that's close enough
const findNearbyCache = async (lat, lng, radius) => {
  try {
    const cacheDistance = radius * 0.1; // 10% of search radius
    
    const cachedData = await Place.findOne({
      latitude: {
        $gte: lat - (cacheDistance / 111320),
        $lte: lat + (cacheDistance / 111320)
      },
      longitude: {
        $gte: lng - (cacheDistance / (111320 * Math.cos(lat * Math.PI / 180))),
        $lte: lng + (cacheDistance / (111320 * Math.cos(lat * Math.PI / 180)))
      },
      radius: { $gte: radius * 0.8 }, // At least 80% of requested radius
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Less than 7 days old
    }).sort({ updatedAt: -1 }).limit(1);

    return cachedData;
  } catch (error) {
    console.error('Error finding nearby cache:', error);
    return null;
  }
};

// Fetch places from Geoapify API
const fetchFromGeoapify = async (lat, lng, radius) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Geoapify API key not configured');
  }

  const url = `https://api.geoapify.com/v2/places`;
  
  const params = {
    categories: 'tourism,accommodation,catering,entertainment,leisure,commercial,building',
    filter: `circle:${lng},${lat},${radius}`,
    limit: 50,
    apiKey: apiKey
  };

  try {
    const response = await axios.get(url, { params, timeout: 10000 });
    
    // Track API usage
    await trackApiUsage('geoapify', 'nearby_places', true);
    
    return response.data;
  } catch (error) {
    await trackApiUsage('geoapify', 'nearby_places', false, error.message);
    throw error;
  }
};

// Track API usage for monitoring
const trackApiUsage = async (provider, endpoint, success, errorMessage = null) => {
  try {
    await ApiUsage.create({
      provider,
      endpoint,
      success,
      errorMessage,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error tracking API usage:', error);
  }
};

// Process and enrich place data
const processPlaceData = (feature) => {
  const props = feature.properties;
  
  return {
    place_id: props.place_id,
    name: props.name || 'Unnamed Place',
    address: props.formatted || props.address_line1 || 'Address not available',
    types: props.categories || [],
    coordinates: feature.geometry.coordinates, // [lng, lat]
    photos: props.image ? [props.image] : [],
    rating: props.rating || null,
    user_ratings_total: props.user_ratings_total || 0,
    website: props.website || null,
    phone: props.phone || null,
    opening_hours: props.opening_hours || null,
    distance: props.distance || null,
    datasource: props.datasource || {},
    raw_data: props
  };
};

// Define your functions
const getNearbyPlaces = async (req, res) => {
  try {
    const { lat, lng, radius, forceRefresh } = req.query;

    // Validate input
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius) || 1000;

    if (isNaN(latitude) || isNaN(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    const cacheKey = generateCacheKey(latitude, longitude, searchRadius);

    // Check memory cache first (fastest)
    if (!forceRefresh) {
      const memoryCached = memoryCache.get(cacheKey);
      if (memoryCached) {
        return res.json({
          success: true,
          data: memoryCached.data,
          cached: true,
          cacheType: 'memory',
          timestamp: memoryCached.timestamp,
          source: 'memory_cache'
        });
      }

      // Check database cache
      const dbCached = await findNearbyCache(latitude, longitude, searchRadius);
      if (dbCached) {
        const cacheData = {
          data: dbCached.places,
          timestamp: dbCached.updatedAt
        };
        
        // Store in memory cache for next time
        memoryCache.set(cacheKey, cacheData);
        
        return res.json({
          success: true,
          data: dbCached.places,
          cached: true,
          cacheType: 'database',
          timestamp: dbCached.updatedAt,
          source: 'database_cache'
        });
      }
    }

    // No cache found or force refresh - fetch from API
    console.log(`Fetching fresh data from Geoapify for ${latitude}, ${longitude}`);
    
    const apiResponse = await fetchFromGeoapify(latitude, longitude, searchRadius);
    
    // Process the data
    const processedPlaces = apiResponse.features.map(processPlaceData);

    // Save to database
    await Place.findOneAndUpdate(
      {
        latitude: { $gte: latitude - 0.001, $lte: latitude + 0.001 },
        longitude: { $gte: longitude - 0.001, $lte: longitude + 0.001 },
        radius: searchRadius
      },
      {
        latitude,
        longitude,
        radius: searchRadius,
        places: processedPlaces,
        totalResults: processedPlaces.length,
        apiResponse: apiResponse,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Store in memory cache
    const cacheData = {
      data: processedPlaces,
      timestamp: new Date()
    };
    memoryCache.set(cacheKey, cacheData);

    return res.json({
      success: true,
      data: processedPlaces,
      cached: false,
      timestamp: new Date(),
      source: 'geoapify_api',
      totalResults: processedPlaces.length
    });

  } catch (error) {
    console.error('Error in getNearbyPlaces:', error);
    
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch nearby places',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Manual cache refresh endpoint
const refreshCache = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius) || 1000;

    // Clear memory cache for this location
    const cacheKey = generateCacheKey(latitude, longitude, searchRadius);
    memoryCache.del(cacheKey);

    // Fetch fresh data
    const apiResponse = await fetchFromGeoapify(latitude, longitude, searchRadius);
    const processedPlaces = apiResponse.features.map(processPlaceData);

    // Update database
    await Place.findOneAndUpdate(
      {
        latitude: { $gte: latitude - 0.001, $lte: latitude + 0.001 },
        longitude: { $gte: longitude - 0.001, $lte: longitude + 0.001 },
        radius: searchRadius
      },
      {
        latitude,
        longitude,
        radius: searchRadius,
        places: processedPlaces,
        totalResults: processedPlaces.length,
        apiResponse: apiResponse,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update memory cache
    memoryCache.set(cacheKey, {
      data: processedPlaces,
      timestamp: new Date()
    });

    return res.json({
      success: true,
      data: processedPlaces,
      message: 'Cache refreshed successfully',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error refreshing cache:', error);
    
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to refresh cache'
    });
  }
};

// Get API usage statistics
const getApiUsageStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const stats = await ApiUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            provider: '$provider',
            endpoint: '$endpoint',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          totalCalls: { $sum: 1 },
          successfulCalls: { $sum: { $cond: ['$success', 1, 0] } },
          failedCalls: { $sum: { $cond: ['$success', 0, 1] } }
        }
      },
      { $sort: { '_id.date': -1 } }
    ]);

    // Get overall statistics
    const overall = await ApiUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          successfulCalls: { $sum: { $cond: ['$success', 1, 0] } },
          failedCalls: { $sum: { $cond: ['$success', 0, 1] } }
        }
      }
    ]);

    return res.json({
      success: true,
      stats,
      overall: overall[0] || { totalCalls: 0, successfulCalls: 0, failedCalls: 0 }
    });

  } catch (error) {
    console.error('Error getting API usage stats:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve API usage statistics'
    });
  }
};

// Clear old cache entries (can be run as a cron job)
const clearOldCache = async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days) || 30;
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await Place.deleteMany({
      updatedAt: { $lt: cutoffDate }
    });

    return res.json({
      success: true,
      message: `Cleared ${result.deletedCount} old cache entries`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error clearing old cache:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to clear old cache entries'
    });
  }
};

// Export functions as named exports
export {
  getNearbyPlaces,
  refreshCache,
  getApiUsageStats,
  clearOldCache
};
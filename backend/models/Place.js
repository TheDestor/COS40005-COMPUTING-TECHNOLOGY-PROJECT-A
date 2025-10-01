import mongoose from 'mongoose';

// models/Place.js
const placeSchema = new mongoose.Schema({
  // Location identifiers
  latitude: {
    type: Number,
    required: true,
    index: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    index: true,
    min: -180,
    max: 180
  },
  radius: {
    type: Number,
    required: true,
    default: 1000
  },
  
  // Cached places data
  places: [{
    place_id: String,
    name: String,
    address: String,
    types: [String],
    coordinates: [Number], // [lng, lat]
    photos: [String],
    rating: Number,
    user_ratings_total: Number,
    website: String,
    phone: String,
    opening_hours: mongoose.Schema.Types.Mixed,
    distance: Number,
    datasource: mongoose.Schema.Types.Mixed,
    raw_data: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  totalResults: {
    type: Number,
    default: 0
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient location queries
placeSchema.index({ latitude: 1, longitude: 1, radius: 1 });

// Index for finding recent cache entries
placeSchema.index({ updatedAt: -1 });

// Index for geospatial queries
placeSchema.index({ latitude: 1, longitude: 1 });

// Method to check if cache is stale
placeSchema.methods.isStale = function(maxAge = 7 * 24 * 60 * 60 * 1000) {
  return Date.now() - this.updatedAt.getTime() > maxAge;
};

// Static method to find nearby cache
placeSchema.statics.findNearbyCache = async function(lat, lng, radius, maxDistance = null) {
  const searchDistance = maxDistance || radius * 0.1;
  
  const latDelta = searchDistance / 111320; // degrees latitude
  const lngDelta = searchDistance / (111320 * Math.cos(lat * Math.PI / 180)); // degrees longitude
  
  return this.findOne({
    latitude: { $gte: lat - latDelta, $lte: lat + latDelta },
    longitude: { $gte: lng - lngDelta, $lte: lng + lngDelta },
    radius: { $gte: radius * 0.8 },
    updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).sort({ updatedAt: -1 });
};

const Place = mongoose.model('Place', placeSchema);

export default Place;

// --- CacheConfig model ---
const cacheConfigSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    unique: true,
    enum: ['geoapify', 'google', 'mapbox']
  },
  enabled: {
    type: Boolean,
    default: true
  },
  cacheTTL: {
    type: Number,
    default: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  },
  memoryCacheTTL: {
    type: Number,
    default: 3600 // 1 hour in seconds
  },
  dailyQuotaLimit: {
    type: Number,
    required: true
  },
  quotaAlertThreshold: {
    type: Number,
    default: 80 // Alert at 80% usage
  },
  rateLimitPerMinute: {
    type: Number,
    default: 10
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  retryDelay: {
    type: Number,
    default: 1000 // milliseconds
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cacheConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CacheConfig = mongoose.model('CacheConfig', cacheConfigSchema);

export { CacheConfig };
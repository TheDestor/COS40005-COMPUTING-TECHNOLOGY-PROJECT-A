import axios from 'axios';

// GraphHopper routing controller
export const getRoute = async (req, res) => {
  try {
    const { start, end, waypoints = [], vehicle = 'car' } = req.body;
    
    // Validate required parameters
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end coordinates are required'
      });
    }

    // Get GraphHopper API key from environment
    const apiKey = process.env.VITE_GRAPHHOPPER;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GraphHopper API key not configured'
      });
    }

    // Build all points array
    const allPoints = [start, ...waypoints, end];
    
    // Build URL with multiple point parameters
    const pointParams = allPoints.map(point => `point=${point.lat},${point.lng}`).join('&');
    const url = `https://graphhopper.com/api/1/route?${pointParams}&vehicle=${vehicle}&instructions=false&calc_points=true&points_encoded=false&key=${apiKey}&type=json`;
    
    console.log(`GraphHopper API request: ${url}`);
    
    // Make request to GraphHopper API
    const response = await axios.get(url);
    
    if (!response.data.paths || response.data.paths.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No routes found'
      });
    }

    // Process the response
    const routes = response.data.paths.map((path, index) => {
      // Extract coordinates from different possible structures
      let coordinates = [];
      
      if (path.points && path.points.coordinates) {
        coordinates = path.points.coordinates;
      } else if (path.points && Array.isArray(path.points)) {
        coordinates = path.points;
      } else if (path.geometry && path.geometry.coordinates) {
        coordinates = path.geometry.coordinates;
      } else if (path.coordinates) {
        coordinates = path.coordinates;
      }

      return {
        index,
        distance: path.distance,
        duration: path.time / 1000, // Convert ms to seconds
        coordinates: coordinates.map(([lng, lat]) => [lat, lng]), // Convert to [lat, lng] for Leaflet
        vehicle,
        roadInfo: path.instructions ? path.instructions.map(instruction => ({
          road: instruction.street_name || 'Unknown Road',
          distance: instruction.distance,
          duration: instruction.time / 1000,
          direction: instruction.text
        })) : []
      };
    });

    res.json({
      success: true,
      routes,
      vehicle,
      totalRoutes: routes.length
    });

  } catch (error) {
    console.error('GraphHopper API error:', error.response?.data || error.message);
    
    // Handle different error types
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'GraphHopper API key is invalid or expired'
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'GraphHopper API rate limit exceeded'
      });
    } else if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        details: error.response.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'GraphHopper API request failed',
        error: error.message
      });
    }
  }
};

// Get route alternatives
export const getRouteAlternatives = async (req, res) => {
  try {
    const { start, end, waypoints = [], vehicle = 'car', alternatives = 3 } = req.body;
    
    // Validate required parameters
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end coordinates are required'
      });
    }

    // Get GraphHopper API key from environment
    const apiKey = process.env.VITE_GRAPHHOPPER;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GraphHopper API key not configured'
      });
    }

    // Build all points array
    const allPoints = [start, ...waypoints, end];
    
    // Build URL with multiple point parameters and alternatives
    const pointParams = allPoints.map(point => `point=${point.lat},${point.lng}`).join('&');
    const url = `https://graphhopper.com/api/1/route?${pointParams}&vehicle=${vehicle}&instructions=false&calc_points=true&points_encoded=false&key=${apiKey}&type=json&alternative_route.max_paths=${alternatives}`;
    
    console.log(`GraphHopper alternatives API request: ${url}`);
    
    // Make request to GraphHopper API
    const response = await axios.get(url);
    
    if (!response.data.paths || response.data.paths.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No routes found'
      });
    }

    // Process the response
    const routes = response.data.paths.map((path, index) => {
      // Extract coordinates from different possible structures
      let coordinates = [];
      
      if (path.points && path.points.coordinates) {
        coordinates = path.points.coordinates;
      } else if (path.points && Array.isArray(path.points)) {
        coordinates = path.points;
      } else if (path.geometry && path.geometry.coordinates) {
        coordinates = path.geometry.coordinates;
      } else if (path.coordinates) {
        coordinates = path.coordinates;
      }

      return {
        index,
        distance: path.distance,
        duration: path.time / 1000, // Convert ms to seconds
        coordinates: coordinates.map(([lng, lat]) => [lat, lng]), // Convert to [lat, lng] for Leaflet
        vehicle,
        roadInfo: path.instructions ? path.instructions.map(instruction => ({
          road: instruction.street_name || 'Unknown Road',
          distance: instruction.distance,
          duration: instruction.time / 1000,
          direction: instruction.text
        })) : []
      };
    });

    res.json({
      success: true,
      routes,
      vehicle,
      totalRoutes: routes.length
    });

  } catch (error) {
    console.error('GraphHopper alternatives API error:', error.response?.data || error.message);
    
    // Handle different error types
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'GraphHopper API key is invalid or expired'
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'GraphHopper API rate limit exceeded'
      });
    } else if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        details: error.response.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'GraphHopper API request failed',
        error: error.message
      });
    }
  }
};

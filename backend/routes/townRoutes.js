import express from 'express';
import mongoose from 'mongoose';
import Town from '../models/townModels.js'; // Fixed model import
import Attraction from '../models/townAttractions.js'; // Correct attraction model

const router = express.Router();

// Get town by slug
router.get('/:slug', async (req, res) => {
    try {
      // Exact match query
      const town = await mongoose.connection.db.collection('locations')
        .findOne({
          category: "Town",
          slug: req.params.slug // Case-sensitive match
        });
  
      if (!town) return res.status(404).json({ error: 'Town not found' });
      
      res.json({
        name: town.division,
        division: town.division,
        description: town.description,
        image: town.image,
        population: town.population,
        area: town.area
      });
      
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  export default router;
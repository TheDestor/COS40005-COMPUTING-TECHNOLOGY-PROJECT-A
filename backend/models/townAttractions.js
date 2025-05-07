import mongoose from 'mongoose';

const attractionSchema = new mongoose.Schema({
  name: String,
  type: String,
  division: String,
  description: String,
  image: String,
  url: String
});

export default mongoose.model('Attraction', attractionSchema);
import mongoose from 'mongoose';

const townSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    division: { type: String, required: true },
    description: { type: String, required: true },
    image: String,
  });

export default mongoose.model('Town', townSchema);
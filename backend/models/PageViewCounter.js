import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'global' },
  totalCount: { type: Number, default: 0 },
}, { timestamps: true });

export const PageViewCounter = mongoose.models.PageViewCounter || mongoose.model('PageViewCounter', pageViewSchema);
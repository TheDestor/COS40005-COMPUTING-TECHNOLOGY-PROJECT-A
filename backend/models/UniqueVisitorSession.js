import mongoose from 'mongoose';

const uniqueVisitorSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userAgent: { type: String },
  ip: { type: String }
}, { timestamps: true });

export const UniqueVisitorSession = mongoose.models.UniqueVisitorSession || mongoose.model('UniqueVisitorSession', uniqueVisitorSessionSchema);
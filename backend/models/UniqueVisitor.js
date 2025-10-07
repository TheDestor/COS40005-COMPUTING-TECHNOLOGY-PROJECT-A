import mongoose from 'mongoose';

const uniqueVisitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userAgent: { type: String, default: '' },
  ipHash: { type: String, default: '' },
  firstSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export const UniqueVisitor = mongoose.models.UniqueVisitor || mongoose.model('UniqueVisitor', uniqueVisitorSchema);
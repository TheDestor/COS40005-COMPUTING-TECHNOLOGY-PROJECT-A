import mongoose from 'mongoose';

const apiUsageSchema = new mongoose.Schema({
  provider: String,
  endpoint: String,
  success: Boolean,
  errorMessage: String,
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  role: { type: String, enum: ['tourist','business','cbt_admin','system_admin'], default: null },
  email: { type: String, index: true, default: null },
  device: { type: String, default: null },
});

const ApiUsage = mongoose.model('ApiUsage', apiUsageSchema);

export default ApiUsage;
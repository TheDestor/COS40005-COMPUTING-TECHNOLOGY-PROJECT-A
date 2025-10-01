import mongoose from 'mongoose';

const apiUsageSchema = new mongoose.Schema({
  provider: String,
  endpoint: String,
  success: Boolean,
  errorMessage: String,
  timestamp: { type: Date, default: Date.now }
});

const ApiUsage = mongoose.model('ApiUsage', apiUsageSchema);

export default ApiUsage;
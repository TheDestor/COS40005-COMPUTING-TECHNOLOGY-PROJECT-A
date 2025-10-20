import ApiUsage from '../models/ApiUsage.js';
// logAdminUsage()
import { authInfo, authWarn } from '../utils/logger.js';

export const logAdminUsage = (label) => (req, res, next) => {
  const start = Date.now();
  const ua = req.headers['user-agent'] || 'unknown';
  const endpoint = label || req.originalUrl;

  res.on('finish', () => {
    try {
      const success = res.statusCode < 400;
      const meta = {
        endpoint,
        status: res.statusCode,
        userId: req.user || null,
        role: req.role || null,
        duration_ms: Date.now() - start,
        device: ua,
      };
      if (!success) authWarn('admin_endpoint_error', meta);
      else authInfo('admin_endpoint_call', meta);
    } catch {
      // swallow logging errors to avoid impact on responses
    }
  });

  next();
};
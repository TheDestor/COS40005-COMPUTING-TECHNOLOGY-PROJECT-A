import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});

export const googleAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many Google auth attempts. Slow down.' },
});

export const refreshLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many token refreshes.' },
});

export const uniqueVisitorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many unique visitor session events.' },
});

// Map-related rate limiters
export const graphHopperRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many routing requests. Please slow down.' },
});

export const graphHopperAlternativesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many alternative route requests. Please slow down.' },
});

export const geoapifyNearbyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many nearby places requests. Try again later.' },
});

export const geoapifyRefreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 4,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Cache refresh rate limit exceeded. Try again later.' },
});

export const geoapifyUsageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many usage stats requests.' },
});

export const geoapifyAdminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin cache operations.' },
});

export const nominatimLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many Nominatim search requests. Please slow down.' },
});

export const locationsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many locations requests.' },
});

export const eventsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many events requests.' },
});

export const businessesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many businesses requests.' },
});

// Auth-related new limiters
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Try again later.' },
});

export const businessRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many business registrations. Try again later.' },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Try again later.' },
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset attempts. Try again later.' },
});

// User-related new limiters
export const updatePasswordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password change attempts. Slow down.' },
});

export const updateProfileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many profile updates. Slow down.' },
});

export const contactUsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many contact form submissions. Try again later.' },
});

// Newsletter new limiter
export const newsletterSubscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many newsletter subscriptions. Try again later.' },
});

// AI chat new limiter
// aiChatLimiter: add handler + env-config to expose Retry-After and structured JSON
export const aiChatLimiter = rateLimit({
  windowMs: Number(process.env.AI_CHAT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.AI_CHAT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /*, next*/) => {
    const windowMs = Number(process.env.AI_CHAT_WINDOW_MS) || 60 * 1000;
    const retryMs =
      req.rateLimit?.resetTime instanceof Date
        ? Math.max(0, req.rateLimit.resetTime.getTime() - Date.now())
        : windowMs;
    const retryAfterSeconds = Math.ceil(retryMs / 1000);

    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many AI chat requests. Slow down.',
      retryAfterSeconds,
    });
  },
  message: { success: false, message: 'Too many AI chat requests. Slow down.' },
});

import ApiUsage from '../models/ApiUsage.js';
import { authWarn } from '../utils/logger.js';

// Helper to build admin limiters with unified 429 handling and auditing
const createAdminLimiter = ({ name, windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res /*, next*/) => {
      const retryMs =
        req.rateLimit?.resetTime instanceof Date
          ? Math.max(0, req.rateLimit.resetTime.getTime() - Date.now())
          : windowMs;
      const retryAfterSeconds = Math.ceil(retryMs / 1000);

      authWarn('admin_rate_limited', {
        name,
        endpoint: req.originalUrl,
        userId: req.user || null,
        role: req.role || null,
        retryAfterSeconds,
      });

      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: message || `Too many ${name} requests. Try again later.`,
        retryAfterSeconds,
      });
    },
    message: { success: false, message: message || `Too many ${name} requests.` },
  });

// ===== Admin-specific limiters (configurable via env) =====
export const adminMetricsLimiter = createAdminLimiter({
  name: 'admin_metrics',
  windowMs: Number(process.env.ADMIN_METRICS_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_METRICS_MAX) || 60,
  message: 'Too many admin metrics requests.',
});

export const adminDashboardLimiter = createAdminLimiter({
  name: 'admin_dashboard',
  windowMs: Number(process.env.ADMIN_DASHBOARD_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_DASHBOARD_MAX) || 45,
  message: 'Too many dashboard stats requests.',
});

export const adminBackupStatusLimiter = createAdminLimiter({
  name: 'admin_backup_status',
  windowMs: Number(process.env.ADMIN_BACKUP_STATUS_WINDOW_MS) || 30 * 1000,
  max: Number(process.env.ADMIN_BACKUP_STATUS_MAX) || 12,
  message: 'Too many backup status checks.',
});

export const adminBackupRunLimiter = createAdminLimiter({
  name: 'admin_backup_run',
  windowMs: Number(process.env.ADMIN_BACKUP_RUN_WINDOW_MS) || 10 * 60 * 1000,
  max: Number(process.env.ADMIN_BACKUP_RUN_MAX) || 2,
  message: 'Backup run rate limit exceeded.',
});

export const adminBackupListLimiter = createAdminLimiter({
  name: 'admin_backup_list',
  windowMs: Number(process.env.ADMIN_BACKUP_LIST_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_BACKUP_LIST_MAX) || 30,
  message: 'Too many backup list requests.',
});

export const adminBackupDownloadLimiter = createAdminLimiter({
  name: 'admin_backup_download',
  windowMs: Number(process.env.ADMIN_BACKUP_DOWNLOAD_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_BACKUP_DOWNLOAD_MAX) || 20,
  message: 'Too many backup downloads.',
});

export const adminBackupDeleteLimiter = createAdminLimiter({
  name: 'admin_backup_delete',
  windowMs: Number(process.env.ADMIN_BACKUP_DELETE_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_BACKUP_DELETE_MAX) || 10,
  message: 'Too many backup delete requests.',
});

export const adminUserListLimiter = createAdminLimiter({
  name: 'admin_user_list',
  windowMs: Number(process.env.ADMIN_USER_LIST_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_USER_LIST_MAX) || 30,
  message: 'Too many user listing requests.',
});

export const adminUserModifyLimiter = createAdminLimiter({
  name: 'admin_user_modify',
  windowMs: Number(process.env.ADMIN_USER_MODIFY_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_USER_MODIFY_MAX) || 15,
  message: 'Too many user modification requests.',
});

export const adminEventModifyLimiter = createAdminLimiter({
  name: 'admin_event_modify',
  windowMs: Number(process.env.ADMIN_EVENT_MODIFY_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_EVENT_MODIFY_MAX) || 10,
  message: 'Too many event modification requests.',
});

export const adminEventDeleteLimiter = createAdminLimiter({
  name: 'admin_event_delete',
  windowMs: Number(process.env.ADMIN_EVENT_DELETE_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_EVENT_DELETE_MAX) || 10,
  message: 'Too many event delete requests.',
});

export const adminBusinessReadLimiter = createAdminLimiter({
  name: 'admin_business_read',
  windowMs: Number(process.env.ADMIN_BUSINESS_READ_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_BUSINESS_READ_MAX) || 30,
  message: 'Too many admin business reads.',
});

export const adminBusinessModifyLimiter = createAdminLimiter({
  name: 'admin_business_modify',
  windowMs: Number(process.env.ADMIN_BUSINESS_MODIFY_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_BUSINESS_MODIFY_MAX) || 15,
  message: 'Too many business modification requests.',
});

export const adminLocationModifyLimiter = createAdminLimiter({
  name: 'admin_location_modify',
  windowMs: Number(process.env.ADMIN_LOCATION_MODIFY_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_LOCATION_MODIFY_MAX) || 20,
  message: 'Too many location modification requests.',
});

export const adminInquiryReadLimiter = createAdminLimiter({
  name: 'admin_inquiry_read',
  windowMs: Number(process.env.ADMIN_INQUIRY_READ_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_INQUIRY_READ_MAX) || 30,
  message: 'Too many admin inquiry reads.',
});

export const adminInquiryModifyLimiter = createAdminLimiter({
  name: 'admin_inquiry_modify',
  windowMs: Number(process.env.ADMIN_INQUIRY_MODIFY_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_INQUIRY_MODIFY_MAX) || 30,
  message: 'Too many inquiry modification requests.',
});
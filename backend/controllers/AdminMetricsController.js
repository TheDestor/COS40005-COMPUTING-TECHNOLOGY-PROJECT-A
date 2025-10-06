import mongoose from 'mongoose';
import { userModel } from '../models/UserModel.js';
import { PageViewCounter } from '../models/PageViewCounter.js';
// Removed: import { UniquePageView } from '../models/UniquePageView.js';

export const getAdminMetrics = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments({});

    const [active, inactive, suspended] = await Promise.all([
      userModel.countDocuments({ accountStatus: 'active' }),
      userModel.countDocuments({ accountStatus: 'inactive' }),
      userModel.countDocuments({ accountStatus: 'suspended' }),
    ]);

    const roles = ['tourist', 'business', 'cbt_admin', 'system_admin'];
    const rolesBreakdown = {};
    await Promise.all(roles.map(async (r) => { rolesBreakdown[r] = await userModel.countDocuments({ role: r }); }));

    // Total unique visitors (session-scoped)
    const uvc = await PageViewCounter.findOne({ key: 'unique_session_visitors' });
    const totalUniqueVisitors = uvc?.totalCount || 0;

    // DB storage %
    const db = mongoose.connection.db;
    const stats = await db.stats();
    const dataSize = Number(stats?.dataSize || 0);
    const storageSize = Number(stats?.storageSize || dataSize || 1);
    const dbStoragePercent = storageSize > 0 ? Math.min(100, Math.max(0, (dataSize / storageSize) * 100)) : 0;

    const recaptchaBlocked = 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        userStatusBreakdown: { active, inactive, suspended },
        rolesBreakdown,
        totalUniqueVisitors,
        dbStoragePercent,
        recaptchaBlocked,
      }
    });
  } catch (error) {
    console.error('getAdminMetrics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin metrics' });
  }
};
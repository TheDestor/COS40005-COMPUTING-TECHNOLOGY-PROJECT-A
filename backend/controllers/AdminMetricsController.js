import mongoose from 'mongoose';
import { userModel } from '../models/UserModel.js';
import { PageViewCounter } from '../models/PageViewCounter.js';
import { UniqueVisitor } from '../models/UniqueVisitor.js';

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

    // Today window (server-local day boundaries)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [newUsersToday, uniqueVisitorsToday] = await Promise.all([
      userModel.countDocuments({ createdAt: { $gte: startOfDay } }),
      UniqueVisitor.countDocuments({ createdAt: { $gte: startOfDay } })
    ]);

    // Persistent visitors (database-backed total)
    const uvcPersistent = await PageViewCounter.findOne({ key: 'unique_visitors' });
    const totalUniqueVisitors = uvcPersistent?.totalCount ?? 0;
    
    // Session-scoped page views (fallback/aux metric)
    const uvcSession = await PageViewCounter.findOne({ key: 'unique_session_visitors' });
    const totalPageViews = uvcSession?.totalCount ?? totalUniqueVisitors;

    const db = mongoose.connection.db;
    const stats = await db.stats();
    const dataSize = Number(stats?.dataSize || 0);
    const storageSize = Number(stats?.storageSize || dataSize || 1);
    const dbStoragePercent = storageSize > 0 ? Math.min(100, Math.max(0, (dataSize / storageSize) * 100)) : 0;

    // Per-collection stats and total bytes
    const collections = await db.listCollections().toArray();
    const collectionStats = [];
    for (const c of collections) {
      try {
        const s = await db.command({ collStats: c.name });
        collectionStats.push({
          name: c.name,
          sizeBytes: Number(s.size || 0),
          count: Number(s.count || 0),
        });
      } catch {
        collectionStats.push({ name: c.name, sizeBytes: 0, count: 0 });
      }
    }
    const totalDataSizeBytes = collectionStats.reduce((sum, c) => sum + c.sizeBytes, 0);

    const recaptchaBlocked = 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        userStatusBreakdown: { active, inactive, suspended },
        rolesBreakdown,
        // New KPIs
        newUsersToday,
        uniqueVisitorsToday,
        totalUniqueVisitors,
        totalPageViews,
        dbStoragePercent,
        recaptchaBlocked,
        // Database stats for DataManagementPage
        totalDataSizeBytes,
        collections: collectionStats,
      }
    });
  } catch (error) {
    console.error('getAdminMetrics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin metrics' });
  }
};
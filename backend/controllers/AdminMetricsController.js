import mongoose from 'mongoose';
import { userModel } from '../models/UserModel.js';
import { PageViewCounter } from '../models/PageViewCounter.js';
import { UniqueVisitor } from '../models/UniqueVisitor.js';
import ApiUsage from '../models/ApiUsage.js';

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

export const getSecurityMetrics = async (req, res) => {
  try {
    const now = new Date();
    const startCurrent = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startPrev = new Date(startCurrent.getTime() - 24 * 60 * 60 * 1000);
  
    // Include both password and Google logins
    const endpoints = ['/login', '/google-login'];
  
    const countSignIns = async (role, start, end) => (
      ApiUsage.countDocuments({
        provider: 'auth',
        endpoint: { $in: endpoints },
        success: true,
        role,
        timestamp: { $gte: start, $lt: end }
      })
    );
  
    const [
      userRegularCurr, userBusinessCurr, adminCBTCurr, adminSystemCurr,
      userRegularPrev, userBusinessPrev, adminCBTPrev, adminSystemPrev,
    ] = await Promise.all([
      countSignIns('tourist', startCurrent, now),
      countSignIns('business', startCurrent, now),
      countSignIns('cbt_admin', startCurrent, now),
      countSignIns('system_admin', startCurrent, now),
  
      countSignIns('tourist', startPrev, startCurrent),
      countSignIns('business', startPrev, startCurrent),
      countSignIns('cbt_admin', startPrev, startCurrent),
      countSignIns('system_admin', startPrev, startCurrent),
    ]);
  
    const failedCurr = await ApiUsage.countDocuments({
      provider: 'auth',
      endpoint: { $in: endpoints },
      success: false,
      timestamp: { $gte: startCurrent, $lt: now }
    });
    const failedPrev = await ApiUsage.countDocuments({
      provider: 'auth',
      endpoint: { $in: endpoints },
      success: false,
      timestamp: { $gte: startPrev, $lt: startCurrent }
    });
  
    return res.status(200).json({
      success: true,
      data: {
        userRegularSignIns24h: userRegularCurr,
        userBusinessSignIns24h: userBusinessCurr,
        adminCBTSignIns24h: adminCBTCurr,
        adminSystemSignIns24h: adminSystemCurr,
        failedLoginAttempts24h: failedCurr,
        deltaUserRegular: userRegularCurr - userRegularPrev,
        deltaUserBusiness: userBusinessCurr - userBusinessPrev,
        deltaAdminCBT: adminCBTCurr - adminCBTPrev,
        deltaAdminSystem: adminSystemCurr - adminSystemPrev,
        deltaFailedLogins: failedCurr - failedPrev,
      }
    });
  } catch (error) {
    console.error('getSecurityMetrics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch security metrics' });
  }
};

export const getSecuritySessions = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const sessions = await ApiUsage.find({ provider: 'auth', endpoint: { $in: ['/login', '/google-login'] } })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .select('email device success timestamp role endpoint errorMessage');

    res.json({ success: true, data: sessions.map(s => ({
      email: s.email || '—',
      device: s.device || '—',
      time: s.timestamp,
      status: s.success ? 'Success' : 'Failure',
      role: s.role || null,
      method: s.endpoint === '/google-login' ? 'Google' : 'Password',
      endpoint: s.endpoint,
      errorMessage: s.errorMessage || null,
    })) });
  } catch (e) {
    console.error('getSecuritySessions error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch security sessions.' });
  }
};
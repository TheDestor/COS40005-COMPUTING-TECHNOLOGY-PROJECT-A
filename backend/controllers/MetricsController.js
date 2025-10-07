// MetricsController.js
import { PageViewCounter } from '../models/PageViewCounter.js';
import crypto from 'crypto';
import { UniqueVisitor } from '../models/UniqueVisitor.js';

export const recordUniqueVisitor = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = 'visitor_id';
    let visitorId = req.cookies?.[cookieName];

    // If missing, mint a new ID and set a long-lived, privacy-safe cookie
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      res.cookie(cookieName, visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        path: '/',
      });
    }

    // First-time vs returning logic
    const existing = await UniqueVisitor.findOne({ visitorId });
    let firstVisit = false;

    if (!existing) {
      const rawIp = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
      const userAgent = req.get('user-agent') || '';
      const ipHash = rawIp ? crypto.createHash('sha256').update(rawIp).digest('hex') : '';
      const userId = req.user || null; // set by attachUserIfPresent when available

      await UniqueVisitor.create({ visitorId, userId, userAgent, ipHash });

      const doc = await PageViewCounter.findOneAndUpdate(
        { key: 'unique_visitors' },
        { $inc: { totalCount: 1 } },
        { new: true, upsert: true }
      );

      firstVisit = true;
      return res.status(200).json({
        success: true,
        firstVisit,
        visitorId,
        totalUniqueVisitors: doc.totalCount
      });
    }

    const pv = await PageViewCounter.findOne({ key: 'unique_visitors' });
    return res.status(200).json({
      success: true,
      firstVisit,
      visitorId,
      totalUniqueVisitors: pv?.totalCount || 0
    });
  } catch (error) {
    console.error('recordUniqueVisitor error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record unique visitor' });
  }
};
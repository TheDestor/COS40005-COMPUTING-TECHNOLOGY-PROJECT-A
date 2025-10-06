// MetricsController.js
import { PageViewCounter } from '../models/PageViewCounter.js';
// import { UniquePageView } from '../models/UniquePageView.js';
import { UniqueVisitorSession } from '../models/UniqueVisitorSession.js';

export const incrementPageView = async (req, res) => {
  try {
    const doc = await PageViewCounter.findOneAndUpdate(
      { key: 'global' },
      { $inc: { totalCount: 1 } },
      { new: true, upsert: true }
    );
    return res.status(200).json({ success: true, totalPageViews: doc.totalCount });
  } catch (error) {
    console.error('incrementPageView error:', error);
    return res.status(500).json({ success: false, message: 'Failed to increment page views' });
  }
};

// export const recordUniquePageView = async (req, res) => {
//   try {
//     const route = String(req.body?.route || req.headers['x-route'] || '');
//     if (!route) return res.status(400).json({ success: false, message: 'Route is required' });

//     const visitorId = String(req.headers['x-visitor-id'] || req.user || req.ip);

//     const now = new Date();
//     const dayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

//     // Attempt to insert unique view (deduped by unique index)
//     try {
//       await UniquePageView.create({ visitorId, route, dayUTC, userAgent: req.get('user-agent') || '', ip: req.ip });

//       // On first unique view of the day for this visitor/route, increment global counter
//       const doc = await PageViewCounter.findOneAndUpdate(
//         { key: 'global' },
//         { $inc: { totalCount: 1 } },
//         { new: true, upsert: true }
//       );

//       return res.status(200).json({ success: true, uniqueCounted: true, totalPageViews: doc.totalCount });
//     } catch (e) {
//       // Duplicate key => already counted for this visitor/route/day
//       if (e?.code === 11000) {
//         const pv = await PageViewCounter.findOne({ key: 'global' });
//         return res.status(200).json({ success: true, uniqueCounted: false, totalPageViews: pv?.totalCount || 0 });
//       }
//       throw e;
//     }
//   } catch (error) {
//     console.error('recordUniquePageView error:', error);
//     return res.status(500).json({ success: false, message: 'Failed to record unique page view' });
//   }
// };

export const recordUniqueVisitorSession = async (req, res) => {
  try {
    const sessionId = String(req.headers['x-session-id'] || '');
    if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID is required' });

    try {
      await UniqueVisitorSession.create({ sessionId, userAgent: req.get('user-agent') || '', ip: req.ip });

      // Increment website-wide unique visitor session counter on first session
      const doc = await PageViewCounter.findOneAndUpdate(
        { key: 'unique_session_visitors' },
        { $inc: { totalCount: 1 } },
        { new: true, upsert: true }
      );

      return res.status(200).json({ success: true, uniqueCounted: true, totalUniqueVisitors: doc.totalCount });
    } catch (e) {
      if (e?.code === 11000) {
        // Already counted for this session
        const pv = await PageViewCounter.findOne({ key: 'unique_session_visitors' });
        return res.status(200).json({ success: true, uniqueCounted: false, totalUniqueVisitors: pv?.totalCount || 0 });
      }
      throw e;
    }
  } catch (error) {
    console.error('recordUniqueVisitorSession error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record unique visitor session' });
  }
};
import { put, list, del } from '@vercel/blob';
import mongoose from 'mongoose';

const formatMYT = (date) => {
  try {
    return date.toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch {
    return date.toISOString();
  }
};

export const runBackup = async (req, res) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ success: false, message: 'Missing BLOB_READ_WRITE_TOKEN' });
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const data = {};

    for (const c of collections) {
      const name = c.name;
      const col = db.collection(name);
      const docs = await col.find({}).toArray();
      data[name] = docs;
    }

    const now = new Date();
    const baseMYT = now.toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur', hour12: false });
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const tsMYT = baseMYT.replace(' ', 'T').replace(/:/g, '-') + `.${ms}`;
    const filename = `backup-${tsMYT}.json`;

    const { url } = await put(filename, JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: true,
    });

    const createdMYT = formatMYT(now);
    console.log(`[Backup] Created: ${filename} at ${createdMYT} (MYT)`);

    return res.json({ success: true, filename, createdMYT, url });

  } catch (e) {
    console.error('runBackup error', e);
    return res.status(500).json({ success: false, message: 'Backup failed', error: e.message });
  }
};

export const listBackups = async (req, res) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ success: false, message: 'Missing BLOB_READ_WRITE_TOKEN' });
    }

    const { blobs } = await list();
    const backupFiles = blobs
      .filter(f => f.pathname.startsWith('backup-') && f.pathname.endsWith('.json'))
      .map(blob => ({
        name: blob.pathname,
        size: blob.size,
        createdAt: blob.uploadedAt.toISOString(),
        createdMYT: formatMYT(blob.uploadedAt),
        url: blob.url,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(backupFiles);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'List failed', error: e.message });
  }
};

export const downloadBackup = async (req, res) => {
  try {
    const name = req.params.filename;
    if (!name || name.includes('..')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const { blobs } = await list({ prefix: name });
    const backupFile = blobs.find(b => b.pathname === name);

    if (!backupFile) {
      return res.status(404).json({ message: 'Not found' });
    }

    console.log(`[Backup] Download requested for ${name} at ${formatMYT(new Date())} (MYT)`);
    res.redirect(backupFile.url);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Download failed', error: e.message });
  }
};

export const getBackupStatus = async (req, res) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ success: false, message: 'Missing BLOB_READ_WRITE_TOKEN' });
    }

    const { blobs } = await list();
    const backupFiles = blobs
      .filter(f => f.pathname.startsWith('backup-') && f.pathname.endsWith('.json'))
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    if (backupFiles.length === 0) {
      return res.json({ lastBackupAt: null, lastBackupAtMYT: null, isOutdated: true });
    }

    const latest = backupFiles[0];
    const lastBackupAt = latest.uploadedAt.toISOString();
    const lastBackupAtMYT = formatMYT(latest.uploadedAt);
    const ageMs = Date.now() - latest.uploadedAt.getTime();
    const isOutdated = ageMs > 24 * 60 * 60 * 1000; // older than 24h

    console.log(`[Backup] Status checked at ${formatMYT(new Date())} (MYT). Last backup: ${lastBackupAtMYT}`);
    return res.json({ lastBackupAt, lastBackupAtMYT, isOutdated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Status failed', error: e.message });
  }
};

export const deleteBackup = async (req, res) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ success: false, message: 'Missing BLOB_READ_WRITE_TOKEN' });
    }

    const name = req.params.filename;
    if (!name || name.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    if (!name.endsWith('.json') || !name.startsWith('backup-')) {
      return res.status(400).json({ success: false, message: 'Invalid backup filename' });
    }

    const { blobs } = await list({ prefix: name });
    const backupFile = blobs.find(b => b.pathname === name);

    if (!backupFile) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    await del(backupFile.url);
    console.log(`[Backup] Deleted: ${name} at ${formatMYT(new Date())} (MYT)`);
    return res.json({ success: true, name });

  } catch (e) {
    console.error('deleteBackup error', e);
    return res.status(500).json({ success: false, message: 'Delete failed', error: e.message });
  }
};
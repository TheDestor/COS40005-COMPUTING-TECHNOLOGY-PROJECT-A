import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupsDir = path.resolve(__dirname, '..', 'backups');

const ensureDir = () => {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
};

export const runBackup = async (req, res) => {
  try {
    ensureDir();
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const data = {};

    for (const c of collections) {
      const name = c.name;
      const col = db.collection(name);
      const docs = await col.find({}).toArray();
      data[name] = docs;
    }

    // Use Malaysia time (MYT) for filename instead of UTC
    const now = new Date();
    const baseMYT = now.toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur', hour12: false }); // YYYY-MM-DD HH:mm:ss
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const tsMYT = baseMYT.replace(' ', 'T').replace(/:/g, '-') + `.${ms}`; // YYYY-MM-DDTHH-mm-ss.mmm
    const filename = `backup-${tsMYT}.json`;
    const filePath = path.join(backupsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    const stat = fs.statSync(filePath);
    const createdMYT = formatMYT(stat.mtime);
    console.log(`[Backup] Created: ${filename} at ${createdMYT} (MYT)`);

    return res.json({ success: true, filename, createdMYT });
  } catch (e) {
    console.error('runBackup error', e);
    return res.status(500).json({ success: false, message: 'Backup failed', error: e.message });
  }
};

export const listBackups = (req, res) => {
  try {
    ensureDir();
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));
    const list = files.map(name => {
      const fp = path.join(backupsDir, name);
      const s = fs.statSync(fp);
      const createdAtDate = s.mtime;
      return {
        name,
        size: s.size,
        createdAt: createdAtDate.toISOString(),
        createdMYT: formatMYT(createdAtDate),
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'List failed', error: e.message });
  }
};

export const downloadBackup = (req, res) => {
  try {
    ensureDir();
    const name = req.params.filename;
    if (!name || name.includes('..')) return res.status(400).json({ message: 'Invalid filename' });
    const fp = path.join(backupsDir, name);
    if (!fs.existsSync(fp)) return res.status(404).json({ message: 'Not found' });
    console.log(`[Backup] Download requested for ${name} at ${formatMYT(new Date())} (MYT)`);
    res.download(fp);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Download failed', error: e.message });
  }
};

export const getBackupStatus = (req, res) => {
  try {
    ensureDir();
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) return res.json({ lastBackupAt: null, lastBackupAtMYT: null, isOutdated: true });
    const latest = files
      .map(name => ({ name, mtime: fs.statSync(path.join(backupsDir, name)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)[0];
    const lastBackupAt = latest.mtime.toISOString();
    const lastBackupAtMYT = formatMYT(latest.mtime);
    const ageMs = Date.now() - latest.mtime.getTime();
    const isOutdated = ageMs > 24 * 60 * 60 * 1000; // older than 24h
    console.log(`[Backup] Status checked at ${formatMYT(new Date())} (MYT). Last backup: ${lastBackupAtMYT}`);
    return res.json({ lastBackupAt, lastBackupAtMYT, isOutdated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Status failed', error: e.message });
  }
};

export const deleteBackup = (req, res) => {
  try {
    ensureDir();
    const name = req.params.filename;
    if (!name || name.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }
    if (!name.endsWith('.json') || !name.startsWith('backup-')) {
      return res.status(400).json({ success: false, message: 'Invalid backup filename' });
    }
    const fp = path.join(backupsDir, name);
    if (!fs.existsSync(fp)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    fs.unlinkSync(fp);
    console.log(`[Backup] Deleted: ${name} at ${formatMYT(new Date())} (MYT)`);
    return res.json({ success: true, name });
  } catch (e) {
    console.error('deleteBackup error', e);
    return res.status(500).json({ success: false, message: 'Delete failed', error: e.message });
  }
};

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
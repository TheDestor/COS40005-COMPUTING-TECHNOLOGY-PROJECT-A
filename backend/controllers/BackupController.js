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

    const ts = new Date().toISOString().replace(/[:]/g, '-');
    const filename = `backup-${ts}.json`;
    const filePath = path.join(backupsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return res.json({ success: true, filename });
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
      return { name, size: s.size, createdAt: s.mtime.toISOString() };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    res.download(fp);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Download failed', error: e.message });
  }
};

export const getBackupStatus = (req, res) => {
  try {
    ensureDir();
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) return res.json({ lastBackupAt: null, isOutdated: true });
    const latest = files
      .map(name => ({ name, mtime: fs.statSync(path.join(backupsDir, name)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)[0];
    const lastBackupAt = latest.mtime.toISOString();
    const ageMs = Date.now() - latest.mtime.getTime();
    const isOutdated = ageMs > 24 * 60 * 60 * 1000; // older than 24h
    return res.json({ lastBackupAt, isOutdated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Status failed', error: e.message });
  }
};
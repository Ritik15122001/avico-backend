import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { put, list, del } from '@vercel/blob';
import { requireAuth } from '../middleware/auth.js';

// On Vercel the filesystem is read-only and wiped between invocations, so uploads
// go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set. Locally they stay on disk.
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_PREFIX = 'uploads/';

const UPLOAD_DIR = path.resolve('uploads');
if (!USE_BLOB) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const safeName = (originalname) => {
  const base = path
    .basename(originalname, path.extname(originalname))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const ext = path.extname(originalname).toLowerCase() || '.jpg';
  return `${base || 'image'}-${crypto.randomBytes(4).toString('hex')}${ext}`;
};

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']);

// Browsers send a real image/* type. Some clients send application/octet-stream,
// so fall back to the extension in that one case rather than rejecting outright.
const isImage = (file) => {
  if (ALLOWED.has(file.mimetype)) return true;
  const ext = path.extname(file.originalname).toLowerCase();
  return file.mimetype === 'application/octet-stream' && ALLOWED_EXT.has(ext);
};

const upload = multer({
  storage: USE_BLOB
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOAD_DIR),
        filename: (req, file, cb) => cb(null, safeName(file.originalname)),
      }),
  // Vercel functions accept request bodies up to 4.5 MB
  limits: { fileSize: (USE_BLOB ? 4 : 8) * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    isImage(file) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WebP, AVIF or SVG images are allowed')),
});

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  if (!USE_BLOB) return res.status(201).json({ url: `/uploads/${req.file.filename}`, size: req.file.size });
  try {
    const blob = await put(BLOB_PREFIX + safeName(req.file.originalname), req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
    });
    res.status(201).json({ url: blob.url, size: req.file.size });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  if (USE_BLOB) {
    try {
      const { blobs } = await list({ prefix: BLOB_PREFIX });
      return res.json(
        blobs
          .map((b) => ({ url: b.url, size: b.size, at: b.uploadedAt }))
          .sort((a, b) => new Date(b.at) - new Date(a.at)),
      );
    } catch (err) {
      return next(err);
    }
  }
  const files = fs
    .readdirSync(UPLOAD_DIR)
    .filter((f) => !f.startsWith('.'))
    .map((f) => {
      const s = fs.statSync(path.join(UPLOAD_DIR, f));
      return { url: `/uploads/${f}`, size: s.size, at: s.mtime };
    })
    .sort((a, b) => b.at - a.at);
  res.json(files);
});

router.delete('/:name', requireAuth, async (req, res, next) => {
  // never let a crafted name escape the uploads directory
  const safe = path.basename(req.params.name);
  if (USE_BLOB) {
    try {
      const { blobs } = await list({ prefix: BLOB_PREFIX + safe });
      const hit = blobs.find((b) => b.pathname === BLOB_PREFIX + safe);
      if (!hit) return res.status(404).json({ error: 'Not found' });
      await del(hit.url);
      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  }
  const target = path.join(UPLOAD_DIR, safe);
  if (!target.startsWith(UPLOAD_DIR) || !fs.existsSync(target)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(target);
  res.json({ ok: true });
});

export default router;

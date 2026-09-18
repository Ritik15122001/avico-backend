import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';

const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const base = path
        .basename(file.originalname, path.extname(file.originalname))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${base || 'image'}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    isImage(file) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WebP, AVIF or SVG images are allowed')),
});

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.status(201).json({ url: `/uploads/${req.file.filename}`, size: req.file.size });
});

router.get('/', requireAuth, (req, res) => {
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

router.delete('/:name', requireAuth, (req, res) => {
  // never let a crafted name escape the uploads directory
  const safe = path.basename(req.params.name);
  const target = path.join(UPLOAD_DIR, safe);
  if (!target.startsWith(UPLOAD_DIR) || !fs.existsSync(target)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(target);
  res.json({ ok: true });
});

export default router;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';

import { connectDB } from './lib/db.js';
import { crudRouter } from './lib/crud.js';
import { notFound, errorHandler } from './middleware/error.js';

import { Category } from './models/Category.js';
import { Product } from './models/Product.js';
import { Industry } from './models/Industry.js';
import { Post } from './models/Post.js';
import { HeroSlide } from './models/HeroSlide.js';
import { Testimonial } from './models/Testimonial.js';

import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import settingsRoutes from './routes/settings.js';
import enquiryRoutes, { subscriberRouter } from './routes/enquiries.js';
import statsRoutes from './routes/stats.js';

const app = express();
const isDev = process.env.NODE_ENV !== 'production';
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

if (!isDev && !origins.length) {
  console.warn('[cors] CORS_ORIGINS is empty in production — every browser request will be refused.');
}

// Entries may be exact ("https://avico.com") or a wildcard ("https://*.vercel.app")
// so preview deployments do not each need adding by hand.
const matches = (origin, pattern) => {
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return origin === pattern;
  const re = new RegExp('^' + pattern.split('*').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
  return re.test(origin);
};

const allowOrigin = (origin) => {
  if (!origin) return true;                                  // curl, server-to-server, health checks
  if (origins.some((p) => matches(origin, p))) return true;
  // in development any localhost port is fine, so dev servers can move freely
  return isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

app.use(
  cors({
    origin: (origin, cb) => {
      if (allowOrigin(origin)) return cb(null, true);
      // A refused origin is a configuration problem, not a server fault — say so
      // with a 403 and a message that names the fix, instead of a blank 500.
      console.warn(`[cors] refused origin: ${origin} (allowed: ${origins.join(', ') || 'none'})`);
      const err = new Error(`Origin ${origin} is not allowed. Add it to the CORS_ORIGINS environment variable.`);
      err.status = 403;
      return cb(err);
    },
  }),
);

// Serverless: each cold start must connect before handling a request. connectDB
// caches the promise, so warm invocations reuse the open connection.
app.use(async (req, res, next) => {
  try {
    await connectDB(process.env.MONGODB_URI);
    next();
  } catch (err) {
    next(err);
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d' }));

app.get('/api/health', (req, res) => res.json({ ok: true, at: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/subscribers', subscriberRouter);
app.use('/api/stats', statsRoutes);

app.use('/api/categories', crudRouter(Category, { lookup: 'slug' }));
app.use('/api/products', crudRouter(Product));
app.use('/api/industries', crudRouter(Industry, { lookup: 'slug' }));
app.use('/api/posts', crudRouter(Post, { lookup: 'slug' }));
app.use('/api/hero', crudRouter(HeroSlide));
app.use('/api/testimonials', crudRouter(Testimonial));

app.use(notFound);
app.use(errorHandler);

export default app;

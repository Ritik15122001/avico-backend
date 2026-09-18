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
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';
const allowOrigin = (origin) => {
  if (!origin) return true;                      // curl, server-to-server
  if (origins.includes(origin)) return true;     // explicit allow-list
  // in development any localhost port is fine, so dev servers can move freely
  return isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

app.use(cors({ origin: (origin, cb) => (allowOrigin(origin) ? cb(null, true) : cb(new Error('Origin not allowed'))) }));
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

const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`[api] http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  });

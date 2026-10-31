/**
 * One-off: remove the AVSD 32L model row (floor-care) and its curated card,
 * requested by owner after the broken cutout image.   node src/remove-avsd32l.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';

await connectDB(process.env.MONGODB_URI);

const cat = await Category.findOne({ slug: 'floor-care' });
if (cat) {
  const before = cat.groups.reduce((n, g) => n + g.models.length, 0);
  cat.groups = cat.groups.map((g) => ({ ...g, models: g.models.filter((m) => m.code !== 'AVSD 32L') }));
  cat.markModified('groups');
  await cat.save();
  const after = cat.groups.reduce((n, g) => n + g.models.length, 0);
  console.log(`[db] floor-care rows ${before} -> ${after}`);
}

const del = await Product.deleteMany({ code: 'AVSD 32L' });
console.log(`[db] removed ${del.deletedCount} product card(s)`);

const counts = await Category.find().sort({ order: 1 }).lean();
console.log('[db] ranges:', counts.map((c) => `${c.slug}(${c.groups.reduce((n, g) => n + g.models.length, 0)})`).join(' '));
await mongoose.disconnect();

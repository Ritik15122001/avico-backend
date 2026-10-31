/**
 * One-off: move the 5 AVAC compressors out of clean-care into a new
 * air-compressors range, and re-label their product cards.
 *   node src/move-compressors.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';

await connectDB(process.env.MONGODB_URI);

const META = {
  slug: 'air-compressors',
  name: 'Air Compressors',
  kicker: 'Workshop air supply',
  summary: 'Belt-driven electric compressors from 50 L to 500 L tanks for paint shops and industrial air tools.',
  blurb: 'Belt-driven, twin-cylinder electric compressors mounted on wheels — tanks from 50 L to 500 L sized to the air demand of spray painting, grinding, sanding and shop-floor tool lines.',
  image: '/images/products/avico/avac-200l.webp',
};

const CODES = ['AVAC', 'AVAC 90L', 'AVAC 200L', 'AVAC 300L', 'AVAC 500L'];

// 1. ensure the new range exists
let target = await Category.findOne({ slug: META.slug });
let created = false;
if (!target) {
  const all = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
  const idx = all.findIndex((c) => c.slug === 'clean-care');
  const order = idx >= 0 ? all[idx].order : 0;
  target = await Category.create({ ...META, groups: [], order });
  // re-index: everything ordered >= `order` shifts by one
  for (const c of all) {
    if (c.slug === META.slug) continue;
    await Category.updateOne({ _id: c._id }, { $set: { order: c.order >= order ? c.order + 1 : c.order } });
  }
  created = true;
  console.log(`[move] created air-compressors (order ${order})`);
}

// 2. pull the AVAC models out of clean-care
const source = await Category.findOne({ slug: 'clean-care' });
if (!source) throw new Error('clean-care not found in DB');
const srcIdx = source.groups.findIndex((g) => g.title === 'Air compressors');
if (srcIdx >= 0) {
  const group = source.groups[srcIdx];
  const moved = group.models.filter((m) => CODES.includes(m.code));
  if (moved.length !== CODES.length) {
    console.warn(`[move] expected ${CODES.length} models, found ${moved.length} — check before rerun`);
  }
  source.groups.splice(srcIdx, 1);
  source.markModified('groups');
  await source.save();
  console.log(`[move] removed 'Air compressors' group (${moved.length} models) from clean-care`);

  target.groups.push({ title: 'Belt-driven compressors', models: moved.map((m) => ({ ...m, _id: undefined })) });
  target.markModified('groups');
  await target.save();
  console.log(`[move] added 'Belt-driven compressors' (${moved.length} models) to air-compressors`);
} else {
  console.log('[move] clean-care has no \'Air compressors\' group — nothing to move');
}

// 3. relabel the curated cards
const relabelled = await Product.updateMany({ code: { $in: CODES } }, { $set: { category: 'Air Compressors' } });
console.log(`[move] relabelled ${relabelled.modifiedCount} product cards`);

const counts = await Category.find().sort({ order: 1 }).lean();
console.log('[move] ranges now:', counts.map((c) => `${c.slug}(${c.groups.reduce((n, g) => n + g.models.length, 0)})`).join(' '));
await mongoose.disconnect();

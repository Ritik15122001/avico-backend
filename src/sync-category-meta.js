/**
 * Corrects the top-level `image` and `published` fields on each live
 * Category document to match avico-app/src/data/categories.js — the
 * per-model data inside `groups` is already handled by import-avico.js.
 * Pure field UPDATE, no documents removed.
 *
 * Run: node src/sync-category-meta.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Category } from './models/Category.js';

const { categories } = await import('../../avico-app/src/data/categories.js');

await connectDB(process.env.MONGODB_URI);

let updated = 0;
for (const c of categories) {
  const doc = await Category.findOne({ slug: c.id });
  if (!doc) continue;
  doc.image = c.image;
  doc.published = c.published !== false;
  await doc.save();
  updated++;
  console.log(`[categories] ${c.id}: image=${c.image || '(none)'} published=${doc.published}`);
}
console.log(`\nupdated ${updated} category documents`);
await mongoose.disconnect();

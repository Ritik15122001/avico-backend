/**
 * Corrects the live `products` and `hero` collections to match the
 * AVICO-only data in avico-app/src/data/{products,hero}.js.
 *
 * This UPDATES existing documents in place (same _id, same count) rather
 * than deleting and recreating — it exists only because the Charnock
 * image cleanup deleted local files these two collections still pointed
 * at. No documents are removed by this script.
 *
 * Run: node src/sync-product-cards.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Product } from './models/Product.js';
import { HeroSlide } from './models/HeroSlide.js';

const SITE = '../../avico-app/src/data';
const { trendingProducts, bestsellers, topSellers, fieldGallery } = await import(`${SITE}/products.js`);
const { heroSlides } = await import(`${SITE}/hero.js`);

await connectDB(process.env.MONGODB_URI);

// ---- products: rebuild the same (code -> collections[]) shape sync() used originally ----
const merged = new Map();
const add = (list, tag) => (list || []).forEach((p) => {
  const key = p.code;
  const existing = merged.get(key);
  if (existing) existing.collections.push(tag);
  else merged.set(key, { code: p.code, name: p.name, category: p.category, image: p.image, collections: [tag] });
});
add(trendingProducts, 'trending');
add(bestsellers, 'bestseller');
add(topSellers, 'topseller');
add(fieldGallery.map((g) => ({ code: g.code, image: g.image })), 'gallery');

const desired = [...merged.values()];
const current = await Product.find().sort({ order: 1, createdAt: 1 });

let updated = 0;
const n = Math.min(desired.length, current.length);
for (let i = 0; i < n; i++) {
  const d = desired[i], doc = current[i];
  doc.code = d.code; doc.name = d.name; doc.category = d.category; doc.image = d.image; doc.collections = d.collections;
  await doc.save();
  updated++;
}
console.log(`[products] updated ${updated} of ${current.length} existing cards in place (desired set had ${desired.length})`);
if (desired.length !== current.length) {
  console.warn(`[products] count mismatch (desired ${desired.length} vs existing ${current.length}) — extras were left untouched, not deleted`);
}

// ---- hero slides: same approach ----
const currentHero = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
let heroUpdated = 0;
const hn = Math.min(heroSlides.length, currentHero.length);
for (let i = 0; i < hn; i++) {
  const s = heroSlides[i], doc = currentHero[i];
  doc.eyebrow = s.eyebrow; doc.titleLines = s.title; doc.accent = s.accent; doc.lead = s.lead;
  doc.video = s.video; doc.thumbLabel = s.thumb.label; doc.thumbCategory = s.thumb.category; doc.thumbImage = s.thumb.image;
  await doc.save();
  heroUpdated++;
}
console.log(`[hero] updated ${heroUpdated} of ${currentHero.length} existing slides in place`);

await mongoose.disconnect();

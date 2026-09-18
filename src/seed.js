/**
 * Seeds Mongo from the data files the public site already ships with, so the
 * admin starts with exactly the content that is live. Safe to re-run: it wipes
 * the content collections but never touches enquiries or subscribers.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';
import { Industry } from './models/Industry.js';
import { Post } from './models/Post.js';
import { HeroSlide } from './models/HeroSlide.js';
import { Testimonial } from './models/Testimonial.js';
import { Settings } from './models/Settings.js';

const SITE = '../../avico-app/src/data';
const load = (f) => import(`${SITE}/${f}`);

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

await connectDB(process.env.MONGODB_URI);

// ---- admin user ----
const email = (process.env.ADMIN_EMAIL || 'admin@avico.example').toLowerCase();
if (!(await User.findOne({ email }))) {
  await User.create({ email, passwordHash: await User.hash(process.env.ADMIN_PASSWORD || 'avico1234') });
  console.log('[seed] admin created:', email);
} else {
  console.log('[seed] admin already exists:', email);
}

// ---- categories ----
const { categories } = await load('categories.js');
await Category.deleteMany({});
await Category.insertMany(
  categories.map((c, i) => ({
    slug: c.id, name: c.name, kicker: c.kicker, summary: c.summary,
    blurb: c.blurb, image: c.image, groups: c.groups, order: i,
  })),
);
console.log('[seed] categories:', categories.length);

// ---- curated product cards ----
const products = await load('products.js');
await Product.deleteMany({});
const merged = new Map();
const add = (list, collection) =>
  (list || []).forEach((p, i) => {
    const key = p.code || p.id;
    const existing = merged.get(key);
    if (existing) existing.collections.push(collection);
    else merged.set(key, {
      code: key, name: p.name || key, category: p.category || '',
      image: p.image, collections: [collection], order: i,
    });
  });
add(products.trendingProducts, 'trending');
add(products.bestsellers, 'bestseller');
add(products.topSellers, 'topseller');
add(products.fieldGallery, 'gallery');
await Product.insertMany([...merged.values()]);
console.log('[seed] products:', merged.size);

// ---- industries ----
const { industries } = await load('industries.js');
await Industry.deleteMany({});
await Industry.insertMany(industries.map((x, i) => ({ ...x, order: i })));
console.log('[seed] industries:', industries.length);

// ---- posts ----
const { posts } = await load('posts.js');
await Post.deleteMany({});
await Post.insertMany(
  posts.map((p, i) => ({
    slug: p.slug || slugify(p.title), title: p.title, category: p.category, readTime: p.readTime,
    excerpt: p.excerpt, body: p.body || '', image: p.image, featured: i === 0, order: i,
  })),
);
console.log('[seed] posts:', posts.length);

// ---- hero ----
const { heroSlides } = await load('hero.js');
await HeroSlide.deleteMany({});
await HeroSlide.insertMany(
  heroSlides.map((s, i) => ({
    eyebrow: s.eyebrow, titleLines: s.title, accent: s.accent, lead: s.lead, video: s.video,
    thumbLabel: s.thumb.label, thumbCategory: s.thumb.category, thumbImage: s.thumb.image, order: i,
  })),
);
console.log('[seed] hero slides:', heroSlides.length);

// ---- testimonials + settings ----
const site = await load('site.js');
await Testimonial.deleteMany({});
await Testimonial.insertMany(site.testimonials.map((t, i) => ({ ...t, order: i })));
console.log('[seed] testimonials:', site.testimonials.length);

await Settings.findOneAndUpdate(
  { key: 'site' },
  {
    key: 'site',
    ...site.site,
    aboutParagraphs: site.aboutParagraphs,
    valueProps: site.valueProps,
    marqueeItems: site.marqueeItems,
  },
  { upsert: true, new: true },
);
console.log('[seed] settings written');

await mongoose.disconnect();
console.log('[seed] done');

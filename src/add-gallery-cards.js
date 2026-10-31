import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Product } from './models/Product.js';

const { fieldGallery } = await import('../../avico-app/src/data/products.js');
const { avicoModels } = await import('../../avico-app/src/data/avicoModels.js');
const byCode = (c) => avicoModels.find((m) => m.code === c);

await connectDB(process.env.MONGODB_URI);
const count = await Product.countDocuments();
let added = 0;
for (const [i, g] of fieldGallery.entries()) {
  const exists = await Product.findOne({ code: g.code });
  if (exists) { if (!exists.collections.includes('gallery')) { exists.collections.push('gallery'); await exists.save(); } continue; }
  const m = byCode(g.code);
  await Product.create({ code: g.code, name: m?.name || g.code, category: 'Floor Care', image: g.image, collections: ['gallery'], order: count + i });
  added++;
}
console.log(`[gallery] added ${added} new cards`);
await mongoose.disconnect();

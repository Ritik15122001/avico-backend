/**
 * Removes all non-AVICO (Charnock-origin) models from the live catalogue.
 * Keeps AVICO ("AV"-prefixed) models, enquiries and subscribers untouched.
 *
 * Run: node src/remove-charnock.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';
import { HeroSlide } from './models/HeroSlide.js';

await connectDB(process.env.MONGODB_URI);

let removedModels = 0;
let removedGroups = 0;
const categories = await Category.find();
for (const cat of categories) {
  const before = cat.groups.length;
  cat.groups = cat.groups
    .map((g) => {
      const kept = g.models.filter((m) => /^AV/i.test(m.code));
      removedModels += g.models.length - kept.length;
      return { title: g.title, models: kept };
    })
    .filter((g) => g.models.length > 0);
  removedGroups += before - cat.groups.length;

  cat.markModified('groups');
  await cat.save();
  console.log(`[categories] ${cat.slug}: ${cat.groups.reduce((n, g) => n + g.models.length, 0)} models`);
}

const prodDel = await Product.deleteMany({ code: { $not: /^AV/i } });
console.log(`[products] removed ${prodDel.deletedCount} non-AVICO cards`);

const heroDel = await HeroSlide.deleteMany({ thumbImage: { $not: /\/avico\// } });
console.log(`[hero] removed ${heroDel.deletedCount} slides pointing at non-AVICO imagery`);

console.log(`\nremoved ${removedModels} Charnock models across ${removedGroups} now-empty groups`);
await mongoose.disconnect();

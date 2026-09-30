/**
 * Adds the AVICO models (avico-app/src/data/avicoModels.js) to an existing
 * database WITHOUT wiping anything — use this on the live DB instead of
 * `npm run seed`, which would overwrite admin edits.
 *
 *   npm run import:avico            add models that are missing (by code)
 *   npm run import:avico -- --update  also overwrite existing AVICO rows
 *                                      with the data file (keeps uploaded images)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Category } from './models/Category.js';

const { avicoModels } = await import('../../avico-app/src/data/avicoModels.js');
const UPDATE = process.argv.includes('--update');

await connectDB(process.env.MONGODB_URI);

let added = 0;
let updated = 0;
const missing = new Set();
const inserted = new Map();

for (const { range, group, ...model } of avicoModels) {
  const cat = await Category.findOne({ slug: range });
  if (!cat) { missing.add(range); continue; }

  let g = cat.groups.find((x) => x.title === group);
  if (!g) {
    cat.groups.push({ title: group, models: [] });
    g = cat.groups[cat.groups.length - 1];
  }

  const idx = g.models.findIndex((m) => m.code === model.code);
  if (idx === -1) {
    const key = `${range}/${group}`;
    const at = inserted.get(key) || 0;
    g.models.splice(at, 0, model);
    inserted.set(key, at + 1);
    added++;
  } else if (UPDATE) {
    const current = g.models[idx].toObject ? g.models[idx].toObject() : g.models[idx];
    g.models.set(idx, { ...model, image: current.image || model.image });
    updated++;
  } else {
    continue;
  }
  cat.markModified('groups');
  await cat.save();
}

console.log(`[import:avico] added ${added}, updated ${updated}, of ${avicoModels.length} models`);
if (missing.size) console.warn('[import:avico] ranges not found in DB:', [...missing].join(', '));
await mongoose.disconnect();

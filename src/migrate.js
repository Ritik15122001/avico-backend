/**
 * Copies every collection from one MongoDB to another — used to move the local
 * development database up to Atlas.
 *
 *   FROM_URI=... TO_URI=... node src/migrate.js [--wipe]
 *
 * --wipe empties each target collection first. Without it, documents are
 * upserted by _id so the script is safe to re-run.
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const FROM = process.env.FROM_URI;
const TO = process.env.TO_URI;
const WIPE = process.argv.includes('--wipe');

if (!FROM || !TO) {
  console.error('Set FROM_URI and TO_URI');
  process.exit(1);
}

const mask = (u) => u.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
console.log('from :', mask(FROM));
console.log('to   :', mask(TO));
console.log(WIPE ? 'mode : wipe + copy\n' : 'mode : upsert by _id\n');

const src = new MongoClient(FROM);
const dst = new MongoClient(TO, { serverSelectionTimeoutMS: 20000 });

try {
  await src.connect();
  await dst.connect();
  const sdb = src.db();
  const ddb = dst.db();

  const names = (await sdb.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();

  let total = 0;
  for (const name of names) {
    const docs = await sdb.collection(name).find({}).toArray();
    const target = ddb.collection(name);
    if (WIPE) await target.deleteMany({});
    if (docs.length) {
      await target.bulkWrite(
        docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } })),
        { ordered: false },
      );
    }
    const after = await target.countDocuments();
    console.log(`  ${name.padEnd(14)} ${String(docs.length).padStart(4)} copied -> ${after} in target`);
    total += docs.length;
  }

  // indexes matter for the unique constraints on slug/email
  for (const name of names) {
    const idx = await sdb.collection(name).indexes();
    for (const i of idx) {
      if (i.name === '_id_') continue;
      const { key, name: n, v, ...opts } = i;
      await ddb.collection(name).createIndex(key, { name: n, ...opts }).catch(() => {});
    }
  }
  console.log(`\ncopied ${total} documents across ${names.length} collections, indexes rebuilt`);
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await src.close().catch(() => {});
  await dst.close().catch(() => {});
}

import 'dotenv/config';
import mongoose from 'mongoose';

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('no connection');
  console.log('db:', mongoose.connection.name);
  for (const name of (await db.listCollections().toArray()).map((c) => c.name).sort()) {
    console.log(name.padEnd(12), await db.collection(name).countDocuments());
  }
  await mongoose.disconnect();
} catch (e) {
  console.error('FAIL', e.message);
  process.exit(1);
}

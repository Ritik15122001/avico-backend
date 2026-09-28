import mongoose from 'mongoose';

let pending = null;

// Cached so serverless invocations (Vercel) and the local server share one
// connection instead of opening a new one per request.
export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!pending) {
    if (!uri) throw new Error('MONGODB_URI is not set');
    mongoose.set('strictQuery', true);
    pending = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then(() => {
        console.log('[db] connected:', mongoose.connection.name);
        return mongoose.connection;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

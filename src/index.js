import 'dotenv/config';
import app from './app.js';
import { connectDB } from './lib/db.js';

const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGODB_URI)
  .then((conn) => {
    if (conn.name === 'test') {
      console.warn(
        '[db] connected to "test" — MONGODB_URI has no database name. ' +
          'Append one, e.g. mongodb+srv://…mongodb.net/avico?retryWrites=true&w=majority',
      );
    }
    console.log(`[cors] allowed origins: ${origins.join(', ') || (isDev ? 'any localhost (development)' : 'NONE')}`);
    app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  });

# Avico API

Express + Mongoose. See the root README for the full picture.

```bash
npm install
npm run seed     # import content from avico-app/src/data
npm run dev      # watch mode on :4000
npm start        # production
```

## Environment (`.env`)

| Key | Purpose |
|---|---|
| `PORT` | default 4000 |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/avico` |
| `JWT_SECRET` | **change before deploying** |
| `JWT_EXPIRES` | token lifetime, default `7d` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seeded on first `npm run seed` only |
| `CORS_ORIGINS` | comma-separated allow-list for production |

## Layout

```
src/
  models/      Mongoose schemas
  routes/      auth, upload, settings, enquiries, stats
  lib/crud.js  builds a REST router for any model (list/get/create/update/delete/reorder)
  lib/db.js    connection
  middleware/  auth (JWT) + error handling
  seed.js      one-off import from the site's data files
uploads/       user-uploaded images, served at /uploads
```

Most collections need no bespoke route file — `crudRouter(Model, { lookup: 'slug' })` in
`src/index.js` covers them. Reads filter out `published: false` unless `?all=true`.

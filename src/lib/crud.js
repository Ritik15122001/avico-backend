import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Builds a REST router for a Mongoose model. Reads are public (filtered to
 * published documents unless an admin asks otherwise); writes need a token.
 *
 *   GET    /            list
 *   GET    /:id         one (by id, or by `lookup` field such as slug)
 *   POST   /            create
 *   PATCH  /:id         update
 *   DELETE /:id         remove
 *   POST   /reorder     [{ id, order }]
 */
export function crudRouter(Model, { lookup = null, sort = { order: 1, createdAt: 1 }, publicRead = true } = {}) {
  const router = express.Router();
  const byLookup = (value) =>
    /^[0-9a-fA-F]{24}$/.test(value) ? { _id: value } : lookup ? { [lookup]: value } : { _id: value };

  router.get(
    '/',
    wrap(async (req, res) => {
      const filter = {};
      if (publicRead && req.query.all !== 'true') filter.published = { $ne: false };
      const docs = await Model.find(filter).sort(sort);
      res.json(docs);
    }),
  );

  router.get(
    '/:id',
    wrap(async (req, res) => {
      const doc = await Model.findOne(byLookup(req.params.id));
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    }),
  );

  router.post(
    '/',
    requireAuth,
    wrap(async (req, res) => {
      const count = await Model.countDocuments();
      const doc = await Model.create({ order: count, ...req.body });
      res.status(201).json(doc);
    }),
  );

  router.patch(
    '/:id',
    requireAuth,
    wrap(async (req, res) => {
      const doc = await Model.findOneAndUpdate(byLookup(req.params.id), req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    }),
  );

  router.delete(
    '/:id',
    requireAuth,
    wrap(async (req, res) => {
      const doc = await Model.findOneAndDelete(byLookup(req.params.id));
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true, id: doc.id });
    }),
  );

  router.post(
    '/reorder',
    requireAuth,
    wrap(async (req, res) => {
      const items = Array.isArray(req.body) ? req.body : req.body?.items;
      if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected an array of { id, order }' });
      await Model.bulkWrite(
        items.map(({ id, order }) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })),
      );
      res.json({ ok: true, updated: items.length });
    }),
  );

  return router;
}

export { wrap };

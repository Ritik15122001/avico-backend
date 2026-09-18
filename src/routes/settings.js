import express from 'express';
import { Settings } from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../lib/crud.js';

const router = express.Router();

router.get('/', wrap(async (req, res) => res.json(await Settings.get())));

router.patch(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const { key, _id, ...patch } = req.body || {};
    const doc = await Settings.findOneAndUpdate({ key: 'site' }, patch, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    res.json(doc);
  }),
);

export default router;

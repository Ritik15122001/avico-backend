import express from 'express';
import { z } from 'zod';
import { Enquiry } from '../models/Enquiry.js';
import { Subscriber } from '../models/Subscriber.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../lib/crud.js';

const router = express.Router();

const enquirySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  company: z.string().max(160).optional().default(''),
  interest: z.string().max(80).optional().default(''),
  message: z.string().max(4000).optional().default(''),
});

// public — the contact form posts here
router.post(
  '/',
  wrap(async (req, res) => {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please check the form and try again' });
    await Enquiry.create(parsed.data);
    res.status(201).json({ ok: true });
  }),
);

router.get(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await Enquiry.find(filter).sort({ createdAt: -1 }).limit(500));
  }),
);

router.patch(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const doc = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const doc = await Enquiry.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  }),
);

export default router;

// ---- newsletter ----
export const subscriberRouter = express.Router();

subscriberRouter.post(
  '/',
  wrap(async (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (!z.string().email().safeParse(email).success) return res.status(400).json({ error: 'Enter a valid email address' });
    await Subscriber.updateOne({ email }, { $set: { email, active: true } }, { upsert: true });
    res.status(201).json({ ok: true });
  }),
);

subscriberRouter.get('/', requireAuth, wrap(async (req, res) => res.json(await Subscriber.find().sort({ createdAt: -1 }))));

subscriberRouter.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const doc = await Subscriber.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  }),
);

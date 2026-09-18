import express from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { wrap } from '../lib/crud.js';

const router = express.Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post(
  '/login',
  wrap(async (req, res) => {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password' });

    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
    // same message either way — don't reveal which accounts exist
    if (!user || !(await user.verifyPassword(parsed.data.password))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email } });
  }),
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email });
});

router.post(
  '/password',
  requireAuth,
  wrap(async (req, res) => {
    const { current, next } = req.body || {};
    if (!next || next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const user = await User.findById(req.user.id);
    if (!(await user.verifyPassword(current || ''))) return res.status(401).json({ error: 'Current password is incorrect' });
    user.passwordHash = await User.hash(next);
    await user.save();
    res.json({ ok: true });
  }),
);

export default router;

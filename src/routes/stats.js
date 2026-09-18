import express from 'express';
import { Category } from '../models/Category.js';
import { Industry } from '../models/Industry.js';
import { Post } from '../models/Post.js';
import { Product } from '../models/Product.js';
import { Enquiry } from '../models/Enquiry.js';
import { Subscriber } from '../models/Subscriber.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../lib/crud.js';

const router = express.Router();

router.get(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const [categories, industries, posts, products, enquiries, newEnquiries, subscribers] = await Promise.all([
      Category.find().select('groups'),
      Industry.countDocuments(),
      Post.countDocuments(),
      Product.countDocuments(),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Subscriber.countDocuments({ active: true }),
    ]);
    const models = categories.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.models.length, 0), 0);
    res.json({
      categories: categories.length,
      models,
      industries,
      posts,
      products,
      enquiries,
      newEnquiries,
      subscribers,
    });
  }),
);

export default router;

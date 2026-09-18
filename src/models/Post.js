import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'Guides' },
    readTime: { type: String, default: '5 min read' },
    excerpt: { type: String, default: '' },
    body: { type: String, default: '' },
    image: String,
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

postSchema.index({ order: 1 });

export const Post = mongoose.model('Post', postSchema);

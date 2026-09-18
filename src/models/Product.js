import mongoose from 'mongoose';

/** Curated cards on the home and products pages, independent of the full catalogue. */
export const COLLECTIONS = ['trending', 'bestseller', 'topseller', 'gallery'];

const productSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    image: String,
    collections: { type: [{ type: String, enum: COLLECTIONS }], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ order: 1 });

export const Product = mongoose.model('Product', productSchema);

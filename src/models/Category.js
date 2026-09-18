import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema(
  { code: { type: String, required: true, trim: true }, spec: { type: String, default: '' }, image: String },
  { _id: false },
);

const groupSchema = new mongoose.Schema(
  { title: { type: String, required: true, trim: true }, models: { type: [modelSchema], default: [] } },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    kicker: { type: String, default: '' },
    summary: { type: String, default: '' },
    blurb: { type: String, default: '' },
    image: String,
    groups: { type: [groupSchema], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// the site shows a model count per range; derive it so it can never drift
categorySchema.virtual('count').get(function () {
  return (this.groups || []).reduce((n, g) => n + (g.models?.length || 0), 0);
});

categorySchema.index({ order: 1 });

export const Category = mongoose.model('Category', categorySchema);

import mongoose from 'mongoose';

const specRowSchema = new mongoose.Schema(
  { label: { type: String, trim: true }, value: { type: String, trim: true } },
  { _id: false },
);

// A model row in a range. `code` + `spec` are all a catalogue line needs; the
// rest powers the model's detail page (/products/<range>/<model>).
const modelSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    spec: { type: String, default: '' },
    image: String,
    name: { type: String, default: '', trim: true },
    summary: { type: String, default: '' },
    specs: { type: [specRowSchema], default: [] },
    features: { type: [String], default: [] },
    newArrival: { type: Boolean, default: false },
  },
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

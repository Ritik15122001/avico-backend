import mongoose from 'mongoose';

const industrySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'Factory' },
    summary: { type: String, default: '' },
    lead: { type: String, default: '' },
    image: String,
    challenges: { type: [String], default: [] },
    equipment: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

industrySchema.index({ order: 1 });

export const Industry = mongoose.model('Industry', industrySchema);

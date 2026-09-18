import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: '' },
    titleLines: { type: [String], default: [] },
    accent: { type: String, default: '' },
    lead: { type: String, default: '' },
    video: { type: String, default: '' },
    thumbLabel: { type: String, default: '' },
    thumbCategory: { type: String, default: '' },
    thumbImage: String,
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

heroSlideSchema.index({ order: 1 });

export const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

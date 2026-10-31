import mongoose from 'mongoose';

/** Single document holding everything that is site-wide copy or config. */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    name: { type: String, default: 'AVICO' },
    tagline: { type: String, default: 'Equipment' },
    legalName: { type: String, default: '' },
    description: { type: String, default: '' },
    blurb: { type: String, default: '' },
    phone: { type: String, default: '' },
    phoneHref: { type: String, default: '' },
    phone2: { type: String, default: '' },
    phoneHref2: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: [String], default: [] },
    social: { type: [{ label: String, href: String, _id: false }], default: [] },
    aboutParagraphs: { type: [String], default: [] },
    valueProps: { type: [{ n: String, title: String, body: String, _id: false }], default: [] },
    marqueeItems: { type: [String], default: [] },
  },
  { timestamps: true },
);

settingsSchema.statics.get = async function () {
  return (await this.findOne({ key: 'site' })) || (await this.create({ key: 'site' }));
};

export const Settings = mongoose.model('Settings', settingsSchema);

const mongoose = require('mongoose');

const SUPPORTED_SECTION_TYPES = [
  'hero',
  'overview',
  'location',
  'amenities',
  'floorPlans',
  'gallery',
  'news',
  'contact',
];

// Content Sub-schemas
const HeroContentSchema = new mongoose.Schema({
  headline: { type: String, required: true, trim: true, maxlength: 250 },
  subheadline: { type: String, trim: true, default: '', maxlength: 500 },
  ctaText: { type: String, trim: true, default: 'Nhận tư vấn', maxlength: 100 },
  ctaLink: { type: String, trim: true, default: '#lien-he', maxlength: 300 },
  backgroundImage: { type: String, required: true, trim: true },
  secondaryBtnText: { type: String, trim: true, default: 'Khám phá tổng quan', maxlength: 100 },
  secondaryBtnLink: { type: String, trim: true, default: '#tong-quan', maxlength: 300 },
}, { _id: false });

const OverviewStatSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 100 },
  value: { type: String, required: true, trim: true, maxlength: 100 },
  subtext: { type: String, trim: true, default: '', maxlength: 200 },
}, { _id: false });

const OverviewContentSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  masterPlanImage: { type: String, trim: true, default: '' },
  stats: [OverviewStatSchema],
}, { _id: false });

const LocationHighlightSchema = new mongoose.Schema({
  destination: { type: String, required: true, trim: true, maxlength: 150 },
  minutes: { type: String, required: true, trim: true, maxlength: 100 },
  distanceKm: { type: String, trim: true, default: '', maxlength: 50 },
  note: { type: String, trim: true, default: '', maxlength: 200 },
}, { _id: false });

const LocationContentSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  address: { type: String, trim: true, default: '', maxlength: 300 },
  mapEmbedUrl: { type: String, trim: true, default: '', maxlength: 1000 },
  mapImageUrl: { type: String, trim: true, default: '', maxlength: 500 },
  highlights: [LocationHighlightSchema],
}, { _id: false });

const AmenityItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  imageUrl: { type: String, trim: true, default: '' },
  category: { type: String, trim: true, default: 'Tiện ích nội khu', maxlength: 100 },
}, { _id: false });

const AmenitiesContentSchema = new mongoose.Schema({
  description: { type: String, trim: true, default: '', maxlength: 1500 },
  items: [AmenityItemSchema],
}, { _id: false });

const FloorPlanItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  code: { type: String, trim: true, default: '', maxlength: 50 },
  bedrooms: { type: String, required: true, trim: true, maxlength: 50 },
  bathrooms: { type: String, required: true, trim: true, maxlength: 50 },
  area: { type: String, required: true, trim: true, maxlength: 50 },
  imageUrl: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '', maxlength: 500 },
  features: [{ type: String, trim: true, maxlength: 150 }],
}, { _id: false });

const FloorPlansContentSchema = new mongoose.Schema({
  description: { type: String, trim: true, default: '', maxlength: 1500 },
  items: [FloorPlanItemSchema],
}, { _id: false });

const GalleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  imageUrl: { type: String, required: true, trim: true },
  category: { type: String, trim: true, default: 'Kiến trúc', maxlength: 100 },
}, { _id: false });

const GalleryContentSchema = new mongoose.Schema({
  description: { type: String, trim: true, default: '', maxlength: 1500 },
  items: [GalleryItemSchema],
}, { _id: false });

const NewsContentSchema = new mongoose.Schema({
  description: { type: String, trim: true, default: '', maxlength: 1500 },
  displayCount: { type: Number, default: 6, min: 1, max: 24 },
}, { _id: false });

const ContactContentSchema = new mongoose.Schema({
  description: { type: String, trim: true, default: '', maxlength: 1500 },
  note: { type: String, trim: true, default: '', maxlength: 500 },
}, { _id: false });

// Main HomeSection Schema
const HomeSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Loại section là bắt buộc.'],
    enum: {
      values: SUPPORTED_SECTION_TYPES,
      message: 'Loại section `{VALUE}` không nằm trong danh sách hỗ trợ.',
    },
    index: true,
  },
  key: {
    type: String,
    required: [true, 'Key định danh của section là bắt buộc.'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    maxlength: 50,
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề section là bắt buộc.'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự.'],
  },
  subtitle: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Phụ đề / Badge không được vượt quá 200 ký tự.'],
  },
  enabled: {
    type: Boolean,
    default: true,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  // Typed structured content matching section type
  heroContent: HeroContentSchema,
  overviewContent: OverviewContentSchema,
  locationContent: LocationContentSchema,
  amenitiesContent: AmenitiesContentSchema,
  floorPlansContent: FloorPlansContentSchema,
  galleryContent: GalleryContentSchema,
  newsContent: NewsContentSchema,
  contactContent: ContactContentSchema,
}, {
  timestamps: true,
});

// Custom validator ensuring typed content is provided and valid for the specified type
HomeSectionSchema.pre('validate', function () {
  switch (this.type) {
    case 'hero':
      if (!this.heroContent || !this.heroContent.headline || !this.heroContent.backgroundImage) {
        this.invalidate('heroContent', 'Section Hero yêu cầu tiêu đề chính (headline) và ảnh nền (backgroundImage).');
      }
      break;
    case 'overview':
      if (!this.overviewContent || !this.overviewContent.description) {
        this.invalidate('overviewContent', 'Section Tổng quan yêu cầu nội dung mô tả (description).');
      }
      break;
    case 'location':
      if (!this.locationContent || !this.locationContent.description) {
        this.invalidate('locationContent', 'Section Vị trí yêu cầu nội dung mô tả kết nối (description).');
      }
      break;
    case 'amenities':
      if (!this.amenitiesContent) {
        this.amenitiesContent = { items: [] };
      }
      break;
    case 'floorPlans':
      if (!this.floorPlansContent) {
        this.floorPlansContent = { items: [] };
      }
      break;
    case 'gallery':
      if (!this.galleryContent) {
        this.galleryContent = { items: [] };
      }
      break;
    case 'news':
      if (!this.newsContent) {
        this.newsContent = { displayCount: 6 };
      }
      break;
    case 'contact':
      if (!this.contactContent) {
        this.contactContent = {};
      }
      break;
  }
});

// Virtual helper to access active content transparently
HomeSectionSchema.virtual('content').get(function () {
  switch (this.type) {
    case 'hero': return this.heroContent;
    case 'overview': return this.overviewContent;
    case 'location': return this.locationContent;
    case 'amenities': return this.amenitiesContent;
    case 'floorPlans': return this.floorPlansContent;
    case 'gallery': return this.galleryContent;
    case 'news': return this.newsContent;
    case 'contact': return this.contactContent;
    default: return {};
  }
});

// Static helper to query all enabled sections sorted by order
HomeSectionSchema.statics.getOrderedSections = function () {
  return this.find({ enabled: true }).sort({ order: 1, createdAt: 1 });
};

module.exports = mongoose.model('HomeSection', HomeSectionSchema);
module.exports.SUPPORTED_SECTION_TYPES = SUPPORTED_SECTION_TYPES;


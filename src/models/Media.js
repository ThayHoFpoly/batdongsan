const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Tên file lưu trữ là bắt buộc.'],
    unique: true,
    trim: true,
    index: true,
  },
  originalName: {
    type: String,
    required: [true, 'Tên file gốc là bắt buộc.'],
    trim: true,
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type của file là bắt buộc.'],
    trim: true,
  },
  size: {
    type: Number,
    required: [true, 'Dung lượng file là bắt buộc.'],
    min: 0,
  },
  url: {
    type: String,
    required: [true, 'Đường dẫn URL của file là bắt buộc.'],
    trim: true,
    index: true,
  },
  altText: {
    type: String,
    trim: true,
    default: '',
    maxlength: 250,
  },
  width: {
    type: Number,
    default: null,
  },
  height: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

// Static helper to check where a media file is currently in use across the CMS
MediaSchema.statics.findUsageLocations = async function (mediaUrl) {
  if (!mediaUrl) return [];

  const SiteSettings = mongoose.model('SiteSettings');
  const SalesContact = mongoose.model('SalesContact');
  const HomeSection = mongoose.model('HomeSection');
  const Article = mongoose.model('Article');

  const usages = [];

  // 1. Kiểm tra SiteSettings
  const settings = await SiteSettings.findOne({
    $or: [
      { logoUrl: mediaUrl },
      { faviconUrl: mediaUrl },
      { 'seo.ogImage': mediaUrl },
    ],
  }).lean();

  if (settings) {
    if (settings.logoUrl === mediaUrl) usages.push({ model: 'SiteSettings', field: 'logoUrl', label: 'Cấu hình website > Logo' });
    if (settings.faviconUrl === mediaUrl) usages.push({ model: 'SiteSettings', field: 'faviconUrl', label: 'Cấu hình website > Favicon' });
    if (settings.seo?.ogImage === mediaUrl) usages.push({ model: 'SiteSettings', field: 'seo.ogImage', label: 'Cấu hình website > Ảnh chia sẻ SEO' });
  }

  // 2. Kiểm tra SalesContact
  const contact = await SalesContact.findOne({ avatarUrl: mediaUrl }).lean();
  if (contact) {
    usages.push({ model: 'SalesContact', field: 'avatarUrl', label: `Thông tin tư vấn > Ảnh đại diện (${contact.fullName})` });
  }

  // 3. Kiểm tra HomeSection
  const sections = await HomeSection.find({
    $or: [
      { 'heroContent.backgroundImage': mediaUrl },
      { 'overviewContent.masterPlanImage': mediaUrl },
      { 'locationContent.mapImageUrl': mediaUrl },
      { 'amenitiesContent.items.imageUrl': mediaUrl },
      { 'floorPlansContent.items.imageUrl': mediaUrl },
      { 'galleryContent.items.imageUrl': mediaUrl },
    ],
  }).lean();

  sections.forEach(sec => {
    usages.push({ model: 'HomeSection', field: sec.type, label: `Trang chủ > Section [${sec.title}]` });
  });

  // 4. Kiểm tra Article (coverImage, ogImage hoặc xuất hiện trong contentHtml)
  const articles = await Article.find({
    $or: [
      { coverImage: mediaUrl },
      { ogImage: mediaUrl },
      { contentHtml: { $regex: mediaUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } },
    ],
  }).select('title slug coverImage contentHtml').lean();

  articles.forEach(art => {
    usages.push({ model: 'Article', field: 'article', label: `Bài viết > [${art.title}]` });
  });

  return usages;
};

module.exports = mongoose.model('Media', MediaSchema);


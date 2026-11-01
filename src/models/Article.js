const mongoose = require('mongoose');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');

const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'figure', 'figcaption'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedTo: ['href', 'src', 'cite'],
  transformTags: {
    'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề bài viết là bắt buộc.'],
    trim: true,
    maxlength: [250, 'Tiêu đề bài viết không được vượt quá 250 ký tự.'],
  },
  slug: {
    type: String,
    required: [true, 'Slug bài viết là bắt buộc.'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    maxlength: [280, 'Slug không được vượt quá 280 ký tự.'],
  },
  excerpt: {
    type: String,
    required: [true, 'Trích đoạn bài viết là bắt buộc.'],
    trim: true,
    maxlength: [500, 'Trích đoạn không được vượt quá 500 ký tự.'],
  },
  coverImage: {
    type: String,
    trim: true,
    default: '',
  },
  contentHtml: {
    type: String,
    required: [true, 'Nội dung bài viết là bắt buộc.'],
  },
  category: {
    type: String,
    trim: true,
    default: 'Tin tức dự án',
    maxlength: 100,
  },
  author: {
    type: String,
    trim: true,
    default: 'Ban biên tập',
    maxlength: 100,
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'],
      message: 'Trạng thái bài viết chỉ có thể là draft hoặc published.',
    },
    default: 'draft',
    index: true,
  },
  publishedAt: {
    type: Date,
    default: null,
    index: true,
  },
  // SEO tùy chọn
  seoTitle: {
    type: String,
    trim: true,
    default: '',
    maxlength: 150,
  },
  seoDescription: {
    type: String,
    trim: true,
    default: '',
    maxlength: 300,
  },
  ogImage: {
    type: String,
    trim: true,
    default: '',
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Composite Index phục vụ truy vấn bài viết công khai theo trạng thái và thời gian công bố
ArticleSchema.index({ status: 1, publishedAt: -1 });

// Sanitize HTML before saving
ArticleSchema.pre('save', function () {
  if (this.isModified('contentHtml') && this.contentHtml) {
    this.contentHtml = sanitizeHtml(this.contentHtml, sanitizeOptions);
  }

  // Tự động gán publishedAt nếu chuyển sang published mà chưa có ngày
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// Helper static: Tạo slug chuẩn tiếng Việt và xử lý trùng slug
ArticleSchema.statics.generateUniqueSlug = async function (rawText, currentArticleId = null) {
  if (!rawText) return 'bai-viet';
  
  let baseSlug = slugify(rawText, {
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true,
  });

  if (!baseSlug) baseSlug = 'bai-viet';

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug: uniqueSlug };
    if (currentArticleId) {
      query._id = { $ne: currentArticleId };
    }

    const existing = await this.findOne(query).select('_id').lean();
    if (!existing) {
      break;
    }

    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

// Static helper to query published articles (only status='published' and publishedAt <= Date.now())
ArticleSchema.statics.findPublished = function (filter = {}) {
  const now = new Date();
  return this.find({
    ...filter,
    status: 'published',
    publishedAt: { $ne: null, $lte: now },
  });
};

ArticleSchema.statics.findOnePublished = function (filter = {}) {
  const now = new Date();
  return this.findOne({
    ...filter,
    status: 'published',
    publishedAt: { $ne: null, $lte: now },
  });
};

module.exports = mongoose.model('Article', ArticleSchema);

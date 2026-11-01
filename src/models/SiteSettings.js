const mongoose = require('mongoose');

const ProjectStatSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Nhãn thông số là bắt buộc.'],
    trim: true,
    maxlength: 100,
  },
  value: {
    type: String,
    required: [true, 'Giá trị thông số là bắt buộc.'],
    trim: true,
    maxlength: 100,
  },
  subtext: {
    type: String,
    trim: true,
    default: '',
    maxlength: 200,
  },
}, { _id: false });

const FooterLinkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 100 },
  url: { type: String, required: true, trim: true, maxlength: 500 },
}, { _id: false });

const SiteSettingsSchema = new mongoose.Schema({
  // Tên website, logo, favicon
  siteName: {
    type: String,
    required: [true, 'Tên website là bắt buộc.'],
    trim: true,
    default: 'The Horizon Riverside',
    maxlength: 150,
  },
  logoUrl: {
    type: String,
    trim: true,
    default: '',
  },
  faviconUrl: {
    type: String,
    trim: true,
    default: '',
  },

  // Tên dự án, tagline, mô tả ngắn, mô tả chi tiết
  projectName: {
    type: String,
    required: [true, 'Tên dự án là bắt buộc.'],
    trim: true,
    default: 'The Horizon Riverside',
    maxlength: 200,
  },
  tagline: {
    type: String,
    trim: true,
    default: 'Không gian sống tinh tế bên dòng sông di sản (Dự Án Minh Họa)',
    maxlength: 300,
  },
  shortDescription: {
    type: String,
    trim: true,
    default: 'Khu căn hộ nghỉ dưỡng ven sông sở hữu mật độ xây dựng thấp và chuỗi tiện ích tiêu chuẩn quốc tế.',
    maxlength: 500,
  },
  fullDescription: {
    type: String,
    trim: true,
    default: 'The Horizon Riverside được kiến tạo nhằm mang lại chốn an cư thư thái, kết hợp hài hòa giữa nhịp sống đô thị hiện đại và cảnh quan thiên nhiên trong lành bên bờ sông.',
    maxlength: 3000,
  },

  // Địa chỉ, thông tin chủ đầu tư nếu có
  address: {
    type: String,
    trim: true,
    default: 'Đường Ven Sông, TP. Thủ Đức, TP. Hồ Chí Minh (Vị trí minh họa)',
    maxlength: 300,
  },
  developer: {
    type: String,
    trim: true,
    default: 'Đơn Vị Phát Triển Dự Án (Minh họa)',
    maxlength: 200,
  },

  // Danh sách thông số dự án dạng nhãn và giá trị
  projectStats: {
    type: [ProjectStatSchema],
    default: [],
  },

  // SEO mặc định: title, description, ảnh chia sẻ
  seo: {
    title: {
      type: String,
      trim: true,
      default: 'The Horizon Riverside - Căn Hộ Nghỉ Dưỡng Ven Sông',
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: 'Khám phá dự án căn hộ The Horizon Riverside với quy hoạch đồng bộ, tiện ích cao cấp và liên hệ tư vấn chuyên sâu.',
      maxlength: 300,
    },
    ogImage: {
      type: String,
      trim: true,
      default: '',
    },
  },

  // Footer và các thông tin liên quan
  footer: {
    copyrightText: {
      type: String,
      trim: true,
      default: 'Bản quyền thuộc ban quản trị dự án The Horizon Riverside.',
      maxlength: 300,
    },
    disclaimerText: {
      type: String,
      trim: true,
      default: 'Lưu ý: Tất cả hình ảnh, thông số kỹ thuật, quy mô và thông tin trên website này chỉ mang tính chất minh họa tham khảo cho giao diện phần mềm, không phải là cam kết pháp lý hay chào bán chính thức.',
      maxlength: 1500,
    },
    links: {
      type: [FooterLinkSchema],
      default: [],
    },
  },
}, {
  timestamps: true,
});

// Singleton retrieval helper
SiteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);


const mongoose = require('mongoose');

const StatSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  subtext: { type: String, default: '' },
}, { _id: false });

const LocationHighlightSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  minutes: { type: String, required: true },
  distanceKm: { type: String, default: '' },
  note: { type: String, default: '' },
}, { _id: false });

const AmenitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  category: { type: String, default: 'Tiện ích nội khu' },
}, { _id: false });

const FloorPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '' },
  bedrooms: { type: String, required: true },
  bathrooms: { type: String, required: true },
  area: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  features: [{ type: String }],
}, { _id: false });

const GalleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  category: { type: String, default: 'Phối cảnh' },
}, { _id: false });

const ProjectSettingSchema = new mongoose.Schema({
  // Thông tin thương hiệu & Dự án
  projectName: { type: String, required: true, default: 'The Horizon Riverside' },
  tagline: { type: String, default: 'Không gian sống tinh tế bên dòng sông di sản' },
  developer: { type: String, default: 'Đơn vị phát triển dự án (Minh họa)' },
  disclaimerText: {
    type: String,
    default: 'Lưu ý: Tất cả hình ảnh, thông số kỹ thuật và thông tin trên website chỉ mang tính chất minh họa, tham khảo trong giai đoạn phát triển và có thể được điều chỉnh theo phê duyệt của cơ quan có thẩm quyền.'
  },

  // Kênh liên hệ tư vấn
  hotline: { type: String, default: '0901234567' },
  zaloUrl: { type: String, default: 'https://zalo.me/0901234567' },
  messengerUrl: { type: String, default: 'https://m.me/horizonriverside.demo' },
  emailContact: { type: String, default: 'tuvan@horizonriverside.vn' },
  address: { type: String, default: 'Khu đô thị sinh thái ven sông, TP. Thủ Đức, TP. Hồ Chí Minh (Vị trí minh họa)' },
  consultantName: { type: String, default: 'Bộ Phận Quản Lý & Chăm Sóc Khách Hàng' },
  consultantRole: { type: String, default: 'Chuyên viên tư vấn cao cấp' },
  consultantPhone: { type: String, default: '0901 234 567' },
  consultantEmail: { type: String, default: 'tuvan@horizonriverside.vn' },
  consultantAvatar: { type: String, default: '' },

  // Cấu hình Bật/Tắt các Section trên Landing Page
  sectionsEnabled: {
    hero: { type: Boolean, default: true },
    overview: { type: Boolean, default: true },
    location: { type: Boolean, default: true },
    amenities: { type: Boolean, default: true },
    floorPlans: { type: Boolean, default: true },
    gallery: { type: Boolean, default: true },
    news: { type: Boolean, default: true },
    contact: { type: Boolean, default: true },
  },

  // 1. Hero Section
  hero: {
    badge: { type: String, default: 'Tuyệt tác ven sông • Dự án minh họa' },
    headline: { type: String, default: 'Nơi khởi nguồn thịnh vượng và an yên' },
    subheadline: { type: String, default: 'Tận hưởng chất sống nghỉ dưỡng biệt lập với tầm nhìn panorama rộng mở ôm trọn dải xanh ngát của dòng sông.' },
    ctaText: { type: String, default: 'Nhận tư vấn' },
    imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2075&q=80' },
  },

  // 2. Tổng quan Section
  overview: {
    badge: { type: String, default: 'Tổng quan dự án' },
    title: { type: String, default: 'Quy mô tinh tuyển cho cộng đồng tinh hoa' },
    description: {
      type: String,
      default: 'The Horizon Riverside được định hướng trở thành biểu tượng kiến trúc đương đại kết hợp hài hòa cùng thiên nhiên sinh thái. Dự án mang đến những trải nghiệm sống riêng tư, bền vững với mật độ cây xanh và mặt nước vượt trội.'
    },
    masterPlanImage: { type: String, default: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
    stats: [StatSchema],
  },

  // 3. Vị trí Section
  location: {
    badge: { type: String, default: 'Vị trí & Kết nối' },
    title: { type: String, default: 'Tọa độ đắt giá bên bờ sông thanh bình' },
    description: {
      type: String,
      default: 'Tọa lạc tại tâm điểm phát triển của khu vực ven sông, dự án sở hữu khả năng kết nối linh hoạt tới các trục giao thông huyết mạch, vừa đảm bảo nhịp sống năng động vừa lưu giữ trọn vẹn sự tĩnh tại.'
    },
    mapEmbedUrl: { type: String, default: '' },
    mapImageUrl: { type: String, default: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80' },
    highlights: [LocationHighlightSchema],
  },

  // 4. Tiện ích Section
  amenities: {
    badge: { type: String, default: 'Hệ thống tiện ích' },
    title: { type: String, default: 'Chăm chút trọn vẹn từng khoảnh khắc thường nhật' },
    description: {
      type: String,
      default: 'Chuỗi tiện ích nội khu được thiết kế khép kín theo tiêu chuẩn nghỉ dưỡng cao cấp, ưu tiên sự riêng tư và tái tạo năng lượng cho cư dân.'
    },
    items: [AmenitySchema],
  },

  // 5. Mặt bằng Section
  floorPlans: {
    badge: { type: String, default: 'Mặt bằng & Thiết kế' },
    title: { type: String, default: 'Không gian sống tối ưu ánh sáng và gió trời' },
    description: {
      type: String,
      default: 'Mỗi căn hộ đều sở hữu ban công rộng mở, mặt cắt đón gió đối lưu thông minh và nội thất bài trí tinh tế, mang lại cảm giác khoáng đạt tối đa.'
    },
    items: [FloorPlanSchema],
  },

  // 6. Thư viện ảnh Section
  gallery: {
    badge: { type: String, default: 'Thư viện hình ảnh' },
    title: { type: String, default: 'Góc nhìn chân thực về không gian sống tương lai' },
    description: { type: String, default: 'Chiêm ngưỡng các hình ảnh phối cảnh kiến trúc, cảnh quan và tiện ích của dự án (hình ảnh minh họa).' },
    items: [GalleryItemSchema],
  },

  // 7. Tin tức Section
  news: {
    badge: { type: String, default: 'Tin tức & Thị trường' },
    title: { type: String, default: 'Cập nhật thông tin dự án & góc nhìn chuyên gia' },
    description: { type: String, default: 'Theo dõi những chuyển động mới nhất về tiến trình phát triển và bài viết phân tích thị trường.' },
  },

  // 8. Liên hệ Section
  contact: {
    badge: { type: String, default: 'Liên hệ tư vấn' },
    title: { type: String, default: 'Đăng ký nhận thông tin và tư vấn chuyên sâu' },
    description: {
      type: String,
      default: 'Quý khách vui lòng để lại thông tin liên hệ. Chuyên viên tư vấn dự án sẽ liên hệ lại trong thời gian sớm nhất để cung cấp tài liệu chi tiết.'
    },
  },

  // SEO mặc định
  seo: {
    metaTitle: { type: String, default: 'The Horizon Riverside - Căn hộ nghỉ dưỡng cao cấp ven sông (Minh họa)' },
    metaDescription: { type: String, default: 'Website giới thiệu dự án bất động sản The Horizon Riverside. Khám phá tổng quan, vị trí, tiện ích, mặt bằng căn hộ và đăng ký nhận tư vấn.' },
    metaKeywords: { type: String, default: 'bất động sản, căn hộ ven sông, the horizon riverside, nhà ở cao cấp' },
    ogImage: { type: String, default: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ProjectSetting', ProjectSettingSchema);


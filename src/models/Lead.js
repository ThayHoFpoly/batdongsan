const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ và tên của Quý khách.'],
    trim: true,
    minlength: [2, 'Họ và tên phải có ít nhất 2 ký tự.'],
    maxlength: [100, 'Họ và tên không được vượt quá 100 ký tự.'],
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng cung cấp số điện thoại liên hệ.'],
    trim: true,
    match: [/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (Vui lòng nhập 10 chữ số di động).'],
    index: true,
  },
  interest: {
    type: String,
    trim: true,
    default: 'Tư vấn thông tin tổng thể',
    maxlength: [150, 'Nhu cầu quan tâm không được vượt quá 150 ký tự.'],
  },
  note: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự.'],
  },
  source: {
    type: String,
    trim: true,
    default: 'landing_page',
    maxlength: [100, 'Nguồn liên hệ không hợp lệ.'],
  },
  status: {
    type: String,
    enum: {
      values: ['new', 'contacted', 'closed'],
      message: 'Trạng thái lead chỉ có thể là new, contacted hoặc closed.',
    },
    default: 'new',
    index: true,
  },
  internalNotes: {
    type: String,
    trim: true,
    default: '',
    maxlength: [2000, 'Ghi chú nội bộ không được vượt quá 2000 ký tự.'],
  },
  // Checkbox đồng ý được liên hệ & thời điểm đồng ý
  consentGiven: {
    type: Boolean,
    required: [true, 'Quý khách vui lòng xác nhận đồng ý nhận tư vấn từ chuyên viên dự án.'],
    validate: {
      validator: function (v) {
        return v === true;
      },
      message: 'Vui lòng đánh dấu đồng ý để chuyên viên có thể liên hệ hỗ trợ.',
    },
  },
  consentAt: {
    type: Date,
    required: [true, 'Thời điểm đồng ý liên hệ là bắt buộc.'],
    default: Date.now,
  },
  ipAddress: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lead', LeadSchema);

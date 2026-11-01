const mongoose = require('mongoose');

const SalesContactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên nhân viên tư vấn.'],
    trim: true,
    maxlength: [100, 'Tên nhân viên không được vượt quá 100 ký tự.'],
  },
  avatarUrl: {
    type: String,
    trim: true,
    default: '',
  },
  title: {
    type: String,
    trim: true,
    default: 'Chuyên viên tư vấn dự án cao cấp',
    maxlength: [100, 'Chức danh không được vượt quá 100 ký tự.'],
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng cung cấp số điện thoại tư vấn.'],
    trim: true,
    match: [/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại tư vấn không đúng định dạng di động Việt Nam.'],
  },
  email: {
    type: String,
    trim: true,
    default: '',
    lowercase: true,
    validate: {
      validator: function (v) {
        if (!v || v === '') return true;
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Địa chỉ email không hợp lệ.',
    },
  },
  messengerUrl: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'URL Messenger không hợp lệ.'],
  },
  zaloUrl: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'URL Zalo không hợp lệ.'],
  },
  ctaText: {
    type: String,
    trim: true,
    default: 'Nhận tư vấn dự án',
    maxlength: [100, 'Nội dung CTA không được vượt quá 100 ký tự.'],
  },
  isEnabled: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Helper static method to get the primary active sales contact
SalesContactSchema.statics.getMainContact = async function () {
  let contact = await this.findOne({ isEnabled: true }).sort({ createdAt: 1 });
  if (!contact) {
    contact = await this.findOne().sort({ createdAt: 1 });
  }
  return contact;
};

module.exports = mongoose.model('SalesContact', SalesContactSchema);


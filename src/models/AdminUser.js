const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminUserSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: [true, 'Vui lòng nhập tên hiển thị quản trị viên.'],
    trim: true,
    maxlength: [100, 'Tên hiển thị không được vượt quá 100 ký tự.'],
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ email.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Địa chỉ email không đúng định dạng.'],
    index: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Vui lòng cung cấp mật khẩu hash.'],
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin',
    immutable: true, // Phiên bản đầu chỉ có vai trò quản trị viên duy nhất
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Compare password helper
AdminUserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to generate password hash
AdminUserSchema.statics.hashPassword = async function (plainPassword) {
  if (!plainPassword || plainPassword.length < 6) {
    throw new Error('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);


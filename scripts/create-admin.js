require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const AdminUser = require('../src/models/AdminUser');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, ...vals] = arg.slice(2).split('=');
      args[key] = vals.join('=') || true;
    }
  });
  return args;
}

function promptQuestion(rl, questionText) {
  return new Promise((resolve) => {
    rl.question(questionText, (answer) => {
      resolve(answer.trim());
    });
  });
}

const run = async () => {
  const args = parseArgs();
  let email = args.email;
  let password = args.password;
  let name = args.name;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    if (!email) {
      email = await promptQuestion(rl, 'Nhập Email quản trị viên: ');
    }
    if (!name) {
      name = await promptQuestion(rl, 'Nhập Tên hiển thị (Display Name): ');
    }
    if (!password) {
      password = await promptQuestion(rl, 'Nhập Mật khẩu quản trị (tối thiểu 6 ký tự): ');
    }
    rl.close();

    // Validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('❌ Lỗi: Địa chỉ email không hợp lệ.');
      process.exit(1);
    }

    if (!name || name.length < 2) {
      console.error('❌ Lỗi: Tên hiển thị phải có ít nhất 2 ký tự.');
      process.exit(1);
    }

    if (!password || password.length < 6) {
      console.error('❌ Lỗi: Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      process.exit(1);
    }

    const mongoUri = process.env.MONGODB_URI;
    console.log('[CLI] Đang kết nối tới cơ sở dữ liệu MongoDB...');
    await mongoose.connect(mongoUri);

    const cleanEmail = email.trim().toLowerCase();
    const existing = await AdminUser.findOne({ email: cleanEmail });

    if (existing) {
      console.log(`ℹ️ Quản trị viên với email "${cleanEmail}" đã tồn tại.`);
      console.log('Tiến hành cập nhật mật khẩu mới cho tài khoản này...');
      existing.passwordHash = await AdminUser.hashPassword(password);
      existing.displayName = name.trim();
      await existing.save();
      console.log(`✅ Cập nhật mật khẩu và thông tin quản trị viên "${cleanEmail}" thành công!`);
    } else {
      const passwordHash = await AdminUser.hashPassword(password);
      const newAdmin = await AdminUser.create({
        displayName: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'admin',
      });
      console.log(`✅ Khởi tạo tài khoản quản trị viên mới thành công:`);
      console.log(`   - ID: ${newAdmin._id}`);
      console.log(`   - Tên hiển thị: ${newAdmin.displayName}`);
      console.log(`   - Email: ${newAdmin.email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Thất bại:', err.message);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
};

run();


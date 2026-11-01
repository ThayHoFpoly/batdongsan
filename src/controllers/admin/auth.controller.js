const AdminUser = require('../../models/AdminUser');

const getLogin = (req, res) => {
  res.render('admin/login', {
    title: 'Đăng nhập Quản trị viên',
    error: req.query.error || null,
    email: req.query.email || '',
  });
};

const postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('admin/login', {
        title: 'Đăng nhập Quản trị viên',
        error: 'Vui lòng nhập đầy đủ email và mật khẩu.',
        email: email || '',
      });
    }

    const admin = await AdminUser.findOne({ email: email.trim().toLowerCase() });
    if (!admin) {
      return res.render('admin/login', {
        title: 'Đăng nhập Quản trị viên',
        error: 'Email hoặc mật khẩu không chính xác.',
        email,
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.render('admin/login', {
        title: 'Đăng nhập Quản trị viên',
        error: 'Email hoặc mật khẩu không chính xác.',
        email,
      });
    }

    // Update lastLoginAt
    admin.lastLoginAt = new Date();
    await admin.save();

    const redirectUrl = req.session.returnTo || '/admin';

    // Đổi session ID sau đăng nhập thành công để chống Session Fixation
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.adminUser = {
        _id: admin._id,
        displayName: admin.displayName,
        email: admin.email,
        role: admin.role,
      };

      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        return res.redirect(redirectUrl);
      });
    });
  } catch (error) {
    next(error);
  }
};

const postLogout = (req, res, next) => {
  // Hủy phiên làm việc và xóa cookie session
  req.session.destroy((err) => {
    if (err) {
      console.error('[Auth] Error destroying session on logout:', err);
    }
    res.clearCookie('connect.sid');
    res.clearCookie('sessionId');
    return res.redirect('/admin/login');
  });
};

const getChangePassword = (req, res) => {
  res.render('admin/change-password', {
    title: 'Đổi mật khẩu quản trị',
    activeNav: 'profile',
    successMsg: req.query.success || null,
    errorMsg: req.query.error || null,
  });
};

const postChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.session.adminUser._id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('admin/change-password', {
        title: 'Đổi mật khẩu quản trị',
        activeNav: 'profile',
        errorMsg: 'Vui lòng điền đầy đủ các trường thông tin.',
        successMsg: null,
      });
    }

    if (newPassword.length < 6) {
      return res.render('admin/change-password', {
        title: 'Đổi mật khẩu quản trị',
        activeNav: 'profile',
        errorMsg: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
        successMsg: null,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render('admin/change-password', {
        title: 'Đổi mật khẩu quản trị',
        activeNav: 'profile',
        errorMsg: 'Xác nhận mật khẩu mới không trùng khớp.',
        successMsg: null,
      });
    }

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.redirect('/admin/login');
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.render('admin/change-password', {
        title: 'Đổi mật khẩu quản trị',
        activeNav: 'profile',
        errorMsg: 'Mật khẩu hiện tại không chính xác.',
        successMsg: null,
      });
    }

    admin.passwordHash = await AdminUser.hashPassword(newPassword);
    await admin.save();

    return res.render('admin/change-password', {
      title: 'Đổi mật khẩu quản trị',
      activeNav: 'profile',
      successMsg: 'Đổi mật khẩu thành công! Mật khẩu mới đã được áp dụng.',
      errorMsg: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getChangePassword,
  postChangePassword,
};

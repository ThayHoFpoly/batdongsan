const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.adminUser) {
    res.locals.currentUser = req.session.adminUser;
    return next();
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }

  // Save return URL
  if (req.originalUrl && !req.originalUrl.includes('/login') && !req.originalUrl.includes('/logout')) {
    req.session.returnTo = req.originalUrl;
  }

  return res.redirect('/admin/login');
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminUser) {
    return res.redirect('/admin');
  }
  next();
};

module.exports = {
  requireAdminAuth,
  redirectIfAuthenticated,
};


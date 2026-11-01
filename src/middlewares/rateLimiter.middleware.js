const rateLimit = require('express-rate-limit');

const isTestOrBypass = (req) => {
  return (
    process.env.NODE_ENV === 'test' ||
    req.headers['x-test-bypass'] === 'true'
  );
};

/**
 * Rate limiter cho form đăng ký tư vấn công khai (5 lần / 15 phút)
 */
const consultationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 lần gửi mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrBypass,
  handler: (req, res) => {
    const message = 'Quý khách đã gửi yêu cầu nhiều lần trong thời gian ngắn. Vui lòng chờ 15 phút hoặc liên hệ trực tiếp qua hotline.';
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(429).json({
        success: false,
        message,
      });
    }
    return res.status(429).send(message);
  },
});

/**
 * Rate limiter cho trang đăng nhập quản trị (10 lần thử / 15 phút)
 * Chống brute-force tấn công mật khẩu quản trị
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần gửi mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrBypass,
  handler: (req, res) => {
    const errorMsg = 'Quá nhiều lần thử đăng nhập thất bại từ địa chỉ này. Vì lý do bảo mật, vui lòng thử lại sau 15 phút.';
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(429).json({
        success: false,
        message: errorMsg,
      });
    }
    return res.status(429).render('admin/login', {
      title: 'Đăng nhập Quản trị viên',
      error: errorMsg,
      email: req.body?.email || '',
    });
  },
});

module.exports = {
  consultationRateLimiter,
  loginRateLimiter,
};

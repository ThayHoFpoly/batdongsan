const crypto = require('crypto');

/**
 * Setup CSRF token in session and expose to res.locals for view templates
 */
const csrfSetup = (req, res, next) => {
  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
  }
  next();
};

/**
 * Compare user token with session token safely
 */
function isValidToken(req) {
  if (!req.session || !req.session.csrfToken) return false;

  const providedToken =
    (req.body && req.body._csrf) ||
    req.headers['x-csrf-token'] ||
    req.headers['csrf-token'] ||
    (req.query && req.query._csrf);

  if (!providedToken || typeof providedToken !== 'string') {
    return false;
  }

  const tokenBuffer = Buffer.from(providedToken);
  const sessionBuffer = Buffer.from(req.session.csrfToken);

  if (tokenBuffer.length !== sessionBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, sessionBuffer);
}

function sendCsrfError(req, res) {
  const errorMsg = 'Phiên làm việc hoặc mã bảo mật (CSRF Token) không hợp lệ hoặc đã hết hạn. Vui lòng tải lại trang và thử lại.';
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({
      success: false,
      message: errorMsg,
      code: 'EBADCSRFTOKEN',
    });
  }

  res.status(403).render('errors/500', {
    statusCode: 403,
    message: errorMsg,
    error: null,
  });
}

/**
 * Global CSRF verification middleware for state-changing requests
 */
const csrfProtect = (req, res, next) => {
  // Safe HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If this is a multipart request and neither header nor query param was passed,
  // we let multer parse the form first, then check via verifyMultipartCsrf in routes
  if (req.is('multipart/form-data') && !req.headers['x-csrf-token'] && !(req.query && req.query._csrf)) {
    return next();
  }

  if (!isValidToken(req)) {
    return sendCsrfError(req, res);
  }

  next();
};

/**
 * Route-level CSRF check run immediately after multer has parsed multipart/form-data
 */
const verifyMultipartCsrf = (req, res, next) => {
  if (!isValidToken(req)) {
    return sendCsrfError(req, res);
  }
  next();
};

module.exports = {
  csrfSetup,
  csrfProtect,
  verifyMultipartCsrf,
};


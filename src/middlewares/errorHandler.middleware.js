const notFoundHandler = (req, res, next) => {
  res.status(404);
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ error: 'Endpoint not found', statusCode: 404 });
  }

  res.render('errors/404');
};

const globalErrorHandler = (err, req, res, next) => {
  console.error(`[Error Handler]`, err);
  
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode);

  const message = process.env.NODE_ENV === 'production' 
    ? 'Đã xảy ra sự cố máy chủ nội bộ. Vui lòng thử lại sau.' 
    : err.message || 'Lỗi hệ thống';

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({
      success: false,
      message,
      error: message,
      statusCode,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  res.render('errors/500', {
    message,
    statusCode,
    error: process.env.NODE_ENV === 'production' ? null : err,
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};


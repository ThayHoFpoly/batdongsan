/**
 * NoSQL Injection Protection Middleware
 * Recursively removes keys containing '$' or '.' from req.body, req.query, and req.params
 * to prevent MongoDB query selector injection (e.g. {"$gt": ""}).
 */

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }

  return obj;
}

const mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

module.exports = mongoSanitize;


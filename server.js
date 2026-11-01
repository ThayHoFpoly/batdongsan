require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const methodOverride = require('method-override');

const connectDB = require('./src/config/db.js');
const setupSession = require('./src/config/session.js');
const routes = require('./src/routes/index.js');
const mongoSanitize = require('./src/middlewares/mongoSanitize.middleware.js');
const { csrfSetup, csrfProtect } = require('./src/middlewares/csrf.middleware.js');
const { notFoundHandler, globalErrorHandler } = require('./src/middlewares/errorHandler.middleware.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Proxy (Reverse proxy support behind Nginx, Cloudflare, etc.)
app.set('trust proxy', process.env.TRUST_PROXY ? parseInt(process.env.TRUST_PROXY, 10) : 1);

// Connect to MongoDB
connectDB();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.unsplash.com"],
        connectSrc: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Static assets with caching and nosniff protection
app.use(
  express.static(path.join(__dirname, 'src', 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true,
    setHeaders: (res, filePath) => {
      // Ensure uploaded files are strictly interpreted as static media and never executed
      if (filePath.includes('uploads')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    },
  })
);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing with safe size limits
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

// NoSQL Injection sanitizer (strips keys starting with $ or containing .)
app.use(mongoSanitize);

// Method override for REST form actions (PUT, DELETE)
app.use(methodOverride('_method'));

// Session configuration (backed by MongoDB connect-mongo)
app.use(setupSession());

// CSRF token generation and verification
app.use(csrfSetup);
app.use(csrfProtect);

// Global locals for views
app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentUser = req.session ? req.session.adminUser : null;
  res.locals.currentPath = req.path;
  res.locals.appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.locals.csrfToken = req.session ? req.session.csrfToken : '';
  next();
});

// App routes
app.use('/', routes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`[Server] Application running at http://localhost:${PORT}`);
  console.log(`[Server] Operational health check at http://localhost:${PORT}/healthz`);
  console.log(`[Server] Detailed DB status at http://localhost:${PORT}/db-status`);
});

module.exports = { app, server };
